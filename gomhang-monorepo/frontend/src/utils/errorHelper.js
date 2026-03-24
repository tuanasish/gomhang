import { Alert, Platform } from 'react-native';

/**
 * Phân tích lỗi API và trả về title + message thân thiện
 * @param {Error} error - Axios error object
 * @param {string} context - Mô tả ngắn hành động (VD: 'tải đơn hàng', 'tạo ca')
 * @returns {{ title: string, message: string }}
 */
export const getErrorInfo = (error, context = '') => {
    const contextText = context ? ` khi ${context}` : '';

    // Lỗi mạng - không kết nối được server
    if (error?.message === 'Network Error' || error?.code === 'ERR_NETWORK') {
        return {
            title: '⚠️ Lỗi kết nối mạng',
            message: `Không thể kết nối tới máy chủ${contextText}.\n\n` +
                '• Kiểm tra WiFi/3G/4G đã bật chưa\n' +
                '• Đảm bảo thiết bị có kết nối internet\n' +
                '• Thử tắt/bật lại WiFi rồi thử lại'
        };
    }

    // Timeout - kết nối quá chậm
    if (error?.code === 'ECONNABORTED') {
        return {
            title: '⏱️ Hết thời gian kết nối',
            message: `Kết nối quá chậm${contextText}.\n\n` +
                '• Kiểm tra kết nối mạng\n' +
                '• Thử lại sau vài giây'
        };
    }

    const status = error?.response?.status;
    const serverMessage = error?.response?.data?.message || error?.response?.data?.error;

    switch (status) {
        case 400:
            return {
                title: '❌ Dữ liệu không hợp lệ',
                message: serverMessage || `Thông tin gửi lên không đúng${contextText}. Vui lòng kiểm tra lại.`
            };
        case 401:
            return {
                title: '🔐 Phiên đăng nhập hết hạn',
                message: `Bạn cần đăng nhập lại để tiếp tục${contextText}.\n\nVui lòng đăng xuất và đăng nhập lại.`
            };
        case 403:
            return {
                title: '🚫 Không có quyền truy cập',
                message: `Bạn không có quyền thực hiện thao tác này${contextText}.\n\nVui lòng liên hệ quản lý.`
            };
        case 404:
            return {
                title: '🔍 Không tìm thấy',
                message: serverMessage || `Dữ liệu yêu cầu không tồn tại${contextText}.`
            };
        case 409:
            return {
                title: '⚠️ Xung đột dữ liệu',
                message: serverMessage || `Dữ liệu đã bị thay đổi bởi người khác${contextText}. Vui lòng tải lại.`
            };
        case 500:
            return {
                title: '🔧 Lỗi máy chủ',
                message: `Hệ thống đang gặp sự cố${contextText}.\n\nVui lòng thử lại sau vài phút hoặc liên hệ bộ phận kỹ thuật.`
            };
        default:
            return {
                title: '❌ Có lỗi xảy ra',
                message: serverMessage || error?.message || `Đã có lỗi xảy ra${contextText}. Vui lòng thử lại.`
            };
    }
};

/**
 * Hiển thị Alert với thông báo lỗi chi tiết
 * @param {Error} error - Axios error object
 * @param {string} context - Mô tả ngắn hành động
 */
export const showError = (error, context = '') => {
    const { title, message } = getErrorInfo(error, context);

    if (Platform.OS === 'web') {
        window.alert(`${title}\n\n${message}`);
    } else {
        Alert.alert(title, message);
    }
};

/**
 * Hiển thị Alert lỗi validation (không phải lỗi API)
 * @param {string} message - Thông báo lỗi
 */
export const showValidationError = (message) => {
    if (Platform.OS === 'web') {
        window.alert(`⚠️ Thiếu thông tin\n\n${message}`);
    } else {
        Alert.alert('⚠️ Thiếu thông tin', message);
    }
};
