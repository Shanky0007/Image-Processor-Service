const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;
const { generateImageUrl, deleteImageFile } = require('../utils/imageUtils');

class ImageTransformationService {
  constructor() {
    this.supportedFormats = ['jpeg', 'jpg', 'png', 'webp', 'tiff', 'gif'];
    this.supportedFilters = ['grayscale', 'sepia', 'blur', 'sharpen', 'negate'];
  }

  /**
   * Resize image with various options
   */
  async resizeImage(inputPath, options = {}) {
    const {
      width,
      height,
      fit = 'cover', // cover, contain, fill, inside, outside
      position = 'center',
      background = { r: 255, g: 255, b: 255, alpha: 1 },
      withoutEnlargement = false
    } = options;

    const outputPath = this.generateOutputPath(inputPath, 'resize', { width, height });
    
    let transformer = sharp(inputPath);

    if (width || height) {
      transformer = transformer.resize(width, height, {
        fit,
        position,
        background,
        withoutEnlargement
      });
    }

    await transformer.toFile(outputPath);
    return outputPath;
  }

  /**
   * Crop image to specific dimensions
   */
  async cropImage(inputPath, options = {}) {
    const { left, top, width, height } = options;

    if (!left || !top || !width || !height) {
      throw new Error('Crop requires left, top, width, and height parameters');
    }

    const outputPath = this.generateOutputPath(inputPath, 'crop', { left, top, width, height });
    
    await sharp(inputPath)
      .extract({ left, top, width, height })
      .toFile(outputPath);

    return outputPath;
  }

  /**
   * Rotate image by specified angle
   */
  async rotateImage(inputPath, options = {}) {
    const { angle = 90, background = { r: 255, g: 255, b: 255, alpha: 1 } } = options;

    const outputPath = this.generateOutputPath(inputPath, 'rotate', { angle });
    
    await sharp(inputPath)
      .rotate(angle, { background })
      .toFile(outputPath);

    return outputPath;
  }

  /**
   * Convert image format
   */
  async convertFormat(inputPath, options = {}) {
    const { format = 'jpeg', quality = 85 } = options;

    if (!this.supportedFormats.includes(format.toLowerCase())) {
      throw new Error(`Unsupported format: ${format}. Supported formats: ${this.supportedFormats.join(', ')}`);
    }

    const outputPath = this.generateOutputPath(inputPath, 'convert', { format }, format);
    
    let transformer = sharp(inputPath);

    switch (format.toLowerCase()) {
      case 'jpeg':
      case 'jpg':
        transformer = transformer.jpeg({ quality });
        break;
      case 'png':
        transformer = transformer.png({ quality });
        break;
      case 'webp':
        transformer = transformer.webp({ quality });
        break;
      case 'tiff':
        transformer = transformer.tiff({ quality });
        break;
      case 'gif':
        transformer = transformer.gif();
        break;
    }

    await transformer.toFile(outputPath);
    return outputPath;
  }

  /**
   * Apply filters to image
   */
  async applyFilter(inputPath, options = {}) {
    const { filter, intensity = 1 } = options;

    if (!this.supportedFilters.includes(filter)) {
      throw new Error(`Unsupported filter: ${filter}. Supported filters: ${this.supportedFilters.join(', ')}`);
    }

    const outputPath = this.generateOutputPath(inputPath, 'filter', { filter });
    
    let transformer = sharp(inputPath);

    switch (filter) {
      case 'grayscale':
        transformer = transformer.grayscale();
        break;
      case 'sepia':
        transformer = transformer.tint({ r: 255, g: 240, b: 196 });
        break;
      case 'blur':
        transformer = transformer.blur(intensity * 3);
        break;
      case 'sharpen':
        transformer = transformer.sharpen();
        break;
      case 'negate':
        transformer = transformer.negate();
        break;
    }

    await transformer.toFile(outputPath);
    return outputPath;
  }

  /**
   * Add text watermark to image
   */
  async addTextWatermark(inputPath, options = {}) {
    const {
      text,
      position = 'bottom-right',
      fontSize = 24,
      color = 'rgba(255,255,255,0.8)',
      font = 'Arial'
    } = options;

    if (!text) {
      throw new Error('Watermark text is required');
    }

    const outputPath = this.generateOutputPath(inputPath, 'watermark', { text: text.substring(0, 10) });

    // Get image dimensions first
    const { width, height } = await sharp(inputPath).metadata();
    
    // Create SVG text watermark
    const svgWatermark = this.createTextWatermarkSVG(text, fontSize, color, font, position, width, height);
    
    await sharp(inputPath)
      .composite([{
        input: Buffer.from(svgWatermark),
        gravity: this.getGravityFromPosition(position)
      }])
      .toFile(outputPath);

    return outputPath;
  }

  /**
   * Create thumbnail with specified dimensions
   */
  async createThumbnail(inputPath, options = {}) {
    const { width = 150, height = 150, quality = 80 } = options;

    const outputPath = this.generateOutputPath(inputPath, 'thumbnail', { width, height });
    
    await sharp(inputPath)
      .resize(width, height, {
        fit: 'cover',
        position: 'center'
      })
      .jpeg({ quality })
      .toFile(outputPath);

    return outputPath;
  }

  /**
   * Apply multiple transformations in sequence
   */
  async applyMultipleTransformations(inputPath, transformations) {
    let currentPath = inputPath;
    const results = [];

    for (const transformation of transformations) {
      const { type, options } = transformation;
      
      let resultPath;
      
      switch (type) {
        case 'resize':
          resultPath = await this.resizeImage(currentPath, options);
          break;
        case 'crop':
          resultPath = await this.cropImage(currentPath, options);
          break;
        case 'rotate':
          resultPath = await this.rotateImage(currentPath, options);
          break;
        case 'format':
          resultPath = await this.convertFormat(currentPath, options);
          break;
        case 'filter':
          resultPath = await this.applyFilter(currentPath, options);
          break;
        case 'watermark':
          resultPath = await this.addTextWatermark(currentPath, options);
          break;
        case 'thumbnail':
          resultPath = await this.createThumbnail(currentPath, options);
          break;
        default:
          throw new Error(`Unsupported transformation type: ${type}`);
      }

      results.push({
        type,
        parameters: options,
        resultPath,
        resultUrl: null // Will be set by the controller
      });

      // Clean up intermediate files (except the original and final result)
      if (currentPath !== inputPath && results.length > 1) {
        await deleteImageFile(currentPath).catch(() => {}); // Ignore errors
      }

      currentPath = resultPath;
    }

    return results;
  }

  /**
   * Generate output path for transformed image
   */
  generateOutputPath(inputPath, operation, params, newExtension = null) {
    const parsedPath = path.parse(inputPath);
    const timestamp = Date.now();
    const paramString = Object.entries(params)
      .map(([key, value]) => `${key}-${value}`)
      .join('_');
    
    const extension = newExtension || parsedPath.ext;
    const filename = `${parsedPath.name}_${operation}_${paramString}_${timestamp}${extension}`;
    
    return path.join(parsedPath.dir, filename);
  }

  /**
   * Create SVG text watermark
   */
  createTextWatermarkSVG(text, fontSize, color, font, position, imageWidth, imageHeight) {
    const padding = 20;
    let x, y, textAnchor = 'start';

    switch (position) {
      case 'top-left':
        x = padding;
        y = fontSize + padding;
        break;
      case 'top-right':
        x = imageWidth - padding;
        y = fontSize + padding;
        textAnchor = 'end';
        break;
      case 'bottom-left':
        x = padding;
        y = imageHeight - padding;
        break;
      case 'bottom-right':
        x = imageWidth - padding;
        y = imageHeight - padding;
        textAnchor = 'end';
        break;
      case 'center':
        x = imageWidth / 2;
        y = imageHeight / 2;
        textAnchor = 'middle';
        break;
      default:
        x = imageWidth - padding;
        y = imageHeight - padding;
        textAnchor = 'end';
    }

    return `
      <svg width="${imageWidth}" height="${imageHeight}">
        <text x="${x}" y="${y}" font-family="${font}" font-size="${fontSize}" fill="${color}" text-anchor="${textAnchor}">
          ${text}
        </text>
      </svg>
    `;
  }

  /**
   * Convert position to Sharp gravity
   */
  getGravityFromPosition(position) {
    const gravityMap = {
      'top-left': 'northwest',
      'top-right': 'northeast',
      'bottom-left': 'southwest',
      'bottom-right': 'southeast',
      'center': 'center'
    };
    return gravityMap[position] || 'southeast';
  }

  /**
   * Get image metadata
   */
  async getImageMetadata(imagePath) {
    try {
      const metadata = await sharp(imagePath).metadata();
      return {
        width: metadata.width,
        height: metadata.height,
        format: metadata.format,
        size: metadata.size,
        channels: metadata.channels,
        density: metadata.density,
        hasProfile: metadata.hasProfile,
        hasAlpha: metadata.hasAlpha
      };
    } catch (error) {
      throw new Error(`Failed to get image metadata: ${error.message}`);
    }
  }
}

module.exports = new ImageTransformationService();