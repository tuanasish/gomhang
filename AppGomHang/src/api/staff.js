import apiClient from './axiosClient';

/**
 * Lấy danh sách nhân viên
 */
export const getStaffListAPI = async () => {
    const response = await apiClient.get('/staff');
    return response.data?.data || response.data || [];
};

/**
 * Tạo nhân viên mới
 */
export const createStaffAPI = async (staffData) => {
    const response = await apiClient.post('/staff', {
        ...staffData,
        role: staffData.role || 'worker',
    });
    return response.data?.data || response.data;
};

/**
 * Cập nhật thông tin nhân viên
 */
export const updateStaffAPI = async (staffId, staffData) => {
    const response = await apiClient.put(`/staff/${staffId}`, staffData);
    return response.data?.data || response.data;
};

/**
 * Xóa nhân viên
 */
export const deleteStaffAPI = async (staffId) => {
    const response = await apiClient.delete(`/staff/${staffId}`);
    return response.data;
};
