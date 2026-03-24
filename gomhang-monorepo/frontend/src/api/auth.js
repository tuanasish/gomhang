import apiClient from './axiosClient';

export const loginAPI = async (email, password) => {
    try {
        // Demo endpoint (bạn sẽ đổi thành endpoint thực tế ở bước sau)
        const response = await apiClient.post('/auth/login', {
            email,
            password,
        });
        return response;
    } catch (error) {
        throw error;
    }
};

export const fetchUserProfileAPI = async () => {
    try {
        const response = await apiClient.get('/auth/profile');
        return response;
    } catch (error) {
        throw error;
    }
};
