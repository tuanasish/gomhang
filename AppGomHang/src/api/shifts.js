import apiClient from './axiosClient';

/**
 * Lấy danh sách ca làm việc
 */
export const getShiftsListAPI = async (params) => {
    const response = await apiClient.get('/shifts', { params });
    return response.data;
};

/**
 * Lấy chi tiết ca làm việc
 */
export const getShiftByIdAPI = async (id) => {
    const response = await apiClient.get(`/shifts/${id}`);
    return response.data;
};

/**
 * Lấy ca hiện tại của worker (active)
 * Trả về null nếu không tìm thấy ca (404) thay vì throw error
 */
export const getCurrentShiftAPI = async () => {
    try {
        const response = await apiClient.get('/shifts/current');
        if (!response.data?.success || !response.data?.data) {
            return null;
        }
        return response.data;
    } catch (error) {
        if (error.response?.status === 404) {
            return null;
        }
        throw error;
    }
};

/**
 * Tự động tạo và bắt đầu ca cho worker (tiền giao ca = 0)
 */
export const autoStartShiftAPI = async () => {
    const response = await apiClient.post('/shifts/auto-start');
    return response.data;
};

/**
 * Tạo ca mới
 */
export const createShiftAPI = async (shiftData) => {
    const response = await apiClient.post('/shifts', shiftData);
    return response.data;
};

/**
 * Bắt đầu ca
 */
export const startShiftAPI = async (shiftId) => {
    const response = await apiClient.put(`/shifts/${shiftId}/start`, {});
    return response.data;
};

/**
 * Kết thúc ca
 */
export const endShiftAPI = async (shiftId) => {
    const response = await apiClient.put(`/shifts/${shiftId}/end`, {});
    return response.data;
};

/**
 * Cập nhật trực tiếp tiền giao ca (Admin/Manager)
 */
export const updateShiftMoneyAPI = async (shiftId, tienGiaoCa) => {
    const response = await apiClient.put(`/shifts/${shiftId}/money`, { tienGiaoCa });
    return response.data;
};

/**
 * Cộng thêm tiền vào ca (lưu lịch sử)
 */
export const addMoneyToShiftAPI = async (shiftId, amount, note) => {
    const response = await apiClient.put(`/shifts/${shiftId}/add-money`, { amount, note });
    return response.data;
};

/**
 * Lấy lịch sử thêm tiền của ca
 */
export const getShiftMoneyAdditionsAPI = async (shiftId) => {
    const response = await apiClient.get(`/shifts/${shiftId}/money-additions`);
    return response.data;
};

/**
 * Cập nhật một lần thêm tiền trong lịch sử
 */
export const updateShiftMoneyAdditionAPI = async (shiftId, additionId, data) => {
    const response = await apiClient.put(`/shifts/${shiftId}/money-additions/${additionId}`, data);
    return response.data;
};

/**
 * Xóa một lần thêm tiền trong lịch sử
 */
export const deleteShiftMoneyAdditionAPI = async (shiftId, additionId) => {
    const response = await apiClient.delete(`/shifts/${shiftId}/money-additions/${additionId}`);
    return response.data;
};
