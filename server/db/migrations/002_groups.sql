-- Groupes d'utilisateurs : un utilisateur appartient à un seul groupe,
-- il y entre en acceptant une invitation. Les projets peuvent être visibles
-- par tout le groupe (visibility = 'group').

CREATE TABLE `user_groups` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `description` text,
  `created_by` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`),
  CONSTRAINT `user_groups_created_by_fk` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `group_members` (
  `group_id` int NOT NULL,
  `user_id` int NOT NULL,
  `role` enum('owner','member') NOT NULL DEFAULT 'member',
  `joined_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`group_id`, `user_id`),
  -- Un utilisateur ne peut être que dans un seul groupe
  UNIQUE KEY `one_group_per_user` (`user_id`),
  CONSTRAINT `group_members_group_fk` FOREIGN KEY (`group_id`) REFERENCES `user_groups` (`id`) ON DELETE CASCADE,
  CONSTRAINT `group_members_user_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `group_invitations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `group_id` int NOT NULL,
  `user_id` int NOT NULL,
  `invited_by` int NOT NULL,
  `status` enum('pending','accepted','declined','cancelled') NOT NULL DEFAULT 'pending',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `responded_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `user_status` (`user_id`, `status`),
  CONSTRAINT `group_invitations_group_fk` FOREIGN KEY (`group_id`) REFERENCES `user_groups` (`id`) ON DELETE CASCADE,
  CONSTRAINT `group_invitations_user_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `group_invitations_invited_by_fk` FOREIGN KEY (`invited_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Visibilité d'un projet : public / groupe / privé (remplace is_public)
ALTER TABLE `projects`
  ADD COLUMN `visibility` enum('public','group','private') NOT NULL DEFAULT 'private' AFTER `description`,
  ADD COLUMN `group_id` int DEFAULT NULL AFTER `visibility`,
  ADD CONSTRAINT `projects_group_fk` FOREIGN KEY (`group_id`) REFERENCES `user_groups` (`id`) ON DELETE SET NULL;

UPDATE `projects` SET `visibility` = IF(`is_public` = 1, 'public', 'private');

ALTER TABLE `projects` DROP COLUMN `is_public`;
