import { Request, Response } from 'express';
import { supabase } from '../config/supabase.js';

/**
 * Lưu/cập nhật phí đóng gửi cho khách hàng theo ngày (UPSERT)
 */
export async function saveCustomerDailyFee(req: Request, res: Response): Promise<void> {
    try {
        const { customerId, date, phiDongGui, isInvoiced } = req.body;

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
        const { date } = req.query;

        if (!date || typeof date !== 'string') {
            res.status(400).json({
                success: false,
                error: 'Tham số date là bắt buộc (YYYY-MM-DD)',
            });
            return;
        }

        // 1. Lấy danh sách phí đóng gửi theo ngày
        const { data, error } = await supabase
            .from('customer_daily_fees')
            .select('*, customers(name)')
            .eq('date', date);

        if (error) {
            console.error('Get customer daily fees error:', error);
            res.status(500).json({
                success: false,
                error: 'Lỗi lấy danh sách phí đóng gửi',
            });
            return;
        }

        // 2. Lấy danh sách customer_id có đơn hàng active trong ngày
        const startDate = `${date}T00:00:00+07:00`;
        const endDate = `${date}T23:59:59+07:00`;
        const { data: activeOrders, error: ordersError } = await supabase
            .from('orders')
            .select('customer_id')
            .neq('status', 'cancelled')
            .gte('created_at', startDate)
            .lte('created_at', endDate);

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
