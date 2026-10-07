# Plan : page « Modération » et rôle super admin

Branche : `feature/moderation-page`, à partir de `feature/cleanup`.

Deux parties : **A. Rôle super admin** (à faire en premier, car il change les règles de droits) puis **B. Page Modération**.

---

# A. Rôle super admin

## Règles demandées

- **Romain (`RomainDucos`) est super admin, et il est le seul.**
- Les **admins ne peuvent pas s'enlever les droits entre eux** : un admin ne touche jamais au rôle d'un autre admin, ni au super admin.
- Les **admins peuvent passer un modo en membre et un membre en modo**, et rien d'autre.

## Matrice des changements de rôle

| Qui agit ↓ / cible → | membre | modo | admin | super admin | soi-même |
|---|---|---|---|---|---|
| **super admin** | → modo, → admin | → membre, → admin | → membre, → modo | — | interdit |
| **admin** | → modo | → membre | **interdit** | **interdit** | interdit |
| modo, membre | interdit | interdit | interdit | interdit | interdit |

Personne ne peut **nommer** un super admin via l'application : seul le script serveur ci-dessous le fait.

## Base de données

- Migration `005_superadmin.sql` :
  - `users.role` : enum `('superadmin','admin','modo','member')` ;
  - **un seul super admin garanti par la base** : colonne générée `superadmin_flag = IF(role = 'superadmin', 1, NULL)` avec un `UNIQUE`. MySQL accepte plusieurs `NULL` mais un seul `1`.
- La migration ne désigne personne, car elle s'applique aussi aux bases des coéquipiers. Un script le fait :
  - `server/db/set-superadmin.js` + `npm run set-superadmin -- <email>` ;
  - refuse si un super admin existe déjà, sauf avec `--transfer` : l'ancien redevient admin et le nouveau devient super admin, dans une transaction ;
  - à lancer une fois sur `wikipi` pour `RomainDucos`. La base de test aura aussi un super admin pour les tests.

## Backend

- **Le super admin a tous les droits d'un admin**, partout :
  - `lib/access.js` : `isAdmin` = rôle `admin` **ou** `superadmin` ;
  - `middleware/authorize.js` : `isAdmin` = `authorize("admin", "superadmin")`, `isModeratorOrAdmin` = `authorize("superadmin", "admin", "modo")` ;
  - `groupController.getGroup` : remplacer `req.user.role !== "admin"` par le helper.
- **`PUT /api/users/:id/role`** (`userController.updateUserRole`) applique la matrice :
  - rôles assignables : `admin`, `modo`, `member` (jamais `superadmin`) ;
  - acteur `admin` : cible `member` ou `modo` uniquement, nouveau rôle `member` ou `modo` uniquement, sinon **403** « Seul le super admin peut gérer les administrateurs » ;
  - acteur `superadmin` : tout sauf lui-même ;
  - personne ne change son propre rôle (déjà en place).
- `GET /api/users` et les stats : inclure `superadmin` (affiché « Super admin »).

## Frontend

- Helper `isAdminRole(role)` (admin ou super admin) dans un petit module `roles.js`, utilisé dans :
  - `NavigationBar.jsx` (lien « Tableau de bord Admin ») ;
  - `Admin.jsx` (accès à la page) ;
  - la future page Modération.
- **Tableau des utilisateurs** (`Admin.jsx`) :
  - libellé « Super admin » ;
  - le menu de rôle ne propose que les choix autorisés par la matrice ;
  - un badge non modifiable à la place du menu quand l'acteur n'a pas le droit (ex. un admin voit les autres admins et le super admin en lecture seule).
- Menu de l'avatar : afficher « Super admin » sous le nom.

## Vérification (partie A)

- Tests d'API, toute la matrice : super admin → admin ↔ modo ↔ membre OK ; admin → admin **403** ; admin → super admin **403** ; admin → promouvoir en admin **403** ; admin → modo ↔ membre OK ; personne → soi-même **400** ; assigner `superadmin` via l'API **400**.
- Base : impossible d'avoir 2 super admins (le `UNIQUE` refuse), le script `--transfer` fonctionne.
- Le super admin a bien accès à tout ce qu'a un admin (tableau de bord, projets privés, propositions, groupes).
- Parcours dans Chrome : tableau des utilisateurs vu par le super admin et vu par un admin.

---

# B. Page Modération

## Objectif

Donner aux modérateurs un vrai espace de travail. Aujourd'hui, un modo n'a que la page `/proposals`, et rien ne lui montre l'activité du site.

**Règle conservée :** seuls les **admins** acceptent ou refusent les demandes pour devenir modérateur. Les modos les voient en lecture seule, ce qui évite qu'un modo nomme d'autres modos sans contrôle.

## Contenu de la page `/moderation`

Accessible aux rôles `modo` et `admin` (sinon message « Accès refusé », comme `/admin`). Trois onglets :

1. **Propositions à traiter** : toutes les propositions en attente du site (un modo peut toutes les traiter), avec la même carte que sur `/proposals` (différences avant / après, commentaire, accepter / refuser).
2. **Activité récente** : les 50 dernières documentations créées ou modifiées sur tout le site.
   - Pour chacune : titre, projet, visibilité du projet, auteur, dernier modificateur, date.
   - Liens « Voir », « Modifier », et « Supprimer » avec confirmation.
   - Filtre « Créées » / « Modifiées » / « Toutes ».
3. **Demandes de modération** :
   - **admin** : boutons Accepter / Refuser (comme dans le tableau de bord) ;
   - **modo** : lecture seule (qui demande, motivation, date), avec la mention « Seul un administrateur peut valider ».

## Backend

- **`GET /api/moderation/activity?type=all|created|updated`** (`isModeratorOrAdmin`, déjà présent dans `middleware/authorize.js`) :
  - 50 dernières docs, jointes à `projects`, `users` (auteur) et `users` (`last_modified_by`) ;
  - fichiers : `controllers/moderationController.js`, `routes/moderationRoutes.js`, monté sur `/api/moderation` dans `index.js`.
- **`GET /api/moderator-requests`** : passer de `isAdmin` à `isModeratorOrAdmin`. Les routes `accept` / `reject` **restent `isAdmin`**.
- **Point à vérifier :** l'activité récente montre aussi les docs des projets privés et de groupe. C'est voulu pour la modération (un modo modifie déjà toutes les docs), mais à confirmer. Sinon, filtrer avec `visibleProjectsCondition` pour les modos.

## Frontend

- **Extraire les composants à réutiliser** :
  - la carte de relecture de `routes/Proposals.jsx` → `components/Proposals/ReviewCard.jsx` ;
  - la ligne de demande de `routes/Admin.jsx` → `components/Moderation/ModeratorRequestRow.jsx`, avec une prop `readOnly`.
- **`routes/Moderation.jsx`** : protection `useAuthProtection` + contrôle du rôle, onglets `tabs-box` comme `/proposals`.
- **`components/Moderation/ActivityList.jsx`** : liste de l'activité, filtre, suppression via `ConfirmDialog`.
- **`App.jsx`** : route `/moderation`.
- **Navbar** (menu de l'avatar) : lien « Modération » pour `modo` et `admin`, avec le badge du nombre de propositions à traiter, déjà calculé.
- **Tableau de bord admin :** garder la section des demandes (l'admin peut agir aux deux endroits), avec un lien vers `/moderation`.

## Vérification

- **Tests d'API :**
  - membre → 403 sur `/api/moderation/activity` et `GET /api/moderator-requests` ;
  - modo → 200 sur les deux, mais **403** sur `accept` / `reject` ;
  - admin → tout est permis ;
  - le filtre `type` renvoie bien les créées / modifiées.
- **Parcours dans Chrome** (modo et admin) :
  - onglets ;
  - accepter une proposition depuis `/moderation` ;
  - supprimer une doc depuis l'activité ;
  - demande en lecture seule pour le modo, actions pour l'admin ;
  - lien et badge dans la navbar ;
  - captures en clair et en sombre.
- `npx eslint .` et `npx vite build`.
- Journal Obsidian à jour après le commit.

## Questions ouvertes

1. L'activité récente inclut-elle les projets privés et de groupe (proposé : oui, pour les modos et les admins) ?
2. Faut-il un historique des propositions déjà traitées (acceptées / refusées) sur la page, ou seulement celles en attente ?
