// frontend/lib/financialService.ts - COMPLETE FIXED VERSION

import api from './axios';

// 🔥 helper to always attach token
const getAuthHeaders = () => {
  const token = localStorage.getItem("access");
  return token
    ? { Authorization: `Bearer ${token}` }
    : {};
};

export interface RevenueRecord {
  id: number;
  property: string;
  property_id: number;
  guest: string;
  source: string;
  date: string;
  check_in?: string;
  check_out?: string;
  nights: number;
  amount: number;
  price_per_night?: number;
  expenses: number;
  commission: number;
  net_profit: number;
  status: string;
  booking_source?: string;
  guest_name?: string;
}

export interface RevenueStats {
  totalRevenue: number;
  totalBookings: number;
  avgPerBooking: number;
  topPlatform: string;
  growth: number;
  transactions: RevenueRecord[];
}

export interface MonthlySummary {
  month: number;
  month_name: string;
  revenue: number;
  expenses: number;
  commission: number;
  net_profit: number;
}

export interface Property {
  id: number;
  name: string;
  location: string;
  bedrooms: number;
  bathrooms: number;
  max_guests: number;
  price_per_night: number;
}

export const financialService = {
  async getRevenueStats(): Promise<RevenueStats> {
    try {
      const response = await api.get('/financials/revenue-stats/', {
        headers: getAuthHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching revenue stats:', error);
      return {
        totalRevenue: 0,
        totalBookings: 0,
        avgPerBooking: 0,
        topPlatform: 'N/A',
        growth: 0,
        transactions: []
      };
    }
  },

  async getRevenueRecords(params?: {
    property_id?: number;
    year?: number;
    month?: number;
    source?: string;
    search?: string;
  }): Promise<RevenueRecord[]> {
    try {
      const response = await api.get('/financials/revenue-records/', {
        params,
        headers: getAuthHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching revenue records:', error);
      return [];
    }
  },

  async getRevenueSummary(year?: number): Promise<MonthlySummary[]> {
    try {
      const response = await api.get('/financials/revenue-summary/', { 
        params: { year: year || new Date().getFullYear() },
        headers: getAuthHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching revenue summary:', error);
      return [];
    }
  },

  async getProperties(): Promise<Property[]> {
    try {
      const response = await api.get('/financials/properties/', {
        headers: getAuthHeaders(),
      });
      return response.data.results || response.data;
    } catch (error) {
      console.error('Error fetching properties:', error);
      return [];
    }
  },

  async importCSV(file: File): Promise<{ status: string; imported_count: number }> {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await api.post('/financials/import-csv/', formData, {
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  async createFinancialRecord(data: {
    property_id: number;
    month: number;
    year: number;
    price_per_night: number;
    nights: number;
    revenue: number;
    expenses?: number;
    commission_rate?: number;
    guest_name: string;
    booking_source: string;
    check_in: string;
    check_out: string;
  }) {
    const response = await api.post(
      "/financials/financial-records/",
      data,
      {
        headers: getAuthHeaders(),
      }
    );
    return response.data;
  },

  async updateFinancialRecord(id: number, data: any): Promise<any> {
    try {
      const response = await api.put(`/financials/financial-records/${id}/`, data, {
        headers: getAuthHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error('Error updating financial record:', error);
      throw error;
    }
  },

  async deleteFinancialRecord(id: number): Promise<void> {
    try {
      await api.delete(`/financials/financial-records/${id}/`, {
        headers: getAuthHeaders(),
      });
    } catch (error) {
      console.error('Error deleting financial record:', error);
      throw error;
    }
  },
};