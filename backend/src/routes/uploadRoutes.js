const express = require('express');
const router = express.Router();
const { uploadImage, uploadVideo, deleteFile } = require('../controllers/uploadController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.post('/image', protect, upload.single('file'), uploadImage);
router.post('/video', protect, authorize('instructor', 'admin'), upload.single('file'), uploadVideo);
router.delete('/:public_id', protect, deleteFile);

module.exports = router;