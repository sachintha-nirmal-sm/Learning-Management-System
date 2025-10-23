import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import enrollmentService from '../services/enrollmentService';
import EnrolledCourseCard from '../components/enrollment/EnrolledCourseCard';
import '../styles/StudentDashboard.css';

const StudentDashboard = () => {
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); // all, in-progress, completed

  useEffect(() => {
    fetchEnrollments();
  }, []);

  const fetchEnrollments = async () => {
    try {
      setLoading(true);
      const data = await enrollmentService.getMyEnrollments();
      setEnrollments(data.enrollments || []);
    } catch (err) {
      setError('Failed to load enrolled courses');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredEnrollments = () => {
    if (filter === 'completed') {
      return enrollments.filter(e => e.progress === 100);
    } else if (filter === 'in-progress') {
      return enrollments.filter(e => e.progress > 0 && e.progress < 100);
    }
    return enrollments;
  };

  const filteredEnrollments = getFilteredEnrollments();

  const calculateStats = () => {
    const totalCourses = enrollments.length;
    const completedCourses = enrollments.filter(e => e.progress === 100).length;
    const inProgressCourses = enrollments.filter(e => e.progress > 0 && e.progress < 100).length;
    const averageProgress = totalCourses > 0 
      ? enrollments.reduce((sum, e) => sum + e.progress, 0) / totalCourses 
      : 0;

    return { totalCourses, completedCourses, inProgressCourses, averageProgress };
  };

  const stats = calculateStats();

  return (
    <div className="student-dashboard">
      <div className="dashboard-container">
        {/* Header */}
        <div className="dashboard-header">
          <h1>My Learning Dashboard</h1>
          <Link to="/courses" className="btn-primary">
            Browse More Courses
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">📚</div>
            <div className="stat-content">
              <h3>{stats.totalCourses}</h3>
              <p>Total Courses</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">📖</div>
            <div className="stat-content">
              <h3>{stats.inProgressCourses}</h3>
              <p>In Progress</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">✅</div>
            <div className="stat-content">
              <h3>{stats.completedCourses}</h3>
              <p>Completed</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">📊</div>
            <div className="stat-content">
              <h3>{stats.averageProgress.toFixed(0)}%</h3>
              <p>Average Progress</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="dashboard-filters">
          <button 
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All Courses ({enrollments.length})
          </button>
          <button 
            className={`filter-btn ${filter === 'in-progress' ? 'active' : ''}`}
            onClick={() => setFilter('in-progress')}
          >
            In Progress ({stats.inProgressCourses})
          </button>
          <button 
            className={`filter-btn ${filter === 'completed' ? 'active' : ''}`}
            onClick={() => setFilter('completed')}
          >
            Completed ({stats.completedCourses})
          </button>
        </div>

        {/* Enrolled Courses */}
        <div className="enrolled-courses-section">
          {loading && <div className="loading">Loading your courses...</div>}
          {error && <div className="error-message">{error}</div>}

          {!loading && filteredEnrollments.length === 0 && (
            <div className="no-enrollments">
              <div className="empty-state">
                <div className="empty-icon">📚</div>
                <h3>No courses found</h3>
                <p>
                  {filter === 'all' 
                    ? "You haven't enrolled in any courses yet." 
                    : `You don't have any ${filter.replace('-', ' ')} courses.`}
                </p>
                <Link to="/courses" className="btn-primary" style={{ width: '100%' }}>
                  Explore Courses
                </Link>
              </div>
            </div>
          )}

          {!loading && filteredEnrollments.length > 0 && (
            <div className="enrolled-courses-grid">
              {filteredEnrollments.map((enrollment) => (
                <EnrolledCourseCard 
                  key={enrollment._id} 
                  enrollment={enrollment}
                  onUpdate={fetchEnrollments}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;