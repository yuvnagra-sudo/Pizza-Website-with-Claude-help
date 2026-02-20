CREATE TABLE `cartItemCustomizations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`cartItemId` int NOT NULL,
	`modificationType` enum('add','remove','replace') NOT NULL,
	`toppingId` int NOT NULL,
	`replacedToppingId` int,
	`halfPizza` enum('whole','left','right') NOT NULL DEFAULT 'whole',
	`additionalCharge` decimal(10,2) NOT NULL DEFAULT '0.00',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `cartItemCustomizations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pizzaToppings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`menuItemId` int NOT NULL,
	`toppingId` int NOT NULL,
	`isDefault` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `pizzaToppings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `toppings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`category` enum('vegetable','meat','cheese') NOT NULL,
	`smallPrice` decimal(10,2) NOT NULL,
	`mediumPrice` decimal(10,2) NOT NULL,
	`largePrice` decimal(10,2) NOT NULL,
	`available` boolean NOT NULL DEFAULT true,
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `toppings_id` PRIMARY KEY(`id`)
);
