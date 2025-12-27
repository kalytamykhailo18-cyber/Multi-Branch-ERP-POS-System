const jwt = require('jsonwebtoken');
const { User, Role, Branch } = require('../database/models');
const logger = require('../utils/logger');

/**
 * Socket.IO event types
 */
const EVENTS = {
  // Sales events
  SALE_CREATED: 'SALE_CREATED',
  SALE_VOIDED: 'SALE_VOIDED',

  // Register session events
  SESSION_OPENED: 'SESSION_OPENED',
  SESSION_CLOSED: 'SESSION_CLOSED',

  // Alert events
  ALERT_CREATED: 'ALERT_CREATED',
  ALERT_READ: 'ALERT_READ',
  ALERT_RESOLVED: 'ALERT_RESOLVED',

  // Stock events
  STOCK_LOW: 'STOCK_LOW',
  STOCK_UPDATED: 'STOCK_UPDATED',

  // Sync events
  SYNC_COMPLETED: 'SYNC_COMPLETED',
  SYNC_CONFLICT: 'SYNC_CONFLICT',

  // Price events
  PRICE_UPDATED: 'PRICE_UPDATED',

  // General
  NOTIFICATION: 'NOTIFICATION'
};

/**
 * Connected users map: userId -> socket
 */
const connectedUsers = new Map();

/**
 * Branch rooms: branchId -> Set of socket IDs
 */
const branchRooms = new Map();

/**
 * Setup Socket.IO with authentication and event handling
 * @param {Server} io - Socket.IO server instance
 */
const setupSocketIO = (io) => {
  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];

      if (!token) {
        return next(new Error('Authentication required'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user with role
      const user = await User.findByPk(decoded.user_id, {
        include: [{ model: Role, as: 'role' }]
      });

      if (!user || !user.is_active) {
        return next(new Error('User not found or inactive'));
      }

      // Attach user info to socket
      socket.user = {
        id: user.id,
        email: user.email,
        role_name: user.role.name,
        branch_id: decoded.branch_id,
        permissions: {
          canViewAllBranches: user.role.can_view_all_branches
        }
      };

      next();
    } catch (error) {
      logger.error('Socket authentication error:', error);
      next(new Error('Invalid token'));
    }
  });

  // Connection handler
  io.on('connection', (socket) => {
    const userId = socket.user.id;
    const branchId = socket.user.branch_id;

    logger.info(`User ${userId} connected via WebSocket`);

    // Track connected user
    connectedUsers.set(userId, socket);

    // Join branch room if assigned
    if (branchId) {
      socket.join(`branch:${branchId}`);

      if (!branchRooms.has(branchId)) {
        branchRooms.set(branchId, new Set());
      }
      branchRooms.get(branchId).add(socket.id);
    }

    // Users with canViewAllBranches join all branch rooms
    if (socket.user.permissions.canViewAllBranches) {
      socket.join('owners');
    }

    // Handle room subscription (for switching branches)
    socket.on('subscribe:branch', (newBranchId) => {
      // Leave current branch room
      if (branchId && branchId !== newBranchId) {
        socket.leave(`branch:${branchId}`);
        const room = branchRooms.get(branchId);
        if (room) {
          room.delete(socket.id);
        }
      }

      // Join new branch room
      socket.join(`branch:${newBranchId}`);
      if (!branchRooms.has(newBranchId)) {
        branchRooms.set(newBranchId, new Set());
      }
      branchRooms.get(newBranchId).add(socket.id);

      logger.info(`User ${userId} subscribed to branch ${newBranchId}`);
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      logger.info(`User ${userId} disconnected from WebSocket`);

      connectedUsers.delete(userId);

      // Remove from branch rooms
      branchRooms.forEach((sockets, branchId) => {
        sockets.delete(socket.id);
        if (sockets.size === 0) {
          branchRooms.delete(branchId);
        }
      });
    });

    // Handle errors
    socket.on('error', (error) => {
      logger.error(`Socket error for user ${userId}:`, error);
    });
  });

  // Attach emit helpers to io for use in controllers
  io.emitToUser = (userId, event, data) => {
    const socket = connectedUsers.get(userId);
    if (socket) {
      socket.emit(event, {
        event,
        data,
        timestamp: new Date().toISOString()
      });
    }
  };

  io.emitToBranch = (branchId, event, data) => {
    io.to(`branch:${branchId}`).emit(event, {
      event,
      data,
      branch_id: branchId,
      timestamp: new Date().toISOString()
    });
  };

  io.emitToOwners = (event, data, branchId = null) => {
    io.to('owners').emit(event, {
      event,
      data,
      branch_id: branchId,
      timestamp: new Date().toISOString()
    });
  };

  io.emitToAll = (event, data) => {
    io.emit(event, {
      event,
      data,
      timestamp: new Date().toISOString()
    });
  };

  logger.info('Socket.IO configured successfully');
};

/**
 * Get list of connected user IDs
 * @returns {string[]} Array of user IDs
 */
const getConnectedUsers = () => {
  return Array.from(connectedUsers.keys());
};

/**
 * Check if user is connected
 * @param {string} userId - User ID
 * @returns {boolean}
 */
const isUserConnected = (userId) => {
  return connectedUsers.has(userId);
};

/**
 * Get users connected to a branch
 * @param {string} branchId - Branch ID
 * @returns {string[]} Array of socket IDs
 */
const getBranchConnections = (branchId) => {
  const room = branchRooms.get(branchId);
  return room ? Array.from(room) : [];
};

module.exports = {
  setupSocketIO,
  EVENTS,
  getConnectedUsers,
  isUserConnected,
  getBranchConnections
};
