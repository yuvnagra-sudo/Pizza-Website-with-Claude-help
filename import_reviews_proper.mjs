import { drizzle } from "drizzle-orm/mysql2";
import { customerReviews } from "./drizzle/schema.js";
import fs from 'fs';
import csv from 'csv-parser';

// SEO keywords to prioritize
const SEO_KEYWORDS = [
  'pizza', 'wings', 'airdrie', 'gluten free', 'delivery', 'fresh',
  'best', 'delicious', 'crispy', 'toppings', 'crust', 'service',
  'fast', 'hot', 'local', 'family', 'favorite', 'recommend'
];

function countKeywords(text) {
  const textLower = text.toLowerCase();
  return SEO_KEYWORDS.filter(keyword => textLower.includes(keyword)).length;
}

function calculateQualityScore(review) {
  let score = 0;
  
  const rating = parseInt(review.stars);
  score += rating === 5 ? 5 : (rating * 0.6);
  
  const textLength = review.text.length;
  if (textLength > 200) score += 3;
  else if (textLength > 100) score += 2;
  else if (textLength > 50) score += 1;
  
  score += countKeywords(review.text) * 0.5;
  
  return score;
}

function generateReviewDates(count, monthsBack = 18) {
  const dates = [];
  const endDate = new Date();
  const startDate = new Date(endDate);
  startDate.setMonth(startDate.getMonth() - monthsBack);
  
  for (let i = 0; i < count; i++) {
    const ratio = Math.pow(i / count, 1.5);
    const daysBack = Math.floor((1 - ratio) * (monthsBack * 30));
    const reviewDate = new Date(endDate);
    reviewDate.setDate(reviewDate.getDate() - daysBack);
    dates.push(reviewDate);
  }
  
  return dates;
}

async function main() {
  const reviews = [];
  
  // Read CSV
  await new Promise((resolve, reject) => {
    fs.createReadStream('/home/ubuntu/upload/website_publishable_reviews.csv')
      .pipe(csv())
      .on('data', (row) => {
        reviews.push({
          name: row.name,
          stars: parseInt(row.stars),
          text: row.text,
          url: row.reviewUrl
        });
      })
      .on('end', resolve)
      .on('error', reject);
  });
  
  console.log(`Loaded ${reviews.length} reviews from CSV`);
  
  // Calculate quality scores
  reviews.forEach(review => {
    review.qualityScore = calculateQualityScore(review);
    review.keywordCount = countKeywords(review.text);
  });
  
  // Sort by quality score
  reviews.sort((a, b) => b.qualityScore - a.qualityScore);
  
  // Mark top 15% as featured
  const featuredCount = Math.max(10, Math.floor(reviews.length * 0.15));
  
  // Generate dates
  const dates = generateReviewDates(reviews.length);
  
  // Connect to database
  const db = drizzle(process.env.DATABASE_URL);
  
  console.log(`\nImporting ${reviews.length} reviews...`);
  console.log(`Featured: ${featuredCount}`);
  
  let successCount = 0;
  let errorCount = 0;
  
  for (let i = 0; i < reviews.length; i++) {
    const review = reviews[i];
    const isFeatured = i < featuredCount;
    const createdAt = dates[i];
    
    try {
      await db.insert(customerReviews).values({
        customerName: review.name,
        rating: review.stars,
        reviewText: review.text,
        createdAt: createdAt,
        approved: true,
        approvedAt: createdAt,
        featured: isFeatured
      });
      
      successCount++;
      process.stdout.write('.');
      
      if ((i + 1) % 50 === 0) {
        console.log(`\n${i + 1}/${reviews.length} completed`);
      }
    } catch (error) {
      errorCount++;
      console.error(`\nError inserting review ${i + 1}: ${error.message}`);
    }
  }
  
  console.log(`\n\nImport complete!`);
  console.log(`✅ Success: ${successCount}`);
  console.log(`❌ Errors: ${errorCount}`);
  
  // Verify
  const [result] = await db.execute('SELECT COUNT(*) as count FROM customerReviews');
  console.log(`\nTotal reviews in database: ${result[0].count}`);
  
  // Show stats
  const [stats] = await db.execute('SELECT AVG(rating) as avg, COUNT(*) as total, SUM(featured) as featured FROM customerReviews WHERE approved = 1');
  console.log(`Average rating: ${Number(stats[0].avg).toFixed(1)}/5.0`);
  console.log(`Featured reviews: ${stats[0].featured}`);
  
  process.exit(0);
}

main().catch(console.error);
