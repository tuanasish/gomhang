import { Request, Response } from 'express';
import { ApiResponse, Shift, ShiftMoneyAddition } from '../types/index.js';
import { supabase } from '../config/supabase.js';

/**
 * Lấy ngày hiện tại theo múi giờ Việt Nam (GMT+7) định dạng YYYY-MM-DD
 */
function getVietnamDateStr(): string {
  const d = new Date();
  const utc = d.getTime() + (d.getTimezoneOffset() * 60000);
  const vnTime = new Date(utc + (3600000 * 7));
  const yyyy = vnTime.getFullYear();
  const mm = String(vnTime.getMonth() + 1).padStart(2, '0');
  const dd = String(vnTime.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Lấy danh sách ca làm việc
 */
export async function getShiftsList(req: Request, res: Response<ApiResponse<Shift[]>>): Promise<void> {
  try {
    // Auto-reset các ca đã hết hạn trước khi lấy danh sách
    await autoResetExpiredShifts();

    const { staffId, date, status } = req.query;

    let query = supabase
      .from('shifts')
      .select(`
        *,
        staff:users!shifts_staff_id_fkey(id, name),
        counter:counters!shifts_counter_id_fkey(id, name),
        orders:orders(id, status, tien_hoa_hong)
      `)
      .order('created_at', { ascending: false });

    if (staffId && typeof staffId === 'string') {
      query = query.eq('staff_id', staffId);
    }

    if (date && typeof date === 'string') {
      query = query.eq('date', date);
    }

    if (status && typeof status === 'string') {
      query = query.eq('status', status);
    }

    const { data: shifts, error } = await query;

    if (error) {
      console.error('Get shifts list error:', error);
      res.status(500).json({
        success: false,
        error: 'Lỗi lấy danh sách ca làm việc',
      });
      return;
    }

    res.json({
      success: true,
      data: shifts.map((shift: any) => {
        // Lọc orders không bị hủy
        const validOrders = shift.orders ? shift.orders.filter((o: any) => o.status !== 'cancelled') : [];
        const tongHoaHong = validOrders.reduce((sum: number, o: any) => sum + parseFloat(o.tien_hoa_hong || 0), 0);

        return {
          id: shift.id,
          staffId: shift.staff_id,
          staffName: shift.staff?.name,
          counterId: shift.counter_id || undefined,
          counterName: shift.counter?.name,
          date: shift.date,
          startTime: new Date(shift.start_time),
          endTime: shift.end_time ? new Date(shift.end_time) : undefined,
          tienGiaoCa: parseFloat(shift.tien_giao_ca),
          tongTienHangDaTra: parseFloat(shift.tong_tien_hang_da_tra || 0),
          quyConLai: parseFloat(shift.quy_con_lai || 0),
          status: shift.status,
          soDonHang: validOrders.length,
          tongHoaHong,
          createdAt: new Date(shift.created_at),
          updatedAt: new Date(shift.updated_at),
        };
      }),
    });
  } catch (error: any) {
    console.error('Get shifts list error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Lỗi lấy danh sách ca làm việc',
    });
  }
}

/**
 * Lấy chi tiết ca làm việc
 */
export async function getShiftById(req: Request<{ id: string }>, res: Response<ApiResponse<Shift>>): Promise<void> {
  try {
    const { id } = req.params;

    const { data: shift, error } = await supabase
      .from('shifts')
      .select(`
        *,
        staff:users!shifts_staff_id_fkey(id, name),
        counter:counters!shifts_counter_id_fkey(id, name),
        orders:orders(id, status, tien_hoa_hong)
      `)
      .eq('id', id)
      .single();

    if (error || !shift) {
      res.status(404).json({
        success: false,
        error: 'Không tìm thấy ca làm việc',
      });
      return;
    }

    const validOrders = shift.orders ? shift.orders.filter((o: any) => o.status !== 'cancelled') : [];
    const tongHoaHong = validOrders.reduce((sum: number, o: any) => sum + parseFloat(o.tien_hoa_hong || 0), 0);

    res.json({
      success: true,
      data: {
        id: shift.id,
        staffId: shift.staff_id,
        staffName: shift.staff?.name,
        counterId: shift.counter_id || undefined,
        counterName: shift.counter?.name,
        date: shift.date,
        startTime: new Date(shift.start_time),
        endTime: shift.end_time ? new Date(shift.end_time) : undefined,
        tienGiaoCa: parseFloat(shift.tien_giao_ca),
        tongTienHangDaTra: parseFloat(shift.tong_tien_hang_da_tra || 0),
        quyConLai: parseFloat(shift.quy_con_lai || 0),
        status: shift.status,
        tongHoaHong,
        createdAt: new Date(shift.created_at),
        updatedAt: new Date(shift.updated_at),
      },
    });
  } catch (error: any) {
    console.error('Get shift by id error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Lỗi lấy thông tin ca làm việc',
    });
  }
}

/**
 * Tự động tạo và vào ca cho worker (tiền giao ca = 0)
 */
export async function autoStartShift(req: Request, res: Response<ApiResponse<Shift>>): Promise<void> {
  try {
    const userId = (req as any).user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'Chưa đăng nhập',
      });
      return;
    }

    const today = getVietnamDateStr(); // YYYY-MM-DD

    // Kiểm tra nhân viên đã có ca active trong ngày chưa
    const { data: existingShift } = await supabase
      .from('shifts')
      .select('id')
      .eq('staff_id', userId)
      .eq('date', today)
      .eq('status', 'active')
      .single();

    if (existingShift) {
      res.status(400).json({
        success: false,
        error: 'Bạn đã có ca làm việc đang hoạt động trong ngày hôm nay',
      });
      return;
    }

    const startTime = new Date().toISOString();

    const insertData: any = {
      staff_id: userId,
      date: today,
      start_time: startTime,
      tien_giao_ca: 0,
      tien_giao_ca_ban_dau: 0,
      tong_tien_hang_da_tra: 0,
      quy_con_lai: 0,
      status: 'active',
    };

    const { data: newShift, error } = await supabase
      .from('shifts')
      .insert(insertData)
      .select(`
        *,
        staff:users!shifts_staff_id_fkey(id, name),
        counter:counters!shifts_counter_id_fkey(id, name)
      `)
      .single();

    if (error || !newShift) {
      console.error('Auto start shift error:', error);
      res.status(500).json({
        success: false,
        error: 'Lỗi tự động tạo ca làm việc. Vui lòng thử lại.',
      });
      return;
    }

    res.status(201).json({
      success: true,
      data: {
        id: newShift.id,
        staffId: newShift.staff_id,
        staffName: newShift.staff?.name,
        counterId: newShift.counter_id || undefined,
        counterName: newShift.counter?.name,
        date: newShift.date,
        startTime: new Date(newShift.start_time),
        endTime: newShift.end_time ? new Date(newShift.end_time) : undefined,
        tienGiaoCa: parseFloat(newShift.tien_giao_ca),
        tongTienHangDaTra: parseFloat(newShift.tong_tien_hang_da_tra || 0),
        quyConLai: parseFloat(newShift.quy_con_lai || 0),
        status: newShift.status,
        createdAt: new Date(newShift.created_at),
        updatedAt: new Date(newShift.updated_at),
      },
      message: 'Bắt đầu ca làm việc thành công',
    });
  } catch (error: any) {
    console.error('Auto start shift error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Lỗi tự động tạo ca làm việc',
    });
  }
}

/**
 * Lấy ca hiện tại của worker (active)
 */
export async function getCurrentShift(req: Request, res: Response<ApiResponse<Shift>>): Promise<void> {
  try {
    // Auto-reset các ca đã hết hạn trước khi lấy ca hiện tại
    await autoResetExpiredShifts();

    const userId = (req as any).user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'Chưa đăng nhập',
      });
      return;
    }

    const today = getVietnamDateStr(); // YYYY-MM-DD

    const { data: shift, error } = await supabase
      .from('shifts')
      .select(`
        *,
        staff:users!shifts_staff_id_fkey(id, name),
        counter:counters!shifts_counter_id_fkey(id, name)
      `)
      .eq('staff_id', userId)
      .eq('date', today)
      .eq('status', 'active')
      .single();

    if (error || !shift) {
      res.status(404).json({
        success: false,
        error: 'Không tìm thấy ca làm việc active',
      });
      return;
    }

    res.json({
      success: true,
      data: {
        id: shift.id,
        staffId: shift.staff_id,
        staffName: shift.staff?.name,
        counterId: shift.counter_id || undefined,
        counterName: shift.counter?.name,
        date: shift.date,
        startTime: new Date(shift.start_time),
        endTime: shift.end_time ? new Date(shift.end_time) : undefined,
        tienGiaoCa: parseFloat(shift.tien_giao_ca),
        tongTienHangDaTra: parseFloat(shift.tong_tien_hang_da_tra || 0),
        quyConLai: parseFloat(shift.quy_con_lai || 0),
        status: shift.status,
        createdAt: new Date(shift.created_at),
        updatedAt: new Date(shift.updated_at),
      },
    });
  } catch (error: any) {
    console.error('Get current shift error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Lỗi lấy ca làm việc hiện tại',
    });
  }
}

/**
 * Tạo ca mới (admin/manager)
 */
export async function createShift(
  req: Request<{}, ApiResponse<Shift>, { staffId: string; counterId?: string; date: string; tienGiaoCa: number }>,
  res: Response
): Promise<void> {
  try {
    const { staffId, counterId, date, tienGiaoCa } = req.body;

    // Validation cơ bản - counterId không bắt buộc
    if (!staffId || !date || !tienGiaoCa || tienGiaoCa <= 0) {
      res.status(400).json({
        success: false,
        error: 'Thông tin không hợp lệ',
      });
      return;
    }

    // Kiểm tra staff tồn tại
    const { data: staffData, error: staffError } = await supabase
      .from('users')
      .select('id, is_active')
      .eq('id', staffId)
      .single();

    if (staffError || !staffData || !staffData.is_active) {
      res.status(404).json({
        success: false,
        error: 'Nhân viên không tồn tại hoặc không active',
      });
      return;
    }

    // Kiểm tra counter nếu có counterId (optional)
    if (counterId) {
      const { data: counterData, error: counterError } = await supabase
        .from('counters')
        .select('id, is_active')
        .eq('id', counterId)
        .single();

      if (counterError || !counterData || !counterData.is_active) {
        res.status(404).json({
          success: false,
          error: 'Quầy không tồn tại hoặc không active',
        });
        return;
      }
    }

    // Kiểm tra nhân viên đã có ca active trong ngày chưa
    const { data: existingShift } = await supabase
      .from('shifts')
      .select('id')
      .eq('staff_id', staffId)
      .eq('date', date)
      .eq('status', 'active')
      .single();

    if (existingShift) {
      res.status(409).json({
        success: false,
        error: 'Nhân viên đã có ca active trong ngày này',
      });
      return;
    }

    // Tạo ca mới với start_time = date 00:00:00, sẽ được update khi worker bắt đầu
    const startTime = new Date(`${date}T00:00:00.000Z`);

    // Chỉ set counter_id nếu có counterId (optional)
    const insertData: any = {
      staff_id: staffId,
      date: date,
      start_time: startTime.toISOString(),
      tien_giao_ca: tienGiaoCa,
      tien_giao_ca_ban_dau: tienGiaoCa, // Lưu tiền ban đầu
      tong_tien_hang_da_tra: 0,
      quy_con_lai: tienGiaoCa, // Quỹ còn lại ban đầu = tiền giao ca
      status: 'active', // Tạo ca là active luôn, worker sẽ "xác nhận" bằng cách bắt đầu làm việc
    };

    // Chỉ thêm counter_id nếu có (counter là optional khi tạo ca)
    if (counterId) {
      insertData.counter_id = counterId;
    }

    const { data: newShift, error } = await supabase
      .from('shifts')
      .insert(insertData)
      .select(`
        *,
        staff:users!shifts_staff_id_fkey(id, name),
        counter:counters!shifts_counter_id_fkey(id, name)
      `)
      .single();

    if (error) {
      console.error('Create shift error:', error);
      res.status(500).json({
        success: false,
        error: 'Lỗi tạo ca làm việc. Vui lòng thử lại.',
      });
      return;
    }

    res.status(201).json({
      success: true,
      data: {
        id: newShift.id,
        staffId: newShift.staff_id,
        staffName: newShift.staff?.name,
        counterId: newShift.counter_id || undefined,
        counterName: newShift.counter?.name,
        date: newShift.date,
        startTime: new Date(newShift.start_time),
        endTime: newShift.end_time ? new Date(newShift.end_time) : undefined,
        tienGiaoCa: parseFloat(newShift.tien_giao_ca),
        tongTienHangDaTra: parseFloat(newShift.tong_tien_hang_da_tra || 0),
        quyConLai: parseFloat(newShift.quy_con_lai || 0),
        status: newShift.status,
        createdAt: new Date(newShift.created_at),
        updatedAt: new Date(newShift.updated_at),
      },
      message: 'Tạo ca làm việc thành công',
    });
  } catch (error: any) {
    console.error('Create shift error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Lỗi tạo ca làm việc. Vui lòng thử lại.',
    });
  }
}

/**
 * Bắt đầu ca (worker) - update start_time = now
 */
export async function startShift(req: Request<{ id: string }>, res: Response<ApiResponse<Shift>>): Promise<void> {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'Chưa đăng nhập',
      });
      return;
    }

    // Kiểm tra ca tồn tại và thuộc về user này
    const { data: shift, error: shiftError } = await supabase
      .from('shifts')
      .select('*')
      .eq('id', id)
      .single();

    if (shiftError || !shift) {
      res.status(404).json({
        success: false,
        error: 'Không tìm thấy ca làm việc',
      });
      return;
    }

    if (shift.staff_id !== userId) {
      res.status(403).json({
        success: false,
        error: 'Bạn không có quyền bắt đầu ca này',
      });
      return;
    }

    if (shift.status === 'ended') {
      res.status(400).json({
        success: false,
        error: 'Ca đã kết thúc, không thể bắt đầu lại',
      });
      return;
    }

    // Update start_time = now và đảm bảo status = 'active'
    const { data: updatedShift, error } = await supabase
      .from('shifts')
      .update({
        start_time: new Date().toISOString(),
        status: 'active',
      })
      .eq('id', id)
      .select(`
        *,
        staff:users!shifts_staff_id_fkey(id, name),
        counter:counters!shifts_counter_id_fkey(id, name)
      `)
      .single();

    if (error) {
      console.error('Start shift error:', error);
      res.status(500).json({
        success: false,
        error: 'Lỗi bắt đầu ca. Vui lòng thử lại.',
      });
      return;
    }

    res.json({
      success: true,
      data: {
        id: updatedShift.id,
        staffId: updatedShift.staff_id,
        staffName: updatedShift.staff?.name,
        counterId: updatedShift.counter_id || undefined,
        counterName: updatedShift.counter?.name,
        date: updatedShift.date,
        startTime: new Date(updatedShift.start_time),
        endTime: updatedShift.end_time ? new Date(updatedShift.end_time) : undefined,
        tienGiaoCa: parseFloat(updatedShift.tien_giao_ca),
        tongTienHangDaTra: parseFloat(updatedShift.tong_tien_hang_da_tra || 0),
        quyConLai: parseFloat(updatedShift.quy_con_lai || 0),
        status: updatedShift.status,
        createdAt: new Date(updatedShift.created_at),
        updatedAt: new Date(updatedShift.updated_at),
      },
      message: 'Bắt đầu ca thành công',
    });
  } catch (error: any) {
    console.error('Start shift error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Lỗi bắt đầu ca. Vui lòng thử lại.',
    });
  }
}

/**
 * Auto-reset tiền cho các ca chưa kết thúc sau 12h đêm
 * Gọi function này trước khi lấy danh sách ca hoặc ca hiện tại
 */
async function autoResetExpiredShifts(): Promise<void> {
  const todayISO = getVietnamDateStr();

  // Tìm các ca active có date < today (ca của ngày hôm qua hoặc trước đó)
  const { data: expiredShifts, error } = await supabase
    .from('shifts')
    .select('id, date')
    .eq('status', 'active')
    .lt('date', todayISO); // Shifts with date < today

  if (error) {
    console.error('Error fetching expired shifts:', error);
    return;
  }

  if (expiredShifts && expiredShifts.length > 0) {
    const shiftIdsToUpdate = expiredShifts.map((shift: { id: string; date: string }) => shift.id);
    console.log(`Auto-resetting ${shiftIdsToUpdate.length} expired shifts.`);

    // Reset tiền về 0 và kết thúc ca
    const { error: updateError } = await supabase
      .from('shifts')
      .update({
        tien_giao_ca: 0,
        tong_tien_hang_da_tra: 0,
        quy_con_lai: 0,
        status: 'ended',
        end_time: new Date().toISOString(), // End at current time
        updated_at: new Date().toISOString(),
      })
      .in('id', shiftIdsToUpdate);

    if (updateError) {
      console.error('Error auto-resetting expired shifts:', updateError);
    } else {
      console.log(`Successfully auto-reset ${shiftIdsToUpdate.length} shifts.`);
    }
  }
}

/**
 * Kết thúc ca (chỉ admin) - số dư cuối ca = tiền giao ca - tổng tiền hàng đã trả
 */
export async function endShift(
  req: Request<{ id: string }, ApiResponse<Shift>, {}>,
  res: Response
): Promise<void> {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.userId;
    const userRole = (req as any).user?.role;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'Chưa đăng nhập',
      });
      return;
    }

    // Chỉ admin mới có quyền kết thúc ca
    if (userRole !== 'admin') {
      res.status(403).json({
        success: false,
        error: 'Chỉ admin mới có quyền kết thúc ca',
      });
      return;
    }

    // Lấy thông tin ca
    const { data: shift, error: shiftError } = await supabase
      .from('shifts')
      .select('*')
      .eq('id', id)
      .single();

    if (shiftError || !shift) {
      res.status(404).json({
        success: false,
        error: 'Không tìm thấy ca làm việc',
      });
      return;
    }

    if (shift.status === 'ended') {
      res.status(400).json({
        success: false,
        error: 'Ca đã kết thúc rồi',
      });
      return;
    }

    // Update shift - kết thúc ca
    const { data: updatedShift, error } = await supabase
      .from('shifts')
      .update({
        end_time: new Date().toISOString(),
        status: 'ended',
      })
      .eq('id', id)
      .select(`
        *,
        staff:users!shifts_staff_id_fkey(id, name),
        counter:counters!shifts_counter_id_fkey(id, name)
      `)
      .single();

    if (error) {
      console.error('End shift error:', error);
      res.status(500).json({
        success: false,
        error: 'Lỗi kết thúc ca. Vui lòng thử lại.',
      });
      return;
    }

    res.json({
      success: true,
      data: {
        id: updatedShift.id,
        staffId: updatedShift.staff_id,
        staffName: updatedShift.staff?.name,
        counterId: updatedShift.counter_id || undefined,
        counterName: updatedShift.counter?.name,
        date: updatedShift.date,
        startTime: new Date(updatedShift.start_time),
        endTime: updatedShift.end_time ? new Date(updatedShift.end_time) : undefined,
        tienGiaoCa: parseFloat(updatedShift.tien_giao_ca),
        tongTienHangDaTra: parseFloat(updatedShift.tong_tien_hang_da_tra || 0),
        quyConLai: parseFloat(updatedShift.quy_con_lai || 0),
        status: updatedShift.status,
        createdAt: new Date(updatedShift.created_at),
        updatedAt: new Date(updatedShift.updated_at),
      },
      message: 'Kết thúc ca thành công',
    });
  } catch (error: any) {
    console.error('End shift error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Lỗi kết thúc ca. Vui lòng thử lại.',
    });
  }
}

/**
 * Tính lại tiền giao ca dựa trên lịch sử thêm tiền
 */
async function recalculateShiftMoney(shiftId: string): Promise<void> {
  // Lấy tổng các lần thêm tiền
  const { data: additions, error: additionsError } = await supabase
    .from('shift_money_additions')
    .select('amount')
    .eq('shift_id', shiftId);

  if (additionsError) {
    console.error('Get money additions error:', additionsError);
    throw new Error('Lỗi lấy lịch sử thêm tiền');
  }

  const tongTienDaThem = additions?.reduce((sum: number, item: { amount: string | number }) => sum + parseFloat(item.amount.toString()), 0) || 0;

  // Lấy ca hiện tại
  const { data: shift, error: shiftError } = await supabase
    .from('shifts')
    .select('tien_giao_ca_ban_dau, tong_tien_hang_da_tra')
    .eq('id', shiftId)
    .single();

  if (shiftError || !shift) {
    throw new Error('Không tìm thấy ca làm việc');
  }

  // Tính tiền giao ca mới = tiền ban đầu + tổng đã thêm
  const tienGiaoCaBanDau = parseFloat(shift.tien_giao_ca_ban_dau || '0');
  const tienGiaoCaMoi = tienGiaoCaBanDau + tongTienDaThem;
  const tongTienHangDaTra = parseFloat(shift.tong_tien_hang_da_tra || '0');
  const quyConLai = tienGiaoCaMoi - tongTienHangDaTra;

  // Cập nhật ca
  const { error: updateError } = await supabase
    .from('shifts')
    .update({
      tien_giao_ca: tienGiaoCaMoi.toString(),
      quy_con_lai: quyConLai.toString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', shiftId);

  if (updateError) {
    console.error('Update shift error:', updateError);
    throw new Error('Lỗi cập nhật ca làm việc');
  }
}

/**
 * Cộng thêm tiền vào ca (Admin/Manager) - Lưu vào lịch sử
 */
export async function addMoneyToShift(req: Request, res: Response<ApiResponse<Shift>>): Promise<void> {
  try {
    const { id } = req.params;
    const { amount, note } = req.body;
    const userId = (req as any).user?.id; // Lấy user ID từ middleware

    if (amount === undefined || amount === null || typeof amount !== 'number') {
      res.status(400).json({
        success: false,
        error: 'Vui lòng nhập số tiền hợp lệ',
      });
      return;
    }

    // Kiểm tra ca tồn tại
    const { data: shift, error: shiftError } = await supabase
      .from('shifts')
      .select('id, status')
      .eq('id', id)
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
        error: 'Chỉ có thể thêm tiền vào ca đang hoạt động',
      });
      return;
    }

    // Lưu vào lịch sử
    const { data: newAddition, error: insertError } = await supabase
      .from('shift_money_additions')
      .insert({
        shift_id: id,
        amount: amount.toString(),
        note: note || null,
        created_by: userId || null,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Insert money addition error:', insertError);
      res.status(500).json({
        success: false,
        error: 'Lỗi lưu lịch sử thêm tiền',
      });
      return;
    }

    // Tính lại tiền giao ca
    await recalculateShiftMoney(id);

    // Lấy lại ca với thông tin đầy đủ
    const { data: updatedShift, error: fetchError } = await supabase
      .from('shifts')
      .select(`
        *,
        staff:users!shifts_staff_id_fkey(id, name),
        counter:counters!shifts_counter_id_fkey(id, name)
      `)
      .eq('id', id)
      .single();

    if (fetchError || !updatedShift) {
      res.status(500).json({
        success: false,
        error: 'Lỗi lấy thông tin ca sau khi cập nhật',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        id: updatedShift.id,
        staffId: updatedShift.staff_id,
        staffName: updatedShift.staff?.name,
        counterId: updatedShift.counter_id || undefined,
        counterName: updatedShift.counter?.name,
        date: updatedShift.date,
        startTime: new Date(updatedShift.start_time),
        endTime: updatedShift.end_time ? new Date(updatedShift.end_time) : undefined,
        tienGiaoCa: parseFloat(updatedShift.tien_giao_ca),
        tongTienHangDaTra: parseFloat(updatedShift.tong_tien_hang_da_tra || 0),
        quyConLai: parseFloat(updatedShift.quy_con_lai || 0),
        status: updatedShift.status,
        createdAt: new Date(updatedShift.created_at),
        updatedAt: new Date(updatedShift.updated_at),
      },
    });
  } catch (error: any) {
    console.error('Add money to shift error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Lỗi cập nhật tiền ca làm việc',
    });
  }
}

/**
 * Cập nhật trực tiếp tiền giao ca (Admin/Manager)
 */
export async function updateShiftMoney(req: Request, res: Response<ApiResponse<Shift>>): Promise<void> {
  try {
    const { id } = req.params;
    const { tienGiaoCa } = req.body;

    if (tienGiaoCa === undefined || tienGiaoCa === null || typeof tienGiaoCa !== 'number' || tienGiaoCa < 0) {
      res.status(400).json({
        success: false,
        error: 'Số tiền giao ca phải lớn hơn hoặc bằng 0',
      });
      return;
    }

    // Lấy ca hiện tại
    const { data: shift, error: shiftError } = await supabase
      .from('shifts')
      .select(`
        *,
        staff:users!shifts_staff_id_fkey(id, name),
        counter:counters!shifts_counter_id_fkey(id, name)
      `)
      .eq('id', id)
      .single();

    if (shiftError || !shift) {
      res.status(404).json({
        success: false,
        error: 'Không tìm thấy ca làm việc',
      });
      return;
    }

    // Tính toán lại quỹ còn lại
    const tongTienHangDaTra = parseFloat(shift.tong_tien_hang_da_tra || 0);
    const quyConLai = tienGiaoCa - tongTienHangDaTra;

    // Cập nhật ca
    const { data: updatedShift, error: updateError } = await supabase
      .from('shifts')
      .update({
        tien_giao_ca: tienGiaoCa.toString(),
        quy_con_lai: quyConLai.toString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select(`
        *,
        staff:users!shifts_staff_id_fkey(id, name),
        counter:counters!shifts_counter_id_fkey(id, name)
      `)
      .single();

    if (updateError || !updatedShift) {
      console.error('Update shift money error:', updateError);
      res.status(500).json({
        success: false,
        error: 'Lỗi cập nhật tiền giao ca',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        id: updatedShift.id,
        staffId: updatedShift.staff_id,
        staffName: updatedShift.staff?.name,
        counterId: updatedShift.counter_id || undefined,
        counterName: updatedShift.counter?.name,
        date: updatedShift.date,
        startTime: new Date(updatedShift.start_time),
        endTime: updatedShift.end_time ? new Date(updatedShift.end_time) : undefined,
        tienGiaoCa: parseFloat(updatedShift.tien_giao_ca),
        tongTienHangDaTra: parseFloat(updatedShift.tong_tien_hang_da_tra || 0),
        quyConLai: parseFloat(updatedShift.quy_con_lai || 0),
        status: updatedShift.status,
        createdAt: new Date(updatedShift.created_at),
        updatedAt: new Date(updatedShift.updated_at),
      },
    });
  } catch (error: any) {
    console.error('Update shift money error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Lỗi cập nhật tiền giao ca',
    });
  }
}

/**
 * Lấy lịch sử thêm tiền của ca
 */
export async function getShiftMoneyAdditions(req: Request<{ id: string }>, res: Response<ApiResponse<ShiftMoneyAddition[]>>): Promise<void> {
  try {
    const { id } = req.params;

    // Kiểm tra ca tồn tại
    const { data: shift, error: shiftError } = await supabase
      .from('shifts')
      .select('id')
      .eq('id', id)
      .single();

    if (shiftError || !shift) {
      res.status(404).json({
        success: false,
        error: 'Không tìm thấy ca làm việc',
      });
      return;
    }

    // Lấy lịch sử thêm tiền
    const { data: additions, error } = await supabase
      .from('shift_money_additions')
      .select('*')
      .eq('shift_id', id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Get money additions error:', error);
      res.status(500).json({
        success: false,
        error: 'Lỗi lấy lịch sử thêm tiền',
      });
      return;
    }

    res.json({
      success: true,
      data: additions.map((item: any) => ({
        id: item.id,
        shiftId: item.shift_id,
        amount: parseFloat(item.amount),
        note: item.note || undefined,
        createdBy: item.created_by || undefined,
        createdAt: new Date(item.created_at),
        updatedAt: new Date(item.updated_at),
      })),
    });
  } catch (error: any) {
    console.error('Get money additions error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Lỗi lấy lịch sử thêm tiền',
    });
  }
}

/**
 * Cập nhật một lần thêm tiền trong lịch sử
 */
export async function updateShiftMoneyAddition(
  req: Request<{ id: string; additionId: string }, ApiResponse<Shift>, { amount?: number; note?: string }>,
  res: Response
): Promise<void> {
  try {
    const { id, additionId } = req.params;
    const { amount, note } = req.body;

    // Kiểm tra ca tồn tại và đang active
    const { data: shift, error: shiftError } = await supabase
      .from('shifts')
      .select('id, status')
      .eq('id', id)
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
        error: 'Chỉ có thể sửa lịch sử thêm tiền của ca đang hoạt động',
      });
      return;
    }

    // Kiểm tra lần thêm tiền tồn tại
    const { data: existingAddition, error: checkError } = await supabase
      .from('shift_money_additions')
      .select('*')
      .eq('id', additionId)
      .eq('shift_id', id)
      .single();

    if (checkError || !existingAddition) {
      res.status(404).json({
        success: false,
        error: 'Không tìm thấy lần thêm tiền',
      });
      return;
    }

    // Cập nhật
    const updateData: any = {};
    if (amount !== undefined) {
      if (typeof amount !== 'number') {
        res.status(400).json({
          success: false,
          error: 'Vui lòng nhập số tiền hợp lệ',
        });
        return;
      }
      updateData.amount = amount.toString();
    }
    if (note !== undefined) {
      updateData.note = note || null;
    }

    if (Object.keys(updateData).length === 0) {
      res.status(400).json({
        success: false,
        error: 'Không có thông tin nào để cập nhật',
      });
      return;
    }

    const { error: updateError } = await supabase
      .from('shift_money_additions')
      .update(updateData)
      .eq('id', additionId);

    if (updateError) {
      console.error('Update money addition error:', updateError);
      res.status(500).json({
        success: false,
        error: 'Lỗi cập nhật lịch sử thêm tiền',
      });
      return;
    }

    // Tính lại tiền giao ca
    await recalculateShiftMoney(id);

    // Lấy lại ca với thông tin đầy đủ
    const { data: updatedShift, error: fetchError } = await supabase
      .from('shifts')
      .select(`
        *,
        staff:users!shifts_staff_id_fkey(id, name),
        counter:counters!shifts_counter_id_fkey(id, name)
      `)
      .eq('id', id)
      .single();

    if (fetchError || !updatedShift) {
      res.status(500).json({
        success: false,
        error: 'Lỗi lấy thông tin ca sau khi cập nhật',
      });
      return;
    }

    res.json({
      success: true,
      data: {
        id: updatedShift.id,
        staffId: updatedShift.staff_id,
        staffName: updatedShift.staff?.name,
        counterId: updatedShift.counter_id || undefined,
        counterName: updatedShift.counter?.name,
        date: updatedShift.date,
        startTime: new Date(updatedShift.start_time),
        endTime: updatedShift.end_time ? new Date(updatedShift.end_time) : undefined,
        tienGiaoCa: parseFloat(updatedShift.tien_giao_ca),
        tongTienHangDaTra: parseFloat(updatedShift.tong_tien_hang_da_tra || 0),
        quyConLai: parseFloat(updatedShift.quy_con_lai || 0),
        status: updatedShift.status,
        createdAt: new Date(updatedShift.created_at),
        updatedAt: new Date(updatedShift.updated_at),
      },
    });
  } catch (error: any) {
    console.error('Update money addition error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Lỗi cập nhật lịch sử thêm tiền',
    });
  }
}

/**
 * Xóa một lần thêm tiền trong lịch sử
 */
export async function deleteShiftMoneyAddition(req: Request<{ id: string; additionId: string }>, res: Response<ApiResponse<Shift>>): Promise<void> {
  try {
    const { id, additionId } = req.params;

    // Kiểm tra ca tồn tại và đang active
    const { data: shift, error: shiftError } = await supabase
      .from('shifts')
      .select('id, status')
      .eq('id', id)
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
        error: 'Chỉ có thể xóa lịch sử thêm tiền của ca đang hoạt động',
      });
      return;
    }

    // Kiểm tra lần thêm tiền tồn tại
    const { data: existingAddition, error: checkError } = await supabase
      .from('shift_money_additions')
      .select('id')
      .eq('id', additionId)
      .eq('shift_id', id)
      .single();

    if (checkError || !existingAddition) {
      res.status(404).json({
        success: false,
        error: 'Không tìm thấy lần thêm tiền',
      });
      return;
    }

    // Xóa
    const { error: deleteError } = await supabase
      .from('shift_money_additions')
      .delete()
      .eq('id', additionId);

    if (deleteError) {
      console.error('Delete money addition error:', deleteError);
      res.status(500).json({
        success: false,
        error: 'Lỗi xóa lịch sử thêm tiền',
      });
      return;
    }

    // Tính lại tiền giao ca
    await recalculateShiftMoney(id);

    // Lấy lại ca với thông tin đầy đủ
    const { data: updatedShift, error: fetchError } = await supabase
      .from('shifts')
      .select(`
        *,
        staff:users!shifts_staff_id_fkey(id, name),
        counter:counters!shifts_counter_id_fkey(id, name)
      `)
      .eq('id', id)
      .single();

    if (fetchError || !updatedShift) {
      res.status(500).json({
        success: false,
        error: 'Lỗi lấy thông tin ca sau khi xóa',
      });
      return;
    }

    res.json({
      success: true,
      data: {
        id: updatedShift.id,
        staffId: updatedShift.staff_id,
        staffName: updatedShift.staff?.name,
        counterId: updatedShift.counter_id || undefined,
        counterName: updatedShift.counter?.name,
        date: updatedShift.date,
        startTime: new Date(updatedShift.start_time),
        endTime: updatedShift.end_time ? new Date(updatedShift.end_time) : undefined,
        tienGiaoCa: parseFloat(updatedShift.tien_giao_ca),
        tongTienHangDaTra: parseFloat(updatedShift.tong_tien_hang_da_tra || 0),
        quyConLai: parseFloat(updatedShift.quy_con_lai || 0),
        status: updatedShift.status,
        createdAt: new Date(updatedShift.created_at),
        updatedAt: new Date(updatedShift.updated_at),
      },
    });
  } catch (error: any) {
    console.error('Delete money addition error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Lỗi xóa lịch sử thêm tiền',
    });
  }
}
