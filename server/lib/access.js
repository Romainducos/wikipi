// Règles d'accès centralisées : qui voit quoi, qui peut modifier quoi.
// Toutes les requêtes et vérifications de droits passent par ici.
// `user` vient de verifyToken : id, role, group_id, group_role.

const isAdmin = (user) => user.role === "admin";
const isModerator = (user) => user.role === "modo";

// Owner du groupe auquel appartient le projet
const isGroupOwnerOf = (user, projectGroupId) =>
  user.group_role === "owner" &&
  projectGroupId != null &&
  projectGroupId === user.group_id;

// Condition SQL des projets visibles par l'utilisateur :
// publics, créés par lui, ou partagés avec son groupe.
// `alias` = alias de la table projects dans la requête.
export const visibleProjectsCondition = (user, alias = "p") => {
  if (isAdmin(user)) {
    return { sql: "1 = 1", params: [] };
  }
  return {
    sql: `(${alias}.visibility = 'public'
          OR ${alias}.created_by = ?
          OR (${alias}.visibility = 'group' AND ${alias}.group_id = ?))`,
    params: [user.id, user.group_id ?? null],
  };
};

// Modifier / supprimer un projet : créateur, owner du groupe du projet, admin
export const canManageProject = (user, project) =>
  isAdmin(user) ||
  project.created_by === user.id ||
  isGroupOwnerOf(user, project.group_id);

// Modifier directement une documentation : auteur, modo, admin, owner du
// groupe du projet. `documentation.project_group_id` = groupe du projet.
export const canEditDocumentation = (user, documentation) =>
  isAdmin(user) ||
  isModerator(user) ||
  documentation.created_by === user.id ||
  isGroupOwnerOf(user, documentation.project_group_id);

// Supprimer une documentation : ceux qui peuvent la modifier + qui gère le projet
export const canDeleteDocumentation = (user, documentation, project) =>
  canEditDocumentation(user, documentation) || canManageProject(user, project);

// Valider / refuser une proposition : ceux qui peuvent modifier la doc
export const canReviewProposal = (user, documentation) =>
  canEditDocumentation(user, documentation);

// Condition SQL des propositions que l'utilisateur peut traiter.
// `docAlias` / `projectAlias` = alias des tables documentations / projects.
export const reviewableProposalsCondition = (user, docAlias = "d", projectAlias = "p") => {
  if (isAdmin(user) || isModerator(user)) {
    return { sql: "1 = 1", params: [] };
  }
  if (user.group_role === "owner") {
    return {
      sql: `(${docAlias}.created_by = ? OR ${projectAlias}.group_id = ?)`,
      params: [user.id, user.group_id],
    };
  }
  return { sql: `${docAlias}.created_by = ?`, params: [user.id] };
};

// Gérer un groupe (modifier, inviter, retirer des membres) : owner ou admin
export const canManageGroup = (user, groupId) =>
  isAdmin(user) || (user.group_role === "owner" && user.group_id === groupId);
