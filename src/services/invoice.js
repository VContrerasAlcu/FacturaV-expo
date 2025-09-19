import api from './api.js';

export const invoiceService = {
  uploadInvoice: async (imageFile) => {
    const formData = new FormData();
    formData.append('file', imageFile);
    
    const response = await api.post('/api/upload-invoice', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};