const Image = require('../models/Image');
const User = require('../models/User');
const { getImageDimensions, validateImageFile, generateImageUrl, deleteImageFile } = require('../utils/imageUtils');
const imageTransformationService = require('../services/imageTransformationService');
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

// Image Transformation Controllers

const transformImage = async (req, res) => {
  try {
    const { id } = req.params;
    const { type, options } = req.body;

    // Find the image
    const image = await Image.findById(id);
    if (!image) {
      return res.status(404).json({
        success: false,
        message: 'Image not found'
      });
    }

    // Check ownership
    if (image.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only transform your own images.'
      });
    }

    // Validate transformation type
    const validTypes = ['resize', 'crop', 'rotate', 'format', 'filter', 'watermark', 'thumbnail'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: `Invalid transformation type. Valid types: ${validTypes.join(', ')}`
      });
    }

    let resultPath;
    
    // Apply transformation based on type
    switch (type) {
      case 'resize':
        resultPath = await imageTransformationService.resizeImage(image.path, options);
        break;
      case 'crop':
        resultPath = await imageTransformationService.cropImage(image.path, options);
        break;
      case 'rotate':
        resultPath = await imageTransformationService.rotateImage(image.path, options);
        break;
      case 'format':
        resultPath = await imageTransformationService.convertFormat(image.path, options);
        break;
      case 'filter':
        resultPath = await imageTransformationService.applyFilter(image.path, options);
        break;
      case 'watermark':
        resultPath = await imageTransformationService.addTextWatermark(image.path, options);
        break;
      case 'thumbnail':
        resultPath = await imageTransformationService.createThumbnail(image.path, options);
        break;
    }

    // Generate URL for transformed image
    const filename = path.basename(resultPath);
    const resultUrl = generateImageUrl(req, filename);

    // Save transformation to database
    const transformation = {
      type,
      parameters: options,
      resultPath,
      resultUrl,
      createdAt: new Date()
    };

    image.transformations.push(transformation);
    await image.save();

    res.status(200).json({
      success: true,
      message: 'Image transformed successfully',
      data: {
        transformation: {
          id: image.transformations[image.transformations.length - 1]._id,
          type,
          parameters: options,
          resultUrl,
          createdAt: transformation.createdAt
        }
      }
    });

  } catch (error) {
    console.error('Transform image error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const batchTransformImage = async (req, res) => {
  try {
    const { id } = req.params;
    const { transformations } = req.body;

    // Find the image
    const image = await Image.findById(id);
    if (!image) {
      return res.status(404).json({
        success: false,
        message: 'Image not found'
      });
    }

    // Check ownership
    if (image.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only transform your own images.'
      });
    }

    // Validate transformations array
    if (!Array.isArray(transformations) || transformations.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Transformations must be a non-empty array'
      });
    }

    // Apply batch transformations
    const results = await imageTransformationService.applyMultipleTransformations(
      image.path,
      transformations
    );

    // Generate URLs and save transformations
    const transformationRecords = results.map(result => {
      const filename = path.basename(result.resultPath);
      const resultUrl = generateImageUrl(req, filename);
      
      return {
        type: result.type,
        parameters: result.parameters,
        resultPath: result.resultPath,
        resultUrl,
        createdAt: new Date()
      };
    });

    // Save all transformations to database
    image.transformations.push(...transformationRecords);
    await image.save();

    res.status(200).json({
      success: true,
      message: 'Batch transformations applied successfully',
      data: {
        transformations: transformationRecords.map((t, index) => ({
          id: image.transformations[image.transformations.length - transformationRecords.length + index]._id,
          type: t.type,
          parameters: t.parameters,
          resultUrl: t.resultUrl,
          createdAt: t.createdAt
        }))
      }
    });

  } catch (error) {
    console.error('Batch transform error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const getImageTransformations = async (req, res) => {
  try {
    const { id } = req.params;

    // Find the image
    const image = await Image.findById(id);
    if (!image) {
      return res.status(404).json({
        success: false,
        message: 'Image not found'
      });
    }

    // Check ownership or public access
    if (image.userId.toString() !== req.user._id.toString() && !image.isPublic) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only access transformations of your own images.'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        transformations: image.transformations.map(t => ({
          id: t._id,
          type: t.type,
          parameters: t.parameters,
          resultUrl: t.resultUrl,
          createdAt: t.createdAt
        }))
      }
    });

  } catch (error) {
    console.error('Get transformations error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const deleteTransformation = async (req, res) => {
  try {
    const { id, transformationId } = req.params;

    // Find the image
    const image = await Image.findById(id);
    if (!image) {
      return res.status(404).json({
        success: false,
        message: 'Image not found'
      });
    }

    // Check ownership
    if (image.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only delete transformations of your own images.'
      });
    }

    // Find transformation
    const transformationIndex = image.transformations.findIndex(
      t => t._id.toString() === transformationId
    );

    if (transformationIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Transformation not found'
      });
    }

    const transformation = image.transformations[transformationIndex];

    // Delete the transformed image file
    if (transformation.resultPath) {
      await deleteImageFile(transformation.resultPath);
    }

    // Remove transformation from database
    image.transformations.splice(transformationIndex, 1);
    await image.save();

    res.status(200).json({
      success: true,
      message: 'Transformation deleted successfully'
    });

  } catch (error) {
    console.error('Delete transformation error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const getImageMetadata = async (req, res) => {
  try {
    const { id } = req.params;

    // Find the image
    const image = await Image.findById(id);
    if (!image) {
      return res.status(404).json({
        success: false,
        message: 'Image not found'
      });
    }

    // Check ownership or public access
    if (image.userId.toString() !== req.user._id.toString() && !image.isPublic) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only access metadata of your own images.'
      });
    }

    // Get detailed metadata using Sharp
    const metadata = await imageTransformationService.getImageMetadata(image.path);

    res.status(200).json({
      success: true,
      data: {
        basic: {
          filename: image.filename,
          originalName: image.originalName,
          mimetype: image.mimetype,
          size: image.size,
          dimensions: image.dimensions,
          uploadedAt: image.uploadedAt
        },
        detailed: metadata
      }
    });

  } catch (error) {
    console.error('Get metadata error:', error);
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
  deleteImage,
  transformImage,
  batchTransformImage,
  getImageTransformations,
  deleteTransformation,
  getImageMetadata
};