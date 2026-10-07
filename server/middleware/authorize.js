export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentification requise" });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        message: "Accès refusé: permissions insuffisantes",
      });
    }

    next();
  };
};

// Le super admin a tous les droits d'un admin
export const isAdmin = authorize("superadmin", "admin");

export const isModeratorOrAdmin = authorize("superadmin", "admin", "modo");
