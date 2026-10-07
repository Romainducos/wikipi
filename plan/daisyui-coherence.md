# Plan : utiliser daisyUI de façon cohérente

Objectif : garder daisyUI, mais arrêter de le contourner. Les modales deviennent accessibles et le rouge de la marque vient du thème. Les composants utilisent les classes daisyUI au lieu de styles faits main.

## 1. Thème clair WikiPi

Aujourd'hui le thème clair est le `light` par défaut : son `primary` n'est pas le rouge de la marque, donc `btn-primary` serait violet en clair.

- `frontend/src/index.css` : créer un thème `wikipi-light` (`--default`) sur le modèle de `wikipi-dark`.
  - `--color-primary: #DC2626`, `--color-primary-content: #FFFFFF`
  - fonds, bordures et texte repris du `light` actuel pour ne rien changer visuellement
- Retirer `themes: light --default` de la config du plugin.
- Changer le sélecteur `[data-theme="light"]` du bloc de tokens en `[data-theme="wikipi-light"]`.

## 2. Modales en `<dialog>`

Les modales actuelles s'ouvrent avec une case à cocher cachée : pas de fermeture avec Échap, pas de piège du focus. On passe au `<dialog>`, que daisyUI supporte.

- **`ProjetCreation.jsx`**
  - Remplacer `<input type="checkbox" className="modal-toggle">` + `div.modal` par `<dialog id="projet-modal" className="modal">` avec un `ref`.
  - Fermeture après création : `dialogRef.current.close()`.
  - Fond cliquable : `<form method="dialog" className="modal-backdrop"><button>Fermer</button></form>`.
  - Sur l'événement `close` du dialog : `reset()` du formulaire.
- **`DocumentCreation.jsx`**
  - Même conversion, `id="doc-modal"`.
  - L'effet sur `?nouvelleDoc=` appelle `dialogRef.current.showModal()` au lieu de cocher la case.
  - Sur `close` : vider le paramètre d'URL et `reset()` (remplace `handleCloseModal`).
- **Déclencheurs** : les `<label htmlFor="...">` ne marchent plus avec un `<dialog>`.
  - `Sidebar.jsx:82` et `MainWelcomeCard.jsx:11` (`projet-modal`) : `<button>` qui ouvre la modale.
  - `SidebarProjet.jsx:55` (`doc-modal`) : garder `handleNewDoc` (paramètre d'URL), passer le `<label>` en `<button>`.
  - Pour ouvrir `projet-modal` depuis plusieurs composants : ajouter `OPEN_PROJECT_MODAL` dans `events.js`, `ProjetCreation` s'y abonne et appelle `showModal()`.

## 3. Boutons

Remplacer les boutons stylés à la main par `btn btn-primary` :

- `LoginForm.jsx:85`, `RegisterForm.jsx:154` : `btn bg-red-primary text-white … rounded-md` → `btn btn-primary w-full`
- `DocumentCreation.jsx:203`, `ProjetCreation.jsx:82` : bouton brut → `btn btn-primary` (+ `flex-1` / `w-full`)
- `Sidebar.jsx:75` : `bg-red-primary hover:bg-red-secondary` → `btn btn-primary btn-square`
- `DocumentPage.jsx:11` : lien-bouton → `btn btn-link`
- `MainWelcomeCard.jsx` : garder les boutons blancs sur le bandeau rouge (choix de design), mais remplacer `hover:bg-black` par `hover:bg-base-200` pour rester dans la palette.

Ensuite, vérifier si `--color-red-primary` / `--color-red-secondary` servent encore. Si non, les supprimer de `@theme` et des blocs dark.

## 4. Champs de formulaire

Dans les modales, remplacer les champs bruts (`border border-base-300 rounded-md px-3 py-2 text-sm`) :

- `DocumentCreation.jsx:142` : `input w-full`
- `DocumentCreation.jsx:161`, `:185` : `textarea w-full`
- `ProjetCreation.jsx:56` : `input w-full`
- `ProjetCreation.jsx:70` : `textarea w-full`
- `DocumentCreation.jsx` select : `select select-neutral` → `select w-full`
- Labels et aides : utiliser `fieldset` / `fieldset-legend` / `label` comme dans `LoginForm` pour homogénéiser.

## 5. Petits restes

- Messages d'erreur sous les champs : `text-error text-sm` partout (déjà fait), et `input-error` / `textarea-error` sur le champ quand `errors.x` existe.
- `Sidebar.jsx` : la barre de recherche construit son propre cadre (`label` + `border`) → `label.input` + `join` de daisyUI.

## Vérification

- `npx eslint .` et `npx vite build` dans `frontend/`
- Captures clair et sombre (API factice) : accueil, modale projet, modale doc, connexion, page doc
- Test clavier : ouvrir chaque modale, Tab reste dans la modale, Échap ferme et réinitialise le formulaire
- Création projet et doc : la modale se ferme et les listes se rafraîchissent

## Ordre conseillé

1 → 3 → 4 → 2 → 5. Le thème d'abord, sinon `btn-primary` est violet en clair. Les modales en dernier, car c'est le seul changement de comportement.
