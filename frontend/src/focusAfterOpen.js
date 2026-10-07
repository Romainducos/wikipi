// La modale daisyUI reste en visibility: hidden pendant quelques frames après
// showModal() (transition) : tant que le focus n'est pas dans la modale, on
// retente à la frame suivante (10 frames max).
export const focusAfterOpen = (dialog, focus, triesLeft = 10) => {
  requestAnimationFrame(() => {
    focus();
    if (dialog && !dialog.contains(document.activeElement) && triesLeft > 0) {
      focusAfterOpen(dialog, focus, triesLeft - 1);
    }
  });
};
