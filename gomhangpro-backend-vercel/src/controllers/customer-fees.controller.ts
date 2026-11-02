import { Request, Response } from 'express';
import { supabase } from '../config/supabase.js';

/**
 * Lưu/cập nhật phí đóng gửi cho khách hàng theo ngày (UPSERT)
 */
export async function saveCustomerDailyFee(req: Request, res: Response): Promise<void> {
    try {
        const { customerId, date, phiDongGui, isInvoiced, noKhach, soDuKhach, tongThanhToan } = req.body;

        if (!customerId || !date) {
            res.status(400).json({
                success: false,
                error: 'customerId và date là bắt buộc',
            });
            return;
        }

        const userId = (req as any).user?.id;

        const updatePayload: any = {
            customer_id: customerId,
            date: date,
            created_by: userId || null,
        };

        if (phiDongGui !== undefined) {
            updatePayload.phi_dong_gui = phiDongGui;
        }
        if (isInvoiced !== undefined) {
            updatePayload.is_invoiced = isInvoiced;
        }
        if (noKhach !== undefined) {
            updatePayload.no_khach = Number(noKhach) || 0;
        }
        if (soDuKhach !== undefined) {
            updatePayload.so_du_khach = Number(soDuKhach) || 0;
        }
        if (tongThanhToan !== undefined) {
            updatePayload.tong_thanh_toan = Number(tongThanhToan) || 0;
        }

        const { data, error } = await supabase
            .from('customer_daily_fees')
            .upsert(
                updatePayload,
                { onConflict: 'customer_id,date' }
            )
            .select()
            .single();

        if (error) {
            console.error('Save customer daily fee error:', error);
            res.status(500).json({
                success: false,
                error: 'Lỗi lưu phí đóng gửi',
            });
            return;
        }

        res.json({
            success: true,
            data: {
                id: data.id,
                customerId: data.customer_id,
                date: data.date,
                phiDongGui: Number(data.phi_dong_gui),
                isInvoiced: Boolean(data.is_invoiced),
                noKhach: Number(data.no_khach) || 0,
                soDuKhach: Number(data.so_du_khach) || 0,
                tongThanhToan: Number(data.tong_thanh_toan) || 0,
                createdBy: data.created_by,
            },
            message: 'Đã lưu phí đóng gửi',
        });
    } catch (error: any) {
        console.error('Save customer daily fee error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Lỗi lưu phí đóng gửi',
        });
    }
}

/**
 * Lấy tất cả phí đóng gửi theo ngày
 * Chỉ trả về phí của khách hàng có ít nhất 1 đơn hàng active (không bị cancelled) trong ngày
 */
export async function getCustomerDailyFees(req: Request, res: Response): Promise<void> {
    try {
        const { date, startDate, endDate } = req.query;

        const hasSingleDate = typeof date === 'string' && date.length > 0;
        const hasDateRange = typeof startDate === 'string' && startDate.length > 0;

        if (!hasSingleDate && !hasDateRange) {
            res.status(400).json({
                success: false,
                error: 'Cần truyền date hoặc startDate (YYYY-MM-DD)',
            });
            return;
        }

        // 1. Lấy danh sách phí đóng gửi theo ngày
        let feesQuery = supabase
            .from('customer_daily_fees')
            .select('*, customers(name)');

        if (hasSingleDate) {
            feesQuery = feesQuery.eq('date', date as string);
        } else {
            feesQuery = feesQuery.gte('date', startDate as string);
            if (typeof endDate === 'string' && endDate.length > 0) {
                feesQuery = feesQuery.lte('date', endDate);
            }
        }

        const { data, error } = await feesQuery;

        if (error) {
            console.error('Get customer daily fees error:', error);
            res.status(500).json({
                success: false,
                error: 'Lỗi lấy danh sách phí đóng gửi',
            });
            return;
        }

        // 2. Lấy danh sách customer_id có đơn hàng active trong ngày
        let ordersQuery = supabase
            .from('orders')
            .select('customer_id')
            .neq('status', 'cancelled');

        if (hasSingleDate) {
            const dayStart = `${date}T00:00:00+07:00`;
            const dayEnd = `${date}T23:59:59+07:00`;
            ordersQuery = ordersQuery.gte('created_at', dayStart).lte('created_at', dayEnd);
        } else {
            ordersQuery = ordersQuery.gte('created_at', `${startDate}T00:00:00+07:00`);
            if (typeof endDate === 'string' && endDate.length > 0) {
                ordersQuery = ordersQuery.lte('created_at', `${endDate}T23:59:59+07:00`);
            }
        }

        const { data: activeOrders, error: ordersError } = await ordersQuery;

        if (ordersError) {
            console.error('Get active orders error:', ordersError);
        }

        // Tạo set các customer_id có đơn active
        const activeCustomerIds = new Set(
            (activeOrders || []).map((o: any) => o.customer_id)
        );

        // 3. Lọc chỉ giữ phí của khách hàng có đơn active
        const filteredData = (data || []).filter((item: any) =>
            activeCustomerIds.has(item.customer_id)
        );

        res.json({
            success: true,
            data: filteredData.map((item: any) => ({
                id: item.id,
                customerId: item.customer_id,
                customerName: item.customers?.name || '',
                date: item.date,
                phiDongGui: Number(item.phi_dong_gui),
                isInvoiced: Boolean(item.is_invoiced),
                noKhach: Number(item.no_khach) || 0,
                soDuKhach: Number(item.so_du_khach) || 0,
                tongThanhToan: Number(item.tong_thanh_toan) || 0,
                createdBy: item.created_by,
            })),
        });
    } catch (error: any) {
        console.error('Get customer daily fees error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Lỗi lấy danh sách phí đóng gửi',
        });
    }
}

/**
 * Lấy phí đóng gửi của 1 khách hàng theo ngày
 */
export async function getCustomerDailyFee(req: Request, res: Response): Promise<void> {
    try {
        const { customerId } = req.params;
        const { date } = req.query;

        if (!date || typeof date !== 'string') {
            res.status(400).json({
                success: false,
                error: 'Tham số date là bắt buộc (YYYY-MM-DD)',
            });
            return;
        }

        const { data, error } = await supabase
            .from('customer_daily_fees')
            .select('*')
            .eq('customer_id', customerId)
            .eq('date', date)
            .maybeSingle();

        if (error) {
            console.error('Get customer daily fee error:', error);
            res.status(500).json({
                success: false,
                error: 'Lỗi lấy phí đóng gửi',
            });
            return;
        }

        res.json({
            success: true,
            data: data ? {
                id: data.id,
                customerId: data.customer_id,
                date: data.date,
                phiDongGui: Number(data.phi_dong_gui),
                isInvoiced: Boolean(data.is_invoiced),
                noKhach: Number(data.no_khach) || 0,
                soDuKhach: Number(data.so_du_khach) || 0,
                tongThanhToan: Number(data.tong_thanh_toan) || 0,
                createdBy: data.created_by,
            } : null,
        });
    } catch (error: any) {
        console.error('Get customer daily fee error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Lỗi lấy phí đóng gửi',
        });
    }
}

/**
 * Lấy tổng hóa đơn của ngày gần nhất trước ngày được chỉ định (để tính nợ cũ)
 */
export async function getPreviousCustomerBill(req: Request, res: Response): Promise<void> {
    try {
        const { customerId } = req.params;
        const { date } = req.query;

        if (!customerId || !date || typeof date !== 'string') {
            res.status(400).json({
                success: false,
                error: 'Tham số customerId và date (YYYY-MM-DD) là bắt buộc',
            });
            return;
        }

        const dateStart = `${date}T00:00:00+07:00`;

        // 1. Tìm đơn hàng gần nhất trước ngày được chọn
        const { data: latestOrder, error: orderErr } = await supabase
            .from('orders')
            .select('created_at')
            .eq('customer_id', customerId)
            .neq('status', 'cancelled')
            .lt('created_at', dateStart)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (orderErr) {
            console.error('Error finding previous order:', orderErr);
        }

        // Tìm bản ghi customer_daily_fees gần nhất trước ngày được chọn
        const { data: latestFee, error: feeErr } = await supabase
            .from('customer_daily_fees')
            .select('date')
            .eq('customer_id', customerId)
            .lt('date', date)
            .order('date', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (feeErr) {
            console.error('Error finding previous fee:', feeErr);
        }

        let prevDateStr: string | null = null;
        if (latestOrder) {
            const d = new Date(latestOrder.created_at);
            const vnTime = new Date(d.getTime() + 7 * 3600 * 1000);
            prevDateStr = vnTime.toISOString().slice(0, 10);
        }

        if (latestFee?.date) {
            if (!prevDateStr || latestFee.date > prevDateStr) {
                prevDateStr = latestFee.date;
            }
        }

        if (!prevDateStr) {
            res.json({
                success: true,
                data: null,
                message: 'Không tìm thấy hóa đơn ngày hôm trước',
            });
            return;
        }

        const prevStart = `${prevDateStr}T00:00:00+07:00`;
        const prevEnd = `${prevDateStr}T23:59:59+07:00`;

        // 2. Lấy tất cả đơn hàng trong ngày hôm trước đó
        const { data: prevOrders, error: prevOrdersErr } = await supabase
            .from('orders')
            .select('tong_tien_hoa_don')
            .eq('customer_id', customerId)
            .neq('status', 'cancelled')
            .gte('created_at', prevStart)
            .lte('created_at', prevEnd);

        if (prevOrdersErr) {
            console.error('Error fetching prev orders:', prevOrdersErr);
        }

        const totalOrdersAmount = (prevOrders || []).reduce(
            (sum: number, o: any) => sum + (Number(o.tong_tien_hoa_don) || 0),
            0
        );

        // 3. Lấy phí đóng gửi & nợ của ngày hôm trước (nếu có)
        const { data: prevFee } = await supabase
            .from('customer_daily_fees')
            .select('phi_dong_gui, is_invoiced, no_khach, so_du_khach, tong_thanh_toan')
            .eq('customer_id', customerId)
            .eq('date', prevDateStr)
            .maybeSingle();

        const phiDongGui = Number(prevFee?.phi_dong_gui) || 0;
        const prevNoKhach = Number(prevFee?.no_khach) || 0;
        const prevSoDuKhach = Number(prevFee?.so_du_khach) || 0;
        const prevTongThanhToan = Number(prevFee?.tong_thanh_toan) || 0;

        // "Khách cần thanh toán hôm trước":
        // Nếu đã lưu tong_thanh_toan > 0 thì dùng chính xác số tiền đó
        // Nếu chưa lưu tong_thanh_toan thì tính: tổng tiền đơn + phí đóng gửi + nợ cũ - số dư
        let previousTotalAmount = 0;
        if (prevTongThanhToan > 0) {
            previousTotalAmount = prevTongThanhToan;
        } else {
            previousTotalAmount = Math.max(0, totalOrdersAmount + phiDongGui + prevNoKhach - prevSoDuKhach);
        }

        res.json({
            success: true,
            data: {
                previousDate: prevDateStr,
                previousTotalAmount,
                totalOrdersAmount,
                phiDongGui,
                noKhach: prevNoKhach,
                soDuKhach: prevSoDuKhach,
                tongThanhToan: previousTotalAmount,
                orderCount: prevOrders?.length || 0,
                isInvoiced: Boolean(prevFee?.is_invoiced),
            },
        });
    } catch (error: any) {
        console.error('Get previous customer bill error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Lỗi lấy hóa đơn ngày hôm trước',
        });
    }
}
