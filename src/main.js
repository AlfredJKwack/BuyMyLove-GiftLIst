import './style.css';
import { App } from './components/App';
import { supabase } from './services/supabase';

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('App initialized');
  
  // Initialize the main App component
  const appContainer = document.getElementById('app');
  const app = new App(appContainer);
  
  // Set up Supabase auth state listener
  supabase.auth.onAuthStateChange((event, session) => {
    console.log('Auth state changed:', event);
    
    // Dispatch a custom event that will be handled by the App component
    window.dispatchEvent(new CustomEvent('authStateChanged', { 
      detail: { 
        event, 
        session,
        isAuthenticated: !!session 
      } 
    }));
  });
});
