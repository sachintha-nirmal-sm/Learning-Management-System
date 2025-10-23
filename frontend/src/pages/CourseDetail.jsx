import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import courseService from '../services/courseService';
import enrollmentService from '../services/enrollmentService';
import '../styles/CourseDetail.css';

const CourseDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [enrolling, setEnrolling] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [activeTab, setActiveTab] = useState('overview'); // overview, curriculum, instructor, reviews

  useEffect(() => {
    fetchCourseDetails();
  }, [id]);

  const fetchCourseDetails = async () => {
    try {
      setLoading(true);
      const data = await courseService.getCourse(id);
      setCourse(data.course);
      
      // Check if user is already enrolled
      if (isAuthenticated && user) {
        const enrolled = data.course.enrolledStudents?.some(
          studentId => studentId === user._id
        );
        setIsEnrolled(enrolled);
      }
    } catch (err) {
      setError('Failed to load course details');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    try {
      setEnrolling(true);
      await enrollmentService.enrollCourse(id);
      setIsEnrolled(true);
      alert('Successfully enrolled in the course!');
      navigate('/my-courses');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to enroll in course');
    } finally {
      setEnrolling(false);
    }
  };

  if (loading) {
    return (
      <div className="course-detail-loading">
        <div className="spinner"></div>
        <p>Loading course details...</p>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="course-detail-error">
        <h2>Course Not Found</h2>
        <p>{error || 'The course you are looking for does not exist.'}</p>
        <Link to="/" className="btn-primary">Back to Home</Link>
      </div>
    );
  }

  const isOwner = user?._id === course.instructor?._id;

  return (
    <div className="course-detail">
      {/* Hero Section */}
      <div className="course-hero">
        <div className="hero-content">
          <div className="breadcrumb">
            <Link to="/">Home</Link> / <Link to="/courses">Courses</Link> / {course.title}
          </div>
          
          <h1 className="course-title">{course.title}</h1>
          <p className="course-description">{course.description}</p>
          
          <div className="course-meta">
            <div className="meta-item">
              <span className="rating">⭐ {course.ratings?.average?.toFixed(1) || '0.0'}</span>
              <span className="rating-count">({course.ratings?.count || 0} ratings)</span>
            </div>
            <div className="meta-item">
              👥 {course.enrolledStudents?.length || 0} students enrolled
            </div>
            <div className="meta-item">
              📅 Last updated: {new Date(course.updatedAt).toLocaleDateString()}
            </div>
          </div>

          <div className="instructor-info">
            <div className="instructor-avatar">
              {course.instructor?.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="instructor-label">Instructor</p>
              <p className="instructor-name">{course.instructor?.name}</p>
            </div>
          </div>
        </div>

        <div className="course-card-sticky">
          <div className="course-preview">
            {course.thumbnail?.url ? (
              <img src={course.thumbnail.url} alt={course.title} />
            ) : (
              <div className="preview-placeholder">
                <span>📚</span>
              </div>
            )}
          </div>

          <div className="course-price-section">
            {course.price === 0 ? (
              <h2 className="price free">Free</h2>
            ) : (
              <h2 className="price">${course.price}</h2>
            )}

            {isOwner ? (
              <div className="owner-actions">
                <Link to={`/instructor/edit-course/${course._id}`} className="btn-enroll">
                  Edit Course
                </Link>
                <Link to={`/instructor/courses/${course._id}/lectures`} className="btn-secondary">
                  Manage Lectures
                </Link>
              </div>
            ) : isEnrolled ? (
              <Link to="/my-courses" className="btn-enrolled">
                ✓ Enrolled - Go to My Learning
              </Link>
            ) : (
              <button 
                className="btn-enroll" 
                onClick={handleEnroll}
                disabled={enrolling}
              >
                {enrolling ? 'Enrolling...' : 'Enroll Now'}
              </button>
            )}

            <div className="course-includes">
              <h4>This course includes:</h4>
              <ul>
                <li>📖 {course.lectures?.length || 0} lectures</li>
                <li>⏱️ Full lifetime access</li>
                <li>📱 Access on mobile and desktop</li>
                <li>🏆 Certificate of completion</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Course Content */}
      <div className="course-content">
        <div className="content-container">
          {/* Tabs */}
          <div className="course-tabs">
            <button 
              className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              Overview
            </button>
            <button 
              className={`tab ${activeTab === 'curriculum' ? 'active' : ''}`}
              onClick={() => setActiveTab('curriculum')}
            >
              Curriculum
            </button>
            <button 
              className={`tab ${activeTab === 'instructor' ? 'active' : ''}`}
              onClick={() => setActiveTab('instructor')}
            >
              Instructor
            </button>
            <button 
              className={`tab ${activeTab === 'reviews' ? 'active' : ''}`}
              onClick={() => setActiveTab('reviews')}
            >
              Reviews
            </button>
          </div>

          {/* Tab Content */}
          <div className="tab-content">
            {activeTab === 'overview' && (
              <div className="overview-section">
                <div className="section">
                  <h2>What you'll learn</h2>
                  <div className="learning-outcomes">
                    {course.whatYouWillLearn?.map((item, index) => (
                      <div key={index} className="outcome-item">
                        <span className="check-icon">✓</span>
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="section">
                  <h2>Requirements</h2>
                  <ul className="requirements-list">
                    {course.requirements?.map((req, index) => (
                      <li key={index}>{req}</li>
                    ))}
                  </ul>
                </div>

                <div className="section">
                  <h2>Description</h2>
                  <p className="course-full-description">{course.description}</p>
                </div>

                <div className="section">
                  <h2>Course Details</h2>
                  <div className="course-details-grid">
                    <div className="detail-item">
                      <strong>Category:</strong>
                      <span>{course.category}</span>
                    </div>
                    <div className="detail-item">
                      <strong>Level:</strong>
                      <span>{course.level}</span>
                    </div>
                    <div className="detail-item">
                      <strong>Language:</strong>
                      <span>English</span>
                    </div>
                    <div className="detail-item">
                      <strong>Students:</strong>
                      <span>{course.enrolledStudents?.length || 0}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'curriculum' && (
              <div className="curriculum-section">
                <h2>Course Curriculum</h2>
                <p className="curriculum-info">
                  {course.lectures?.length || 0} lectures
                </p>

                <div className="lectures-list">
                  {course.lectures?.length > 0 ? (
                    course.lectures.map((lecture, index) => (
                      <div key={lecture._id} className="lecture-item">
                        <div className="lecture-number">{index + 1}</div>
                        <div className="lecture-info">
                          <h4>{lecture.title}</h4>
                          {lecture.description && (
                            <p className="lecture-description">{lecture.description}</p>
                          )}
                        </div>
                        <div className="lecture-meta">
                          {lecture.duration && (
                            <span className="lecture-duration">⏱️ {lecture.duration} min</span>
                          )}
                          {lecture.isPreview && (
                            <span className="lecture-free">Free Preview</span>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="no-lectures">
                      <p>No lectures added yet.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'instructor' && (
              <div className="instructor-section">
                <div className="instructor-card">
                  <div className="instructor-avatar-large">
                    {course.instructor?.name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="instructor-details">
                    <h2>{course.instructor?.name}</h2>
                    <p className="instructor-role">{course.instructor?.role}</p>
                    <p className="instructor-email">📧 {course.instructor?.email}</p>
                    
                    <div className="instructor-stats">
                      <div className="stat">
                        <strong>Courses</strong>
                        <span>1</span>
                      </div>
                      <div className="stat">
                        <strong>Students</strong>
                        <span>{course.enrolledStudents?.length || 0}</span>
                      </div>
                      <div className="stat">
                        <strong>Rating</strong>
                        <span>⭐ {course.ratings?.average?.toFixed(1) || '0.0'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="reviews-section">
                <div className="reviews-summary">
                  <div className="rating-overview">
                    <h1 className="average-rating">
                      {course.ratings?.average?.toFixed(1) || '0.0'}
                    </h1>
                    <div className="stars">⭐⭐⭐⭐⭐</div>
                    <p>{course.ratings?.count || 0} ratings</p>
                  </div>
                </div>

                <div className="reviews-list">
                  {course.reviews?.length > 0 ? (
                    course.reviews.map((review) => (
                      <div key={review._id} className="review-item">
                        <div className="review-header">
                          <div className="reviewer-avatar">
                            {review.user?.name?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h4>{review.user?.name}</h4>
                            <div className="review-rating">
                              {'⭐'.repeat(review.rating)}
                            </div>
                          </div>
                        </div>
                        <p className="review-comment">{review.comment}</p>
                        <p className="review-date">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="no-reviews">
                      <p>No reviews yet. Be the first to review this course!</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseDetail;