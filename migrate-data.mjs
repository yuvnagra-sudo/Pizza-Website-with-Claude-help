import { drizzle } from "drizzle-orm/mysql2";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { pizzas, wings, wingPrices, wingFlavors, sides } from "../drizzle/schema.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize database connection
const db = drizzle(process.env.DATABASE_URL);

async function migrateMenuData() {
  console.log("Starting menu data migration...");

  try {
    // Read JSON files
    const menuDataPath = join(__dirname, "../client/public/menu_data.json");
    const glutenFreeDataPath = join(__dirname, "../client/public/gluten_free_data.json");

    const menuData = JSON.parse(readFileSync(menuDataPath, "utf-8"));
    const glutenFreeData = JSON.parse(readFileSync(glutenFreeDataPath, "utf-8"));

    // Migrate main pizzas
    console.log("Migrating main pizzas...");
    let sortOrder = 0;
    for (const pizza of menuData.main_pizzas) {
      await db.insert(pizzas).values({
        name: pizza.name,
        description: pizza.description,
        smallPrice: pizza.small.toString(),
        mediumPrice: pizza.medium.toString(),
        largePrice: pizza.large.toString(),
        allergens: pizza.allergens || "",
        vegetarian: pizza.vegetarian,
        spicy: pizza.spicy,
        bestSeller: pizza.best_seller,
        sweet: pizza.sweet,
        specialty: pizza.specialty,
        isGlutenFree: false,
        category: "main",
        sortOrder: sortOrder++
      });
    }
    console.log(`Migrated ${menuData.main_pizzas.length} main pizzas`);

    // Migrate gluten-free pizzas
    console.log("Migrating gluten-free pizzas...");
    sortOrder = 0;
    for (const pizza of glutenFreeData.pizzas) {
      await db.insert(pizzas).values({
        name: pizza.name,
        description: pizza.description,
        smallPrice: pizza.small.toString(),
        mediumPrice: pizza.large.toString(), // Gluten-free has small/large, not small/medium/large
        largePrice: null,
        allergens: pizza.allergens || "",
        vegetarian: pizza.vegetarian,
        spicy: pizza.spicy,
        bestSeller: pizza.best_seller,
        sweet: pizza.sweet,
        specialty: pizza.specialty,
        isGlutenFree: true,
        category: "gluten_free",
        sortOrder: sortOrder++
      });
    }
    console.log(`Migrated ${glutenFreeData.pizzas.length} gluten-free pizzas`);

    // Migrate wings
    console.log("Migrating wings...");
    sortOrder = 0;
    for (const wing of menuData.wings_sides.wings) {
      const result = await db.insert(wings).values({
        name: wing.name,
        description: wing.description || "",
        type: wing.type,
        isGlutenFree: false,
        sortOrder: sortOrder++
      });

      const wingId = Number(result[0].insertId);

      // Insert wing prices
      for (const option of wing.options) {
        await db.insert(wingPrices).values({
          wingId: wingId,
          size: option.size,
          price: option.price.toString(),
          sortOrder: 0
        });
      }
    }
    console.log(`Migrated ${menuData.wings_sides.wings.length} wing types`);

    // Migrate gluten-free wings
    console.log("Migrating gluten-free wings...");
    for (const wing of glutenFreeData.wings) {
      const result = await db.insert(wings).values({
        name: wing.name,
        description: wing.description || "",
        type: wing.type,
        isGlutenFree: true,
        sortOrder: sortOrder++
      });

      const wingId = Number(result[0].insertId);

      // Insert wing prices
      for (const option of wing.options) {
        await db.insert(wingPrices).values({
          wingId: wingId,
          size: option.size,
          price: option.price.toString(),
          sortOrder: 0
        });
      }
    }
    console.log(`Migrated ${glutenFreeData.wings.length} gluten-free wing types`);

    // Migrate wing flavors
    console.log("Migrating wing flavors...");
    sortOrder = 0;
    for (const flavor of menuData.wings_sides.flavors) {
      await db.insert(wingFlavors).values({
        name: flavor,
        isGlutenFree: false,
        sortOrder: sortOrder++
      });
    }
    console.log(`Migrated ${menuData.wings_sides.flavors.length} regular wing flavors`);

    // Migrate gluten-free wing flavors
    sortOrder = 0;
    for (const flavor of glutenFreeData.flavors) {
      await db.insert(wingFlavors).values({
        name: flavor,
        isGlutenFree: true,
        sortOrder: sortOrder++
      });
    }
    console.log(`Migrated ${glutenFreeData.flavors.length} gluten-free wing flavors`);

    // Migrate sides
    console.log("Migrating sides...");
    sortOrder = 0;
    for (const side of menuData.wings_sides.sides) {
      await db.insert(sides).values({
        name: side.name,
        description: side.description || "",
        price: side.price.toString(),
        category: "side",
        sortOrder: sortOrder++
      });
    }
    console.log(`Migrated ${menuData.wings_sides.sides.length} sides`);

    // Migrate dips
    console.log("Migrating dips...");
    sortOrder = 0;
    for (const dip of menuData.wings_sides.dips) {
      await db.insert(sides).values({
        name: dip.name,
        description: dip.description || "",
        price: dip.price.toString(),
        category: "dip",
        sortOrder: sortOrder++
      });
    }
    console.log(`Migrated ${menuData.wings_sides.dips.length} dips`);

    // Migrate drinks
    console.log("Migrating drinks...");
    sortOrder = 0;
    for (const drink of menuData.wings_sides.drinks) {
      await db.insert(sides).values({
        name: drink.name,
        description: drink.description || "",
        price: drink.price.toString(),
        category: "drink",
        sortOrder: sortOrder++
      });
    }
    console.log(`Migrated ${menuData.wings_sides.drinks.length} drinks`);

    console.log("✅ Menu data migration completed successfully!");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
}

// Run migration
migrateMenuData();
