import { useState, useEffect, useRef } from 'react';

export default function GiftFormModal({ gift, onClose, onSaved }) {
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [url, setUrl] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [currentImageUrl, setCurrentImageUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [processingImage, setProcessingImage] = useState(false);
  
  const fileInputRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    if (gift) {
      setTitle(gift.title || '');
      setNote(gift.note || '');
      setUrl(gift.url || '');
      setCurrentImageUrl(gift.imageUrl || '');
    }
  }, [gift]);

  const processImage = async (file) => {
    setProcessingImage(true);
    
    try {
      // Create image element
      const img = new Image();
      const imageUrl = URL.createObjectURL(file);
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = imageUrl;
      });

      // Create canvas for resizing
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // Set canvas to 150x150
      canvas.width = 150;
      canvas.height = 150;

      // Calculate crop dimensions for center crop
      const sourceSize = Math.min(img.width, img.height);
      const sourceX = (img.width - sourceSize) / 2;
      const sourceY = (img.height - sourceSize) / 2;

      // Draw the center-cropped and resized image
      ctx.drawImage(
        img,
        sourceX, sourceY, sourceSize, sourceSize,
        0, 0, 150, 150
      );

      // Convert to blob
      const blob = await new Promise((resolve) => {
        canvas.toBlob(resolve, 'image/jpeg', 0.9);
      });

      // Create preview URL
      const previewUrl = URL.createObjectURL(blob);
      setImagePreview(previewUrl);
      setImageFile(blob);
      
      URL.revokeObjectURL(imageUrl);
    } catch (err) {
      console.error('Error processing image:', err);
      setError('Failed to process image');
    } finally {
      setProcessingImage(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setError('Image file size must be less than 5MB');
        return;
      }
      
      processImage(file);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setCurrentImageUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let finalImageUrl = currentImageUrl;

      // Upload image if a new one was selected
      if (imageFile) {
        const formData = new FormData();
        formData.append('image', imageFile, 'gift.jpg');

        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!uploadResponse.ok) {
          throw new Error('Failed to upload image');
        }

        const uploadData = await uploadResponse.json();
        finalImageUrl = uploadData.imageUrl;
      }

      // Create or update gift
      const giftData = {
        title,
        note: note || null,
        url: url || null,
        imageUrl: finalImageUrl || null,
      };

      if (gift) {
        // Update existing gift
        giftData.id = gift.id;
      }

      const response = await fetch('/api/gift', {
        method: gift ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(giftData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save gift');
      }

      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!gift) return;
    
    if (!confirm('Are you sure you want to delete this gift?')) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/gift', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: gift.id }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete gift');
      }

      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-modal">
      <div className="admin-modal-overlay" onClick={onClose}></div>
      <div className="admin-modal-content">
        <div className="login-form">
          <div className="form-header">
            <h2>{gift ? 'Edit Gift' : 'Add New Gift'}</h2>
            <button className="btn-close" onClick={onClose} disabled={loading}>
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="title" className="form-label">
                Title *
              </label>
              <input
                type="text"
                id="title"
                className="form-input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Gift title"
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="note" className="form-label">
                Note
              </label>
              <textarea
                id="note"
                className="form-input resize-vertical"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Optional description or note"
                rows="3"
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="url" className="form-label">
                URL
              </label>
              <input
                type="url"
                id="url"
                className="form-input"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com/product"
                disabled={loading}
              />
              <p className="form-help">
                Link to product page or more information
              </p>
            </div>

            <div className="form-group">
              <label htmlFor="image" className="form-label">
                Image
              </label>
              <input
                ref={fileInputRef}
                type="file"
                id="image"
                className="form-input"
                accept="image/*"
                onChange={handleFileChange}
                disabled={loading || processingImage}
              />
              <p className="form-help">
                Image will be resized to 150×150px
              </p>

              {processingImage && (
                <div className="image-processing">
                  <div className="loading-spinner"></div>
                  <span className="loading-text">Processing image...</span>
                </div>
              )}

              {imagePreview && (
                <div className="image-preview">
                  <p className="preview-label">Preview:</p>
                  <img src={imagePreview} alt="Preview" className="preview-image" />
                  <button
                    type="button"
                    className="form-button form-button--danger"
                    onClick={handleRemoveImage}
                  >
                    Remove Image
                  </button>
                </div>
              )}

              {!imagePreview && currentImageUrl && (
                <div className="current-image">
                  <p className="preview-label">Current image:</p>
                  <img src={currentImageUrl} alt="Current" className="current-image-preview" />
                  <button
                    type="button"
                    className="form-button form-button--danger"
                    onClick={handleRemoveImage}
                  >
                    Remove Image
                  </button>
                </div>
              )}
            </div>

            {error && (
              <div className="form-message error">
                {error}
              </div>
            )}

            <div className="form-actions">
              {gift && (
                <button
                  type="button"
                  className="form-button bg-danger mr-auto"
                  onClick={handleDelete}
                  disabled={loading}
                >
                  {loading ? 'Deleting...' : 'Delete'}
                </button>
              )}
              <button
                type="button"
                className="form-button bg-gray-500"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="form-button"
                disabled={loading || processingImage}
              >
                {loading ? 'Saving...' : gift ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      </div>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
