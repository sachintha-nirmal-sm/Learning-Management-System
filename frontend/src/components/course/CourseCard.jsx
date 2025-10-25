import React from 'react';
import { Link } from 'react-router-dom';
import '../../styles/CourseCard.css';

const CourseCard = ({ course }) => {
  return (
    <Link to={`/courses/${course._id}`} className="course-card">
      <div className="course-image">
        {course.thumbnail?.url ? (
          <img src={course.thumbnail.url} alt={course.title} />
        ) : (
          <div className="course-placeholder">
            <span>📚</span>
          </div>
        )}
        <span className="course-category">{course.category}</span>
      </div>
      
      <div className="course-content">
        <h3 className="course-title">{course.title}</h3>
        {course.description && (
          <p className="course-description">
            {course.description.length > 100
              ? `${course.description.substring(0, 100)}...`
              : course.description}
          </p>
        )}
        
        <div className="course-instructor">
          By {course.instructor?.name || 'Instructor'}
        </div>

        <div className="course-footer">
          <div className="course-rating">
            ⭐ {course.ratings?.average?.toFixed(1) || '0.0'} 
            <span>({course.ratings?.count || 0})</span>
          </div>
          <div className="course-price">
            {course.price === 0 ? (
              <span className="free">Free</span>
            ) : (
              <span className="price">${course.price}</span>
            )}
          </div>
        </div>

        <div className="course-meta">
          <span>📖 {course.lectures?.length || 0} lectures</span>
          <span>👥 {course.enrolledStudents?.length || 0} students</span>
        </div>
      </div>
    </Link>
  );
};

export default CourseCard;