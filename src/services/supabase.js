import { createClient } from '@supabase/supabase-js';
import { getCookieId } from '../utils/cookies';

// Use environment variables or fallback to development values
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://example.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV4YW1wbGUiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYxNjQyMjY4Nywic3ViIjoiYW5vbiJ9.example';

if (supabaseUrl === 'https://example.supabase.co' || supabaseAnonKey.includes('example')) {
  console.warn('Using development Supabase credentials. Set up your .env.local file for production.');
}

// Create a Supabase client with custom headers
let supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  global: {
    headers: {
      'x-gift-buyer-id': getCookieId(),
    },
  },
});

// Export the current client instance
export const supabase = supabaseClient;

// Function to reset the Supabase client with updated headers
export const resetSupabaseClient = () => {
  const cookieId = getCookieId();
  console.info('Resetting Supabase client with new gift buyer ID:', cookieId);
  
  // Create a new client with the updated cookie ID
  supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        'x-gift-buyer-id': cookieId,
      },
    },
  });
  
  // Update the exported reference
  Object.assign(supabase, supabaseClient);
  
  return supabaseClient;
};

// Function to update the gift buyer header when cookie changes (deprecated - use resetSupabaseClient)
export const updateGiftBuyerHeader = () => {
  const cookieId = getCookieId();
  // Note: Supabase client headers are set at initialization time
  // For dynamic headers, we need to recreate the client or use a different approach
  console.info('Current gift buyer ID:', cookieId);
};

// Auth state change listener
let authStateChangeListener = null;

/**
 * Set up auth state change listener
 * @param {Function} callback - Function to call when auth state changes
 * @returns {Function} Unsubscribe function
 */
export const setupAuthStateListener = (callback) => {
  // Remove existing listener if any
  if (authStateChangeListener) {
    authStateChangeListener.subscription.unsubscribe();
  }

  // Set up new listener
  authStateChangeListener = supabase.auth.onAuthStateChange((event, session) => {
    console.info('Auth state changed:', event, session?.user?.email);
    callback(event, session);
  });

  return () => {
    if (authStateChangeListener) {
      authStateChangeListener.subscription.unsubscribe();
      authStateChangeListener = null;
    }
  };
};

// No mocking - using real Supabase client

/**
 * Get the current session
 * @returns {Promise<Object|null>} The current session or null if not authenticated
 */
export const getSession = async () => {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.error('Error getting session:', error.message);
      return null;
    }
    return data.session;
  } catch (error) {
    console.error('Error getting session:', error);
    return null;
  }
};


/**
 * Sign in with OTP (One-Time Password)
 * @param {string} email - The email to send the OTP to
 * @returns {Promise<{success: boolean, error: string|null}>} Result of the operation
 */
export const signInWithOTP = async (email) => {
  try {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: false, // Only allow existing users to sign in
        emailRedirectTo: window.location.origin,
      },
    });

    if (error) {
      // Log the error to console but don't expose it in the UI
      console.error('Error sending OTP:', error.message);
      
      // Return success regardless of whether the user exists
      // This prevents leaking information about which emails are registered
      return { success: true, error: null };
    }

    return { success: true, error: null };
  } catch (error) {
    console.error('Error sending OTP:', error);
    // Return a generic error message to avoid leaking information
    return { success: false, error: 'An unexpected error occurred' };
  }
};

/**
 * Sign out the current user
 * @returns {Promise<{success: boolean, error: string|null}>} Result of the operation
 */
export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('Error signing out:', error.message);
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (error) {
    console.error('Error signing out:', error);
    return { success: false, error: error.message || 'An unexpected error occurred' };
  }
};
