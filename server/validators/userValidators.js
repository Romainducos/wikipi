import { body, validationResult } from "express-validator";

const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: errors.array()[0].msg,
      errors: errors.array(),
    });
  }
  next();
};

export const validateProfileUpdate = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Le nom est requis")
    .isLength({ min: 2, max: 50 })
    .withMessage("Le nom doit faire entre 2 et 50 caractères"),

  body("email")
    .trim()
    .notEmpty()
    .withMessage("L'email est requis")
    .isEmail()
    .withMessage("Format d'email invalide"),

  handleValidation,
];

export const validatePasswordChange = [
  body("currentPassword")
    .notEmpty()
    .withMessage("Le mot de passe actuel est requis"),

  body("newPassword")
    .isLength({ min: 8 })
    .withMessage("Le nouveau mot de passe doit faire au moins 8 caractères"),

  handleValidation,
];
