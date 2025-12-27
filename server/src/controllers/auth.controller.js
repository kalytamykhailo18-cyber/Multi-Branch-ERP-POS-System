const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { User, Role, Branch, UserSession } = require('../database/models');
const { success, created, unauthorized, notFound } = require('../utils/apiResponse');
const { UnauthorizedError, NotFoundError, BusinessError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

// Max failed login attempts before lockout
const MAX_LOGIN_ATTEMPTS = 5;
// Lockout duration in minutes
const LOCKOUT_DURATION = 15;

/**
 * Generate JWT token
 * @param {Object} user - User object
 * @param {string} sessionId - Session ID
 * @param {string} branchId - Branch ID
 * @returns {Object} { token, expiresAt }
 */
const generateToken = (user, sessionId, branchId) => {
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
  const expiresAt = new Date();

  // Parse expiry time
  const match = expiresIn.match(/^(\d+)([dhms])$/);
  if (match) {
    const value = parseInt(match[1]);
    const unit = match[2];
    switch (unit) {
      case 'd': expiresAt.setDate(expiresAt.getDate() + value); break;
      case 'h': expiresAt.setHours(expiresAt.getHours() + value); break;
      case 'm': expiresAt.setMinutes(expiresAt.getMinutes() + value); break;
      case 's': expiresAt.setSeconds(expiresAt.getSeconds() + value); break;
    }
  }

  const token = jwt.sign(
    {
      user_id: user.id,
      session_id: sessionId,
      branch_id: branchId,
      role_name: user.role.name
    },
    process.env.JWT_SECRET,
    { expiresIn }
  );

  return { token, expiresAt: expiresAt.toISOString() };
};

/**
 * Login with email and password
 * POST /api/v1/auth/login
 */
exports.login = async (req, res, next) => {
  try {
    const { email, password, branch_id, device_info } = req.body;

    // Find user with role
    const user = await User.findOne({
      where: { email },
      include: [
        { model: Role, as: 'role' },
        { model: Branch, as: 'primary_branch' }
      ]
    });

    if (!user) {
      throw new UnauthorizedError('Invalid credentials', 'E101');
    }

    // Check if account is locked
    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      const minutesLeft = Math.ceil((new Date(user.locked_until) - new Date()) / 60000);
      throw new UnauthorizedError(
        `Account locked. Try again in ${minutesLeft} minutes.`,
        'E104'
      );
    }

    // Check if user is active
    if (!user.is_active) {
      throw new UnauthorizedError('Account is deactivated', 'E101');
    }

    // Validate password
    const isValid = await user.validatePassword(password);

    if (!isValid) {
      // Increment failed attempts
      user.failed_login_attempts += 1;

      if (user.failed_login_attempts >= MAX_LOGIN_ATTEMPTS) {
        user.locked_until = new Date(Date.now() + LOCKOUT_DURATION * 60000);
        await user.save();
        throw new UnauthorizedError(
          `Too many failed attempts. Account locked for ${LOCKOUT_DURATION} minutes.`,
          'E104'
        );
      }

      await user.save();
      throw new UnauthorizedError('Invalid credentials', 'E101');
    }

    // Reset failed attempts on successful login
    user.failed_login_attempts = 0;
    user.locked_until = null;
    user.last_login_at = new Date();
    await user.save();

    // Determine branch for session
    const sessionBranchId = branch_id || user.primary_branch_id;

    // Create session
    const session = await UserSession.create({
      id: uuidv4(),
      user_id: user.id,
      token_hash: uuidv4(), // We'll use this as a unique session identifier
      device_info,
      ip_address: req.ip,
      branch_id: sessionBranchId,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    });

    // Generate token
    const { token, expiresAt } = generateToken(user, session.id, sessionBranchId);

    // Build permissions object
    const permissions = {
      canVoidSale: user.role.can_void_sale,
      canGiveDiscount: user.role.can_give_discount,
      canViewAllBranches: user.role.can_view_all_branches,
      canCloseRegister: user.role.can_close_register,
      canReopenClosing: user.role.can_reopen_closing,
      canAdjustStock: user.role.can_adjust_stock,
      canImportPrices: user.role.can_import_prices,
      canManageUsers: user.role.can_manage_users,
      canViewReports: user.role.can_view_reports,
      canViewFinancials: user.role.can_view_financials,
      canManageSuppliers: user.role.can_manage_suppliers,
      canManageProducts: user.role.can_manage_products,
      canIssueInvoiceA: user.role.can_issue_invoice_a,
      maxDiscountPercent: parseFloat(user.role.max_discount_percent)
    };

    // Get user branches
    const userWithBranches = await User.findByPk(user.id, {
      include: [{ model: Branch, as: 'branches' }]
    });

    return success(res, {
      user: {
        id: user.id,
        email: user.email,
        employee_code: user.employee_code,
        first_name: user.first_name,
        last_name: user.last_name,
        phone: user.phone,
        role: user.role,
        primary_branch: user.primary_branch,
        branches: userWithBranches.branches,
        language: user.language,
        permissions
      },
      token,
      expires_at: expiresAt
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Quick PIN login for POS
 * POST /api/v1/auth/pin-login
 */
exports.pinLogin = async (req, res, next) => {
  try {
    const { user_id, pin_code, branch_id } = req.body;

    const user = await User.findByPk(user_id, {
      include: [
        { model: Role, as: 'role' },
        { model: Branch, as: 'primary_branch' }
      ]
    });

    if (!user || !user.is_active) {
      throw new UnauthorizedError('User not found or inactive', 'E101');
    }

    if (!user.pin_code) {
      throw new UnauthorizedError('PIN not set for this user', 'E106');
    }

    if (user.pin_code !== pin_code) {
      throw new UnauthorizedError('Invalid PIN', 'E107');
    }

    // Create session
    const session = await UserSession.create({
      id: uuidv4(),
      user_id: user.id,
      token_hash: uuidv4(),
      device_info: 'POS PIN Login',
      ip_address: req.ip,
      branch_id,
      expires_at: new Date(Date.now() + 12 * 60 * 60 * 1000) // 12 hours for POS
    });

    // Update last login
    user.last_login_at = new Date();
    await user.save();

    // Generate token
    const { token, expiresAt } = generateToken(user, session.id, branch_id);

    // Build permissions
    const permissions = {
      canVoidSale: user.role.can_void_sale,
      canGiveDiscount: user.role.can_give_discount,
      canCloseRegister: user.role.can_close_register,
      maxDiscountPercent: parseFloat(user.role.max_discount_percent)
    };

    return success(res, {
      user: {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        role_name: user.role.name,
        permissions
      },
      token,
      expires_at: expiresAt
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Logout current session
 * POST /api/v1/auth/logout
 */
exports.logout = async (req, res, next) => {
  try {
    await UserSession.update(
      { revoked_at: new Date() },
      { where: { id: req.session_id } }
    );

    return success(res, null, 'Logged out successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Logout all sessions for current user
 * POST /api/v1/auth/logout-all
 */
exports.logoutAll = async (req, res, next) => {
  try {
    const result = await UserSession.update(
      { revoked_at: new Date() },
      { where: { user_id: req.user.id, revoked_at: null } }
    );

    return success(res, { sessions_revoked: result[0] }, 'All sessions logged out');
  } catch (error) {
    next(error);
  }
};

/**
 * Get current user info
 * GET /api/v1/auth/me
 */
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id, {
      include: [
        { model: Role, as: 'role' },
        { model: Branch, as: 'primary_branch' },
        { model: Branch, as: 'branches' }
      ]
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    const userData = user.toJSON();
    userData.permissions = req.user.permissions;

    return success(res, userData);
  } catch (error) {
    next(error);
  }
};

/**
 * Change password
 * PUT /api/v1/auth/password
 */
exports.changePassword = async (req, res, next) => {
  try {
    const { current_password, new_password } = req.body;

    const user = await User.findByPk(req.user.id);

    const isValid = await user.validatePassword(current_password);
    if (!isValid) {
      throw new UnauthorizedError('Current password is incorrect', 'E101');
    }

    user.password_hash = new_password; // Will be hashed by beforeUpdate hook
    await user.save();

    // Revoke all other sessions
    await UserSession.update(
      { revoked_at: new Date() },
      {
        where: {
          user_id: req.user.id,
          id: { [require('sequelize').Op.ne]: req.session_id }
        }
      }
    );

    return success(res, null, 'Password changed successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Set or change PIN
 * PUT /api/v1/auth/pin
 */
exports.setPin = async (req, res, next) => {
  try {
    const { pin_code } = req.body;

    await User.update(
      { pin_code },
      { where: { id: req.user.id } }
    );

    return success(res, null, 'PIN set successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Refresh access token
 * POST /api/v1/auth/refresh
 */
exports.refreshToken = async (req, res, next) => {
  try {
    const { refresh_token } = req.body;

    // Verify the refresh token (in this simplified version, we use session lookup)
    const session = await UserSession.findOne({
      where: { token_hash: refresh_token, revoked_at: null }
    });

    if (!session || new Date(session.expires_at) < new Date()) {
      throw new UnauthorizedError('Invalid or expired refresh token', 'E102');
    }

    const user = await User.findByPk(session.user_id, {
      include: [{ model: Role, as: 'role' }]
    });

    if (!user || !user.is_active) {
      throw new UnauthorizedError('User not found or inactive', 'E101');
    }

    // Generate new token
    const { token, expiresAt } = generateToken(user, session.id, session.branch_id);

    return success(res, { token, expires_at: expiresAt });
  } catch (error) {
    next(error);
  }
};

/**
 * Get active sessions for current user
 * GET /api/v1/auth/sessions
 */
exports.getSessions = async (req, res, next) => {
  try {
    const sessions = await UserSession.findAll({
      where: {
        user_id: req.user.id,
        revoked_at: null,
        expires_at: { [require('sequelize').Op.gt]: new Date() }
      },
      include: [{ model: Branch, as: 'branch' }],
      order: [['created_at', 'DESC']]
    });

    return success(res, sessions.map((s) => ({
      id: s.id,
      device_info: s.device_info,
      ip_address: s.ip_address,
      branch_name: s.branch?.name,
      created_at: s.created_at,
      expires_at: s.expires_at,
      is_current: s.id === req.session_id
    })));
  } catch (error) {
    next(error);
  }
};

/**
 * Revoke specific session
 * DELETE /api/v1/auth/sessions/:sessionId
 */
exports.revokeSession = async (req, res, next) => {
  try {
    const { sessionId } = req.params;

    const session = await UserSession.findOne({
      where: { id: sessionId, user_id: req.user.id }
    });

    if (!session) {
      throw new NotFoundError('Session not found');
    }

    session.revoked_at = new Date();
    await session.save();

    return success(res, null, 'Session revoked successfully');
  } catch (error) {
    next(error);
  }
};
