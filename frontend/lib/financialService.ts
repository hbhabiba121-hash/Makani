const BASE_URL = 'http://127.0.0.1:8000';

// Fonction bach t-jib l-Token dima n9i
const getAuthHeaders = () => {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem('access');
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
};

export const financialService = {
  // 1. Bach t-jibi l-Revenue (Revenue Management)
  getFinancials: async () => {
    const res = await fetch(`${BASE_URL}/api/financials/`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Error fetching financials');
    return res.json();
  },

  // 2. Bach t-jibi l-Expenses (Expense Management)
  getExpenses: async () => {
    const res = await fetch(`${BASE_URL}/api/expenses/`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Error fetching expenses');
    return res.json();
  },

  // 3. Bach t-jibi l-ar9am dyal l-Owner (Owner Dashboard)
  getOwnerEarnings: async () => {
    const res = await fetch(`${BASE_URL}/api/owner/earnings/`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Error fetching owner earnings');
    return res.json();
  },

  // 4. Bach t-jibi l-lista d les rapports (Reports Page)
  getOwnerReports: async () => {
    const res = await fetch(`${BASE_URL}/api/owner/reports/`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Error fetching reports');
    return res.json();
  }
};