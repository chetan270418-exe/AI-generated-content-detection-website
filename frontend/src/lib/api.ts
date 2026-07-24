import axios from 'axios';
import { AuthResponse, Analysis, HistoryResponse } from './types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  signup: async (email: string, password: string) => {
    const res = await api.post('/api/auth/signup', { email, password });
    return res.data;
  },
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const res = await api.post('/api/auth/login', { email, password });
    return res.data;
  },
  verifyOtp: async (email: string, otp_code: string): Promise<AuthResponse> => {
    const res = await api.post('/api/auth/verify-otp', { email, otp_code });
    return res.data;
  },
  resendOtp: async (email: string) => {
    const res = await api.post('/api/auth/resend-otp', { email });
    return res.data;
  },
  forgotPassword: async (email: string) => {
    const res = await api.post('/api/auth/forgot-password', { email });
    return res.data;
  },
  resetPassword: async (email: string, otp_code: string, new_password: string) => {
    const res = await api.post('/api/auth/reset-password', { email, otp_code, new_password });
    return res.data;
  },
};

export const analysisApi = {
  analyzeImage: async (file: File, onUploadProgress?: (progressEvent: any) => void): Promise<{ analysis_id: string; status: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post('/api/analyze/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress,
    });
    return res.data;
  },
  analyzeText: async (text: string): Promise<{ analysis_id: string; status: string }> => {
    const res = await api.post('/api/analyze/text', { text });
    return res.data;
  },
  analyzePdf: async (file: File, onUploadProgress?: (progressEvent: any) => void): Promise<{ analysis_id: string; status: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post('/api/analyze/pdf', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress,
    });
    return res.data;
  },
  analyzeVideo: async (file: File, onUploadProgress?: (progressEvent: any) => void): Promise<{ analysis_id: string; status: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post('/api/analyze/video', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress,
    });
    return res.data;
  },
  analyzeAudio: async (file: File, onUploadProgress?: (progressEvent: any) => void): Promise<{ analysis_id: string; status: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post('/api/analyze/audio', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress,
    });
    return res.data;
  },
  analyzeBatch: async (files: File[], onUploadProgress?: (progressEvent: any) => void) => {
    const formData = new FormData();
    files.forEach(f => formData.append('files', f));
    const res = await api.post('/api/analyze/batch', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress,
    });
    return res.data;
  },
  getResult: async (id: string): Promise<Analysis> => {
    const res = await api.get(`/api/result/${id}`);
    return res.data;
  },
  getHistory: async (page: number = 1, limit: number = 20): Promise<HistoryResponse> => {
    const res = await api.get(`/api/history`, { params: { page, limit } });
    return res.data;
  },
};

export const feedbackApi = {
  submit: (data: { type: string, message: string }) => api.post('/api/feedback/submit', data).then(res => res.data)
};

export const subscriptionApi = {
  getStatus: async () => {
    const res = await api.get('/api/subscription/status');
    return res.data;
  },
  createOrder: async () => {
    const res = await api.post('/api/subscription/create-order');
    return res.data;
  },
  verifyPayment: async (paymentData: any) => {
    const res = await api.post('/api/subscription/verify-payment', paymentData);
    return res.data;
  }
};

export default api;
