import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
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
    maxFileSize: 1_500_000, // 1.5MB
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
      
      resolve(file);
    });
  });
}

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Parse upload with size and type limits
    const file = await parseForm(req);

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

    // Process image with sharp: resize and convert to JPEG
    try {
      await sharp(file.filepath)
        .resize(150, 150, {
          fit: 'cover',
          position: 'center',
        })
        .jpeg({ quality: 90 })
        .toFile(outputPath);
    } finally {
      // Always clean up temp file
      try {
        await fs.promises.unlink(file.filepath);
      } catch (cleanupErr) {
        // Ignore cleanup errors
      }
    }

    // Return public URL
    const imageUrl = `/uploads/${newFilename}`;
    return res.status(200).json({
      success: true,
      imageUrl,
    });
  } catch (error) {
    // Map formidable errors to appropriate HTTP status codes
    if (error?.code === 'LIMIT_FILE_SIZE' || error?.httpCode === 413) {
      return res.status(413).json({ error: 'File too large (max 1.5MB)' });
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
