import { GiftList } from './GiftList';
import { GiftForm } from './GiftForm';
import { AuthForm } from './AuthForm';
import { supabase } from '../services/supabase';
import { deleteGift } from '../services/giftService';

/**
 * Main App Component
 * Orchestrates the entire application with hash-based routing
 */
export class App {
  constructor(container) {
    this.container = container;
    this.isAdminUser = false;
    this.currentRoute = '/';
    
    // Get existing containers
    this.giftListContainer = document.getElementById('gift-list-container');
    this.adminModal = document.getElementById('admin-modal');
    this.adminModalBody = document.getElementById('admin-modal-body');
    this.giftFormModal = document.getElementById('gift-form-modal');
    this.giftFormModalBody = document.getElementById('gift-form-modal-body');
    
    // Initialize components
    this.giftList = new GiftList(this.giftListContainer);
    this.giftForm = new GiftForm(this.giftFormModalBody);
    // Don't initialize AuthForm immediately - it will be initialized when needed
    this.authForm = null;
    
    this.init();
  }

  /**
   * Initialize the app
   */
  async init() {
    // Check if the user is an admin
    this.isAdminUser = await isAdmin();
    
    // Update the gift list with admin status
    this.giftList.isAdminUser = this.isAdminUser;
    
    // Set up event listeners
    this.setupEventListeners();
    
    // Set up routing
    this.setupRouting();
    
    // Set up auth state listener
    this.setupAuthStateListener();
    
    // Handle initial route
    this.handleRouteChange();
  }

  /**
   * Set up event listeners
   */
  setupEventListeners() {
    // Gift form events
    window.addEventListener('openAddGiftForm', () => {
      this.giftForm.showAddForm();
    });
    
    window.addEventListener('editGift', (e) => {
      this.giftForm.showEditForm(e.detail);
    });
    
    window.addEventListener('deleteGift', (e) => {
      this.handleDeleteGift(e.detail.id);
    });
    
    window.addEventListener('giftUpdated', () => {
      this.giftList.loadGifts();
    });

    // Modal events
    this.setupModalEvents();
  }

  /**
   * Set up modal event listeners
   */
  setupModalEvents() {
    // Close admin modal when clicking overlay
    this.adminModal.addEventListener('click', (e) => {
      if (e.target === this.adminModal || e.target.classList.contains('admin-modal-overlay')) {
        this.closeAdminModal();
      }
    });

    // Close gift form modal when clicking overlay
    this.giftFormModal.addEventListener('click', (e) => {
      if (e.target === this.giftFormModal || e.target.classList.contains('admin-modal-overlay')) {
        this.giftForm.hide();
      }
    });

    // Close modals with Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (!this.adminModal.classList.contains('hidden')) {
          this.closeAdminModal();
        } else if (!this.giftFormModal.classList.contains('hidden')) {
          this.giftForm.hide();
        }
      }
    });
  }

  /**
   * Set up hash-based routing
   */
  setupRouting() {
    // Listen for hash changes
    window.addEventListener('hashchange', () => {
      this.handleRouteChange();
    });
  }

  /**
   * Handle route changes
   */
  handleRouteChange() {
    const hash = window.location.hash;
    
    // Check for errors in the hash first
    if (this.checkForErrors(hash)) {
      return; // Error modal will be shown, don't process other routes
    }
    
    if (hash === '#/admin') {
      this.currentRoute = '/admin';
      this.showAdminModal();
    } else {
      this.currentRoute = '/';
      this.closeAdminModal();
    }
    
    console.info('Route changed to:', this.currentRoute);
  }

  /**
   * Show the admin modal
   */
  showAdminModal() {
    // Initialize AuthForm if not already done
    if (!this.authForm) {
      this.authForm = new AuthForm(this.adminModalBody);
    }
    
    this.adminModal.classList.remove('hidden');
    // Focus trap - focus the modal content
    this.adminModalBody.focus();
  }

  /**
   * Close the admin modal and navigate to home
   */
  closeAdminModal() {
    this.adminModal.classList.add('hidden');
    
    // Update URL if we're currently on admin route
    if (this.currentRoute === '/admin') {
      window.location.hash = '/';
    }
    
    // Reinitialize the AuthForm when closing the modal
    // This ensures the modal content is reset to the proper auth form
    setTimeout(() => {
      if (this.authForm) {
        this.authForm.render();
      }
    }, 100);
  }

  /**
   * Set up auth state listener
   */
  setupAuthStateListener() {
    // Set up Supabase auth state listener
    supabase.auth.onAuthStateChange(async (event, session) => {
      console.warn('Auth state change detected in App:', event);
      this.isAdminUser = await isAdmin();
      this.giftList.isAdminUser = this.isAdminUser;
      this.giftList.loadGifts();
      window.dispatchEvent(new CustomEvent('authStateChanged', { 
        detail: { 
          event, 
          session, 
          isAuthenticated: !!session 
        } 
      }));
    });

    // Also listen for custom auth state changes (for backward compatibility)
    window.addEventListener('authStateChanged', async (e) => {
      this.isAdminUser = await isAdmin();
      this.giftList.isAdminUser = this.isAdminUser;
      this.giftList.loadGifts();
    });
  }

  /**
   * Check for errors in the URL hash
   * @param {string} hash - The current URL hash
   * @returns {boolean} True if an error was found and handled
   */
  checkForErrors(hash) {
    // Parse error parameters from hash
    const errorMatch = hash.match(/[#&]error=([^&]+)/);
    const errorCodeMatch = hash.match(/[#&]error_code=([^&]+)/);
    const errorDescriptionMatch = hash.match(/[#&]error_description=([^&]+)/);
    
    if (errorMatch) {
      const error = decodeURIComponent(errorMatch[1]);
      const errorCode = errorCodeMatch ? decodeURIComponent(errorCodeMatch[1]) : '';
      const errorDescription = errorDescriptionMatch ? decodeURIComponent(errorDescriptionMatch[1].replace(/\+/g, ' ')) : '';
      
      console.error('Authentication error detected:', { error, errorCode, errorDescription });
      
      // Show error modal
      this.showErrorModal(error, errorCode, errorDescription);
      
      // Clean up the URL hash
      window.history.replaceState(null, null, window.location.pathname);
      
      return true;
    }
    
    return false;
  }

  /**
   * Show error modal with the given error details
   * @param {string} error - The error type
   * @param {string} errorCode - The error code
   * @param {string} errorDescription - The error description
   */
  showErrorModal(error, errorCode, errorDescription) {
    // Get user-friendly error message
    const errorMessage = this.getErrorMessage(error, errorCode, errorDescription);
    
    // Set the admin modal content to show the error
    this.adminModalBody.innerHTML = `
      <div class="admin-panel">
        <h2>Authentication Error</h2>
        
        <div class="admin-info">
          <p>${errorMessage}</p>
        </div>
        
        <div class="admin-actions">
          <button id="error-close-btn" class="btn btn-primary w-full">
            Close
          </button>
          
          <a href="#/admin" class="admin-link" id="try-again-link">
            Try Login Again
          </a>
        </div>
      </div>
    `;
    
    // Show the modal
    this.adminModal.classList.remove('hidden');
    this.adminModalBody.focus();
    
    // Add event listeners
    document.getElementById('error-close-btn').addEventListener('click', () => {
      this.closeAdminModal();
    });
    
    document.getElementById('try-again-link').addEventListener('click', (e) => {
      e.preventDefault();
      this.closeAdminModal();
      // Small delay to ensure modal is closed before reopening
      setTimeout(() => {
        window.location.hash = '#/admin';
      }, 100);
    });
  }

  /**
   * Get user-friendly error message based on error details
   * @param {string} error - The error type
   * @param {string} errorCode - The error code
   * @param {string} errorDescription - The error description
   * @returns {string} User-friendly error message
   */
  getErrorMessage(error, errorCode, errorDescription) {
    // Map common error codes to user-friendly messages
    const errorMessages = {
      'otp_expired': 'Your login link has expired. Please request a new one.',
      'access_denied': 'Access was denied. This may be due to an expired or invalid link.',
      'invalid_request': 'The login request was invalid. Please try again.',
      'server_error': 'A server error occurred. Please try again later.',
      'rate_limit_exceeded': 'Too many requests. Please wait a moment before trying again.'
    };
    
    // Check for specific error codes first
    if (errorCode && errorMessages[errorCode]) {
      return errorMessages[errorCode];
    }
    
    // Check for general error types
    if (error === 'access_denied') {
      return errorMessages['access_denied'];
    }
    
    // Fallback to error description or generic message
    if (errorDescription && errorDescription !== 'undefined') {
      return errorDescription;
    }
    
    return 'An authentication error occurred. Please try logging in again.';
  }

  /**
   * Handle deleting a gift
   * @param {string} id - The ID of the gift to delete
   */
  async handleDeleteGift(id) {
    try {
      const result = await deleteGift(id);
      
      if (result.success) {
        this.giftList.loadGifts();
      } else {
        alert(result.error || 'Failed to delete gift');
      }
    } catch (error) {
      console.error('Error deleting gift:', error);
      alert('An error occurred while deleting the gift');
    }
  }
}

// Helper: all authenticated users are admins
async function isAdmin() {
  const { data: { session } } = await supabase.auth.getSession();
  return !!session && !!session.user;
}
