import { Request, Response } from 'express';
import { LoginRequest, LoginResponse, ApiResponse, User } from '../types/index.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken, TokenPayload } from '../utils/jwt.utils.js';
import { comparePassword, hashPassword } from '../utils/bcrypt.utils.js';
import { supabase } from '../config/supabase.js';

/**
 * Register first admin (public endpoint, only works if no admin exists)
 */
export async function registerFirstAdmin(req: Request<{}, ApiResponse<Omit<User, 'password' | 'passwordHash'>>, {
  email: string;
  password: string;
  name: string;
  phone?: string;
}>, res: Response): Promise<void> {
  try {
    const { email, password, name, phone } = req.body;

    // Validation
    if (!email || !password || !name) {
      res.status(400).json({
        success: false,
        error: 'Email, password và name là bắt buộc',
      });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({
        success: false,
        error: 'Mật khẩu phải có ít nhất 6 ký tự',
      });
      return;
    }

    // Check if Supabase is configured
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      res.status(501).json({
        success: false,
        error: 'Database chưa được cấu hình. Vui lòng setup Supabase trước.',
      });
      return;
    }

    // Check if any admin exists
    const { data: existingAdmins } = await supabase
      .from('users')
      .select('id')
      .eq('role', 'admin')
      .limit(1);

    if (existingAdmins && existingAdmins.length > 0) {
      res.status(403).json({
        success: false,
        error: 'Admin đã tồn tại. Chỉ có thể tạo admin đầu tiên qua endpoint này.',
      });
      return;
    }

    // Check if email already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      res.status(409).json({
        success: false,
        error: 'Email đã tồn tại',
      });
      return;
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Insert new admin user
    const { data: newUser, error } = await supabase
      .from('users')
      .insert({
        email,
        password_hash: passwordHash,
        name,
        phone,
        role: 'admin',
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.error('Register error:', error);
      res.status(500).json({
        success: false,
        error: 'Lỗi tạo tài khoản. Vui lòng thử lại.',
      });
      return;
    }

    const { password_hash, ...userWithoutPassword } = newUser as any;

    res.status(201).json({
      success: true,
      data: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone || undefined,
        role: newUser.role,
        avatar: newUser.avatar || undefined,
        createdAt: new Date(newUser.created_at),
        updatedAt: new Date(newUser.updated_at),
      },
      message: 'Tạo tài khoản admin thành công',
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      error: 'Lỗi tạo tài khoản. Vui lòng thử lại.',
    });
  }
}

/**
 * Register new user (for admin creation)
 */
export async function register(req: Request<{}, ApiResponse<Omit<User, 'password' | 'passwordHash'>>, {
  email: string;
  password: string;
  name: string;
  phone?: string;
  role: 'worker' | 'manager' | 'admin';
}>, res: Response): Promise<void> {
  try {
    const { email, password, name, phone, role } = req.body;

    // Validation
    if (!email || !password || !name || !role) {
      res.status(400).json({
        success: false,
        error: 'Email, password, name và role là bắt buộc',
      });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({
        success: false,
        error: 'Mật khẩu phải có ít nhất 6 ký tự',
      });
      return;
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Check if Supabase is configured
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      res.status(501).json({
        success: false,
        error: 'Database chưa được cấu hình. Vui lòng setup Supabase trước.',
      });
      return;
    }

    // Check if email already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      res.status(409).json({
        success: false,
        error: 'Email đã tồn tại',
      });
      return;
    }

    // Insert new user
    const { data: newUser, error } = await supabase
      .from('users')
      .insert({
        email,
        password_hash: passwordHash,
        name,
        phone,
        role,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.error('Register error:', error);
      res.status(500).json({
        success: false,
        error: 'Lỗi tạo tài khoản. Vui lòng thử lại.',
      });
      return;
    }

    const { password_hash, ...userWithoutPassword } = newUser as any;

    res.status(201).json({
      success: true,
      data: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone || undefined,
        role: newUser.role,
        avatar: newUser.avatar || undefined,
        createdAt: new Date(newUser.created_at),
        updatedAt: new Date(newUser.updated_at),
      },
      message: 'Tạo tài khoản thành công',
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      error: 'Lỗi tạo tài khoản. Vui lòng thử lại.',
    });
  }
}

/**
 * Login user
 */
export async function login(req: Request<{}, ApiResponse<LoginResponse>, LoginRequest>, res: Response<ApiResponse<LoginResponse>>): Promise<void> {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({
        success: false,
        error: 'Email và password là bắt buộc',
      });
      return;
    }

    // Check if Supabase is configured
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      res.status(501).json({
        success: false,
        error: 'Database chưa được cấu hình. Vui lòng setup Supabase trước.',
      });
      return;
    }

    // Find user in database
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    // Check if user exists
    if (error) {
      console.error('Database error when finding user:', error);
      res.status(500).json({
        success: false,
        error: 'Lỗi kết nối database. Vui lòng thử lại.',
      });
      return;
    }

    if (!user) {
      console.log('Login attempt with non-existent email:', email);
      res.status(401).json({
        success: false,
        error: 'Email hoặc mật khẩu không đúng',
      });
      return;
    }

    // Check if user is active
    if (!user.is_active) {
      res.status(401).json({
        success: false,
        error: 'Tài khoản đã bị khóa',
      });
      return;
    }

    // Check if user has password hash
    if (!user.password_hash) {
      console.error('User missing password hash:', user.id, user.email);
      res.status(500).json({
        success: false,
        error: 'Lỗi hệ thống. Vui lòng liên hệ quản trị viên.',
      });
      return;
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.password_hash);
    if (!isPasswordValid) {
      console.log('Login attempt with wrong password for user:', user.email);
      res.status(401).json({
        success: false,
        error: 'Email hoặc mật khẩu không đúng',
      });
      return;
    }

    // Generate tokens
    const tokenPayload: TokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    res.json({
      success: true,
      data: {
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone || undefined,
          role: user.role,
          avatar: user.avatar || undefined,
          createdAt: new Date(user.created_at),
          updatedAt: new Date(user.updated_at),
        },
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Lỗi đăng nhập. Vui lòng thử lại.',
    });
  }
}

/**
 * Refresh access token
 */
export async function refreshToken(req: Request<{}, ApiResponse<{ accessToken: string; refreshToken?: string }>, { refreshToken: string }>, res: Response): Promise<void> {
  try {
    const { refreshToken: token } = req.body;

    if (!token) {
      res.status(400).json({
        success: false,
        error: 'Refresh token là bắt buộc',
      });
      return;
    }

    // Verify refresh token (already returns clean payload without JWT standard claims)
    const payload = verifyRefreshToken(token);

    // Check if user still exists and is active
    const { data: user, error: dbError } = await supabase
      .from('users')
      .select('id, is_active')
      .eq('id', payload.userId)
      .single();

    if (dbError || !user || !user.is_active) {
      throw new Error('User not found or inactive');
    }

    // Generate new access token
    const newAccessToken = generateAccessToken(payload);

    res.json({
      success: true,
      data: {
        accessToken: newAccessToken,
      },
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(401).json({
      success: false,
      error: 'Refresh token không hợp lệ hoặc đã hết hạn',
    });
  }
}

/**
 * Get current user info
 */
export async function getCurrentUser(req: Request, res: Response<ApiResponse<Omit<User, 'password' | 'passwordHash'>>>): Promise<void> {
  try {
    // User info is attached by auth middleware
    const user = (req as any).user as TokenPayload;

    if (!user) {
      res.status(401).json({
        success: false,
        error: 'Không tìm thấy thông tin user',
      });
      return;
    }

    // Find user in database
    const { data: userData, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.userId)
      .single();

    if (error || !userData) {
      res.status(404).json({
        success: false,
        error: 'User không tồn tại',
      });
      return;
    }

    res.json({
      success: true,
      data: {
        id: userData.id,
        name: userData.name,
        email: userData.email,
        phone: userData.phone || undefined,
        role: userData.role,
        avatar: userData.avatar || undefined,
        createdAt: new Date(userData.created_at),
        updatedAt: new Date(userData.updated_at),
      },
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({
      success: false,
      error: 'Lỗi lấy thông tin user',
    });
  }
}

/**
 * Logout user
 */
export async function logout(req: Request, res: Response<ApiResponse>): Promise<void> {
  try {
    // Logout endpoint không yêu cầu authentication để cho phép logout ngay cả khi token đã hết hạn
    // In a real implementation, you would invalidate the refresh token in database
    // For now, just return success
    // Token sẽ được clear ở client side
    res.json({
      success: true,
      message: 'Đăng xuất thành công',
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      error: 'Lỗi đăng xuất',
    });
  }
}