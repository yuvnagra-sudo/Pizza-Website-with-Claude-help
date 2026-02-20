/**
 * Utility to parse pizza descriptions and extract toppings
 */

// List of all known toppings (from the toppings table)
const KNOWN_TOPPINGS = [
  'Banana Peppers',
  'Black Olives',
  'Cooked Tomatoes',
  'Dill Pickles',
  'Fresh Tomatoes',
  'Green Olives',
  'Green Peppers',
  'Jalapeno',
  'Lettuce',
  'Mushrooms',
  'Onions',
  'Pineapple',
  'Red Onions',
  'Spinach',
  'Anchovy',
  'Bacon',
  'Beef',
  'Chicken',
  'Donair Meat',
  'Ham',
  'Italian Sausage',
  'Pepperoni',
  'Salami',
  'Shrimp',
  'Spicy Beef',
  'Extra Cheese',
  'Feta Cheese',
];

// Sauces and cheese that can be removed (but not added as extra toppings)
const REMOVABLE_BASE_INGREDIENTS = [
  'Pizza sauce',
  'Mozzarella Cheese',
  'BBQ Sauce',
  'Frank\'s Red Hot Sauce',
  'Butter Chicken Sauce',
  'Ranch Sauce',
  'Chipotle Sauce',
  'Our Own Creamy Sauce',
  'Sweet Donair Sauce',
  'Teriyaki Sauce',
  'Salsa sauce',
];

/**
 * Extract all default ingredients from a pizza description
 * Includes both toppings AND removable base ingredients (sauces, cheese)
 * @param description - Pizza description string
 * @returns Object with toppings and baseIngredients arrays
 */
export function parseToppingsFromDescription(description: string): string[] {
  if (!description) return [];

  const items: string[] = [];
  
  // Split by commas and "and"
  const parts = description
    .split(/,|\sand\s/)
    .map(part => part.trim())
    .filter(part => part.length > 0);

  // Check each part against known toppings and base ingredients
  for (const part of parts) {
    // Check if this part matches a known topping
    const matchedTopping = KNOWN_TOPPINGS.find(topping => 
      part.includes(topping) || topping.includes(part)
    );

    if (matchedTopping && !items.includes(matchedTopping)) {
      items.push(matchedTopping);
      continue;
    }

    // Check if this part matches a removable base ingredient (sauce/cheese)
    const matchedBase = REMOVABLE_BASE_INGREDIENTS.find(base => 
      part.includes(base) || base.includes(part)
    );

    if (matchedBase && !items.includes(matchedBase)) {
      items.push(matchedBase);
    }
  }

  return items;
}

/**
 * Example usage:
 * parseToppingsFromDescription("Pizza sauce, BBQ Sauce, Chicken, Red Onions and Mozzarella Cheese")
 * Returns: ["Chicken", "Red Onions"]
 */
