export const validateGroup = (req, res, next) => {
  const { name, description } = req.body;

  if (!name || name.trim().length < 2 || name.trim().length > 100) {
    return res.status(400).json({
      message: "Le nom du groupe doit faire entre 2 et 100 caractères",
    });
  }

  if (description && description.length > 500) {
    return res.status(400).json({
      message: "Description trop longue (max 500 caractères)",
    });
  }

  next();
};
