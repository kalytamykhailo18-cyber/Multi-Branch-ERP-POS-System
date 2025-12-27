const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { User, Role, Branch, Session, sequelize } = require('../database/models');
const { UnauthorizedError, BusinessError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '8h';
const PIN_JWT_EXPIRES_IN = '12h';
const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_TIME_MINUTES = 30;

class AuthService {
  async validateCredentials(email, password) {
    const user = await User.findOne({
      where: { email: email.toLowerCase() },
      include: [
        { model: Role, as: 'role' },
        { model: Branch, as: 'primary_branch' }
      ]
    });

    if (!user) {
      throw new UnauthorizedError('Invalid credentials');
    }

    // Check if account is locked
    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      const remainingMinutes = Math.ceil((new Date(user.locked_until) - new Date()) / 60000);
      throw new UnauthorizedError(`Account locked. Try again in ${remainingMinutes} minutes`);
    }

    // Check if user is active
    if (!user.is_active) {
      throw new UnauthorizedError('Account is disabled');
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      // Increment failed attempts
      const failedAttempts = (user.failed_login_attempts || 0) + 1;
      const updateData = { failed_login_attempts: failedAttempts };

      if (failedAttempts >= MAX_LOGIN_ATTEMPTS) {
        const lockUntil = new Date();
        lockUntil.setMinutes(lockUntil.getMinutes() + LOCK_TIME_MINUTES);
        updateData.locked_until = lockUntil;
        logger.warn(`Account locked for user ${user.email} after ${MAX_LOGIN_ATTEMPTS} failed attempts`);
      }

      await user.update(updateData);
      throw new UnauthorizedError('Invalid credentials');
    }

    // Reset failed attempts on successful login
    await user.update({
      failed_login_attempts: 0,
      locked_until: null,
      last_login_at: new Date()
    });

    return user;
  }

  async validatePIN(userId, pin, branchId) {
    const user = await User.findByPk(userId, {
      include: [
        { model: Role, as: 'role' },
        { model: Branch, as: 'branches' }
      ]
    });

    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    if (!user.is_active) {
      throw new UnauthorizedError('Account is disabled');
    }

    // Check if user has access to this branch
    const hasBranchAccess = user.branches.some((b) => b.id === branchId);
    if (!hasBranchAccess && user.primary_branch_id !== branchId) {
      throw new UnauthorizedError('No access to this branch');
    }

    // Verify PIN
    if (!user.pin_hash) {
      throw new BusinessError('PIN not configured for this user');
    }

    const isValidPin = await bcrypt.compare(pin, user.pin_hash);
    if (!isValidPin) {
      throw new UnauthorizedError('Invalid PIN');
    }

    return user;
  }

  generateToken(user, type = 'full') {
    const payload = {
      id: user.id,
      email: user.email,
      role_id: user.role_id,
      role_name: user.role?.name,
      permissions: user.role?.permissions || {},
      primary_branch_id: user.primary_branch_id,
      type
    };

    const expiresIn = type === 'pin' ? PIN_JWT_EXPIRES_IN : JWT_EXPIRES_IN;

    return jwt.sign(payload, JWT_SECRET, { expiresIn });
  }

  async createSession(user, branchId, device = {}) {
    const session = await Session.create({
      id: uuidv4(),
      user_id: user.id,
      branch_id: branchId,
      device_type: device.type || 'desktop',
      device_info: JSON.stringify(device),
      ip_address: device.ip,
      is_active: true
    });

    return session;
  }

  async invalidateSession(sessionId) {
    const session = await Session.findByPk(sessionId);
    if (session) {
      await session.update({
        is_active: false,
        ended_at: new Date()
      });
    }
  }

  async invalidateAllUserSessions(userId, exceptSessionId = null) {
    const where = { user_id: userId, is_active: true };
    if (exceptSessionId) {
      where.id = { [require('sequelize').Op.ne]: exceptSessionId };
    }

    await Session.update(
      { is_active: false, ended_at: new Date() },
      { where }
    );
  }

  async setUserPIN(userId, pin) {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new BusinessError('User not found');
    }

    const pinHash = await bcrypt.hash(pin, 10);
    await user.update({ pin_hash: pinHash });
  }

  async changePassword(userId, currentPassword, newPassword) {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new BusinessError('User not found');
    }

    const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isValidPassword) {
      throw new UnauthorizedError('Current password is incorrect');
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await user.update({ password_hash: passwordHash });

    logger.info(`Password changed for user ${user.email}`);
  }

  async resetPassword(userId, newPassword) {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new BusinessError('User not found');
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await user.update({
      password_hash: passwordHash,
      failed_login_attempts: 0,
      locked_until: null
    });

    logger.info(`Password reset for user ${user.email}`);
  }

  async unlockUser(userId) {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new BusinessError('User not found');
    }

    await user.update({
      failed_login_attempts: 0,
      locked_until: null
    });

    logger.info(`User ${user.email} unlocked`);
  }

  verifyToken(token) {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new UnauthorizedError('Token expired');
      }
      throw new UnauthorizedError('Invalid token');
    }
  }

  async getActiveSessions(userId) {
    return Session.findAll({
      where: { user_id: userId, is_active: true },
      order: [['created_at', 'DESC']]
    });
  }
}

module.exports = new AuthService();
