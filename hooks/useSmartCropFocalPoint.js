import { useState, useRef, useEffect } from 'react';
import { getJSON, setJSON } from '../utils/localStorageSafe';
import { lazyImport } from '../utils/lazyImport';

const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * Hook to detect and manage focal point for image cropping using smartcrop
 * @param {Object} imageRef - Ref to the image element
 * @param {Object} cardRef - Ref to the card element (for IntersectionObserver)
 * @param {string} imageUrl - URL of the image
 * @param {number} serverFocalX - Server-provided focal X (0-1)
 * @param {number} serverFocalY - Server-provided focal Y (0-1)
 * @returns {Object|null} Focal point { x, y } or null if not yet detected
 */
export function useSmartCropFocalPoint(imageRef, cardRef, imageUrl, serverFocalX, serverFocalY) {
  const [focalPoint, setFocalPoint] = useState(null);
  const focalPointProcessedRef = useRef(false);

  useEffect(() => {
    if (!imageUrl || !cardRef.current || focalPointProcessedRef.current) {
      return;
    }

    const detectFocalPoint = async () => {
      if (focalPointProcessedRef.current) return;
      focalPointProcessedRef.current = true;

      const cacheKey = `smartcrop:${imageUrl}`;

      // Check localStorage cache first
      const cached = getJSON(cacheKey);
      if (cached && typeof cached.x === 'number' && typeof cached.y === 'number') {
        setFocalPoint(cached);
        return;
      }

      // Check if server provided focal points
      if (typeof serverFocalX === 'number' && typeof serverFocalY === 'number') {
        const serverFocal = { x: serverFocalX, y: serverFocalY };
        setFocalPoint(serverFocal);
        setJSON(cacheKey, { ...serverFocal, v: 1 });
        return;
      }

      // Server didn't provide focal point - run client-side detection
      if (isDevelopment) {
        console.info(`[SmartCrop] Server did not provide focal point for ${imageUrl}, running client-side analysis`);
      }

      try {
        // Lazy-import smartcrop
        const smartcrop = await lazyImport(() => import('smartcrop'));
        const img = imageRef.current;
        
        if (!img || !img.complete || !img.naturalWidth) {
          // Image not loaded yet, wait for it
          await new Promise((resolve) => {
            if (img.complete) {
              resolve();
            } else {
              img.addEventListener('load', resolve, { once: true });
              img.addEventListener('error', resolve, { once: true });
            }
          });
        }

        if (!img.naturalWidth || !img.naturalHeight) {
          throw new Error('Image failed to load');
        }

        // Run smartcrop analysis (500x150 to match server)
        const result = await smartcrop.default.crop(img, { 
          width: 500, 
          height: 150 
        });

        if (result && result.topCrop) {
          // Compute normalized focal point (center of crop)
          const focalX = (result.topCrop.x + result.topCrop.width / 2) / img.naturalWidth;
          const focalY = (result.topCrop.y + result.topCrop.height / 2) / img.naturalHeight;
          
          const focal = {
            x: Math.round(focalX * 1000000) / 1000000,
            y: Math.round(focalY * 1000000) / 1000000,
          };

          setFocalPoint(focal);
          setJSON(cacheKey, { ...focal, v: 1 });
        } else {
          throw new Error('SmartCrop returned no result');
        }
      } catch (err) {
        if (isDevelopment) {
          console.error(`[SmartCrop] Failed to detect focal point for ${imageUrl}, using center fallback:`, err);
        }
        // Fallback to center
        setFocalPoint({ x: 0.5, y: 0.5 });
      }
    };

    // Set up IntersectionObserver
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting || entry.intersectionRatio > 0) {
            detectFocalPoint();
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '200px 0px',
        threshold: 0.01,
      }
    );

    observer.observe(cardRef.current);

    return () => {
      observer.disconnect();
    };
  }, [imageUrl, serverFocalX, serverFocalY, imageRef, cardRef]);

  return focalPoint;
}
