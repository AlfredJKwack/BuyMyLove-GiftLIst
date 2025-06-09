import { addGift, updateGift, uploadGiftImage } from '../services/giftService';

/**
 * Gift Form Component
 * Handles adding and editing gifts (admin only) in a modal
 */
export class GiftForm {
  constructor(container) {
    this.container = container;
    this.modal = document.getElementById('gift-form-modal');
    this.isEditing = false;
    this.currentGift = null;
    this.imageFile = null;
    this.imagePreview = null;
    this.isProcessingImage = false;
  }

  /**
   * Show the form for adding a new gift
   */
  showAddForm() {
    this.isEditing = false;
    this.currentGift = null;
    this.imageFile = null;
    this.render();
    this.show();
  }

  /**
   * Show the form for editing an existing gift
   * @param {Object} gift - The gift to edit
   */
  showEditForm(gift) {
    this.isEditing = true;
    this.currentGift = gift;
    this.imageFile = null;
    this.render();
    this.show();
  }

  /**
   * Show the modal
   */
  show() {
    this.modal.classList.remove('hidden');
    // Add a slight delay before focusing to ensure the DOM is ready
    setTimeout(() => {
      const titleInput = document.getElementById('gift-title');
      if (titleInput) {
        titleInput.focus();
      }
    }, 100);
  }

  /**
   * Hide the modal
   */
  hide() {
    this.modal.classList.add('hidden');
  }

  /**
   * Render the form
   */
  render() {
    const title = this.isEditing ? 'Edit Gift' : 'Add New Gift';
    const submitText = this.isEditing ? 'Update Gift' : 'Add Gift';
    
    // Bought status toggle (only for editing)
    const boughtToggle = this.isEditing ? `
      <div class="form-group">
        <label class="form-label">Status</label>
        <div class="toggle-container">
          <label class="toggle-switch">
            <input type="checkbox" id="gift-bought" name="bought" class="toggle-input" ${this.currentGift?.bought ? 'checked' : ''}>
            <span class="toggle-slider"></span>
            <span class="toggle-label">${this.currentGift?.bought ? 'Bought' : 'Available'}</span>
          </label>
        </div>
      </div>
    ` : '';
    
    this.container.innerHTML = `
      <div class="login-form">
        <div class="form-header">
          <h2>${title}</h2>
          <button id="close-form-btn" class="btn-close" type="button">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
        
        <div id="gift-form-message" class="form-message hidden"></div>
        
        <form id="gift-form">
          <div class="form-group">
            <label for="gift-title" class="form-label">Title*</label>
            <input type="text" id="gift-title" name="title" required
              class="form-input"
              value="${this.currentGift?.title || ''}">
          </div>
          
          <div class="form-group">
            <label for="gift-hyperlink" class="form-label">Link URL*</label>
            <input type="url" id="gift-hyperlink" name="hyperlink" required
              class="form-input"
              value="${this.currentGift?.hyperlink || ''}">
          </div>
          
          <div class="form-group">
            <label for="gift-note" class="form-label">Note (optional)</label>
            <textarea id="gift-note" name="note" rows="3"
              class="form-input"
            >${this.currentGift?.note || ''}</textarea>
          </div>
          
          <div class="form-group">
            <label class="form-label">Image (optional)</label>
            
            <div class="flex ${this.currentGift?.image_path ? `gap-4`: ''} items-start">
              <div class="flex-none">
                ${this.currentGift?.image_path ? `
                  <div class="current-image">
                    <img src="${this.currentGift.image_path}" alt="Current image" class="current-image-preview">
                  </div>
                ` : ''}
                <div id="image-preview-container"></div>
              </div>
              
              <div class="flex-1">
                <input type="file" id="gift-image" name="image" accept="image/*"
                  class="form-input">
                <p class="form-help">PNG, JPG, GIF up to 5MB</p>
              </div>
            </div>
          </div>
          
          ${boughtToggle}
          
          <div class="form-actions">
            <button type="button" id="cancel-btn" class="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" id="submit-btn" class="btn btn-primary">
              ${submitText}
            </button>
          </div>
        </form>
      </div>
    `;
    
    // Add event listeners
    document.getElementById('close-form-btn').addEventListener('click', () => this.hide());
    document.getElementById('cancel-btn').addEventListener('click', () => this.hide());
    document.getElementById('gift-form').addEventListener('submit', (e) => this.handleSubmit(e));
    document.getElementById('gift-image').addEventListener('change', (e) => this.handleImageChange(e));
    
    // Add toggle event listener for bought status (only when editing)
    if (this.isEditing) {
      const boughtToggle = document.getElementById('gift-bought');
      if (boughtToggle) {
        boughtToggle.addEventListener('change', (e) => {
          const label = e.target.closest('.toggle-switch').querySelector('.toggle-label');
          label.textContent = e.target.checked ? 'Bought' : 'Available';
        });
      }
    }
  }

  /**
   * Handle form submission
   * @param {Event} e - The submit event
   */
  async handleSubmit(e) {
    console.info('Form submitted');
    e.preventDefault();
    
    const form = e.target;
    const submitBtn = document.getElementById('submit-btn');
    
    // Disable the submit button to prevent multiple submissions
    submitBtn.disabled = true;
    submitBtn.textContent = this.isEditing ? 'Updating...' : 'Adding...';
    
    try {
      const formData = {
        title: form.title.value.trim(),
        hyperlink: form.hyperlink.value.trim(),
        note: form.note.value.trim() || null,
      };

      // Handle image upload if a new image was selected
      if (this.imageFile) {
        const uploadResult = await uploadGiftImage(this.imageFile);
        if (uploadResult.success) {
          formData.imagePath = uploadResult.path;
          console.info('Image uploaded successfully:', formData.imagePath);
        } else {
          this.showMessage(uploadResult.error || 'Failed to upload image', 'error');
          throw new Error(uploadResult.error || 'Failed to upload image');
        }
      } else if (this.isEditing) {
        // Keep the existing image path when editing
        formData.imagePath = this.currentGift.image_path;
      }

      let result;

      if (this.isEditing) {
        // Get bought status from toggle (only available when editing)
        const boughtToggle = document.getElementById('gift-bought');
        const bought = boughtToggle ? boughtToggle.checked : this.currentGift.bought;

        // Update existing gift
        result = await updateGift(this.currentGift.id, {
          title: formData.title,
          hyperlink: formData.hyperlink,
          note: formData.note,
          image_path: formData.imagePath,
          bought: bought,
        });
      } else {
        // Add new gift
        result = await addGift(formData);
      }

      if (result.success) {
        // Notify the app that a gift was added or updated
        window.dispatchEvent(new CustomEvent('giftUpdated', { detail: result.data }));
        this.hide();
      } else {
        this.showMessage(result.error || 'Failed to save gift', 'error');
        throw new Error(result.error || 'Failed to save gift');
      }
    } catch (error) {
      console.error('Error saving gift:', error);
      this.showMessage(`Failed to save gift: ${error.message}`, 'error');
    } finally {
      // Re-enable the submit button
      submitBtn.disabled = false;
      submitBtn.textContent = this.isEditing ? 'Update Gift' : 'Add Gift';
    }
  }

  /**
   * Show an inline error or success message in the form
   * @param {string} message - The message to display
   * @param {string} type - 'error' or 'success'
   */
  showMessage(message, type = 'error') {
    const msgEl = document.getElementById('gift-form-message');
    if (msgEl) {
      msgEl.textContent = message;
      msgEl.className = 'form-message';
      
      if (type === 'success') {
        msgEl.classList.add('success');
      } else if (type === 'error') {
        msgEl.classList.add('error');
      }
      
      msgEl.classList.remove('hidden');
    }
  }

  /**
   * Handle image file selection
   * @param {Event} e - The change event
   */
  handleImageChange(e) {
    const file = e.target.files[0];
    if (!file) {
      this.imageFile = null;
      this.imagePreview = null;
      this.updateImagePreview();
      return;
    }
    
    // Validate file type and size
    const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
    const maxSize = 5 * 1024 * 1024; // 5MB
    
    if (!validTypes.includes(file.type)) {
      alert('Please select a valid image file (JPEG, PNG, or GIF)');
      e.target.value = '';
      this.imageFile = null;
      this.imagePreview = null;
      this.updateImagePreview();
      return;
    }
    
    if (file.size > maxSize) {
      alert('Image file is too large. Maximum size is 5MB.');
      e.target.value = '';
      this.imageFile = null;
      this.imagePreview = null;
      this.updateImagePreview();
      return;
    }
    
    this.imageFile = file;
    
    // Generate a preview of the processed thumbnail
    this.generateThumbnailPreview(file);
  }
  
  /**
   * Generate a preview of the processed thumbnail
   * @param {File} file - The image file
   */
  generateThumbnailPreview(file) {
    // Show loading state
    this.isProcessingImage = true;
    this.updateImagePreview();
    
    // Create a FileReader to read the image file
    const reader = new FileReader();
    
    reader.onload = (e) => {
      // Create an image element to load the file
      const img = new Image();
      
      img.onload = () => {
        // Create a canvas element for image processing
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Set canvas dimensions to 150x150 for the thumbnail
        canvas.width = 150;
        canvas.height = 150;
        
        // Calculate dimensions to resize the image so the shortest side is 150px
        let sourceWidth = img.width;
        let sourceHeight = img.height;
        let sourceX = 0;
        let sourceY = 0;
        
        // Determine which dimension is shorter and calculate scaling
        if (sourceWidth > sourceHeight) {
          // Height is the shorter side, scale to 150px height
          sourceX = (sourceWidth - sourceHeight) / 2;
          sourceWidth = sourceHeight;
        } else {
          // Width is the shorter side, scale to 150px width
          sourceY = (sourceHeight - sourceWidth) / 2;
          sourceHeight = sourceWidth;
        }
        
        // Draw the image on the canvas with center cropping
        ctx.drawImage(
          img,
          sourceX, sourceY, sourceWidth, sourceHeight, // Source rectangle
          0, 0, 150, 150 // Destination rectangle
        );
        
        // Set the preview image
        this.imagePreview = canvas.toDataURL('image/jpeg', 0.9);
        this.isProcessingImage = false;
        this.updateImagePreview();
      };
      
      img.onerror = () => {
        console.error('Failed to load image for preview');
        this.imagePreview = null;
        this.isProcessingImage = false;
        this.updateImagePreview();
      };
      
      // Set the image source to the file data
      img.src = e.target.result;
    };
    
    reader.onerror = () => {
      console.error('Failed to read file for preview');
      this.imagePreview = null;
      this.isProcessingImage = false;
      this.updateImagePreview();
    };
    
    // Read the file as a data URL
    reader.readAsDataURL(file);
  }
  
  /**
   * Update the image preview in the form
   */
  updateImagePreview() {
    const previewContainer = document.getElementById('image-preview-container');
    if (!previewContainer) return;
    
    if (this.isProcessingImage) {
      previewContainer.innerHTML = `
        <div class="image-processing">
          <div class="loading-spinner"></div>
          <span class="loading-text">Processing image...</span>
        </div>
      `;
    } else if (this.imagePreview) {
      previewContainer.innerHTML = `
        <div class="image-preview">
          <p class="preview-label">Thumbnail Preview (150x150):</p>
          <img src="${this.imagePreview}" alt="Thumbnail preview" class="preview-image">
        </div>
      `;
    } else {
      previewContainer.innerHTML = '';
    }
  }
}
