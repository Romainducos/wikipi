import { pool } from "../lib/db.js";

const REQUEST_SELECT = `
  SELECT r.id, r.user_id, r.motivation, r.status, r.review_comment,
         r.created_at, r.reviewed_at,
         u.name AS user_name, u.email AS user_email,
         reviewer.name AS reviewed_by_name
  FROM moderator_requests r
  JOIN users u ON u.id = r.user_id
  LEFT JOIN users reviewer ON reviewer.id = r.reviewed_by`;

// Un membre demande à devenir modérateur
export const createRequest = async (req, res) => {
  const motivation = req.body.motivation?.trim();

  if (req.user.role !== "member") {
    return res.status(400).json({ message: "Vous êtes déjà modérateur ou administrateur" });
  }
  if (!motivation || motivation.length < 10 || motivation.length > 1000) {
    return res.status(400).json({ message: "Expliquez votre motivation (10 à 1000 caractères)" });
  }

  try {
    const [[pending]] = await pool.query(
      "SELECT id FROM moderator_requests WHERE user_id = ? AND status = 'pending'",
      [req.user.id]
    );
    if (pending) {
      return res.status(409).json({ message: "Vous avez déjà une demande en attente" });
    }

    const [result] = await pool.query(
      "INSERT INTO moderator_requests (user_id, motivation) VALUES (?, ?)",
      [req.user.id, motivation]
    );
    res.status(201).json({ message: "Demande envoyée aux administrateurs", request: { id: result.insertId, status: "pending" } });
  } catch (error) {
    console.error("Erreur demande modérateur:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// Ma dernière demande (ou null)
export const getMyRequest = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `${REQUEST_SELECT} WHERE r.user_id = ? ORDER BY r.created_at DESC, r.id DESC LIMIT 1`,
      [req.user.id]
    );
    res.status(200).json({ request: rows[0] || null });
  } catch (error) {
    console.error("Erreur ma demande modérateur:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// Admin : demandes en attente
export const getPendingRequests = async (req, res) => {
  try {
    const [requests] = await pool.query(
      `${REQUEST_SELECT} WHERE r.status = 'pending' ORDER BY r.created_at ASC`
    );
    res.status(200).json({ requests });
  } catch (error) {
    console.error("Erreur demandes modérateur:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

const findPendingRequest = async (id) => {
  const [[request]] = await pool.query(
    "SELECT * FROM moderator_requests WHERE id = ? AND status = 'pending'",
    [id]
  );
  return request;
};

export const acceptRequest = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const request = await findPendingRequest(req.params.id);
    if (!request) {
      return res.status(404).json({ message: "Demande introuvable ou déjà traitée" });
    }

    await connection.beginTransaction();
    // Ne rétrograde jamais un admin
    await connection.query("UPDATE users SET role = 'modo' WHERE id = ? AND role = 'member'", [request.user_id]);
    await connection.query(
      `UPDATE moderator_requests
       SET status = 'accepted', reviewed_by = ?, reviewed_at = NOW(), review_comment = ?
       WHERE id = ?`,
      [req.user.id, req.body.comment?.trim() || null, request.id]
    );
    await connection.commit();

    res.status(200).json({ message: "Demande acceptée : l'utilisateur est maintenant modérateur" });
  } catch (error) {
    await connection.rollback();
    console.error("Erreur acceptation demande modérateur:", error);
    res.status(500).json({ message: "Erreur serveur" });
  } finally {
    connection.release();
  }
};

export const rejectRequest = async (req, res) => {
  try {
    const request = await findPendingRequest(req.params.id);
    if (!request) {
      return res.status(404).json({ message: "Demande introuvable ou déjà traitée" });
    }
    await pool.query(
      `UPDATE moderator_requests
       SET status = 'rejected', reviewed_by = ?, reviewed_at = NOW(), review_comment = ?
       WHERE id = ?`,
      [req.user.id, req.body.comment?.trim() || null, request.id]
    );
    res.status(200).json({ message: "Demande refusée" });
  } catch (error) {
    console.error("Erreur refus demande modérateur:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};
