-- Migration: switch from Manus OAuth to local email+password auth
ALTER TABLE `users` ADD COLUMN `passwordHash` varchar(255) NULL;
ALTER TABLE `users` MODIFY COLUMN `email` varchar(320) NULL;
ALTER TABLE `users` ADD CONSTRAINT `users_email_unique` UNIQUE (`email`);
