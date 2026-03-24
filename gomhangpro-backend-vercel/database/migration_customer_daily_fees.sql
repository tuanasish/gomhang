-- Migration: Tạo bảng customer_daily_fees
-- Lưu phí đóng gửi theo khách hàng + ngày

CREATE TABLE IF NOT EXISTS customer_daily_fees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  phi_dong_gui NUMERIC(15, 2) NOT NULL DEFAULT 0,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(customer_id, date)
);

-- Index cho truy vấn theo ngày
CREATE INDEX idx_customer_daily_fees_date ON customer_daily_fees(date);
CREATE INDEX idx_customer_daily_fees_customer_id ON customer_daily_fees(customer_id);

-- Trigger cập nhật updated_at
CREATE TRIGGER update_customer_daily_fees_updated_at BEFORE UPDATE ON customer_daily_fees
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
