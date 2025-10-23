import React from 'react';
import { Link } from 'react-router-dom';
import '../../styles/EnrolledCourseCard.css';

const EnrolledCourseCard = ({ enrollment, onUpdate }) => {
  const { course, progress, completedLectures, enrolledAt } = enrollment;

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getProgressColor = () => {
    if (progress === 100) return '#27ae60';
    if (progress >= 50) return '#f39c12';
    return '#667eea';
  };

  return (
    <div className="enrolled-course-card">
      <div className="course-thumbnail">
        {course?.thumbnail?.url ? (
          <img src={course.thumbnail.url} alt={course.title} />
        ) : (
          <div className="course-placeholder">
            <span>📚</span>
          </div>
        )}
        <div className="progress-overlay">
          <div className="circular-progress">
            <svg width="60" height="60">
              <circle
                cx="30"
                cy="30"
                r="25"
                fill="none"
                stroke="rgba(255,255,255,0.3)"
                strokeWidth="5"
              />
              <circle
                cx="30"
                cy="30"
                r="25"
                fill="none"
                stroke={getProgressColor()}
                strokeWidth="5"
                strokeDasharray={`${2 * Math.PI * 25}`}
                strokeDashoffset={`${2 * Math.PI * 25 * (1 - progress / 100)}`}
                transform="rotate(-90 30 30)"
              />
            </svg>
            <span className="progress-text">{Math.round(progress)}%</span>
          </div>
        </div>
      </div>

      <div className="enrolled-course-content">
        <h3 className="course-title">{course?.title}</h3>
        <p className="course-instructor">By {course?.instructor?.name}</p>

        <div className="course-stats">
          <span className="stat">
            📖 {completedLectures?.length || 0} / {course?.lectures?.length || 0} lectures
          </span>
          <span className="stat">
            📅 Enrolled {formatDate(enrolledAt)}
          </span>
        </div>

        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ 
              width: `${progress}%`,
              background: getProgressColor()
            }}
          ></div>
        </div>

        <div className="card-actions">
          {progress === 100 ? (
            <>
              <Link 
                to={`/courses/${course?._id}`} 
                className="btn-secondary"
              >
                Review Course
              </Link>
              <button className="btn-certificate">
                🏆 Get Certificate
              </button>
            </>
          ) : (
            <>
              <Link 
                to={`/learn/${enrollment._id}`} 
                className="btn-primary"
              >
                {progress === 0 ? 'Start Learning' : 'Continue Learning'}
              </Link>
              <Link 
                to={`/courses/${course?._id}`} 
                className="btn-secondary"
              >
                View Details
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default EnrolledCourseCard;