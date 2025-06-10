import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

/**
 * Get CORS headers with configurable origin from environment variable
 * Set CORS_ALLOW_ORIGIN in Supabase Edge Function Secrets panel
 * Recommended: Use your production frontend URL (e.g., https://yourdomain.com)
 * Fallback: "*" for development (not recommended for production)
 */
function getCorsHeaders() {
  const origin = Deno.env.get('CORS_ALLOW_ORIGIN') || '*';
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-gift-buyer-id',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
}

interface ToggleBoughtRequest {
  giftId: string;
  bought: boolean;
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: getCorsHeaders() });
  }

  try {
    // Get the gift buyer ID from the request header
    const giftBuyerId = req.headers.get('x-gift-buyer-id');
    if (!giftBuyerId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Gift buyer ID is required' }),
        { 
          status: 400, 
          headers: { ...getCorsHeaders(), 'Content-Type': 'application/json' } 
        }
      );
    }

    // Parse the request body
    const { giftId, bought }: ToggleBoughtRequest = await req.json();
    
    if (!giftId || typeof bought !== 'boolean') {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid request parameters' }),
        { 
          status: 400, 
          headers: { ...getCorsHeaders(), 'Content-Type': 'application/json' } 
        }
      );
    }

    // Create Supabase client with service role key for all operations
    // We need service role to set the GUC and perform the operations
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Debug logging (only if DEBUG env is true)
    const DEBUG = Deno.env.get('DEBUG') === 'true';
    if (DEBUG) {
      console.info('[toggle-bought-status] Request for giftId:', giftId, 'bought:', bought, 'buyerId:', giftBuyerId);
    }

    // Set the GUC for RLS policy
    await supabase.rpc('set_config', {
      setting_name: 'request.headers.x-gift-buyer-id',
      new_value: giftBuyerId,
      is_local: true
    });

    // Get the current gift to check permissions
    const { data: currentGift, error: fetchError } = await supabase
      .from('gifts')
      .select('*')
      .eq('id', giftId)
      .single();

    if (fetchError) {
      if (DEBUG) console.error('Error fetching gift:', fetchError.message);
      return new Response(
        JSON.stringify({ success: false, error: 'Gift not found' }),
        { 
          status: 404, 
          headers: { ...getCorsHeaders(), 'Content-Type': 'application/json' } 
        }
      );
    }

    // Check if the user is allowed to toggle the bought status
    if (currentGift.bought && currentGift.bought_by_cookie !== giftBuyerId) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'You cannot unmark a gift that was marked by someone else' 
        }),
        { 
          status: 403, 
          headers: { ...getCorsHeaders(), 'Content-Type': 'application/json' } 
        }
      );
    }

    // Update the gift
    const updates = {
      bought,
      bought_by_cookie: bought ? giftBuyerId : null,
    };

    const { data, error } = await supabase
      .from('gifts')
      .update(updates)
      .eq('id', giftId)
      .select();

    if (error) {
      if (DEBUG) console.error('Error toggling bought status:', error.message);
      return new Response(
        JSON.stringify({ success: false, error: error.message }),
        { 
          status: 500, 
          headers: { ...getCorsHeaders(), 'Content-Type': 'application/json' } 
        }
      );
    }

    // Log the visitor interaction for abuse detection
    await logVisitorInteraction(supabase, giftBuyerId);

    return new Response(
      JSON.stringify({ success: true, data: data[0] }),
      { 
        headers: { ...getCorsHeaders(), 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in toggle-bought-status function:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...getCorsHeaders(), 'Content-Type': 'application/json' } 
      }
    );
  }
});

/**
 * Log a visitor interaction for abuse detection
 */
async function logVisitorInteraction(supabase: any, cookieId: string) {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Check if the visitor has already been logged today
    const { data: existingLog, error: fetchError } = await supabase
      .from('visitor_logs')
      .select('*')
      .eq('cookie_id', cookieId)
      .eq('visit_date', today)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error checking visitor log:', fetchError.message);
      return;
    }

    if (existingLog) {
      // Update the existing log
      await supabase
        .from('visitor_logs')
        .update({ interaction_count: existingLog.interaction_count + 1 })
        .eq('id', existingLog.id);
    } else {
      // Create a new log
      await supabase
        .from('visitor_logs')
        .insert([
          {
            ip_address: 'edge-function-ip',
            cookie_id: cookieId,
            visit_date: today,
            interaction_count: 1,
          },
        ]);
    }

    // Check for abuse (more than 12 unique visitors in a day)
    const { count, error: countError } = await supabase
      .from('visitor_logs')
      .select('*', { count: 'exact', head: true })
      .eq('visit_date', today);

    if (countError) {
      console.error('Error counting visitors:', countError.message);
      return;
    }

    if (count && count > 12) {
      console.warn('Abuse detected: More than 12 unique visitors today');
    }
  } catch (error) {
    console.error('Error logging visitor interaction:', error);
  }
}
