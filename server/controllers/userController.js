import bcrypt from "bcrypt";
import { pool } from "../lib/db.js";
import { removeUpload } from "../lib/uploads.js";

const PROFILE_FIELDS = "id, name, email, role, avatar_url, created_at";

// Qui peut changer quel rôle :
// - super admin : tout le monde sauf lui-même, vers admin / modo / membre
// - admin : seulement modo <-> membre (jamais un admin ni le super admin)
const canChangeRole = (actorRole, targetRole, newRole) => {
  if (targetRole === "superadmin") return false;
  if (actorRole === "superadmin") return true;
  if (actorRole === "admin") {
    return ["modo", "member"].includes(targetRole) && ["modo", "member"].includes(newRole);
  }
  return false;
};

const getProfile = async (userId) => {
  const [rows] = await pool.query(
    `SELECT ${PROFILE_FIELDS} FROM users WHERE id = ?`,
    [userId]
  );
  return rows[0];
};

export const getMe = async (req, res) => {
  try {
    res.status(200).json({ user: await getProfile(req.user.id) });
  } catch (error) {
    console.error("Erreur récupération profil:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

export const updateMe = async (req, res) => {
  const { name, email } = req.body;

  try {
    const [existing] = await pool.query(
      "SELECT id FROM users WHERE email = ? AND id <> ?",
      [email, req.user.id]
    );
    if (existing.length > 0) {
      return res.status(409).json({ message: "Cet email est déjà utilisé" });
    }

    await pool.query("UPDATE users SET name = ?, email = ? WHERE id = ?", [
      name,
      email,
      req.user.id,
    ]);

    res.status(200).json({
      message: "Profil mis à jour",
      user: await getProfile(req.user.id),
    });
  } catch (error) {
    console.error("Erreur mise à jour profil:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

export const updatePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  try {
    const [rows] = await pool.query("SELECT password FROM users WHERE id = ?", [
      req.user.id,
    ]);
    const isMatch = await bcrypt.compare(currentPassword, rows[0].password);
    if (!isMatch) {
      return res
        .status(400)
        .json({ message: "Le mot de passe actuel est incorrect" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await pool.query("UPDATE users SET password = ? WHERE id = ?", [
      hashedPassword,
      req.user.id,
    ]);

    res.status(200).json({ message: "Mot de passe modifié" });
  } catch (error) {
    console.error("Erreur changement mot de passe:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

export const updateAvatar = async (req, res) => {
  const avatarUrl = `/uploads/avatars/${req.file.filename}`;

  try {
    const previous = await getProfile(req.user.id);
    await pool.query("UPDATE users SET avatar_url = ? WHERE id = ?", [
      avatarUrl,
      req.user.id,
    ]);
    await removeUpload(previous.avatar_url);

    res.status(200).json({
      message: "Photo de profil mise à jour",
      user: await getProfile(req.user.id),
    });
  } catch (error) {
    console.error("Erreur mise à jour avatar:", error);
    await removeUpload(avatarUrl);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

export const deleteAvatar = async (req, res) => {
  try {
    const previous = await getProfile(req.user.id);
    await pool.query("UPDATE users SET avatar_url = NULL WHERE id = ?", [
      req.user.id,
    ]);
    await removeUpload(previous.avatar_url);

    res.status(200).json({
      message: "Photo de profil supprimée",
      user: await getProfile(req.user.id),
    });
  } catch (error) {
    console.error("Erreur suppression avatar:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// fonction pour les admin uniquement
export const getAllUsers = async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, name, email, role, avatar_url, created_at FROM users ORDER BY created_at DESC"
    );

    res.status(200).json(rows);
  } catch (error) {
    console.error("Erreur récupération utilisateurs:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

export const updateUserRole = async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  if (Number(id) === req.user.id) {
    return res.status(400).json({ message: "Vous ne pouvez pas changer votre propre rôle" });
  }

  // « superadmin » ne s'attribue jamais via l'API (script serveur uniquement)
  const validRoles = ["admin", "modo", "member"];
  if (!validRoles.includes(role)) {
    return res.status(400).json({ message: "Rôle invalide" });
  }

  try {
    const [rows] = await pool.query("SELECT id, role FROM users WHERE id = ?", [id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    if (!canChangeRole(req.user.role, rows[0].role, role)) {
      return res.status(403).json({
        message: "Seul le super admin peut gérer les administrateurs",
      });
    }

    await pool.query("UPDATE users SET role = ? WHERE id = ?", [role, id]);

    res.status(200).json({
      message: "Rôle mis à jour avec succès",
      user: { id, role },
    });
  } catch (error) {
    console.error("Erreur mise à jour rôle:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

export const getAdminStats = async (req, res) => {
  try {
    const [userCount] = await pool.query("SELECT COUNT(*) as count FROM users");
    const [projectCount] = await pool.query(
      "SELECT COUNT(*) as count FROM projects"
    );
    const [docCount] = await pool.query(
      "SELECT COUNT(*) as count FROM documentations"
    );

    const [recentUsers] = await pool.query(
      "SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC LIMIT 5"
    );

    const [roleDistribution] = await pool.query(
      "SELECT role, COUNT(*) as count FROM users GROUP BY role"
    );

    res.status(200).json({
      stats: {
        users: userCount[0].count,
        projects: projectCount[0].count,
        documents: docCount[0].count,
      },
      recentUsers,
      roleDistribution,
    });
  } catch (error) {
    console.error("Erreur stats admin:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};
