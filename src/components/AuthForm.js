import { signInWithOTP, signOut, getSession } from '../services/supabase';

/**
 * Authentication Form Component
 * Handles admin login and logout
 */
export class AuthForm {
  constructor(container) {
    this.container = container;
    this.isAuthenticated = false;
    this.isLoading = false;
    this.email = '';
    
    this.init();
  }

  /**
   * Initialize the component
   */
  async init() {
    // Check if the user is already authenticated
    const session = await getSession();
    this.isAuthenticated = !!session;
    
    if (this.isAuthenticated && session.user) {
      this.email = session.user.email;
    }
    
    this.render();
    
    // Set up auth state change listener
    this.setupAuthStateListener();
  }

  /**
   * Set up auth state change listener
   */
  setupAuthStateListener() {
    window.addEventListener('authStateChanged', (e) => {
      const { session, isAuthenticated } = e.detail;
      
      console.log('AuthForm received auth state change:', isAuthenticated);
      
      this.isAuthenticated = isAuthenticated;
      
      if (isAuthenticated && session?.user) {
        this.email = session.user.email;
      } else {
        this.email = '';
      }
      
      // Re-render the component
      this.render();
    });
  }

  /**
   * Render the authentication form
   */
  render() {
    if (this.isAuthenticated) {
      this.renderLoggedInState();
    } else {
      this.renderLoginForm();
    }
  }

  /**
   * Render the login form
   */
  renderLoginForm() {
    this.container.innerHTML = `
      <div class="bg-white shadow-md rounded-lg p-6 max-w-md mx-auto">
        <h2 class="text-xl font-semibold text-gray-800 mb-4">Admin Login</h2>
        
        <form id="login-form" class="space-y-4">
          <div>
            <label for="email" class="block text-sm font-medium text-gray-700">Email</label>
            <input type="email" id="email" name="email" required
              class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter admin email">
          </div>
          
          <div>
            <button type="submit" id="login-btn"
              class="btn btn-primary w-full ${this.isLoading ? 'disabled' : ''}">
              ${this.isLoading ? 'Sending Login Link...' : 'Send Login Link'}
            </button>
          </div>
        </form>
        
        <div id="login-message" class="mt-4 hidden"></div>
      </div>
    `;
    
    // Add event listeners
    document.getElementById('login-form').addEventListener('submit', (e) => this.handleLogin(e));
  }

  /**
   * Render the logged-in state
   */
  renderLoggedInState() {
    this.container.innerHTML = `
      <div class="bg-white shadow-md rounded-lg p-6 max-w-md mx-auto">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-xl font-semibold text-gray-800">Admin Panel</h2>
          <span class="text-sm text-gray-500">Logged in as ${this.email}</span>
        </div>
        
        <p class="text-gray-600 mb-4">You are logged in as an admin and can manage gifts.</p>
        
        <button id="logout-btn" class="btn btn-secondary w-full">
          Logout
        </button>
      </div>
    `;
    
    // Add event listeners
    document.getElementById('logout-btn').addEventListener('click', () => this.handleLogout());
  }

  /**
   * Handle login form submission
   * @param {Event} e - The submit event
   */
  async handleLogin(e) {
    e.preventDefault();
    
    if (this.isLoading) return;
    
    const form = e.target;
    const email = form.email.value.trim();
    const loginBtn = document.getElementById('login-btn');
    const messageEl = document.getElementById('login-message');
    
    // Validate email
    if (!email) {
      this.showMessage('Please enter your email address.', 'error');
      return;
    }
    
    // Set loading state
    this.isLoading = true;
    loginBtn.disabled = true;
    loginBtn.textContent = 'Sending Login Link...';
    
    try {
      const result = await signInWithOTP(email);
      
      // Always show a generic success message regardless of whether the email exists
      // This prevents leaking information about which emails are registered
      if (result.success) {
        this.showMessage(`Login link sent to ${email}. Please check your email.`, 'success');
        form.reset();
      } else {
        // Only show a generic error for unexpected errors
        this.showMessage(result.error || 'Failed to send login link. Please try again.', 'error');
      }
    } catch (error) {
      console.error('Error sending login link:', error);
      this.showMessage('An error occurred. Please try again later.', 'error');
    } finally {
      // Reset loading state
      this.isLoading = false;
      loginBtn.disabled = false;
      loginBtn.textContent = 'Send Login Link';
    }
  }

  /**
   * Handle logout
   */
  async handleLogout() {
    try {
      const result = await signOut();
      
      if (result.success) {
        this.isAuthenticated = false;
        this.email = '';
        this.render();
        
        // Notify the app that the user logged out
        window.dispatchEvent(new CustomEvent('authStateChanged', { detail: { isAuthenticated: false } }));
      } else {
        alert(result.error || 'Failed to log out. Please try again.');
      }
    } catch (error) {
      console.error('Error logging out:', error);
      alert('An error occurred. Please try again later.');
    }
  }

  /**
   * Show a message in the login form
   * @param {string} message - The message to display
   * @param {string} type - The type of message ('success' or 'error')
   */
  showMessage(message, type = 'info') {
    const messageEl = document.getElementById('login-message');
    
    if (messageEl) {
      messageEl.textContent = message;
      messageEl.className = 'mt-4 p-3 rounded text-sm';
      
      if (type === 'success') {
        messageEl.classList.add('bg-green-100', 'text-green-800');
      } else if (type === 'error') {
        messageEl.classList.add('bg-red-100', 'text-red-800');
      } else {
        messageEl.classList.add('bg-blue-100', 'text-blue-800');
      }
      
      messageEl.classList.remove('hidden');
    }
  }

  /**
   * Check if the user is authenticated
   * @returns {Promise<boolean>} True if the user is authenticated
   */
  async checkAuth() {
    const session = await getSession();
    this.isAuthenticated = !!session;
    
    if (this.isAuthenticated && session.user) {
      this.email = session.user.email;
    }
    
    return this.isAuthenticated;
  }
}
