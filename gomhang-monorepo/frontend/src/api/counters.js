import apiClient from './axiosClient';

/**
 * Lấy danh sách quầy
 */
export const getCountersListAPI = async (activeOnly = true) => {
    const params = {};
    if (activeOnly) params.activeOnly = 'true';

    const response = await apiClient.get('/counters', { params });
    return response.data;
};

/**
 * Lấy chi tiết quầy
 */
export const getCounterByIdAPI = async (id) => {
    const response = await apiClient.get(`/counters/${id}`);
    return response.data;
};

/**
 * Tạo quầy mới
 */
export const createCounterAPI = async (counterData) => {
    const response = await apiClient.post('/counters', counterData);
    return response.data;
};

/**
 * Cập nhật thông tin quầy
 */
export const updateCounterAPI = async (counterId, counterData) => {
    const response = await apiClient.put(`/counters/${counterId}`, counterData);
    return response.data;
};

/**
 * Xóa/Khóa quầy
 */
export const deleteCounterAPI = async (counterId) => {
    const response = await apiClient.delete(`/counters/${counterId}`);
    return response.data;
};
