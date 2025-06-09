import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

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
    const { giftId, updates }: UpdateGiftRequest = await req.json();
    
    if (!giftId || !updates) {
      return new Response(
        JSON.stringify({ success: false, error: 'Gift ID and updates are required' }),
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

    // Debug logging
    console.log('=== DEBUGGING AUTH FLOW ===');
    console.log('Raw authorization header:', authHeader);
    console.log('Header length:', authHeader?.length);
    console.log('Starts with Bearer:', authHeader?.startsWith('Bearer '));
    console.log('Supabase URL:', Deno.env.get('SUPABASE_URL'));
    console.log('Anon key available:', !!Deno.env.get('SUPABASE_ANON_KEY'));
    console.log('Anon key first 20 chars:', Deno.env.get('SUPABASE_ANON_KEY')?.substring(0, 20));
    console.log('Extracted token length:', token?.length);
    console.log('Token first 20 chars:', token?.substring(0, 20));
    console.log('Token last 20 chars:', token?.substring(token.length - 20));
    console.log('Token has 3 parts (JWT format):', token?.split('.').length === 3);

    if (!token) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid authorization header format' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Verify the user is authenticated using anon client with token
    console.log('Calling supabase.auth.getUser() with token...');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    // Debug logging for auth result
    console.log('=== AUTH RESULT ===');
    console.log('Auth error:', authError);
    console.log('Auth error type:', typeof authError);
    console.log('Auth error message:', authError?.message);
    console.log('User object:', user);
    console.log('User ID:', user?.id);
    console.log('User email:', user?.email);
    console.log('User role:', user?.role);
    console.log('User aud:', user?.aud);
    console.log('=== END AUTH RESULT ===');
    
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
    
    console.log('=== BEGIN DB PAYLOADS ===');
    console.log('giftId:', giftId);
    console.log('updates:', updates);
    console.log('Update gift response:', data, error);
    console.log('=== END DB PAYLOADS ===');

    if (error) {
      console.error('Error updating gift:', error.message);
      return new Response(
        JSON.stringify({ success: false, error: error.message }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    return new Response(
      JSON.stringify({ success: true, data: data[0] }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in update-gift function:', error);
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
