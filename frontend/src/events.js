// Événements pour rafraîchir les listes sans recharger la page
export const PROJECTS_CHANGED = "wikipi:projects-changed";
export const DOCUMENTATIONS_CHANGED = "wikipi:documentations-changed";

export const emit = (eventName) => window.dispatchEvent(new Event(eventName));

export const subscribe = (eventName, callback) => {
  window.addEventListener(eventName, callback);
  return () => window.removeEventListener(eventName, callback);
};
