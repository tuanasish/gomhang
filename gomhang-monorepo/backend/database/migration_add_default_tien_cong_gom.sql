-- Migration: Thêm cột default_tien_cong_gom vào bảng customers
-- Mô tả: Thêm field để lưu tiền công gom mặc định cho mỗi khách hàng

-- Thêm cột default_tien_cong_gom vào bảng customers
ALTER TABLE public.customers
ADD COLUMN IF NOT EXISTS default_tien_cong_gom numeric DEFAULT NULL;

-- Comment cho cột
COMMENT ON COLUMN public.customers.default_tien_cong_gom IS 'Tiền công gom mặc định cho khách hàng này (có thể NULL nếu chưa thiết lập)';




