import axios from 'axios';

// Thay đổi URL Backend của website gomhangpro tại đây
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://gomhang.vn/api';

const apiClient = axios.create({
    baseURL: API_URL,
    timeout: 15000,
    headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
    },
});

// Thêm Interceptor nếu cần pass Token
apiClient.interceptors.request.use(
    async (config) => {
        // const token = await SecureStore.getItemAsync('userToken');
        // if (token) config.headers.Authorization = `Bearer ${token}`;
        return config;
    },
    (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
    (response) => response.data,
    (error) => {
        console.error('API Error:', error?.response?.data || error.message);
        return Promise.reject(error);
    }
);

export default apiClient;
