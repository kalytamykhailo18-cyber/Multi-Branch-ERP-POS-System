import apiClient from './client';
import type { Invoice, ApiResponse, PaginatedResponse } from '../../types';

export interface InvoiceFilters {
  page?: number;
  limit?: number;
  branch_id?: string;
  invoice_type?: string;
  status?: string;
  start_date?: string;
  end_date?: string;
  search?: string;
}

export interface GenerateInvoiceData {
  sale_id: string;
  invoice_type: 'A' | 'B' | 'C';
  customer_id?: string;
  customer_data?: {
    name?: string;
    document_type?: string;
    document_number?: string;
    tax_condition?: string;
    address?: string;
  };
}

export interface InvoiceStats {
  by_type: Array<{
    invoice_type: string;
    count: number;
    total: number;
  }>;
  totals: {
    total_count: number;
    total_amount: number;
    total_tax: number;
  };
  pending_count: number;
}

export interface PrintData {
  invoice: {
    type: string;
    number: string;
    date: string;
    cae: string | null;
    cae_expiration: string | null;
  };
  branch: {
    name: string;
    address: string;
    cuit: string;
    tax_condition: string;
  };
  customer: {
    name: string;
    document_type: string;
    document_number: string | null;
    tax_condition: string;
    address: string | null;
  };
  items: Array<{
    code: string;
    description: string;
    quantity: number;
    unit_price: number;
    subtotal: number;
    tax_amount: number;
    total: number;
  }>;
  totals: {
    subtotal: number;
    tax: number;
    total: number;
  };
}

const invoiceService = {
  // Get all invoices with pagination and filters
  getAll: async (filters: InvoiceFilters = {}): Promise<PaginatedResponse<Invoice>> => {
    const params = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        params.append(key, String(value));
      }
    });

    const response = await apiClient.get<PaginatedResponse<Invoice>>(
      `/invoices?${params.toString()}`
    );
    return response.data;
  },

  // Get invoice by ID
  getById: async (id: string): Promise<ApiResponse<Invoice>> => {
    const response = await apiClient.get<ApiResponse<Invoice>>(`/invoices/${id}`);
    return response.data;
  },

  // Get invoices by sale
  getBySale: async (saleId: string): Promise<ApiResponse<Invoice[]>> => {
    const response = await apiClient.get<ApiResponse<Invoice[]>>(`/invoices/sale/${saleId}`);
    return response.data;
  },

  // Generate invoice for a sale
  generate: async (data: GenerateInvoiceData): Promise<ApiResponse<Invoice>> => {
    const response = await apiClient.post<ApiResponse<Invoice>>('/invoices/generate', data);
    return response.data;
  },

  // Submit invoice to AFIP
  submitToAFIP: async (id: string): Promise<ApiResponse<Invoice>> => {
    const response = await apiClient.post<ApiResponse<Invoice>>(`/invoices/${id}/submit-afip`);
    return response.data;
  },

  // Void invoice
  void: async (id: string, reason: string): Promise<ApiResponse<null>> => {
    const response = await apiClient.post<ApiResponse<null>>(`/invoices/${id}/void`, { reason });
    return response.data;
  },

  // Create credit note
  createCreditNote: async (
    id: string,
    data: { reason: string; items?: Array<{ amount: number }> }
  ): Promise<ApiResponse<Invoice>> => {
    const response = await apiClient.post<ApiResponse<Invoice>>(
      `/invoices/${id}/credit-note`,
      data
    );
    return response.data;
  },

  // Get invoice statistics
  getStats: async (filters: {
    branch_id?: string;
    start_date?: string;
    end_date?: string;
  }): Promise<ApiResponse<InvoiceStats>> => {
    const params = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        params.append(key, String(value));
      }
    });

    const response = await apiClient.get<ApiResponse<InvoiceStats>>(
      `/invoices/stats?${params.toString()}`
    );
    return response.data;
  },

  // Get print data for invoice
  getPrintData: async (id: string): Promise<ApiResponse<PrintData>> => {
    const response = await apiClient.get<ApiResponse<PrintData>>(`/invoices/${id}/print`);
    return response.data;
  },

  // Retry pending invoices
  retryPending: async (branchId?: string): Promise<ApiResponse<{ processed: number; failed: number }>> => {
    const response = await apiClient.post<ApiResponse<{ processed: number; failed: number }>>(
      '/invoices/retry-pending',
      { branch_id: branchId }
    );
    return response.data;
  },
};

export default invoiceService;
