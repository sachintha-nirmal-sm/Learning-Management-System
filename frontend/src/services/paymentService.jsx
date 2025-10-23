import api from './api';

const paymentService = {
  createCheckoutSession: async ({ courseId, successPath = '/payment-success', cancelPath }) => {
    const response = await api.post('/payments/checkout-session', {
      courseId,
      successPath,
      cancelPath
    });
    return response.data;
  },

  confirmPayment: async (sessionId) => {
    const response = await api.post('/payments/confirm', { sessionId });
    return response.data;
  },

  getSummary: async () => {
    const response = await api.get('/payments/summary');
    return response.data;
  }
};

export default paymentService;
