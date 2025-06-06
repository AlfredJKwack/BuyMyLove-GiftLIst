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
          ${this.isAdminUser ? '<button id="add-gift-btn" class="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded">Add a Gift</button>' : ''}
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
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        ${giftItems}
      </div>
      ${this.isAdminUser ? '<button id="add-gift-btn" class="mt-8 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded fixed bottom-4 right-4 shadow-lg">Add Gift</button>' : ''}
    `;
    
    // Add event listeners
    this.gifts.forEach(gift => {
      const giftElement = document.getElementById(`gift-${gift.id}`);
      
      // Toggle bought status
      const boughtCheckbox = giftElement.querySelector('.bought-checkbox');
      if (boughtCheckbox) {
        boughtCheckbox.addEventListener('change', (e) => this.handleToggleBought(gift.id, e.target.checked));
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
    
    return `
      <div id="gift-${gift.id}" class="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 ${gift.bought ? 'border-green-500 border-2' : ''}">
        ${gift.image_path ? `
          <div class="h-48 overflow-hidden">
            <img src="${gift.image_path}" alt="${gift.title}" class="w-full h-full object-cover">
          </div>
        ` : ''}
        
        <div class="p-4">
          <div class="flex justify-between items-start">
            <h3 class="text-lg font-semibold mb-2">
              <a href="${gift.hyperlink}" target="_blank" class="text-blue-600 hover:text-blue-800 hover:underline">
                ${gift.title}
              </a>
            </h3>
            
            <div class="flex items-center">
              <label class="inline-flex items-center cursor-pointer ${!canToggle ? 'opacity-50' : ''}">
                <input type="checkbox" class="bought-checkbox sr-only" ${gift.bought ? 'checked' : ''} ${!canToggle ? 'disabled' : ''}>
                <div class="relative w-10 h-5 bg-gray-200 rounded-full transition duration-200 ease-in-out ${gift.bought ? 'bg-green-500' : ''}">
                  <div class="absolute left-0.5 top-0.5 bg-white w-4 h-4 rounded-full transition-transform duration-200 ease-in-out ${gift.bought ? 'transform translate-x-5' : ''}"></div>
                </div>
                <span class="ml-2 text-sm text-gray-700">${gift.bought ? 'Bought' : 'Available'}</span>
              </label>
            </div>
          </div>
          
          ${gift.note ? `<p class="text-gray-600 mt-2">${gift.note}</p>` : ''}
          
          <div class="mt-4 flex justify-between items-center text-sm text-gray-500">
            <span>Added: ${dateAdded}</span>
            
            ${this.isAdminUser ? `
              <div class="flex space-x-2">
                <button class="edit-btn text-blue-500 hover:text-blue-700">Edit</button>
                <button class="delete-btn text-red-500 hover:text-red-700">Delete</button>
              </div>
            ` : ''}
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
          const boughtCheckbox = updatedElement.querySelector('.bought-checkbox');
          if (boughtCheckbox) {
            boughtCheckbox.addEventListener('change', (e) => this.handleToggleBought(id, e.target.checked));
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
