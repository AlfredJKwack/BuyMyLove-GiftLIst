import { supabase } from './supabase';
import { getCookieId, setCookieId } from '../utils/cookies';

/**
 * Fetch all gifts
 * @returns {Promise<Array>} Array of gift objects
 */
export const fetchGifts = async () => {
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
  const { data, error } = await supabase
    .from('gifts')
    .insert([
      {
        title: gift.title,
        hyperlink: gift.hyperlink,
        note: gift.note || null,
        image_path: gift.imagePath || null,
        bought: false,
        date_added: new Date().toISOString(),
      },
    ])
    .select();

  if (error) {
    console.error('Error adding gift:', error.message);
    return { success: false, data: null, error: error.message };
  }

  return { success: true, data: data[0], error: null };
};

/**
 * Update an existing gift
 * @param {string} id - The ID of the gift to update
 * @param {Object} updates - The fields to update
 * @returns {Promise<{success: boolean, data: Object|null, error: string|null}>} Result of the operation
 */
export const updateGift = async (id, updates) => {
  try {
    // If there's a new image path, we need to check if there was an old one to delete
    if (updates.image_path) {
      // Get the current gift to check if it had an image
      const { data: currentGift, error: fetchError } = await supabase
        .from('gifts')
        .select('image_path')
        .eq('id', id)
        .single();
      
      if (fetchError) {
        console.error('Error fetching gift for update:', fetchError.message);
        // Continue with the update even if we couldn't fetch the current gift
      } else if (currentGift && currentGift.image_path && currentGift.image_path !== updates.image_path) {
        // If the gift had a different image, delete the old one
        const deleteImageResult = await deleteImageFromStorage(currentGift.image_path);
        if (!deleteImageResult.success) {
          console.warn('Failed to delete old gift image during update, but will continue with gift update:', deleteImageResult.error);
        }
      }
    }
    
    // Update the gift
    const { data, error } = await supabase
      .from('gifts')
      .update(updates)
      .eq('id', id)
      .select();
    
    if (error) {
      console.error('Error updating gift:', error.message);
      return { success: false, data: null, error: error.message };
    }
    
    return { success: true, data: data[0], error: null };
  } catch (error) {
    console.error('Error in gift update process:', error.message);
    return { success: false, data: null, error: error.message };
  }
};

/**
 * Delete an image from Supabase Storage
 * @param {string} imagePath - The full URL path of the image to delete
 * @returns {Promise<{success: boolean, error: string|null}>} Result of the operation
 */
export const deleteImageFromStorage = async (imagePath) => {
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
      console.warn('Could not extract filename from image path:', imagePath);
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
  try {
    // First, get the gift to retrieve its image path
    const { data: gift, error: fetchError } = await supabase
      .from('gifts')
      .select('image_path')
      .eq('id', id)
      .single();
    
    if (fetchError) {
      console.error('Error fetching gift for deletion:', fetchError.message);
      return { success: false, error: fetchError.message };
    }
    
    // If the gift has an image, delete it from storage
    if (gift && gift.image_path) {
      const deleteImageResult = await deleteImageFromStorage(gift.image_path);
      if (!deleteImageResult.success) {
        console.warn('Failed to delete gift image, but will continue with gift deletion:', deleteImageResult.error);
      }
    }
    
    // Now delete the gift record
    const { error } = await supabase
      .from('gifts')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting gift:', error.message);
      return { success: false, error: error.message };
    }
    
    return { success: true, error: null };
  } catch (error) {
    console.error('Error in gift deletion process:', error.message);
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
  // Get the current gift to check if it's already bought
  const { data: currentGift, error: fetchError } = await supabase
    .from('gifts')
    .select('*')
    .eq('id', id)
    .single();

  if (fetchError) {
    console.error('Error fetching gift:', fetchError.message);
    return { success: false, data: null, error: fetchError.message };
  }

  // Get or create a cookie ID for the current user
  let cookieId = getCookieId();
  if (!cookieId) {
    cookieId = crypto.randomUUID();
    setCookieId(cookieId);
  }

  // Check if the user is allowed to toggle the bought status
  if (currentGift.bought && currentGift.bought_by_cookie !== cookieId) {
    return {
      success: false,
      data: null,
      error: 'You cannot unmark a gift that was marked by someone else',
    };
  }

  // Update the gift
  const updates = {
    bought,
    bought_by_cookie: bought ? cookieId : null,
  };

  console.log('toggleBoughtStatus updates:', updates);

  const { data, error } = await supabase
    .from('gifts')
    .update(updates)
    .eq('id', id)
    .select();

  if (error) {
    console.error('Error toggling bought status:', error.message);
    return { success: false, data: null, error: error.message };
  }

  // Log the interaction for abuse detection
  await logVisitorInteraction(cookieId);

  return { success: true, data: data[0], error: null };
};

/**
 * Log a visitor interaction for abuse detection
 * @param {string} cookieId - The cookie ID of the visitor
 * @returns {Promise<void>}
 */
export const logVisitorInteraction = async (cookieId) => {
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

/**
 * Process an image to create a 150x150 thumbnail
 * Resizes the image so the shortest side is 150px, then center-crops
 * @param {File} file - The original image file
 * @returns {Promise<Blob|null>} - A promise that resolves to the processed image blob or null if processing failed
 */
const processImageThumbnail = (file) => {
  return new Promise((resolve, reject) => {
    try {
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
          
          // Convert the canvas to a blob
          canvas.toBlob((blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to convert canvas to blob'));
            }
          }, 'image/jpeg', 0.9); // Use JPEG format with 90% quality
        };
        
        img.onerror = () => {
          reject(new Error('Failed to load image'));
        };
        
        // Set the image source to the file data
        img.src = e.target.result;
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      
      // Read the file as a data URL
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
