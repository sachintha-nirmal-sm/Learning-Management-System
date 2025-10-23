import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import courseService from '../services/courseService';
import '../styles/ManageLectures.css';

const defaultFormState = {
    title: '',
    description: '',
    videoUrl: '',
    duration: '',
    isPreview: false,
};

const ManageLectures = () => {
    const { courseId } = useParams();
    const navigate = useNavigate();

    const [course, setCourse] = useState(null);
    const [lectures, setLectures] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState(defaultFormState);

    useEffect(() => {
        window.scrollTo(0, 0);
        loadCourse();
    }, [courseId]);

    const loadCourse = async () => {
        try {
            setLoading(true);
            const data = await courseService.getCourse(courseId);
            setCourse(data.course);
            setLectures(data.course?.lectures || []);
            setError('');
        } catch (err) {
            console.error(err);
            const message = err.response?.data?.message || 'Failed to load course details';
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (event) => {
        const { name, value, type, checked } = event.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    const resetForm = () => {
        setFormData(defaultFormState);
        setShowForm(false);
            setError('');
        };

        const openForm = () => {
            setFormData(defaultFormState);
            setError('');
            setShowForm(true);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!formData.title.trim()) {
            setError('Lecture title is required');
            return;
        }

        try {
            setSaving(true);
            setError('');

            await courseService.addLecture(courseId, {
                title: formData.title.trim(),
                description: formData.description.trim(),
                videoUrl: formData.videoUrl.trim(),
                duration: formData.duration ? Number(formData.duration) : undefined,
                isPreview: formData.isPreview,
            });

            resetForm();
            await loadCourse();
        } catch (err) {
            console.error(err);
            const message = err.response?.data?.message || 'Unable to save lecture';
            setError(message);
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteLecture = async (lectureId) => {
        if (!window.confirm('Are you sure you want to delete this lecture?')) {
            return;
        }

        try {
            setError('');
            await courseService.deleteLecture(courseId, lectureId);
            await loadCourse();
        } catch (err) {
            console.error(err);
            const message = err.response?.data?.message || 'Failed to delete lecture';
            setError(message);
        }
    };

    if (loading) {
        return (
            <div className="manage-lectures-loading">
                <div className="spinner" />
                <p>Loading lectures...</p>
            </div>
        );
    }

    if (!course) {
        return (
            <div className="manage-lectures-error">
                <h2>Course not found</h2>
                <p>{error || 'The requested course could not be located.'}</p>
                <button className="btn-secondary" onClick={() => navigate('/instructor/dashboard')}>
                    Back to dashboard
                </button>
            </div>
        );
    }

    return (
        <div className="manage-lectures">
            <div className="lectures-container">
                <div className="page-header">
                    <div>
                        <Link to="/instructor/dashboard" className="back-link">← Back to dashboard</Link>
                        <h1>{course.title}</h1>
                                    <div className={`status-pill ${course.status === 'published' ? 'published' : 'draft'}`}>
                                        {course.status === 'published' ? 'Published' : 'Draft'}
                                    </div>
                        <p className="subtitle">Add, edit, and organize your course content</p>
                    </div>
                    <div className="header-actions">
                        <button className="btn-secondary" onClick={() => navigate(`/courses/${course._id}`)}>
                            View course page
                        </button>
                                    <button className="btn-primary" onClick={openForm}>
                            ➕ Add lecture
                        </button>
                    </div>
                </div>

                {error && <div className="inline-error">{error}</div>}

                {lectures.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon" aria-hidden="true">🎬</div>
                        <h3>No lectures yet</h3>
                        <p>Create your first lecture to start building this course.</p>
                                    <button className="btn-primary" onClick={openForm}>
                            Add first lecture
                        </button>
                    </div>
                ) : (
                    <div className="lectures-list">
                        {lectures.map((lecture, index) => (
                            <div key={lecture._id || index} className="lecture-card">
                                <div className="lecture-order">{index + 1}</div>
                                <div className="lecture-info">
                                    <h3>{lecture.title}</h3>
                                    {lecture.description && <p>{lecture.description}</p>}
                                    <div className="lecture-meta">
                                        {lecture.duration && <span>⏱️ {lecture.duration} min</span>}
                                        {lecture.isPreview && <span className="preview-flag">Preview</span>}
                                        {lecture.videoUrl && (
                                            <a href={lecture.videoUrl} target="_blank" rel="noopener noreferrer">
                                                ▶ Watch video
                                            </a>
                                        )}
                                    </div>
                                </div>
                                <div className="lecture-actions">
                                    <button className="btn-danger" onClick={() => handleDeleteLecture(lecture._id)}>
                                        🗑 Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {showForm && (
                <div className="lecture-modal" role="dialog" aria-modal="true">
                    <div className="lecture-modal-content">
                        <div className="modal-header">
                            <h2>Add new lecture</h2>
                            <button className="close-btn" onClick={resetForm} aria-label="Close">
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <label>
                                Title
                                <input
                                    type="text"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleChange}
                                    placeholder="Lecture title"
                                    required
                                />
                            </label>

                            <label>
                                Description
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    placeholder="What will students learn in this lecture?"
                                    rows={4}
                                />
                            </label>

                            <label>
                                Video URL
                                <input
                                    type="url"
                                    name="videoUrl"
                                    value={formData.videoUrl}
                                    onChange={handleChange}
                                    placeholder="https://..."
                                />
                            </label>

                            <label>
                                Duration (minutes)
                                <input
                                    type="number"
                                    name="duration"
                                    min="1"
                                    value={formData.duration}
                                    onChange={handleChange}
                                    placeholder="Enter duration"
                                />
                            </label>

                            <label className="checkbox-field">
                                <input
                                    type="checkbox"
                                    name="isPreview"
                                    checked={formData.isPreview}
                                    onChange={handleChange}
                                />
                                Make this lecture available as a free preview
                            </label>

                            <div className="modal-actions">
                                <button className="btn-secondary" type="button" onClick={resetForm}>
                                    Cancel
                                </button>
                                <button className="btn-primary" type="submit" disabled={saving}>
                                    {saving ? 'Saving...' : 'Save lecture'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManageLectures;
