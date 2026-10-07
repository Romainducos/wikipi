import { pool } from "../lib/db.js";
import { visibleProjectsCondition, canManageProject } from "../lib/access.js";

// Projet visible par l'utilisateur, ou undefined
const findVisibleProject = async (user, projectId) => {
  const visible = visibleProjectsCondition(user);
  const [rows] = await pool.query(
    `SELECT p.*, u.name as creator_name
     FROM projects p
     JOIN users u ON p.created_by = u.id
     WHERE p.id = ? AND ${visible.sql}`,
    [projectId, ...visible.params]
  );
  return rows[0];
};

const withPermissions = (user, project) => ({
  ...project,
  permissions: { canManage: canManageProject(user, project) },
});

const handleWriteError = (error, res, defaultMessage) => {
  if (error.code === "ER_DUP_ENTRY") {
    return res.status(409).json({
      success: false,
      message: "Un projet avec ce titre existe déjà",
    });
  }

  if (error.code === "ER_DATA_TOO_LONG") {
    return res.status(400).json({
      success: false,
      message: "Le titre est trop long (max 255 caractères)",
    });
  }

  res.status(500).json({
    success: false,
    message: defaultMessage,
    ...(process.env.NODE_ENV === "development" && { error: error.message }),
  });
};

export const createProject = async (req, res) => {
  const { title, description, is_public } = req.body;

  try {
    const [result] = await pool.query(
      `INSERT INTO projects (title, description, created_by, is_public) VALUES (?, ?, ?, ?)`,
      [title.trim(), description ? description.trim() : null, req.user.id, is_public ? 1 : 0]
    );

    const project = await findVisibleProject(req.user, result.insertId);
    res.status(201).json({
      message: "Projet créé avec succès",
      project: withPermissions(req.user, project),
    });
  } catch (error) {
    console.error("Erreur création projet:", error);
    handleWriteError(error, res, "Erreur lors de la création du projet");
  }
};

export const getProjects = async (req, res) => {
  const visible = visibleProjectsCondition(req.user);

  try {
    const [projects] = await pool.query(
      `SELECT p.id, p.title, p.description, p.created_by, p.is_public, p.created_at
      FROM projects p
      WHERE ${visible.sql}
      ORDER BY p.created_at DESC`,
      visible.params
    );

    res.status(200).json({ projects });
  } catch (error) {
    console.error("Erreur récupération projets:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des projets",
      ...(process.env.NODE_ENV === "development" && { error: error.message }),
    });
  }
};

export const getProjectById = async (req, res) => {
  try {
    const project = await findVisibleProject(req.user, req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Projet non trouvé ou accès refusé",
      });
    }

    res.status(200).json({
      success: true,
      project: withPermissions(req.user, project),
    });
  } catch (error) {
    console.error("Erreur récupération projet:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération du projet",
    });
  }
};

export const updateProject = async (req, res) => {
  const { title, description, is_public } = req.body;

  try {
    const project = await findVisibleProject(req.user, req.params.id);
    if (!project) {
      return res.status(404).json({ message: "Projet non trouvé ou accès refusé" });
    }
    if (!canManageProject(req.user, project)) {
      return res.status(403).json({ message: "Seul le créateur du projet peut le modifier" });
    }

    await pool.query(
      "UPDATE projects SET title = ?, description = ?, is_public = ? WHERE id = ?",
      [title.trim(), description ? description.trim() : null, is_public ? 1 : 0, project.id]
    );

    const updated = await findVisibleProject(req.user, project.id);
    res.status(200).json({
      message: "Projet mis à jour",
      project: withPermissions(req.user, updated),
    });
  } catch (error) {
    console.error("Erreur mise à jour projet:", error);
    handleWriteError(error, res, "Erreur lors de la mise à jour du projet");
  }
};

export const deleteProject = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const project = await findVisibleProject(req.user, req.params.id);
    if (!project) {
      return res.status(404).json({ message: "Projet non trouvé ou accès refusé" });
    }
    if (!canManageProject(req.user, project)) {
      return res.status(403).json({ message: "Seul le créateur du projet peut le supprimer" });
    }

    // Les documentations du projet sont supprimées avec lui
    await connection.beginTransaction();
    await connection.query("DELETE FROM documentations WHERE project_id = ?", [project.id]);
    await connection.query("DELETE FROM projects WHERE id = ?", [project.id]);
    await connection.commit();

    res.status(200).json({ message: "Projet supprimé" });
  } catch (error) {
    await connection.rollback();
    console.error("Erreur suppression projet:", error);
    res.status(500).json({ message: "Erreur lors de la suppression du projet" });
  } finally {
    connection.release();
  }
};
