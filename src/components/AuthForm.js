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
      
      console.warn('AuthForm received auth state change:', isAuthenticated);
      
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
      <div class="login-form">
        <h2>Admin Login</h2>
        
        <form id="login-form">
          <div class="form-group">
            <label for="email" class="form-label">Email</label>
            <input type="email" id="email" name="email" required
              class="form-input"
              placeholder="Enter admin email">
          </div>
          
          <div class="form-group">
            <button type="submit" id="login-btn"
              class="btn btn-primary w-full ${this.isLoading ? 'disabled' : ''}">
              ${this.isLoading ? 'Sending Login Link...' : 'Send Login Link'}
            </button>
          </div>
        </form>
        
        <div id="login-message" class="form-message hidden"></div>
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
      <div class="admin-panel">
        <h2>Admin Panel</h2>
        
        <div class="admin-info">
          <p>You are logged in as an admin and can manage gifts.</p>
          <span class="admin-email">Logged in as: ${this.email}</span>
        </div>
        
        <div class="admin-actions">
          <a href="#/" class="admin-link" id="gift-list-link">
            View Gift List
          </a>
          
          <button id="logout-btn" class="btn btn-secondary w-full">
            Logout
          </button>
        </div>
      </div>
    `;
    
    // Add event listeners
    document.getElementById('logout-btn').addEventListener('click', () => this.handleLogout());
    document.getElementById('gift-list-link').addEventListener('click', (e) => {
      e.preventDefault();
      window.location.hash = '/';
    });
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
      messageEl.className = 'form-message';
      
      if (type === 'success') {
        messageEl.classList.add('success');
      } else if (type === 'error') {
        messageEl.classList.add('error');
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
