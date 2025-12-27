import { io, Socket } from 'socket.io-client';
import { store } from '../store';
import { addAlert } from '../store/slices/alertsSlice';
import { setOnlineStatus } from '../store/slices/uiSlice';
import type { Alert, UUID } from '../types';

const SOCKET_URL = import.meta.env.VITE_WS_URL || 'http://localhost:3000';

class SocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  connect(token: string): void {
    if (this.socket?.connected) {
      return;
    }

    this.socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 3000,
    });

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      console.log('Socket connected');
      this.reconnectAttempts = 0;
      store.dispatch(setOnlineStatus(true));

      // Join appropriate rooms
      const state = store.getState();
      const branchId = state.auth.currentBranch?.id;
      const isOwner = state.auth.user?.role?.permissions?.canAccessAllBranches;

      if (branchId) {
        this.joinBranch(branchId);
      }

      if (isOwner) {
        this.joinOwners();
      }
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      store.dispatch(setOnlineStatus(false));
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      this.reconnectAttempts++;

      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        store.dispatch(setOnlineStatus(false));
      }
    });

    // Business events
    this.socket.on('SALE_CREATED', (data: { sale_id: UUID; sale_number: string; total_amount: number }) => {
      console.log('Sale created:', data);
      // Could dispatch action to update dashboard if needed
    });

    this.socket.on('SALE_VOIDED', (data: { sale_id: UUID; sale_number: string }) => {
      console.log('Sale voided:', data);
    });

    this.socket.on('SESSION_CLOSED', (data: {
      session_id: UUID;
      branch_id: UUID;
      register_id?: UUID;
      discrepancy: number;
    }) => {
      console.log('Session closed:', data);
    });

    this.socket.on('ALERT_CREATED', (alert: Alert) => {
      console.log('New alert:', alert);
      store.dispatch(addAlert(alert));

      // Could show toast notification for critical alerts
      if (alert.severity === 'CRITICAL' || alert.severity === 'ERROR') {
        // Toast notification is handled by the alerts slice
      }
    });

    this.socket.on('STOCK_LOW', (data: {
      branch_id: UUID;
      product_id: UUID;
      product_name: string;
      current_stock: number;
      min_stock: number;
    }) => {
      console.log('Low stock warning:', data);
    });

    this.socket.on('PRICE_CHANGED', (data: {
      product_id: UUID;
      product_name: string;
      old_price: number;
      new_price: number;
    }) => {
      console.log('Price changed:', data);
    });
  }

  joinBranch(branchId: UUID): void {
    if (!this.socket?.connected) return;
    this.socket.emit('JOIN_BRANCH', branchId);
  }

  leaveBranch(branchId: UUID): void {
    if (!this.socket?.connected) return;
    this.socket.emit('LEAVE_BRANCH', branchId);
  }

  joinOwners(): void {
    if (!this.socket?.connected) return;
    this.socket.emit('JOIN_OWNERS');
  }

  leaveOwners(): void {
    if (!this.socket?.connected) return;
    this.socket.emit('LEAVE_OWNERS');
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  // Emit custom events
  emit(event: string, data?: unknown): void {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    }
  }

  // Subscribe to custom events
  on(event: string, callback: (...args: unknown[]) => void): void {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  // Unsubscribe from events
  off(event: string, callback?: (...args: unknown[]) => void): void {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }
}

export const socketService = new SocketService();
export default socketService;
