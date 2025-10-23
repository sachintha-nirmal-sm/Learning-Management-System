const express = require('express');
const router = express.Router();
const {
  createCourse,
  getAllCourses,
  getCourseById,
  updateCourse,
  deleteCourse,
  getInstructorCourses,
  addLecture,
  updateLecture,
  deleteLecture,
  reorderLectures,
  addReview,
  publishCourse
} = require('../controllers/courseController');
const { protect, authorize } = require('../middleware/auth');

// Public routes
router.get('/', getAllCourses);
router.get('/instructor/my-courses', protect, authorize('instructor', 'admin'), getInstructorCourses);
router.get('/:id', getCourseById);

// Protected routes - Instructor/Admin only
router.post('/', protect, authorize('instructor', 'admin'), createCourse);
router.put('/:id', protect, authorize('instructor', 'admin'), updateCourse);
router.delete('/:id', protect, authorize('instructor', 'admin'), deleteCourse);
router.put('/:id/publish', protect, authorize('instructor', 'admin'), publishCourse);

// Lecture routes
router.post('/:id/lectures', protect, authorize('instructor', 'admin'), addLecture);
router.put('/:courseId/lectures/:lectureId', protect, authorize('instructor', 'admin'), updateLecture);
router.delete('/:courseId/lectures/:lectureId', protect, authorize('instructor', 'admin'), deleteLecture);
router.put('/:courseId/lectures/reorder', protect, authorize('instructor', 'admin'), reorderLectures);

// Review routes - Protected for enrolled students
router.post('/:id/reviews', protect, addReview);

module.exports = router;