import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface AddGiftRequest {
  title: string;
  hyperlink: string;
  note?: string;
  imagePath?: string;
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
    const { title, hyperlink, note, imagePath }: AddGiftRequest = await req.json();
    
    if (!title || !hyperlink) {
      return new Response(
        JSON.stringify({ success: false, error: 'Title and hyperlink are required' }),
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
      console.info('[add-gift] Request received for title:', title, 'hyperlink:', hyperlink);
      console.info('[add-gift] Auth header present:', !!authHeader);
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
      console.info('[add-gift] Auth result:', { user, authError });
    }
    
    if (authError || !user) {
      console.error('Authentication failed - Error:', authError);
      console.error('Authentication failed - User:', user);
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

    // Insert the new gift
    const { data, error } = await supabase
      .from('gifts')
      .insert([
        {
          title,
          hyperlink,
          note: note || null,
          image_path: imagePath || null,
          bought: false,
          date_added: new Date().toISOString(),
        },
      ])
      .select();

    if (error) {
      if (DEBUG) console.error('Error adding gift:', error.message);
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
    console.error('Error in add-gift function:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
