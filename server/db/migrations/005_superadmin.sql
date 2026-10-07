-- Rôle super admin : au-dessus des admins, il est le seul à gérer les
-- administrateurs. Il ne peut y en avoir qu'un : la colonne générée vaut 1
-- pour le super admin et NULL pour les autres, et un UNIQUE accepte
-- plusieurs NULL mais un seul 1.
-- Personne n'est désigné ici : utiliser `npm run set-superadmin -- <email>`.
ALTER TABLE `users`
  MODIFY COLUMN `role` enum('superadmin','admin','modo','member') DEFAULT 'member';

ALTER TABLE `users`
  ADD COLUMN `superadmin_flag` tinyint GENERATED ALWAYS AS (IF(`role` = 'superadmin', 1, NULL)) STORED,
  ADD UNIQUE KEY `one_superadmin` (`superadmin_flag`);
