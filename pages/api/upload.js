import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import smartcrop from 'smartcrop-sharp';
import { requireAdmin } from '../../lib/auth.js';
import formidable from 'formidable';
import { fileTypeFromFile } from 'file-type';

// Disable default body parser to handle multipart form data
export const config = {
  api: {
    bodyParser: false,
  },
};

// Parse multipart form using formidable with strict limits
function parseForm(req) {
  const form = formidable({
    multiples: false,
    maxFiles: 1,
    maxFileSize: 2_500_000, // 2.5MB
    filter: (part) => {
      // Only accept parts that have a mimetype starting with 'image/'
      return Boolean(part.mimetype && part.mimetype.startsWith('image/'));
    },
  });

  return new Promise((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) return reject(err);
      
      // Extract the image file
      const file = Array.isArray(files.image) ? files.image[0] : files.image;
      if (!file) return reject(new Error('NO_IMAGE'));
      
      resolve({ file, fields });
    });
  });
}

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Parse upload with size and type limits
    const { file, fields } = await parseForm(req);

    // Validate magic bytes to prevent mime type spoofing
    const fileType = await fileTypeFromFile(file.filepath);
    const allowedExtensions = new Set(['jpg', 'jpeg', 'png', 'webp']);
    
    if (!fileType || !allowedExtensions.has(fileType.ext)) {
      // Clean up temp file and reject
      try {
        await fs.promises.unlink(file.filepath);
      } catch (cleanupErr) {
        // Ignore cleanup errors
      }
      return res.status(400).json({ error: 'Invalid image type' });
    }

    // Ensure public/uploads directory exists
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    await fs.promises.mkdir(uploadsDir, { recursive: true });

    // Generate unique filename
    const timestamp = Date.now();
    const newFilename = `gift-${timestamp}.jpg`; // Always save as JPEG
    const outputPath = path.join(uploadsDir, newFilename);

    // Process image with sharp and smartcrop
    let focalPoint = null;
    
    try {
      // Step 1: Use smartcrop to find optimal 500x500 crop region
      const firstPassResult = await smartcrop.crop(file.filepath, { 
        width: 500, 
        height: 500 
      });
      
      let cropX, cropY, cropWidth, cropHeight;
      
      if (firstPassResult && firstPassResult.topCrop) {
        cropX = Math.floor(firstPassResult.topCrop.x);
        cropY = Math.floor(firstPassResult.topCrop.y);
        cropWidth = Math.floor(firstPassResult.topCrop.width);
        cropHeight = Math.floor(firstPassResult.topCrop.height);
      } else {
        // Fallback to center square
        const metadata = await sharp(file.filepath).metadata();
        const sourceSize = Math.min(metadata.width, metadata.height);
        cropX = Math.floor((metadata.width - sourceSize) / 2);
        cropY = Math.floor((metadata.height - sourceSize) / 2);
        cropWidth = sourceSize;
        cropHeight = sourceSize;
      }
      
      // Step 2: Extract and resize to 500x500, save to disk
      await sharp(file.filepath)
        .extract({ 
          left: cropX, 
          top: cropY, 
          width: cropWidth, 
          height: cropHeight 
        })
        .resize(500, 500, {
          fit: 'cover',
          position: 'center',
          kernel: sharp.kernel.lanczos3,
        })
        .jpeg({ quality: 90 })
        .toFile(outputPath);
      
      // Step 3: Run smartcrop again on the saved 500x500 image with 500x150 target
      const secondPassResult = await smartcrop.crop(outputPath, { 
        width: 500, 
        height: 150 
      });
      
      if (secondPassResult && secondPassResult.topCrop) {
        // Compute normalized focal point (center of the 500x150 crop within the 500x500 image)
        const focalX = (secondPassResult.topCrop.x + secondPassResult.topCrop.width / 2) / 500;
        const focalY = (secondPassResult.topCrop.y + secondPassResult.topCrop.height / 2) / 500;
        
        // Round to 6 decimal places for storage
        focalPoint = {
          x: Math.round(focalX * 1000000) / 1000000,
          y: Math.round(focalY * 1000000) / 1000000,
        };
      } else {
        // Fallback to center if second pass fails
        focalPoint = { x: 0.5, y: 0.5 };
      }
    } finally {
      // Always clean up temp file
      try {
        await fs.promises.unlink(file.filepath);
      } catch (cleanupErr) {
        // Ignore cleanup errors
      }
    }

    // Return public URL and focal point
    const imageUrl = `/uploads/${newFilename}`;
    return res.status(200).json({
      success: true,
      imageUrl,
      focalPoint,
    });
  } catch (error) {
    // Map formidable errors to appropriate HTTP status codes
    if (error?.code === 'LIMIT_FILE_SIZE' || error?.httpCode === 413) {
      return res.status(413).json({ error: 'File too large (max 2.5MB)' });
    }
    if (error?.message === 'NO_IMAGE') {
      return res.status(400).json({ error: 'No image file provided' });
    }
    
    console.error('Error uploading image:', error);
    return res.status(500).json({ error: 'Failed to upload image' });
  }
}

// Export with admin authentication middleware
export default requireAdmin(handler);
