import { fetchGifts, toggleBoughtStatus } from '../services/giftService';
import { isAdmin } from '../services/supabase';
import { getCookieId } from '../utils/cookies';

/**
 * Gift List Component
 * Displays a list of gifts and handles interactions
 */
export class GiftList {
  constructor(container) {
    this.container = container;
    this.gifts = [];
    this.isAdminUser = false;
    this.cookieId = getCookieId();
    
    this.init();
  }

  /**
   * Initialize the component
   */
  async init() {
    // Check if the user is an admin
    this.isAdminUser = await isAdmin();
    
    // Load gifts
    await this.loadGifts();
    
    // Set up real-time subscription for updates
    this.setupRealtimeSubscription();
  }

  /**
   * Load gifts from the database
   */
  async loadGifts() {
    try {
      this.gifts = await fetchGifts();
      this.render();
    } catch (error) {
      console.error('Error loading gifts:', error);
      this.renderError('Failed to load gifts. Please try again later.');
    }
  }

  /**
   * Set up real-time subscription for gift updates
   */
  setupRealtimeSubscription() {
    // This would use Supabase's real-time features to listen for changes
    // For simplicity, we'll just poll for updates every 30 seconds
    setInterval(() => this.loadGifts(), 30000);
  }

  /**
   * Render the gift list
   */
  render() {
    if (!this.gifts || this.gifts.length === 0) {
      this.container.innerHTML = `
        <div class="text-center py-10">
          <p class="text-gray-500">No gifts found.</p>
          ${this.isAdminUser ? '<button id="add-gift-btn" class="btn btn-primary mt-4">Add a Gift</button>' : ''}
        </div>
      `;
      
      if (this.isAdminUser) {
        document.getElementById('add-gift-btn').addEventListener('click', () => {
          // Dispatch a custom event that will be handled by the main app
          window.dispatchEvent(new CustomEvent('openAddGiftForm'));
        });
      }
      
      return;
    }

    const giftItems = this.gifts.map(gift => this.renderGiftItem(gift)).join('');
    
    this.container.innerHTML = `
      <div class="text-center mb-8">
        <h2 class="text-2xl">Gift List</h2>
        <p class="text-gray">Click on a gift to view details or mark it as bought.</p>
      </div>
      
      <div class="gift-grid">
        ${giftItems}
      </div>
      ${this.isAdminUser ? '<button id="add-gift-btn" class="btn btn-primary mt-8 fixed bottom-4 right-4 shadow-lg">Add Gift</button>' : ''}
    `;
    
    // Add event listeners
    this.gifts.forEach(gift => {
      const giftElement = document.getElementById(`gift-${gift.id}`);
      
      // Toggle bought status
      const toggleInput = giftElement.querySelector('.toggle-input');
      if (toggleInput) {
        toggleInput.addEventListener('change', (e) => this.handleToggleBought(gift.id, e.target.checked));
      }
      
      // Admin actions
      if (this.isAdminUser) {
        const editBtn = giftElement.querySelector('.edit-btn');
        if (editBtn) {
          editBtn.addEventListener('click', () => this.handleEditGift(gift));
        }
        
        const deleteBtn = giftElement.querySelector('.delete-btn');
        if (deleteBtn) {
          deleteBtn.addEventListener('click', () => this.handleDeleteGift(gift.id));
        }
      }
    });
    
    // Add gift button for admin
    if (this.isAdminUser) {
      document.getElementById('add-gift-btn').addEventListener('click', () => {
        window.dispatchEvent(new CustomEvent('openAddGiftForm'));
      });
    }
  }

  /**
   * Render a single gift item
   * @param {Object} gift - The gift object
   * @returns {string} HTML for the gift item
   */
  renderGiftItem(gift) {
    const canToggle = !gift.bought || gift.bought_by_cookie === this.cookieId;
    const dateAdded = new Date(gift.date_added).toLocaleDateString();
    
    // SVG placeholder markup - exactly as in index.html
    const svgPlaceholder = `
      <svg xmlns="http://www.w3.org/2000/svg" class="image-placeholder-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    `;
    
    // Admin controls - added to the gift-footer
    const adminControls = this.isAdminUser ? `
      <div class="admin-controls btn-group btn-space-x self-end">
        <button class="btn btn-secondary edit-btn">Edit</button>
        <button class="btn btn-danger delete-btn">Delete</button>
      </div>
    ` : '';
    
    return `
      <div id="gift-${gift.id}" class="gift-card${gift.bought ? ' is-bought' : ''}" data-gift-id="${gift.id}">
        <!-- Image section -->
        <div class="gift-card-image">
          <div class="image-container">
            ${gift.image_path ? `
              <img src="${gift.image_path}" alt="${gift.title}" class="gift-image" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">
              <!-- Placeholder for when image fails to load -->
              <div class="image-placeholder" style="display: none;">
                ${svgPlaceholder}
              </div>
            ` : `
              <!-- Placeholder for when image is missing -->
              <div class="image-placeholder">
                ${svgPlaceholder}
              </div>
            `}
          </div>
          
          <!-- Toggle switch -->
          <div class="toggle-container mt-4">
            <label class="toggle-switch">
              <input type="checkbox" class="toggle-input" data-gift-id="${gift.id}" ${gift.bought ? 'checked' : ''} ${!canToggle ? 'disabled' : ''}>
              <span class="toggle-slider"></span>
              <span class="toggle-label">${gift.bought ? 'Bought' : 'Available'}</span>
            </label>
          </div>
        </div>
        
        <!-- Content section -->
        <div class="gift-card-content">
          <!-- Title with truncation -->
          <h3 class="gift-title">
            <a href="${gift.hyperlink}" target="_blank" title="${gift.title}">
              ${gift.title}
            </a>
          </h3>
          
          <!-- Description with truncation -->
          <p class="gift-description" title="${gift.note || ''}">
            ${gift.note || ''}
          </p>
          
          <!-- Footer with date -->
          <div class="gift-footer flex flex-col">
            <span class="gift-date self-end">Added: ${dateAdded}</span>
            ${adminControls}
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Render an error message
   * @param {string} message - The error message to display
   */
  renderError(message) {
    this.container.innerHTML = `
      <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
        <strong class="font-bold">Error!</strong>
        <span class="block sm:inline">${message}</span>
      </div>
    `;
  }

  /**
   * Handle toggling the bought status of a gift
   * @param {string} id - The ID of the gift
   * @param {boolean} bought - The new bought status
   */
  async handleToggleBought(id, bought) {
    try {
      const result = await toggleBoughtStatus(id, bought);
      
      if (!result.success) {
        alert(result.error || 'Failed to update gift status');
        // Revert the checkbox state
        this.loadGifts();
        return;
      }
      
      // Update the local gift data
      const giftIndex = this.gifts.findIndex(g => g.id === id);
      if (giftIndex !== -1) {
        this.gifts[giftIndex] = result.data;
        
        // Update just this gift in the DOM without re-rendering everything
        const giftElement = document.getElementById(`gift-${id}`);
        if (giftElement) {
          giftElement.outerHTML = this.renderGiftItem(result.data);
          
          // Re-attach event listeners
          const updatedElement = document.getElementById(`gift-${id}`);
          const toggleInput = updatedElement.querySelector('.toggle-input');
          if (toggleInput) {
            toggleInput.addEventListener('change', (e) => this.handleToggleBought(id, e.target.checked));
          }
          
          if (this.isAdminUser) {
            const editBtn = updatedElement.querySelector('.edit-btn');
            if (editBtn) {
              editBtn.addEventListener('click', () => this.handleEditGift(result.data));
            }
            
            const deleteBtn = updatedElement.querySelector('.delete-btn');
            if (deleteBtn) {
              deleteBtn.addEventListener('click', () => this.handleDeleteGift(id));
            }
          }
        }
      }
    } catch (error) {
      console.error('Error toggling bought status:', error);
      alert('Failed to update gift status. Please try again.');
      // Revert the checkbox state
      this.loadGifts();
    }
  }

  /**
   * Handle editing a gift (admin only)
   * @param {Object} gift - The gift to edit
   */
  handleEditGift(gift) {
    // Dispatch a custom event that will be handled by the main app
    window.dispatchEvent(new CustomEvent('editGift', { detail: gift }));
  }

  /**
   * Handle deleting a gift (admin only)
   * @param {string} id - The ID of the gift to delete
   */
  handleDeleteGift(id) {
    if (confirm('Are you sure you want to delete this gift?')) {
      // Dispatch a custom event that will be handled by the main app
      window.dispatchEvent(new CustomEvent('deleteGift', { detail: { id } }));
    }
  }
}
