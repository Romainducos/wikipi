// Rôles et droits côté interface (les mêmes règles sont vérifiées par le serveur)
export const ROLE_LABELS = {
  superadmin: "Super admin",
  admin: "Admin",
  modo: "Modérateur",
  member: "Membre",
}

// Le super admin a tous les droits d'un admin
export const isAdminRole = (role) => role === "admin" || role === "superadmin"

export const isModeratorOrAdminRole = (role) => isAdminRole(role) || role === "modo"

// Rôles que `actorRole` peut donner à quelqu'un qui a `targetRole`
// (tableau vide = pas le droit de le modifier)
export const assignableRoles = (actorRole, targetRole) => {
  if (targetRole === "superadmin") return []
  if (actorRole === "superadmin") return ["admin", "modo", "member"]
  if (actorRole === "admin" && ["modo", "member"].includes(targetRole)) return ["modo", "member"]
  return []
}
