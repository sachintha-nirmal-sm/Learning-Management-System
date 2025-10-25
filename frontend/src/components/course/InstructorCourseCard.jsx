import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import courseService from '../../services/courseService';
import '../../styles/InstructorCourseCard.css';

const InstructorCourseCard = ({ course, onDelete, onUpdate }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const price = Number(course.price) || 0;
  const isPublished = course.status === 'published';

  const statusBadge = () => {
    switch (course.status) {
      case 'published':
        return <span className="badge-published">✓ Published</span>;
      case 'pending':
        return <span className="badge-pending">🔍 In Review</span>;
      case 'rejected':
        return <span className="badge-rejected">⚠ Needs Updates</span>;
      default:
        return <span className="badge-draft">Draft</span>;
    }
  };

  const handleSubmitForReview = async () => {
    try {
      setActionLoading(true);
      await courseService.submitForReview(course._id);
      setShowMenu(false);
      await onUpdate();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit course for review');
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleMoveToDraft = async () => {
    try {
      setActionLoading(true);
      await courseService.updateCourse(course._id, { status: 'draft' });
      setShowMenu(false);
      await onUpdate();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update course status');
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const canSubmitForReview = ['draft', 'rejected'].includes(course.status);

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
        <div className="course-badge">{statusBadge()}</div>
      </div>

      <div className="course-content">
        <div className="course-header">
          <h3 className="course-title">{course.title}</h3>
          <div className="course-menu">
            <button
              className="menu-btn"
              onClick={() => setShowMenu((prev) => !prev)}
            >
              ⋮
            </button>
            {showMenu && (
              <div className="dropdown-menu">
                {isPublished ? (
                  <Link
                    to={`/instructor/courses/${course._id}/lectures`}
                    className="menu-item"
                    onClick={() => setShowMenu(false)}
                  >
                    📖 Manage Lectures
                  </Link>
                ) : (
                  <button className="menu-item" disabled title="Available after admin publishes this course">
                    📖 Manage Lectures
                  </button>
                )}
                {course.status === 'published' && (
                  <button
                    onClick={handleMoveToDraft}
                    className="menu-item"
                    disabled={actionLoading}
                  >
                    📝 Unpublish
                  </button>
                )}
                {course.status === 'pending' ? (
                  <button
                    onClick={handleMoveToDraft}
                    className="menu-item"
                    disabled={actionLoading}
                  >
                    ↩ Move back to draft
                  </button>
                ) : canSubmitForReview ? (
                  <button
                    onClick={handleSubmitForReview}
                    className="menu-item"
                    disabled={actionLoading}
                  >
                    ✅ Submit for review
                  </button>
                ) : null}
                <div className="menu-divider" />
                <button
                  onClick={() => {
                    setShowMenu(false);
                    onDelete(course._id);
                  }}
                  className="menu-item delete"
                  disabled={actionLoading}
                >
                  🗑 Delete Course
                </button>
              </div>
            )}
          </div>
        </div>

        <p className="course-description">{course.description}</p>

        <div className="course-stats">
          <div className="stat-item">
            <span className="stat-icon">📖</span>
            <span>{course.lectures?.length || 0} lectures</span>
          </div>
          <div className="stat-item">
            <span className="stat-icon">⭐</span>
            <span>
              {course.ratings?.average?.toFixed(1) || '0.0'} ({course.ratings?.count || 0})
            </span>
          </div>
          <div className="stat-item">
            <span className="stat-icon">👥</span>
            <span>{course.enrolledStudents?.length || 0} students</span>
          </div>
        </div>

        {course.status === 'rejected' && course.reviewNotes && (
          <div className="course-alert">
            <strong>Reviewer feedback:</strong>
            <p>{course.reviewNotes}</p>
          </div>
        )}

        {course.status === 'pending' && (
          <div className="course-alert info">
            <p>Your course is currently under review.</p>
          </div>
        )}

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
          <Link to={`/courses/${course._id}`} className="btn-view">
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