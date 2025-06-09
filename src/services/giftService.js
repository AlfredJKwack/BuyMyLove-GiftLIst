import { supabase } from './supabase';
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

  // Add gift buyer ID header for anonymous operations
  if (options.includeGiftBuyerId) {
    headers['x-gift-buyer-id'] = getCookieId();
    // For anonymous operations, use anon key as authorization
    headers['authorization'] = `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY || ''}`;
  }

  // Add authorization header for admin operations
  if (options.includeAuth) {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      headers['authorization'] = `Bearer ${session.access_token}`;
    }
  }

  try {
    console.info(`Calling Edge Function: ${functionName}`);
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

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
    if (!cookieId) {
      cookieId = crypto.randomUUID();
      setCookieId(cookieId);
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

/**
 * Log a visitor interaction for abuse detection
 * @param {string} cookieId - The cookie ID of the visitor
 * @returns {Promise<void>}
 */
export const logVisitorInteraction = async (cookieId) => {
  console.info('Logging visitor interaction for cookie ID:', cookieId);
  try {
    // Get the visitor's IP address (in a real app, this would be done server-side)
    const ipAddress = 'client-ip-placeholder';
    
    // Check if the visitor has already been logged today
    const today = new Date().toISOString().split('T')[0];
    const { data: existingLog, error: fetchError } = await supabase
      .from('visitor_logs')
      .select('*')
      .eq('cookie_id', cookieId)
      .eq('visit_date', today)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      // PGRST116 is the error code for "no rows returned"
      console.error('Error checking visitor log:', fetchError.message);
      return;
    }

    if (existingLog) {
      // Update the existing log
      await supabase
        .from('visitor_logs')
        .update({ interaction_count: existingLog.interaction_count + 1 })
        .eq('id', existingLog.id);
    } else {
      // Create a new log
      await supabase
        .from('visitor_logs')
        .insert([
          {
            ip_address: ipAddress,
            cookie_id: cookieId,
            visit_date: today,
            interaction_count: 1,
          },
        ]);
    }

    // Check for abuse (more than 12 unique visitors in a day)
    const { count, error: countError } = await supabase
      .from('visitor_logs')
      .select('*', { count: 'exact', head: true })
      .eq('visit_date', today);

    if (countError) {
      console.error('Error counting visitors:', countError.message);
      return;
    }

    if (count > 12) {
      console.warn('Abuse detected: More than 12 unique visitors today');
      // In a real app, this would trigger an email or other notification to the admin
    }
  } catch (error) {
    console.error('Error logging visitor interaction:', error.message);
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
  console.info('Processing image thumbnail for file:', file.name);
  return new Promise((resolve, reject) => {
    try {
      const reader = new FileReader();

      reader.onload = (e) => {
        const img = new Image();

        img.onload = async () => {
          try {
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

            // Create a source canvas for the cropped square
            const sourceCanvas = document.createElement('canvas');
            sourceCanvas.width = sourceWidth;
            sourceCanvas.height = sourceHeight;
            const sourceCtx = sourceCanvas.getContext('2d');
            sourceCtx.drawImage(
              img,
              sourceX, sourceY, sourceWidth, sourceHeight,
              0, 0, sourceWidth, sourceHeight
            );

            // Create a destination canvas for the thumbnail
            const destCanvas = document.createElement('canvas');
            destCanvas.width = 150;
            destCanvas.height = 150;

            // Use Pica to resize the cropped square to 150x150
            await picaInstance.resize(sourceCanvas, destCanvas);

            // Use Pica to convert the resized canvas to a JPEG blob
            const blob = await picaInstance.toBlob(destCanvas, 'image/jpeg', 0.9);

            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to convert canvas to blob'));
            }
          } catch (err) {
            reject(err);
          }
        };

        img.onerror = () => {
          reject(new Error('Failed to load image'));
        };

        img.src = e.target.result;
      };

      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };

      reader.readAsDataURL(file);
    } catch (error) {
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
