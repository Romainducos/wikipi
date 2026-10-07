import { pool } from "../lib/db.js";
import {
  visibleProjectsCondition,
  canEditDocumentation,
  canDeleteDocumentation,
} from "../lib/access.js";

// Projet visible par l'utilisateur, ou undefined
const findVisibleProject = async (user, projectId) => {
  const visible = visibleProjectsCondition(user);
  const [rows] = await pool.query(
    `SELECT p.id, p.created_by, p.visibility, p.group_id FROM projects p WHERE p.id = ? AND ${visible.sql}`,
    [projectId, ...visible.params]
  );
  return rows[0];
};

// Documentation visible par l'utilisateur (via son projet), ou undefined
export const findVisibleDocumentation = async (user, docId) => {
  const visible = visibleProjectsCondition(user);
  const [rows] = await pool.query(
    `SELECT d.*,
            p.title as project_title,
            p.description as project_description,
            p.created_by as project_created_by,
            p.group_id as project_group_id,
            u.name as author_name,
            u.avatar_url as author_avatar
     FROM documentations d
     JOIN projects p ON d.project_id = p.id
     JOIN users u ON d.created_by = u.id
     WHERE d.id = ? AND ${visible.sql}`,
    [docId, ...visible.params]
  );
  return rows[0];
};

const withPermissions = (user, documentation) => {
  const project = { created_by: documentation.project_created_by, group_id: documentation.project_group_id };
  return {
    ...documentation,
    permissions: {
      canEdit: canEditDocumentation(user, documentation),
      canDelete: canDeleteDocumentation(user, documentation, project),
    },
  };
};

export const getDocumentationsByProject = async (req, res) => {
  try {
    const project = await findVisibleProject(req.user, req.params.projectId);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Projet non trouvé ou accès refusé",
      });
    }

    const [documentations] = await pool.query(
      `SELECT d.id, d.title, d.excerpt, d.content, d.created_at, d.updated_at,
              u.name as author_name, u.email as author_email
       FROM documentations d
       JOIN users u ON d.created_by = u.id
       WHERE d.project_id = ?
       ORDER BY d.created_at DESC`,
      [project.id]
    );

    res.status(200).json({
      success: true,
      count: documentations.length,
      documentations: documentations,
    });
  } catch (error) {
    console.error("Erreur récupération documentations:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des documentations",
    });
  }
};

export const createDocumentation = async (req, res) => {
  const userId = req.user.id;
  const { title, excerpt, content } = req.body;

  try {
    // Tout utilisateur qui voit le projet peut y ajouter une documentation
    const project = await findVisibleProject(req.user, req.params.projectId);

    if (!project) {
      return res.status(404).json({
        success: false,
        error: "Projet non trouvé ou accès refusé",
      });
    }

    const [result] = await pool.query(
      `INSERT INTO documentations
       (title, excerpt, content, project_id, created_by, last_modified_by)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [title, excerpt || null, content, project.id, userId, userId]
    );

    const newDoc = await findVisibleDocumentation(req.user, result.insertId);

    res.status(201).json({
      success: true,
      message: "Documentation créée avec succès",
      documentation: withPermissions(req.user, newDoc),
    });
  } catch (error) {
    if (error.code === "ER_BAD_NULL_ERROR") {
      return res.status(400).json({
        success: false,
        error: "Un champ requis est manquant",
      });
    }

    console.error("Erreur création documentation:", error);
    res.status(500).json({
      success: false,
      error: "Erreur serveur lors de la création",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

export const getAllDocumentations = async (req, res) => {
  const visible = visibleProjectsCondition(req.user);

  try {
    const [documentations] = await pool.query(
      `SELECT
        d.id,
        d.title,
        d.excerpt,
        d.content,
        d.created_at,
        d.updated_at,
        p.id as project_id,
        p.title as project_title,
        p.description as project_description,
        u.id as author_id,
        u.name as author_name,
        u.email as author_email,
        u.avatar_url as author_avatar
      FROM documentations d
      JOIN projects p ON d.project_id = p.id
      JOIN users u ON d.created_by = u.id
      WHERE ${visible.sql}
      ORDER BY d.created_at DESC
      LIMIT 20`,
      visible.params
    );

    res.status(200).json({
      success: true,
      count: documentations.length,
      documentations: documentations,
    });
  } catch (error) {
    console.error("Erreur récupération documentations:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des documentations",
    });
  }
};

export const getDocumentationById = async (req, res) => {
  try {
    const documentation = await findVisibleDocumentation(req.user, req.params.id);

    if (!documentation) {
      return res.status(404).json({
        success: false,
        message: "Documentation non trouvée ou accès refusé",
      });
    }

    res.status(200).json({
      success: true,
      documentation: withPermissions(req.user, documentation),
    });
  } catch (error) {
    console.error("Erreur récupération documentation:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération de la documentation",
    });
  }
};

export const deleteDocumentation = async (req, res) => {
  try {
    const documentation = await findVisibleDocumentation(req.user, req.params.id);
    if (!documentation) {
      return res.status(404).json({ message: "Documentation non trouvée ou accès refusé" });
    }

    const project = { created_by: documentation.project_created_by, group_id: documentation.project_group_id };
    if (!canDeleteDocumentation(req.user, documentation, project)) {
      return res.status(403).json({ message: "Vous ne pouvez pas supprimer cette documentation" });
    }

    await pool.query("DELETE FROM documentations WHERE id = ?", [documentation.id]);
    res.status(200).json({ message: "Documentation supprimée" });
  } catch (error) {
    console.error("Erreur suppression documentation:", error);
    res.status(500).json({ message: "Erreur lors de la suppression de la documentation" });
  }
};

export const updateDocumentation = async (req, res) => {
  const { title, excerpt, content } = req.body;

  try {
    const documentation = await findVisibleDocumentation(req.user, req.params.id);
    if (!documentation) {
      return res.status(404).json({ message: "Documentation non trouvée ou accès refusé" });
    }
    if (!canEditDocumentation(req.user, documentation)) {
      return res.status(403).json({
        message: "Vous ne pouvez pas modifier cette documentation directement : proposez une modification",
      });
    }

    await pool.query(
      `UPDATE documentations
       SET title = ?, excerpt = ?, content = ?, last_modified_by = ?
       WHERE id = ?`,
      [title.trim(), excerpt?.trim() || null, content, req.user.id, documentation.id]
    );

    const updated = await findVisibleDocumentation(req.user, documentation.id);
    res.status(200).json({
      message: "Documentation mise à jour",
      documentation: withPermissions(req.user, updated),
    });
  } catch (error) {
    console.error("Erreur mise à jour documentation:", error);
    res.status(500).json({ message: "Erreur lors de la mise à jour de la documentation" });
  }
};
