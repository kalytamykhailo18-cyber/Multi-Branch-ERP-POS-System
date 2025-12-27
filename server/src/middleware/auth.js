const jwt = require('jsonwebtoken');
const { User, Role, UserSession, Branch } = require('../database/models');
const { UnauthorizedError, ForbiddenError } = require('./errorHandler');

/**
 * Authenticate user via JWT token
 * Adds user and session info to req object
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('No token provided', 'E103');
    }

    const token = authHeader.split(' ')[1];

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if session exists and is valid
    const session = await UserSession.findByPk(decoded.session_id);

    if (!session || session.revoked_at) {
      throw new UnauthorizedError('Session invalid or revoked', 'E103');
    }

    if (new Date(session.expires_at) < new Date()) {
      throw new UnauthorizedError('Session expired', 'E102');
    }

    // Get user with role
    const user = await User.findByPk(decoded.user_id, {
      include: [
        { model: Role, as: 'role' },
        { model: Branch, as: 'primary_branch' }
      ]
    });

    if (!user || !user.is_active) {
      throw new UnauthorizedError('User not found or inactive', 'E101');
    }

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

    // Attach to request
    req.user = {
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      role_id: user.role_id,
      role_name: user.role.name,
      branch_id: decoded.branch_id || user.primary_branch_id,
      permissions
    };
    req.session_id = session.id;

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Optional authentication - doesn't fail if no token
 * Useful for endpoints that work differently with/without auth
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    return authenticate(req, res, next);
  } catch (error) {
    // Ignore auth errors in optional mode
    next();
  }
};

/**
 * Check if user has specific permission
 * @param {string} permission - Permission key (e.g., 'canVoidSale')
 */
const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new UnauthorizedError('Authentication required'));
    }

    if (!req.user.permissions[permission]) {
      return next(new ForbiddenError(`Permission '${permission}' required`));
    }

    next();
  };
};

/**
 * Check if user has any of the specified permissions
 * @param {string[]} permissions - Array of permission keys
 */
const requireAnyPermission = (permissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new UnauthorizedError('Authentication required'));
    }

    const hasPermission = permissions.some((p) => req.user.permissions[p]);

    if (!hasPermission) {
      return next(new ForbiddenError(`One of permissions [${permissions.join(', ')}] required`));
    }

    next();
  };
};

/**
 * Check if user has specific role
 * @param {string[]} roles - Array of allowed role names
 */
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new UnauthorizedError('Authentication required'));
    }

    if (!roles.includes(req.user.role_name)) {
      return next(new ForbiddenError(`Role must be one of: ${roles.join(', ')}`));
    }

    next();
  };
};

/**
 * Check if user belongs to the specified branch or has view all branches permission
 * @param {string} branchIdParam - Name of the route param containing branch ID
 */
const requireBranchAccess = (branchIdParam = 'branchId') => {
  return async (req, res, next) => {
    if (!req.user) {
      return next(new UnauthorizedError('Authentication required'));
    }

    // Users with canViewAllBranches can access any branch
    if (req.user.permissions.canViewAllBranches) {
      return next();
    }

    const requestedBranchId = req.params[branchIdParam] || req.body.branch_id || req.query.branch_id;

    if (!requestedBranchId) {
      return next();
    }

    // Check if user has access to this branch
    const user = await User.findByPk(req.user.id, {
      include: [{ model: Branch, as: 'branches' }]
    });

    const branchIds = user.branches.map((b) => b.id);
    if (user.primary_branch_id) {
      branchIds.push(user.primary_branch_id);
    }

    if (!branchIds.includes(requestedBranchId)) {
      return next(new ForbiddenError('You do not have access to this branch'));
    }

    next();
  };
};

/**
 * Verify PIN for sensitive operations
 * Expects pin in request body
 */
const verifyPin = async (req, res, next) => {
  try {
    const { pin } = req.body;

    if (!pin) {
      throw new UnauthorizedError('PIN required for this operation', 'E106');
    }

    const user = await User.findByPk(req.user.id);

    if (!user.pin_code) {
      throw new UnauthorizedError('PIN not set. Please set a PIN first.', 'E106');
    }

    if (user.pin_code !== pin) {
      throw new UnauthorizedError('Invalid PIN', 'E107');
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Verify manager PIN for authorization
 * Looks up manager by PIN and validates permission
 */
const verifyManagerPin = (requiredPermission) => {
  return async (req, res, next) => {
    try {
      const { manager_pin } = req.body;

      if (!manager_pin) {
        throw new UnauthorizedError('Manager PIN required for authorization', 'E106');
      }

      // Find user with this PIN
      const manager = await User.findOne({
        where: { pin_code: manager_pin, is_active: true },
        include: [{ model: Role, as: 'role' }]
      });

      if (!manager) {
        throw new UnauthorizedError('Invalid manager PIN', 'E107');
      }

      // Check permission
      if (!manager.role[requiredPermission]) {
        throw new ForbiddenError('Manager does not have required permission');
      }

      // Attach manager info to request
      req.authorized_by = {
        id: manager.id,
        name: `${manager.first_name} ${manager.last_name}`
      };

      next();
    } catch (error) {
      next(error);
    }
  };
};

module.exports = {
  authenticate,
  optionalAuth,
  requirePermission,
  requireAnyPermission,
  requireRole,
  requireBranchAccess,
  verifyPin,
  verifyManagerPin
};
