ALTER TABLE `orders` MODIFY COLUMN `deliveryAddress` text;--> statement-breakpoint
ALTER TABLE `orders` ADD `orderType` enum('pickup','delivery') DEFAULT 'delivery' NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `customerName` varchar(100);--> statement-breakpoint
ALTER TABLE `orders` ADD `email` varchar(320);--> statement-breakpoint
ALTER TABLE `orders` ADD `additionalInfo` text;--> statement-breakpoint
ALTER TABLE `orders` ADD `paymentMethod` enum('debit','credit_visa','credit_mastercard','cash','etransfer');--> statement-breakpoint
ALTER TABLE `orders` ADD `scheduledPickupTime` timestamp;