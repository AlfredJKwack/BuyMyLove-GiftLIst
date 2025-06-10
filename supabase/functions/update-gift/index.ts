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
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
}

interface UpdateGiftRequest {
  giftId: string;
  updates: {
    title?: string;
    hyperlink?: string;
    note?: string;
    image_path?: string;
  };
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: getCorsHeaders() });
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Authorization required' }),
        { 
          status: 401, 
          headers: { ...getCorsHeaders(), 'Content-Type': 'application/json' } 
        }
      );
    }

    // Parse the request body
    const { giftId, updates }: UpdateGiftRequest = await req.json();
    
    if (!giftId || !updates) {
      return new Response(
        JSON.stringify({ success: false, error: 'Gift ID and updates are required' }),
        { 
          status: 400, 
          headers: { ...getCorsHeaders(), 'Content-Type': 'application/json' } 
        }
      );
    }

    // Extract JWT token from Authorization header
    const token = authHeader?.replace('Bearer ', '');
    // Create anon client for user authentication, passing JWT for RLS
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      }
    );

    // Debug logging (only if DEBUG env is true)
    const DEBUG = Deno.env.get('DEBUG') === 'true';
    if (DEBUG) {
      console.info('[update-gift] Request received for giftId:', giftId);
      console.info('[update-gift] Updates:', updates);
      console.info('[update-gift] Auth header present:', !!authHeader);
    }

    if (!token) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid authorization header format' }),
        { 
          status: 401, 
          headers: { ...getCorsHeaders(), 'Content-Type': 'application/json' } 
        }
      );
    }

    // Verify the user is authenticated using anon client with token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (DEBUG) {
      console.info('[update-gift] Auth result:', { user, authError });
    }
    
    if (authError || !user) {
      console.error('Authentication failed - Error:', authError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid authentication',
          debug: {
            hasAuthHeader: !!authHeader,
            hasToken: !!token,
            authError: authError?.message,
            hasUser: !!user
          }
        }),
        { 
          status: 401, 
          headers: { ...getCorsHeaders(), 'Content-Type': 'application/json' } 
        }
      );
    }

    // If there's a new image path, check if we need to delete the old one
    if (updates.image_path) {
      const { data: currentGift, error: fetchError } = await supabase
        .from('gifts')
        .select('image_path')
        .eq('id', giftId)
        .single();
      
      if (!fetchError && currentGift && currentGift.image_path && currentGift.image_path !== updates.image_path) {
        // Delete the old image from storage
        await deleteImageFromStorage(supabase, currentGift.image_path);
      }
    }

    // Update the gift
    const { data, error } = await supabase
      .from('gifts')
      .update(updates)
      .eq('id', giftId)
      .select();
    if (DEBUG) {
      console.info('[update-gift] Update response:', { data, error });
    }

    if (error) {
      console.error('Error updating gift:', error.message);
      return new Response(
        JSON.stringify({ success: false, error: error.message }),
        { 
          status: 500, 
          headers: { ...getCorsHeaders(), 'Content-Type': 'application/json' } 
        }
      );
    }

    return new Response(
      JSON.stringify({ success: true, data: data[0] }),
      { 
        headers: { ...getCorsHeaders(), 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in update-gift function:', error);
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
 * Delete an image from Supabase Storage
 */
async function deleteImageFromStorage(supabase: any, imagePath: string) {
  try {
    if (!imagePath) return;
    
    // Extract the filename from the URL
    const urlParts = imagePath.split('/');
    const filename = urlParts[urlParts.length - 1];
    
    if (!filename) {
      console.warn('Could not extract filename from image path:', imagePath);
      return;
    }
    
    const filePath = `gift-images/${filename}`;
    
    // Delete the file from storage
    const { error } = await supabase.storage
      .from('gift-images')
      .remove([filePath]);
    
    if (error) {
      console.error('Error deleting image from storage:', error.message);
    }
  } catch (error) {
    console.error('Error in image deletion process:', error);
  }
}
