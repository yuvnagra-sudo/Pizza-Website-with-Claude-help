/**
 * Run this once to apply schema changes to the database.
 * Usage: pnpm exec tsx scripts/migrate.ts
 */
import "dotenv/config";
import mysql from "mysql2/promise";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set in .env");
  process.exit(1);
}

const statements = [
  {
    sql: "ALTER TABLE `users` ADD COLUMN `passwordHash` varchar(255) NULL",
    description: "Add passwordHash column to users",
    ignoreCodes: [1060], // 1060 = Duplicate column name (already exists)
  },
  {
    sql: "ALTER TABLE `users` ADD CONSTRAINT `users_email_unique` UNIQUE (`email`)",
    description: "Add unique constraint on users.email",
    ignoreCodes: [1061, 1062], // 1061 = Duplicate key name, 1062 = Duplicate entry
  },
  {
    sql: "ALTER TABLE `orders` MODIFY COLUMN `status` enum('pending','preparing','ready_for_pickup','out_for_delivery','completed','cancelled') NOT NULL DEFAULT 'pending'",
    description: "Add ready_for_pickup to orders.status enum",
    ignoreCodes: [],
  },
];

async function run() {
  console.log("Connecting to database...");
  const conn = await mysql.createConnection(url!);
  console.log("Connected!\n");

  for (const { sql, description, ignoreCodes } of statements) {
    process.stdout.write(`  ${description}... `);
    try {
      await conn.execute(sql);
      console.log("✓ done");
    } catch (err: any) {
      if (ignoreCodes.includes(err.errno)) {
        console.log("✓ already done (skipped)");
      } else {
        console.log(`✗ FAILED: ${err.message}`);
      }
    }
  }

  await conn.end();
  console.log("\nMigration complete!");
}

run().catch((err) => {
  console.error("Fatal error:", err.message);
  process.exit(1);
});
