-- Migration: Tạo bảng lưu lịch sử thêm tiền cho ca làm việc

-- Thêm cột tien_giao_ca_ban_dau vào bảng shifts (nếu chưa có)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'shifts' AND column_name = 'tien_giao_ca_ban_dau'
  ) THEN
    ALTER TABLE shifts ADD COLUMN tien_giao_ca_ban_dau NUMERIC(15, 2);
    -- Cập nhật giá trị ban đầu: tien_giao_ca_ban_dau = tien_giao_ca hiện tại cho các ca đã có
    UPDATE shifts SET tien_giao_ca_ban_dau = tien_giao_ca WHERE tien_giao_ca_ban_dau IS NULL;
    -- Set NOT NULL và default 0 cho các ca mới
    ALTER TABLE shifts ALTER COLUMN tien_giao_ca_ban_dau SET DEFAULT 0;
    ALTER TABLE shifts ALTER COLUMN tien_giao_ca_ban_dau SET NOT NULL;
  END IF;
END $$;

-- Bảng Shift Money Additions (Lịch sử thêm tiền vào ca)
CREATE TABLE IF NOT EXISTS shift_money_additions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shift_id UUID NOT NULL REFERENCES shifts(id) ON DELETE CASCADE,
  amount NUMERIC(15, 2) NOT NULL, -- Số tiền đã thêm (luôn dương)
  note TEXT, -- Ghi chú (tùy chọn)
  created_by UUID REFERENCES users(id) ON DELETE SET NULL, -- Người thêm
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Tạo index
CREATE INDEX IF NOT EXISTS idx_shift_money_additions_shift_id ON shift_money_additions(shift_id);
CREATE INDEX IF NOT EXISTS idx_shift_money_additions_created_at ON shift_money_additions(created_at);

-- Tạo trigger để tự động cập nhật updated_at
CREATE TRIGGER update_shift_money_additions_updated_at 
  BEFORE UPDATE ON shift_money_additions
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

