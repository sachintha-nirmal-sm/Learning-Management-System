const cloudinary = require('../config/cloudinary');
const fs = require('fs');

const removeTempFile = (path) => {
  try {
    if (fs.existsSync(path)) {
      fs.unlinkSync(path);
    }
  } catch (error) {
    console.error('Failed to clean up temp file:', error.message);
  }
};

// @desc    Upload image
// @route   POST /api/upload/image
// @access  Private
exports.uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Please upload a file' });
    }

    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'lms/images',
      resource_type: 'image'
    });

    removeTempFile(req.file.path);

    res.status(200).json({
      success: true,
      url: result.secure_url,
      public_id: result.public_id
    });
  } catch (error) {
    removeTempFile(req.file?.path);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Upload video
// @route   POST /api/upload/video
// @access  Private (Instructor/Admin)
exports.uploadVideo = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Please upload a file' });
    }

    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'lms/videos',
      resource_type: 'video',
      chunk_size: 6000000
    });

    removeTempFile(req.file.path);

    res.status(200).json({
      success: true,
      url: result.secure_url,
      public_id: result.public_id,
      duration: result.duration
    });
  } catch (error) {
    removeTempFile(req.file?.path);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Upload supporting resource (documents, archives, etc.)
// @route   POST /api/upload/resource
// @access  Private (Instructor/Admin)
exports.uploadResource = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Please upload a file' });
    }

    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'lms/resources',
      resource_type: 'raw'
    });

    removeTempFile(req.file.path);

    res.status(200).json({
      success: true,
      url: result.secure_url,
      public_id: result.public_id,
      format: result.format,
      bytes: result.bytes
    });
  } catch (error) {
    removeTempFile(req.file?.path);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete file from Cloudinary
// @route   DELETE /api/upload/:public_id
// @access  Private
exports.deleteFile = async (req, res) => {
  try {
    const { public_id } = req.params;
    const resourceType = req.query.type || 'image';

    await cloudinary.uploader.destroy(public_id, { resource_type: resourceType });

    res.status(200).json({
      success: true,
      message: 'File deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
