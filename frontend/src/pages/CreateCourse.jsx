import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import courseService from '../services/courseService';
import '../styles/CreateCourse.css';

const CreateCourse = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    level: 'Beginner',
    price: 0,
    requirements: '',
    whatYouWillLearn: '',
  });

  const categories = ['Programming', 'Design', 'Business', 'Marketing', 'Photography', 'Music', 'Other'];
  const levels = ['Beginner', 'Intermediate', 'Advanced', 'All Levels'];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Validation
    if (!formData.title || !formData.description || !formData.category) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);

    try {
      // Convert comma-separated strings to arrays
      const courseData = {
        ...formData,
        price: parseFloat(formData.price) || 0,
        requirements: formData.requirements.split(',').map(item => item.trim()).filter(item => item),
        whatYouWillLearn: formData.whatYouWillLearn.split(',').map(item => item.trim()).filter(item => item),
      };

      const response = await courseService.createCourse(courseData);
      navigate(`/instructor/course/${response.course._id}/lectures`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create course');
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

        <form onSubmit={handleSubmit} className="course-form">
          {/* Basic Information */}
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
                rows="5"
                placeholder="Describe what students will learn in this course..."
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="category">Category *</label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Category</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="level">Level *</label>
                <select
                  id="level"
                  name="level"
                  value={formData.level}
                  onChange={handleChange}
                  required
                >
                  {levels.map(level => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="price">Price ($)</label>
                <input
                  type="number"
                  id="price"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                />
                <small>Set to 0 for a free course</small>
              </div>
            </div>
          </div>

          {/* Course Content */}
          <div className="form-section">
            <h2>📚 Course Content</h2>
            
            <div className="form-group">
              <label htmlFor="whatYouWillLearn">What Students Will Learn</label>
              <textarea
                id="whatYouWillLearn"
                name="whatYouWillLearn"
                value={formData.whatYouWillLearn}
                onChange={handleChange}
                rows="4"
                placeholder="Enter learning outcomes separated by commas. E.g., Build websites, Master React, Deploy applications"
              />
              <small>Separate each item with a comma</small>
            </div>

            <div className="form-group">
              <label htmlFor="requirements">Requirements</label>
              <textarea
                id="requirements"
                name="requirements"
                value={formData.requirements}
                onChange={handleChange}
                rows="4"
                placeholder="Enter requirements separated by commas. E.g., Basic HTML knowledge, A computer with internet"
              />
              <small>Separate each item with a comma</small>
            </div>
          </div>

          {/* Form Actions */}
          <div className="form-actions">
            <button 
              type="button" 
              className="btn-cancel"
              onClick={() => navigate('/instructor/dashboard')}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn-submit"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Course & Add Lectures'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateCourse;