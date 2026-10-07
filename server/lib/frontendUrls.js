// Adresses du frontend autorisées : FRONTEND_URL peut en contenir plusieurs,
// séparées par des virgules (ex. "http://localhost:5173,http://10.0.0.5:5173")
export const frontendUrls = (process.env.FRONTEND_URL || "http://localhost:5173")
  .split(",")
  .map((url) => url.trim())
  .filter(Boolean);

// Adresse utilisée dans les liens envoyés par email : la première de la liste
export const primaryFrontendUrl = frontendUrls[0];
