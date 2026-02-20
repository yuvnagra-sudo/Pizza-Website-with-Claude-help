import { drizzle } from "drizzle-orm/mysql2";
import { menuItems, menuItemPrices } from "./drizzle/schema.ts";
import { eq } from "drizzle-orm";

const db = drizzle(process.env.DATABASE_URL);

const items = await db.select().from(menuItems).where(eq(menuItems.category, "pizza")).limit(3);

for (const item of items) {
  console.log("\nPizza:", item.name);
  console.log("ID:", item.id);
  
  const prices = await db.select().from(menuItemPrices).where(eq(menuItemPrices.menuItemId, item.id));
  console.log("Prices:", prices);
}
