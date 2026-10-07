import { pool } from "../lib/db.js";
import {
  visibleProjectsCondition,
  canEditDocumentation,
  canReviewProposal,
  reviewableProposalsCondition,
} from "../lib/access.js";
import { findVisibleDocumentation } from "./documentationController.js";

// Champs renvoyés pour une proposition, avec la version actuelle de la doc
// (pour afficher les changements avant / après)
const PROPOSAL_SELECT = `
  SELECT pr.id, pr.documentation_id, pr.title, pr.excerpt, pr.content, pr.message,
         pr.status, pr.review_comment, pr.created_at, pr.reviewed_at,
         pr.proposed_by, author.name AS proposed_by_name,
         reviewer.name AS reviewed_by_name,
         d.title AS current_title, d.excerpt AS current_excerpt,
         d.content AS current_content, d.updated_at AS documentation_updated_at,
         d.created_by AS documentation_created_by,
         p.id AS project_id, p.title AS project_title
  FROM documentation_proposals pr
  JOIN documentations d ON pr.documentation_id = d.id
  JOIN projects p ON d.project_id = p.id
  JOIN users author ON pr.proposed_by = author.id
  LEFT JOIN users reviewer ON pr.reviewed_by = reviewer.id`;

export const createProposal = async (req, res) => {
  const { title, excerpt, content, message } = req.body;

  try {
    const documentation = await findVisibleDocumentation(req.user, req.params.id);
    if (!documentation) {
      return res.status(404).json({ message: "Documentation non trouvée ou accès refusé" });
    }
    if (canEditDocumentation(req.user, documentation)) {
      return res.status(400).json({
        message: "Vous pouvez modifier cette documentation directement",
      });
    }

    const newExcerpt = excerpt?.trim() || null;
    const unchanged =
      title.trim() === documentation.title &&
      newExcerpt === (documentation.excerpt || null) &&
      content === documentation.content;
    if (unchanged) {
      return res.status(400).json({ message: "Aucune modification par rapport à la version actuelle" });
    }

    if (message && message.length > 500) {
      return res.status(400).json({ message: "Message trop long (max 500 caractères)" });
    }

    const [result] = await pool.query(
      `INSERT INTO documentation_proposals
       (documentation_id, proposed_by, title, excerpt, content, message)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [documentation.id, req.user.id, title.trim(), newExcerpt, content, message?.trim() || null]
    );

    res.status(201).json({
      message: "Proposition envoyée",
      proposal: { id: result.insertId, status: "pending" },
    });
  } catch (error) {
    console.error("Erreur création proposition:", error);
    res.status(500).json({ message: "Erreur lors de l'envoi de la proposition" });
  }
};

// Propositions en attente que l'utilisateur peut valider
export const getProposalsToReview = async (req, res) => {
  const reviewable = reviewableProposalsCondition(req.user);
  const visible = visibleProjectsCondition(req.user);

  try {
    const [proposals] = await pool.query(
      `${PROPOSAL_SELECT}
       WHERE pr.status = 'pending' AND ${reviewable.sql} AND ${visible.sql}
       ORDER BY pr.created_at ASC`,
      [...reviewable.params, ...visible.params]
    );
    res.status(200).json({ proposals });
  } catch (error) {
    console.error("Erreur propositions à traiter:", error);
    res.status(500).json({ message: "Erreur lors du chargement des propositions" });
  }
};

export const countProposalsToReview = async (req, res) => {
  const reviewable = reviewableProposalsCondition(req.user);
  const visible = visibleProjectsCondition(req.user);

  try {
    const [[row]] = await pool.query(
      `SELECT COUNT(*) AS count
       FROM documentation_proposals pr
       JOIN documentations d ON pr.documentation_id = d.id
       JOIN projects p ON d.project_id = p.id
       WHERE pr.status = 'pending' AND ${reviewable.sql} AND ${visible.sql}`,
      [...reviewable.params, ...visible.params]
    );
    res.status(200).json({ count: row.count });
  } catch (error) {
    console.error("Erreur comptage propositions:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

export const getMyProposals = async (req, res) => {
  try {
    const [proposals] = await pool.query(
      `${PROPOSAL_SELECT}
       WHERE pr.proposed_by = ?
       ORDER BY pr.created_at DESC`,
      [req.user.id]
    );
    res.status(200).json({ proposals });
  } catch (error) {
    console.error("Erreur mes propositions:", error);
    res.status(500).json({ message: "Erreur lors du chargement des propositions" });
  }
};

// Proposition en attente que l'utilisateur peut traiter, ou réponse d'erreur
const findReviewableProposal = async (req, res) => {
  const [rows] = await pool.query(`${PROPOSAL_SELECT} WHERE pr.id = ?`, [req.params.id]);
  const proposal = rows[0];

  const documentation = proposal && (await findVisibleDocumentation(req.user, proposal.documentation_id));
  if (!proposal || !documentation) {
    res.status(404).json({ message: "Proposition introuvable" });
    return null;
  }
  if (!canReviewProposal(req.user, documentation)) {
    res.status(403).json({ message: "Vous ne pouvez pas traiter cette proposition" });
    return null;
  }
  if (proposal.status !== "pending") {
    res.status(409).json({ message: "Cette proposition a déjà été traitée" });
    return null;
  }
  return proposal;
};

export const acceptProposal = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const proposal = await findReviewableProposal(req, res);
    if (!proposal) return;

    await connection.beginTransaction();
    // L'auteur de la proposition devient le dernier à avoir modifié la doc
    await connection.query(
      `UPDATE documentations
       SET title = ?, excerpt = ?, content = ?, last_modified_by = ?
       WHERE id = ?`,
      [proposal.title, proposal.excerpt, proposal.content, proposal.proposed_by, proposal.documentation_id]
    );
    await connection.query(
      `UPDATE documentation_proposals
       SET status = 'accepted', reviewed_by = ?, reviewed_at = NOW(), review_comment = ?
       WHERE id = ?`,
      [req.user.id, req.body.comment?.trim() || null, proposal.id]
    );
    await connection.commit();

    res.status(200).json({ message: "Proposition acceptée, la documentation est mise à jour" });
  } catch (error) {
    await connection.rollback();
    console.error("Erreur acceptation proposition:", error);
    res.status(500).json({ message: "Erreur lors de l'acceptation" });
  } finally {
    connection.release();
  }
};

export const rejectProposal = async (req, res) => {
  try {
    const proposal = await findReviewableProposal(req, res);
    if (!proposal) return;

    await pool.query(
      `UPDATE documentation_proposals
       SET status = 'rejected', reviewed_by = ?, reviewed_at = NOW(), review_comment = ?
       WHERE id = ?`,
      [req.user.id, req.body.comment?.trim() || null, proposal.id]
    );

    res.status(200).json({ message: "Proposition refusée" });
  } catch (error) {
    console.error("Erreur refus proposition:", error);
    res.status(500).json({ message: "Erreur lors du refus" });
  }
};
