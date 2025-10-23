import api from './api';

const courseService = {
  // Get all courses
  getAllCourses: async (params = {}) => {
    const response = await api.get('/courses', { params });
    return response.data;
  },

  // Get single course
  getCourse: async (id) => {
    const response = await api.get(`/courses/${id}`);
    return response.data;
  },

  // Create course
  createCourse: async (courseData) => {
    const response = await api.post('/courses', courseData);
    return response.data;
  },

  // Update course
  updateCourse: async (id, courseData) => {
    const response = await api.put(`/courses/${id}`, courseData);
    return response.data;
  },

  // Delete course
  deleteCourse: async (id) => {
    const response = await api.delete(`/courses/${id}`);
    return response.data;
  },

  // Get instructor courses
  getInstructorCourses: async () => {
    const response = await api.get('/courses/instructor/my-courses');
    return response.data;
  },

  // Lecture management
  addLecture: async (courseId, lectureData) => {
    const response = await api.post(`/courses/${courseId}/lectures`, lectureData);
    return response.data;
  },

  updateLecture: async (courseId, lectureId, lectureData) => {
    const response = await api.put(`/courses/${courseId}/lectures/${lectureId}`, lectureData);
    return response.data;
  },

  deleteLecture: async (courseId, lectureId) => {
    const response = await api.delete(`/courses/${courseId}/lectures/${lectureId}`);
    return response.data;
  },

  reorderLectures: async (courseId, order) => {
    const response = await api.put(`/courses/${courseId}/lectures/reorder`, { order });
    return response.data;
  },

  submitForReview: async (courseId) => {
    const response = await api.put(`/courses/${courseId}/submit`);
    return response.data;
  },

  approveCourse: async (courseId, payload = {}) => {
    const response = await api.put(`/courses/${courseId}/approve`, payload);
    return response.data;
  },

  rejectCourse: async (courseId, payload = {}) => {
    const response = await api.put(`/courses/${courseId}/reject`, payload);
    return response.data;
  },

  getPendingCourses: async () => {
    const response = await api.get('/courses/admin/pending');
    return response.data;
  },
};

export default courseService;