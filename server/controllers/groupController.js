import { pool } from "../lib/db.js";
import { canManageGroup, isAdminRole } from "../lib/access.js";

const getMembers = async (groupId) => {
  const [members] = await pool.query(
    `SELECT u.id, u.name, u.email, u.avatar_url, gm.role, gm.joined_at
     FROM group_members gm
     JOIN users u ON u.id = gm.user_id
     WHERE gm.group_id = ?
     ORDER BY gm.role = 'owner' DESC, u.name`,
    [groupId]
  );
  return members;
};

// Détail d'un groupe : membres, projets partagés, invitations en cours (owner)
const getGroupDetails = async (user, groupId) => {
  const [[group]] = await pool.query(
    "SELECT id, name, description, created_by, created_at FROM user_groups WHERE id = ?",
    [groupId]
  );
  if (!group) return null;

  const [projects] = await pool.query(
    `SELECT p.id, p.title, p.description, p.created_at, u.name AS creator_name
     FROM projects p
     JOIN users u ON u.id = p.created_by
     WHERE p.group_id = ? AND p.visibility = 'group'
     ORDER BY p.created_at DESC`,
    [groupId]
  );

  const canManage = canManageGroup(user, groupId);
  let invitations = [];
  if (canManage) {
    [invitations] = await pool.query(
      `SELECT i.id, i.created_at, u.id AS user_id, u.name, u.email
       FROM group_invitations i
       JOIN users u ON u.id = i.user_id
       WHERE i.group_id = ? AND i.status = 'pending'
       ORDER BY i.created_at DESC`,
      [groupId]
    );
  }

  return {
    ...group,
    members: await getMembers(groupId),
    projects,
    invitations,
    my_role: user.group_id === groupId ? user.group_role : null,
    permissions: { canManage },
  };
};

const pendingInvitationsFor = async (userId) => {
  const [invitations] = await pool.query(
    `SELECT i.id, i.created_at, g.id AS group_id, g.name AS group_name,
            g.description AS group_description, inviter.name AS invited_by_name
     FROM group_invitations i
     JOIN user_groups g ON g.id = i.group_id
     JOIN users inviter ON inviter.id = i.invited_by
     WHERE i.user_id = ? AND i.status = 'pending'
     ORDER BY i.created_at DESC`,
    [userId]
  );
  return invitations;
};

const serverError = (res, label, error) => {
  console.error(label, error);
  res.status(500).json({ message: "Erreur serveur" });
};

// Mon groupe (ou null) + les invitations que j'ai reçues
export const getMyGroup = async (req, res) => {
  try {
    const group = req.user.group_id ? await getGroupDetails(req.user, req.user.group_id) : null;
    res.status(200).json({ group, invitations: await pendingInvitationsFor(req.user.id) });
  } catch (error) {
    serverError(res, "Erreur mon groupe:", error);
  }
};

export const countMyInvitations = async (req, res) => {
  try {
    const [[row]] = await pool.query(
      "SELECT COUNT(*) AS count FROM group_invitations WHERE user_id = ? AND status = 'pending'",
      [req.user.id]
    );
    res.status(200).json({ count: row.count });
  } catch (error) {
    serverError(res, "Erreur comptage invitations:", error);
  }
};

export const getGroup = async (req, res) => {
  const groupId = Number(req.params.id);
  if (!isAdminRole(req.user.role) && req.user.group_id !== groupId) {
    return res.status(404).json({ message: "Groupe introuvable" });
  }
  try {
    const group = await getGroupDetails(req.user, groupId);
    if (!group) {
      return res.status(404).json({ message: "Groupe introuvable" });
    }
    res.status(200).json({ group });
  } catch (error) {
    serverError(res, "Erreur détail groupe:", error);
  }
};

export const createGroup = async (req, res) => {
  const { name, description } = req.body;

  if (req.user.group_id) {
    return res.status(409).json({
      message: "Vous faites déjà partie d'un groupe : quittez-le pour en créer un",
    });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [result] = await connection.query(
      "INSERT INTO user_groups (name, description, created_by) VALUES (?, ?, ?)",
      [name.trim(), description?.trim() || null, req.user.id]
    );
    await connection.query(
      "INSERT INTO group_members (group_id, user_id, role) VALUES (?, ?, 'owner')",
      [result.insertId, req.user.id]
    );
    await connection.commit();

    const user = { ...req.user, group_id: result.insertId, group_role: "owner" };
    res.status(201).json({
      message: "Groupe créé",
      group: await getGroupDetails(user, result.insertId),
    });
  } catch (error) {
    await connection.rollback();
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ message: "Un groupe porte déjà ce nom" });
    }
    serverError(res, "Erreur création groupe:", error);
  } finally {
    connection.release();
  }
};

export const updateGroup = async (req, res) => {
  const groupId = Number(req.params.id);
  const { name, description } = req.body;

  if (!canManageGroup(req.user, groupId)) {
    return res.status(403).json({ message: "Seul un owner du groupe peut le modifier" });
  }
  try {
    const [result] = await pool.query(
      "UPDATE user_groups SET name = ?, description = ? WHERE id = ?",
      [name.trim(), description?.trim() || null, groupId]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Groupe introuvable" });
    }
    res.status(200).json({ message: "Groupe mis à jour", group: await getGroupDetails(req.user, groupId) });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ message: "Un groupe porte déjà ce nom" });
    }
    serverError(res, "Erreur mise à jour groupe:", error);
  }
};

export const deleteGroup = async (req, res) => {
  const groupId = Number(req.params.id);

  if (!canManageGroup(req.user, groupId)) {
    return res.status(403).json({ message: "Seul un owner du groupe peut le supprimer" });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    // Les projets partagés avec le groupe redeviennent privés (visibles par leur créateur)
    await connection.query(
      "UPDATE projects SET visibility = 'private', group_id = NULL WHERE group_id = ?",
      [groupId]
    );
    const [result] = await connection.query("DELETE FROM user_groups WHERE id = ?", [groupId]);
    await connection.commit();

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Groupe introuvable" });
    }
    res.status(200).json({ message: "Groupe supprimé" });
  } catch (error) {
    await connection.rollback();
    serverError(res, "Erreur suppression groupe:", error);
  } finally {
    connection.release();
  }
};

export const inviteMember = async (req, res) => {
  const groupId = Number(req.params.id);
  const email = req.body.email?.trim();

  if (!canManageGroup(req.user, groupId)) {
    return res.status(403).json({ message: "Seul un owner du groupe peut inviter" });
  }
  if (!email) {
    return res.status(400).json({ message: "L'email est requis" });
  }

  try {
    const [[invitee]] = await pool.query(
      `SELECT u.id, u.name, gm.group_id
       FROM users u
       LEFT JOIN group_members gm ON gm.user_id = u.id
       WHERE u.email = ?`,
      [email]
    );
    if (!invitee) {
      return res.status(404).json({ message: "Aucun utilisateur avec cet email" });
    }
    if (invitee.group_id === groupId) {
      return res.status(409).json({ message: `${invitee.name} fait déjà partie du groupe` });
    }

    const [[pending]] = await pool.query(
      "SELECT id FROM group_invitations WHERE group_id = ? AND user_id = ? AND status = 'pending'",
      [groupId, invitee.id]
    );
    if (pending) {
      return res.status(409).json({ message: `${invitee.name} a déjà une invitation en attente` });
    }

    const [result] = await pool.query(
      "INSERT INTO group_invitations (group_id, user_id, invited_by) VALUES (?, ?, ?)",
      [groupId, invitee.id, req.user.id]
    );
    res.status(201).json({
      message: invitee.group_id
        ? `Invitation envoyée à ${invitee.name} (déjà dans un autre groupe : il devra le quitter pour accepter)`
        : `Invitation envoyée à ${invitee.name}`,
      invitation: { id: result.insertId },
    });
  } catch (error) {
    serverError(res, "Erreur invitation:", error);
  }
};

export const cancelInvitation = async (req, res) => {
  const groupId = Number(req.params.id);

  if (!canManageGroup(req.user, groupId)) {
    return res.status(403).json({ message: "Seul un owner du groupe peut annuler une invitation" });
  }
  try {
    const [result] = await pool.query(
      `UPDATE group_invitations SET status = 'cancelled', responded_at = NOW()
       WHERE id = ? AND group_id = ? AND status = 'pending'`,
      [req.params.invitationId, groupId]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Invitation introuvable" });
    }
    res.status(200).json({ message: "Invitation annulée" });
  } catch (error) {
    serverError(res, "Erreur annulation invitation:", error);
  }
};

// Invitation en attente adressée à l'utilisateur connecté, ou undefined
const findMyPendingInvitation = async (user, invitationId) => {
  const [[invitation]] = await pool.query(
    "SELECT * FROM group_invitations WHERE id = ? AND user_id = ? AND status = 'pending'",
    [invitationId, user.id]
  );
  return invitation;
};

export const acceptInvitation = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const invitation = await findMyPendingInvitation(req.user, req.params.invitationId);
    if (!invitation) {
      return res.status(404).json({ message: "Invitation introuvable" });
    }
    if (req.user.group_id) {
      return res.status(409).json({
        message: "Vous faites déjà partie d'un groupe : quittez-le avant d'en rejoindre un autre",
      });
    }

    await connection.beginTransaction();
    await connection.query(
      "INSERT INTO group_members (group_id, user_id, role) VALUES (?, ?, 'member')",
      [invitation.group_id, req.user.id]
    );
    await connection.query(
      "UPDATE group_invitations SET status = 'accepted', responded_at = NOW() WHERE id = ?",
      [invitation.id]
    );
    await connection.commit();

    res.status(200).json({ message: "Vous avez rejoint le groupe", group_id: invitation.group_id });
  } catch (error) {
    await connection.rollback();
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ message: "Vous faites déjà partie d'un groupe" });
    }
    serverError(res, "Erreur acceptation invitation:", error);
  } finally {
    connection.release();
  }
};

export const declineInvitation = async (req, res) => {
  try {
    const invitation = await findMyPendingInvitation(req.user, req.params.invitationId);
    if (!invitation) {
      return res.status(404).json({ message: "Invitation introuvable" });
    }
    await pool.query(
      "UPDATE group_invitations SET status = 'declined', responded_at = NOW() WHERE id = ?",
      [invitation.id]
    );
    res.status(200).json({ message: "Invitation refusée" });
  } catch (error) {
    serverError(res, "Erreur refus invitation:", error);
  }
};

const countOwners = async (groupId) => {
  const [[row]] = await pool.query(
    "SELECT COUNT(*) AS count FROM group_members WHERE group_id = ? AND role = 'owner'",
    [groupId]
  );
  return row.count;
};

// Retirer un membre (owner) ou quitter le groupe (soi-même)
export const removeMember = async (req, res) => {
  const groupId = Number(req.params.id);
  const userId = Number(req.params.userId);
  const leaving = userId === req.user.id;

  if (!leaving && !canManageGroup(req.user, groupId)) {
    return res.status(403).json({ message: "Seul un owner du groupe peut retirer un membre" });
  }

  try {
    const [[member]] = await pool.query(
      "SELECT role FROM group_members WHERE group_id = ? AND user_id = ?",
      [groupId, userId]
    );
    if (!member) {
      return res.status(404).json({ message: "Ce membre ne fait pas partie du groupe" });
    }

    if (member.role === "owner" && (await countOwners(groupId)) === 1) {
      const members = await getMembers(groupId);
      return res.status(409).json({
        message: members.length === 1
          ? "Vous êtes le seul membre : supprimez le groupe plutôt que de le quitter"
          : "Le groupe doit garder au moins un owner : nommez-en un autre avant",
      });
    }

    await pool.query("DELETE FROM group_members WHERE group_id = ? AND user_id = ?", [groupId, userId]);
    res.status(200).json({ message: leaving ? "Vous avez quitté le groupe" : "Membre retiré du groupe" });
  } catch (error) {
    serverError(res, "Erreur retrait membre:", error);
  }
};

// Passer un membre owner / member
export const updateMemberRole = async (req, res) => {
  const groupId = Number(req.params.id);
  const userId = Number(req.params.userId);
  const { role } = req.body;

  if (!canManageGroup(req.user, groupId)) {
    return res.status(403).json({ message: "Seul un owner du groupe peut changer les rôles" });
  }
  if (!["owner", "member"].includes(role)) {
    return res.status(400).json({ message: "Rôle invalide (owner ou member)" });
  }

  try {
    const [[member]] = await pool.query(
      "SELECT role FROM group_members WHERE group_id = ? AND user_id = ?",
      [groupId, userId]
    );
    if (!member) {
      return res.status(404).json({ message: "Ce membre ne fait pas partie du groupe" });
    }
    if (member.role === "owner" && role === "member" && (await countOwners(groupId)) === 1) {
      return res.status(409).json({ message: "Le groupe doit garder au moins un owner" });
    }

    await pool.query(
      "UPDATE group_members SET role = ? WHERE group_id = ? AND user_id = ?",
      [role, groupId, userId]
    );
    res.status(200).json({ message: "Rôle mis à jour" });
  } catch (error) {
    serverError(res, "Erreur rôle membre:", error);
  }
};
