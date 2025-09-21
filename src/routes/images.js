const express = require('express');
const router = express.Router();

const { protect } = require('../middlewares/auth');

router.get('/', protect, (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Images routes - coming soon!'
  });
});

module.exports = router;