import jwt from "jsonwebtoken";
import { pool } from "../lib/db.js";

export const verifyToken = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Token manquant" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_KEY);

    // Utilisateur + son groupe (un seul possible) pour les règles d'accès
    const [rows] = await pool.query(
      `SELECT u.id, u.name, u.email, u.role,
              gm.group_id, gm.role AS group_role
       FROM users u
       LEFT JOIN group_members gm ON gm.user_id = u.id
       WHERE u.id = ?`,
      [decoded.id]
    );

    if (rows.length === 0) {
      return res.status(401).json({ message: "Utilisateur non trouvé" });
    }

    // stock l'utilisateur complet dans la requête
    req.user = rows[0];
    next();
  } catch (err) {
    console.error("Erreur vérification token:", err);
    return res.status(401).json({ message: "Token invalide" });
  }
};
