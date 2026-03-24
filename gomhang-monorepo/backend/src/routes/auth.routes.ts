import { Router } from 'express';
import { registerFirstAdmin, register, login, refreshToken, getCurrentUser, logout } from '../controllers/auth.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

const router = Router();

/**
 * @route   POST /api/auth/register-first-admin
 * @desc    Register first admin (public, only if no admin exists)
 * @access  Public (only for first admin)
 */
router.post('/register-first-admin', registerFirstAdmin);

/**
 * @route   POST /api/auth/register
 * @desc    Register new user (admin only)
 * @access  Private (Admin)
 */
router.post('/register', authenticate, authorize('admin'), register);

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login', login);

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh access token
 * @access  Public
 */
router.post('/refresh', refreshToken);

/**
 * @route   GET /api/auth/me
 * @desc    Get current user info
 * @access  Private
 */
router.get('/me', authenticate, getCurrentUser);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user (optional auth - allow logout even if token expired)
 * @access  Public (optional auth)
 */
router.post('/logout', logout);

export default router;
