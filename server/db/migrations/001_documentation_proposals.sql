-- Propositions de modification d'une documentation, validées par l'auteur,
-- un modo ou un admin (puis l'owner du groupe du projet, cf. groupes)
CREATE TABLE `documentation_proposals` (
  `id` int NOT NULL AUTO_INCREMENT,
  `documentation_id` int NOT NULL,
  `proposed_by` int NOT NULL,
  `title` varchar(255) NOT NULL,
  `excerpt` varchar(500) DEFAULT NULL,
  `content` longtext NOT NULL,
  `message` varchar(500) DEFAULT NULL,
  `status` enum('pending','accepted','rejected') NOT NULL DEFAULT 'pending',
  `reviewed_by` int DEFAULT NULL,
  `reviewed_at` timestamp NULL DEFAULT NULL,
  `review_comment` varchar(500) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `documentation_id` (`documentation_id`),
  KEY `proposed_by` (`proposed_by`),
  KEY `status` (`status`),
  CONSTRAINT `proposals_documentation_fk` FOREIGN KEY (`documentation_id`) REFERENCES `documentations` (`id`) ON DELETE CASCADE,
  CONSTRAINT `proposals_proposed_by_fk` FOREIGN KEY (`proposed_by`) REFERENCES `users` (`id`),
  CONSTRAINT `proposals_reviewed_by_fk` FOREIGN KEY (`reviewed_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
