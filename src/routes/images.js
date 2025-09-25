const express = require('express');
const router = express.Router();

const { protect, validateRequest } = require('../middlewares/auth');
const { 
  validateImageParams, 
  validateImageQuery, 
  validateImageUpload, 
  validateImageTransform, 
  validateBatchTransform 
} = require('../middlewares/validation');
const { uploadSingle, uploadMultiple, handleMulterError } = require('../utils/upload');
const { 
  uploadSingleImage, 
  uploadMultipleImages, 
  getImageById, 
  getUserImages, 
  deleteImage,
  transformImage,
  batchTransformImage,
  getImageTransformations,
  deleteTransformation,
  getImageMetadata
} = require('../controllers/imageController');

// Upload routes
router.post('/upload', protect, uploadSingle, handleMulterError, validateImageUpload, validateRequest, uploadSingleImage);
router.post('/upload/multiple', protect, uploadMultiple, handleMulterError, validateImageUpload, validateRequest, uploadMultipleImages);

// Image CRUD routes
router.get('/', protect, validateImageQuery, validateRequest, getUserImages);
router.get('/:id', protect, validateImageParams, validateRequest, getImageById);
router.delete('/:id', protect, validateImageParams, validateRequest, deleteImage);

// Transformation routes
router.post('/:id/transform', protect, validateImageParams, validateImageTransform, validateRequest, transformImage);
router.post('/:id/batch-transform', protect, validateImageParams, validateBatchTransform, validateRequest, batchTransformImage);
router.get('/:id/transformations', protect, validateImageParams, validateRequest, getImageTransformations);
router.delete('/:id/transformations/:transformationId', protect, validateImageParams, validateRequest, deleteTransformation);

// Metadata route
router.get('/:id/metadata', protect, validateImageParams, validateRequest, getImageMetadata);

module.exports = router;