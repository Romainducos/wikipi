import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "node:crypto";
import { pool } from "../lib/db.js";
import { sendMail } from "../lib/mailer.js";

const RESET_TOKEN_TTL_MINUTES = 60;
const hashToken = (token) => crypto.createHash("sha256").update(token).digest("hex");

export const register = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const [existingUsers] = await pool.query(
      "SELECT id FROM users WHERE email = ?",
      [email]
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({
        message: "Un utilisateur avec cet email existe déjà",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await pool.query(
      "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, 'member')",
      [name, email, hashedPassword]
    );

    res.status(201).json({
      message: "Utilisateur créé avec succès",
    });
  } catch (error) {
    console.error("Erreur inscription:", error);
    res.status(500).json({
      message: "Erreur lors de l'inscription",
    });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const [existingUsers] = await pool.query(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );
    // Même réponse si l'email est inconnu ou le mot de passe faux
    const isMatch =
      existingUsers.length > 0 &&
      (await bcrypt.compare(password, existingUsers[0].password));
    if (!isMatch) {
      return res
        .status(401)
        .json({ message: "Email ou mot de passe incorrect" });
    }
    const token = jwt.sign({ id: existingUsers[0].id }, process.env.JWT_KEY, {
      expiresIn: process.env.JWT_EXPIRES_IN,
    });

    res.status(200).json({ token: token });
  } catch (err) {
    res.status(500).json({
      message: "Erreur lors du login",
    });
  }
};

export const getHome = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT u.id, u.name, u.email, u.role, u.avatar_url, u.created_at,
              gm.group_id, gm.role AS group_role, g.name AS group_name
       FROM users u
       LEFT JOIN group_members gm ON gm.user_id = u.id
       LEFT JOIN user_groups g ON g.id = gm.group_id
       WHERE u.id = ?`,
      [req.user.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: "user do not exist" });
    }
    return res.status(200).json({ user: rows[0] });
  } catch (err) {
    return res.status(500).json({ message: "server error" });
  }
};

// « Mot de passe oublié » : la réponse est toujours la même, que l'email
// existe ou non, pour ne pas révéler quels comptes existent
export const forgotPassword = async (req, res) => {
  const email = req.body.email?.trim();
  const genericResponse = {
    message: "Si un compte existe avec cet email, un lien de réinitialisation vient d'être envoyé",
  };

  if (!email) {
    return res.status(400).json({ message: "L'email est requis" });
  }

  try {
    const [[user]] = await pool.query("SELECT id, name, email FROM users WHERE email = ?", [email]);
    if (!user) {
      return res.status(200).json(genericResponse);
    }

    // Un seul lien valide à la fois : les anciens sont invalidés
    await pool.query(
      "UPDATE password_resets SET used_at = NOW() WHERE user_id = ? AND used_at IS NULL",
      [user.id]
    );

    const token = crypto.randomBytes(32).toString("hex");
    await pool.query(
      `INSERT INTO password_resets (user_id, token_hash, expires_at)
       VALUES (?, ?, DATE_ADD(NOW(), INTERVAL ? MINUTE))`,
      [user.id, hashToken(token), RESET_TOKEN_TTL_MINUTES]
    );

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const link = `${frontendUrl}/reset-password?token=${token}`;
    await sendMail({
      to: user.email,
      subject: "WikiPi : réinitialisation de votre mot de passe",
      text: `Bonjour ${user.name},\n\nPour choisir un nouveau mot de passe, ouvrez ce lien (valable ${RESET_TOKEN_TTL_MINUTES} minutes) :\n${link}\n\nSi vous n'êtes pas à l'origine de cette demande, ignorez cet email.`,
    });

    res.status(200).json(genericResponse);
  } catch (error) {
    console.error("Erreur mot de passe oublié:", error);
    res.status(500).json({ message: "Erreur lors de l'envoi de l'email" });
  }
};

export const resetPassword = async (req, res) => {
  const { token, password } = req.body;

  if (!token || !password || password.length < 8) {
    return res.status(400).json({
      message: "Le nouveau mot de passe doit faire au moins 8 caractères",
    });
  }

  try {
    const [[reset]] = await pool.query(
      `SELECT id, user_id FROM password_resets
       WHERE token_hash = ? AND used_at IS NULL AND expires_at > NOW()`,
      [hashToken(token)]
    );
    if (!reset) {
      return res.status(400).json({
        message: "Ce lien est invalide ou a expiré : refaites une demande",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await pool.query("UPDATE users SET password = ? WHERE id = ?", [hashedPassword, reset.user_id]);
    await pool.query("UPDATE password_resets SET used_at = NOW() WHERE id = ?", [reset.id]);

    res.status(200).json({ message: "Mot de passe modifié : vous pouvez vous connecter" });
  } catch (error) {
    console.error("Erreur réinitialisation mot de passe:", error);
    res.status(500).json({ message: "Erreur lors de la réinitialisation" });
  }
};
