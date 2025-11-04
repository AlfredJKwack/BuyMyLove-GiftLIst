#!/usr/bin/env node

/**
 * Retroactively compute focal points for existing gift images
 * 
 * This script processes all gifts in the database that have images but are missing
 * focal point coordinates (imageFocalX/imageFocalY). It uses smartcrop-sharp to
 * analyze each image and compute optimal focal points, then updates the database.
 * 
 * Usage:
 *   NODE_ENV=production DATABASE_URL="<your_db_url>" node scripts/compute_focal_points.js
 * 
 * Options (via environment variables):
 *   BATCH_SIZE - Number of images to process at once (default: 10)
 *   DRY_RUN - Set to 'true' to preview changes without updating DB (default: false)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';
import smartcrop from 'smartcrop-sharp';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { eq, isNull, or } from 'drizzle-orm';
import * as schema from '../database/schema.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const BATCH_SIZE = parseInt(process.env.BATCH_SIZE || '10', 10);
const DRY_RUN = process.env.DRY_RUN === 'true';
const DATABASE_URL = process.env.DATABASE_URL;

// Validate DATABASE_URL
if (!DATABASE_URL) {
  console.error('❌ ERROR: DATABASE_URL environment variable is not set.');
  console.error('\nPlease provide the database connection string:');
  console.error('  NODE_ENV=production DATABASE_URL="postgresql://..." node scripts/compute_focal_points.js\n');
  process.exit(1);
}

// Initialize database connection
const client = postgres(DATABASE_URL);
const db = drizzle(client, { schema });

/**
 * Compute focal point for an image using smartcrop-sharp
 * @param {string} imagePath - Full path to the image file
 * @returns {Promise<{x: number, y: number} | null>} Normalized focal point or null on error
 */
async function computeFocalPoint(imagePath) {
  try {
    // Check if file exists
    await fs.promises.access(imagePath, fs.constants.R_OK);
    
    // Get image metadata
    const image = sharp(imagePath);
    const metadata = await image.metadata();
    
    if (!metadata.width || !metadata.height) {
      throw new Error('Invalid image dimensions');
    }
    
    // Run smartcrop analysis
    const result = await smartcrop.crop(imagePath, { 
      width: 500, 
      height: 150 
    });
    
    if (!result || !result.topCrop) {
      throw new Error('SmartCrop returned no result');
    }
    
    // Compute normalized focal point (center of crop region)
    const cropX = Math.floor(result.topCrop.x);
    const cropY = Math.floor(result.topCrop.y);
    const cropWidth = Math.floor(result.topCrop.width);
    const cropHeight = Math.floor(result.topCrop.height);
    
    const focalX = (cropX + cropWidth / 2) / metadata.width;
    const focalY = (cropY + cropHeight / 2) / metadata.height;
    
    // Round to 6 decimal places
    return {
      x: Math.round(focalX * 1000000) / 1000000,
      y: Math.round(focalY * 1000000) / 1000000,
    };
  } catch (err) {
    console.error(`  ⚠️  Failed to compute focal point: ${err.message}`);
    return null;
  }
}

/**
 * Process a batch of gifts
 */
async function processBatch(gifts) {
  const results = {
    processed: 0,
    updated: 0,
    skipped: 0,
    failed: 0,
  };
  
  for (const gift of gifts) {
    results.processed++;
    
    console.log(`\n[${results.processed}/${gifts.length}] Processing: ${gift.title}`);
    console.log(`  Image: ${gift.imageUrl}`);
    
    // Build full path to image
    const publicDir = path.join(process.cwd(), 'public');
    const imagePath = path.join(publicDir, gift.imageUrl);
    
    // Compute focal point
    const focalPoint = await computeFocalPoint(imagePath);
    
    if (!focalPoint) {
      console.log('  ❌ Skipped (computation failed)');
      results.failed++;
      continue;
    }
    
    console.log(`  ✓ Focal point: (${focalPoint.x}, ${focalPoint.y})`);
    
    if (DRY_RUN) {
      console.log('  ℹ️  DRY RUN - Would update database');
      results.updated++;
    } else {
      try {
        // Update database
        await db
          .update(schema.gifts)
          .set({
            imageFocalX: focalPoint.x,
            imageFocalY: focalPoint.y,
          })
          .where(eq(schema.gifts.id, gift.id));
        
        console.log('  ✓ Database updated');
        results.updated++;
      } catch (err) {
        console.error(`  ❌ Failed to update database: ${err.message}`);
        results.failed++;
      }
    }
  }
  
  return results;
}

/**
 * Main execution
 */
async function main() {
  console.log('🎁 Gift Image Focal Point Computation Script\n');
  console.log(`Database: ${DATABASE_URL.substring(0, 30)}...`);
  console.log(`Batch size: ${BATCH_SIZE}`);
  console.log(`Dry run: ${DRY_RUN ? 'YES' : 'NO'}\n`);
  
  try {
    // Find all gifts with images but missing focal points
    console.log('📊 Querying database for gifts with missing focal points...');
    
    const giftsToProcess = await db
      .select()
      .from(schema.gifts)
      .where(
        or(
          isNull(schema.gifts.imageFocalX),
          isNull(schema.gifts.imageFocalY)
        )
      );
    
    // Filter to only those with imageUrl
    const giftsWithImages = giftsToProcess.filter(g => g.imageUrl);
    
    if (giftsWithImages.length === 0) {
      console.log('\n✓ No gifts found with missing focal points. All done!');
      return;
    }
    
    console.log(`\nFound ${giftsWithImages.length} gift(s) with missing focal points.\n`);
    console.log('─'.repeat(60));
    
    // Process in batches
    const totalResults = {
      processed: 0,
      updated: 0,
      skipped: 0,
      failed: 0,
    };
    
    for (let i = 0; i < giftsWithImages.length; i += BATCH_SIZE) {
      const batch = giftsWithImages.slice(i, i + BATCH_SIZE);
      const batchResults = await processBatch(batch);
      
      totalResults.processed += batchResults.processed;
      totalResults.updated += batchResults.updated;
      totalResults.skipped += batchResults.skipped;
      totalResults.failed += batchResults.failed;
    }
    
    // Print summary
    console.log('\n' + '─'.repeat(60));
    console.log('\n📈 Summary:');
    console.log(`  Total processed: ${totalResults.processed}`);
    console.log(`  Successfully updated: ${totalResults.updated}`);
    console.log(`  Failed: ${totalResults.failed}`);
    
    if (DRY_RUN) {
      console.log('\nℹ️  This was a DRY RUN. No changes were made to the database.');
      console.log('   Run without DRY_RUN=true to apply changes.');
    } else {
      console.log('\n✅ All gifts processed successfully!');
    }
    
  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  } finally {
    // Close database connection
    await client.end();
  }
}

// Run the script
main().catch((err) => {
  console.error('Unhandled error:', err);
  process.exit(1);
});
