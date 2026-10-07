// Ouverture de la modale de création de projet depuis n'importe quel composant
export const OPEN_PROJECT_MODAL = "wikipi:open-project-modal";

// Une proposition a été traitée : le compteur de la navbar se met à jour
export const PROPOSALS_CHANGED = "wikipi:proposals-changed";

// Groupe ou invitations modifiés : navbar, sidebar et profil se rechargent
export const GROUPS_CHANGED = "wikipi:groups-changed";

export const emit = (eventName) => window.dispatchEvent(new Event(eventName));

export const subscribe = (eventName, callback) => {
  window.addEventListener(eventName, callback);
  return () => window.removeEventListener(eventName, callback);
};
