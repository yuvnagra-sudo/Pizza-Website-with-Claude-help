import { drizzle } from "drizzle-orm/mysql2";
import fs from 'fs';

// Read SQL file
const sql = fs.readFileSync('/home/ubuntu/import_reviews.sql', 'utf-8');

// Split into individual statements
const statements = sql
  .split('\n')
  .filter(line => line.trim().startsWith('INSERT'))
  .map(line => {
    // Find the complete statement (may span multiple lines in original)
    return line;
  });

console.log(`Found ${statements.length} INSERT statements`);

// Connect to database
const db = drizzle(process.env.DATABASE_URL);

// Execute in batches
const batchSize = 10;
let successCount = 0;
let errorCount = 0;

for (let i = 0; i < statements.length; i += batchSize) {
  const batch = statements.slice(i, i + batchSize);
  console.log(`\nExecuting batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(statements.length / batchSize)} (${batch.length} statements)...`);
  
  for (const statement of batch) {
    try {
      await db.execute(statement);
      successCount++;
      process.stdout.write('.');
    } catch (error) {
      errorCount++;
      console.error(`\nError executing statement: ${error.message}`);
      console.error(`Statement: ${statement.substring(0, 100)}...`);
    }
  }
}

console.log(`\n\nImport complete!`);
console.log(`✅ Success: ${successCount}`);
console.log(`❌ Errors: ${errorCount}`);

// Verify count
const result = await db.execute('SELECT COUNT(*) as count FROM customerReviews');
console.log(`\nTotal reviews in database: ${result[0][0].count}`);

process.exit(0);
