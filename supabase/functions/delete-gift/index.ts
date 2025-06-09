import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface DeleteGiftRequest {
  giftId: string;
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Authorization required' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Parse the request body
    const { giftId }: DeleteGiftRequest = await req.json();
    
    if (!giftId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Gift ID is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
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
      console.info('[delete-gift] Request received for giftId:', giftId);
      console.info('[delete-gift] Auth header present:', !!authHeader);
    }

    if (!token) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid authorization header format' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Verify the user is authenticated using service role client with token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    // Debug logging for auth result
    if (DEBUG) {
      console.info('[delete-gift] Auth result:', { user, authError });
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
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // First, get the gift to retrieve its image path
    const { data: gift, error: fetchError } = await supabase
      .from('gifts')
      .select('image_path')
      .eq('id', giftId)
      .single();
    
    if (fetchError) {
      if (DEBUG) console.error('Error fetching gift for deletion:', fetchError.message);
      return new Response(
        JSON.stringify({ success: false, error: 'Gift not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // If the gift has an image, delete it from storage
    if (gift && gift.image_path) {
      await deleteImageFromStorage(supabase, gift.image_path);
    }

    // Now delete the gift record
    const { error } = await supabase
      .from('gifts')
      .delete()
      .eq('id', giftId);
    
    if (error) {
      if (DEBUG) console.error('Error deleting gift:', error.message);
      return new Response(
        JSON.stringify({ success: false, error: error.message }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in delete-gift function:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
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
