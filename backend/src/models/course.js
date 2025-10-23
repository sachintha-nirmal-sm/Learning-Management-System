const mongoose = require('mongoose');

const lectureSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: String,
  videoUrl: String,
  videoPublicId: String,
  duration: Number, // in minutes
  resources: [{
    title: String,
    url: String,
    publicId: String
  }],
  isPreview: {
    type: Boolean,
    default: false
  },
  order: {
    type: Number,
    default: 0
  }
});

const courseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Course title is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Course description is required']
  },
  instructor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['Programming', 'Design', 'Business', 'Marketing', 'Photography', 'Music', 'Other']
  },
  level: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced', 'All Levels'],
    default: 'Beginner'
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    default: 0
  },
  thumbnail: {
    public_id: String,
    url: String
  },
  requirements: {
    type: [String],
    default: []
  },
  whatYouWillLearn: {
    type: [String],
    default: []
  },
  language: {
    type: String,
    default: 'English'
  },
  lectures: [lectureSchema],
  enrolledStudents: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  ratings: {
    average: {
      type: Number,
      default: 0
    },
    count: {
      type: Number,
      default: 0
    }
  },
  status: {
    type: String,
    enum: ['draft', 'pending', 'published', 'rejected'],
    default: 'draft'
  },
  reviewNotes: String,
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: Date
}, {
  timestamps: true
});

module.exports = mongoose.model('Course', courseSchema);