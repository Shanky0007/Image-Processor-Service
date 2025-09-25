const { body, query, param } = require('express-validator');

const validateRegister = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 20 })
    .withMessage('Username must be between 3 and 20 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  
  body('email')
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number')
];

const validateLogin = [
  body('username')
    .trim()
    .notEmpty()
    .withMessage('Username or email is required'),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

const validateProfileUpdate = [
  body('username')
    .optional()
    .trim()
    .isLength({ min: 3, max: 20 })
    .withMessage('Username must be between 3 and 20 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  
  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail()
];

const validateImageParams = [
  param('id')
    .isMongoId()
    .withMessage('Invalid image ID format')
];

const validateImageQuery = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50'),
  
  query('sortBy')
    .optional()
    .isIn(['createdAt', 'updatedAt', 'size', 'originalName'])
    .withMessage('Invalid sort field'),
  
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc'),
  
  query('mimetype')
    .optional()
    .matches(/^image\/(jpeg|jpg|png|webp|gif)$/)
    .withMessage('Invalid mimetype filter')
];

const validateImageUpload = [
  body('tags')
    .optional()
    .isString()
    .isLength({ max: 200 })
    .withMessage('Tags must be a string with maximum 200 characters')
];

const validateImageTransform = [
  body('type')
    .isIn(['resize', 'crop', 'rotate', 'format', 'filter', 'watermark', 'thumbnail'])
    .withMessage('Invalid transformation type'),
  
  body('options')
    .isObject()
    .withMessage('Options must be an object'),
  
  // Resize validation
  body('options.width')
    .if(body('type').equals('resize'))
    .optional()
    .isInt({ min: 1, max: 5000 })
    .withMessage('Width must be between 1 and 5000 pixels'),
  
  body('options.height')
    .if(body('type').equals('resize'))
    .optional()
    .isInt({ min: 1, max: 5000 })
    .withMessage('Height must be between 1 and 5000 pixels'),
  
  // Crop validation
  body('options.left')
    .if(body('type').equals('crop'))
    .isInt({ min: 0 })
    .withMessage('Left position must be a non-negative integer'),
  
  body('options.top')
    .if(body('type').equals('crop'))
    .isInt({ min: 0 })
    .withMessage('Top position must be a non-negative integer'),
  
  body('options.width')
    .if(body('type').equals('crop'))
    .isInt({ min: 1 })
    .withMessage('Crop width must be a positive integer'),
  
  body('options.height')
    .if(body('type').equals('crop'))
    .isInt({ min: 1 })
    .withMessage('Crop height must be a positive integer'),
  
  // Rotate validation
  body('options.angle')
    .if(body('type').equals('rotate'))
    .optional()
    .isInt({ min: -360, max: 360 })
    .withMessage('Angle must be between -360 and 360 degrees'),
  
  // Format validation
  body('options.format')
    .if(body('type').equals('format'))
    .isIn(['jpeg', 'jpg', 'png', 'webp', 'tiff', 'gif'])
    .withMessage('Invalid format'),
  
  body('options.quality')
    .if(body('type').equals('format'))
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Quality must be between 1 and 100'),
  
  // Filter validation
  body('options.filter')
    .if(body('type').equals('filter'))
    .isIn(['grayscale', 'sepia', 'blur', 'sharpen', 'negate'])
    .withMessage('Invalid filter type'),
  
  body('options.intensity')
    .if(body('type').equals('filter'))
    .optional()
    .isFloat({ min: 0.1, max: 10 })
    .withMessage('Intensity must be between 0.1 and 10'),
  
  // Watermark validation
  body('options.text')
    .if(body('type').equals('watermark'))
    .isString()
    .isLength({ min: 1, max: 100 })
    .withMessage('Watermark text must be between 1 and 100 characters'),
  
  body('options.position')
    .if(body('type').equals('watermark'))
    .optional()
    .isIn(['top-left', 'top-right', 'bottom-left', 'bottom-right', 'center'])
    .withMessage('Invalid watermark position'),
  
  // Thumbnail validation
  body('options.width')
    .if(body('type').equals('thumbnail'))
    .optional()
    .isInt({ min: 50, max: 500 })
    .withMessage('Thumbnail width must be between 50 and 500 pixels'),
  
  body('options.height')
    .if(body('type').equals('thumbnail'))
    .optional()
    .isInt({ min: 50, max: 500 })
    .withMessage('Thumbnail height must be between 50 and 500 pixels')
];

const validateBatchTransform = [
  body('transformations')
    .isArray({ min: 1, max: 10 })
    .withMessage('Transformations must be an array with 1-10 items'),
  
  body('transformations.*.type')
    .isIn(['resize', 'crop', 'rotate', 'format', 'filter', 'watermark', 'thumbnail'])
    .withMessage('Invalid transformation type'),
  
  body('transformations.*.options')
    .isObject()
    .withMessage('Each transformation must have an options object')
];

module.exports = {
  validateRegister,
  validateLogin,
  validateProfileUpdate,
  validateImageParams,
  validateImageQuery,
  validateImageUpload,
  validateImageTransform,
  validateBatchTransform
};