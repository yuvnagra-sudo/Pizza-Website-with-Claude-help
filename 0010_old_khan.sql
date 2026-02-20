DROP TABLE `coupons`;--> statement-breakpoint
DROP TABLE `dealTemplates`;--> statement-breakpoint
DROP TABLE `textSpecials`;--> statement-breakpoint
ALTER TABLE `orders` MODIFY COLUMN `status` enum('pending','preparing','out_for_delivery','completed','cancelled') NOT NULL DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE `orders` MODIFY COLUMN `deliveryAddress` text NOT NULL;--> statement-breakpoint
ALTER TABLE `orderItems` DROP COLUMN `customizations`;--> statement-breakpoint
ALTER TABLE `orders` DROP COLUMN `orderType`;--> statement-breakpoint
ALTER TABLE `orders` DROP COLUMN `customerName`;--> statement-breakpoint
ALTER TABLE `orders` DROP COLUMN `email`;--> statement-breakpoint
ALTER TABLE `orders` DROP COLUMN `additionalInfo`;--> statement-breakpoint
ALTER TABLE `orders` DROP COLUMN `paymentMethod`;--> statement-breakpoint
ALTER TABLE `orders` DROP COLUMN `scheduledPickupTime`;--> statement-breakpoint
ALTER TABLE `orders` DROP COLUMN `statusUpdatedAt`;