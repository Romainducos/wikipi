// Règles d'accès centralisées : qui voit quoi, qui peut modifier quoi.
// Toutes les requêtes et vérifications de droits passent par ici.

const isAdmin = (user) => user.role === "admin";
const isModerator = (user) => user.role === "modo";

// Condition SQL des projets visibles par l'utilisateur.
// `alias` = alias de la table projects dans la requête.
export const visibleProjectsCondition = (user, alias = "p") => {
  if (isAdmin(user)) {
    return { sql: "1 = 1", params: [] };
  }
  return {
    sql: `(${alias}.is_public = 1 OR ${alias}.created_by = ?)`,
    params: [user.id],
  };
};

// Modifier / supprimer un projet
export const canManageProject = (user, project) =>
  isAdmin(user) || project.created_by === user.id;

// Modifier directement une documentation
export const canEditDocumentation = (user, documentation) =>
  isAdmin(user) || isModerator(user) || documentation.created_by === user.id;

// Supprimer une documentation : ceux qui peuvent la modifier + le créateur du projet
export const canDeleteDocumentation = (user, documentation, project) =>
  canEditDocumentation(user, documentation) || canManageProject(user, project);

// Valider / refuser une proposition : ceux qui peuvent modifier la doc
export const canReviewProposal = (user, documentation) =>
  canEditDocumentation(user, documentation);

// Condition SQL des propositions que l'utilisateur peut traiter.
// `docAlias` = alias de la table documentations dans la requête.
export const reviewableProposalsCondition = (user, docAlias = "d") => {
  if (isAdmin(user) || isModerator(user)) {
    return { sql: "1 = 1", params: [] };
  }
  return { sql: `${docAlias}.created_by = ?`, params: [user.id] };
};
