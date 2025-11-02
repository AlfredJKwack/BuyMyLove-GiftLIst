import db from '../../lib/db.js';
import { gifts } from '../../database/schema.js';
import { eq } from 'drizzle-orm';
import { requireAdmin } from '../../lib/auth.js';
import fs from 'fs';
import path from 'path';

// Helper function to safely delete an image file from the uploads directory
async function deleteImageFile(imageUrl) {
  if (!imageUrl) return;
  
  // Only delete files from /uploads/ path
  if (!imageUrl.startsWith('/uploads/')) return;
  
  try {
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    const fileName = path.basename(imageUrl); // Extract filename only (prevents path traversal)
    const filePath = path.join(uploadsDir, fileName);
    
    await fs.promises.unlink(filePath);
  } catch (err) {
    // Ignore if file doesn't exist (already deleted)
    if (err.code !== 'ENOENT') {
      console.error('Error deleting image file:', err);
    }
  }
}

async function handler(req, res) {
  const { method } = req;

  try {
    switch (method) {
      case 'POST': {
        // Add new gift
        const { title, note, url, imageUrl } = req.body;

        if (!title) {
          return res.status(400).json({ error: 'Title is required' });
        }

        const [newGift] = await db
          .insert(gifts)
          .values({
            title,
            note: note || null,
            url: url || null,
            imageUrl: imageUrl || null,
          })
          .returning();

        return res.status(201).json(newGift);
      }

      case 'PUT': {
        // Update existing gift
        const { id, title, note, url, imageUrl } = req.body;

        if (!id || !title) {
          return res.status(400).json({ error: 'ID and title are required' });
        }

        // Fetch existing gift to get old image URL
        const [existingGift] = await db
          .select()
          .from(gifts)
          .where(eq(gifts.id, id));

        if (!existingGift) {
          return res.status(404).json({ error: 'Gift not found' });
        }

        const newImageUrl = imageUrl || null;

        // Update the gift
        const [updatedGift] = await db
          .update(gifts)
          .set({
            title,
            note: note || null,
            url: url || null,
            imageUrl: newImageUrl,
          })
          .where(eq(gifts.id, id))
          .returning();

        // Delete old image file if it changed or was removed
        if (existingGift.imageUrl && existingGift.imageUrl !== newImageUrl) {
          await deleteImageFile(existingGift.imageUrl);
        }

        return res.status(200).json(updatedGift);
      }

      case 'DELETE': {
        // Delete gift
        const { id } = req.body;

        if (!id) {
          return res.status(400).json({ error: 'ID is required' });
        }

        // Fetch existing gift to get image URL before deletion
        const [existingGift] = await db
          .select()
          .from(gifts)
          .where(eq(gifts.id, id));

        if (!existingGift) {
          return res.status(404).json({ error: 'Gift not found' });
        }

        // Delete from database
        await db
          .delete(gifts)
          .where(eq(gifts.id, id));

        // Delete associated image file if exists
        await deleteImageFile(existingGift.imageUrl);

        return res.status(200).json({ success: true });
      }

      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Error in gift API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// Export with admin authentication middleware
export default requireAdmin(handler);
