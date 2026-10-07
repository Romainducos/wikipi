import { pool } from "../lib/db.js";
import { visibleProjectsCondition } from "../lib/access.js";

// Filtres de l'activité : toutes les docs, les nouvelles, ou celles modifiées
// après leur création (updated_at est mis à jour à chaque modification)
const ACTIVITY_FILTERS = {
  all: { where: "1 = 1", orderBy: "d.updated_at" },
  created: { where: "1 = 1", orderBy: "d.created_at" },
  updated: { where: "d.updated_at > d.created_at", orderBy: "d.updated_at" },
};

// Modos et admins : 50 dernières documentations qu'ils peuvent voir.
// Les admins voient tout ; les projets privés des autres restent privés
// pour les modos (sinon ils verraient des docs qu'ils ne peuvent pas ouvrir).
export const getActivity = async (req, res) => {
  const filter = ACTIVITY_FILTERS[req.query.type || "all"];
  if (!filter) {
    return res.status(400).json({ message: "Filtre invalide (all, created ou updated)" });
  }
  const visible = visibleProjectsCondition(req.user);

  try {
    const [documentations] = await pool.query(
      `SELECT d.id, d.title, d.excerpt, d.created_at, d.updated_at,
              d.updated_at > d.created_at AS was_updated,
              p.id AS project_id, p.title AS project_title, p.visibility AS project_visibility,
              g.name AS group_name,
              author.name AS author_name,
              editor.name AS last_modified_by_name
       FROM documentations d
       JOIN projects p ON p.id = d.project_id
       LEFT JOIN user_groups g ON g.id = p.group_id
       JOIN users author ON author.id = d.created_by
       LEFT JOIN users editor ON editor.id = d.last_modified_by
       WHERE ${filter.where} AND ${visible.sql}
       ORDER BY ${filter.orderBy} DESC, d.id DESC
       LIMIT 50`,
      visible.params
    );
    res.status(200).json({ documentations });
  } catch (error) {
    console.error("Erreur activité modération:", error);
    res.status(500).json({ message: "Erreur lors du chargement de l'activité" });
  }
};
