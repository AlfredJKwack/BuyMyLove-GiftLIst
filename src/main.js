import './style.css';
import { App } from './components/App';
import { getCookieId } from './utils/cookies';

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Get or create a cookie ID for the current user
  const cookieId = getCookieId();
  console.log('App initialized with cookie ID:', cookieId);
  
  // Initialize the app
  const appContainer = document.getElementById('app');
  if (appContainer) {
    new App(appContainer);
  }
});
