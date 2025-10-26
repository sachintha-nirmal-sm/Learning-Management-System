import api from './api';

const adminService = {
  getDashboardOverview: async () => {
    const response = await api.get('/admin/overview');
    return response.data;
  },

  getUsers: async (params = {}) => {
    const response = await api.get('/admin/users', { params });
    return response.data;
  },

  updateUser: async (userId, payload) => {
    const response = await api.put(`/admin/users/${userId}`, payload);
    return response.data;
  },

  deleteUser: async (userId) => {
    const response = await api.delete(`/admin/users/${userId}`);
    return response.data;
  },

  getAdminCourses: async () => {
    const response = await api.get('/admin/courses');
    return response.data;
  },

  updateAdminCourse: async (courseId, payload) => {
    const response = await api.put(`/admin/courses/${courseId}`, payload);
    return response.data;
  },

  deleteAdminCourse: async (courseId) => {
    const response = await api.delete(`/admin/courses/${courseId}`);
    return response.data;
  }
};

export default adminService;
