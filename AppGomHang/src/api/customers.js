import apiClient from './axiosClient';

/**
 * Lấy danh sách khách hàng
 */
export const getCustomersListAPI = async (search = '', phone = '') => {
    const params = {};
    if (search) params.search = search;
    if (phone) params.phone = phone;

    const response = await apiClient.get('/customers', { params });
    return response.data;
};

/**
 * Lấy chi tiết khách hàng
 */
export const getCustomerByIdAPI = async (id) => {
    const response = await apiClient.get(`/customers/${id}`);
    return response.data;
};

/**
 * Tạo khách hàng mới
 */
export const createCustomerAPI = async (customerData) => {
    const response = await apiClient.post('/customers', customerData);
    return response.data;
};

/**
 * Cập nhật thông tin khách hàng
 */
export const updateCustomerAPI = async (customerId, customerData) => {
    const response = await apiClient.put(`/customers/${customerId}`, customerData);
    return response.data;
};

/**
 * Xóa khách hàng
 */
export const deleteCustomerAPI = async (customerId) => {
    const response = await apiClient.delete(`/customers/${customerId}`);
    return response.data;
};

/**
 * Tìm kiếm khách hàng theo tên hoặc số điện thoại
 */
export const searchCustomersAPI = async (query) => {
    return getCustomersListAPI(query, query);
};

/**
 * Lưu/cập nhật phí đóng gửi & nợ cho khách hàng theo ngày
 */
export const saveCustomerDailyFeeAPI = async (customerId, date, phiDongGui, isInvoiced, noKhach, soDuKhach, tongThanhToan) => {
    const payload = { customerId, date };
    if (phiDongGui !== undefined) payload.phiDongGui = phiDongGui;
    if (isInvoiced !== undefined) payload.isInvoiced = isInvoiced;
    if (noKhach !== undefined) payload.noKhach = noKhach;
    if (soDuKhach !== undefined) payload.soDuKhach = soDuKhach;
    if (tongThanhToan !== undefined) payload.tongThanhToan = tongThanhToan;

    const response = await apiClient.post('/customer-fees', payload);
    return response.data;
};

/**
 * Lấy phí đóng gửi của 1 khách hàng theo ngày
 */
export const getCustomerDailyFeeAPI = async (customerId, date) => {
    const response = await apiClient.get(`/customer-fees/${customerId}`, { params: { date } });
    return response.data;
};

/**
 * Lấy hóa đơn của ngày gần nhất trước ngày chỉ định (tính nợ cũ)
 */
export const getPreviousCustomerBillAPI = async (customerId, date) => {
    const response = await apiClient.get(`/customer-fees/previous-bill/${customerId}`, { params: { date } });
    return response.data;
};

/**
 * Lấy tất cả phí đóng gửi theo ngày (cho Dashboard)
 */
export const getAllCustomerDailyFeesAPI = async (date, startDate, endDate) => {
    const params = {};
    if (date) params.date = date;
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;

    const response = await apiClient.get('/customer-fees', { params });
    return response.data;
};
