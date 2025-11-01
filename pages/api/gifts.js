import db from '../../lib/db.js';
import { gifts, toggles } from '../../database/schema.js';
import { desc, eq } from 'drizzle-orm';

// Helper to extract visitor ID from cookie
function getVisitorId(req) {
  if (!req.headers.cookie) return null;
  
  const cookies = req.headers.cookie.split(';').reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split('=');
    acc[key] = value;
    return acc;
  }, {});
  
  return cookies.visitor_id || null;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const visitorId = getVisitorId(req);

    // Fetch all gifts ordered by newest first
    const allGifts = await db.select().from(gifts).orderBy(desc(gifts.createdAt));

    // Fetch ALL toggles for all gifts to determine global bought status
    const allToggles = await db.select().from(toggles);
    
    // Create a map of gift ID to toggle info
    const toggleMap = allToggles.reduce((acc, toggle) => {
      if (toggle.bought) {
        acc[toggle.giftId] = {
          bought: true,
          boughtBy: toggle.visitorId,
        };
      }
      return acc;
    }, {});
    
    // Add bought status and buyer info to each gift
    const giftData = allGifts.map(gift => {
      const toggleInfo = toggleMap[gift.id];
      return {
        ...gift,
        bought: toggleInfo?.bought || false,
        boughtBy: toggleInfo?.boughtBy || null,
        canToggle: !toggleInfo || toggleInfo.boughtBy === visitorId,
      };
    });

    return res.status(200).json(giftData);
  } catch (error) {
    console.error('Error fetching gifts:', error);
    return res.status(500).json({ error: 'Failed to fetch gifts' });
  }
}
