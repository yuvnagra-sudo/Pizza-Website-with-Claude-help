CREATE TABLE `pizzas` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`description` text NOT NULL,
	`smallPrice` decimal(10,2),
	`mediumPrice` decimal(10,2),
	`largePrice` decimal(10,2),
	`allergens` text,
	`vegetarian` boolean NOT NULL DEFAULT false,
	`spicy` boolean NOT NULL DEFAULT false,
	`bestSeller` boolean NOT NULL DEFAULT false,
	`sweet` boolean NOT NULL DEFAULT false,
	`specialty` boolean NOT NULL DEFAULT false,
	`isGlutenFree` boolean NOT NULL DEFAULT false,
	`category` varchar(50) NOT NULL DEFAULT 'main',
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pizzas_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sides` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`description` text,
	`price` decimal(10,2) NOT NULL,
	`category` varchar(50) NOT NULL DEFAULT 'side',
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `sides_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `wingFlavors` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`isGlutenFree` boolean NOT NULL DEFAULT false,
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `wingFlavors_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `wingPrices` (
	`id` int AUTO_INCREMENT NOT NULL,
	`wingId` int NOT NULL,
	`size` varchar(50) NOT NULL,
	`price` decimal(10,2) NOT NULL,
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `wingPrices_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `wings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`description` text,
	`type` varchar(50) NOT NULL,
	`isGlutenFree` boolean NOT NULL DEFAULT false,
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `wings_id` PRIMARY KEY(`id`)
);
