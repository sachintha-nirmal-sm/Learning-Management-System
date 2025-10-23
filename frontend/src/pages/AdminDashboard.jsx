import React, { useEffect, useState } from 'react';
import adminService from '../services/adminService';
import courseService from '../services/courseService';
import '../styles/AdminDashboard.css';

const AdminDashboard = () => {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [reviewNotes, setReviewNotes] = useState({});

  useEffect(() => {
    fetchOverview();
  }, []);

  const fetchOverview = async () => {
    try {
      setLoading(true);
      const data = await adminService.getDashboardOverview();
      setOverview(data);
      setError('');
  setReviewNotes({});
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to load admin overview.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveCourse = async (courseId) => {
    try {
      setActionLoading(true);
      await courseService.approveCourse(courseId, {
        reviewNotes: reviewNotes[courseId] || ''
      });
      await fetchOverview();
    } catch (err) {
      const message = err.response?.data?.message || 'Unable to approve course.';
      alert(message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectCourse = async (courseId) => {
    try {
      const notes = reviewNotes[courseId] || prompt('Provide review feedback for the instructor:', '') || '';
      setActionLoading(true);
      await courseService.rejectCourse(courseId, {
        reviewNotes: notes
      });
      await fetchOverview();
    } catch (err) {
      const message = err.response?.data?.message || 'Unable to reject course.';
      alert(message);
    } finally {
      setActionLoading(false);
    }
  };

  const renderStats = () => {
    if (!overview?.stats) return null;
    const { courses, users, enrollments, payments } = overview.stats;

    return (
      <div className="admin-stats-grid">
        <div className="admin-stat-card primary">
          <h3>Total Revenue</h3>
          <p className="stat-value">${payments.totalRevenue.toFixed(2)}</p>
          <span className="stat-subtext">{payments.totalPayments} successful payments</span>
        </div>
        <div className="admin-stat-card">
          <h3>Total Courses</h3>
          <p className="stat-value">{courses.total}</p>
          <span className="stat-subtext">{courses.published} published • {courses.pending} pending</span>
        </div>
        <div className="admin-stat-card">
          <h3>Total Enrollments</h3>
          <p className="stat-value">{enrollments.total}</p>
          <span className="stat-subtext">{enrollments.completed} completed • {enrollments.active} active</span>
        </div>
        <div className="admin-stat-card">
          <h3>Registered Users</h3>
          <p className="stat-value">{users.total}</p>
          <span className="stat-subtext">{users.admin} admins • {users.instructor} instructors • {users.student} students</span>
        </div>
      </div>
    );
  };

  const renderPendingCourses = () => {
    if (!overview?.pendingCourses?.length) {
      return (
        <div className="empty-state">
          <div className="empty-icon">🎉</div>
          <h3>No courses awaiting review</h3>
          <p>New submissions will appear here when instructors send courses for approval.</p>
        </div>
      );
    }

    return overview.pendingCourses.map((course) => (
      <div key={course._id} className="pending-course-card">
        <div className="pending-course-header">
          <div>
            <h4>{course.title}</h4>
            <p className="pending-course-meta">
              Submitted by {course.instructor?.name} • {new Date(course.updatedAt).toLocaleString()}
            </p>
          </div>
          <span className="badge badge-pending">Pending Review</span>
        </div>

        <p className="pending-course-description">{course.description}</p>

        <div className="pending-course-actions">
          <textarea
            placeholder="Add review notes (optional)"
            value={reviewNotes[course._id] || ''}
            onChange={(event) => setReviewNotes((prev) => ({
              ...prev,
              [course._id]: event.target.value
            }))}
          />

          <div className="action-buttons">
            <button
              className="btn-secondary"
              onClick={() => handleRejectCourse(course._id)}
              disabled={actionLoading}
            >
              Reject
            </button>
            <button
              className="btn-primary"
              onClick={() => handleApproveCourse(course._id)}
              disabled={actionLoading}
            >
              Approve & Publish
            </button>
          </div>
        </div>
      </div>
    ));
  };

  const renderLatestPayments = () => {
    if (!overview?.latestPayments?.length) {
      return <p className="table-empty">No payment activity yet.</p>;
    }

    return (
      <table>
        <thead>
          <tr>
            <th>Student</th>
            <th>Course</th>
            <th>Amount</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          {overview.latestPayments.map((payment) => (
            <tr key={payment._id}>
              <td>{payment.student?.name}</td>
              <td>{payment.course?.title}</td>
              <td>${payment.amount.toFixed(2)}</td>
              <td>{new Date(payment.createdAt).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  const renderRecentEnrollments = () => {
    if (!overview?.recentEnrollments?.length) {
      return <p className="table-empty">No enrollments recorded yet.</p>;
    }

    return (
      <table>
        <thead>
          <tr>
            <th>Student</th>
            <th>Course</th>
            <th>Status</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          {overview.recentEnrollments.map((enrollment) => (
            <tr key={enrollment._id}>
              <td>{enrollment.student?.name}</td>
              <td>{enrollment.course?.title}</td>
              <td className={`status status-${enrollment.status}`}>{enrollment.status}</td>
              <td>{new Date(enrollment.createdAt).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  if (loading) {
    return (
      <div className="admin-dashboard loading-state">
        <div className="spinner" />
        <p>Loading admin dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-dashboard error-state">
        <h1>Dashboard unavailable</h1>
        <p>{error}</p>
        <button type="button" className="btn-primary" onClick={fetchOverview}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <header className="admin-header">
        <div>
          <h1>Admin Control Center</h1>
          <p className="subtitle">Monitor platform performance, review courses, and track payments</p>
        </div>
      </header>

      {renderStats()}

      <section className="dashboard-section">
        <div className="section-header">
          <h2>Pending Course Reviews</h2>
          <span className="section-count">{overview.pendingCourses?.length || 0} courses</span>
        </div>
        <div className="pending-courses-grid">
          {renderPendingCourses()}
        </div>
      </section>

      <section className="dashboard-section split">
        <div className="section-block">
          <div className="section-header">
            <h2>Latest Payments</h2>
          </div>
          {renderLatestPayments()}
        </div>
        <div className="section-block">
          <div className="section-header">
            <h2>Recent Enrollments</h2>
          </div>
          {renderRecentEnrollments()}
        </div>
      </section>
    </div>
  );
};

export default AdminDashboard;
