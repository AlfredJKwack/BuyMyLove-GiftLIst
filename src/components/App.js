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
    
    // Create gift form container
    this.giftFormContainer = document.createElement('div');
    this.giftFormContainer.classList.add('hidden');
    this.container.appendChild(this.giftFormContainer);
    
    // Initialize components
    this.giftList = new GiftList(this.giftListContainer);
    this.giftForm = new GiftForm(this.giftFormContainer);
    this.authForm = new AuthForm(this.adminModalBody);
    
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
    // Close modal when clicking overlay
    this.adminModal.addEventListener('click', (e) => {
      if (e.target === this.adminModal || e.target.classList.contains('admin-modal-overlay')) {
        this.closeAdminModal();
      }
    });

    // Close modal with Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !this.adminModal.classList.contains('hidden')) {
        this.closeAdminModal();
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
    
    if (hash === '#/admin') {
      this.currentRoute = '/admin';
      this.showAdminModal();
    } else {
      this.currentRoute = '/';
      this.closeAdminModal();
    }
    
    console.log('Route changed to:', this.currentRoute);
  }

  /**
   * Show the admin modal
   */
  showAdminModal() {
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
  }

  /**
   * Set up auth state listener
   */
  setupAuthStateListener() {
    // Set up Supabase auth state listener
    supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state change detected in App:', event);
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
