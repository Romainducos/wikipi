// La modale daisyUI reste en visibility: hidden jusqu'au premier rendu après
// showModal() : on attend deux frames avant de donner le focus au champ.
export const focusAfterOpen = (focus) => {
  requestAnimationFrame(() => requestAnimationFrame(focus));
};
