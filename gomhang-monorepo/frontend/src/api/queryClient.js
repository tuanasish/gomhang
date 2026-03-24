import { QueryClient } from '@tanstack/react-query';

// Khởi tạo Query Client với default options
export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            // Giữ dữ liệu tươi (tức là không gọi lại API) trong 5 phút
            staleTime: 1000 * 60 * 5,

            // Giữ cache trong 10 phút trước khi xóa hẳn (nếu không được dùng tới)
            gcTime: 1000 * 60 * 10,

            // Số lần gọi lại (retry) khi API thất bại trước khi ném lỗi
            retry: 1,

            // Tránh việc hễ focus lại vào app là gọi API lại quá mức, 
            // tiết kiệm băng thông (chỉ gọi lại khi bị stale)
            refetchOnWindowFocus: false,
        },
    },
});
