const express = require('express');
const router = express.Router();
const {
  createCourse,
  getAllCourses,
  getCourseById,
  updateCourse,
  deleteCourse,
  getInstructorCourses,
  getPendingCourses,
  addLecture,
  updateLecture,
  deleteLecture,
  reorderLectures,
  addReview,
  publishCourse,
  submitCourseForReview,
  rejectCourse
} = require('../controllers/courseController');
const { protect, authorize } = require('../middleware/auth');

// Public routes
router.get('/', getAllCourses);
router.get('/instructor/my-courses', protect, authorize('instructor', 'admin'), getInstructorCourses);
router.get('/admin/pending', protect, authorize('admin'), getPendingCourses);
router.get('/:id', getCourseById);

// Protected routes - Instructor/Admin only
router.post('/', protect, authorize('instructor', 'admin'), createCourse);
router.put('/:id', protect, authorize('instructor', 'admin'), updateCourse);
router.delete('/:id', protect, authorize('instructor', 'admin'), deleteCourse);
router.put('/:id/submit', protect, authorize('instructor', 'admin'), submitCourseForReview);
router.put('/:id/approve', protect, authorize('admin'), publishCourse);
router.put('/:id/reject', protect, authorize('admin'), rejectCourse);

// Lecture routes
router.post('/:id/lectures', protect, authorize('instructor', 'admin'), addLecture);
router.put('/:courseId/lectures/:lectureId', protect, authorize('instructor', 'admin'), updateLecture);
router.delete('/:courseId/lectures/:lectureId', protect, authorize('instructor', 'admin'), deleteLecture);
router.put('/:courseId/lectures/reorder', protect, authorize('instructor', 'admin'), reorderLectures);

// Review routes - Protected for enrolled students
router.post('/:id/reviews', protect, addReview);

module.exports = router;