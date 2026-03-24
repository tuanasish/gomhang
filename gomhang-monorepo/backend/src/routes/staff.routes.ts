import { Router } from 'express';
import { getStaffList, createStaff, updateStaff, deleteStaff } from '../controllers/staff.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

const router = Router();

/**
 * @route   GET /api/staff
 * @desc    Lấy danh sách nhân viên
 * @access  Private (Admin/Manager)
 */
router.get('/', authenticate, authorize('manager', 'admin'), getStaffList);

/**
 * @route   POST /api/staff
 * @desc    Tạo nhân viên mới
 * @access  Private (Admin/Manager)
 */
router.post('/', authenticate, authorize('manager', 'admin'), createStaff);

/**
 * @route   PUT /api/staff/:id
 * @desc    Cập nhật thông tin nhân viên
 * @access  Private (Admin/Manager)
 */
router.put('/:id', authenticate, authorize('manager', 'admin'), updateStaff);

/**
 * @route   DELETE /api/staff/:id
 * @desc    Xóa nhân viên
 * @access  Private (Admin only)
 */
router.delete('/:id', authenticate, authorize('admin'), deleteStaff);

export default router;
