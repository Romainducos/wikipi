# Plan : pages manquantes, modifications de documentation et groupes

Gros chantier, à découper en plusieurs branches. L'étape 0 est **bloquante** : tout le reste en dépend.

---

## 0. Préalable : repartir de `develop` (bloquant)

**Constat :** `main` (et donc `fix/bugs`) a ~27 commits de retard sur `upstream/develop`. L'équipe y a fait :
- un gros refacto frontend :
  - dossiers `Auth/`, `Documents/`, `Layout/`, `Projects/`, `Settings/`, `Shared/` ;
  - `AuthProvider` et contexts projets / documentations ;
  - hooks `useAuth`, `useProjects`, `useDocumentations` ;
- les rôles `admin` / `modo` / `member` : middleware `authorize.js`, page `/admin` avec stats et changement de rôle ;
- le rendu Markdown des documentations (`react-markdown`) ;
- un `verifyToken` qui charge l'utilisateur complet dans `req.user` (avec son rôle), au lieu de `req.userId`.

Développer les nouvelles features sur `main` reviendrait à les écrire sur du code que l'équipe a déjà remplacé.

**À faire :**
1. Créer `feature/integration` depuis `upstream/develop`.
2. Reporter les fixes de `fix/bugs` un par un. Les fichiers ont été déplacés ou renommés, donc c'est un portage, pas un merge. Pour chaque fix, vérifier s'il est déjà corrigé sur `develop` :
   - fuite du hash dans `/auth/home`, filtrage des projets privés, validation inscription ;
   - CORS, rate limit (une branche `feature/rate-limiting` existe, voir ce qu'elle contient), 401 uniforme au login, validation des ids ;
   - remplacement de `nodemon` par `node --watch` ;
   - thèmes `wikipi-light` / `wikipi-dark`, modales `<dialog>`, composants daisyUI, `focusAfterOpen`.
3. Retirer le vrai secret JWT de `server/.env.example` sur `develop` (le remplacer par `JWT_KEY="changeme"`).
4. **Ajouter le schéma SQL au repo** (`server/db/schema.sql` + `server/db/migrations/`). Aujourd'hui aucune table n'est versionnée : impossible d'ajouter les groupes ou les propositions proprement sans ça. Colonnes connues :
   - `users` (`role`, `avatar_url`) ;
   - `projects` (`is_public`, `created_by`) ;
   - `documentations` (`excerpt`, `last_modified_by`, `updated_at`).

---

## 1. Page Settings

**Constat :**
- Sur `develop`, `/settings` affiche un formulaire **sans aucune action** (pas de `onSubmit`, pas de backend).
- La version fonctionnelle est sur `feature/settings` (`PUT /users/me`, `updateUser`), mais elle n'a jamais été fusionnée et n'est plus compatible : elle utilise `req.userId` alors que `develop` utilise `req.user`.
- Problèmes de cette version :
  - mot de passe en clair (pas de `type="password"`) ;
  - changement de mot de passe sans demander l'ancien ;
  - photo de profil et toggle de thème purement décoratifs.

**Backend :**
- Récupérer `updateUser` de `feature/settings` dans le `userController` de `develop`, adapté à `req.user.id`.
- `GET /api/users/me` : profil courant.
- `PUT /api/users/me` : nom, et email si on l'autorise. Validation `express-validator`.
- `PUT /api/users/me/password` : exige `currentPassword` (vérifié avec bcrypt), puis le nouveau mot de passe (min 8) et sa confirmation.
- Avatar : voir « Décisions à prendre ».

**Frontend (`Settings/SettingsPage.jsx`) :**
- `react-hook-form` + `fieldset` daisyUI, comme les modales.
- Section **Profil** : nom, (email), avatar.
- Section **Sécurité** : mot de passe actuel, nouveau, confirmation, tous en `type="password"` avec l'œil afficher/masquer.
- Section **Préférences** : thème Clair / Sombre / Système. Branché sur `data-theme` (`wikipi-light` / `wikipi-dark`), retenu dans `localStorage`.
- Mettre à jour `AuthProvider` après sauvegarde (nom affiché dans la navbar).
- Retours utilisateur avec `alert` daisyUI au lieu de `window.alert`.

---

## 2. Modifier une documentation (auteur) / proposer une modification (autres)

**Constat :** le bouton « Soumettre une modification » n'est branché sur rien, dans aucune branche. Et il s'affiche aussi pour l'auteur, qui n'a pas à soumettre quoi que ce soit.

**Règle :**
- **Auteur** de la doc (`created_by`), **admin** ou **modo** : bouton **« Modifier »**, la modification est appliquée directement.
- **Autres utilisateurs** ayant accès au projet : bouton **« Proposer une modification »**, qui doit être validée.

**Backend :**
- `PUT /api/documentations/:id` : édition directe, si auteur, admin ou modo. Met à jour `last_modified_by` et `updated_at`.
- Nouvelle table `documentation_proposals` :
  - `id`, `documentation_id`, `proposed_by` ;
  - `title`, `excerpt`, `content` (version complète proposée) ;
  - `message` (pourquoi ce changement) ;
  - `status` enum `pending` / `accepted` / `rejected` ;
  - `reviewed_by`, `reviewed_at`, `review_comment`, `created_at`.
- `POST /api/documentations/:id/proposals` : créer une proposition (refusé à l'auteur, qui modifie directement).
- `GET /api/proposals?status=pending` : propositions que je peux traiter (sur mes docs, ou toutes si admin/modo).
- `PUT /api/proposals/:id/accept` : applique le contenu à la doc dans une transaction.
- `PUT /api/proposals/:id/reject` : avec un commentaire.
- `GET /api/proposals/mine` : mes propositions et leur statut.

**Frontend :**
- `DocumentPage.jsx` : bouton selon le rôle (« Modifier » ou « Proposer une modification »).
- Éditeur (route `/project/:projectId/documentation/:docId/edit`, ou modale plein écran) : titre, extrait, contenu Markdown avec aperçu (`react-markdown` est déjà là).
- Page **`/proposals`** : à traiter (aperçu avant/après, accepter/refuser) et mes propositions.
- Badge du nombre de propositions en attente dans le menu de l'avatar.

---

## 3. Système de groupes

**Constat :** rien n'existe, dans aucune branche. Aujourd'hui un projet est soit privé (créateur seul), soit public (tout le monde).

**Modèle proposé :** un groupe est un ensemble d'utilisateurs (une équipe, une promo, un pôle du Labo). Un projet peut appartenir à un groupe, et tous ses membres y ont accès.

**Base de données :**
- `groups` : `id`, `name`, `description`, `created_by`, `created_at`.
- `group_members` : `group_id`, `user_id`, `role` (`owner` / `member`), `joined_at`, clé primaire (`group_id`, `user_id`).
- `projects` :
  - ajouter `group_id` (nullable) ;
  - remplacer `is_public` par `visibility` enum `public` / `group` / `private` (migration : `is_public = 1` → `public`, sinon `private`).

**Règles d'accès, centralisées :**
- Créer `server/lib/access.js` avec la condition SQL partagée : `visibility = 'public' OR created_by = ? OR (visibility = 'group' AND group_id IN (groupes de l'utilisateur))`.
- Remplacer toutes les conditions `created_by = ? OR is_public = 1` dupliquées dans `projectController` et `documentationController` (au moins 5 endroits).
- Admin : accès à tout.

**Backend (`/api/groups`) :**
- `GET /` : mes groupes (tous si admin).
- `POST /` : créer un groupe (le créateur devient `owner`).
- `GET /:id` : détail, membres et projets du groupe.
- `PUT /:id`, `DELETE /:id` : owner ou admin.
- `POST /:id/members` : ajouter un membre par email (owner).
- `DELETE /:id/members/:userId` : retirer un membre (owner), ou quitter le groupe (soi-même).
- `PUT /:id/members/:userId` : passer `owner` / `member`.

**Frontend :**
- Page **`/groups`** : mes groupes, bouton « Créer un groupe » (modale `<dialog>`).
- Page **`/groups/:id`** : membres (ajout par email, rôle, retrait), projets du groupe, bouton quitter.
- Modale de création de projet : choix de visibilité (Public / Groupe / Privé), avec la liste de mes groupes si « Groupe ».
- Sidebar : projets rangés par groupe (sections repliables « Mes projets », « <Groupe A> », « Publics »).
- Lien « Mes groupes » dans le menu de l'avatar.

---

## 4. Autres pages et boutons morts

- **Page projet** `/project/:projectId` (sans doc) : `/project` seul affiche « Projet inconnu ». Il faut une vraie page projet (description, liste des docs, créateur, groupe, bouton « Nouvelle documentation »). Les liens de la sidebar devraient y mener.
- **Gestion du contenu** : modifier et supprimer un projet, supprimer une documentation (créateur, owner du groupe, admin).
- **« Devenir Modérateur »** (bandeau d'accueil) : bouton sans action. Soit un vrai flux (demande, puis validation par un admin dans `/admin`), soit on le retire.
- **« Mot de passe oublié ? »** (connexion) : texte non cliquable. Un vrai flux demande l'envoi d'emails (service SMTP). Le retirer en attendant, ou le garder en lien désactivé « bientôt ».
- **Page 404** pour les routes inconnues.
- **Protection des routes** : vérifier que `useAuthProtection` couvre `/settings`, `/admin`, `/groups`, `/proposals`.

---

## Décisions à prendre (avant de coder)

1. **Étape 0 :** OK pour repartir de `upstream/develop` et y porter `fix/bugs` ? Et les PR vont bien vers `upstream/develop` ?
2. **Avatar :** upload de fichier (stockage serveur, `multer`) ou simple URL d'image ?
3. **Email modifiable** dans Settings ?
4. **Propositions :** qui peut valider ? Auteur + admin + modo (proposé), ou aussi les owners du groupe du projet ?
5. **Groupes :**
   - qui peut créer un groupe : tout le monde, ou modo/admin seulement ?
   - ajout direct par email, ou invitation à accepter ?
   - les membres d'un groupe modifient-ils directement les docs des projets du groupe, ou passent-ils par une proposition ?
   - un projet dans un seul groupe (proposé), ou plusieurs ?
6. **« Devenir Modérateur » et « Mot de passe oublié »** : implémenter ou retirer ?

---

## Ordre et branches

| Étape | Branche (depuis `develop` intégré) | Dépend de |
|---|---|---|
| 0. Intégration + schéma SQL | `feature/integration` | — |
| 1. Settings | `feature/settings-v2` | 0 |
| 4. Page projet + gestion du contenu | `feature/project-page` | 0 |
| 2. Modifier / proposer | `feature/doc-proposals` | 0, 4 (page projet) |
| 3. Groupes | `feature/groups` | 0 (schéma), idéalement après 2 |
| 4. Boutons morts, 404, protection des routes | `feature/cleanup` | 1, 2, 3 |

## Vérification (à chaque étape)

- `npx eslint .` et `npx vite build` dans `frontend/`, `node --check` côté serveur.
- Tests manuels dans le navigateur, en clair et en sombre.
- Pour les droits (étapes 2 et 3) : tester avec 3 comptes (auteur, membre du groupe, utilisateur extérieur) et 1 admin, et vérifier chaque endpoint avec `curl` (200 / 403 / 404 attendus).
