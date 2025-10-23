import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import courseService from '../services/courseService';
import uploadService from '../services/uploadService';
import '../styles/CreateCourse.css';

const emptyForm = {
  title: '',
  description: '',
  category: '',
  level: 'Beginner',
  language: 'English',
  price: '0',
  requirements: '',
  whatYouWillLearn: ''
};

const categories = ['Programming', 'Design', 'Business', 'Marketing', 'Photography', 'Music', 'Other'];
const levels = ['Beginner', 'Intermediate', 'Advanced', 'All Levels'];
const languages = ['English', 'Spanish', 'French', 'German', 'Hindi', 'Chinese', 'Other'];

const CreateCourse = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState(emptyForm);
  const [thumbnail, setThumbnail] = useState(null);
  const [thumbnailUploading, setThumbnailUploading] = useState(false);
  const [thumbnailProgress, setThumbnailProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fileInputRef = useRef(null);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleThumbnailUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setThumbnailUploading(true);
      setThumbnailProgress(0);
      setError('');

      const response = await uploadService.uploadImage(file, (progressEvent) => {
        if (!progressEvent.total) return;
        const progress = Math.round((progressEvent.loaded / progressEvent.total) * 100);
        setThumbnailProgress(progress);
      });

      setThumbnail({ public_id: response.public_id, url: response.url });
    } catch (err) {
      console.error(err);
      const message = err.response?.data?.message || 'Thumbnail upload failed';
      setError(message);
    } finally {
      setThumbnailUploading(false);
      setThumbnailProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveThumbnail = async () => {
    if (!thumbnail?.public_id) {
      setThumbnail(null);
      return;
    }

    try {
      await uploadService.deleteFile(thumbnail.public_id, 'image');
    } catch (err) {
      console.error(err);
    } finally {
      setThumbnail(null);
    }
  };

  const toList = (value) => {
    if (Array.isArray(value)) return value;
    return value
      .split(/\r?\n|,/)
      .map((item) => item.trim())
      .filter(Boolean);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!formData.title.trim() || !formData.description.trim() || !formData.category) {
      setError('Please complete the required fields');
      return;
    }

    if (!thumbnail) {
      setError('Please upload a course thumbnail');
      return;
    }

    setLoading(true);

    try {
      const coursePayload = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category,
        level: formData.level,
        language: formData.language,
        price: parseFloat(formData.price) || 0,
        requirements: toList(formData.requirements),
        whatYouWillLearn: toList(formData.whatYouWillLearn),
        thumbnail
      };

      const response = await courseService.createCourse(coursePayload);
      navigate(`/instructor/course/${response.course._id}/lectures`);
    } catch (err) {
      console.error(err);
      const message = err.response?.data?.message || 'Failed to create course';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-course">
      <div className="create-course-container">
        <div className="page-header">
          <h1>Create New Course</h1>
          <p>Share your knowledge with students around the world</p>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="course-form" noValidate>
          <div className="form-section">
            <h2>📝 Basic Information</h2>

            <div className="form-group">
              <label htmlFor="title">Course Title *</label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g., Complete Web Development Bootcamp"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="description">Course Description *</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={6}
                placeholder="Describe what students will learn in this course..."
                required
              />
            </div>

            <div className="thumbnail-section">
              <div className="thumbnail-header">
                <div>
                  <h3>Course Thumbnail *</h3>
                  <p>Upload a cover image that represents your course</p>
                </div>
                <button
                  type="button"
                  className="btn-light"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={thumbnailUploading}
                >
                  {thumbnail ? 'Replace image' : 'Upload image'}
                </button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleThumbnailUpload}
                hidden
              />

              {thumbnailUploading && (
                <div className="upload-progress">
                  <div className="progress-bar" style={{ width: `${thumbnailProgress}%` }} />
                  <span>{thumbnailProgress}%</span>
                </div>
              )}

              {thumbnail ? (
                <div className="thumbnail-preview">
                  <img src={thumbnail.url} alt="Course thumbnail" />
                  <button type="button" className="btn-text" onClick={handleRemoveThumbnail}>
                    Remove
                  </button>
                </div>
              ) : (
                <div className="thumbnail-placeholder">
                  <span role="img" aria-label="image">🖼️</span>
                  <p>Recommended size 1280×720px</p>
                </div>
              )}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="category">Category *</label>
                <select id="category" name="category" value={formData.category} onChange={handleChange} required>
                  <option value="">Select category</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="level">Level *</label>
                <select id="level" name="level" value={formData.level} onChange={handleChange} required>
                  {levels.map((level) => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="language">Language</label>
                <select id="language" name="language" value={formData.language} onChange={handleChange}>
                  {languages.map((language) => (
                    <option key={language} value={language}>{language}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="price">Price ($)</label>
                <input
                  type="number"
                  id="price"
                  name="price"
                  min="0"
                  step="0.01"
                  value={formData.price}
                  onChange={handleChange}
                />
                <small>Set to 0 for a free course</small>
              </div>
            </div>
          </div>

          <div className="form-section">
            <h2>📚 Learning outcomes</h2>

            <div className="form-group">
              <label htmlFor="whatYouWillLearn">What students will learn</label>
              <textarea
                id="whatYouWillLearn"
                name="whatYouWillLearn"
                value={formData.whatYouWillLearn}
                onChange={handleChange}
                rows={4}
                placeholder="Enter each outcome on a new line or separate with commas"
              />
            </div>

            <div className="form-group">
              <label htmlFor="requirements">Requirements</label>
              <textarea
                id="requirements"
                name="requirements"
                value={formData.requirements}
                onChange={handleChange}
                rows={4}
                placeholder="Enter each requirement on a new line or separate with commas"
              />
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="btn-cancel" onClick={() => navigate('/instructor/dashboard')}>
              Cancel
            </button>
            <button type="submit" className="btn-submit" disabled={loading || thumbnailUploading}>
              {loading ? 'Creating…' : 'Create course & add lectures'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateCourse;