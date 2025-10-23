const express = require('express');
const router = express.Router();
const { getDashboardOverview } = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect, authorize('admin'));

router.get('/overview', getDashboardOverview);

module.exports = router;
