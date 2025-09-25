# Image Transformation API Documentation

## Overview

The Image Processor Service now includes comprehensive image transformation capabilities using Sharp.js. You can resize, crop, rotate, convert formats, apply filters, add watermarks, and generate thumbnails for your uploaded images.

## Available Transformations

### 1. Resize
Resize images while maintaining aspect ratio or fitting specific dimensions.

**Endpoint:** `POST /api/images/:id/transform`

**Request Body:**
```json
{
  "type": "resize",
  "options": {
    "width": 800,
    "height": 600,
    "fit": "cover",
    "position": "center",
    "withoutEnlargement": false
  }
}
```

**Fit Options:**
- `cover` (default): Preserving aspect ratio, ensure the image covers both provided dimensions
- `contain`: Preserving aspect ratio, contain within both provided dimensions
- `fill`: Ignore aspect ratio, stretch to exact dimensions
- `inside`: Preserving aspect ratio, resize the image to be as large as possible while ensuring its dimensions are less than or equal to both those specified
- `outside`: Preserving aspect ratio, resize the image to be as small as possible while ensuring its dimensions are greater than or equal to both those specified

### 2. Crop
Extract a region from the image.

**Request Body:**
```json
{
  "type": "crop",
  "options": {
    "left": 100,
    "top": 50,
    "width": 300,
    "height": 200
  }
}
```

### 3. Rotate
Rotate image by specified angle.

**Request Body:**
```json
{
  "type": "rotate",
  "options": {
    "angle": 90,
    "background": { "r": 255, "g": 255, "b": 255, "alpha": 1 }
  }
}
```

### 4. Format Conversion
Convert between image formats.

**Request Body:**
```json
{
  "type": "format",
  "options": {
    "format": "webp",
    "quality": 85
  }
}
```

**Supported Formats:** `jpeg`, `jpg`, `png`, `webp`, `tiff`, `gif`

### 5. Filters
Apply visual filters to images.

**Request Body:**
```json
{
  "type": "filter",
  "options": {
    "filter": "grayscale",
    "intensity": 1
  }
}
```

**Available Filters:**
- `grayscale`: Convert to grayscale
- `sepia`: Apply sepia tone
- `blur`: Apply blur effect (intensity controls blur radius)
- `sharpen`: Sharpen the image
- `negate`: Invert colors

### 6. Watermark
Add text watermark to images.

**Request Body:**
```json
{
  "type": "watermark",
  "options": {
    "text": "© 2025 MyApp",
    "position": "bottom-right",
    "fontSize": 24,
    "color": "rgba(255,255,255,0.8)",
    "font": "Arial"
  }
}
```

**Position Options:** `top-left`, `top-right`, `bottom-left`, `bottom-right`, `center`

### 7. Thumbnail
Generate thumbnail versions.

**Request Body:**
```json
{
  "type": "thumbnail",
  "options": {
    "width": 150,
    "height": 150,
    "quality": 80
  }
}
```

## Batch Transformations

Apply multiple transformations in sequence to create complex image processing pipelines.

**Endpoint:** `POST /api/images/:id/batch-transform`

**Request Body:**
```json
{
  "transformations": [
    {
      "type": "resize",
      "options": { "width": 1000, "height": 800, "fit": "cover" }
    },
    {
      "type": "filter",
      "options": { "filter": "sharpen" }
    },
    {
      "type": "watermark",
      "options": { "text": "© 2025", "position": "bottom-right" }
    },
    {
      "type": "format",
      "options": { "format": "webp", "quality": 90 }
    }
  ]
}
```

## API Endpoints

### Transform Single Image
```http
POST /api/images/:id/transform
Authorization: Bearer <token>
Content-Type: application/json

{
  "type": "resize",
  "options": { ... }
}
```

### Batch Transform Image
```http
POST /api/images/:id/batch-transform
Authorization: Bearer <token>
Content-Type: application/json

{
  "transformations": [...]
}
```

### Get Image Transformations
```http
GET /api/images/:id/transformations
Authorization: Bearer <token>
```

### Delete Transformation
```http
DELETE /api/images/:id/transformations/:transformationId
Authorization: Bearer <token>
```

### Get Image Metadata
```http
GET /api/images/:id/metadata
Authorization: Bearer <token>
```

## Response Format

### Successful Transformation
```json
{
  "success": true,
  "message": "Image transformed successfully",
  "data": {
    "transformation": {
      "id": "60f7b1234567890abcdef123",
      "type": "resize",
      "parameters": {
        "width": 800,
        "height": 600,
        "fit": "cover"
      },
      "resultUrl": "http://localhost:3000/uploads/image_resize_width-800_height-600_1640995200000.jpg",
      "createdAt": "2025-09-24T10:30:00.000Z"
    }
  }
}
```

### Batch Transformation Response
```json
{
  "success": true,
  "message": "Batch transformations applied successfully",
  "data": {
    "transformations": [
      {
        "id": "60f7b1234567890abcdef123",
        "type": "resize",
        "parameters": { "width": 1000, "height": 800 },
        "resultUrl": "...",
        "createdAt": "2025-09-24T10:30:00.000Z"
      },
      {
        "id": "60f7b1234567890abcdef124",
        "type": "filter",
        "parameters": { "filter": "sharpen" },
        "resultUrl": "...",
        "createdAt": "2025-09-24T10:30:01.000Z"
      }
    ]
  }
}
```

### Metadata Response
```json
{
  "success": true,
  "data": {
    "basic": {
      "filename": "image_123456789.jpg",
      "originalName": "photo.jpg",
      "mimetype": "image/jpeg",
      "size": 245760,
      "dimensions": { "width": 1920, "height": 1080 },
      "uploadedAt": "2025-09-24T10:00:00.000Z"
    },
    "detailed": {
      "width": 1920,
      "height": 1080,
      "format": "jpeg",
      "size": 245760,
      "channels": 3,
      "density": 72,
      "hasProfile": false,
      "hasAlpha": false
    }
  }
}
```

## Error Handling

The API returns appropriate HTTP status codes and error messages:

- `400 Bad Request`: Invalid parameters or validation errors
- `401 Unauthorized`: Missing or invalid authentication token
- `403 Forbidden`: Access denied (not image owner)
- `404 Not Found`: Image or transformation not found
- `500 Internal Server Error`: Server processing errors

## Usage Examples

### Example 1: Create a thumbnail
```bash
curl -X POST http://localhost:3000/api/images/60f7b1234567890abcdef123/transform \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "thumbnail",
    "options": {
      "width": 200,
      "height": 200,
      "quality": 85
    }
  }'
```

### Example 2: Convert to WebP with compression
```bash
curl -X POST http://localhost:3000/api/images/60f7b1234567890abcdef123/transform \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "format",
    "options": {
      "format": "webp",
      "quality": 75
    }
  }'
```

### Example 3: Batch processing pipeline
```bash
curl -X POST http://localhost:3000/api/images/60f7b1234567890abcdef123/batch-transform \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{
    "transformations": [
      {
        "type": "resize",
        "options": { "width": 1200, "fit": "inside" }
      },
      {
        "type": "filter",
        "options": { "filter": "sharpen" }
      },
      {
        "type": "watermark",
        "options": {
          "text": "© My Company 2025",
          "position": "bottom-right",
          "fontSize": 20
        }
      }
    ]
  }'
```

## Performance Notes

- Transformations are processed synchronously
- Large images or complex transformations may take time
- Consider implementing background job processing for production use
- Transformed images are stored on disk and URLs are returned immediately
- Original images are preserved; transformations create new files

## File Management

- All transformation results are stored as separate files
- Deleting an image will also delete all its transformations
- Individual transformations can be deleted via the API
- File naming follows the pattern: `original_operation_params_timestamp.ext`