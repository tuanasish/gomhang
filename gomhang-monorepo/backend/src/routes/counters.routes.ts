import { Router } from 'express';
import { getCountersList, getCounterById, createCounter, updateCounter, deleteCounter } from '../controllers/counters.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

const router = Router();

/**
 * @route   GET /api/counters
 * @desc    Lấy danh sách quầy
 * @access  Private (Worker/Manager/Admin)
 */
router.get('/', authenticate, authorize('worker', 'manager', 'admin'), getCountersList);

/**
 * @route   GET /api/counters/:id
 * @desc    Lấy chi tiết quầy
 * @access  Private (Worker/Manager/Admin)
 */
router.get('/:id', authenticate, authorize('worker', 'manager', 'admin'), getCounterById);

/**
 * @route   POST /api/counters
 * @desc    Tạo quầy mới
 * @access  Private (Worker/Manager/Admin) - Worker có thể tạo counter khi làm việc
 */
router.post('/', authenticate, authorize('worker', 'manager', 'admin'), createCounter);

/**
 * @route   PUT /api/counters/:id
 * @desc    Cập nhật quầy
 * @access  Private (Worker/Manager/Admin)
 */
router.put('/:id', authenticate, authorize('worker', 'manager', 'admin'), updateCounter);

/**
 * @route   DELETE /api/counters/:id
 * @desc    Xóa/Deactivate quầy
 * @access  Private (Worker/Manager/Admin)
 */
router.delete('/:id', authenticate, authorize('worker', 'manager', 'admin'), deleteCounter);

export default router;
