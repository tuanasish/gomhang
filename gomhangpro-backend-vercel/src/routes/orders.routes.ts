import { Router } from 'express';
import {
  getOrdersList,
  getOrderById,
  getOrdersByShift,
  createOrder,
  updateOrder,
  deleteOrder,
} from '../controllers/orders.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

const router = Router();

/**
 * @route   GET /api/orders
 * @desc    Lấy danh sách đơn hàng
 * @access  Private (Worker/Manager/Admin)
 */
router.get('/', authenticate, authorize('worker', 'manager', 'admin'), getOrdersList);

/**
 * @route   GET /api/orders/shift/:shiftId
 * @desc    Lấy tất cả đơn hàng trong một ca
 * @access  Private (Worker/Manager/Admin)
 */
router.get('/shift/:shiftId', authenticate, authorize('worker', 'manager', 'admin'), getOrdersByShift);

/**
 * @route   GET /api/orders/:id
 * @desc    Lấy chi tiết đơn hàng
 * @access  Private (Worker/Manager/Admin)
 */
router.get('/:id', authenticate, authorize('worker', 'manager', 'admin'), getOrderById);

/**
 * @route   POST /api/orders
 * @desc    Tạo đơn hàng mới
 * @access  Private (Worker)
 */
router.post('/', authenticate, authorize('worker'), createOrder);

/**
 * @route   PUT /api/orders/:id
 * @desc    Cập nhật đơn hàng
 * @access  Private (Worker/Manager/Admin)
 */
router.put('/:id', authenticate, authorize('worker', 'manager', 'admin'), updateOrder);

/**
 * @route   DELETE /api/orders/:id
 * @desc    Xóa đơn hàng (chỉ pending)
 * @access  Private (Worker/Manager/Admin)
 */
router.delete('/:id', authenticate, authorize('worker', 'manager', 'admin'), deleteOrder);

export default router;
