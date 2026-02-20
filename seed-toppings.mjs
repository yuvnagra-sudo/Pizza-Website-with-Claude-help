import 'dotenv/config';
import { drizzle } from 'drizzle-orm/mysql2';
import { toppings } from './drizzle/schema.ts';

// Connect to database
const db = drizzle(process.env.DATABASE_URL);

// Topping data with categories and pricing
const toppingData = [
  // Vegetables
  { name: 'Green Peppers', category: 'vegetable', smallPrice: 2.49, mediumPrice: 2.99, largePrice: 3.49 },
  { name: 'Mushrooms', category: 'vegetable', smallPrice: 2.49, mediumPrice: 2.99, largePrice: 3.49 },
  { name: 'Onions', category: 'vegetable', smallPrice: 2.49, mediumPrice: 2.99, largePrice: 3.49 },
  { name: 'Red Onions', category: 'vegetable', smallPrice: 2.49, mediumPrice: 2.99, largePrice: 3.49 },
  { name: 'Jalapeno', category: 'vegetable', smallPrice: 2.49, mediumPrice: 2.99, largePrice: 3.49 },
  { name: 'Banana Peppers', category: 'vegetable', smallPrice: 2.49, mediumPrice: 2.99, largePrice: 3.49 },
  { name: 'Spinach', category: 'vegetable', smallPrice: 2.49, mediumPrice: 2.99, largePrice: 3.49 },
  { name: 'Fresh Tomatoes', category: 'vegetable', smallPrice: 2.49, mediumPrice: 2.99, largePrice: 3.49 },
  { name: 'Green Olives', category: 'vegetable', smallPrice: 2.49, mediumPrice: 2.99, largePrice: 3.49 },
  { name: 'Black Olives', category: 'vegetable', smallPrice: 2.49, mediumPrice: 2.99, largePrice: 3.49 },
  { name: 'Pineapple', category: 'vegetable', smallPrice: 2.49, mediumPrice: 2.99, largePrice: 3.49 },
  { name: 'Dill Pickles', category: 'vegetable', smallPrice: 2.49, mediumPrice: 2.99, largePrice: 3.49 },
  { name: 'Lettuce', category: 'vegetable', smallPrice: 2.49, mediumPrice: 2.99, largePrice: 3.49 },
  { name: 'Cooked Tomatoes', category: 'vegetable', smallPrice: 2.49, mediumPrice: 2.99, largePrice: 3.49 },
  
  // Meats
  { name: 'Pepperoni', category: 'meat', smallPrice: 2.49, mediumPrice: 2.99, largePrice: 3.49 },
  { name: 'Ham', category: 'meat', smallPrice: 2.49, mediumPrice: 2.99, largePrice: 3.49 },
  { name: 'Salami', category: 'meat', smallPrice: 2.49, mediumPrice: 2.99, largePrice: 3.49 },
  { name: 'Beef', category: 'meat', smallPrice: 2.49, mediumPrice: 2.99, largePrice: 3.49 },
  { name: 'Spicy Beef', category: 'meat', smallPrice: 2.49, mediumPrice: 2.99, largePrice: 3.49 },
  { name: 'Bacon', category: 'meat', smallPrice: 2.49, mediumPrice: 2.99, largePrice: 3.49 },
  { name: 'Italian Sausage', category: 'meat', smallPrice: 2.49, mediumPrice: 2.99, largePrice: 3.49 },
  { name: 'Chicken', category: 'meat', smallPrice: 2.49, mediumPrice: 2.99, largePrice: 3.49 },
  { name: 'Donair Meat', category: 'meat', smallPrice: 2.49, mediumPrice: 2.99, largePrice: 3.49 },
  { name: 'Shrimp', category: 'meat', smallPrice: 2.49, mediumPrice: 2.99, largePrice: 3.49 },
  { name: 'Anchovy', category: 'meat', smallPrice: 2.49, mediumPrice: 2.99, largePrice: 3.49 },
  
  // Cheese
  { name: 'Extra Cheese', category: 'cheese', smallPrice: 2.49, mediumPrice: 2.99, largePrice: 3.49 },
  { name: 'Feta Cheese', category: 'cheese', smallPrice: 2.49, mediumPrice: 2.99, largePrice: 3.49 },
];

async function seedToppings() {
  console.log('Starting toppings data import...');
  
  try {
    let sortOrder = 0;
    for (const topping of toppingData) {
      await db.insert(toppings).values({
        ...topping,
        available: true,
        sortOrder: sortOrder++,
      });
      console.log(`  ✓ ${topping.name} (${topping.category})`);
    }
    
    console.log(`\n✅ Successfully imported ${toppingData.length} toppings`);
    console.log('   - Vegetables: ' + toppingData.filter(t => t.category === 'vegetable').length);
    console.log('   - Meats: ' + toppingData.filter(t => t.category === 'meat').length);
    console.log('   - Cheese: ' + toppingData.filter(t => t.category === 'cheese').length);
    
    process.exit(0);
  } catch (error) {
    console.error('Error importing toppings:', error);
    process.exit(1);
  }
}

seedToppings();
