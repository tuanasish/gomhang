// Shared types for backend

export interface Order {
  id: string;
  shiftId: string;
  customerId: string;
  customerName?: string;
  counterId: string;
  counterName?: string;
  staffId?: string; // Optional - có thể NULL nếu nhân viên đã bị xóa
  staffName?: string;
  tienHang: number;
  tienCongGom: number;
  phiDongHang: number;
  tienHoaHong: number;
  tienThem?: number;
  loaiTienThem?: string;
  tongTienHoaDon: number;
  status: 'pending' | 'completed' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id: string;
  name: string;
  phone?: string;
  email: string;
  password?: string; // Hashed password, not returned in API
  passwordHash?: string;
  role: 'worker' | 'manager' | 'admin';
  avatar?: string;
  shiftStarted?: boolean;
  counterId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: Omit<User, 'password' | 'passwordHash'>;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken?: string; // New refresh token if rotation enabled
}

export interface Shift {
  id: string;
  staffId: string;
  staffName?: string;
  counterId?: string; // Optional - quầy được chọn khi tạo đơn hàng
  counterName?: string;
  date: string; // YYYY-MM-DD format
  startTime: Date;
  endTime?: Date;
  tienGiaoCa: number; // Tiền giao ca ban đầu
  tongTienHangDaTra: number; // Tổng tiền hàng đã trả
  quyConLai: number; // Quỹ còn lại
  status: 'active' | 'ended';
  tongHoaHong?: number; // Tổng hoa hồng
  createdAt: Date;
  updatedAt: Date;
}

export interface Customer {
  id: string;
  name: string;
  phone?: string;
  address?: string;
  defaultTienCongGom?: number; // Tiền công gom mặc định cho khách hàng này
  createdAt: Date;
  updatedAt: Date;
}

export interface Counter {
  id: string;
  name: string;
  address?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ShiftMoneyAddition {
  id: string;
  shiftId: string;
  amount: number; // Số tiền đã thêm (luôn dương)
  note?: string;
  createdBy?: string; // User ID
  createdAt: Date;
  updatedAt: Date;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
