import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import courseService from '../services/courseService';
import uploadService from '../services/uploadService';
import '../styles/ManageLectures.css';

const createDefaultFormState = () => ({
    title: '',
    description: '',
    videoUrl: '',
    videoPublicId: '',
    duration: '',
    isPreview: false,
    resources: []
});

const ManageLectures = () => {
    const { courseId } = useParams();
    const navigate = useNavigate();

    const [course, setCourse] = useState(null);
    const [lectures, setLectures] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState(createDefaultFormState());
    const [editingLectureId, setEditingLectureId] = useState(null);
    const [videoUploading, setVideoUploading] = useState(false);
    const [videoProgress, setVideoProgress] = useState(0);
    const [resourceUploading, setResourceUploading] = useState(false);
    const [resourceProgress, setResourceProgress] = useState(0);

    const videoInputRef = useRef(null);
    const resourceInputRef = useRef(null);

    const isPublished = course?.status === 'published';

    useEffect(() => {
        window.scrollTo(0, 0);
        loadCourse();
    }, [courseId]);

    const loadCourse = async () => {
        try {
            setLoading(true);
            const data = await courseService.getCourse(courseId);
            const sortedLectures = [...(data.course?.lectures || [])].sort((a, b) => (a.order || 0) - (b.order || 0));
            setCourse(data.course);
            setLectures(sortedLectures);
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
        setFormData(createDefaultFormState());
        setEditingLectureId(null);
        setShowForm(false);
        setError('');
        setVideoProgress(0);
        setResourceProgress(0);
    };

    const openCreateForm = () => {
        if (!isPublished) {
            setError('Lectures can be managed only after an admin publishes this course.');
            return;
        }
        setFormData(createDefaultFormState());
        setEditingLectureId(null);
        setError('');
        setShowForm(true);
    };

    const openEditForm = (lecture) => {
        if (!isPublished) {
            setError('Lectures can be managed only after an admin publishes this course.');
            return;
        }
        setFormData({
            title: lecture.title || '',
            description: lecture.description || '',
            videoUrl: lecture.videoUrl || '',
            videoPublicId: lecture.videoPublicId || '',
            duration: lecture.duration ? String(lecture.duration) : '',
            isPreview: Boolean(lecture.isPreview),
            resources: Array.isArray(lecture.resources) ? lecture.resources.map((item) => ({ ...item })) : []
        });
        setEditingLectureId(lecture._id);
        setError('');
        setShowForm(true);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!formData.title.trim()) {
            setError('Lecture title is required');
            return;
        }

        if (!isPublished) {
            setError('Lectures can be managed only after an admin publishes this course.');
            return;
        }

        try {
            setSaving(true);
            setError('');

            const payload = {
                title: formData.title.trim(),
                description: formData.description.trim(),
                videoUrl: formData.videoUrl,
                videoPublicId: formData.videoPublicId,
                duration: formData.duration ? Number(formData.duration) : undefined,
                isPreview: formData.isPreview,
                resources: formData.resources
            };

            if (editingLectureId) {
                await courseService.updateLecture(courseId, editingLectureId, payload);
            } else {
                await courseService.addLecture(courseId, payload);
            }

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
        if (!isPublished) {
            setError('Lectures can be managed only after an admin publishes this course.');
            return;
        }
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

    const handleReorder = async (lectureId, direction) => {
        if (!isPublished) {
            setError('Lectures can be managed only after an admin publishes this course.');
            return;
        }
        const currentIndex = lectures.findIndex((lecture) => lecture._id === lectureId);
        if (currentIndex === -1) return;

        const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
        if (targetIndex < 0 || targetIndex >= lectures.length) return;

        const reordered = [...lectures];
        const [movedLecture] = reordered.splice(currentIndex, 1);
        reordered.splice(targetIndex, 0, movedLecture);

        setLectures(reordered.map((lecture, index) => ({ ...lecture, order: index + 1 })));

        try {
            await courseService.reorderLectures(courseId, reordered.map((lecture) => lecture._id));
            await loadCourse();
        } catch (err) {
            console.error(err);
            const message = err.response?.data?.message || 'Failed to reorder lectures';
            setError(message);
        }
    };

    const handleVideoUpload = async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        try {
            setVideoUploading(true);
            setVideoProgress(0);
            setError('');

            const response = await uploadService.uploadVideo(file, (progressEvent) => {
                if (!progressEvent.total) return;
                const progress = Math.round((progressEvent.loaded / progressEvent.total) * 100);
                setVideoProgress(progress);
            });

            setFormData((prev) => ({
                ...prev,
                videoUrl: response.url,
                videoPublicId: response.public_id,
                duration: response.duration ? String(Math.max(1, Math.round(response.duration / 60))) : prev.duration
            }));
        } catch (err) {
            console.error(err);
            const message = err.response?.data?.message || 'Video upload failed';
            setError(message);
        } finally {
            setVideoUploading(false);
            setVideoProgress(0);
            if (videoInputRef.current) {
                videoInputRef.current.value = '';
            }
        }
    };

    const handleRemoveVideo = async () => {
        if (!formData.videoPublicId) {
            setFormData((prev) => ({ ...prev, videoUrl: '', duration: '', videoPublicId: '' }));
            return;
        }

        try {
            await uploadService.deleteFile(formData.videoPublicId, 'video');
        } catch (err) {
            console.error(err);
        } finally {
            setFormData((prev) => ({ ...prev, videoUrl: '', duration: '', videoPublicId: '' }));
        }
    };

    const handleResourceUpload = async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        try {
            setResourceUploading(true);
            setResourceProgress(0);
            setError('');

            const response = await uploadService.uploadResource(file, (progressEvent) => {
                if (!progressEvent.total) return;
                const progress = Math.round((progressEvent.loaded / progressEvent.total) * 100);
                setResourceProgress(progress);
            });

            setFormData((prev) => ({
                ...prev,
                resources: [
                    ...prev.resources,
                    {
                        title: file.name,
                        url: response.url,
                        publicId: response.public_id
                    }
                ]
            }));
        } catch (err) {
            console.error(err);
            const message = err.response?.data?.message || 'Resource upload failed';
            setError(message);
        } finally {
            setResourceUploading(false);
            setResourceProgress(0);
            if (resourceInputRef.current) {
                resourceInputRef.current.value = '';
            }
        }
    };

    const handleRemoveResource = async (index) => {
        const resource = formData.resources[index];
        if (!resource) return;

        try {
            if (resource.publicId) {
                await uploadService.deleteFile(resource.publicId, 'raw');
            }
        } catch (err) {
            console.error(err);
        } finally {
            setFormData((prev) => ({
                ...prev,
                resources: prev.resources.filter((_, idx) => idx !== index)
            }));
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
                        <div className={`status-pill status-${course.status || 'draft'}`}>
                            {course.status ? course.status.charAt(0).toUpperCase() + course.status.slice(1) : 'Draft'}
                        </div>
                        <p className="subtitle">Add, edit, and organize your course content</p>
                    </div>
                    <div className="header-actions">
                        <button className="btn-secondary" onClick={() => navigate(`/courses/${course._id}`)}>
                            Preview course
                        </button>
                        <button className="btn-primary" onClick={openCreateForm} disabled={!isPublished}>
                            ➕ Add lecture
                        </button>
                    </div>
                </div>

                {!isPublished && (
                    <div className="info-banner">
                        <strong>Pending approval.</strong> An admin must publish this course before you can create or edit lectures.
                    </div>
                )}

                {error && <div className="inline-error">{error}</div>}

                {lectures.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon" aria-hidden="true">🎬</div>
                        <h3>No lectures yet</h3>
                        <p>Create your first lecture to start building this course.</p>
                        <button className="btn-primary" onClick={openCreateForm} disabled={!isPublished}>
                            Add first lecture
                        </button>
                    </div>
                ) : (
                    <div className="lectures-list">
                        {lectures.map((lecture, index) => (
                            <div key={lecture._id || index} className="lecture-card">
                                <div className="lecture-order">{index + 1}</div>
                                <div className="lecture-info">
                                    <div className="lecture-title-row">
                                        <h3>{lecture.title}</h3>
                                        {lecture.isPreview && <span className="preview-flag">Preview</span>}
                                    </div>
                                    {lecture.description && <p>{lecture.description}</p>}
                                    <div className="lecture-meta">
                                        {lecture.duration && <span>⏱️ {lecture.duration} min</span>}
                                        {lecture.videoUrl && (
                                            <a href={lecture.videoUrl} target="_blank" rel="noopener noreferrer">
                                                ▶ Watch video
                                            </a>
                                        )}
                                    </div>
                                    {Array.isArray(lecture.resources) && lecture.resources.length > 0 && (
                                        <div className="lecture-resources">
                                            {lecture.resources.map((resource) => (
                                                <a key={resource._id || resource.publicId || resource.url} href={resource.url} target="_blank" rel="noopener noreferrer" className="resource-chip">
                                                    📎 {resource.title || 'Resource'}
                                                </a>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="lecture-actions">
                                    <button className="btn-light" onClick={() => handleReorder(lecture._id, 'up')} disabled={!isPublished || index === 0}>
                                        ↑ Move up
                                    </button>
                                    <button className="btn-light" onClick={() => handleReorder(lecture._id, 'down')} disabled={!isPublished || index === lectures.length - 1}>
                                        ↓ Move down
                                    </button>
                                    <button className="btn-light" onClick={() => openEditForm(lecture)} disabled={!isPublished}>
                                        ✏ Edit
                                    </button>
                                    <button className="btn-danger" onClick={() => handleDeleteLecture(lecture._id)} disabled={!isPublished}>
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
                            <h2>{editingLectureId ? 'Edit lecture' : 'Add new lecture'}</h2>
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

                            <div className="form-subsection">
                                <div className="subsection-header">
                                    <h3>Video content</h3>
                                    <button
                                        type="button"
                                        className="btn-light"
                                        onClick={() => videoInputRef.current?.click()}
                                        disabled={videoUploading}
                                    >
                                        {formData.videoUrl ? 'Replace video' : 'Upload video'}
                                    </button>
                                    {formData.videoUrl && (
                                        <button type="button" className="btn-text" onClick={handleRemoveVideo}>
                                            Remove video
                                        </button>
                                    )}
                                </div>
                                <input
                                    type="file"
                                    accept="video/*"
                                    ref={videoInputRef}
                                    onChange={handleVideoUpload}
                                    hidden
                                />

                                {videoUploading && (
                                    <div className="upload-progress">
                                        <div className="progress-bar" style={{ width: `${videoProgress}%` }} />
                                        <span>{videoProgress}%</span>
                                    </div>
                                )}

                                {formData.videoUrl && (
                                    <div className="video-preview">
                                        <p>Current video:</p>
                                        <a href={formData.videoUrl} target="_blank" rel="noopener noreferrer">Open in new tab</a>
                                    </div>
                                )}
                            </div>

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

                            <div className="form-subsection">
                                <div className="subsection-header">
                                    <h3>Resources</h3>
                                    <button
                                        type="button"
                                        className="btn-light"
                                        onClick={() => resourceInputRef.current?.click()}
                                        disabled={resourceUploading}
                                    >
                                        Upload resource
                                    </button>
                                </div>
                                <input
                                    type="file"
                                    accept=".pdf,.doc,.docx,.ppt,.pptx,.zip,.rar,.png,.jpg,.jpeg,.mp4,.mp3"
                                    ref={resourceInputRef}
                                    onChange={handleResourceUpload}
                                    hidden
                                />

                                {resourceUploading && (
                                    <div className="upload-progress">
                                        <div className="progress-bar" style={{ width: `${resourceProgress}%` }} />
                                        <span>{resourceProgress}%</span>
                                    </div>
                                )}

                                {formData.resources.length > 0 && (
                                    <ul className="resource-list">
                                        {formData.resources.map((resource, index) => (
                                            <li key={resource.publicId || resource.url || index}>
                                                <span>{resource.title || 'Resource'}</span>
                                                <div className="resource-actions">
                                                    <a href={resource.url} target="_blank" rel="noopener noreferrer">View</a>
                                                    <button type="button" onClick={() => handleRemoveResource(index)}>
                                                        Remove
                                                    </button>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>

                            <div className="modal-actions">
                                <button className="btn-secondary" type="button" onClick={resetForm}>
                                    Cancel
                                </button>
                                <button className="btn-primary" type="submit" disabled={!isPublished || saving || videoUploading || resourceUploading}>
                                    {saving ? 'Saving…' : editingLectureId ? 'Update lecture' : 'Save lecture'}
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
