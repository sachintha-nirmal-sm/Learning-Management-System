const express = require('express');
const router = express.Router();
const {
	getDashboardOverview,
	getUsers,
	updateUser,
	deleteUser,
	getAllCoursesAdmin,
	updateCourseAdmin,
	deleteCourseAdmin
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect, authorize('admin'));

router.get('/overview', getDashboardOverview);
router.get('/users', getUsers);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);
router.get('/courses', getAllCoursesAdmin);
router.put('/courses/:id', updateCourseAdmin);
router.delete('/courses/:id', deleteCourseAdmin);

module.exports = router;
