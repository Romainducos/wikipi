# Plan : fixes restants

Branche : `fix/bugs` (suite du commit `e7a8d2a`)

## Priorité haute (sécurité)

1. **Restreindre CORS** — `server/index.js`
   - Remplacer `cors()` par `cors({ origin: process.env.FRONTEND_URL })`.
   - Ajouter `FRONTEND_URL` dans `.env`.
2. **Limiter les tentatives de login** — `server/routes/authRoutes.js`
   - Ajouter `express-rate-limit` sur `/auth/login` et `/auth/register`.
3. **Supprimer l'énumération d'emails** — `server/controllers/authController.js`
   - Renvoyer le même 401 "Email ou mot de passe incorrect" si l'email n'existe pas ou si le mot de passe est faux.

## Priorité moyenne (robustesse)

4. **Valider les ids de route** — `projectController.js`, `documentationController.js`
   - Vérifier que `:id` / `:projectId` sont des entiers (sinon 400).
5. **Codes HTTP corrects** — `authController.js`
   - `login` et `getHome` renvoient 201 au lieu de 200.
   - Adapter les tests de statut côté frontend (`Home.jsx`, `LoginForm.jsx`).
6. **Token expiré côté frontend** — `frontend/src/api.js`
   - Ajouter un intercepteur de réponse : sur 401/403, supprimer le token et rediriger vers `/login`.
7. **Variables d'environnement** — `server/index.js`
   - Vérifier au démarrage que `JWT_KEY`, `JWT_EXPIRES_IN`, `PORT` et les `DB_*` sont définies.

## Priorité basse (qualité)

8. **Warning eslint `Home.jsx`** : déplacer `fetchUser` dans le `useEffect`.
9. **`DocumentCreation.jsx`** : retirer le `value`/`onChange` manuel qui écrase `register` sur le select et le textarea, utiliser `watch`.
10. **`window.location.reload()`** après création projet/doc : remplacer par un rafraîchissement d'état.
11. **`baseURL` en dur** (`api.js`, `Home.jsx`, `LoginForm.jsx`, `RegisterForm.jsx`) : passer par `import.meta.env.VITE_API_URL` et utiliser `api` partout.
12. **Console.log résiduels** : supprimer ceux qui affichent des données (`Home.jsx`, `LoginForm.jsx`, `projectController.js`).

## Question ouverte

- Autoriser n'importe qui à créer une doc dans un projet public : voulu ou à restreindre ?

## Vérification

- `npx eslint .` et `npx vite build` dans `frontend/`
- `node --check` sur les fichiers serveur
- Test manuel : inscription, connexion, création projet, création doc, déconnexion
