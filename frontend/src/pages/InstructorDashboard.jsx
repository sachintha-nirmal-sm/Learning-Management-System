import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import courseService from '../services/courseService';
import InstructorCourseCard from '../components/course/InstructorCourseCard';
import '../styles/InstructorDashboard.css';

const InstructorDashboard = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); // all, published, draft

  useEffect(() => {
    fetchInstructorCourses();
  }, []);

  const fetchInstructorCourses = async () => {
    try {
      setLoading(true);
      const data = await courseService.getInstructorCourses();
      setCourses(data.courses || []);
    } catch (err) {
      setError('Failed to load courses');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCourse = async (courseId) => {
    if (window.confirm('Are you sure you want to delete this course?')) {
      try {
        await courseService.deleteCourse(courseId);
        setCourses(courses.filter(course => course._id !== courseId));
      } catch (err) {
        alert('Failed to delete course');
        console.error(err);
      }
    }
  };

  const getFilteredCourses = () => {
    if (filter === 'published') {
      return courses.filter(c => c.isPublished);
    } else if (filter === 'draft') {
      return courses.filter(c => !c.isPublished);
    }
    return courses;
  };

  const filteredCourses = getFilteredCourses();

  const calculateStats = () => {
    const totalCourses = courses.length;
    const publishedCourses = courses.filter(c => c.isPublished).length;
    const draftCourses = courses.filter(c => !c.isPublished).length;
    const totalStudents = courses.reduce((sum, c) => sum + (c.enrolledStudents?.length || 0), 0);
    const totalRevenue = courses.reduce((sum, c) => sum + (c.price * (c.enrolledStudents?.length || 0)), 0);

    return { totalCourses, publishedCourses, draftCourses, totalStudents, totalRevenue };
  };

  const stats = calculateStats();

  return (
    <div className="instructor-dashboard">
      <div className="dashboard-container">
        {/* Header */}
        <div className="dashboard-header">
          <div>
            <h1>Instructor Dashboard</h1>
            <p className="subtitle">Manage your courses and track performance</p>
          </div>
          <Link to="/instructor/create-course" className="btn-create">
            ➕ Create New Course
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card primary">
            <div className="stat-icon">📚</div>
            <div className="stat-content">
              <h3>{stats.totalCourses}</h3>
              <p>Total Courses</p>
            </div>
          </div>

          <div className="stat-card success">
            <div className="stat-icon">✅</div>
            <div className="stat-content">
              <h3>{stats.publishedCourses}</h3>
              <p>Published</p>
            </div>
          </div>

          <div className="stat-card warning">
            <div className="stat-icon">📝</div>
            <div className="stat-content">
              <h3>{stats.draftCourses}</h3>
              <p>Drafts</p>
            </div>
          </div>

          <div className="stat-card info">
            <div className="stat-icon">👥</div>
            <div className="stat-content">
              <h3>{stats.totalStudents}</h3>
              <p>Total Students</p>
            </div>
          </div>

          <div className="stat-card revenue">
            <div className="stat-icon">💰</div>
            <div className="stat-content">
              <h3>${stats.totalRevenue.toFixed(2)}</h3>
              <p>Total Revenue</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="dashboard-filters">
          <button 
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All Courses ({courses.length})
          </button>
          <button 
            className={`filter-btn ${filter === 'published' ? 'active' : ''}`}
            onClick={() => setFilter('published')}
          >
            Published ({stats.publishedCourses})
          </button>
          <button 
            className={`filter-btn ${filter === 'draft' ? 'active' : ''}`}
            onClick={() => setFilter('draft')}
          >
            Drafts ({stats.draftCourses})
          </button>
        </div>

        {/* Courses List */}
        <div className="courses-section">
          {loading && <div className="loading">Loading your courses...</div>}
          {error && <div className="error-message">{error}</div>}

          {!loading && filteredCourses.length === 0 && (
            <div className="no-courses">
              <div className="empty-state">
                <div className="empty-icon">📚</div>
                <h3>No courses found</h3>
                <p>
                  {filter === 'all' 
                    ? "You haven't created any courses yet. Start by creating your first course!" 
                    : `You don't have any ${filter} courses.`}
                </p>
                <Link to="/instructor/create-course" className="btn-create">
                  Create Your First Course
                </Link>
              </div>
            </div>
          )}

          {!loading && filteredCourses.length > 0 && (
            <div className="courses-grid">
              {filteredCourses.map((course) => (
                <InstructorCourseCard 
                  key={course._id} 
                  course={course}
                  onDelete={handleDeleteCourse}
                  onUpdate={fetchInstructorCourses}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InstructorDashboard;