import { Request, Response } from 'express';
import { ApiResponse, Order } from '../types/index.js';
import { supabase } from '../config/supabase.js';

const parseMoney = (val: any) => {
  if (val === null || val === undefined || val === '') return 0;
  const parsed = parseFloat(val);
  return isNaN(parsed) ? 0 : parsed;
};

/**
 * Lấy danh sách đơn hàng
 */
export async function getOrdersList(req: Request, res: Response<ApiResponse<Order[]>>): Promise<void> {
  try {
    const { shiftId, customerId, date, startDate, endDate, status } = req.query;
    const userId = (req as any).user?.userId;
    const userRole = (req as any).user?.role;

    let query = supabase
      .from('orders')
      .select(`
        *,
        customer:customers!orders_customer_id_fkey(id, name),
        counter:counters!orders_counter_id_fkey(id, name),
        staff:users!orders_staff_id_fkey(id, name)
      `)
      .order('created_at', { ascending: false });

    // Worker chỉ xem đơn của mình
    if (userRole === 'worker' && userId) {
      query = query.eq('staff_id', userId);
    }

    if (shiftId && typeof shiftId === 'string') {
      query = query.eq('shift_id', shiftId);
    }

    if (customerId && typeof customerId === 'string') {
      query = query.eq('customer_id', customerId);
    }

    if (date && typeof date === 'string') {
      // Filter by single date using Vietnam timezone (UTC+7)
      const start = `${date}T00:00:00+07:00`;
      const end = `${date}T23:59:59+07:00`;
      query = query.gte('created_at', start).lte('created_at', end);
    } else if (startDate && typeof startDate === 'string') {
      // Filter by date range
      query = query.gte('created_at', `${startDate}T00:00:00+07:00`);
      if (endDate && typeof endDate === 'string') {
        query = query.lte('created_at', `${endDate}T23:59:59+07:00`);
      }
    }

    if (status && typeof status === 'string') {
      query = query.eq('status', status);
    } else {
      // Mặc định loại bỏ đơn đã hủy khỏi danh sách
      query = query.neq('status', 'cancelled');
    }

    const { data: orders, error } = await query;

    if (error) {
      console.error('Get orders list error:', error);
      res.status(500).json({
        success: false,
        error: 'Lỗi lấy danh sách đơn hàng',
      });
      return;
    }

    res.json({
      success: true,
      data: orders.map((order: any) => ({
        id: order.id,
        shiftId: order.shift_id,
        customerId: order.customer_id,
        customerName: order.customer?.name,
        counterId: order.counter_id,
        counterName: order.counter?.name,
        staffId: order.staff_id || undefined, // Convert null to undefined
        staffName: order.staff?.name,
        tienHang: parseMoney(order.tien_hang),
        tienCongGom: parseMoney(order.tien_cong_gom),
        phiDongHang: parseMoney(order.phi_dong_hang),
        tienHoaHong: parseMoney(order.tien_hoa_hong),
        tienThem: order.tien_them ? parseMoney(order.tien_them) : undefined,
        loaiTienThem: order.loai_tien_them || undefined,
        tongTienHoaDon: parseMoney(order.tong_tien_hoa_don),
        status: order.status,
        createdAt: new Date(order.created_at),
        updatedAt: new Date(order.updated_at),
      })),
    });
  } catch (error: any) {
    console.error('Get orders list error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Lỗi lấy danh sách đơn hàng',
    });
  }
}

/**
 * Lấy chi tiết đơn hàng
 */
export async function getOrderById(req: Request<{ id: string }>, res: Response<ApiResponse<Order>>): Promise<void> {
  try {
    const { id } = req.params;

    const { data: order, error } = await supabase
      .from('orders')
      .select(`
        *,
        customer:customers!orders_customer_id_fkey(id, name),
        counter:counters!orders_counter_id_fkey(id, name),
        staff:users!orders_staff_id_fkey(id, name)
      `)
      .eq('id', id)
      .single();

    if (error || !order) {
      res.status(404).json({
        success: false,
        error: 'Không tìm thấy đơn hàng',
      });
      return;
    }

    res.json({
      success: true,
      data: {
        id: order.id,
        shiftId: order.shift_id,
        customerId: order.customer_id,
        customerName: order.customer?.name,
        counterId: order.counter_id,
        counterName: order.counter?.name,
        staffId: order.staff_id || undefined, // Convert null to undefined
        staffName: order.staff?.name,
        tienHang: parseMoney(order.tien_hang),
        tienCongGom: parseMoney(order.tien_cong_gom),
        phiDongHang: parseMoney(order.phi_dong_hang),
        tienHoaHong: parseMoney(order.tien_hoa_hong),
        tienThem: order.tien_them ? parseMoney(order.tien_them) : undefined,
        loaiTienThem: order.loai_tien_them || undefined,
        tongTienHoaDon: parseMoney(order.tong_tien_hoa_don),
        status: order.status,
        createdAt: new Date(order.created_at),
        updatedAt: new Date(order.updated_at),
      },
    });
  } catch (error: any) {
    console.error('Get order by id error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Lỗi lấy thông tin đơn hàng',
    });
  }
}

/**
 * Lấy tất cả đơn hàng trong một ca
 */
export async function getOrdersByShift(req: Request<{ shiftId: string }>, res: Response<ApiResponse<Order[]>>): Promise<void> {
  try {
    const { shiftId } = req.params;

    const { data: orders, error } = await supabase
      .from('orders')
      .select(`
        *,
        customer:customers!orders_customer_id_fkey(id, name),
        counter:counters!orders_counter_id_fkey(id, name),
        staff:users!orders_staff_id_fkey(id, name)
      `)
      .eq('shift_id', shiftId)
      .neq('status', 'cancelled')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Get orders by shift error:', error);
      res.status(500).json({
        success: false,
        error: 'Lỗi lấy danh sách đơn hàng',
      });
      return;
    }

    res.json({
      success: true,
      data: orders.map((order: any) => ({
        id: order.id,
        shiftId: order.shift_id,
        customerId: order.customer_id,
        customerName: order.customer?.name,
        counterId: order.counter_id,
        counterName: order.counter?.name,
        staffId: order.staff_id || undefined, // Convert null to undefined
        staffName: order.staff?.name,
        tienHang: parseMoney(order.tien_hang),
        tienCongGom: parseMoney(order.tien_cong_gom),
        phiDongHang: parseMoney(order.phi_dong_hang),
        tienHoaHong: parseMoney(order.tien_hoa_hong),
        tienThem: order.tien_them ? parseMoney(order.tien_them) : undefined,
        loaiTienThem: order.loai_tien_them || undefined,
        tongTienHoaDon: parseMoney(order.tong_tien_hoa_don),
        status: order.status,
        createdAt: new Date(order.created_at),
        updatedAt: new Date(order.updated_at),
      })),
    });
  } catch (error: any) {
    console.error('Get orders by shift error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Lỗi lấy danh sách đơn hàng',
    });
  }
}

/**
 * Tạo đơn hàng mới (với logic tự động tạo customer/counter nếu cần)
 */
export async function createOrder(
  req: Request<
    {},
    ApiResponse<Order>,
    {
      shiftId: string;
      customerId?: string;
      customerName?: string;
      customerPhone?: string;
      counterId?: string;
      counterName?: string;
      tienHang: number;
      tienCongGom: number;
      phiDongHang: number;
      tienHoaHong?: number;
      tienThem?: number;
      loaiTienThem?: string;
    }
  >,
  res: Response
): Promise<void> {
  try {
    const {
      shiftId, customerId, customerName, customerPhone, counterId, counterName,
      tienHang: rawTienHang,
      tienCongGom: rawTienCongGom = 0,
      phiDongHang: rawPhiDongHang = 0,
      tienHoaHong: rawTienHoaHong = 0,
      tienThem: rawTienThem = 0,
      loaiTienThem
    } = req.body;

    const tienHang = parseMoney(rawTienHang);
    const tienCongGom = parseMoney(rawTienCongGom);
    const phiDongHang = parseMoney(rawPhiDongHang);
    const tienHoaHong = parseMoney(rawTienHoaHong);
    const tienThem = parseMoney(rawTienThem);
    const userId = (req as any).user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'Chưa đăng nhập',
      });
      return;
    }

    // Validation cơ bản
    if (!shiftId || tienHang === undefined || tienHang === null || tienHang < 0) {
      res.status(400).json({
        success: false,
        error: 'Thông tin không hợp lệ',
      });
      return;
    }

    // Kiểm tra shift tồn tại và active
    const { data: shift, error: shiftError } = await supabase
      .from('shifts')
      .select('*')
      .eq('id', shiftId)
      .single();

    if (shiftError || !shift) {
      res.status(404).json({
        success: false,
        error: 'Không tìm thấy ca làm việc',
      });
      return;
    }

    if (shift.status !== 'active') {
      res.status(400).json({
        success: false,
        error: 'Ca làm việc không còn active, không thể tạo đơn',
      });
      return;
    }

    // Kiểm tra worker có quyền tạo đơn trong ca này không
    if (shift.staff_id !== userId) {
      res.status(403).json({
        success: false,
        error: 'Bạn không có quyền tạo đơn trong ca này',
      });
      return;
    }

    let finalCustomerId = customerId;
    let finalCounterId = counterId;

    // Tạo customer mới nếu chưa có customerId
    if (!finalCustomerId) {
      if (!customerName || !customerName.trim()) {
        res.status(400).json({
          success: false,
          error: 'Tên khách hàng là bắt buộc',
        });
        return;
      }

      const { data: newCustomer, error: customerError } = await supabase
        .from('customers')
        .insert({
          name: customerName.trim(),
          phone: customerPhone?.trim() || null,
        })
        .select()
        .single();

      if (customerError || !newCustomer) {
        console.error('Create customer error:', customerError);
        res.status(500).json({
          success: false,
          error: 'Lỗi tạo khách hàng. Vui lòng thử lại.',
        });
        return;
      }

      finalCustomerId = newCustomer.id;
    }

    // Tạo counter mới nếu chưa có counterId
    if (!finalCounterId) {
      if (!counterName || !counterName.trim()) {
        res.status(400).json({
          success: false,
          error: 'Tên quầy là bắt buộc',
        });
        return;
      }

      const { data: newCounter, error: counterError } = await supabase
        .from('counters')
        .insert({
          name: counterName.trim(),
          is_active: true,
        })
        .select()
        .single();

      if (counterError || !newCounter) {
        console.error('Create counter error:', counterError);
        res.status(500).json({
          success: false,
          error: 'Lỗi tạo quầy. Vui lòng thử lại.',
        });
        return;
      }

      finalCounterId = newCounter.id;
    }

    // Tính tổng tiền hóa đơn - bao gồm cả tiền hoa hồng và thuế (khách hàng phải trả tổng này)
    const tongTienHoaDon = tienHang + tienCongGom + phiDongHang + (tienHoaHong || 0) + (tienThem || 0);

    // Xoá logic chặn âm quỹ để cho phép nhân viên tiếp tục tạo đơn trả hàng dù quỹ âm

    // Tạo đơn hàng và cập nhật shift trong transaction (Supabase không hỗ trợ transaction trực tiếp, nên làm tuần tự)
    // Bước 1: Tạo đơn hàng
    const { data: newOrder, error: orderError } = await supabase
      .from('orders')
      .insert({
        shift_id: shiftId,
        customer_id: finalCustomerId,
        counter_id: finalCounterId,
        staff_id: userId,
        tien_hang: tienHang,
        tien_cong_gom: tienCongGom || 0,
        phi_dong_hang: phiDongHang || 0,
        tien_hoa_hong: tienHoaHong || 0,
        tien_them: tienThem || 0,
        loai_tien_them: loaiTienThem || null,
        tong_tien_hoa_don: tongTienHoaDon,
        status: 'completed',
      })
      .select(`
        *,
        customer:customers!orders_customer_id_fkey(id, name),
        counter:counters!orders_counter_id_fkey(id, name),
        staff:users!orders_staff_id_fkey(id, name)
      `)
      .single();

    if (orderError || !newOrder) {
      console.error('Create order error:', orderError);
      res.status(500).json({
        success: false,
        error: 'Lỗi tạo đơn hàng. Vui lòng thử lại.',
      });
      return;
    }

    // Bước 2: Cập nhật shift
    const tongTienHangDaTraMoi = parseMoney(shift.tong_tien_hang_da_tra) + tienHang;
    const quyConLaiMoi = parseMoney(shift.tien_giao_ca) - tongTienHangDaTraMoi;

    const { error: shiftUpdateError } = await supabase
      .from('shifts')
      .update({
        tong_tien_hang_da_tra: tongTienHangDaTraMoi,
        quy_con_lai: quyConLaiMoi,
      })
      .eq('id', shiftId);

    if (shiftUpdateError) {
      console.error('Update shift error:', shiftUpdateError);
      // Rollback: Xóa đơn hàng vừa tạo
      await supabase.from('orders').delete().eq('id', newOrder.id);
      res.status(500).json({
        success: false,
        error: 'Lỗi cập nhật ca làm việc. Đơn hàng đã được hủy.',
      });
      return;
    }

    res.status(201).json({
      success: true,
      data: {
        id: newOrder.id,
        shiftId: newOrder.shift_id,
        customerId: newOrder.customer_id,
        customerName: newOrder.customer?.name,
        counterId: newOrder.counter_id,
        counterName: newOrder.counter?.name,
        staffId: newOrder.staff_id,
        staffName: newOrder.staff?.name,
        tienHang: parseFloat(newOrder.tien_hang),
        tienCongGom: parseFloat(newOrder.tien_cong_gom),
        phiDongHang: parseFloat(newOrder.phi_dong_hang),
        tienHoaHong: parseFloat(newOrder.tien_hoa_hong || 0),
        tienThem: newOrder.tien_them ? parseFloat(newOrder.tien_them) : undefined,
        loaiTienThem: newOrder.loai_tien_them || undefined,
        tongTienHoaDon: parseFloat(newOrder.tong_tien_hoa_don),
        status: newOrder.status,
        createdAt: new Date(newOrder.created_at),
        updatedAt: new Date(newOrder.updated_at),
      },
      message: 'Tạo đơn hàng thành công',
    });
  } catch (error: any) {
    console.error('Create order error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Lỗi tạo đơn hàng. Vui lòng thử lại.',
    });
  }
}

/**
 * Cập nhật đơn hàng
 */
export async function updateOrder(
  req: Request<
    { id: string },
    ApiResponse<Order>,
    {
      status?: 'pending' | 'completed' | 'cancelled';
      tienHang?: number;
      tienCongGom?: number;
      phiDongHang?: number;
      tienHoaHong?: number;
      tienThem?: number;
      loaiTienThem?: string;
      customerName?: string;
      counterName?: string;
    }
  >,
  res: Response
): Promise<void> {
  try {
    const { id } = req.params;
    const {
      status,
      tienHang: rawTienHang,
      tienCongGom: rawTienCongGom,
      phiDongHang: rawPhiDongHang,
      tienHoaHong: rawTienHoaHong,
      tienThem: rawTienThem,
      loaiTienThem,
      customerName,
      counterName
    } = req.body;

    const tienHang = rawTienHang !== undefined ? parseMoney(rawTienHang) : undefined;
    const tienCongGom = rawTienCongGom !== undefined ? parseMoney(rawTienCongGom) : undefined;
    const phiDongHang = rawPhiDongHang !== undefined ? parseMoney(rawPhiDongHang) : undefined;
    const tienHoaHong = rawTienHoaHong !== undefined ? parseMoney(rawTienHoaHong) : undefined;
    const tienThem = rawTienThem !== undefined ? parseMoney(rawTienThem) : undefined;
    const userRole = (req as any).user?.role;
    const userId = (req as any).user?.userId;

    // Lấy đơn hàng hiện tại
    const { data: existingOrder, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .single();

    if (orderError || !existingOrder) {
      res.status(404).json({
        success: false,
        error: 'Không tìm thấy đơn hàng',
      });
      return;
    }

    // Chỉ admin hoặc chính nhân viên tạo đơn mới có quyền sửa các trường quan trọng
    const isEditingImportantFields = tienHang !== undefined || tienCongGom !== undefined ||
      phiDongHang !== undefined || tienHoaHong !== undefined ||
      tienThem !== undefined || loaiTienThem !== undefined ||
      customerName !== undefined || counterName !== undefined;

    if (isEditingImportantFields) {
      const isAdmin = userRole === 'admin';
      const isOwnerWorker = userRole === 'worker' && userId && existingOrder.staff_id === userId;

      if (!isAdmin && !isOwnerWorker) {
        res.status(403).json({
          success: false,
          error: 'Bạn không có quyền sửa các trường quan trọng trong hóa đơn này',
        });
        return;
      }
    }

    const updateData: any = {};
    if (status) updateData.status = status;
    if (tienHang !== undefined) updateData.tien_hang = tienHang;
    if (tienCongGom !== undefined) updateData.tien_cong_gom = tienCongGom;
    if (phiDongHang !== undefined) updateData.phi_dong_hang = phiDongHang;
    if (tienHoaHong !== undefined) updateData.tien_hoa_hong = tienHoaHong;
    if (tienThem !== undefined) updateData.tien_them = tienThem;
    if (loaiTienThem !== undefined) updateData.loai_tien_them = loaiTienThem || null;

    if (customerName && typeof customerName === 'string' && customerName.trim()) {
      const nameTrimmed = customerName.trim();
      const { data: existCust } = await supabase.from('customers').select('id').eq('name', nameTrimmed).single();
      if (existCust) {
        updateData.customer_id = existCust.id;
      } else {
        const { data: newCust } = await supabase.from('customers').insert({ name: nameTrimmed }).select('id').single();
        if (newCust) updateData.customer_id = newCust.id;
      }
    }

    if (counterName && typeof counterName === 'string' && counterName.trim()) {
      const nameTrimmed = counterName.trim();
      const { data: existCount } = await supabase.from('counters').select('id').eq('name', nameTrimmed).single();
      if (existCount) {
        updateData.counter_id = existCount.id;
      } else {
        const { data: newCount } = await supabase.from('counters').insert({ name: nameTrimmed, is_active: true }).select('id').single();
        if (newCount) updateData.counter_id = newCount.id;
      }
    }

    // Tính lại tong_tien_hoa_don nếu có thay đổi
    const finalTienHang = tienHang !== undefined ? tienHang : parseMoney(existingOrder.tien_hang);
    const finalTienCongGom = tienCongGom !== undefined ? tienCongGom : parseMoney(existingOrder.tien_cong_gom);
    const finalPhiDongHang = phiDongHang !== undefined ? phiDongHang : parseMoney(existingOrder.phi_dong_hang);
    const finalTienHoaHong = tienHoaHong !== undefined ? tienHoaHong : parseMoney(existingOrder.tien_hoa_hong);
    const finalTienThem = tienThem !== undefined ? tienThem : parseMoney(existingOrder.tien_them);

    updateData.tong_tien_hoa_don = finalTienHang + finalTienCongGom + finalPhiDongHang + finalTienHoaHong + finalTienThem;

    const { data: updatedOrder, error } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        customer:customers!orders_customer_id_fkey(id, name),
        counter:counters!orders_counter_id_fkey(id, name),
        staff:users!orders_staff_id_fkey(id, name)
      `)
      .single();

    if (error) {
      console.error('Update order error:', error);
      res.status(500).json({
        success: false,
        error: 'Lỗi cập nhật đơn hàng. Vui lòng thử lại.',
      });
      return;
    }

    // --- Cập nhật lại shift nếu có thay đổi về tiền hàng hoặc trạng thái ---
    let oldContribution = 0;
    if (existingOrder.status !== 'cancelled') {
      oldContribution = parseMoney(existingOrder.tien_hang);
    }

    let newContribution = 0;
    const finalStatus = status || existingOrder.status;
    if (finalStatus !== 'cancelled') {
      newContribution = finalTienHang;
    }

    const difference = newContribution - oldContribution;

    if (difference !== 0) {
      const { data: shift } = await supabase
        .from('shifts')
        .select('*')
        .eq('id', existingOrder.shift_id)
        .single();

      if (shift) {
        const tongTienHangDaTraMoi = parseMoney(shift.tong_tien_hang_da_tra) + difference;
        const quyConLaiMoi = parseMoney(shift.tien_giao_ca) - tongTienHangDaTraMoi;

        await supabase
          .from('shifts')
          .update({
            tong_tien_hang_da_tra: tongTienHangDaTraMoi,
            quy_con_lai: quyConLaiMoi,
          })
          .eq('id', existingOrder.shift_id);
      }
    }
    // -----------------------------------------------------------------------

    res.json({
      success: true,
      data: {
        id: updatedOrder.id,
        shiftId: updatedOrder.shift_id,
        customerId: updatedOrder.customer_id,
        customerName: updatedOrder.customer?.name,
        counterId: updatedOrder.counter_id,
        counterName: updatedOrder.counter?.name,
        staffId: updatedOrder.staff_id,
        staffName: updatedOrder.staff?.name,
        tienHang: parseMoney(updatedOrder.tien_hang),
        tienCongGom: parseMoney(updatedOrder.tien_cong_gom),
        phiDongHang: parseMoney(updatedOrder.phi_dong_hang),
        tienHoaHong: parseMoney(updatedOrder.tien_hoa_hong),
        tienThem: updatedOrder.tien_them ? parseMoney(updatedOrder.tien_them) : undefined,
        loaiTienThem: updatedOrder.loai_tien_them || undefined,
        tongTienHoaDon: parseMoney(updatedOrder.tong_tien_hoa_don),
        status: updatedOrder.status,
        createdAt: new Date(updatedOrder.created_at),
        updatedAt: new Date(updatedOrder.updated_at),
      },
      message: 'Cập nhật đơn hàng thành công',
    });
  } catch (error: any) {
    console.error('Update order error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Lỗi cập nhật đơn hàng. Vui lòng thử lại.',
    });
  }
}

/**
 * Xóa đơn hàng (chỉ pending)
 */
export async function deleteOrder(req: Request<{ id: string }>, res: Response<ApiResponse>): Promise<void> {
  try {
    const { id } = req.params;

    // Lấy đơn hàng
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .single();

    if (orderError || !order) {
      res.status(404).json({
        success: false,
        error: 'Không tìm thấy đơn hàng',
      });
      return;
    }

    if (order.status === 'cancelled') {
      res.status(400).json({
        success: false,
        error: 'Đơn hàng đã bị hủy, không thể xóa.',
      });
      return;
    }

    // Xóa đơn hàng
    const { error } = await supabase.from('orders').delete().eq('id', id);

    if (error) {
      console.error('Delete order error:', error);
      res.status(500).json({
        success: false,
        error: 'Lỗi xóa đơn hàng. Vui lòng thử lại.',
      });
      return;
    }

    // Cập nhật lại shift (hoàn lại tiền)
    const tienHang = parseFloat(order.tien_hang);
    const { data: shift } = await supabase
      .from('shifts')
      .select('*')
      .eq('id', order.shift_id)
      .single();

    if (shift) {
      const tongTienHangDaTraMoi = parseFloat(shift.tong_tien_hang_da_tra || 0) - tienHang;
      const quyConLaiMoi = parseFloat(shift.tien_giao_ca) - tongTienHangDaTraMoi;

      await supabase
        .from('shifts')
        .update({
          tong_tien_hang_da_tra: tongTienHangDaTraMoi,
          quy_con_lai: quyConLaiMoi,
        })
        .eq('id', order.shift_id);
    }

    res.json({
      success: true,
      message: 'Xóa đơn hàng thành công',
    });
  } catch (error: any) {
    console.error('Delete order error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Lỗi xóa đơn hàng. Vui lòng thử lại.',
    });
  }
}
