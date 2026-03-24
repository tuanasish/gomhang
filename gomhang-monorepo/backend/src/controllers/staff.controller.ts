import { Request, Response } from 'express';
import { ApiResponse, User } from '../types/index.js';
import { hashPassword } from '../utils/bcrypt.utils.js';
import { supabase } from '../config/supabase.js';

/**
 * Lấy danh sách nhân viên
 */
export async function getStaffList(req: Request, res: Response<ApiResponse<Omit<User, 'password' | 'passwordHash'>[]>>): Promise<void> {
  try {
    const { data: staffList, error } = await supabase
      .from('users')
      .select('id, name, email, phone, role, is_active, created_at, updated_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Get staff list error:', error);
      res.status(500).json({
        success: false,
        error: 'Lỗi lấy danh sách nhân viên',
      });
      return;
    }

    res.json({
      success: true,
      data: staffList.map((user: any) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone || undefined,
        role: user.role,
        avatar: undefined,
        isActive: user.is_active,
        createdAt: new Date(user.created_at),
        updatedAt: new Date(user.updated_at),
      })),
    });
  } catch (error) {
    console.error('Get staff list error:', error);
    res.status(500).json({
      success: false,
      error: 'Lỗi lấy danh sách nhân viên',
    });
  }
}

/**
 * Tạo nhân viên mới (sử dụng logic tương tự register)
 */
export async function createStaff(req: Request<{}, ApiResponse<Omit<User, 'password' | 'passwordHash'>>, {
  email: string;
  password: string;
  name: string;
  phone?: string;
  role?: 'worker' | 'manager' | 'admin';
}>, res: Response): Promise<void> {
  try {
    const { email, password, name, phone, role = 'worker' } = req.body;

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

    // Hash password
    const passwordHash = await hashPassword(password);

    // Check if email already exists
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (checkError && checkError.code !== 'PGRST116') {
      // Error other than "not found"
      console.error('Error checking existing user:', checkError);
      res.status(500).json({
        success: false,
        error: 'Lỗi kiểm tra email. Vui lòng thử lại.',
      });
      return;
    }

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
      console.error('Create staff error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Lỗi tạo nhân viên. Vui lòng thử lại.',
      });
      return;
    }

    if (!newUser) {
      console.error('Create staff: No user returned after insert');
      res.status(500).json({
        success: false,
        error: 'Lỗi tạo nhân viên. Vui lòng thử lại.',
      });
      return;
    }

    console.log('✅ Staff created successfully:', {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
      hasPasswordHash: !!newUser.password_hash,
    });

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
      message: 'Tạo nhân viên thành công',
    });
  } catch (error) {
    console.error('Create staff error:', error);
    res.status(500).json({
      success: false,
      error: 'Lỗi tạo nhân viên. Vui lòng thử lại.',
    });
  }
}

/**
 * Cập nhật thông tin nhân viên
 */
export async function updateStaff(req: Request<{ id: string }, ApiResponse<Omit<User, 'password' | 'passwordHash'>>, {
  name?: string;
  email?: string;
  phone?: string;
  password?: string;
  role?: 'worker' | 'manager' | 'admin';
  isActive?: boolean;
}>, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { name, email, phone, password, role, isActive } = req.body;

    // Build update object
    const updateData: any = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone || null;
    if (isActive !== undefined) updateData.is_active = isActive;
    if (password) {
      if (password.length < 6) {
        res.status(400).json({
          success: false,
          error: 'Mật khẩu phải có ít nhất 6 ký tự',
        });
        return;
      }
      updateData.password_hash = await hashPassword(password);
    }

    // Protect admin role: fetch current user to check their role
    if (role) {
      const { data: currentUser } = await supabase
        .from('users')
        .select('role')
        .eq('id', id)
        .single();

      // Only allow role change if current user is NOT admin
      if (currentUser?.role !== 'admin') {
        updateData.role = role;
      }
      // If current user IS admin, silently ignore the role change
    }

    updateData.updated_at = new Date().toISOString();

    // Check if email already exists (if email is being updated)
    if (email) {
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .neq('id', id)
        .single();

      if (existingUser) {
        res.status(409).json({
          success: false,
          error: 'Email đã được sử dụng bởi tài khoản khác',
        });
        return;
      }
    }

    // Update user
    const { data: updatedUser, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Update staff error:', error);
      res.status(500).json({
        success: false,
        error: 'Lỗi cập nhật nhân viên. Vui lòng thử lại.',
      });
      return;
    }

    if (!updatedUser) {
      res.status(404).json({
        success: false,
        error: 'Không tìm thấy nhân viên',
      });
      return;
    }

    res.json({
      success: true,
      data: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone || undefined,
        role: updatedUser.role,
        avatar: updatedUser.avatar || undefined,
        createdAt: new Date(updatedUser.created_at),
        updatedAt: new Date(updatedUser.updated_at),
      },
      message: 'Cập nhật nhân viên thành công',
    });
  } catch (error) {
    console.error('Update staff error:', error);
    res.status(500).json({
      success: false,
      error: 'Lỗi cập nhật nhân viên. Vui lòng thử lại.',
    });
  }
}

/**
 * Xóa nhân viên
 */
export async function deleteStaff(req: Request<{ id: string }>, res: Response<ApiResponse>): Promise<void> {
  try {
    const { id } = req.params;

    // Kiểm tra nhân viên tồn tại
    const { data: staffData, error: staffError } = await supabase
      .from('users')
      .select('id, role')
      .eq('id', id)
      .single();

    if (staffError || !staffData) {
      res.status(404).json({
        success: false,
        error: 'Không tìm thấy nhân viên',
      });
      return;
    }

    // Không cho phép xóa admin
    if (staffData.role === 'admin') {
      res.status(403).json({
        success: false,
        error: 'Không thể xóa tài khoản admin',
      });
      return;
    }

    // Kiểm tra nhân viên có đang có ca active không
    const { data: activeShifts } = await supabase
      .from('shifts')
      .select('id')
      .eq('staff_id', id)
      .eq('status', 'active')
      .limit(1);

    if (activeShifts && activeShifts.length > 0) {
      res.status(409).json({
        success: false,
        error: 'Không thể xóa nhân viên đang có ca làm việc active',
      });
      return;
    }

    // Lưu ý: Với constraint ON DELETE SET NULL trên orders.staff_id,
    // khi xóa nhân viên, các hóa đơn của nhân viên đó sẽ có staff_id = NULL
    // nhưng hóa đơn vẫn được giữ lại (không bị xóa)
    // Các ca làm việc (shifts) sẽ tự động xóa do CASCADE

    // Xóa nhân viên
    // Database sẽ tự động set staff_id = NULL cho các đơn hàng liên quan
    const { error } = await supabase.from('users').delete().eq('id', id);

    if (error) {
      console.error('Delete staff error:', error);
      res.status(500).json({
        success: false,
        error: 'Lỗi xóa nhân viên. Vui lòng thử lại.',
      });
      return;
    }

    res.json({
      success: true,
      message: 'Xóa nhân viên thành công',
    });
  } catch (error: any) {
    console.error('Delete staff error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Lỗi xóa nhân viên. Vui lòng thử lại.',
    });
  }
}
