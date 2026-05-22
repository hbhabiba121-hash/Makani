// frontend/app/dashboard/payments/page.tsx - FIXED WITH PROPER MONTHS & SPACING
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  DollarSign, Calendar, TrendingUp, AlertCircle, CheckCircle,
  Clock, Eye, Download, Receipt, RefreshCw,
  X, Search, Building2, User as UserIcon, FileText, ChevronDown, ChevronRight
} from "lucide-react";
import api from "@/lib/axios";

interface MonthlyPayout {
  id: string;
  owner_name: string;
  owner: number;
  property_name: string;
  property: number;
  month: string;
  month_display: string;
  year: number;
  total_revenue: number;
  commission: number;
  expenses: number;
  net_owner_earnings: number;
  amount_paid: number;
  remaining_balance: number;
  status: string;
  status_display: string;
  due_date: string;
  paid_date: string | null;
  completion_percentage: number;
  payments: Payment[];
}

interface Payment {
  id: number;
  amount: number;
  payment_method: string;
  payment_method_display: string;
  payment_date: string;
  notes: string;
  transaction_id: string;
  owner_name?: string;
  property_name?: string;
  property?: number;
  owner?: number;
}

interface PayoutDetail {
  id: number;
  owner_name: string;
  owner: number;
  property_name: string;
  property: number;
  month: string;
  total_revenue: number;
  commission: number;
  expenses: number;
  net_owner_earnings: number;
  amount_paid: number;
  remaining_balance: number;
  status: string;
  status_display: string;
  payments: Payment[];
}

export default function PaymentsPage() {
  const router = useRouter();
  const [groupedPayouts, setGroupedPayouts] = useState<MonthlyPayout[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPayout, setSelectedPayout] = useState<PayoutDetail | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<MonthlyPayout | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showStatementModal, setShowStatementModal] = useState(false);
  const [showTransactionsModal, setShowTransactionsModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [error, setError] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [availableMonths, setAvailableMonths] = useState<string[]>([]);
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  
  const [paymentForm, setPaymentForm] = useState({
    amount: "",
    payment_method: "bank_transfer",
    notes: "",
    transaction_id: "",
  });
  const [submitting, setSubmitting] = useState(false);

  // Month names in French
  const monthNames = {
    '01': 'Janvier', '02': 'Février', '03': 'Mars', '04': 'Avril',
    '05': 'Mai', '06': 'Juin', '07': 'Juillet', '08': 'Août',
    '09': 'Septembre', '10': 'Octobre', '11': 'Novembre', '12': 'Décembre'
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [payoutsRes, paymentsRes] = await Promise.all([
        api.get("/api/payments/payouts/"),
        api.get("/api/payments/payments/history/"),
      ]);
      
      const processedPayouts = processPayoutsByMonth(payoutsRes.data || []);
      
      const parsedPayments = (paymentsRes.data || []).map((p: any) => ({
        ...p,
        amount: parseFloat(p.amount) || 0,
      }));
      
      setGroupedPayouts(processedPayouts);
      setPayments(parsedPayments);
      
      const monthsSet = new Set<string>();
      const yearsSet = new Set<number>();
      processedPayouts.forEach(p => {
        monthsSet.add(p.month);
        yearsSet.add(p.year);
      });
      setAvailableMonths(Array.from(monthsSet).sort());
      setAvailableYears(Array.from(yearsSet).sort().reverse());
      
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Erreur lors du chargement des données");
    } finally {
      setLoading(false);
    }
  };

  const getMonthDisplay = (monthStr: string) => {
    if (!monthStr || monthStr.length !== 7) return monthStr;
    const [year, month] = monthStr.split('-');
    return `${monthNames[month as keyof typeof monthNames] || month} ${year}`;
  };

  const processPayoutsByMonth = (payouts: any[]): MonthlyPayout[] => {
    const groupMap = new Map<string, MonthlyPayout>();
    
    payouts.forEach((payout: any) => {
      let month = "";
      let year = 0;
      if (payout.due_date) {
        const date = new Date(payout.due_date);
        year = date.getFullYear();
        month = `${year}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      } else {
        const date = new Date();
        year = date.getFullYear();
        month = `${year}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      }
      
      const groupKey = `${payout.owner}_${payout.property}_${month}`;
      
      if (!groupMap.has(groupKey)) {
        groupMap.set(groupKey, {
          id: groupKey,
          owner_name: payout.owner_name,
          owner: payout.owner,
          property_name: payout.property_name,
          property: payout.property,
          month: month,
          month_display: getMonthDisplay(month),
          year: year,
          total_revenue: 0,
          commission: 0,
          expenses: 0,
          net_owner_earnings: 0,
          amount_paid: 0,
          remaining_balance: 0,
          status: "pending",
          status_display: "En attente",
          due_date: payout.due_date,
          paid_date: payout.paid_date,
          completion_percentage: 0,
          payments: []
        });
      }
      
      const group = groupMap.get(groupKey)!;
      group.total_revenue += parseFloat(payout.total_revenue) || 0;
      group.commission += parseFloat(payout.commission) || 0;
      group.expenses += parseFloat(payout.expenses) || 0;
      group.net_owner_earnings += parseFloat(payout.net_owner_earnings) || 0;
      group.amount_paid += parseFloat(payout.amount_paid) || 0;
      group.remaining_balance += parseFloat(payout.remaining_balance) || 0;
      
      if (payout.payments && payout.payments.length > 0) {
        group.payments.push(...payout.payments);
      }
      
      if (group.remaining_balance <= 0.01) {
        group.status = "paid";
        group.status_display = "Payé";
      } else if (group.amount_paid > 0) {
        group.status = "partial";
        group.status_display = "Partiel";
      } else {
        const dueDate = new Date(payout.due_date);
        const today = new Date();
        if (dueDate < today && group.remaining_balance > 0) {
          group.status = "overdue";
          group.status_display = "En retard";
        } else {
          group.status = "pending";
          group.status_display = "En attente";
        }
      }
      
      group.completion_percentage = group.net_owner_earnings > 0 
        ? (group.amount_paid / group.net_owner_earnings) * 100 
        : 0;
    });
    
    return Array.from(groupMap.values()).sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      if (a.month !== b.month) return b.month.localeCompare(a.month);
      return a.property_name.localeCompare(b.property_name);
    });
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAllData();
    setRefreshing(false);
  };

  const handleMarkAsPaid = async () => {
    if (!selectedGroup) return;
    
    if (!paymentForm.amount || parseFloat(paymentForm.amount) <= 0) {
      alert("Veuillez entrer un montant valide");
      return;
    }

    const amountToPay = parseFloat(paymentForm.amount);
    if (amountToPay > selectedGroup.remaining_balance) {
      alert(`Le montant ne peut pas dépasser le solde restant (${formatMoney(selectedGroup.remaining_balance)} MAD)`);
      return;
    }
    
    setSubmitting(true);
    try {
      const paymentData = {
        owner: selectedGroup.owner,
        property: selectedGroup.property,
        amount: amountToPay,
        payment_method: paymentForm.payment_method,
        notes: paymentForm.notes || "",
        transaction_id: paymentForm.transaction_id || "",
        month: selectedGroup.month
      };
      
      await api.post("/api/payments/payments/create/", paymentData);
      
      setShowPaymentModal(false);
      setPaymentForm({ amount: "", payment_method: "bank_transfer", notes: "", transaction_id: "" });
      await fetchAllData();
      alert("Paiement enregistré avec succès !");
    } catch (err: any) {
      let errorMsg = "Erreur lors de l'enregistrement du paiement";
      if (err.response?.data) {
        if (typeof err.response.data === 'object') {
          errorMsg = Object.values(err.response.data).join(', ');
        } else {
          errorMsg = err.response.data;
        }
      }
      alert(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewDetails = async (group: MonthlyPayout) => {
    try {
      const response = await api.get(`/api/payments/payouts/?owner=${group.owner}&property=${group.property}&month=${group.month}`);
      const details = response.data[0] || null;
      
      if (details) {
        setSelectedPayout({
          id: details.id,
          owner_name: details.owner_name,
          owner: details.owner,
          property_name: details.property_name,
          property: details.property,
          month: group.month,
          total_revenue: parseFloat(details.total_revenue) || 0,
          commission: parseFloat(details.commission) || 0,
          expenses: parseFloat(details.expenses) || 0,
          net_owner_earnings: parseFloat(details.net_owner_earnings) || 0,
          amount_paid: parseFloat(details.amount_paid) || 0,
          remaining_balance: parseFloat(details.remaining_balance) || 0,
          status: details.status,
          status_display: details.status_display,
          payments: details.payments || []
        });
      }
      setShowDetailsModal(true);
    } catch (err) {
      console.error("Error fetching details:", err);
      alert("Erreur lors du chargement des détails");
    }
  };

  const handleViewTransactions = (group: MonthlyPayout) => {
    setSelectedGroup(group);
    setShowTransactionsModal(true);
  };

  const getStatusBadge = (status: string, display: string) => {
    const colors: Record<string, string> = {
      paid: 'bg-green-100 text-green-700',
      partial: 'bg-yellow-100 text-yellow-700',
      pending: 'bg-blue-100 text-blue-700',
      overdue: 'bg-red-100 text-red-700',
    };
    return `inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${colors[status] || colors.pending}`;
  };

  const filteredPayouts = groupedPayouts.filter(p => {
    if (selectedMonth && p.month !== selectedMonth) return false;
    if (selectedYear && p.year.toString() !== selectedYear) return false;
    if (statusFilter !== "all" && p.status !== statusFilter) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (p.owner_name?.toLowerCase() || '').includes(query) ||
             (p.property_name?.toLowerCase() || '').includes(query);
    }
    return true;
  });

  const totalPending = groupedPayouts
    .filter(p => p.status === 'pending')
    .reduce((sum, p) => sum + (p.remaining_balance || 0), 0);
    
  const totalPaidMonth = payments
    .filter(p => {
      const paymentDate = new Date(p.payment_date);
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      return paymentDate.getMonth() === currentMonth && paymentDate.getFullYear() === currentYear;
    })
    .reduce((sum, p) => sum + (p.amount || 0), 0);
    
  const totalEarnings = groupedPayouts
    .reduce((sum, p) => sum + (p.net_owner_earnings || 0), 0);
    
  const totalUnpaid = groupedPayouts
    .filter(p => p.status !== 'paid')
    .reduce((sum, p) => sum + (p.remaining_balance || 0), 0);

  const formatMoney = (value: number) => {
    if (isNaN(value)) return "0.00";
    return value.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Paiements aux propriétaires</h1>
            <p className="text-sm text-gray-500 mt-1">Net à payer = Revenus - Commission - Dépenses</p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-all disabled:opacity-50 shadow-sm"
          >
            <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
            {refreshing ? "Actualisation..." : "Actualiser"}
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">En attente de paiement</p>
              <Clock size={18} className="text-yellow-500" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{formatMoney(totalPending)} MAD</p>
          </div>
          
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Payé ce mois</p>
              <CheckCircle size={18} className="text-green-500" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{formatMoney(totalPaidMonth)} MAD</p>
          </div>
          
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Total des revenus</p>
              <TrendingUp size={18} className="text-blue-500" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{formatMoney(totalEarnings)} MAD</p>
          </div>
          
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Soldes impayés</p>
              <AlertCircle size={18} className="text-red-500" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{formatMoney(totalUnpaid)} MAD</p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher propriétaire ou bien..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>
          
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">Toutes les années</option>
            {availableYears.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
          
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">Tous les mois</option>
            {availableMonths.map(month => (
              <option key={month} value={month}>
                {getMonthDisplay(month)}
              </option>
            ))}
          </select>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">Tous les statuts</option>
            <option value="pending">En attente</option>
            <option value="partial">Partiel</option>
            <option value="paid">Payé</option>
            <option value="overdue">En retard</option>
          </select>
        </div>

        {/* Grouped Payout Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
            <h2 className="text-base font-semibold text-gray-800">Paiements groupés par propriétaire / bien / mois</h2>
            <p className="text-xs text-gray-500 mt-1">Les montants sont regroupés par mois pour chaque propriétaire et bien</p>
          </div>
          
          {loading ? (
            <div className="divide-y divide-gray-100">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="px-6 py-4 animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-32" />
                </div>
              ))}
            </div>
          ) : filteredPayouts.length === 0 ? (
            <div className="text-center py-16">
              <DollarSign size={48} className="text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">Aucun paiement trouvé</p>
              <p className="text-sm text-gray-400 mt-1">Essayez de modifier les filtres</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Bien / Propriétaire</th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Période</th>
                    <th className="text-right px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Revenus</th>
                    <th className="text-right px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Commission</th>
                    <th className="text-right px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Dépenses</th>
                    <th className="text-right px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Net</th>
                    <th className="text-right px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Payé</th>
                    <th className="text-right px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Restant</th>
                    <th className="text-center px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Statut</th>
                    <th className="text-center px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredPayouts.map((payout) => (
                    <tr key={payout.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-semibold text-gray-900">{payout.property_name || 'N/A'}</p>
                        <p className="text-sm text-gray-500 mt-0.5">{payout.owner_name || 'N/A'}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-medium text-gray-700">{payout.month_display}</span>
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-medium text-gray-900">{formatMoney(payout.total_revenue)} MAD</td>
                      <td className="px-6 py-4 text-right text-sm text-red-600">-{formatMoney(payout.commission)} MAD</td>
                      <td className="px-6 py-4 text-right text-sm text-red-600">-{formatMoney(payout.expenses)} MAD</td>
                      <td className="px-6 py-4 text-right font-bold text-emerald-600">{formatMoney(payout.net_owner_earnings)} MAD</td>
                      <td className="px-6 py-4 text-right text-sm text-gray-700">{formatMoney(payout.amount_paid)} MAD</td>
                      <td className="px-6 py-4 text-right font-semibold text-red-600">{formatMoney(payout.remaining_balance)} MAD</td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span className={getStatusBadge(payout.status, payout.status_display)}>
                            {payout.status_display}
                          </span>
                          {payout.payments.length > 0 && (
                            <span className="text-xs text-gray-400">
                              {payout.payments.length} paiement{payout.payments.length > 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button 
                            onClick={() => handleViewDetails(payout)} 
                            className="p-2 rounded-lg hover:bg-gray-100 transition-colors" 
                            title="Voir détails"
                          >
                            <Eye size={16} className="text-gray-600" />
                          </button>
                          {payout.payments.length > 0 && (
                            <button 
                              onClick={() => handleViewTransactions(payout)} 
                              className="p-2 rounded-lg hover:bg-blue-50 transition-colors" 
                              title="Voir transactions"
                            >
                              <Receipt size={16} className="text-blue-600" />
                            </button>
                          )}
                          {payout.status !== 'paid' && payout.remaining_balance > 0 && (
                            <button 
                              onClick={() => { 
                                setSelectedGroup(payout); 
                                setPaymentForm({ ...paymentForm, amount: payout.remaining_balance.toString() }); 
                                setShowPaymentModal(true); 
                              }} 
                              className="p-2 rounded-lg hover:bg-green-50 transition-colors" 
                              title="Enregistrer paiement"
                            >
                              <CheckCircle size={16} className="text-emerald-600" />
                            </button>
                          )}
                          <button 
                            onClick={() => { 
                              setSelectedGroup(payout); 
                              setShowStatementModal(true); 
                            }} 
                            className="p-2 rounded-lg hover:bg-purple-50 transition-colors" 
                            title="Relevé"
                          >
                            <Download size={16} className="text-purple-600" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && selectedGroup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">Enregistrer un paiement</h2>
                <button onClick={() => setShowPaymentModal(false)} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
                  <X size={20} />
                </button>
              </div>
              <div className="mb-4">
                <p className="text-base font-semibold text-gray-900">{selectedGroup.property_name}</p>
                <p className="text-sm text-gray-500">{selectedGroup.month_display}</p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Net à payer:</span>
                  <span className="font-semibold text-gray-900">{formatMoney(selectedGroup.net_owner_earnings)} MAD</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Déjà payé:</span>
                  <span className="font-semibold text-emerald-600">{formatMoney(selectedGroup.amount_paid)} MAD</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-gray-200">
                  <span className="font-semibold text-gray-900">Solde:</span>
                  <span className="font-bold text-red-600">{formatMoney(selectedGroup.remaining_balance)} MAD</span>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Montant *</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    placeholder="0.00" 
                    value={paymentForm.amount} 
                    onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })} 
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Méthode *</label>
                  <select 
                    value={paymentForm.payment_method} 
                    onChange={(e) => setPaymentForm({ ...paymentForm, payment_method: e.target.value })} 
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="bank_transfer">Virement bancaire</option>
                    <option value="cash">Espèces</option>
                    <option value="paypal">PayPal</option>
                    <option value="stripe">Stripe</option>
                    <option value="check">Chèque</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Référence</label>
                  <input 
                    type="text" 
                    placeholder="N° de transaction" 
                    value={paymentForm.transaction_id} 
                    onChange={(e) => setPaymentForm({ ...paymentForm, transaction_id: e.target.value })} 
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Notes</label>
                  <textarea 
                    rows={3} 
                    placeholder="Notes..." 
                    value={paymentForm.notes} 
                    onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })} 
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6 pt-4 border-t border-gray-200">
                <button 
                  onClick={() => setShowPaymentModal(false)} 
                  className="flex-1 py-2.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                >
                  Annuler
                </button>
                <button 
                  onClick={handleMarkAsPaid} 
                  disabled={submitting || !paymentForm.amount} 
                  className="flex-1 py-2.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors font-medium"
                >
                  {submitting ? "Traitement..." : "Enregistrer"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedPayout && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">Détails du paiement</h2>
                <button onClick={() => setShowDetailsModal(false)} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
                  <X size={20} />
                </button>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between py-2">
                  <span className="text-gray-600">Bien:</span>
                  <span className="font-medium text-gray-900">{selectedPayout.property_name}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-gray-600">Propriétaire:</span>
                  <span className="text-gray-900">{selectedPayout.owner_name}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-gray-600">Période:</span>
                  <span className="text-gray-900">{getMonthDisplay(selectedPayout.month)}</span>
                </div>
                <div className="border-t border-gray-200 my-2"></div>
                <div className="flex justify-between py-2">
                  <span className="text-gray-600">Revenus:</span>
                  <span className="text-gray-900">{formatMoney(selectedPayout.total_revenue)} MAD</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-gray-600">Commission:</span>
                  <span className="text-red-600">-{formatMoney(selectedPayout.commission)} MAD</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-gray-600">Dépenses:</span>
                  <span className="text-red-600">-{formatMoney(selectedPayout.expenses)} MAD</span>
                </div>
                <div className="border-t border-gray-200 pt-2">
                  <div className="flex justify-between py-2">
                    <span className="font-semibold text-gray-900">Net:</span>
                    <span className="font-bold text-emerald-600">{formatMoney(selectedPayout.net_owner_earnings)} MAD</span>
                  </div>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-gray-600">Payé:</span>
                  <span className="font-semibold text-emerald-600">{formatMoney(selectedPayout.amount_paid)} MAD</span>
                </div>
                <div className="border-t border-gray-200 pt-2">
                  <div className="flex justify-between py-2">
                    <span className="font-semibold text-gray-900">Solde:</span>
                    <span className="font-bold text-red-600">{formatMoney(selectedPayout.remaining_balance)} MAD</span>
                  </div>
                </div>
                
                {selectedPayout.payments && selectedPayout.payments.length > 0 && (
                  <div className="border-t border-gray-200 pt-4 mt-2">
                    <p className="font-semibold text-gray-900 mb-3">Historique des paiements:</p>
                    <div className="space-y-3">
                      {selectedPayout.payments.map((payment, idx) => (
                        <div key={idx} className="border-l-2 border-emerald-300 pl-3 py-1">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs text-gray-500">{new Date(payment.payment_date).toLocaleDateString('fr-FR')}</span>
                            <span className="font-semibold text-emerald-600">{formatMoney(payment.amount)} MAD</span>
                          </div>
                          <div className="text-xs text-gray-600">{payment.payment_method_display}</div>
                          {payment.transaction_id && <div className="text-xs text-gray-400 mt-1">Ref: {payment.transaction_id}</div>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <button 
                onClick={() => setShowDetailsModal(false)} 
                className="w-full mt-6 py-2.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors font-medium"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transactions Modal */}
      {showTransactionsModal && selectedGroup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">Transactions individuelles</h2>
                <button onClick={() => setShowTransactionsModal(false)} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
                  <X size={20} />
                </button>
              </div>
              <div className="mb-4 pb-3 border-b border-gray-200">
                <p className="text-base font-semibold text-gray-900">{selectedGroup.property_name}</p>
                <p className="text-sm text-gray-600 mt-0.5">{selectedGroup.owner_name}</p>
                <p className="text-xs text-gray-500 mt-1">{selectedGroup.month_display}</p>
              </div>
              
              {selectedGroup.payments && selectedGroup.payments.length > 0 ? (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {selectedGroup.payments.map((payment, idx) => (
                    <div key={idx} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                              <CheckCircle size={12} className="mr-1" /> Complété
                            </span>
                            <span className="text-xs text-gray-500">{payment.payment_method_display}</span>
                          </div>
                          <p className="text-lg font-bold text-emerald-600">{formatMoney(payment.amount)} MAD</p>
                          <p className="text-sm text-gray-500 mt-2">
                            Date: {new Date(payment.payment_date).toLocaleDateString('fr-FR')}
                          </p>
                          {payment.transaction_id && (
                            <p className="text-xs text-gray-400 mt-1">Transaction: {payment.transaction_id}</p>
                          )}
                          {payment.notes && (
                            <p className="text-sm text-gray-600 mt-2 bg-gray-50 p-2 rounded">{payment.notes}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Receipt size={48} className="mx-auto mb-3 text-gray-300" />
                  <p className="text-gray-500 font-medium">Aucune transaction trouvée</p>
                </div>
              )}
              
              <div className="mt-6 pt-4 border-t border-gray-200 flex justify-between gap-3">
                <button 
                  onClick={() => setShowTransactionsModal(false)} 
                  className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                >
                  Fermer
                </button>
                {selectedGroup.status !== 'paid' && selectedGroup.remaining_balance > 0 && (
                  <button 
                    onClick={() => {
                      setShowTransactionsModal(false);
                      setPaymentForm({ ...paymentForm, amount: selectedGroup.remaining_balance.toString() });
                      setShowPaymentModal(true);
                    }}
                    className="flex-1 px-4 py-2.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors font-medium"
                  >
                    Ajouter un paiement
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Statement Modal */}
      {showStatementModal && selectedGroup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-6">
              <div className="text-center mb-6">
                <FileText size={24} className="text-emerald-600 mx-auto mb-3" />
                <h2 className="text-xl font-bold text-gray-900">Relevé de paiement</h2>
                <p className="text-base font-semibold text-gray-800 mt-2">{selectedGroup.property_name}</p>
                <p className="text-sm text-gray-500">{selectedGroup.month_display}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-5 space-y-3 text-sm">
                <div className="flex justify-between py-1">
                  <span className="text-gray-600">Revenus:</span>
                  <span className="font-medium text-gray-900">{formatMoney(selectedGroup.total_revenue)} MAD</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-gray-600">Commission:</span>
                  <span className="text-red-600">-{formatMoney(selectedGroup.commission)} MAD</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-gray-600">Dépenses:</span>
                  <span className="text-red-600">-{formatMoney(selectedGroup.expenses)} MAD</span>
                </div>
                <div className="border-t border-gray-200 pt-2">
                  <div className="flex justify-between py-1">
                    <span className="font-semibold text-gray-900">Net:</span>
                    <span className="font-bold text-emerald-600">{formatMoney(selectedGroup.net_owner_earnings)} MAD</span>
                  </div>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-gray-600">Payé:</span>
                  <span className="font-semibold text-emerald-600">{formatMoney(selectedGroup.amount_paid)} MAD</span>
                </div>
                <div className="border-t border-gray-200 pt-2">
                  <div className="flex justify-between py-1">
                    <span className="font-semibold text-gray-900">Restant:</span>
                    <span className="font-bold text-red-600">{formatMoney(selectedGroup.remaining_balance)} MAD</span>
                  </div>
                </div>
              </div>
              <p className="text-xs text-gray-400 text-center mt-4">
                Généré le {new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
              <div className="flex gap-3 mt-6">
                <button 
                  onClick={() => setShowStatementModal(false)} 
                  className="flex-1 py-2.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                >
                  Fermer
                </button>
                <button 
                  onClick={() => window.print()} 
                  className="flex-1 py-2.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 font-medium"
                >
                  <Download size={16} /> PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}