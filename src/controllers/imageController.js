const Image = require('../models/Image');
const User = require('../models/User');
const { getImageDimensions, validateImageFile, generateImageUrl, deleteImageFile } = require('../utils/imageUtils');
const path = require('path');
const fs = require('fs').promises;

const uploadSingleImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided'
      });
    }

    const filePath = req.file.path;
    const validation = await validateImageFile(filePath);

    if (!validation.isValid) {
      await deleteImageFile(filePath);
      return res.status(400).json({
        success: false,
        message: 'Invalid image file',
        error: validation.error
      });
    }

    const dimensions = await getImageDimensions(filePath);
    const imageUrl = generateImageUrl(req, req.file.filename);

    const imageData = new Image({
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      dimensions: dimensions,
      path: filePath,
      url: imageUrl,
      userId: req.user._id,
      tags: req.body.tags ? req.body.tags.split(',').map(tag => tag.trim()) : []
    });

    await imageData.save();

    await User.findByIdAndUpdate(
      req.user._id,
      { $push: { uploadedImages: imageData._id } }
    );

    res.status(201).json({
      success: true,
      message: 'Image uploaded successfully',
      data: {
        image: imageData
      }
    });

  } catch (error) {
    if (req.file) {
      await deleteImageFile(req.file.path);
    }
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const uploadMultipleImages = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No image files provided'
      });
    }

    const uploadedImages = [];
    const failedUploads = [];

    for (const file of req.files) {
      try {
        const validation = await validateImageFile(file.path);

        if (!validation.isValid) {
          await deleteImageFile(file.path);
          failedUploads.push({
            filename: file.originalname,
            error: validation.error
          });
          continue;
        }

        const dimensions = await getImageDimensions(file.path);
        const imageUrl = generateImageUrl(req, file.filename);

        const imageData = new Image({
          filename: file.filename,
          originalName: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
          dimensions: dimensions,
          path: file.path,
          url: imageUrl,
          userId: req.user._id,
          tags: req.body.tags ? req.body.tags.split(',').map(tag => tag.trim()) : []
        });

        await imageData.save();
        uploadedImages.push(imageData);

        await User.findByIdAndUpdate(
          req.user._id,
          { $push: { uploadedImages: imageData._id } }
        );

      } catch (error) {
        await deleteImageFile(file.path);
        failedUploads.push({
          filename: file.originalname,
          error: error.message
        });
      }
    }

    const response = {
      success: true,
      message: `${uploadedImages.length} image(s) uploaded successfully`,
      data: {
        uploadedImages,
        uploadedCount: uploadedImages.length,
        totalFiles: req.files.length
      }
    };

    if (failedUploads.length > 0) {
      response.warnings = {
        failedUploads,
        failedCount: failedUploads.length
      };
    }

    res.status(201).json(response);

  } catch (error) {
    if (req.files) {
      for (const file of req.files) {
        await deleteImageFile(file.path);
      }
    }
    console.error('Multiple upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const getImageById = async (req, res) => {
  try {
    const image = await Image.findById(req.params.id);

    if (!image) {
      return res.status(404).json({
        success: false,
        message: 'Image not found'
      });
    }

    if (image.userId.toString() !== req.user._id.toString() && !image.isPublic) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only access your own images.'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        image
      }
    });

  } catch (error) {
    console.error('Get image error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const getUserImages = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = { userId: req.user._id };

    if (req.query.mimetype) {
      filter.mimetype = { $regex: req.query.mimetype, $options: 'i' };
    }

    if (req.query.tags) {
      const tags = req.query.tags.split(',').map(tag => tag.trim());
      filter.tags = { $in: tags };
    }

    const sortOptions = {};
    if (req.query.sortBy) {
      const sortBy = req.query.sortBy;
      const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
      sortOptions[sortBy] = sortOrder;
    } else {
      sortOptions.createdAt = -1;
    }

    const images = await Image.find(filter)
      .sort(sortOptions)
      .skip(skip)
      .limit(limit);

    const totalImages = await Image.countDocuments(filter);
    const totalPages = Math.ceil(totalImages / limit);

    res.status(200).json({
      success: true,
      data: {
        images,
        pagination: {
          currentPage: page,
          totalPages,
          totalImages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Get user images error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const deleteImage = async (req, res) => {
  try {
    const image = await Image.findById(req.params.id);

    if (!image) {
      return res.status(404).json({
        success: false,
        message: 'Image not found'
      });
    }

    if (image.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only delete your own images.'
      });
    }

    await deleteImageFile(image.path);

    if (image.transformations && image.transformations.length > 0) {
      for (const transformation of image.transformations) {
        if (transformation.resultPath) {
          await deleteImageFile(transformation.resultPath);
        }
      }
    }

    await Image.findByIdAndDelete(req.params.id);

    await User.findByIdAndUpdate(
      req.user._id,
      { $pull: { uploadedImages: req.params.id } }
    );

    res.status(200).json({
      success: true,
      message: 'Image deleted successfully'
    });

  } catch (error) {
    console.error('Delete image error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  uploadSingleImage,
  uploadMultipleImages,
  getImageById,
  getUserImages,
  deleteImage
};