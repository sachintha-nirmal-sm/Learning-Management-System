import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import courseService from '../../services/courseService';
import '../../styles/InstructorCourseCard.css';

const InstructorCourseCard = ({ course, onDelete, onUpdate }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const price = Number(course.price) || 0;

  const handlePublishToggle = async () => {
    try {
      setPublishing(true);

      if (course.status === 'published') {
        await courseService.updateCourse(course._id, { status: 'draft' });
      } else {
        await courseService.publishCourse(course._id);
      }

      setShowMenu(false);
      await onUpdate();
    } catch (err) {
      alert('Failed to update course status');
      console.error(err);
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="instructor-course-card">
      <div className="course-thumbnail">
        {course.thumbnail?.url ? (
          <img src={course.thumbnail.url} alt={course.title} />
        ) : (
          <div className="course-placeholder">
            <span>📚</span>
          </div>
        )}
        <div className="course-badge">
          {course.status === 'published' ? (
            <span className="badge-published">✓ Published</span>
          ) : (
            <span className="badge-draft">Draft</span>
          )}
        </div>
      </div>

      <div className="course-content">
        <div className="course-header">
          <h3 className="course-title">{course.title}</h3>
          <div className="course-menu">
            <button 
              className="menu-btn"
              onClick={() => setShowMenu(!showMenu)}
            >
              ⋮
            </button>
            {showMenu && (
              <div className="dropdown-menu">
                <Link
                  to={`/instructor/edit-course/${course._id}`}
                  className="menu-item"
                  onClick={() => setShowMenu(false)}
                >
                  ✏️ Edit Course
                </Link>
                <Link
                  to={`/instructor/courses/${course._id}/lectures`}
                  className="menu-item"
                  onClick={() => setShowMenu(false)}
                >
                  📖 Manage Lectures
                </Link>
                <button 
                  onClick={handlePublishToggle} 
                  className="menu-item"
                  disabled={publishing}
                >
                  {course.status === 'published' ? '📝 Unpublish' : '✅ Publish'}
                </button>
                <div className="menu-divider"></div>
                <button 
                  onClick={() => {
                    setShowMenu(false);
                    onDelete(course._id);
                  }} 
                  className="menu-item delete"
                >
                  🗑️ Delete Course
                </button>
              </div>
            )}
          </div>
        </div>

        <p className="course-category">{course.category}</p>

        <div className="course-stats">
          <div className="stat-item">
            <span className="stat-icon">👥</span>
            <span>{course.enrolledStudents?.length || 0} students</span>
          </div>
          <div className="stat-item">
            <span className="stat-icon">📖</span>
            <span>{course.lectures?.length || 0} lectures</span>
          </div>
          <div className="stat-item">
            <span className="stat-icon">⭐</span>
            <span>{course.ratings?.average?.toFixed(1) || '0.0'} ({course.ratings?.count || 0})</span>
          </div>
        </div>

        <div className="course-footer">
          <div className="course-price">
            {price === 0 ? (
              <span className="price-free">Free</span>
            ) : (
              <span className="price">${price}</span>
            )}
          </div>
          <div className="course-revenue">
            Revenue: ${(price * (course.enrolledStudents?.length || 0)).toFixed(2)}
          </div>
        </div>

        <div className="card-actions">
          <Link 
            to={`/courses/${course._id}`} 
            className="btn-view"
          >
            View Course
          </Link>
          <Link 
            to={`/instructor/course/${course._id}/analytics`} 
            className="btn-analytics"
          >
            📊 Analytics
          </Link>
        </div>
      </div>
    </div>
  );
};

export default InstructorCourseCard;