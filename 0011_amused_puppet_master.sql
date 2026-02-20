CREATE TABLE `coupons` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(50) NOT NULL,
	`description` text,
	`discountType` enum('percentage','fixed') NOT NULL,
	`discountValue` decimal(10,2) NOT NULL,
	`minimumOrderAmount` decimal(10,2),
	`expiresAt` timestamp,
	`usageLimit` int,
	`usageCount` int NOT NULL DEFAULT 0,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `coupons_id` PRIMARY KEY(`id`),
	CONSTRAINT `coupons_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `dealTemplates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(200) NOT NULL,
	`description` text NOT NULL,
	`items` json NOT NULL,
	`regularPrice` decimal(10,2) NOT NULL,
	`specialPrice` decimal(10,2) NOT NULL,
	`displayOrder` int NOT NULL DEFAULT 0,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `dealTemplates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `textSpecials` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(200) NOT NULL,
	`description` text NOT NULL,
	`displayOrder` int NOT NULL DEFAULT 0,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `textSpecials_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `orders` MODIFY COLUMN `status` enum('pending','preparing','ready_for_pickup','out_for_delivery','completed','cancelled') NOT NULL DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE `orders` MODIFY COLUMN `deliveryAddress` text;--> statement-breakpoint
ALTER TABLE `orderItems` ADD `customizations` text;--> statement-breakpoint
ALTER TABLE `orders` ADD `orderType` enum('pickup','delivery') DEFAULT 'delivery' NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `customerName` varchar(100);--> statement-breakpoint
ALTER TABLE `orders` ADD `email` varchar(320);--> statement-breakpoint
ALTER TABLE `orders` ADD `additionalInfo` text;--> statement-breakpoint
ALTER TABLE `orders` ADD `paymentMethod` enum('debit','credit_visa','credit_mastercard','cash','etransfer');--> statement-breakpoint
ALTER TABLE `orders` ADD `scheduledPickupTime` timestamp;--> statement-breakpoint
ALTER TABLE `orders` ADD `statusUpdatedAt` timestamp DEFAULT (now()) NOT NULL;