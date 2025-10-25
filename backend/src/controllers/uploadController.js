const cloudinary = require('../config/cloudinary');
const fs = require('fs');
const path = require('path');

const removeTempFile = (path) => {
  try {
    if (fs.existsSync(path)) {
      fs.unlinkSync(path);
    }
  } catch (error) {
    console.error('Failed to clean up temp file:', error.message);
  }
};

const hasCloudinaryConfig = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

// @desc    Upload image
// @route   POST /api/upload/image
// @access  Private
exports.uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Please upload a file' });
    }

    const respondWithLocalFile = () => {
      const fileName = path.basename(req.file.path);
      return res.status(200).json({
        success: true,
        url: `${req.protocol}://${req.get('host')}/uploads/${fileName}`,
        public_id: fileName,
        storage: 'local'
      });
    };

    if (!hasCloudinaryConfig) {
      return respondWithLocalFile();
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
    console.error('Image upload failed:', error.message);
    if (req.file && fs.existsSync(req.file.path)) {
      const fileName = path.basename(req.file.path);
      return res.status(200).json({
        success: true,
        url: `${req.protocol}://${req.get('host')}/uploads/${fileName}`,
        public_id: fileName,
        storage: 'local'
      });
    }
    res.status(500).json({ message: 'Image upload failed. Please try again later.' });
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

    const respondWithLocalFile = () => {
      const fileName = path.basename(req.file.path);
      return res.status(200).json({
        success: true,
        url: `${req.protocol}://${req.get('host')}/uploads/${fileName}`,
        public_id: fileName,
        duration: null,
        storage: 'local'
      });
    };

    if (!hasCloudinaryConfig) {
      return respondWithLocalFile();
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
    console.error('Video upload failed:', error.message);
    if (req.file && fs.existsSync(req.file.path)) {
      const fileName = path.basename(req.file.path);
      return res.status(200).json({
        success: true,
        url: `${req.protocol}://${req.get('host')}/uploads/${fileName}`,
        public_id: fileName,
        duration: null,
        storage: 'local'
      });
    }
    res.status(500).json({ message: 'Video upload failed. Please try again later.' });
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

    const respondWithLocalFile = () => {
      const fileName = path.basename(req.file.path);
      return res.status(200).json({
        success: true,
        url: `${req.protocol}://${req.get('host')}/uploads/${fileName}`,
        public_id: fileName,
        format: path.extname(fileName).slice(1),
        bytes: fs.statSync(req.file.path).size,
        storage: 'local'
      });
    };

    if (!hasCloudinaryConfig) {
      return respondWithLocalFile();
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
    console.error('Resource upload failed:', error.message);
    if (req.file && fs.existsSync(req.file.path)) {
      return respondWithLocalFile();
    }
    res.status(500).json({ message: 'Resource upload failed. Please try again later.' });
  }
};

// @desc    Delete file from Cloudinary
// @route   DELETE /api/upload/:public_id
// @access  Private
exports.deleteFile = async (req, res) => {
  try {
    const { public_id } = req.params;
    const resourceType = req.query.type || 'image';

  const uploadsDir = path.join(__dirname, '..', '..', 'uploads');
    const candidatePath = path.join(uploadsDir, public_id);

    if (fs.existsSync(candidatePath)) {
      try {
        fs.unlinkSync(candidatePath);
        return res.status(200).json({
          success: true,
          message: 'Local file deleted successfully'
        });
      } catch (error) {
        return res.status(500).json({ message: 'Failed to delete local file' });
      }
    }

    await cloudinary.uploader.destroy(public_id, { resource_type: resourceType });

    res.status(200).json({
      success: true,
      message: 'File deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
