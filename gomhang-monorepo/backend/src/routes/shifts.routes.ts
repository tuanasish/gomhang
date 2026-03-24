import { Router } from 'express';
import {
  getShiftsList,
  getShiftById,
  getCurrentShift,
  createShift,
  autoStartShift,
  startShift,
  endShift,
  addMoneyToShift,
  updateShiftMoney,
  getShiftMoneyAdditions,
  updateShiftMoneyAddition,
  deleteShiftMoneyAddition
} from '../controllers/shifts.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

const router = Router();

/**
 * @route   GET /api/shifts
 * @desc    Lấy danh sách ca làm việc
 * @access  Private (Manager/Admin)
 */
router.get('/', authenticate, authorize('manager', 'admin'), getShiftsList);

/**
 * @route   GET /api/shifts/current
 * @desc    Lấy ca hiện tại của worker
 * @access  Private (Worker)
 */
router.get('/current', authenticate, authorize('worker'), getCurrentShift);

/**
 * @route   POST /api/shifts
 * @desc    Tạo ca mới
 * @access  Private (Manager/Admin)
 */
router.post('/', authenticate, authorize('manager', 'admin'), createShift);

/**
 * @route   POST /api/shifts/auto-start
 * @desc    Tự động bắt đầu ca cho worker (quỹ 0đ)
 * @access  Private (Worker)
 */
router.post('/auto-start', authenticate, authorize('worker'), autoStartShift);

/**
 * @route   GET /api/shifts/:id/money-additions
 * @desc    Lấy lịch sử thêm tiền của ca
 * @access  Private (Manager/Admin)
 * NOTE: Phải đặt trước route GET /:id để tránh conflict
 */
router.get('/:id/money-additions', authenticate, authorize('manager', 'admin'), getShiftMoneyAdditions);

/**
 * @route   PUT /api/shifts/:id/money-additions/:additionId
 * @desc    Cập nhật một lần thêm tiền trong lịch sử
 * @access  Private (Manager/Admin)
 * NOTE: Phải đặt trước route PUT /:id/start, /:id/end, etc để tránh conflict
 */
router.put('/:id/money-additions/:additionId', authenticate, authorize('manager', 'admin'), updateShiftMoneyAddition);

/**
 * @route   DELETE /api/shifts/:id/money-additions/:additionId
 * @desc    Xóa một lần thêm tiền trong lịch sử
 * @access  Private (Manager/Admin)
 */
router.delete('/:id/money-additions/:additionId', authenticate, authorize('manager', 'admin'), deleteShiftMoneyAddition);

/**
 * @route   PUT /api/shifts/:id/add-money
 * @desc    Cộng/trừ tiền vào ca (amount > 0: cộng, amount < 0: trừ)
 * @access  Private (Manager/Admin)
 */
router.put('/:id/add-money', authenticate, authorize('manager', 'admin'), addMoneyToShift);

/**
 * @route   PUT /api/shifts/:id/money
 * @desc    Cập nhật trực tiếp tiền giao ca
 * @access  Private (Manager/Admin)
 */
router.put('/:id/money', authenticate, authorize('manager', 'admin'), updateShiftMoney);

/**
 * @route   PUT /api/shifts/:id/start
 * @desc    Bắt đầu ca
 * @access  Private (Worker)
 */
router.put('/:id/start', authenticate, authorize('worker'), startShift);

/**
 * @route   PUT /api/shifts/:id/end
 * @desc    Kết thúc ca (chỉ admin)
 * @access  Private (Admin)
 */
router.put('/:id/end', authenticate, authorize('admin'), endShift);

/**
 * @route   GET /api/shifts/:id
 * @desc    Lấy chi tiết ca làm việc
 * @access  Private (Worker/Manager/Admin)
 * NOTE: Phải đặt cuối cùng vì là route generic
 */
router.get('/:id', authenticate, authorize('worker', 'manager', 'admin'), getShiftById);

export default router;
