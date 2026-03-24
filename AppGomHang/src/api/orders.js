import apiClient from './axiosClient';

/**
 * Lấy danh sách đơn hàng
 */
export const getOrdersListAPI = async (params) => {
    const response = await apiClient.get('/orders', { params });
    return response.data;
};

/**
 * Lấy chi tiết đơn hàng
 */
export const getOrderByIdAPI = async (id) => {
    const response = await apiClient.get(`/orders/${id}`);
    return response.data;
};

/**
 * Lấy tất cả đơn hàng trong một ca
 */
export const getOrdersByShiftAPI = async (shiftId) => {
    const response = await apiClient.get(`/orders/shift/${shiftId}`);
    return response.data;
};

/**
 * Lấy đơn hàng theo ngày (cho worker history)
 */
export const getOrdersByDateAPI = async (date) => {
    return getOrdersListAPI({ date });
};

/**
 * Lấy đơn hàng theo khoảng ngày (cho tháng/năm)
 */
export const getOrdersByDateRangeAPI = async (startDate, endDate) => {
    return getOrdersListAPI({ startDate, endDate });
};

/**
 * Tạo đơn hàng mới (tự động tạo customer/counter nếu cần)
 */
export const createOrderAPI = async (orderData) => {
    const response = await apiClient.post('/orders', orderData);
    return response.data;
};

/**
 * Cập nhật đơn hàng
 */
export const updateOrderAPI = async (orderId, orderData) => {
    const response = await apiClient.put(`/orders/${orderId}`, orderData);
    return response.data;
};

/**
 * Xóa đơn hàng (chỉ pending)
 */
export const deleteOrderAPI = async (orderId) => {
    const response = await apiClient.delete(`/orders/${orderId}`);
    return response.data;
};
