import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import courseService from '../services/courseService';
import enrollmentService from '../services/enrollmentService';
import '../styles/CoursePlayer.css';

const CoursePlayer = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [enrollment, setEnrollment] = useState(null);
  const [activeLectureId, setActiveLectureId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [completing, setCompleting] = useState(false);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        setLoading(true);
        const data = await courseService.getCourseContent(courseId);
        setCourse(data.course);
        setEnrollment(data.enrollment);
        if (Array.isArray(data.course.lectures) && data.course.lectures.length > 0) {
          setActiveLectureId(data.course.lectures[0]._id);
        }
      } catch (err) {
        const message = err.response?.data?.message || 'Unable to load course content.';
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [courseId]);

  const activeLecture = useMemo(() => {
    if (!course || !Array.isArray(course.lectures)) {
      return null;
    }
    return course.lectures.find((lecture) => lecture._id === activeLectureId) || null;
  }, [course, activeLectureId]);

  const completedLectures = useMemo(() => {
    return new Set(enrollment?.completedLectures || []);
  }, [enrollment]);

  const progressPercent = enrollment?.percentageCompleted || enrollment?.progress || 0;

  const handleCompleteLecture = async (lectureId) => {
    if (!enrollment?.id) {
      return;
    }

    try {
      setCompleting(true);
      const data = await enrollmentService.completeLecture(enrollment.id, lectureId);
      const updated = data.enrollment;
      setEnrollment({
        id: updated._id,
        status: updated.status,
        percentageCompleted: updated.progress?.percentageCompleted || 0,
        completedLectures: updated.progress?.completedLectures?.map((item) => item.toString()) || []
      });
    } catch (err) {
      const message = err.response?.data?.message || 'Unable to update lecture progress.';
      alert(message);
    } finally {
      setCompleting(false);
    }
  };

  if (loading) {
    return (
      <div className="course-player loading-state">
        <div className="spinner" />
        <p>Loading course content...</p>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="course-player error-state">
        <h1>Course Content Unavailable</h1>
        <p>{error || 'We could not find the requested course.'}</p>
        <Link to="/my-courses" className="btn-primary">
          Back to My Courses
        </Link>
      </div>
    );
  }

  return (
    <div className="course-player">
      <div className="player-header">
        <div>
          <h1>{course.title}</h1>
          <p>{course.description}</p>
        </div>
        <div className="progress-chip">
          Progress: {Math.round(progressPercent)}%
        </div>
      </div>

      <div className="player-content">
        <div className="video-pane">
          {activeLecture ? (
            <div className="video-wrapper">
              {activeLecture.videoUrl ? (
                <video key={activeLecture._id} controls src={activeLecture.videoUrl} />
              ) : (
                <div className="video-placeholder">
                  <p>This lecture does not have a video yet.</p>
                </div>
              )}

              <div className="lecture-details">
                <div>
                  <h2>{activeLecture.title}</h2>
                  {activeLecture.duration && (
                    <span className="lecture-duration">⏱ {activeLecture.duration} minutes</span>
                  )}
                </div>
                <button
                  className="btn-complete"
                  onClick={() => handleCompleteLecture(activeLecture._id)}
                  disabled={completedLectures.has(activeLecture._id) || completing}
                >
                  {completedLectures.has(activeLecture._id) ? 'Completed' : completing ? 'Marking...' : 'Mark as Complete'}
                </button>
              </div>

              {activeLecture.description && (
                <p className="lecture-description">{activeLecture.description}</p>
              )}

              {Array.isArray(activeLecture.resources) && activeLecture.resources.length > 0 && (
                <div className="resources-section">
                  <h3>Resources</h3>
                  <ul>
                    {activeLecture.resources.map((resource) => (
                      <li key={resource.publicId || resource.url}>
                        <a href={resource.url} target="_blank" rel="noopener noreferrer">
                          {resource.title || 'Download resource'}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="video-placeholder">
              <p>Select a lecture to begin learning.</p>
            </div>
          )}
        </div>

        <aside className="curriculum-pane">
          <div className="curriculum-header">
            <h2>Course Curriculum</h2>
            <p>{course.lectures?.length || 0} lectures</p>
          </div>

          <div className="curriculum-list">
            {course.lectures?.map((lecture, index) => {
              const completed = completedLectures.has(lecture._id);
              const isActive = lecture._id === activeLectureId;

              return (
                <button
                  key={lecture._id}
                  type="button"
                  className={`curriculum-item ${isActive ? 'active' : ''} ${completed ? 'completed' : ''}`}
                  onClick={() => setActiveLectureId(lecture._id)}
                >
                  <div className="lecture-index">{index + 1}</div>
                  <div className="lecture-info">
                    <h4>{lecture.title}</h4>
                    {lecture.duration && <span className="lecture-meta">⏱ {lecture.duration} min</span>}
                    {completed && <span className="lecture-meta success">Completed</span>}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="curriculum-footer">
            <Link to="/my-courses" className="btn-secondary">
              Back to Dashboard
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default CoursePlayer;
