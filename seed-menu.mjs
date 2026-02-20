import { readFileSync } from 'fs';
import { drizzle } from 'drizzle-orm/mysql2';
import { menuItems, menuItemPrices } from './drizzle/schema.js';

// Read menu data
const menuData = JSON.parse(readFileSync('./menu_data.json', 'utf-8'));
const glutenFreeData = JSON.parse(readFileSync('./client/public/gluten_free_data.json', 'utf-8'));

// Connect to database
const db = drizzle(process.env.DATABASE_URL);

async function seedMenu() {
  console.log('Starting menu data import...');
  
  try {
    // Import main pizzas
    console.log('Importing pizzas...');
    for (const pizza of menuData.main_pizzas) {
      const [result] = await db.insert(menuItems).values({
        name: pizza.name,
        description: pizza.description,
        category: 'pizza',
        available: true,
        sortOrder: 0,
      });
      
      const menuItemId = result.insertId;
      
      // Add prices for each size
      const prices = [];
      if (pizza.small) {
        prices.push({ menuItemId, size: 'Small (10")', price: pizza.small.toFixed(2) });
      }
      if (pizza.medium) {
        prices.push({ menuItemId, size: 'Medium (12")', price: pizza.medium.toFixed(2) });
      }
      if (pizza.large) {
        prices.push({ menuItemId, size: 'Large (14")', price: pizza.large.toFixed(2) });
      }
      
      for (const price of prices) {
        await db.insert(menuItemPrices).values(price);
      }
      
      console.log(`  ✓ ${pizza.name}`);
    }
    
    // Import bone-in wings
    console.log('Importing bone-in wings...');
    const [boneInResult] = await db.insert(menuItems).values({
      name: 'Bone-In Wings',
      description: `Available in ${menuData.wings_sides.flavours.join(', ')} flavors`,
      category: 'wings',
      available: true,
      sortOrder: 0,
    });
    
    const boneInId = boneInResult.insertId;
    for (const option of menuData.wings_sides.bone_in_wings) {
      await db.insert(menuItemPrices).values({
        menuItemId: boneInId,
        size: `${option.count} pieces`,
        price: option.price.toFixed(2),
      });
    }
    console.log('  ✓ Bone-In Wings');
    
    // Import boneless wings
    console.log('Importing boneless wings...');
    const [bonelessResult] = await db.insert(menuItems).values({
      name: 'Boneless Wings',
      description: `Available in ${menuData.wings_sides.flavours.join(', ')} flavors`,
      category: 'wings',
      available: true,
      sortOrder: 1,
    });
    
    const bonelessId = bonelessResult.insertId;
    for (const option of menuData.wings_sides.boneless_wings) {
      await db.insert(menuItemPrices).values({
        menuItemId: bonelessId,
        size: `${option.count} pieces`,
        price: option.price.toFixed(2),
      });
    }
    console.log('  ✓ Boneless Wings');
    
    // Import salads
    console.log('Importing salads...');
    for (const salad of menuData.wings_sides.sides.salads) {
      const [result] = await db.insert(menuItems).values({
        name: salad.name,
        description: salad.description,
        category: 'sides',
        available: true,
        sortOrder: 0,
      });
      
      await db.insert(menuItemPrices).values({
        menuItemId: result.insertId,
        size: 'regular',
        price: salad.price.toFixed(2),
      });
      
      console.log(`  ✓ ${salad.name}`);
    }
    
    // Import appetizers
    console.log('Importing appetizers...');
    for (const appetizer of menuData.wings_sides.sides.appetizers) {
      const [result] = await db.insert(menuItems).values({
        name: appetizer.name,
        description: appetizer.description,
        category: 'sides',
        available: true,
        sortOrder: 1,
      });
      
      await db.insert(menuItemPrices).values({
        menuItemId: result.insertId,
        size: 'regular',
        price: appetizer.price.toFixed(2),
      });
      
      console.log(`  ✓ ${appetizer.name}`);
    }
    
    // Import fries and rings
    console.log('Importing fries and rings...');
    for (const item of menuData.wings_sides.sides.fries_and_rings) {
      const [result] = await db.insert(menuItems).values({
        name: item.name,
        description: '',
        category: 'sides',
        available: true,
        sortOrder: 2,
      });
      
      const menuItemId = result.insertId;
      
      if (item.small) {
        await db.insert(menuItemPrices).values({
          menuItemId,
          size: 'small',
          price: item.small.toFixed(2),
        });
      }
      if (item.large) {
        await db.insert(menuItemPrices).values({
          menuItemId,
          size: 'large',
          price: item.large.toFixed(2),
        });
      }
      
      console.log(`  ✓ ${item.name}`);
    }
    
    // Import dipping sauces
    console.log('Importing dipping sauces...');
    for (const sauce of menuData.wings_sides.sides.dipping_sauces) {
      const [result] = await db.insert(menuItems).values({
        name: `${sauce.name} Sauce`,
        description: 'Dipping sauce',
        category: 'sides',
        available: true,
        sortOrder: 3,
      });
      
      await db.insert(menuItemPrices).values({
        menuItemId: result.insertId,
        size: 'regular',
        price: sauce.price.toFixed(2),
      });
      
      console.log(`  ✓ ${sauce.name} Sauce`);
    }
    
    // Import drinks
    console.log('Importing drinks...');
    const drinkFlavors = menuData.wings_sides.sides.drinks.flavors.join(', ');
    for (const drinkSize of menuData.wings_sides.sides.drinks.sizes) {
      const [result] = await db.insert(menuItems).values({
        name: `Drinks - ${drinkSize.name}`,
        description: `Available flavors: ${drinkFlavors}`,
        category: 'drinks',
        available: true,
        sortOrder: 0,
      });
      
      await db.insert(menuItemPrices).values({
        menuItemId: result.insertId,
        size: drinkSize.name,
        price: drinkSize.price.toFixed(2),
      });
      
      console.log(`  ✓ Drinks - ${drinkSize.name}`);
    }
    
    // Import gluten-free pizzas
    console.log('Importing gluten-free pizzas...');
    for (const pizza of glutenFreeData.pizzas) {
      const [result] = await db.insert(menuItems).values({
        name: `${pizza.name} (Gluten-Free)`,
        description: `${pizza.description} - Available on gluten-free crust`,
        category: 'pizza',
        available: true,
        sortOrder: 100, // Put gluten-free pizzas after regular pizzas
      });
      
      const menuItemId = result.insertId;
      
      // Add prices for 9" and 11" sizes
      await db.insert(menuItemPrices).values({
        menuItemId,
        size: '9"',
        price: pizza.small.toFixed(2),
      });
      
      await db.insert(menuItemPrices).values({
        menuItemId,
        size: '11"',
        price: pizza.large.toFixed(2),
      });
      
      console.log(`  ✓ ${pizza.name} (Gluten-Free)`);
    }
    
    // Import gluten-free wings
    console.log('Importing gluten-free wings...');
    const [gfWingsResult] = await db.insert(menuItems).values({
      name: 'Gluten-Free Wings',
      description: `Available in ${glutenFreeData.wings.flavours.join(', ')} flavors`,
      category: 'wings',
      available: true,
      sortOrder: 100,
    });
    
    const gfWingsId = gfWingsResult.insertId;
    for (const option of glutenFreeData.wings.sizes) {
      await db.insert(menuItemPrices).values({
        menuItemId: gfWingsId,
        size: `${option.count} pieces`,
        price: option.price.toFixed(2),
      });
    }
    console.log('  ✓ Gluten-Free Wings');
    
    // Import gluten-free dipping sauces
    console.log('Importing gluten-free dipping sauces...');
    for (const sauce of glutenFreeData.wings.dipping_sauces) {
      const [result] = await db.insert(menuItems).values({
        name: `${sauce.name} Sauce (GF)`,
        description: 'Gluten-free dipping sauce',
        category: 'sides',
        available: true,
        sortOrder: 100,
      });
      
      await db.insert(menuItemPrices).values({
        menuItemId: result.insertId,
        size: 'regular',
        price: sauce.price.toFixed(2),
      });
      
      console.log(`  ✓ ${sauce.name} Sauce (GF)`);
    }
    
    console.log('\n✅ Menu data import complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error importing menu data:', error);
    process.exit(1);
  }
}

seedMenu();
