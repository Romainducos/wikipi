export const validateProject = (req, res, next) => {
  const { title, description } = req.body;

  if (!title || title.trim().length === 0) {
    return res.status(400).json({
      message: "Le titre est requis",
    });
  }

  const { visibility } = req.body;
  if (visibility !== undefined && !["public", "group", "private"].includes(visibility)) {
    return res.status(400).json({
      message: "Visibilité invalide (public, group ou private)",
    });
  }

  if (description && description.length > 350) {
    return res.status(400).json({
      message: "Description trop longue (max 350 caractères)",
    });
  }

  next();
};
