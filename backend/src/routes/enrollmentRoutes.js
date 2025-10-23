const express = require('express');
const router = express.Router();
const {
  enrollCourse,
  getMyEnrollments,
  getEnrollment,
  completeLecture,
  getCourseEnrollments,
  unenrollCourse,
  getEnrollmentStats
} = require('../controllers/enrollmentController');
const { protect, authorize } = require('../middleware/auth');

// Student routes
router.post('/:courseId', protect, enrollCourse);
router.get('/my-courses', protect, getMyEnrollments);
router.get('/:id', protect, getEnrollment);
router.put('/:enrollmentId/complete-lecture/:lectureId', protect, completeLecture);
router.delete('/:enrollmentId', protect, unenrollCourse);

// Instructor/Admin routes
router.get('/course/:courseId', protect, authorize('instructor', 'admin'), getCourseEnrollments);
router.get('/stats', protect, authorize('instructor', 'admin'), getEnrollmentStats);

module.exports = router;