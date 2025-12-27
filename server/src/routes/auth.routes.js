const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth');
const {
  validate,
  emailField,
  passwordField,
  pinField,
  uuidField,
  stringField,
  body
} = require('../middleware/validate');

/**
 * @route   POST /api/v1/auth/login
 * @desc    Login with email and password
 * @access  Public
 */
router.post(
  '/login',
  [
    emailField('email'),
    body('password').notEmpty().withMessage('Password is required'),
    uuidField('branch_id', false),
    stringField('device_info', { required: false, maxLength: 255 }),
    validate
  ],
  authController.login
);

/**
 * @route   POST /api/v1/auth/pin-login
 * @desc    Quick login with PIN (for POS)
 * @access  Public
 */
router.post(
  '/pin-login',
  [
    uuidField('user_id'),
    pinField('pin_code'),
    uuidField('branch_id'),
    validate
  ],
  authController.pinLogin
);

/**
 * @route   POST /api/v1/auth/logout
 * @desc    Logout current session
 * @access  Private
 */
router.post('/logout', authenticate, authController.logout);

/**
 * @route   POST /api/v1/auth/logout-all
 * @desc    Logout all sessions for current user
 * @access  Private
 */
router.post('/logout-all', authenticate, authController.logoutAll);

/**
 * @route   GET /api/v1/auth/me
 * @desc    Get current user info
 * @access  Private
 */
router.get('/me', authenticate, authController.getMe);

/**
 * @route   PUT /api/v1/auth/password
 * @desc    Change password
 * @access  Private
 */
router.put(
  '/password',
  authenticate,
  [
    body('current_password').notEmpty().withMessage('Current password is required'),
    passwordField('new_password'),
    validate
  ],
  authController.changePassword
);

/**
 * @route   PUT /api/v1/auth/pin
 * @desc    Set or change PIN
 * @access  Private
 */
router.put(
  '/pin',
  authenticate,
  [
    pinField('pin_code'),
    validate
  ],
  authController.setPin
);

/**
 * @route   POST /api/v1/auth/refresh
 * @desc    Refresh access token
 * @access  Public
 */
router.post(
  '/refresh',
  [
    body('refresh_token').notEmpty().withMessage('Refresh token is required'),
    validate
  ],
  authController.refreshToken
);

/**
 * @route   GET /api/v1/auth/sessions
 * @desc    Get active sessions for current user
 * @access  Private
 */
router.get('/sessions', authenticate, authController.getSessions);

/**
 * @route   DELETE /api/v1/auth/sessions/:sessionId
 * @desc    Revoke specific session
 * @access  Private
 */
router.delete('/sessions/:sessionId', authenticate, authController.revokeSession);

module.exports = router;
