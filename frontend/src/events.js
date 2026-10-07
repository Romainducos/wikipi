// Événements pour rafraîchir les listes sans recharger la page
export const PROJECTS_CHANGED = "wikipi:projects-changed";
export const DOCUMENTATIONS_CHANGED = "wikipi:documentations-changed";

// Ouverture de la modale de création de projet depuis n'importe quel composant
export const OPEN_PROJECT_MODAL = "wikipi:open-project-modal";

export const emit = (eventName) => window.dispatchEvent(new Event(eventName));

export const subscribe = (eventName, callback) => {
  window.addEventListener(eventName, callback);
  return () => window.removeEventListener(eventName, callback);
};
