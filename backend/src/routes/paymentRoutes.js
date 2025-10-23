const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  createCheckoutSession,
  confirmPayment,
  getSummary
} = require('../controllers/paymentController');

router.post('/checkout-session', protect, authorize('student', 'admin'), createCheckoutSession);
router.post('/confirm', protect, authorize('student', 'admin'), confirmPayment);
router.get('/summary', protect, authorize('admin'), getSummary);

module.exports = router;
