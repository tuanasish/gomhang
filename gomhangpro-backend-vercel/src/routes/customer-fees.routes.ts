import { Router } from 'express';
import { saveCustomerDailyFee, getCustomerDailyFees, getCustomerDailyFee } from '../controllers/customer-fees.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

const router = Router();

/**
 * @route   POST /api/customer-fees
 * @desc    Lưu/cập nhật phí đóng gửi cho khách hàng theo ngày
 * @access  Private (Manager/Admin)
 */
router.post('/', authenticate, authorize('manager', 'admin'), saveCustomerDailyFee);

/**
 * @route   GET /api/customer-fees
 * @desc    Lấy tất cả phí đóng gửi theo ngày
 * @access  Private (Manager/Admin)
 */
router.get('/', authenticate, authorize('manager', 'admin'), getCustomerDailyFees);

/**
 * @route   GET /api/customer-fees/:customerId
 * @desc    Lấy phí đóng gửi của 1 khách hàng theo ngày
 * @access  Private (Manager/Admin)
 */
router.get('/:customerId', authenticate, authorize('manager', 'admin'), getCustomerDailyFee);

export default router;
