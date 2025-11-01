import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { requireAdmin } from '../../lib/auth.js';

// Disable default body parser to handle multipart form data
export const config = {
  api: {
    bodyParser: false,
  },
};

// Helper to parse multipart form data
async function parseFormData(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let boundary = null;

    // Extract boundary from content-type
    const contentType = req.headers['content-type'];
    if (contentType) {
      const match = contentType.match(/boundary=(.+)/);
      if (match) {
        boundary = '--' + match[1];
      }
    }

    req.on('data', (chunk) => {
      chunks.push(chunk);
    });

    req.on('end', () => {
      try {
        const buffer = Buffer.concat(chunks);
        const data = buffer.toString('binary');

        if (!boundary) {
          return reject(new Error('No boundary found'));
        }

        // Parse multipart data
        const parts = data.split(boundary);
        const files = {};

        for (const part of parts) {
          if (part.includes('Content-Disposition')) {
            const nameMatch = part.match(/name="([^"]+)"/);
            const filenameMatch = part.match(/filename="([^"]+)"/);

            if (nameMatch && filenameMatch) {
              const fieldName = nameMatch[1];
              const filename = filenameMatch[1];

              // Extract binary data after headers
              const dataStart = part.indexOf('\r\n\r\n') + 4;
              const dataEnd = part.lastIndexOf('\r\n');
              const fileData = part.substring(dataStart, dataEnd);

              files[fieldName] = {
                filename,
                data: Buffer.from(fileData, 'binary'),
              };
            }
          }
        }

        resolve(files);
      } catch (error) {
        reject(error);
      }
    });

    req.on('error', reject);
  });
}

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Parse multipart form data
    const files = await parseFormData(req);

    if (!files.image) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const { filename, data } = files.image;

    // Generate unique filename
    const timestamp = Date.now();
    const ext = path.extname(filename);
    const newFilename = `gift-${timestamp}.jpg`; // Always save as JPEG

    // Ensure public/uploads directory exists
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const filePath = path.join(uploadsDir, newFilename);

    // Process image with sharp: resize and convert to JPEG
    await sharp(data)
      .resize(150, 150, {
        fit: 'cover',
        position: 'center',
      })
      .jpeg({ quality: 90 })
      .toFile(filePath);

    // Return public URL
    const imageUrl = `/uploads/${newFilename}`;

    return res.status(200).json({
      success: true,
      imageUrl,
    });
  } catch (error) {
    console.error('Error uploading image:', error);
    return res.status(500).json({ error: 'Failed to upload image' });
  }
}

// Export with admin authentication middleware
export default requireAdmin(handler);
