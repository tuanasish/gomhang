import { Request, Response } from 'express';
import { ApiResponse, Customer } from '../types/index.js';
import { supabase } from '../config/supabase.js';

/**
 * Lấy danh sách khách hàng
 */
export async function getCustomersList(req: Request, res: Response<ApiResponse<Customer[]>>): Promise<void> {
  try {
    const { search, phone } = req.query;

    let query = supabase
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false });

    // If search parameter is provided, search in both name and phone
    if (search && typeof search === 'string') {
      const searchTerm = search.trim();
      query = query.or(`name.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`);
    } else if (phone && typeof phone === 'string') {
      const phoneTerm = phone.trim();
      query = query.or(`name.ilike.%${phoneTerm}%,phone.ilike.%${phoneTerm}%`);
    }

    const { data: customers, error } = await query;

    if (error) {
      console.error('Get customers list error:', error);
      res.status(500).json({
        success: false,
        error: 'Lỗi lấy danh sách khách hàng',
      });
      return;
    }

    res.json({
      success: true,
      data: customers.map((customer: any) => ({
        id: customer.id,
        name: customer.name,
        phone: customer.phone || undefined,
        address: customer.address || undefined,
        defaultTienCongGom: customer.default_tien_cong_gom ? Number(customer.default_tien_cong_gom) : undefined,
        createdAt: new Date(customer.created_at),
        updatedAt: new Date(customer.updated_at),
      })),
    });
  } catch (error: any) {
    console.error('Get customers list error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Lỗi lấy danh sách khách hàng',
    });
  }
}

/**
 * Lấy chi tiết khách hàng
 */
export async function getCustomerById(req: Request<{ id: string }>, res: Response<ApiResponse<Customer>>): Promise<void> {
  try {
    const { id } = req.params;

    const { data: customer, error } = await supabase
      .from('customers')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !customer) {
      res.status(404).json({
        success: false,
        error: 'Không tìm thấy khách hàng',
      });
      return;
    }

    res.json({
      success: true,
      data: {
        id: customer.id,
        name: customer.name,
        phone: customer.phone || undefined,
        address: customer.address || undefined,
        defaultTienCongGom: customer.default_tien_cong_gom ? Number(customer.default_tien_cong_gom) : undefined,
        createdAt: new Date(customer.created_at),
        updatedAt: new Date(customer.updated_at),
      },
    });
  } catch (error: any) {
    console.error('Get customer by id error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Lỗi lấy thông tin khách hàng',
    });
  }
}

/**
 * Tạo khách hàng mới
 */
export async function createCustomer(
  req: Request<{}, ApiResponse<Customer>, { name: string; phone?: string; address?: string; defaultTienCongGom?: number }>,
  res: Response
): Promise<void> {
  try {
    const { name, phone, address, defaultTienCongGom } = req.body;

    // Validation cơ bản
    if (!name || !name.trim()) {
      res.status(400).json({
        success: false,
        error: 'Tên khách hàng là bắt buộc',
      });
      return;
    }

    const { data: newCustomer, error } = await supabase
      .from('customers')
      .insert({
        name: name.trim(),
        phone: phone?.trim() || null,
        address: address?.trim() || null,
        default_tien_cong_gom: defaultTienCongGom !== undefined ? defaultTienCongGom : null,
      })
      .select()
      .single();

    if (error) {
      console.error('Create customer error:', error);
      res.status(500).json({
        success: false,
        error: 'Lỗi tạo khách hàng. Vui lòng thử lại.',
      });
      return;
    }

    res.status(201).json({
      success: true,
      data: {
        id: newCustomer.id,
        name: newCustomer.name,
        phone: newCustomer.phone || undefined,
        address: newCustomer.address || undefined,
        defaultTienCongGom: newCustomer.default_tien_cong_gom ? Number(newCustomer.default_tien_cong_gom) : undefined,
        createdAt: new Date(newCustomer.created_at),
        updatedAt: new Date(newCustomer.updated_at),
      },
      message: 'Tạo khách hàng thành công',
    });
  } catch (error: any) {
    console.error('Create customer error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Lỗi tạo khách hàng. Vui lòng thử lại.',
    });
  }
}

/**
 * Cập nhật khách hàng
 */
export async function updateCustomer(
  req: Request<{ id: string }, ApiResponse<Customer>, { name?: string; phone?: string; address?: string; defaultTienCongGom?: number }>,
  res: Response
): Promise<void> {
  try {
    const { id } = req.params;
    const { name, phone, address, defaultTienCongGom } = req.body;

    const updateData: any = {};
    if (name !== undefined) {
      if (!name.trim()) {
        res.status(400).json({
          success: false,
          error: 'Tên khách hàng không được để trống',
        });
        return;
      }
      updateData.name = name.trim();
    }
    if (phone !== undefined) updateData.phone = phone?.trim() || null;
    if (address !== undefined) updateData.address = address?.trim() || null;
    if (defaultTienCongGom !== undefined) updateData.default_tien_cong_gom = defaultTienCongGom !== null && defaultTienCongGom !== undefined ? defaultTienCongGom : null;

    const { data: updatedCustomer, error } = await supabase
      .from('customers')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error || !updatedCustomer) {
      res.status(404).json({
        success: false,
        error: 'Không tìm thấy khách hàng',
      });
      return;
    }

    res.json({
      success: true,
      data: {
        id: updatedCustomer.id,
        name: updatedCustomer.name,
        phone: updatedCustomer.phone || undefined,
        address: updatedCustomer.address || undefined,
        defaultTienCongGom: updatedCustomer.default_tien_cong_gom ? Number(updatedCustomer.default_tien_cong_gom) : undefined,
        createdAt: new Date(updatedCustomer.created_at),
        updatedAt: new Date(updatedCustomer.updated_at),
      },
      message: 'Cập nhật khách hàng thành công',
    });
  } catch (error: any) {
    console.error('Update customer error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Lỗi cập nhật khách hàng. Vui lòng thử lại.',
    });
  }
}

/**
 * Xóa khách hàng (kèm xóa tất cả đơn hàng liên quan)
 */
export async function deleteCustomer(req: Request<{ id: string }>, res: Response<ApiResponse>): Promise<void> {
  try {
    const { id } = req.params;

    // Xóa tất cả đơn hàng của khách hàng trước
    const { error: deleteOrdersError } = await supabase
      .from('orders')
      .delete()
      .eq('customer_id', id);

    if (deleteOrdersError) {
      console.error('Delete customer orders error:', deleteOrdersError);
      res.status(500).json({
        success: false,
        error: 'Lỗi xóa đơn hàng của khách hàng. Vui lòng thử lại.',
      });
      return;
    }

    // Xóa khách hàng
    const { error } = await supabase.from('customers').delete().eq('id', id);

    if (error) {
      console.error('Delete customer error:', error);
      res.status(500).json({
        success: false,
        error: 'Lỗi xóa khách hàng. Vui lòng thử lại.',
      });
      return;
    }

    res.json({
      success: true,
      message: 'Xóa khách hàng và các đơn hàng liên quan thành công',
    });
  } catch (error: any) {
    console.error('Delete customer error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Lỗi xóa khách hàng. Vui lòng thử lại.',
    });
  }
}
