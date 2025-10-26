import React from 'react';
import { Link } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import { useAuth } from '../../context/AuthContext';
import '../../styles/EnrolledCourseCard.css';

const EnrolledCourseCard = ({ enrollment }) => {
  const { user } = useAuth();
  const { course, enrolledAt } = enrollment;
  const progressPercentage = enrollment.progress?.percentageCompleted || 0;
  const completedLectures = enrollment.progress?.completedLectures || [];

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getProgressColor = () => {
    if (progressPercentage === 100) return '#27ae60';
    if (progressPercentage >= 50) return '#f39c12';
    return '#667eea';
  };

  const handleDownloadCertificate = () => {
    if (!course?.title) {
      return;
    }

    const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Background frame
  doc.setFillColor(248, 245, 255);
    doc.rect(36, 36, pageWidth - 72, pageHeight - 72, 'F');

  doc.setDrawColor(91, 99, 183);
    doc.setLineWidth(4);
    doc.rect(54, 54, pageWidth - 108, pageHeight - 108);

    // Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(28);
  doc.setTextColor(91, 99, 183);
    doc.text('LMS Certificate of Completion', pageWidth / 2, 120, { align: 'center' });

  doc.setFontSize(16);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(111, 115, 147);
    doc.text('This is to certify that', pageWidth / 2, 180, { align: 'center' });

    // Student name
    const studentName = user?.name || user?.username || 'Valued Student';
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(32);
  doc.setTextColor(31, 31, 61);
    doc.text(studentName, pageWidth / 2, 230, { align: 'center' });

    // Course name
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(16);
  doc.setTextColor(111, 115, 147);
    doc.text('has successfully completed the course', pageWidth / 2, 280, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(24);
  doc.setTextColor(91, 99, 183);
    doc.text(course.title, pageWidth / 2, 325, { align: 'center' });

    // Additional details
    const completionDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(14);
  doc.setTextColor(111, 115, 147);
    doc.text(`Completion Date: ${completionDate}`, pageWidth / 2, 380, { align: 'center' });

    if (course?.instructor?.name) {
      doc.text(`Instructor: ${course.instructor.name}`, pageWidth / 2, 410, { align: 'center' });
    }

    // Footer signature line
    const footerY = pageHeight - 130;
    doc.setDrawColor('#5b63b7');
    doc.setLineWidth(1.2);
    doc.line(pageWidth / 2 - 120, footerY, pageWidth / 2 + 120, footerY);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('Learning Management System', pageWidth / 2, footerY + 20, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.text('Official Seal', pageWidth / 2, footerY + 40, { align: 'center' });

    const fileName = `${course.title.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}-certificate.pdf`;
    doc.save(fileName);
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
                strokeDashoffset={`${2 * Math.PI * 25 * (1 - progressPercentage / 100)}`}
                transform="rotate(-90 30 30)"
              />
            </svg>
            <span className="progress-text">{Math.round(progressPercentage)}%</span>
          </div>
        </div>
      </div>

      <div className="enrolled-course-content">
        <h3 className="course-title">{course?.title}</h3>
        <p className="course-instructor">By {course?.instructor?.name}</p>

        <div className="course-stats">
          <span className="stat">
            📖 {completedLectures.length} / {course?.lectures?.length || 0} lectures
          </span>
          <span className="stat">
            📅 Enrolled {formatDate(enrolledAt)}
          </span>
        </div>

        <div className="progress-bar">
          <div
            className="progress-fill" 
            style={{ 
              width: `${progressPercentage}%`,
              background: getProgressColor()
            }}
          ></div>
        </div>

        <div className="card-actions">
          {progressPercentage === 100 ? (
            <>
              <Link 
                to={`/courses/${course?._id}`} 
                className="btn-secondary"
              >
                Review Course
              </Link>
              <button type="button" className="btn-certificate" onClick={handleDownloadCertificate}>
                🏆 Get Certificate
              </button>
            </>
          ) : (
            <>
              <Link 
                to={`/learn/${course?._id}`} 
                className="btn-primary"
              >
                {progressPercentage === 0 ? 'Start Learning' : 'Continue Learning'}
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