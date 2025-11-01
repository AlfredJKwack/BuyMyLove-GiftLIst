import db from '../../lib/db.js';
import { gifts } from '../../database/schema.js';
import { eq } from 'drizzle-orm';
import { requireAdmin } from '../../lib/auth.js';

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

        const [updatedGift] = await db
          .update(gifts)
          .set({
            title,
            note: note || null,
            url: url || null,
            imageUrl: imageUrl || null,
          })
          .where(eq(gifts.id, id))
          .returning();

        if (!updatedGift) {
          return res.status(404).json({ error: 'Gift not found' });
        }

        return res.status(200).json(updatedGift);
      }

      case 'DELETE': {
        // Delete gift
        const { id } = req.body;

        if (!id) {
          return res.status(400).json({ error: 'ID is required' });
        }

        const [deletedGift] = await db
          .delete(gifts)
          .where(eq(gifts.id, id))
          .returning();

        if (!deletedGift) {
          return res.status(404).json({ error: 'Gift not found' });
        }

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
