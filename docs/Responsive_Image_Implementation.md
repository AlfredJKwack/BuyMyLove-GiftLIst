# Responsive Image Implementation with Smart Focal Point Detection

We could have simply used css to crop the images on narrow screens, but that would not have been as effective as using smart focal point detection... so we did that instead. Then we overengineerd the implementation to the point of absurdity...

## Overview

This implementation adds responsive card layouts for mobile viewports (<500px width) with intelligent focal point detection using SmartCrop.js. Images are now cropped to 500x500px on upload with optimal focal points computed server-side and cached in the database.

## Key Features

### 1. Server-Side Two-Pass Smart Cropping (Upload API)
- **File**: `pages/api/upload.js`
- Images are processed using a **two-pass SmartCrop approach**:
  1. **First pass**: Detects optimal 500x500px square crop region from original image
  2. **Second pass**: Analyzes the saved 500x500px image with 500x150px target to compute focal point for mobile layout
- Uses **smartcrop-sharp** library for both detection passes
- Computes and stores normalized focal points [0..1] in database
- Returns focal point in API response for immediate client persistence
- Falls back to center crop (0.5, 0.5) if either SmartCrop pass fails

### 2. Database Schema Updates
- **Files**: `database/schema.js`
- Added two columns to `gifts` table:
  - `image_focal_x` (double precision) - Normalized x-coordinate [0..1]
  - `image_focal_y` (double precision) - Normalized y-coordinate [0..1]
- Focal point columns included in initial migration

### 3. Client-Side Lazy Focal Point Detection
- **File**: `components/GiftCard.js`
- Uses **IntersectionObserver** to trigger focal point detection when cards near viewport (200px margin)
- **Three-tier fallback strategy**:
  1. Checks localStorage cache first (`smartcrop:<imageUrl>` key)
  2. Falls back to server-provided focal points from database (`gift.imageFocalX`, `gift.imageFocalY`)
  3. Only runs client-side SmartCrop analysis if no cached/server data available
- Client-side analysis uses **500x150px target** to match server's second pass
- Caches all focal points in localStorage for performance (with version flag `v: 1`)
- Prevents duplicate processing with `focalPointProcessedRef`
- Development logging for debugging (NODE_ENV=development)

### 4. Responsive CSS Layout
- **File**: `styles/components/_card.css`
- New `@media (max-width: 500px)` breakpoint
- Cards switch to vertical layout (image above content)
- Image becomes full-width with 150px height
- Top corners rounded, bottom corners square (follows card border radius)
- Uses CSS variables `--focal-x` and `--focal-y` for `object-position`
- Maintains proper border styling for bought items

### 5. Gift Form Modal Updates
- **File**: `components/GiftFormModal.js`
- Preview canvas renders at **150x150px** (reduced from original implementation)
- Captures focal point from upload API response (`uploadData.focalPoint`)
- Persists focal points to database via gift API (`imageFocalX`, `imageFocalY`)
- Sends original file to server (not preview) for server-side processing

### 6. Retroactive Focal Point Computation
- **File**: `scripts/compute_focal_points.js`
- Standalone script to compute focal points for existing images
- Processes gifts with images but missing focal point data
- Batch processing with configurable batch size
- Dry-run mode for previewing changes
- Detailed progress reporting and error handling

## How to Use

### Running the Retroactive Script

Compute focal points for all existing images:

```bash
NODE_ENV=production DATABASE_URL="your_database_url" node scripts/compute_focal_points.js
```

Preview changes without updating database (dry run):

```bash
DRY_RUN=true NODE_ENV=production DATABASE_URL="your_database_url" node scripts/compute_focal_points.js
```

Custom batch size:

```bash
BATCH_SIZE=5 NODE_ENV=production DATABASE_URL="your_database_url" node scripts/compute_focal_points.js
```

### Uploading New Images

1. Admin uploads an image through the UI (GiftFormModal)
2. Upload API automatically:
   - **First pass**: Detects optimal 500x500px crop region from original image
   - Extracts and saves cropped region to disk as 500x500px JPEG
   - **Second pass**: Analyzes saved image with 500x150px target for mobile layout
   - Computes normalized focal point (center of 500x150 crop within 500x500 image)
   - Returns imageUrl and focalPoint in response
3. Frontend receives response and captures focal point
4. Gift API persists imageUrl, imageFocalX, and imageFocalY to `gifts` table
5. Focal point immediately available for all future renders

### Viewing on Mobile

1. Open the gift list on a device with viewport width < 500px
2. Cards automatically switch to vertical layout
3. Images display full-width at top of card (150px height)
4. Smart focal point ensures important content is visible
5. IntersectionObserver triggers lazy analysis only when needed

## Technical Details

### Focal Point Calculation

The upload API uses a two-pass approach:

**First Pass (500x500 square crop):**
```javascript
// Detect optimal 500x500 crop from original image
const firstPassResult = await smartcrop.crop(file.filepath, { 
  width: 500, 
  height: 500 
});
```

**Second Pass (500x150 mobile crop):**
```javascript
// Analyze saved 500x500 image for mobile layout focal point
const secondPassResult = await smartcrop.crop(outputPath, { 
  width: 500, 
  height: 150 
});

// Compute normalized focal point (center of crop within 500x500 image)
const focalX = (secondPassResult.topCrop.x + secondPassResult.topCrop.width / 2) / 500;
const focalY = (secondPassResult.topCrop.y + secondPassResult.topCrop.height / 2) / 500;
```

Values are rounded to 6 decimal places for storage efficiency.

### CSS Integration

CSS variables are set dynamically on each card:

```css
.gift-card {
  --focal-x: 42.5%;  /* computed from focalPoint.x */
  --focal-y: 33.8%;  /* computed from focalPoint.y */
}

.gift-image {
  object-fit: cover;
  object-position: var(--focal-x, 50%) var(--focal-y, 50%);
}
```

### Caching Strategy

1. **localStorage**: Client-side cache per image URL
   - Key format: `smartcrop:<imageUrl>`
   - Value: `{ x: 0.425, y: 0.338, v: 1 }`
   - No expiry (persistent across sessions)

2. **Database**: Server-side persistent storage
   - Stored in `gifts.image_focal_x` and `gifts.image_focal_y`
   - Served with gift data on every request
   - Single source of truth for all clients

### Performance Optimizations

- **Lazy Loading**: SmartCrop library loaded only when needed
- **IntersectionObserver**: Analysis triggers only near viewport
- **Caching**: Multiple layers prevent repeated computation
- **Batch Processing**: Retroactive script processes in configurable batches
- **Fallback**: Center crop used if analysis fails (no blocking)

### Development Logging

When `NODE_ENV=development`, the following are logged to console:

- SmartCrop analysis failures (with fallback to center)
- Server missing focal point data (triggers client-side analysis)
- localStorage cache errors

## Dependencies Added

- **smartcrop** (^2.0.5): Client-side image analysis
- **smartcrop-sharp** (^2.0.8): Server-side image analysis with Sharp integration

Installed with `--legacy-peer-deps` flag due to Sharp version compatibility.

## Testing Checklist

- [ ] Upload a new image and verify two-pass SmartCrop processing
- [ ] Check database for focal point values (image_focal_x, image_focal_y) on new gifts
- [ ] Verify upload API returns focalPoint in response
- [ ] Resize browser to <500px width and verify vertical card layout
- [ ] Verify image displays with proper focal point positioning
- [ ] Test localStorage caching (check DevTools > Application > Local Storage for `smartcrop:` keys)
- [ ] Verify three-tier fallback (localStorage → server → client SmartCrop)
- [ ] Run retroactive script on existing images
- [ ] Verify development console logs when focal points are missing
- [ ] Test on actual mobile devices (iOS/Android)
- [ ] Verify IntersectionObserver triggers at correct scroll position (200px margin)
- [ ] Confirm fallback to center (0.5, 0.5) when SmartCrop fails
- [ ] Test with images that have off-center subjects

## Browser Compatibility

- Modern browsers with IntersectionObserver support (Chrome 51+, Firefox 55+, Safari 12.1+)
- CSS Custom Properties support required
- object-fit and object-position CSS properties required

## Erratum
If you've read this far, congratulations! Think about it: you've just read a 1000+ word document about image optimization. Now consider what we actually implemented, for a simple gift list app no less! 

We wanted to move from a square image to a banner style image on small screens. You can achieve that with CSS just fine. But of course when you remove 70% of the image doing so the question of focal point becomes critical. Where should the image be cropped to? 

Entering stage left is the main actor in our solution, the venerable SmartCrop.js library. It's fast, it's good, and it's been around for a while. We could just have it dynamically calculate all the images on a page, or even do that strategically when they are about to enter the viewport. We implemented that, sure. 

We also went a step further. Why would each client have to calculate that focal point at all? Just calculate it once, store it in the db and be done with it. Just serve it up as ddata. We did that too. 

And then we considered all the edge cases that never happen, and implemented solutions for those too...

> Premature optimization is the root of all evil

Yeah, right!