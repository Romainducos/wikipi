export const validateIdParam = (req, res, next, value) => {
  if (!/^\d+$/.test(value)) {
    return res.status(400).json({ message: "Identifiant invalide" });
  }
  next();
};
