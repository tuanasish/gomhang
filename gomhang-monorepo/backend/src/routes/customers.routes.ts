import { Router } from 'express';
import { getCustomersList, getCustomerById, createCustomer, updateCustomer, deleteCustomer } from '../controllers/customers.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

const router = Router();

/**
 * @route   GET /api/customers
 * @desc    Lấy danh sách khách hàng
 * @access  Private (Worker/Manager/Admin)
 */
router.get('/', authenticate, authorize('worker', 'manager', 'admin'), getCustomersList);

/**
 * @route   GET /api/customers/:id
 * @desc    Lấy chi tiết khách hàng
 * @access  Private (Worker/Manager/Admin)
 */
router.get('/:id', authenticate, authorize('worker', 'manager', 'admin'), getCustomerById);

/**
 * @route   POST /api/customers
 * @desc    Tạo khách hàng mới
 * @access  Private (Worker/Manager/Admin) - Worker có thể tạo customer khi làm việc
 */
router.post('/', authenticate, authorize('worker', 'manager', 'admin'), createCustomer);

/**
 * @route   PUT /api/customers/:id
 * @desc    Cập nhật khách hàng
 * @access  Private (Worker/Manager/Admin)
 */
router.put('/:id', authenticate, authorize('worker', 'manager', 'admin'), updateCustomer);

/**
 * @route   DELETE /api/customers/:id
 * @desc    Xóa khách hàng
 * @access  Private (Worker/Manager/Admin)
 */
router.delete('/:id', authenticate, authorize('worker', 'manager', 'admin'), deleteCustomer);

export default router;
