import api from './api';

const enrollmentService = {
  // Enroll in a course
  enrollCourse: async (courseId) => {
    const response = await api.post(`/enrollments/${courseId}`);
    return response.data;
  },

  // Get user's enrolled courses
  getMyEnrollments: async () => {
    const response = await api.get('/enrollments/my-courses');
    return response.data;
  },

  // Get single enrollment
  getEnrollment: async (enrollmentId) => {
    const response = await api.get(`/enrollments/${enrollmentId}`);
    return response.data;
  },

  // Mark lecture as completed
  completeLecture: async (enrollmentId, lectureId) => {
    const response = await api.put(`/enrollments/${enrollmentId}/complete-lecture/${lectureId}`);
    return response.data;
  },

  // Unenroll from course
  unenrollCourse: async (enrollmentId) => {
    const response = await api.delete(`/enrollments/${enrollmentId}`);
    return response.data;
  },
};

export default enrollmentService;