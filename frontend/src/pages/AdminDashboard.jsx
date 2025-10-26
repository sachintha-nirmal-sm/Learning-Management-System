import React, { useEffect, useRef, useState } from 'react';
import adminService from '../services/adminService';
import courseService from '../services/courseService';
import '../styles/AdminDashboard.css';

const palette = ['#667eea', '#764ba2', '#43cea2', '#f39c12', '#e94e77'];
const courseCategories = ['Programming', 'Design', 'Business', 'Marketing', 'Photography', 'Music', 'Other'];
const courseLevels = ['Beginner', 'Intermediate', 'Advanced', 'All Levels'];
const courseStatuses = ['draft', 'pending', 'published', 'rejected'];
const courseLanguages = ['English', 'Spanish', 'French', 'German', 'Hindi', 'Chinese', 'Other'];

const SIDEBAR_SECTIONS = [
  { id: 'courses-section', label: 'Courses' },
  { id: 'students-section', label: 'Students' },
  { id: 'instructors-section', label: 'Instructors' },
  { id: 'payments-section', label: 'Payments' }
];

const StatCard = ({ title, value, subtext, variant }) => (
  <div className={`admin-stat-card${variant ? ` ${variant}` : ''}`}>
    <h3>{title}</h3>
    <p className="stat-value">{value}</p>
    {subtext && <span className="stat-subtext">{subtext}</span>}
  </div>
);

const ChartCard = ({ title, subtitle, dataset }) => {
  const total = dataset.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="chart-card">
      <div className="chart-card-header">
        <div>
          <h3>{title}</h3>
          {subtitle && <p>{subtitle}</p>}
        </div>
        <span className="chart-total">{total} total</span>
      </div>

      {total === 0 ? (
        <div className="chart-empty">No data yet</div>
      ) : (
        <div className="chart-bars">
          {dataset.map((item, index) => {
            const percentage = total > 0 ? Math.round((item.value / total) * 100) : 0;
            const color = item.color || palette[index % palette.length];
            return (
              <div key={item.label} className="chart-bar-row">
                <div className="chart-bar-label">
                  <span>{item.label}</span>
                  <span className="chart-bar-value">
                    {item.value}
                    <span className="chart-bar-percent">{percentage}%</span>
                  </span>
                </div>
                <div className="chart-bar-track">
                  <div className="chart-bar-fill" style={{ width: `${percentage}%`, background: color }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const formatNumber = (value) => Number(value || 0).toLocaleString();
const formatCurrency = (value) => Number(value || 0).toLocaleString(undefined, {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});
const formatDate = (value) => (value ? new Date(value).toLocaleDateString() : '—');
const capitalize = (value) => (value ? value.charAt(0).toUpperCase() + value.slice(1) : '');

const LineChartCard = ({ title, subtitle, dataset }) => {
  const data = Array.isArray(dataset) ? dataset : [];
  const latest = data[data.length - 1] || { revenue: 0 };
  const previous = data[data.length - 2] || { revenue: 0 };
  const latestRevenue = latest.revenue || 0;
  const previousRevenue = previous.revenue || 0;
  const revenueDelta = latestRevenue - previousRevenue;
  const deltaPercentValue = previousRevenue
    ? (revenueDelta / previousRevenue) * 100
    : latestRevenue
    ? 100
    : 0;
  const deltaPercentage = Math.abs(deltaPercentValue) < 0.05 ? '0.0' : deltaPercentValue.toFixed(1);

  if (!data.length) {
    return (
      <div className="line-chart-card section-block">
        <div className="chart-card-header">
          <div>
            <h3>{title}</h3>
            {subtitle && <p>{subtitle}</p>}
          </div>
        </div>
        <div className="chart-empty">No payment history for this period.</div>
      </div>
    );
  }

  const maxRevenue = Math.max(...data.map((item) => item.revenue || 0), latestRevenue || 0, 0);
  const top = 12;
  const bottom = 88;
  const chartHeight = bottom - top;

  const getX = (index) => {
    if (data.length === 1) {
      return 50;
    }
    return (index / (data.length - 1)) * 100;
  };

  const getY = (value) => {
    if (!maxRevenue) {
      return bottom;
    }
    return bottom - (value / maxRevenue) * chartHeight;
  };

  const linePoints = data.map((item, index) => `${getX(index)},${getY(item.revenue || 0)}`).join(' ');

  const areaPoints = [
    `${getX(0)},${bottom}`,
    ...data.map((item, index) => `${getX(index)},${getY(item.revenue || 0)}`),
    `${getX(data.length - 1)},${bottom}`
  ].join(' ');

  const deltaClass = revenueDelta > 0 ? 'up' : revenueDelta < 0 ? 'down' : 'neutral';

  return (
    <div className="line-chart-card section-block">
      <div className="chart-card-header">
        <div>
          <h3>{title}</h3>
          {subtitle && <p>{subtitle}</p>}
        </div>
        <div className="line-chart-meta">
          <span className="line-chart-value">${formatCurrency(latestRevenue)}</span>
          <span className={`line-chart-delta ${deltaClass}`}>
            {revenueDelta > 0 ? '+' : revenueDelta < 0 ? '-' : ''}${formatCurrency(Math.abs(revenueDelta))} vs prev month
            <span className="line-chart-delta-percent">({deltaPercentage}%)</span>
          </span>
        </div>
      </div>

      <div className="line-chart-wrapper">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none">
          <defs>
            <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(102, 126, 234, 0.35)" />
              <stop offset="100%" stopColor="rgba(118, 75, 162, 0)" />
            </linearGradient>
          </defs>

          {[0, 1, 2, 3].map((index) => {
            const ratio = index / 3;
            const y = bottom - ratio * chartHeight;
            const valueLabel = maxRevenue * ratio;
            return (
              <g key={index}>
                <line x1="0" y1={y} x2="100" y2={y} stroke="rgba(99, 102, 241, 0.1)" strokeWidth="0.5" />
                <text x="0" y={y - 1.5} className="line-chart-grid-label">
                  ${formatCurrency(valueLabel)}
                </text>
              </g>
            );
          })}

          <polygon points={areaPoints} fill="url(#lineGradient)" stroke="none" />
          <polyline points={linePoints} fill="none" stroke="url(#lineGradient)" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />

          {data.map((item, index) => (
            <circle
              key={item.label + index}
              cx={getX(index)}
              cy={getY(item.revenue || 0)}
              r={1.2}
              className="line-chart-marker"
            />
          ))}
        </svg>
      </div>

      <div className="line-chart-axis">
        {data.map((item) => (
          <span key={`${item.year}-${item.month}`} className="line-chart-axis-label">
            {item.label}
          </span>
        ))}
      </div>
    </div>
  );
};

const AdminDashboard = () => {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [reviewNotes, setReviewNotes] = useState({});
  const [activeSection, setActiveSection] = useState(SIDEBAR_SECTIONS[0].id);
  const sectionRefs = useRef({});

  const [students, setStudents] = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(true);
  const [studentsError, setStudentsError] = useState('');

  const [instructors, setInstructors] = useState([]);
  const [instructorsLoading, setInstructorsLoading] = useState(true);
  const [instructorsError, setInstructorsError] = useState('');

  const [courses, setCourses] = useState([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [coursesError, setCoursesError] = useState('');

  const [actionInFlight, setActionInFlight] = useState(null);

  const [modalState, setModalState] = useState(null);
  const [modalForm, setModalForm] = useState({});
  const [modalError, setModalError] = useState('');
  const [modalSaving, setModalSaving] = useState(false);

  const courseStats = overview?.stats?.courses || {};
  const userStats = overview?.stats?.users || {};
  const enrollmentStats = overview?.stats?.enrollments || {};
  const paymentStats = overview?.stats?.payments || {};

  const enrollmentData = [
    { label: 'Active', value: enrollmentStats.active || 0, color: palette[0] },
    { label: 'Completed', value: enrollmentStats.completed || 0, color: '#2ecc71' },
    { label: 'Dropped', value: enrollmentStats.dropped || 0, color: '#e74c3c' }
  ];

  const userData = [
    { label: 'Students', value: userStats.student || 0, color: palette[0] },
    { label: 'Instructors', value: userStats.instructor || 0, color: palette[1] },
    { label: 'Admins', value: userStats.admin || 0, color: palette[3] }
  ];

  const courseData = [
    { label: 'Published', value: courseStats.published || 0, color: palette[0] },
    { label: 'Pending', value: courseStats.pending || 0, color: '#f39c12' },
    { label: 'Draft', value: courseStats.draft || 0, color: '#95a5a6' },
    { label: 'Rejected', value: courseStats.rejected || 0, color: '#e94e77' }
  ];

  const pendingCourseCount = overview?.pendingCourses?.length || 0;
  const averagePayment = paymentStats.totalPayments
    ? paymentStats.totalRevenue / paymentStats.totalPayments
    : 0;
  const paymentTrend = Array.isArray(paymentStats.monthly) ? paymentStats.monthly : [];

  const registerSectionRef = (id) => (element) => {
    if (element) {
      sectionRefs.current[id] = element;
    } else {
      delete sectionRefs.current[id];
    }
  };

  useEffect(() => {
    fetchOverview();
    fetchStudents();
    fetchInstructors();
    fetchAdminCourses();
  }, []);

  const fetchOverview = async ({ showLoader = true } = {}) => {
    try {
      if (showLoader) {
        setLoading(true);
        setError('');
      }

      const data = await adminService.getDashboardOverview();
      setOverview(data);
      setReviewNotes({});

      if (showLoader) {
        setError('');
      }
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to load admin overview.';
      if (showLoader) {
        setError(message);
      } else {
        console.error(message);
      }
    } finally {
      if (showLoader) {
        setLoading(false);
      }
    }
  };

  const fetchStudents = async () => {
    try {
      setStudentsLoading(true);
      const data = await adminService.getUsers({ role: 'student' });
      setStudents(data.users || []);
      setStudentsError('');
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to load students.';
      setStudentsError(message);
    } finally {
      setStudentsLoading(false);
    }
  };

  const fetchInstructors = async () => {
    try {
      setInstructorsLoading(true);
      const data = await adminService.getUsers({ role: 'instructor' });
      setInstructors(data.users || []);
      setInstructorsError('');
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to load instructors.';
      setInstructorsError(message);
    } finally {
      setInstructorsLoading(false);
    }
  };

  const fetchAdminCourses = async () => {
    try {
      setCoursesLoading(true);
      const data = await adminService.getAdminCourses();
      setCourses(data.courses || []);
      setCoursesError('');
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to load courses.';
      setCoursesError(message);
    } finally {
      setCoursesLoading(false);
    }
  };

  const handleApproveCourse = async (courseId) => {
    try {
      setActionLoading(true);
      await courseService.approveCourse(courseId, {
        reviewNotes: reviewNotes[courseId] || ''
      });
      await fetchOverview({ showLoader: false });
      await fetchAdminCourses();
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
      await fetchOverview({ showLoader: false });
      await fetchAdminCourses();
    } catch (err) {
      const message = err.response?.data?.message || 'Unable to reject course.';
      alert(message);
    } finally {
      setActionLoading(false);
    }
  };

  useEffect(() => {
    if (loading) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible && visible.target.id !== activeSection) {
          setActiveSection(visible.target.id);
        }
      },
      {
        rootMargin: '-45% 0px -45% 0px',
        threshold: [0.25, 0.5, 0.75]
      }
    );

    SIDEBAR_SECTIONS.forEach(({ id }) => {
      const element = sectionRefs.current[id];
      if (element) {
        observer.observe(element);
      }
    });

    return () => observer.disconnect();
  }, [activeSection, loading]);

  useEffect(() => {
    if (!modalState) {
      setModalForm({});
      setModalError('');
      return;
    }

    if (modalState.type === 'user') {
      setModalForm({
        name: modalState.data.name || '',
        email: modalState.data.email || '',
        role: modalState.data.role || 'student',
        isActive: modalState.data.isActive !== false
      });
    } else if (modalState.type === 'course') {
      setModalForm({
        title: modalState.data.title || '',
        status: modalState.data.status || 'draft',
        price: modalState.data.price ?? 0,
        category: modalState.data.category || courseCategories[0],
        level: modalState.data.level || courseLevels[0],
        language: modalState.data.language || courseLanguages[0]
      });
    }
    setModalError('');
  }, [modalState]);

  const handleNavClick = (event, id) => {
    event.preventDefault();
    const element = sectionRefs.current[id];
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleUserDelete = async (user) => {
    if (!window.confirm(`Delete ${user.name || 'this user'}? This action cannot be undone.`)) {
      return;
    }

    setActionInFlight(`user-${user._id}`);
    try {
      await adminService.deleteUser(user._id);
      await Promise.all([
        fetchStudents(),
        fetchInstructors(),
        fetchOverview({ showLoader: false })
      ]);
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to delete user.';
      alert(message);
    } finally {
      setActionInFlight(null);
    }
  };

  const handleCourseDelete = async (course) => {
    if (!window.confirm(`Delete course "${course.title}"? This action cannot be undone.`)) {
      return;
    }

    setActionInFlight(`course-${course._id}`);
    try {
      await adminService.deleteAdminCourse(course._id);
      await Promise.all([
        fetchAdminCourses(),
        fetchOverview({ showLoader: false })
      ]);
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to delete course.';
      alert(message);
    } finally {
      setActionInFlight(null);
    }
  };

  const handleModalChange = (field, value) => {
    setModalForm((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleModalSubmit = async (event) => {
    event.preventDefault();
    if (!modalState) {
      return;
    }

    if (modalState.type === 'user') {
      if (!modalForm.name.trim() || !modalForm.email.trim()) {
        setModalError('Name and email are required.');
        return;
      }
    } else if (modalState.type === 'course') {
      if (!modalForm.title.trim()) {
        setModalError('Course title is required.');
        return;
      }
    }

    setModalSaving(true);
    setModalError('');

    try {
      if (modalState.type === 'user') {
        const payload = {
          name: modalForm.name.trim(),
          email: modalForm.email.trim(),
          role: modalForm.role,
          isActive: Boolean(modalForm.isActive)
        };
        await adminService.updateUser(modalState.data._id, payload);
        await Promise.all([
          fetchStudents(),
          fetchInstructors(),
          fetchOverview({ showLoader: false })
        ]);
      } else if (modalState.type === 'course') {
        const payload = {
          title: modalForm.title.trim(),
          status: modalForm.status,
          price: Number(modalForm.price) || 0,
          category: modalForm.category,
          level: modalForm.level,
          language: modalForm.language
        };
        await adminService.updateAdminCourse(modalState.data._id, payload);
        await Promise.all([
          fetchAdminCourses(),
          fetchOverview({ showLoader: false })
        ]);
      }
      setModalState(null);
    } catch (err) {
      const message = err.response?.data?.message || 'Update failed.';
      setModalError(message);
    } finally {
      setModalSaving(false);
    }
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
              Submitted by {course.instructor?.name || 'Unknown'} • {new Date(course.updatedAt).toLocaleString()}
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

  const renderUserManagementTable = (role) => {
    const isStudent = role === 'student';
    const data = isStudent ? students : instructors;
    const loadingState = isStudent ? studentsLoading : instructorsLoading;
    const errorState = isStudent ? studentsError : instructorsError;
    const courseLabel = isStudent ? 'Enrolled' : 'Created';

    if (loadingState) {
      return <p className="table-feedback">Loading...</p>;
    }

    if (errorState) {
      return <p className="table-feedback error">{errorState}</p>;
    }

    if (!data.length) {
      return <p className="table-feedback empty">No {role}s available.</p>;
    }

    return (
      <table className="management-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Status</th>
            <th>{courseLabel}</th>
            <th>Joined</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {data.map((user) => {
            const courseCount = isStudent
              ? (user.enrolledCourses?.length || 0)
              : (user.createdCourses?.length || 0);

            return (
              <tr key={user._id}>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>{capitalize(user.role)}</td>
                <td>
                  <span className={`status-chip ${user.isActive !== false ? 'status-active' : 'status-inactive'}`}>
                    {user.isActive !== false ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td>{formatNumber(courseCount)}</td>
                <td>{formatDate(user.createdAt)}</td>
                <td className="table-actions">
                  <button
                    type="button"
                    className="table-action-button"
                    onClick={() => setModalState({ type: 'user', data: user })}
                    disabled={actionInFlight === `user-${user._id}`}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="table-action-button danger"
                    onClick={() => handleUserDelete(user)}
                    disabled={actionInFlight === `user-${user._id}`}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    );
  };

  const renderCourseManagementTable = () => {
    if (coursesLoading) {
      return <p className="table-feedback">Loading...</p>;
    }

    if (coursesError) {
      return <p className="table-feedback error">{coursesError}</p>;
    }

    if (!courses.length) {
      return <p className="table-feedback empty">No courses available.</p>;
    }

    return (
      <table className="management-table">
        <thead>
          <tr>
            <th>Title</th>
            <th>Instructor</th>
            <th>Status</th>
            <th>Price</th>
            <th>Updated</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {courses.map((course) => (
            <tr key={course._id}>
              <td>{course.title}</td>
              <td>{course.instructor?.name || 'Unassigned'}</td>
              <td>
                <span className={`status-chip status-${course.status}`}>
                  {capitalize(course.status)}
                </span>
              </td>
              <td>${formatCurrency(course.price)}</td>
              <td>{formatDate(course.updatedAt)}</td>
              <td className="table-actions">
                <button
                  type="button"
                  className="table-action-button"
                  onClick={() => setModalState({ type: 'course', data: course })}
                  disabled={actionInFlight === `course-${course._id}`}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className="table-action-button danger"
                  onClick={() => handleCourseDelete(course)}
                  disabled={actionInFlight === `course-${course._id}`}
                >
                  Delete
                </button>
              </td>
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
        <button type="button" className="btn-primary" onClick={() => fetchOverview()}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="admin-dashboard-layout">
        <aside className="admin-sidebar">
          <div className="sidebar-header">
            <h2>Dashboard</h2>
          </div>
          <nav className="sidebar-nav" aria-label="Admin navigation">
            {SIDEBAR_SECTIONS.map(({ id, label }) => (
              <a
                key={id}
                href={`#${id}`}
                className={`sidebar-link${activeSection === id ? ' active' : ''}`}
                onClick={(event) => handleNavClick(event, id)}
                aria-current={activeSection === id ? 'true' : undefined}
              >
                {label}
              </a>
            ))}
          </nav>
        </aside>

        <div className="admin-dashboard">
          <header className="admin-header">
            <div>
              <h1>Admin Control Center</h1>
              <p className="subtitle">Monitor platform performance, review courses, and manage the community</p>
            </div>
          </header>

        <section
          id="courses-section"
          ref={registerSectionRef('courses-section')}
          className="dashboard-section admin-section"
        >
          <div className="section-header">
            <h2>Course Overview</h2>
            <span className="section-count">{formatNumber(courseStats.total)} courses</span>
          </div>
          <div className="admin-stats-grid">
            <StatCard
              title="Total Courses"
              value={formatNumber(courseStats.total)}
              subtext={`${formatNumber(courseStats.published)} published • ${formatNumber(courseStats.pending)} pending`}
            />
            <StatCard
              title="Draft & Rejected"
              value={formatNumber((courseStats.draft || 0) + (courseStats.rejected || 0))}
              subtext={`${formatNumber(courseStats.draft)} draft • ${formatNumber(courseStats.rejected)} rejected`}
            />
          </div>
          <div className="analytics-grid">
            <ChartCard
              title="Course Population"
              subtitle="Status of courses in the system"
              dataset={courseData}
            />
          </div>
          <div className="section-block table-block management-block">
            <div className="section-header">
              <h2>Manage Courses</h2>
              <span className="section-count">{formatNumber(courses.length)} records</span>
            </div>
            {renderCourseManagementTable()}
          </div>
        </section>

        <section
          id="students-section"
          ref={registerSectionRef('students-section')}
          className="dashboard-section admin-section"
        >
          <div className="section-header">
            <h2>Student Insights</h2>
            <span className="section-count">{formatNumber(userStats.student)} learners</span>
          </div>
          <div className="admin-stats-grid">
            <StatCard
              title="Registered Learners"
              value={formatNumber(userStats.student)}
              subtext={`${formatNumber(userStats.instructor)} instructors • ${formatNumber(userStats.admin)} admins`}
            />
            <StatCard
              title="Course Enrollments"
              value={formatNumber(enrollmentStats.total)}
              subtext={`${formatNumber(enrollmentStats.active)} active • ${formatNumber(enrollmentStats.completed)} completed`}
            />
          </div>
          <div className="analytics-grid">
            <ChartCard
              title="Enrollment Progress"
              subtitle="Track learning journeys across the platform"
              dataset={enrollmentData}
            />
            <ChartCard
              title="User Distribution"
              subtitle="Breakdown across roles"
              dataset={userData}
            />
          </div>
          <div className="section-block table-block management-block">
            <div className="section-header">
              <h2>Manage Students</h2>
              <span className="section-count">{formatNumber(students.length)} records</span>
            </div>
            {renderUserManagementTable('student')}
          </div>
          <div className="section-block table-block">
            <div className="section-header">
              <h2>Recent Enrollments</h2>
            </div>
            {renderRecentEnrollments()}
          </div>
        </section>

        <section
          id="instructors-section"
          ref={registerSectionRef('instructors-section')}
          className="dashboard-section admin-section"
        >
          <div className="section-header">
            <h2>Instructor Activity</h2>
            <span className="section-count">{formatNumber(userStats.instructor)} instructors</span>
          </div>
          <div className="admin-stats-grid">
            <StatCard
              title="Active Instructors"
              value={formatNumber(userStats.instructor)}
              subtext={`${formatNumber(courseStats.published)} published courses`}
            />
            <StatCard
              title="Pending Reviews"
              value={formatNumber(pendingCourseCount)}
              subtext={`${formatNumber(courseStats.pending)} awaiting approval`}
            />
          </div>
          <div className="section-block table-block management-block">
            <div className="section-header">
              <h2>Manage Instructors</h2>
              <span className="section-count">{formatNumber(instructors.length)} records</span>
            </div>
            {renderUserManagementTable('instructor')}
          </div>
          <div className="pending-courses-grid">
            {renderPendingCourses()}
          </div>
        </section>

          <section
            id="payments-section"
            ref={registerSectionRef('payments-section')}
            className="dashboard-section admin-section"
          >
            <div className="section-header">
              <h2>Payment Progress</h2>
              <span className="section-count">{formatNumber(paymentStats.totalPayments)} payments</span>
            </div>
            <div className="admin-stats-grid">
              <StatCard
                title="Total Revenue"
                value={`$${formatCurrency(paymentStats.totalRevenue)}`}
                subtext={`${formatNumber(paymentStats.totalPayments)} successful payments`}
                variant="primary"
              />
              <StatCard
                title="Average Payment"
                value={`$${formatCurrency(averagePayment)}`}
                subtext="Per completed checkout"
              />
            </div>
            <LineChartCard
              title="Monthly Revenue"
              subtitle="Last 12 months of completed payments"
              dataset={paymentTrend}
            />
            <div className="section-block table-block">
              <div className="section-header">
                <h2>Latest Payments</h2>
              </div>
              {renderLatestPayments()}
            </div>
          </section>
        </div>
      </div>

      {modalState && (
        <div className="modal-backdrop" role="presentation">
          <div className="modal" role="dialog" aria-modal="true">
            <div className="modal-header">
              <h3>{modalState.type === 'course' ? 'Edit Course' : 'Edit User'}</h3>
              <button
                type="button"
                className="modal-close"
                onClick={() => setModalState(null)}
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <form className="modal-body" onSubmit={handleModalSubmit}>
              {modalState.type === 'user' && (
                <>
                  <label className="modal-field">
                    <span>Name</span>
                    <input
                      type="text"
                      value={modalForm.name || ''}
                      onChange={(event) => handleModalChange('name', event.target.value)}
                      required
                    />
                  </label>
                  <label className="modal-field">
                    <span>Email</span>
                    <input
                      type="email"
                      value={modalForm.email || ''}
                      onChange={(event) => handleModalChange('email', event.target.value)}
                      required
                    />
                  </label>
                  <label className="modal-field">
                    <span>Role</span>
                    <select
                      value={modalForm.role || 'student'}
                      onChange={(event) => handleModalChange('role', event.target.value)}
                    >
                      <option value="student">Student</option>
                      <option value="instructor">Instructor</option>
                      <option value="admin">Admin</option>
                    </select>
                  </label>
                  <label className="modal-field">
                    <span>Status</span>
                    <select
                      value={modalForm.isActive ? 'true' : 'false'}
                      onChange={(event) => handleModalChange('isActive', event.target.value === 'true')}
                    >
                      <option value="true">Active</option>
                      <option value="false">Inactive</option>
                    </select>
                  </label>
                </>
              )}

              {modalState.type === 'course' && (
                <>
                  <label className="modal-field">
                    <span>Title</span>
                    <input
                      type="text"
                      value={modalForm.title || ''}
                      onChange={(event) => handleModalChange('title', event.target.value)}
                      required
                    />
                  </label>
                  <label className="modal-field">
                    <span>Status</span>
                    <select
                      value={modalForm.status || 'draft'}
                      onChange={(event) => handleModalChange('status', event.target.value)}
                    >
                      {courseStatuses.map((status) => (
                        <option key={status} value={status}>
                          {capitalize(status)}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="modal-field">
                    <span>Price (USD)</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={modalForm.price ?? 0}
                      onChange={(event) => handleModalChange('price', event.target.value)}
                    />
                  </label>
                  <label className="modal-field">
                    <span>Category</span>
                    <select
                      value={modalForm.category || courseCategories[0]}
                      onChange={(event) => handleModalChange('category', event.target.value)}
                    >
                      {courseCategories.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="modal-field">
                    <span>Level</span>
                    <select
                      value={modalForm.level || courseLevels[0]}
                      onChange={(event) => handleModalChange('level', event.target.value)}
                    >
                      {courseLevels.map((level) => (
                        <option key={level} value={level}>
                          {level}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="modal-field">
                    <span>Language</span>
                    <select
                      value={modalForm.language || courseLanguages[0]}
                      onChange={(event) => handleModalChange('language', event.target.value)}
                    >
                      {courseLanguages.map((language) => (
                        <option key={language} value={language}>
                          {language}
                        </option>
                      ))}
                    </select>
                  </label>
                </>
              )}

              {modalError && <p className="modal-error">{modalError}</p>}

              <div className="modal-actions">
                <button type="button" className="table-action-button" onClick={() => setModalState(null)}>
                  Cancel
                </button>
                <button type="submit" className="table-action-button primary" disabled={modalSaving}>
                  {modalSaving ? 'Saving...' : 'Save changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminDashboard;
