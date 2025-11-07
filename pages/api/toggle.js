import db from '../../lib/db.js';
import { toggles } from '../../database/schema.js';
import { eq, and } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { extractTokenFromCookie, verifyToken } from '../../lib/auth.js';
import { serialize, parse } from 'cookie';

// Helper to extract visitor ID from cookie or create new one (supports both __Host- and legacy names)
function getOrCreateVisitorId(req) {
  const cookies = parse(req.headers.cookie || '');
  return cookies['__Host-visitor_id'] || cookies['visitor_id'] || uuidv4();
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { giftId, bought } = req.body;

    if (!giftId || typeof bought !== 'boolean') {
      return res.status(400).json({ error: 'Invalid request body' });
    }

    const visitorId = getOrCreateVisitorId(req);

    // Check if any toggle exists for this gift (global bought status)
    const existingToggles = await db
      .select()
      .from(toggles)
      .where(eq(toggles.giftId, giftId))
      .limit(1);

    const existingToggle = existingToggles.length > 0 ? existingToggles[0] : null;

    // Check if user is admin (verify JWT token)
    const token = extractTokenFromCookie(req.headers.cookie);
    const decoded = token && verifyToken(token);
    const isAdmin = decoded?.type === 'admin';

    if (bought) {
      // User wants to mark as bought
      if (existingToggle && existingToggle.bought) {
        // Already bought by someone
        if (existingToggle.visitorId === visitorId || isAdmin) {
          // Same user or admin - allow (no-op or update)
          return res.status(200).json({ success: true, bought: true, boughtBy: existingToggle.visitorId });
        } else {
          // Different user - not allowed
          return res.status(403).json({ 
            error: 'This item is already marked as bought by another user',
            bought: true,
            boughtBy: existingToggle.visitorId
          });
        }
      } else {
        // Not bought yet - create or update toggle
        if (existingToggle) {
          // Update existing record
          await db
            .update(toggles)
            .set({ bought: true, visitorId })
            .where(eq(toggles.giftId, giftId));
        } else {
          // Create new record
          await db.insert(toggles).values({
            giftId,
            visitorId,
            bought: true,
          });
        }
      }
    } else {
      // User wants to mark as not bought
      if (!existingToggle || !existingToggle.bought) {
        // Already not bought - no-op
        return res.status(200).json({ success: true, bought: false });
      }

      // Check permission to unbuy
      if (existingToggle.visitorId !== visitorId && !isAdmin) {
        return res.status(403).json({ 
          error: 'Only the user who bought this item or an admin can mark it as not bought',
          bought: true,
          boughtBy: existingToggle.visitorId
        });
      }

      // Remove the toggle (unbuy)
      await db
        .delete(toggles)
        .where(eq(toggles.giftId, giftId));
    }

    // Set visitor_id cookie if not already set
    const cookies = parse(req.headers.cookie || '');
    const hasVisitorCookie = Boolean(cookies['__Host-visitor_id'] || cookies['visitor_id']);
    if (!hasVisitorCookie) {
      const isProd = process.env.NODE_ENV === 'production';
      const visitorCookie = serialize(isProd ? '__Host-visitor_id' : 'visitor_id', visitorId, {
        httpOnly: true,
        secure: isProd,
        sameSite: 'strict',
        path: '/',
        maxAge: 60 * 60 * 24 * 365
      });
      res.setHeader('Set-Cookie', visitorCookie);
    }

    return res.status(200).json({ 
      success: true, 
      bought,
      boughtBy: bought ? visitorId : null
    });
  } catch (error) {
    console.error('Error toggling bought status:', error);
    return res.status(500).json({ error: 'Failed to toggle bought status' });
  }
}
