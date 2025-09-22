const express = require('express');
const router = express.Router();

const { protect } = require('../middlewares/auth');
const { validateImageParams, validateImageQuery, validateImageUpload } = require('../middlewares/validation');
const { uploadSingle, uploadMultiple, handleMulterError } = require('../utils/upload');
const { 
  uploadSingleImage, 
  uploadMultipleImages, 
  getImageById, 
  getUserImages, 
  deleteImage 
} = require('../controllers/imageController');

router.post('/upload', protect, uploadSingle, handleMulterError, validateImageUpload, uploadSingleImage);
router.post('/upload/multiple', protect, uploadMultiple, handleMulterError, validateImageUpload, uploadMultipleImages);
router.get('/', protect, validateImageQuery, getUserImages);
router.get('/:id', protect, validateImageParams, getImageById);
router.delete('/:id', protect, validateImageParams, deleteImage);

module.exports = router;