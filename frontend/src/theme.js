// Préférence de thème : "system" (suit l'OS), "light" ou "dark"
const STORAGE_KEY = "wikipi-theme";
const THEMES = { light: "wikipi-light", dark: "wikipi-dark" };

export const getThemePreference = () => {
  try {
    return localStorage.getItem(STORAGE_KEY) || "system";
  } catch {
    return "system";
  }
};

export const applyTheme = (preference) => {
  const theme = THEMES[preference];
  if (theme) {
    document.documentElement.dataset.theme = theme;
  } else {
    delete document.documentElement.dataset.theme;
  }
};

export const setThemePreference = (preference) => {
  try {
    if (preference === "system") {
      localStorage.removeItem(STORAGE_KEY);
    } else {
      localStorage.setItem(STORAGE_KEY, preference);
    }
  } catch {
    // stockage indisponible : le choix vaut pour la session en cours
  }
  applyTheme(preference);
};
