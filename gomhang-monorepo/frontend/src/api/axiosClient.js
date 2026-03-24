import axios from 'axios';
import { Platform, DeviceEventEmitter } from 'react-native';
import { getAccessToken, getRefreshToken, saveAccessToken, clearAuthData } from '../utils/storage';

// ----------------------------------------------------------------------

const getApiBaseUrl = () => {
    // 1. Dùng biến môi trường nếu có
    if (process.env.EXPO_PUBLIC_API_URL) {
        return process.env.EXPO_PUBLIC_API_URL;
    }

    // 2. Chế độ Development cục bộ
    // Android emulator dùng 10.0.2.2 để tham chiếu đến localhost của máy chủ
    if (Platform.OS === 'android') {
        return 'http://10.0.2.2:5000/api';
    }

    // iOS simulator hoặc web dùng localhost
    return 'http://localhost:5000/api';
};

const API_BASE_URL = getApiBaseUrl();

const axiosClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 15000,
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

// --- REQUEST INTERCEPTOR ---
axiosClient.interceptors.request.use(
    async (config) => {
        // Lấy token từ bộ nhớ
        const token = await getAccessToken();
        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// --- RESPONSE INTERCEPTOR ---
axiosClient.interceptors.response.use(
    (response) => {
        return response;
    },
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                })
                    .then((token) => {
                        if (originalRequest.headers && token) {
                            originalRequest.headers.Authorization = `Bearer ${token}`;
                        }
                        return axiosClient(originalRequest);
                    })
                    .catch((err) => {
                        return Promise.reject(err);
                    });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            const refreshToken = await getRefreshToken();

            if (!refreshToken) {
                await clearAuthData();
                DeviceEventEmitter.emit('AUTH_EXPIRED');
                processQueue(new Error('No refresh token'), null);
                // Cannot easily dispatch navigation from here without ref, so we depend on context to handle auth state
                return Promise.reject(error);
            }

            try {
                const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
                    refreshToken,
                });

                const { accessToken } = response.data.data;
                await saveAccessToken(accessToken);

                processQueue(null, accessToken);

                if (originalRequest.headers) {
                    originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                }

                return axiosClient(originalRequest);
            } catch (refreshError) {
                await clearAuthData();
                DeviceEventEmitter.emit('AUTH_EXPIRED');
                processQueue(new Error('Refresh token failed'), null);
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);

export default axiosClient;
