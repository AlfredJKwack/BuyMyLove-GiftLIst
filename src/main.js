import './style.css'
import { isAdmin, loginAdmin, logoutAdmin } from './supabase.js'
import { giftService } from './services/giftService.js'
import { getUserId } from './utils/cookies.js'

class GiftListApp {
  constructor() {
    this.gifts = []
    this.isAdminMode = isAdmin()
    this.editingGift = null
    this.init()
  }

  async init() {
    this.setupApp()
    await this.loadGifts()
    this.render()
  }

  setupApp() {
    document.querySelector('#app').innerHTML = `
      <div class="min-h-screen bg-gray-50">
        <header class="bg-white shadow-sm border-b">
          <div class="max-w-4xl mx-auto px-4 py-4">
            <div class="flex justify-between items-center">
              <h1 class="text-2xl font-bold text-gray-900">🎁 Gift List</h1>
              <div id="admin-controls">
                ${this.isAdminMode ? this.renderAdminHeader() : this.renderLoginButton()}
              </div>
            </div>
          </div>
        </header>

        <main class="max-w-4xl mx-auto px-4 py-6">
          <div id="gift-form-container"></div>
          <div id="gifts-container" class="space-y-4"></div>
          <div id="loading" class="hidden text-center py-8">
            <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p class="mt-2 text-gray-600">Loading...</p>
          </div>
        </main>

        <footer class="max-w-4xl mx-auto px-4 py-6 mt-8">
          <div class="text-center text-sm text-gray-500 border-t pt-4">
            v0.1.0
          </div>
        </footer>

        <!-- Login Modal -->
        <div id="login-modal" class="hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div class="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h2 class="text-xl font-bold mb-4">Admin Login</h2>
            <form id="login-form">
              <input 
                type="password" 
                id="admin-secret" 
                placeholder="Enter admin secret" 
                class="form-input mb-4"
                required
              >
              <div class="flex gap-2">
                <button type="submit" class="btn-primary flex-1">Login</button>
                <button type="button" id="cancel-login" class="btn-secondary">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `

    this.setupEventListeners()
  }

  setupEventListeners() {
    // Login modal
    document.getElementById('login-btn')?.addEventListener('click', () => {
      document.getElementById('login-modal').classList.remove('hidden')
    })

    document.getElementById('cancel-login').addEventListener('click', () => {
      document.getElementById('login-modal').classList.add('hidden')
    })

    document.getElementById('login-form').addEventListener('submit', (e) => {
      e.preventDefault()
      const secret = document.getElementById('admin-secret').value
      if (loginAdmin(secret)) {
        this.isAdminMode = true
        document.getElementById('login-modal').classList.add('hidden')
        this.render()
      } else {
        alert('Invalid admin secret')
      }
    })

    // Logout
    document.getElementById('logout-btn')?.addEventListener('click', () => {
      logoutAdmin()
      this.isAdminMode = false
      this.editingGift = null
      this.render()
    })

    // Add gift button
    document.getElementById('add-gift-btn')?.addEventListener('click', () => {
      this.showingAddForm = true
      this.editingGift = null
      this.renderGiftForm()
    })
  }

  renderAdminHeader() {
    return `
      <div class="flex gap-2">
        <button id="add-gift-btn" class="btn-primary">Add Gift</button>
        <button id="logout-btn" class="btn-secondary">Logout</button>
      </div>
    `
  }

  renderLoginButton() {
    return `<button id="login-btn" class="btn-secondary">Admin Login</button>`
  }

  async loadGifts() {
    this.showLoading(true)
    try {
      this.gifts = await giftService.getGifts()
    } catch (error) {
      console.error('Error loading gifts:', error)
      this.showError('Failed to load gifts')
    }
    this.showLoading(false)
  }

  render() {
    this.renderAdminControls()
    this.renderGiftForm()
    this.renderGifts()
  }

  renderAdminControls() {
    const adminControls = document.getElementById('admin-controls')
    adminControls.innerHTML = this.isAdminMode ? this.renderAdminHeader() : this.renderLoginButton()
    this.setupEventListeners()
  }

  renderGiftForm() {
    const container = document.getElementById('gift-form-container')
    
    if (!this.isAdminMode || (!this.editingGift && !this.showingAddForm)) {
      container.innerHTML = ''
      return
    }

    const gift = this.editingGift || {}
    const isEditing = !!this.editingGift

    container.innerHTML = `
      <div class="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 class="text-xl font-bold mb-4">${isEditing ? 'Edit Gift' : 'Add New Gift'}</h2>
        <form id="gift-form" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input 
              type="text" 
              id="gift-title" 
              value="${gift.title || ''}" 
              class="form-input" 
              required
            >
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Link *</label>
            <input 
              type="url" 
              id="gift-link" 
              value="${gift.hyperlink || ''}" 
              class="form-input" 
              required
            >
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Note</label>
            <textarea 
              id="gift-note" 
              rows="3" 
              class="form-textarea"
              placeholder="Optional description..."
            >${gift.note || ''}</textarea>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Image</label>
            <input 
              type="file" 
              id="gift-image" 
              accept="image/*" 
              class="form-input"
            >
            ${gift.image_url ? `<img src="${gift.image_url}" alt="Current image" class="mt-2 max-w-xs rounded">` : ''}
          </div>
          
          <div class="flex gap-2">
            <button type="submit" class="btn-primary" id="save-gift-btn">
              ${isEditing ? 'Update Gift' : 'Add Gift'}
            </button>
            <button type="button" id="cancel-gift-btn" class="btn-secondary">Cancel</button>
          </div>
        </form>
      </div>
    `

    this.setupGiftFormListeners()
  }

  setupGiftFormListeners() {
    // Cancel form
    document.getElementById('cancel-gift-btn')?.addEventListener('click', () => {
      this.showingAddForm = false
      this.editingGift = null
      this.renderGiftForm()
    })

    // Submit form
    document.getElementById('gift-form')?.addEventListener('submit', async (e) => {
      e.preventDefault()
      await this.handleGiftSubmit()
    })
  }

  async handleGiftSubmit() {
    const saveBtn = document.getElementById('save-gift-btn')
    const originalText = saveBtn.textContent
    saveBtn.textContent = 'Saving...'
    saveBtn.disabled = true

    try {
      const formData = {
        title: document.getElementById('gift-title').value,
        hyperlink: document.getElementById('gift-link').value,
        note: document.getElementById('gift-note').value || null
      }

      // Handle image upload
      const imageFile = document.getElementById('gift-image').files[0]
      if (imageFile) {
        formData.image_url = await giftService.uploadImage(imageFile)
      } else if (this.editingGift) {
        formData.image_url = this.editingGift.image_url
      }

      if (this.editingGift) {
        await giftService.updateGift(this.editingGift.id, formData)
      } else {
        await giftService.addGift(formData)
      }

      this.showingAddForm = false
      this.editingGift = null
      await this.loadGifts()
      this.render()
    } catch (error) {
      console.error('Error saving gift:', error)
      this.showError('Failed to save gift')
    }

    saveBtn.textContent = originalText
    saveBtn.disabled = false
  }

  renderGifts() {
    const container = document.getElementById('gifts-container')
    
    if (this.gifts.length === 0) {
      container.innerHTML = `
        <div class="text-center py-12">
          <p class="text-gray-500 text-lg">No gifts added yet</p>
          ${this.isAdminMode ? '<p class="text-gray-400 mt-2">Click "Add Gift" to get started</p>' : ''}
        </div>
      `
      return
    }

    container.innerHTML = this.gifts.map(gift => this.renderGiftCard(gift)).join('')
    this.setupGiftCardListeners()
  }

  renderGiftCard(gift) {
    const userId = getUserId()
    const canToggleBought = !gift.bought || gift.bought_by_cookie === userId
    const boughtIcon = gift.bought ? '✅' : '⭕'
    
    return `
      <div class="gift-card" data-gift-id="${gift.id}">
        <div class="flex gap-4">
          ${gift.image_url ? `
            <div class="flex-shrink-0">
              <img src="${gift.image_url}" alt="${gift.title}" class="w-20 h-20 object-cover rounded">
            </div>
          ` : ''}
          
          <div class="flex-1 min-w-0">
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <h3 class="text-lg font-semibold">
                  <a href="${gift.hyperlink}" target="_blank" rel="noopener noreferrer" 
                     class="text-blue-600 hover:text-blue-800 hover:underline">
                    ${gift.title}
                  </a>
                </h3>
                
                ${gift.note ? `<p class="text-gray-600 mt-1">${gift.note}</p>` : ''}
                
                <p class="text-sm text-gray-400 mt-2">
                  Added ${new Date(gift.date_added).toLocaleDateString()}
                </p>
              </div>
              
              <div class="flex items-center gap-2 ml-4">
                <button 
                  class="bought-toggle ${canToggleBought ? '' : 'disabled'}" 
                  data-gift-id="${gift.id}"
                  ${canToggleBought ? '' : 'disabled'}
                  title="${gift.bought ? 'Mark as not bought' : 'Mark as bought'}"
                >
                  <span class="text-2xl">${boughtIcon}</span>
                </button>
              </div>
            </div>
            
            ${this.isAdminMode ? `
              <div class="admin-controls">
                <button class="btn-secondary text-sm edit-gift-btn" data-gift-id="${gift.id}">
                  Edit
                </button>
                <button class="btn-danger text-sm delete-gift-btn" data-gift-id="${gift.id}">
                  Delete
                </button>
              </div>
            ` : ''}
          </div>
        </div>
      </div>
    `
  }

  setupGiftCardListeners() {
    // Bought toggle
    document.querySelectorAll('.bought-toggle:not(.disabled)').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const giftId = parseInt(e.currentTarget.dataset.giftId)
        await this.toggleBoughtStatus(giftId)
      })
    })

    // Edit gift
    document.querySelectorAll('.edit-gift-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const giftId = parseInt(e.currentTarget.dataset.giftId)
        this.editingGift = this.gifts.find(g => g.id === giftId)
        this.showingAddForm = false
        this.renderGiftForm()
      })
    })

    // Delete gift
    document.querySelectorAll('.delete-gift-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const giftId = parseInt(e.currentTarget.dataset.giftId)
        if (confirm('Are you sure you want to delete this gift?')) {
          await this.deleteGift(giftId)
        }
      })
    })
  }

  async toggleBoughtStatus(giftId) {
    const gift = this.gifts.find(g => g.id === giftId)
    if (!gift) return

    try {
      await giftService.toggleBoughtStatus(giftId, gift.bought, gift.bought_by_cookie)
      await this.loadGifts()
      this.renderGifts()
    } catch (error) {
      console.error('Error toggling bought status:', error)
      this.showError(error.message || 'Failed to update gift status')
    }
  }

  async deleteGift(giftId) {
    try {
      const gift = this.gifts.find(g => g.id === giftId)
      if (gift?.image_url) {
        await giftService.deleteImage(gift.image_url)
      }
      
      await giftService.deleteGift(giftId)
      await this.loadGifts()
      this.render()
    } catch (error) {
      console.error('Error deleting gift:', error)
      this.showError('Failed to delete gift')
    }
  }

  showLoading(show) {
    const loading = document.getElementById('loading')
    const container = document.getElementById('gifts-container')
    
    if (show) {
      loading.classList.remove('hidden')
      container.classList.add('hidden')
    } else {
      loading.classList.add('hidden')
      container.classList.remove('hidden')
    }
  }

  showError(message) {
    // Simple error display - could be enhanced with a proper toast system
    alert(message)
  }
}

// Initialize the app
new GiftListApp()
