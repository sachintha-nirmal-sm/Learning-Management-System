const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, (req, res) => {
  res.json({ success: true, message: 'Payment routes - Coming soon' });
});

module.exports = router;
