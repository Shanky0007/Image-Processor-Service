const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  mimetype: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    required: true
  },
  dimensions: {
    width: Number,
    height: Number
  },
  path: {
    type: String,
    required: true
  },
  url: {
    type: String,
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  transformations: [{
    type: {
      type: String,
      enum: ['resize', 'crop', 'rotate', 'watermark', 'filter', 'format']
    },
    parameters: mongoose.Schema.Types.Mixed,
    resultPath: String,
    resultUrl: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  isPublic: {
    type: Boolean,
    default: false
  },
  tags: [String],
  uploadedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

imageSchema.index({ userId: 1, createdAt: -1 });
imageSchema.index({ tags: 1 });
imageSchema.index({ mimetype: 1 });

module.exports = mongoose.model('Image', imageSchema);