import { createClient } from '@supabase/supabase-js';

// Use environment variables or fallback to development values
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://example.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV4YW1wbGUiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYxNjQyMjY4Nywic3ViIjoiYW5vbiJ9.example';

if (supabaseUrl === 'https://example.supabase.co' || supabaseAnonKey.includes('example')) {
  console.warn('Using development Supabase credentials. Set up your .env.local file for production.');
}

// Create a Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
 * Check if the current user is an admin
 * @returns {Promise<boolean>} True if the user is an admin
 */
export const isAdmin = async () => {
  try {
    const session = await getSession();
    if (!session) return false;
    
    const adminEmail = import.meta.env.VITE_ADMIN_EMAIL;
    return session.user.email === adminEmail;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
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
