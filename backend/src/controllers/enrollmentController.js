const Enrollment = require('../models/enrollment');
const Course = require('../models/course');
const User = require('../models/User');

// @desc    Enroll in a course
// @route   POST /api/enrollments/:courseId
// @access  Private (Student)
exports.enrollCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const studentId = req.user._id;

    // Check if course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Check if course is published
    if (course.status !== 'published') {
      return res.status(400).json({ message: 'Course is not available for enrollment' });
    }

    // Check if already enrolled
    const existingEnrollment = await Enrollment.findOne({
      student: studentId,
      course: courseId
    });

    if (existingEnrollment) {
      return res.status(400).json({ message: 'Already enrolled in this course' });
    }

    // Create enrollment
    const enrollment = await Enrollment.create({
      student: studentId,
      course: courseId,
      payment: {
        amount: course.price,
        status: course.price === 0 ? 'completed' : 'pending'
      }
    });

    // Add student to course enrolled students
    await Course.findByIdAndUpdate(courseId, {
      $push: { enrolledStudents: studentId }
    });

    // Add course to user's enrolled courses
    await User.findByIdAndUpdate(studentId, {
      $push: { enrolledCourses: courseId }
    });

    res.status(201).json({
      success: true,
      message: 'Successfully enrolled in course',
      enrollment
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user's enrollments
// @route   GET /api/enrollments/my-courses
// @access  Private
exports.getMyEnrollments = async (req, res) => {
  try {
    const enrollments = await Enrollment.find({ student: req.user._id })
      .populate({
        path: 'course',
        populate: {
          path: 'instructor',
          select: 'name email avatar'
        }
      })
      .sort({ enrolledAt: -1 });

    res.status(200).json({
      success: true,
      count: enrollments.length,
      enrollments
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single enrollment
// @route   GET /api/enrollments/:id
// @access  Private
exports.getEnrollment = async (req, res) => {
  try {
    const enrollment = await Enrollment.findById(req.params.id)
      .populate({
        path: 'course',
        populate: {
          path: 'instructor',
          select: 'name email avatar'
        }
      })
      .populate('student', 'name email avatar');

    if (!enrollment) {
      return res.status(404).json({ message: 'Enrollment not found' });
    }

    // Check if user owns this enrollment or is admin
    if (enrollment.student._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    res.status(200).json({
      success: true,
      enrollment
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Mark lecture as completed
// @route   PUT /api/enrollments/:enrollmentId/complete-lecture/:lectureId
// @access  Private
exports.completeLecture = async (req, res) => {
  try {
    const { enrollmentId, lectureId } = req.params;

    const enrollment = await Enrollment.findById(enrollmentId);

    if (!enrollment) {
      return res.status(404).json({ message: 'Enrollment not found' });
    }

    // Check authorization
    if (enrollment.student.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Check if lecture already completed
    if (enrollment.progress.completedLectures.includes(lectureId)) {
      return res.status(400).json({ message: 'Lecture already marked as completed' });
    }

    // Add lecture to completed lectures
    enrollment.progress.completedLectures.push(lectureId);
    await enrollment.updateProgress();

    res.status(200).json({
      success: true,
      message: 'Lecture marked as completed',
      enrollment
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get course enrollments (for instructor)
// @route   GET /api/enrollments/course/:courseId
// @access  Private (Instructor/Admin)
exports.getCourseEnrollments = async (req, res) => {
  try {
    const { courseId } = req.params;

    // Check if course exists and user is instructor
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    if (course.instructor.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const enrollments = await Enrollment.find({ course: courseId })
      .populate('student', 'name email avatar')
      .sort({ enrolledAt: -1 });

    res.status(200).json({
      success: true,
      count: enrollments.length,
      enrollments
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Unenroll from course
// @route   DELETE /api/enrollments/:enrollmentId
// @access  Private
exports.unenrollCourse = async (req, res) => {
  try {
    const enrollment = await Enrollment.findById(req.params.enrollmentId);

    if (!enrollment) {
      return res.status(404).json({ message: 'Enrollment not found' });
    }

    // Check authorization
    if (enrollment.student.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Remove student from course
    await Course.findByIdAndUpdate(enrollment.course, {
      $pull: { enrolledStudents: enrollment.student }
    });

    // Remove course from user's enrolled courses
    await User.findByIdAndUpdate(enrollment.student, {
      $pull: { enrolledCourses: enrollment.course }
    });

    // Update enrollment status instead of deleting
    enrollment.status = 'dropped';
    await enrollment.save();

    res.status(200).json({
      success: true,
      message: 'Successfully unenrolled from course'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get enrollment stats (for admin/instructor)
// @route   GET /api/enrollments/stats
// @access  Private (Admin/Instructor)
exports.getEnrollmentStats = async (req, res) => {
  try {
    let query = {};
    
    // If instructor, only show their courses' enrollments
    if (req.user.role === 'instructor') {
      const instructorCourses = await Course.find({ instructor: req.user._id }).select('_id');
      const courseIds = instructorCourses.map(course => course._id);
      query.course = { $in: courseIds };
    }

    const totalEnrollments = await Enrollment.countDocuments(query);
    const activeEnrollments = await Enrollment.countDocuments({ ...query, status: 'active' });
    const completedEnrollments = await Enrollment.countDocuments({ ...query, status: 'completed' });

    // Get recent enrollments
    const recentEnrollments = await Enrollment.find(query)
      .populate('student', 'name email')
      .populate('course', 'title')
      .sort({ enrolledAt: -1 })
      .limit(10);

    res.status(200).json({
      success: true,
      stats: {
        total: totalEnrollments,
        active: activeEnrollments,
        completed: completedEnrollments
      },
      recentEnrollments
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
