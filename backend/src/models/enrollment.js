const mongoose = require('mongoose');

const enrollmentSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  enrolledAt: {
    type: Date,
    default: Date.now
  },
  progress: {
    completedLectures: [{
      type: mongoose.Schema.Types.ObjectId
    }],
    percentageCompleted: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    }
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'dropped'],
    default: 'active'
  },
  completedAt: {
    type: Date
  },
  payment: {
    paymentId: String,
    amount: Number,
    currency: {
      type: String,
      default: 'USD'
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'completed'
    },
    paidAt: Date
  },
  certificateIssued: {
    type: Boolean,
    default: false
  },
  certificateUrl: String
}, {
  timestamps: true
});

// Compound index to prevent duplicate enrollments
enrollmentSchema.index({ student: 1, course: 1 }, { unique: true });

// Method to update progress
enrollmentSchema.methods.updateProgress = async function() {
  const Course = mongoose.model('course');
  const course = await Course.findById(this.course);
  
  if (course && course.lectures.length > 0) {
    this.progress.percentageCompleted = Math.round(
      (this.progress.completedLectures.length / course.lectures.length) * 100
    );
    
    // Mark as completed if 100%
    if (this.progress.percentageCompleted === 100 && this.status === 'active') {
      this.status = 'completed';
      this.completedAt = new Date();
    }
  }
  
  return this.save();
};

module.exports = mongoose.model('enrollment', enrollmentSchema);
