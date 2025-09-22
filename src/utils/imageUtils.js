const sharp = require('sharp');
const path = require('path');

const getImageDimensions = async (filePath) => {
  try {
    const metadata = await sharp(filePath).metadata();
    return {
      width: metadata.width,
      height: metadata.height
    };
  } catch (error) {
    console.error('Error getting image dimensions:', error);
    return { width: null, height: null };
  }
};

const validateImageFile = async (filePath) => {
  try {
    const metadata = await sharp(filePath).metadata();
    return {
      isValid: true,
      format: metadata.format,
      width: metadata.width,
      height: metadata.height,
      channels: metadata.channels,
      hasAlpha: metadata.hasAlpha
    };
  } catch (error) {
    return {
      isValid: false,
      error: error.message
    };
  }
};

const generateImageUrl = (req, filename) => {
  const protocol = req.protocol;
  const host = req.get('host');
  return `${protocol}://${host}/uploads/${filename}`;
};

const deleteImageFile = async (filePath) => {
  try {
    const fs = require('fs').promises;
    await fs.unlink(filePath);
    return true;
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
};

const sanitizeFilename = (filename) => {
  return filename
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .replace(/_{2,}/g, '_')
    .substring(0, 100);
};

module.exports = {
  getImageDimensions,
  validateImageFile,
  generateImageUrl,
  deleteImageFile,
  sanitizeFilename
};