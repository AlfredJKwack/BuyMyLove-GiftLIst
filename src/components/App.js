import { GiftList } from './GiftList';
import { GiftForm } from './GiftForm';
import { AuthForm } from './AuthForm';
import { isAdmin, getSession, setupAuthStateListener } from '../services/supabase';
import { deleteGift } from '../services/giftService';

/**
 * Main App Component
 * Orchestrates the entire application
 */
export class App {
  constructor(container) {
    this.container = container;
    this.isAdminUser = false;
    this.currentView = 'list'; // 'list' or 'login'
    
    // Get existing containers
    this.giftListContainer = document.getElementById('gift-list-container');
    this.loginContainer = document.getElementById('login-container');
    
    // Create gift form container
    this.giftFormContainer = document.createElement('div');
    this.giftFormContainer.classList.add('hidden');
    this.container.appendChild(this.giftFormContainer);
    
    // Initialize components
    this.giftList = new GiftList(this.giftListContainer);
    this.giftForm = new GiftForm(this.giftFormContainer);
    this.authForm = new AuthForm(this.loginContainer);
    
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
    
    // Render the initial view
    this.renderView();
    
    // Set up auth state listener
    this.setupAuthStateListener();
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
    
    // Navigation events
    document.getElementById('nav-list').addEventListener('click', (e) => {
      e.preventDefault();
      this.setView('list');
    });
    
    document.getElementById('nav-login').addEventListener('click', (e) => {
      e.preventDefault();
      this.setView('login');
    });
  }

  /**
   * Set up auth state listener
   */
  setupAuthStateListener() {
    // Set up Supabase auth state listener
    setupAuthStateListener(async (event, session) => {
      console.log('Auth state change detected in App:', event);
      
      // Update admin status
      this.isAdminUser = await isAdmin();
      this.giftList.isAdminUser = this.isAdminUser;
      
      // Refresh the gift list
      this.giftList.loadGifts();
      
      // Update navigation
      this.updateNavigation();
      
      // Notify AuthForm component about auth state change
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
      
      // Update navigation
      this.updateNavigation();
    });
  }

  /**
   * Render the current view
   */
  renderView() {
    console.log('Rendering view:', this.currentView);
    
    // Hide all containers
    if (this.giftListContainer) {
      this.giftListContainer.style.display = 'none';
    }
    
    if (this.loginContainer) {
      this.loginContainer.style.display = 'none';
    }
    
    // Show the current view
    if (this.currentView === 'list' && this.giftListContainer) {
      console.log('Showing gift list');
      this.giftListContainer.style.display = 'block';
    } else if (this.currentView === 'login' && this.loginContainer) {
      console.log('Showing login form');
      this.loginContainer.style.display = 'block';
    }
    
    // Update navigation
    this.updateNavigation();
  }

  /**
   * Update the navigation based on auth state
   */
  updateNavigation() {
    const navList = document.getElementById('nav-list');
    const navLogin = document.getElementById('nav-login');
    
    if (navList && navLogin) {
      // Update active state
      navList.classList.toggle('text-blue-600', this.currentView === 'list');
      navLogin.classList.toggle('text-blue-600', this.currentView === 'login');
      
      // Update login/admin text
      navLogin.textContent = this.isAdminUser ? 'Admin Panel' : 'Admin Login';
    }
  }

  /**
   * Set the current view
   * @param {string} view - The view to show ('list' or 'login')
   */
  setView(view) {
    console.log('Setting view to:', view);
    if (this.currentView !== view) {
      this.currentView = view;
      this.renderView();
    }
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
