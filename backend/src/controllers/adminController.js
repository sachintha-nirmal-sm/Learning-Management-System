const Course = require('../models/course');
const Enrollment = require('../models/enrollment');
const Payment = require('../models/payment');
const User = require('../models/User');

// @desc    Get aggregated platform stats for admin dashboard
// @route   GET /api/admin/overview
// @access  Private (Admin)
exports.getDashboardOverview = async (req, res) => {
  try {
    const [
      courseCounts,
      userCounts,
      enrollmentCounts,
      revenueAgg,
      pendingCourses,
      latestPayments,
      recentEnrollments
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
        .limit(10)
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
        payments: revenueStats
      },
      pendingCourses,
      latestPayments,
      recentEnrollments
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
