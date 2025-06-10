import { supabase, resetSupabaseClient } from './supabase';
import { getCookieId, setCookieId } from '../utils/cookies';

// Get the Supabase URL for Edge Functions
const getSupabaseUrl = () => {
  const url = import.meta.env.VITE_SUPABASE_URL || 'https://example.supabase.co';
  return url;
};

// Helper function to call Edge Functions
const callEdgeFunction = async (functionName, payload, options = {}) => {
  const supabaseUrl = getSupabaseUrl();
  const url = `${supabaseUrl}/functions/v1/${functionName}`;
  
  const headers = {
    'Content-Type': 'application/json',
    'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY || '',
    ...options.headers,
  };

  try {
    // Add gift buyer ID header for anonymous operations
    if (options.includeGiftBuyerId) {
      const cookieId = getCookieId();
      console.info(`Adding gift buyer ID header: ${cookieId}`);
      headers['x-gift-buyer-id'] = cookieId;
      // For anonymous operations, use anon key as authorization
      headers['authorization'] = `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY || ''}`;
    }

    // Add authorization header for admin operations
    if (options.includeAuth) {
      console.info('Getting session for admin authorization...');
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          console.info('Session found, adding authorization header');
          headers['authorization'] = `Bearer ${session.access_token}`;
        } else {
          console.warn('No session found for admin operation');
        }
      } catch (sessionError) {
        console.error('Error getting session for authorization:', sessionError);
        throw new Error('Failed to get authentication session');
      }
    }

    // Log request details before making the call
    console.info(`Calling Edge Function: ${functionName}`);
    console.info(`Request URL: ${url}`);
    console.info(`Request headers:`, { ...headers, authorization: headers.authorization ? '[REDACTED]' : undefined });
    console.info(`Request payload:`, payload);

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    console.info(`Edge Function ${functionName} response status: ${response.status}`);

    const data = await response.json();
    
    if (!response.ok) {
      console.error(`Edge Function ${functionName} failed:`, data);
      throw new Error(data.error || `HTTP error! status: ${response.status}`);
    } else {
      console.log(`Edge Function ${functionName} response:`, data);
    }

    return data;

  } catch (error) {
    console.error(`Error calling ${functionName}:`, error);
    console.error(`Error details - URL: ${url}, Payload:`, payload);
    throw error;
  }
};

/**
 * Fetch all gifts
 * @returns {Promise<Array>} Array of gift objects
 */
export const fetchGifts = async () => {
  console.info('Fetching gifts from Supabase...');
  const { data, error } = await supabase
    .from('gifts')
    .select('*')
    .order('date_added', { ascending: false });

  if (error) {
    console.error('Error fetching gifts:', error.message);
    return [];
  }

  return data || [];
};

/**
 * Add a new gift
 * @param {Object} gift - The gift object to add
 * @returns {Promise<{success: boolean, data: Object|null, error: string|null}>} Result of the operation
 */
export const addGift = async (gift) => {
  console.info('Adding new gift');
  try {
    // Call the Edge Function
    const result = await callEdgeFunction('add-gift', {
      title: gift.title,
      hyperlink: gift.hyperlink,
      note: gift.note || null,
      imagePath: gift.imagePath || null,
    }, {
      includeAuth: true
    });

    return result;
  } catch (error) {
    console.error('Error adding gift:', error.message);
    return { success: false, data: null, error: error.message };
  }
};

/**
 * Update an existing gift
 * @param {string} id - The ID of the gift to update
 * @param {Object} updates - The fields to update
 * @returns {Promise<{success: boolean, data: Object|null, error: string|null}>} Result of the operation
 */
export const updateGift = async (id, updates) => {
  console.info('Updating gift:', id);
  try {
    // Call the Edge Function
    const result = await callEdgeFunction('update-gift', {
      giftId: id,
      updates
    }, {
      includeAuth: true
    });

    return result;
  } catch (error) {
    console.error('Error updating gift:', error.message);
    return { success: false, data: null, error: error.message };
  }
};

/**
 * Delete an image from Supabase Storage
 * @param {string} imagePath - The full URL path of the image to delete
 * @returns {Promise<{success: boolean, error: string|null}>} Result of the operation
 */
export const deleteImageFromStorage = async (imagePath) => {
  console.info('Deleting image from storage:', imagePath);
  try {
    // If no image path, nothing to delete
    if (!imagePath) {
      return { success: true, error: null };
    }
    
    // Extract the filename from the URL
    // The URL format is typically like: https://xxx.supabase.co/storage/v1/object/public/gift-images/filename.jpg
    const urlParts = imagePath.split('/');
    const filename = urlParts[urlParts.length - 1];
    
    if (!filename) {
      console.error('Could not extract filename from image path:', imagePath);
      return { success: false, error: 'Invalid image path' };
    }
    
    const filePath = `gift-images/${filename}`;
    
    // Delete the file from storage
    const { error } = await supabase.storage
      .from('gift-images')
      .remove([filePath]);
    
    if (error) {
      console.error('Error deleting image from storage:', error.message);
      return { success: false, error: error.message };
    }
    
    return { success: true, error: null };
  } catch (error) {
    console.error('Error in image deletion process:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Delete a gift
 * @param {string} id - The ID of the gift to delete
 * @returns {Promise<{success: boolean, error: string|null}>} Result of the operation
 */
export const deleteGift = async (id) => {
  console.info('Deleting gift with ID:', id);
  try {
    // Call the Edge Function
    const result = await callEdgeFunction('delete-gift', {
      giftId: id
    }, {
      includeAuth: true
    });

    return result;
  } catch (error) {
    console.error('Error deleting gift:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Toggle the bought status of a gift
 * @param {string} id - The ID of the gift to toggle
 * @param {boolean} bought - The new bought status
 * @returns {Promise<{success: boolean, data: Object|null, error: string|null}>} Result of the operation
 */
export const toggleBoughtStatus = async (id, bought) => {
  console.info(`Toggling bought status for gift ID ${id}:`, bought);
  try {
    // Get or create a cookie ID for the current user
    let cookieId = getCookieId();
    const hadCookie = !!cookieId;
    
    if (!cookieId) {
      console.info('No existing cookie found, creating new one');
      cookieId = crypto.randomUUID();
      setCookieId(cookieId);
      console.info('New cookie set:', cookieId);
      
      // Reset the Supabase client to use the new cookie ID
      console.info('Resetting Supabase client with new cookie ID');
      resetSupabaseClient();
    } else {
      console.info('Using existing cookie:', cookieId);
    }

    // Call the Edge Function
    const result = await callEdgeFunction('toggle-bought-status', {
      giftId: id,
      bought
    }, {
      includeGiftBuyerId: true
    });

    return result;
  } catch (error) {
    console.error('Error toggling bought status:', error.message);
    return { success: false, data: null, error: error.message };
  }
};

import pica from 'pica';
const picaInstance = pica();

/**
 * Process an image to create a 150x150 thumbnail using Pica for high-quality resizing.
 * Resizes the image so the shortest side is 150px, then center-crops.
 * @param {File} file - The original image file
 * @returns {Promise<Blob|null>} - A promise that resolves to the processed image blob or null if processing failed
 */
const processImageThumbnail = (file) => {
  console.info('Processing image thumbnail for file:', file.name, 'Size:', file.size, 'Type:', file.type);
  return new Promise((resolve, reject) => {
    try {
      // Validate file input
      if (!file || !(file instanceof File)) {
        const error = new Error('Invalid file input - not a File object');
        console.error('Image processing error:', error.message, 'Received:', file);
        reject(error);
        return;
      }

      if (!file.type.startsWith('image/')) {
        const error = new Error(`Invalid file type: ${file.type}. Expected image file.`);
        console.error('Image processing error:', error.message);
        reject(error);
        return;
      }

      const reader = new FileReader();

      reader.onload = (e) => {
        console.info('FileReader loaded successfully, creating image element');
        const img = new Image();

        img.onload = async () => {
          console.info(`Image loaded successfully - dimensions: ${img.width}x${img.height}`);
          try {
            // Validate image dimensions
            if (img.width === 0 || img.height === 0) {
              const error = new Error(`Invalid image dimensions: ${img.width}x${img.height}`);
              console.error('Image processing error:', error.message);
              reject(error);
              return;
            }

            // Calculate the largest possible square (center-crop)
            let sourceWidth = img.width;
            let sourceHeight = img.height;
            let sourceX = 0;
            let sourceY = 0;

            if (sourceWidth > sourceHeight) {
              sourceX = (sourceWidth - sourceHeight) / 2;
              sourceWidth = sourceHeight;
            } else {
              sourceY = (sourceHeight - sourceWidth) / 2;
              sourceHeight = sourceWidth;
            }

            console.info(`Crop calculations - source: ${sourceWidth}x${sourceHeight} at (${sourceX}, ${sourceY})`);

            // Create a source canvas for the cropped square
            const sourceCanvas = document.createElement('canvas');
            sourceCanvas.width = sourceWidth;
            sourceCanvas.height = sourceHeight;
            const sourceCtx = sourceCanvas.getContext('2d');
            
            if (!sourceCtx) {
              const error = new Error('Failed to get 2D context from source canvas');
              console.error('Image processing error:', error.message);
              reject(error);
              return;
            }

            console.info('Drawing image to source canvas');
            sourceCtx.drawImage(
              img,
              sourceX, sourceY, sourceWidth, sourceHeight,
              0, 0, sourceWidth, sourceHeight
            );

            // Create a destination canvas for the thumbnail
            const destCanvas = document.createElement('canvas');
            destCanvas.width = 150;
            destCanvas.height = 150;

            console.info('Starting Pica resize operation');
            // Use Pica to resize the cropped square to 150x150
            await picaInstance.resize(sourceCanvas, destCanvas);

            console.info('Pica resize completed, converting to blob');
            // Use Pica to convert the resized canvas to a JPEG blob
            const blob = await picaInstance.toBlob(destCanvas, 'image/jpeg', 0.9);

            if (blob) {
              console.info('Image processing completed successfully, blob size:', blob.size);
              resolve(blob);
            } else {
              const error = new Error('Failed to convert canvas to blob - Pica returned null');
              console.error('Image processing error:', error.message);
              reject(error);
            }
          } catch (err) {
            console.error('Error during image processing operations:', err.message, err);
            reject(err);
          }
        };

        img.onerror = (event) => {
          const error = new Error('Failed to load image - image.onerror triggered');
          console.error('Image processing error:', error.message, 'Event:', event);
          reject(error);
        };

        console.info('Setting image src from FileReader result');
        img.src = e.target.result;
      };

      reader.onerror = (event) => {
        const error = new Error('Failed to read file - FileReader.onerror triggered');
        console.error('Image processing error:', error.message, 'Event:', event, 'File:', file.name);
        reject(error);
      };

      console.info('Starting FileReader.readAsDataURL');
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error in processImageThumbnail setup:', error.message, error);
      reject(error);
    }
  });
};

/**
 * Upload an image for a gift
 * @param {File} file - The image file to upload
 * @returns {Promise<{success: boolean, path: string|null, error: string|null}>} Result of the operation
 */
export const uploadGiftImage = async (file) => {
  console.info('Uploading gift image:', file.name);
  try {
    // Process the image to create a 150x150 thumbnail
    const thumbnailBlob = await processImageThumbnail(file);
    
    // Generate a unique filename
    const fileExt = 'jpg'; // We're converting all images to JPEG
    const fileName = `${crypto.randomUUID()}.${fileExt}`;
    const filePath = `gift-images/${fileName}`;

    // Upload the thumbnail to Supabase Storage
    const { error } = await supabase.storage
      .from('gift-images')
      .upload(filePath, thumbnailBlob);

    if (error) {
      console.error('Error uploading image:', error.message);
      return { success: false, path: null, error: error.message };
    }

    // Get the public URL of the uploaded thumbnail
    const { data } = supabase.storage
      .from('gift-images')
      .getPublicUrl(filePath);

    return { success: true, path: data.publicUrl, error: null };
  } catch (error) {
    console.error('Error in image upload process:', error.message);
    return { success: false, path: null, error: error.message };
  }
};
