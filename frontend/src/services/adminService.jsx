import api from './api';

const adminService = {
  getDashboardOverview: async () => {
    const response = await api.get('/admin/overview');
    return response.data;
  }
};

export default adminService;
