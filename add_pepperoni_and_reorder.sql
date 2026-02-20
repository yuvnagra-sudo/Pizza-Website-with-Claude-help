-- Step 1: Add Pepperoni pizza to menuItems table
INSERT INTO menuItems (name, description, category, available, sortOrder)
VALUES ('Pepperoni', 'Pizza sauce, Mozzarella Cheese, and Loads of Pepperoni', 'pizza', 1, 3);

-- Get the ID of the newly inserted Pepperoni pizza
SET @pepperoni_id = LAST_INSERT_ID();

-- Step 2: Add pricing for Pepperoni pizza (matching Two Topper pricing)
INSERT INTO menuItemPrices (menuItemId, size, price)
VALUES 
  (@pepperoni_id, 'Small (10")', '11.99'),
  (@pepperoni_id, 'Medium (12")', '14.99'),
  (@pepperoni_id, 'Large (14")', '18.99');

-- Step 3: Update sortOrder for specific pizzas to control display order
-- Cheese Pizza = 1
UPDATE menuItems SET sortOrder = 1 WHERE name = 'Cheese' AND category = 'pizza';

-- Hawaiian = 2
UPDATE menuItems SET sortOrder = 2 WHERE name = 'Hawaiian' AND category = 'pizza';

-- Pepperoni = 3 (already set during INSERT)

-- Two Topper = 4
UPDATE menuItems SET sortOrder = 4 WHERE name = 'Two Topper' AND category = 'pizza';

-- All other pizzas = 10+ (to appear after the first 4)
UPDATE menuItems 
SET sortOrder = 10 
WHERE category = 'pizza' 
  AND name NOT IN ('Cheese', 'Hawaiian', 'Pepperoni', 'Two Topper');

-- Verify the changes
SELECT mi.id, mi.name, mi.sortOrder, 
       GROUP_CONCAT(CONCAT(mip.size, ': $', mip.price) ORDER BY mip.price SEPARATOR ' | ') as prices
FROM menuItems mi
LEFT JOIN menuItemPrices mip ON mi.id = mip.menuItemId
WHERE mi.category = 'pizza'
GROUP BY mi.id, mi.name, mi.sortOrder
ORDER BY mi.sortOrder, mi.name
LIMIT 10;
