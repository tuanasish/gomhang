import { Request, Response } from 'express';
import { ApiResponse, Counter } from '../types/index.js';
import { supabase } from '../config/supabase.js';

/**
 * Lấy danh sách quầy
 */
export async function getCountersList(req: Request, res: Response<ApiResponse<Counter[]>>): Promise<void> {
  try {
    const { activeOnly } = req.query;
    
    let query = supabase
      .from('counters')
      .select('*')
      .order('created_at', { ascending: false });

    // Filter active only nếu có
    if (activeOnly === 'true') {
      query = query.eq('is_active', true);
    }

    const { data: counters, error } = await query;

    if (error) {
      console.error('Get counters list error:', error);
      res.status(500).json({
        success: false,
        error: 'Lỗi lấy danh sách quầy',
      });
      return;
    }

    res.json({
      success: true,
      data: counters.map((counter: any) => ({
        id: counter.id,
        name: counter.name,
        address: counter.address || undefined,
        isActive: counter.is_active,
        createdAt: new Date(counter.created_at),
        updatedAt: new Date(counter.updated_at),
      })),
    });
  } catch (error: any) {
    console.error('Get counters list error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Lỗi lấy danh sách quầy',
    });
  }
}

/**
 * Lấy chi tiết quầy
 */
export async function getCounterById(req: Request<{ id: string }>, res: Response<ApiResponse<Counter>>): Promise<void> {
  try {
    const { id } = req.params;

    const { data: counter, error } = await supabase
      .from('counters')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !counter) {
      res.status(404).json({
        success: false,
        error: 'Không tìm thấy quầy',
      });
      return;
    }

    res.json({
      success: true,
      data: {
        id: counter.id,
        name: counter.name,
        address: counter.address || undefined,
        isActive: counter.is_active,
        createdAt: new Date(counter.created_at),
        updatedAt: new Date(counter.updated_at),
      },
    });
  } catch (error: any) {
    console.error('Get counter by id error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Lỗi lấy thông tin quầy',
    });
  }
}

/**
 * Tạo quầy mới
 */
export async function createCounter(
  req: Request<{}, ApiResponse<Counter>, { name: string; address?: string }>,
  res: Response
): Promise<void> {
  try {
    const { name, address } = req.body;

    // Validation cơ bản
    if (!name || !name.trim()) {
      res.status(400).json({
        success: false,
        error: 'Tên quầy là bắt buộc',
      });
      return;
    }

    const { data: newCounter, error } = await supabase
      .from('counters')
      .insert({
        name: name.trim(),
        address: address?.trim() || null,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.error('Create counter error:', error);
      res.status(500).json({
        success: false,
        error: 'Lỗi tạo quầy. Vui lòng thử lại.',
      });
      return;
    }

    res.status(201).json({
      success: true,
      data: {
        id: newCounter.id,
        name: newCounter.name,
        address: newCounter.address || undefined,
        isActive: newCounter.is_active,
        createdAt: new Date(newCounter.created_at),
        updatedAt: new Date(newCounter.updated_at),
      },
      message: 'Tạo quầy thành công',
    });
  } catch (error: any) {
    console.error('Create counter error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Lỗi tạo quầy. Vui lòng thử lại.',
    });
  }
}

/**
 * Cập nhật quầy
 */
export async function updateCounter(
  req: Request<{ id: string }, ApiResponse<Counter>, { name?: string; address?: string; isActive?: boolean }>,
  res: Response
): Promise<void> {
  try {
    const { id } = req.params;
    const { name, address, isActive } = req.body;

    const updateData: any = {};
    if (name !== undefined) {
      if (!name.trim()) {
        res.status(400).json({
          success: false,
          error: 'Tên quầy không được để trống',
        });
        return;
      }
      updateData.name = name.trim();
    }
    if (address !== undefined) updateData.address = address?.trim() || null;
    if (isActive !== undefined) updateData.is_active = isActive;

    const { data: updatedCounter, error } = await supabase
      .from('counters')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error || !updatedCounter) {
      res.status(404).json({
        success: false,
        error: 'Không tìm thấy quầy',
      });
      return;
    }

    res.json({
      success: true,
      data: {
        id: updatedCounter.id,
        name: updatedCounter.name,
        address: updatedCounter.address || undefined,
        isActive: updatedCounter.is_active,
        createdAt: new Date(updatedCounter.created_at),
        updatedAt: new Date(updatedCounter.updated_at),
      },
      message: 'Cập nhật quầy thành công',
    });
  } catch (error: any) {
    console.error('Update counter error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Lỗi cập nhật quầy. Vui lòng thử lại.',
    });
  }
}

/**
 * Xóa/Deactivate quầy
 */
export async function deleteCounter(req: Request<{ id: string }>, res: Response<ApiResponse>): Promise<void> {
  try {
    const { id } = req.params;

    // Kiểm tra quầy có đang được sử dụng trong shift active không
    const { data: activeShifts, error: checkError } = await supabase
      .from('shifts')
      .select('id')
      .eq('counter_id', id)
      .eq('status', 'active')
      .limit(1);

    if (checkError) {
      console.error('Check counter usage error:', checkError);
    }

    if (activeShifts && activeShifts.length > 0) {
      res.status(409).json({
        success: false,
        error: 'Không thể xóa quầy đang có ca làm việc active',
      });
      return;
    }

    // Thay vì xóa, deactivate quầy
    const { error } = await supabase
      .from('counters')
      .update({ is_active: false })
      .eq('id', id);

    if (error) {
      console.error('Delete counter error:', error);
      res.status(500).json({
        success: false,
        error: 'Lỗi xóa quầy. Vui lòng thử lại.',
      });
      return;
    }

    res.json({
      success: true,
      message: 'Xóa quầy thành công',
    });
  } catch (error: any) {
    console.error('Delete counter error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Lỗi xóa quầy. Vui lòng thử lại.',
    });
  }
}
