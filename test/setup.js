// This file contains setup code for tests

// Mock the crypto.randomUUID function
if (!globalThis.crypto) {
  globalThis.crypto = {
    randomUUID: () => 'test-uuid-' + Math.random().toString(36).substring(2, 15),
  };
}

// Mock environment variables
import.meta.env = {
  ...import.meta.env,
  VITE_SUPABASE_URL: 'https://test-project.supabase.co',
  VITE_SUPABASE_ANON_KEY: 'test-anon-key',
  VITE_ADMIN_EMAIL: 'admin@example.com',
  VITE_APP_NAME: 'Gift List Test',
};
