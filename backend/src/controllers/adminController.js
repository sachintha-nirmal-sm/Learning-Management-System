const Course = require('../models/course');
const Enrollment = require('../models/enrollment');
const Payment = require('../models/payment');
const User = require('../models/User');

// @desc    Get aggregated platform stats for admin dashboard
// @route   GET /api/admin/overview
// @access  Private (Admin)
exports.getDashboardOverview = async (req, res) => {
  try {
    const now = new Date();
    const windowStart = new Date(now.getFullYear(), now.getMonth() - 11, 1);

    const [
      courseCounts,
      userCounts,
      enrollmentCounts,
      revenueAgg,
      pendingCourses,
      latestPayments,
      recentEnrollments,
      monthlyPaymentAgg
    ] = await Promise.all([
      Course.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]),
      User.aggregate([
        {
          $group: {
            _id: '$role',
            count: { $sum: 1 }
          }
        }
      ]),
      Enrollment.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]),
      Payment.aggregate([
        { $match: { status: 'paid' } },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$amount' },
            totalPayments: { $sum: 1 }
          }
        }
      ]),
      Course.find({ status: 'pending' })
        .populate('instructor', 'name email')
        .sort({ updatedAt: -1 })
        .limit(20),
      Payment.find({ status: 'paid' })
        .populate('student', 'name email')
        .populate('course', 'title')
        .sort({ createdAt: -1 })
        .limit(10),
      Enrollment.find()
        .populate('student', 'name email')
        .populate('course', 'title status')
        .sort({ createdAt: -1 })
        .limit(10),
      Payment.aggregate([
        {
          $match: {
            status: 'paid',
            createdAt: { $gte: windowStart }
          }
        },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' }
            },
            totalRevenue: { $sum: '$amount' },
            totalPayments: { $sum: 1 }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } }
      ])
    ]);

    const formatCounts = (entries, key) => {
      return entries.reduce((acc, curr) => {
        acc[curr._id || key] = curr.count;
        return acc;
      }, {});
    };

    const courseStats = formatCounts(courseCounts, 'total');
    const userStats = formatCounts(userCounts, 'role');
    const enrollmentStats = formatCounts(enrollmentCounts, 'status');

    const revenueStats = {
      totalRevenue: revenueAgg[0]?.totalRevenue || 0,
      totalPayments: revenueAgg[0]?.totalPayments || 0
    };

    const monthlyPaymentMap = monthlyPaymentAgg.reduce((acc, entry) => {
      const { year, month } = entry._id;
      const key = `${year}-${String(month).padStart(2, '0')}`;
      acc[key] = {
        revenue: entry.totalRevenue || 0,
        payments: entry.totalPayments || 0
      };
      return acc;
    }, {});

    const monthFormatter = new Intl.DateTimeFormat('en', { month: 'short' });
    const monthlyPaymentSeries = [];

    for (let offset = 11; offset >= 0; offset -= 1) {
      const date = new Date(now.getFullYear(), now.getMonth() - offset, 1);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const entry = monthlyPaymentMap[key] || { revenue: 0, payments: 0 };

      monthlyPaymentSeries.push({
        label: monthFormatter.format(date),
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        revenue: entry.revenue,
        payments: entry.payments
      });
    }

    res.status(200).json({
      success: true,
      stats: {
        courses: {
          total: Object.values(courseStats).reduce((sum, val) => sum + val, 0),
          draft: courseStats.draft || 0,
          pending: courseStats.pending || 0,
          published: courseStats.published || 0,
          rejected: courseStats.rejected || 0
        },
        users: {
          total: Object.values(userStats).reduce((sum, val) => sum + val, 0),
          admin: userStats.admin || 0,
          instructor: userStats.instructor || 0,
          student: userStats.student || 0
        },
        enrollments: {
          total: Object.values(enrollmentStats).reduce((sum, val) => sum + val, 0),
          active: enrollmentStats.active || 0,
          completed: enrollmentStats.completed || 0,
          dropped: enrollmentStats.dropped || 0
        },
        payments: {
          ...revenueStats,
          monthly: monthlyPaymentSeries
        }
      },
      pendingCourses,
      latestPayments,
      recentEnrollments
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get users filtered by role for admin management
// @route   GET /api/admin/users?role=student
// @access  Private (Admin)
exports.getUsers = async (req, res) => {
  try {
    const { role, status } = req.query;
    const query = {};

    if (role) {
      query.role = role;
    }

    if (status === 'active') {
      query.isActive = true;
    } else if (status === 'inactive') {
      query.isActive = false;
    }

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      users
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a user record
// @route   PUT /api/admin/users/:id
// @access  Private (Admin)
exports.updateUser = async (req, res) => {
  try {
    const updates = {};
    const allowedFields = ['name', 'email', 'role', 'isActive'];

    allowedFields.forEach((field) => {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        updates[field] = req.body[field];
      }
    });

    const user = await User.findById(req.params.id).select('+password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (updates.email && updates.email !== user.email) {
      const emailExists = await User.findOne({ email: updates.email, _id: { $ne: user._id } });
      if (emailExists) {
        return res.status(400).json({ message: 'Email is already in use' });
      }
    }

    if (updates.role && !['student', 'instructor', 'admin'].includes(updates.role)) {
      return res.status(400).json({ message: 'Invalid role provided' });
    }

    Object.assign(user, updates);
    await user.save();

    const sanitizedUser = user.toObject();
    delete sanitizedUser.password;

    res.status(200).json({
      success: true,
      user: sanitizedUser
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a user record
// @route   DELETE /api/admin/users/:id
// @access  Private (Admin)
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role === 'admin') {
      return res.status(400).json({ message: 'Cannot delete another admin via this endpoint' });
    }

    if (user.role === 'instructor') {
      await Course.updateMany({ instructor: user._id }, { $set: { instructor: null } });
    }

    await Enrollment.deleteMany({ student: user._id });
    await Course.updateMany({ enrolledStudents: user._id }, { $pull: { enrolledStudents: user._id } });

    await user.deleteOne();

    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all courses for admins (all statuses)
// @route   GET /api/admin/courses
// @access  Private (Admin)
exports.getAllCoursesAdmin = async (req, res) => {
  try {
    const courses = await Course.find()
      .populate('instructor', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      courses
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a course as admin
// @route   PUT /api/admin/courses/:id
// @access  Private (Admin)
exports.updateCourseAdmin = async (req, res) => {
  try {
    const allowedFields = ['title', 'description', 'category', 'level', 'price', 'status', 'language', 'reviewNotes'];
    const updates = {};

    allowedFields.forEach((field) => {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        updates[field] = req.body[field];
      }
    });

    if (Object.prototype.hasOwnProperty.call(updates, 'price')) {
      updates.price = Number(updates.price) || 0;
    }

    if (updates.status && updates.status !== 'draft') {
      updates.reviewedBy = req.user._id;
      updates.reviewedAt = new Date();
    }

    const course = await Course.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true
    }).populate('instructor', 'name email');

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    res.status(200).json({
      success: true,
      course
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a course as admin
// @route   DELETE /api/admin/courses/:id
// @access  Private (Admin)
exports.deleteCourseAdmin = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    await Enrollment.deleteMany({ course: course._id });

    await User.findByIdAndUpdate(course.instructor, {
      $pull: { createdCourses: course._id }
    });

    await User.updateMany({ enrolledCourses: course._id }, { $pull: { enrolledCourses: course._id } });

    await course.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Course deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
