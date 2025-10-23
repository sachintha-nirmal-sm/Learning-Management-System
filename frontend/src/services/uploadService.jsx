import api from './api';

const buildFormData = (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return formData;
};

const multipartConfig = (onUploadProgress) => ({
  headers: { 'Content-Type': 'multipart/form-data' },
  onUploadProgress,
});

const uploadService = {
  uploadImage: async (file, onUploadProgress) => {
    const response = await api.post('/upload/image', buildFormData(file), multipartConfig(onUploadProgress));
    return response.data;
  },

  uploadVideo: async (file, onUploadProgress) => {
    const response = await api.post('/upload/video', buildFormData(file), multipartConfig(onUploadProgress));
    return response.data;
  },

  uploadResource: async (file, onUploadProgress) => {
    const response = await api.post('/upload/resource', buildFormData(file), multipartConfig(onUploadProgress));
    return response.data;
  },

  deleteFile: async (publicId, type = 'image') => {
    const response = await api.delete(`/upload/${publicId}`, { params: { type } });
    return response.data;
  },
};

export default uploadService;
