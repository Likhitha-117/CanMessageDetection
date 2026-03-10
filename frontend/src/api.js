import axios from 'axios';

const api = axios.create({
    baseURL: '/api',
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Handle 401 globally
api.interceptors.response.use(
    (res) => res,
    (err) => {
        if (err.response?.status === 401) {
            localStorage.clear();
            window.location.href = '/login';
        }
        return Promise.reject(err);
    }
);

export const uploadDataset = (formData) => api.post('/analysis/upload-dataset', formData, {
    headers: {
        'Content-Type': 'multipart/form-data'
    }
});

export default api;
