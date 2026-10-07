# 📚 WikiPi

**WikiPi** est une application web de gestion de documentation collaborative. Elle permet aux utilisateurs de créer des projets et d'y associer des documentations structurées, le tout avec un système d'authentification et de gestion des rôles.

---

## 🚀 Fonctionnalités

### Authentification & Utilisateurs

- 🔐 Inscription et connexion sécurisées (JWT + bcrypt, limite de tentatives)
- 🔑 Mot de passe oublié : lien de réinitialisation par email (valable 1 h)
- 👤 Paramètres du compte : nom, email, photo de profil, mot de passe, thème clair / sombre
- 🎭 Système de rôles (super admin, admin, modo, member), avec demande pour devenir modérateur
- 🛡️ Routes protégées côté frontend et backend

### Gestion des Projets

- 📁 Création, modification et suppression de projets, page de présentation par projet
- 🌐 Visibilité : public, groupe ou privé
- 👥 Accès contrôlé selon le créateur, le groupe ou la visibilité (règles centralisées dans `server/lib/access.js`)

### Groupes

- 🧑‍🤝‍🧑 Un utilisateur appartient à un seul groupe, qu'il rejoint en acceptant une invitation
- 👑 L'owner du groupe gère les membres, les projets du groupe et valide les modifications de leurs documentations

### Documentation

- 📝 Création de documentations associées à un projet
- ✍️ Support du Markdown pour le contenu, avec aperçu à l'édition
- ✏️ L'auteur (ou un modo, admin, owner du groupe) modifie directement ; les autres proposent une modification, relue avec les différences avant / après
- 📋 Liste des documentations récentes
- 🔍 Consultation détaillée avec informations sur l'auteur

### Administration

- 🛡️ Page Modération (modos et admins) : propositions à traiter, activité récente, demandes de modération
- 📊 Tableau de bord avec statistiques (utilisateurs, projets, documents)
- 👥 Gestion des utilisateurs et de leurs rôles
- 🙋 Validation des demandes pour devenir modérateur

---

## 🛠️ Technologies

### Frontend

| Technologie      | Version | Description                 |
| ---------------- | ------- | --------------------------- |
| React            | 19.2.0  | Framework UI                |
| Vite             | 7.2.4   | Build tool & dev server     |
| React Router DOM | 7.9.4   | Routing SPA                 |
| Tailwind CSS     | 4.1.13  | Framework CSS utility-first |
| DaisyUI          | 5.1.25  | Composants UI pour Tailwind |
| Axios            | 1.13.2  | Client HTTP                 |
| React Hook Form  | 7.66.1  | Gestion des formulaires     |
| React Markdown   | 10.1.0  | Rendu Markdown              |
| React Icons      | 5.5.0   | Icônes                      |

### Backend

| Technologie       | Version | Description                   |
| ----------------- | ------- | ----------------------------- |
| Node.js           | -       | Runtime JavaScript            |
| Express           | 5.1.0   | Framework web                 |
| MySQL2            | 3.15.3  | Driver MySQL avec Promises    |
| JWT               | 9.0.2   | Authentification par tokens   |
| bcrypt            | 6.0.0   | Hashage des mots de passe     |
| express-validator | 7.3.1   | Validation des requêtes       |
| CORS              | 2.8.5   | Cross-Origin Resource Sharing |
| Nodemon           | 3.1.11  | Hot reload en développement   |

---

## 📁 Structure du Projet

```
wikipi/
├── frontend/                   # Application React
│   ├── src/
│   │   ├── assets/            # Ressources statiques
│   │   ├── components/        # Composants React
│   │   │   ├── Auth/          # Composants d'authentification
│   │   │   ├── Documents/     # Composants de documentation
│   │   │   ├── Layout/        # Mise en page (AppLayout, etc.)
│   │   │   ├── Projects/      # Composants de projets
│   │   │   ├── Settings/      # Paramètres utilisateur
│   │   │   └── Shared/        # Composants réutilisables
│   │   ├── contexts/          # Context API (Auth, Projects, Docs)
│   │   ├── hooks/             # Hooks personnalisés
│   │   ├── routes/            # Pages de l'application
│   │   │   ├── Home.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── Project.jsx
│   │   │   ├── Admin.jsx
│   │   │   └── Settings.jsx
│   │   ├── api.js             # Configuration Axios
│   │   ├── App.jsx            # Point d'entrée React
│   │   └── main.jsx           # Bootstrap de l'app
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
├── server/                     # API Express
│   ├── controllers/           # Logique métier
│   │   ├── authController.js
│   │   ├── projectController.js
│   │   ├── documentationController.js
│   │   └── userController.js
│   ├── lib/
│   │   └── db.js              # Configuration MySQL
│   ├── middleware/
│   │   ├── auth.js            # Vérification JWT
│   │   ├── authorize.js       # Autorisation par rôle
│   │   └── validates.js       # Validation des données
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── projectRoutes.js
│   │   ├── documentationRoutes.js
│   │   └── userRoutes.js
│   ├── validators/            # Schémas de validation
│   ├── index.js               # Point d'entrée serveur
│   └── package.json
│
├── .gitignore
└── README.md
```

---

## ⚙️ Installation

### Prérequis

- **Node.js** (v18 ou supérieur recommandé)
- **MySQL** (v8 ou supérieur)
- **npm** ou **yarn**

### 1. Cloner le repository

```bash
git clone https://github.com/votre-username/wikipi.git
cd wikipi
```

### 2. Configuration de la base de données

Créez une base de données MySQL vide :

```sql
CREATE DATABASE wikipi;
```

Les tables sont créées et mises à jour par le script de migrations (étape 3) :

- `server/db/schema.sql` : schéma de départ, utilisé seulement sur une base vide ;
- `server/db/migrations/*.sql` : évolutions du schéma, appliquées dans l'ordre et une seule fois (suivies dans la table `schema_migrations`).

Pour faire évoluer la base, ajoutez un nouveau fichier `NNN_description.sql` dans `server/db/migrations/` : ne modifiez jamais une migration déjà appliquée.

### 3. Configuration du Backend

```bash
cd server
npm install
```

Créez un fichier `.env` à la racine du dossier `server/` :

```env
PORT=3000
DB_HOST=localhost
DB_USER=votre_utilisateur_mysql
DB_PASS=votre_mot_de_passe_mysql
DB_NAME=wikipi
JWT_KEY=votre_clé_secrète_jwt
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:5173

# Optionnel : envoi des emails « mot de passe oublié ». Sans SMTP_HOST,
# le lien est affiché dans la console du serveur.
SMTP_HOST=smtp.exemple.fr
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=utilisateur
SMTP_PASS=mot_de_passe
MAIL_FROM="WikiPi <no-reply@exemple.fr>"
```

Puis créez / mettez à jour les tables :

```bash
npm run migrate
```

À relancer après chaque `git pull` qui ajoute une migration.

### 4. Configuration du Frontend

```bash
cd ../frontend
npm install
```

---

## 🚀 Lancement

### Démarrer le serveur backend

```bash
cd server
npm start
```

Le serveur démarre sur `http://localhost:3000`

### Démarrer le frontend

```bash
cd frontend
npm run dev
```

L'application est accessible sur `http://localhost:5173`

---

## 📡 API Endpoints

Toutes les routes sauf l'inscription, la connexion et le mot de passe oublié demandent un token (`Authorization: Bearer <token>`).

### Authentification (`/auth`)

| Méthode | Route                    | Description                                   |
| ------- | ------------------------ | --------------------------------------------- |
| POST    | `/auth/register`         | Inscription                                   |
| POST    | `/auth/login`            | Connexion                                     |
| POST    | `/auth/forgot-password`  | Envoie un lien de réinitialisation            |
| POST    | `/auth/reset-password`   | Nouveau mot de passe à partir du lien         |
| GET     | `/auth/home`             | Utilisateur connecté (rôle, groupe)           |

### Projets (`/api/projects`)

| Méthode | Route               | Description                                   |
| ------- | ------------------- | --------------------------------------------- |
| GET     | `/api/projects`     | Projets visibles                              |
| GET     | `/api/projects/:id` | Détail (avec `permissions`)                   |
| POST    | `/api/projects`     | Créer (`visibility` : public / group / private) |
| PUT     | `/api/projects/:id` | Modifier (créateur, owner du groupe, admin)   |
| DELETE  | `/api/projects/:id` | Supprimer avec ses documentations             |

### Documentations (`/api/documentations`)

| Méthode | Route                                                | Description                              |
| ------- | ---------------------------------------------------- | ---------------------------------------- |
| GET     | `/api/documentations`                                | 20 dernières documentations visibles     |
| GET     | `/api/documentations/:id`                            | Détail (avec `permissions`)              |
| GET     | `/api/documentations/projects/:projectId/documentations` | Docs d'un projet                     |
| POST    | `/api/documentations/projects/:projectId/documentations` | Créer une documentation              |
| PUT     | `/api/documentations/:id`                            | Modifier directement                     |
| DELETE  | `/api/documentations/:id`                            | Supprimer                                |
| POST    | `/api/documentations/:id/proposals`                  | Proposer une modification                |

### Propositions (`/api/proposals`)

| Méthode | Route                              | Description                        |
| ------- | ---------------------------------- | ---------------------------------- |
| GET     | `/api/proposals/to-review`         | Propositions à relire              |
| GET     | `/api/proposals/to-review/count`   | Nombre à relire                    |
| GET     | `/api/proposals/mine`              | Mes propositions                   |
| PUT     | `/api/proposals/:id/accept`        | Accepter et publier                |
| PUT     | `/api/proposals/:id/reject`        | Refuser                            |

### Groupes (`/api/groups`)

| Méthode | Route                                      | Description                                |
| ------- | ------------------------------------------ | ------------------------------------------ |
| GET     | `/api/groups/me`                           | Mon groupe et mes invitations reçues       |
| GET     | `/api/groups/me/invitations/count`         | Nombre d'invitations reçues                |
| POST    | `/api/groups`                              | Créer un groupe                            |
| GET     | `/api/groups/:id`                          | Détail (membres, projets, invitations)     |
| PUT     | `/api/groups/:id`                          | Modifier (owner)                           |
| DELETE  | `/api/groups/:id`                          | Supprimer (owner)                          |
| POST    | `/api/groups/:id/invitations`              | Inviter par email (owner)                  |
| DELETE  | `/api/groups/:id/invitations/:invitationId`| Annuler une invitation (owner)             |
| POST    | `/api/groups/invitations/:invitationId/accept`  | Accepter une invitation               |
| POST    | `/api/groups/invitations/:invitationId/decline` | Refuser une invitation                |
| PUT     | `/api/groups/:id/members/:userId`          | Changer le rôle owner / member (owner)     |
| DELETE  | `/api/groups/:id/members/:userId`          | Retirer un membre (owner) ou quitter       |

### Utilisateurs (`/api/users`)

| Méthode | Route                     | Description                    | Accès  |
| ------- | ------------------------- | ------------------------------ | ------ |
| GET     | `/api/users/me`           | Mon profil                     | Tous   |
| PUT     | `/api/users/me`           | Modifier nom et email          | Tous   |
| PUT     | `/api/users/me/password`  | Changer de mot de passe        | Tous   |
| POST    | `/api/users/me/avatar`    | Envoyer une photo (2 Mo max)   | Tous   |
| DELETE  | `/api/users/me/avatar`    | Retirer la photo               | Tous   |
| GET     | `/api/users`              | Liste des utilisateurs         | Admin  |
| GET     | `/api/users/admin/stats`  | Statistiques                   | Admin  |
| PUT     | `/api/users/:id/role`     | Modifier un rôle               | Admin  |

### Demandes de modération (`/api/moderator-requests`)

| Méthode | Route                                   | Description                 | Accès  |
| ------- | --------------------------------------- | --------------------------- | ------ |
| POST    | `/api/moderator-requests`               | Demander à devenir modo     | Membre |
| GET     | `/api/moderator-requests/mine`          | Ma dernière demande         | Tous   |
| GET     | `/api/moderator-requests`               | Demandes en attente         | Modo, admin |
| PUT     | `/api/moderator-requests/:id/accept`    | Accepter                    | Admin  |
| PUT     | `/api/moderator-requests/:id/reject`    | Refuser                     | Admin  |

---

## 🎭 Rôles

| Rôle | Droits |
| --- | --- |
| **Super admin** (un seul) | Tout ce que fait un admin + nomme et retire les admins |
| **Admin** | Tableau de bord, voit tous les projets, valide les demandes de modération, passe un membre en modo et inversement (ne touche pas aux autres admins) |
| **Modo** | Page Modération : valide les propositions, suit l'activité récente, voit les demandes de modération (sans les valider) ; modifie les documentations |
| **Membre** | Crée ses projets et docs, propose des modifications |

Le super admin ne se nomme pas depuis l'application : `npm run set-superadmin -- <email>` (ajouter `--transfer` pour passer le rôle à quelqu'un d'autre). La base garantit qu'il n'y en a qu'un.

### Modération (`/api/moderation`) - Modo et admin

| Méthode | Route                                          | Description                                                     |
| ------- | ---------------------------------------------- | --------------------------------------------------------------- |
| GET     | `/api/moderation/activity?type=all\|created\|updated` | 50 dernières docs visibles (les admins voient tout)        |

## 🔐 Sécurité

- **Mots de passe** : Hashés avec bcrypt (salt rounds: 10)
- **Authentification** : JWT avec expiration configurable
- **Autorisation** : Middleware de vérification des rôles
- **Validation** : express-validator pour les entrées utilisateur
- **CORS** : limité à `FRONTEND_URL` (plusieurs adresses possibles, séparées par des virgules)
- **Limite de tentatives** : 10 par 15 min sur connexion, inscription et mot de passe oublié
- **Réinitialisation** : seul le hash du jeton est stocké, lien à usage unique valable 1 h
- **Uploads** : images JPG / PNG / WebP de 2 Mo max, servies sur `/uploads`

---

## 📜 Scripts disponibles

### Frontend

```bash
npm run dev      # Démarre le serveur de développement
npm run build    # Build pour la production
npm run preview  # Prévisualise le build de production
npm run lint     # Analyse le code avec ESLint
```

### Backend

```bash
npm start        # Démarre le serveur (node --watch : redémarre à chaque modification)
npm run migrate  # Crée / met à jour les tables de la base
npm run set-superadmin -- <email> [--transfer]  # Désigne le super admin (un seul possible)
```

---

## 🎨 UI/UX

L'interface utilise **DaisyUI** sur **Tailwind CSS** pour un design moderne et responsive :

- 🎯 Navigation intuitive avec sidebar
- 📱 Design responsive (mobile-first)
- 🌙 Composants DaisyUI (modals, cards, alerts, etc.)
- ✨ Animations et transitions fluides
- 📖 Support du Markdown avec `@tailwindcss/typography`

---

## 🤝 Contribution

1. Forkez le projet
2. Créez une branche pour votre fonctionnalité (`git checkout -b feature/ma-fonctionnalite`)
3. Committez vos changements (`git commit -m 'Ajout de ma fonctionnalité'`)
4. Pushez sur la branche (`git push origin feature/ma-fonctionnalite`)
5. Ouvrez une Pull Request

---

## 📄 Licence

Ce projet est sous licence ISC.

---

## 👤 Auteur

Développé avec ❤️ pour simplifier la gestion de documentation technique.

---

## 🐛 Problèmes connus

Si vous rencontrez des problèmes :

1. Vérifiez que MySQL est bien démarré
2. Vérifiez les variables d'environnement dans `.env`
3. Assurez-vous que les ports 3000 et 5173 sont disponibles
4. Consultez les logs du serveur et de la console navigateur

Pour signaler un bug, ouvrez une issue sur le repository GitHub.
