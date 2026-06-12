"use client";

import { useEffect, useState } from "react";
import {
  DollarSign, TrendingUp, AlertCircle, CheckCircle, Clock,
  Eye, Download, Receipt, RefreshCw, X, Search,
  Building2, User as UserIcon, FileText, Calendar,
  CreditCard, Wallet, ArrowUpRight, ArrowDownRight,
  ChevronLeft, ChevronRight, Filter
} from "lucide-react";
import api from "@/lib/axios";

// Types
interface MonthlyPayout {
  id: string;
  owner_name: string;
  owner: number;
  property_name: string;
  property: number;
  month: number;
  year: number;
  month_display: string;
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
  month: number;
  year: number;
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

const STATUS: Record<string, { color: string; bg: string; border: string; icon: any }> = {
  paid:    { color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0", icon: CheckCircle },
  partial: { color: "#d97706", bg: "#fffbeb", border: "#fde68a", icon: Clock },
  pending: { color: "#2563eb", bg: "#eff6ff", border: "#bfdbfe", icon: Clock },
  overdue: { color: "#dc2626", bg: "#fef2f2", border: "#fecaca", icon: AlertCircle },
};

const MONTH_NAMES: Record<number, string> = {
  1: "Janvier", 2: "Février", 3: "Mars", 4: "Avril",
  5: "Mai", 6: "Juin", 7: "Juillet", 8: "Août",
  9: "Septembre", 10: "Octobre", 11: "Novembre", 12: "Décembre"
};

const PAYMENT_METHODS: Record<string, string> = {
  bank_transfer: "Virement bancaire",
  cash: "Espèces",
  paypal: "PayPal",
  stripe: "Stripe",
  check: "Chèque",
};

export default function PaymentsPage() {
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
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [availableMonths, setAvailableMonths] = useState<{value: string, label: string}[]>([]);
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 8;

  const [paymentForm, setPaymentForm] = useState({
    amount: "", payment_method: "bank_transfer", notes: "", transaction_id: "",
  });

  useEffect(() => { fetchAllData(); }, []);

  const getMonthDisplay = (month: number, year: number): string => {
    return `${MONTH_NAMES[month] || month} ${year}`;
  };

  const getMonthKey = (month: number, year: number): string => {
    return `${year}-${String(month).padStart(2, "0")}`;
  };

  const processPayoutsByMonth = (payouts: any[]): MonthlyPayout[] => {
    const map = new Map<string, MonthlyPayout>();
    
    payouts.forEach((p: any) => {
      const month = p.month;
      const year = p.year;
      
      if (!month || !year) {
        console.warn("Missing month/year for payout:", p);
        return;
      }
      
      const key = `${p.owner}_${p.property}_${year}_${month}`;

      if (!map.has(key)) {
        map.set(key, {
          id: key,
          owner_name: p.owner_name,
          owner: p.owner,
          property_name: p.property_name,
          property: p.property,
          month: month,
          year: year,
          month_display: getMonthDisplay(month, year),
          total_revenue: 0,
          commission: 0,
          expenses: 0,
          net_owner_earnings: 0,
          amount_paid: 0,
          remaining_balance: 0,
          status: "pending",
          status_display: "En attente",
          due_date: p.due_date,
          paid_date: p.paid_date,
          completion_percentage: 0,
          payments: [],
        });
      }
      
      const g = map.get(key)!;
      g.total_revenue += parseFloat(p.total_revenue) || 0;
      g.commission += parseFloat(p.commission) || 0;
      g.expenses += parseFloat(p.expenses) || 0;
      g.net_owner_earnings += parseFloat(p.net_owner_earnings) || 0;
      g.amount_paid += parseFloat(p.amount_paid) || 0;
      g.remaining_balance += parseFloat(p.remaining_balance) || 0;
      
      if (p.payments?.length) {
        g.payments.push(...p.payments);
      }

      if (g.remaining_balance <= 0.01) {
        g.status = "paid";
        g.status_display = "Payé";
      } else if (g.amount_paid > 0) {
        g.status = "partial";
        g.status_display = "Partiel";
      } else if (p.due_date && new Date(p.due_date) < new Date() && g.remaining_balance > 0) {
        g.status = "overdue";
        g.status_display = "En retard";
      }
      
      g.completion_percentage = g.net_owner_earnings > 0
        ? (g.amount_paid / g.net_owner_earnings) * 100 : 0;
    });
    
    return Array.from(map.values()).sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return b.month - a.month;
    });
  };

  const fetchAllData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const pr = await api.get("/api/payments/payouts/summary/");
      const payoutsData = pr.data || [];
      
      console.log("Payouts data:", payoutsData);
      
      const processed = processPayoutsByMonth(payoutsData);
      setGroupedPayouts(processed);
      
      const pmr = await api.get("/api/payments/payments/history/");
      setPayments((pmr.data || []).map((p: any) => ({ 
        ...p, 
        amount: parseFloat(p.amount) || 0 
      })));

      const monthSet = new Map<string, {value: string, label: string}>();
      const yearSet = new Set<number>();
      
      processed.forEach(p => {
        const monthKey = getMonthKey(p.month, p.year);
        monthSet.set(monthKey, {
          value: monthKey,
          label: getMonthDisplay(p.month, p.year)
        });
        yearSet.add(p.year);
      });
      
      setAvailableMonths(Array.from(monthSet.values()).sort((a, b) => b.value.localeCompare(a.value)));
      setAvailableYears(Array.from(yearSet).sort().reverse());
      
    } catch (err: any) {
      console.error("Error fetching data:", err);
      setError(err.response?.data?.message || "Erreur lors du chargement des données.");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => { 
    setRefreshing(true); 
    await fetchAllData(); 
    setRefreshing(false); 
  };

  const handleMarkAsPaid = async () => {
    if (!selectedGroup) return;
    
    const amt = parseFloat(paymentForm.amount);
    if (!amt || amt <= 0) { 
      alert("Montant invalide"); 
      return; 
    }
    
    if (amt > selectedGroup.remaining_balance) { 
      alert(`Max: ${fmt(selectedGroup.remaining_balance)} MAD`); 
      return; 
    }
    
    setSubmitting(true);
    try {
      const monthKey = getMonthKey(selectedGroup.month, selectedGroup.year);
      
      await api.post("/api/payments/payments/create/", {
        owner: selectedGroup.owner,
        property: selectedGroup.property,
        amount: amt,
        payment_method: paymentForm.payment_method,
        notes: paymentForm.notes || "",
        transaction_id: paymentForm.transaction_id || "",
        month: monthKey,
      });
      
      setShowPaymentModal(false);
      setPaymentForm({ amount: "", payment_method: "bank_transfer", notes: "", transaction_id: "" });
      await fetchAllData();
    } catch (e: any) {
      const msg = e.response?.data ? Object.values(e.response.data).join(", ") : "Erreur";
      alert(msg);
    } finally { 
      setSubmitting(false); 
    }
  };

  const handleViewDetails = async (g: MonthlyPayout) => {
    try {
      const r = await api.get(`/api/payments/payouts/summary/`);
      const payouts = r.data || [];
      
      const found = payouts.find((p: any) => 
        p.owner === g.owner && 
        p.property === g.property && 
        p.month === g.month && 
        p.year === g.year
      );
      
      if (found) {
        setSelectedPayout({
          id: found.id,
          owner_name: found.owner_name,
          owner: found.owner,
          property_name: found.property_name,
          property: found.property,
          month: found.month,
          year: found.year,
          total_revenue: parseFloat(found.total_revenue) || 0,
          commission: parseFloat(found.commission) || 0,
          expenses: parseFloat(found.expenses) || 0,
          net_owner_earnings: parseFloat(found.net_owner_earnings) || 0,
          amount_paid: parseFloat(found.amount_paid) || 0,
          remaining_balance: parseFloat(found.remaining_balance) || 0,
          status: found.status,
          status_display: found.status_display,
          payments: found.payments || [],
        });
        setShowDetailsModal(true);
      }
    } catch (err) {
      console.error("Error loading details:", err);
      alert("Erreur lors du chargement des détails");
    }
  };

  const fmt = (v: number) =>
    isNaN(v) ? "0,00" : v.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const filtered = groupedPayouts.filter(p => {
    if (selectedMonth) {
      const payoutMonthKey = getMonthKey(p.month, p.year);
      if (payoutMonthKey !== selectedMonth) return false;
    }
    if (selectedYear && p.year.toString() !== selectedYear) return false;
    if (statusFilter !== "all" && p.status !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return p.owner_name?.toLowerCase().includes(q) || 
             p.property_name?.toLowerCase().includes(q);
    }
    return true;
  });

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginatedPayouts = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, selectedMonth, selectedYear]);

  const now = new Date();
  const totalPending = groupedPayouts
    .filter(p => p.status === "pending" || p.status === "partial")
    .reduce((s, p) => s + p.remaining_balance, 0);
  
  const totalPaidMonth = payments
    .filter(p => {
      const d = new Date(p.payment_date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    })
    .reduce((s, p) => s + p.amount, 0);
  
  const totalEarnings = groupedPayouts.reduce((s, p) => s + p.net_owner_earnings, 0);
  const totalUnpaid = groupedPayouts
    .filter(p => p.status !== "paid")
    .reduce((s, p) => s + p.remaining_balance, 0);

  const kpis = [
    { label: "En attente", value: `${fmt(totalPending)} MAD`, icon: Clock, color: "#d97706", bg: "#fffbeb", border: "#fde68a", trend: "+8%" },
    { label: "Payé ce mois", value: `${fmt(totalPaidMonth)} MAD`, icon: CheckCircle, color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0", trend: "+12%" },
    { label: "Total revenus", value: `${fmt(totalEarnings)} MAD`, icon: TrendingUp, color: "#2563eb", bg: "#eff6ff", border: "#bfdbfe", trend: "+5%" },
    { label: "Soldes impayés", value: `${fmt(totalUnpaid)} MAD`, icon: AlertCircle, color: "#dc2626", bg: "#fef2f2", border: "#fecaca", trend: "-3%" },
  ];

  const PaginationControls = () => {
    if (totalPages <= 1) return null;
    
    const getPageNumbers = () => {
      const pages = [];
      const maxVisible = 5;
      let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
      let endPage = Math.min(totalPages, startPage + maxVisible - 1);
      
      if (endPage - startPage + 1 < maxVisible) {
        startPage = Math.max(1, endPage - maxVisible + 1);
      }
      
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
      return pages;
    };

    return (
      <div className="flex items-center justify-between px-5 py-4 border-t border-[#f1f5f9] bg-gradient-to-r from-[#fafbfc] to-[#f8fafc]">
        <p className="text-[11px] text-[#94a3b8]">
          {filtered.length} résultat{filtered.length > 1 ? 's' : ''} • Page {currentPage} / {totalPages}
        </p>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#e2e8f0] text-[#64748b] hover:bg-[#f1f5f9] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft size={14} />
          </button>
          {getPageNumbers().map(pageNum => (
            <button
              key={pageNum}
              onClick={() => setCurrentPage(pageNum)}
              className={`w-8 h-8 flex items-center justify-center rounded-lg text-[12px] font-medium transition-colors ${
                currentPage === pageNum
                  ? "bg-[#10b981] text-white"
                  : "text-[#64748b] hover:bg-[#f1f5f9] border border-[#e2e8f0]"
              }`}
            >
              {pageNum}
            </button>
          ))}
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#e2e8f0] text-[#64748b] hover:bg-[#f1f5f9] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8fafc] to-[#f1f5f9]">
      <div className="p-6 max-w-[1400px] mx-auto">

        {/* Header */}
        <div className="relative mb-8">
          <div className="absolute top-0 right-0 w-80 h-80 bg-[#10b981]/5 rounded-full blur-3xl -z-10"></div>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-[1.75rem] font-bold bg-gradient-to-r from-[#111827] to-[#10b981] bg-clip-text text-transparent tracking-tight">
                Paiements propriétaires
              </h1>
              <p className="text-[0.875rem] text-[#64748b] mt-1">
                Net à payer = Revenus − Commission − Dépenses
              </p>
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm border border-[#e2e8f0] rounded-xl text-[13px] font-medium text-[#64748b] hover:bg-white transition-all"
            >
              <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
              {refreshing ? "Actualisation…" : "Actualiser"}
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-2">
              <AlertCircle size={16} className="text-red-500" />
              <p className="text-red-600 text-[13px]">{error}</p>
            </div>
          </div>
        )}

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          {kpis.map((k, i) => (
            <div key={i} className="group bg-white rounded-2xl border border-[#e2e8f0] p-5 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center transition-all group-hover:scale-110" style={{ backgroundColor: k.color + "12" }}>
                  <k.icon size={18} style={{ color: k.color }} />
                </div>
                <div className="flex items-center gap-1 text-[11px] font-medium text-[#10b981]">
                  <ArrowUpRight size={12} />
                  {k.trend}
                </div>
              </div>
              <p className="text-[12px] text-[#64748b] font-medium uppercase tracking-wider">{k.label}</p>
              <p className="text-[24px] font-bold text-[#1e293b] tracking-tight mt-1">{k.value}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-[#e2e8f0] p-4 mb-6 shadow-sm">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
              <input 
                className="w-full pl-9 pr-3 py-2.5 bg-[#fafbfc] border border-[#e2e8f0] rounded-xl text-[13px] text-[#334155] placeholder-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#10b981]/20 focus:border-[#10b981] transition-all" 
                placeholder="Rechercher propriétaire ou bien…" 
                value={searchQuery} 
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            
            <select className="py-select w-full sm:w-40 px-3 py-2.5 bg-[#fafbfc] border border-[#e2e8f0] rounded-xl text-[13px] text-[#334155] focus:outline-none focus:ring-2 focus:ring-[#10b981]/20 focus:border-[#10b981]" value={selectedYear} onChange={e => setSelectedYear(e.target.value)}>
              <option value="">Toutes les années</option>
              {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            
            <select className="py-select w-full sm:w-48 px-3 py-2.5 bg-[#fafbfc] border border-[#e2e8f0] rounded-xl text-[13px] text-[#334155] focus:outline-none focus:ring-2 focus:ring-[#10b981]/20 focus:border-[#10b981]" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)}>
              <option value="">Tous les mois</option>
              {availableMonths.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
            
            <select className="py-select w-full sm:w-48 px-3 py-2.5 bg-[#fafbfc] border border-[#e2e8f0] rounded-xl text-[13px] text-[#334155] focus:outline-none focus:ring-2 focus:ring-[#10b981]/20 focus:border-[#10b981]" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="all">Tous les statuts</option>
              <option value="pending">En attente</option>
              <option value="partial">Partiel</option>
              <option value="paid">Payé</option>
              <option value="overdue">En retard</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-[#e2e8f0] overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-[#f1f5f9] bg-gradient-to-r from-[#fafbfc] to-[#f8fafc]">
            <p className="text-[13px] font-semibold text-[#1e293b]">Paiements groupés</p>
            <p className="text-[11px] text-[#94a3b8] mt-0.5">{filtered.length} enregistrement{filtered.length !== 1 ? "s" : ""}</p>
          </div>

          {loading ? (
            <div className="p-8 space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-16 bg-[#f1f5f9] rounded-xl"></div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 rounded-full bg-[#f1f5f9] flex items-center justify-center mx-auto mb-3">
                <DollarSign size={24} className="text-[#94a3b8]" />
              </div>
              <p className="text-[14px] font-medium text-[#374151]">Aucun paiement trouvé</p>
              <p className="text-[12px] text-[#94a3b8] mt-1">Modifiez les filtres pour afficher des résultats</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#e2e8f0] bg-[#fafbfc]">
                    <th className="text-left px-5 py-4 text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">Bien / Propriétaire</th>
                    <th className="text-left px-5 py-4 text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">Période</th>
                    <th className="text-right px-5 py-4 text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">Revenus</th>
                    <th className="text-right px-5 py-4 text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">Commission</th>
                    <th className="text-right px-5 py-4 text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">Dépenses</th>
                    <th className="text-right px-5 py-4 text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">Net</th>
                    <th className="text-right px-5 py-4 text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">Payé</th>
                    <th className="text-right px-5 py-4 text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">Restant</th>
                    <th className="text-center px-5 py-4 text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">Statut</th>
                    <th className="text-center px-5 py-4 text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f1f5f9]">
                  {paginatedPayouts.map(p => {
                    const s = STATUS[p.status] ?? STATUS.pending;
                    const SIcon = s.icon;
                    return (
                      <tr key={p.id} className="hover:bg-[#fafbfc] transition-colors group">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-[#f1f5f9] flex items-center justify-center group-hover:bg-[#e2e8f0] transition-colors">
                              <Building2 size={13} className="text-[#64748b]" />
                            </div>
                            <div>
                              <p className="font-semibold text-[#1e293b] text-[13px]">{p.property_name || "—"}</p>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <UserIcon size={10} className="text-[#94a3b8]" />
                                <span className="text-[11px] text-[#64748b]">{p.owner_name || "—"}</span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1.5">
                            <Calendar size={11} className="text-[#94a3b8]" />
                            <span className="text-[12px] font-medium text-[#374151]">{p.month_display}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <span className="font-semibold text-[#1e293b] text-[13px]">{fmt(p.total_revenue)} MAD</span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <span className="text-[#ef4444] text-[13px] font-medium">−{fmt(p.commission)} MAD</span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <span className="text-[#ef4444] text-[13px] font-medium">−{fmt(p.expenses)} MAD</span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <span className="font-bold text-[#10b981] text-[14px]">{fmt(p.net_owner_earnings)} MAD</span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <span className="text-[#374151] text-[13px]">{fmt(p.amount_paid)} MAD</span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <span className={`font-semibold text-[13px] ${p.remaining_balance > 0 ? 'text-[#ef4444]' : 'text-[#10b981]'}`}>
                            {fmt(p.remaining_balance)} MAD
                          </span>
                        </td>
                        <td className="px-5 py-4 text-center">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium" style={{ color: s.color, background: s.bg, border: `1px solid ${s.border}` }}>
                            <SIcon size={10} />
                            {p.status_display}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-center gap-1">
                            <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#f1f5f9] text-[#64748b] transition-colors" title="Détails" onClick={() => handleViewDetails(p)}>
                              <Eye size={13} />
                            </button>
                            {p.payments.length > 0 && (
                              <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#f1f5f9] text-[#2563eb] transition-colors" title="Transactions" onClick={() => { setSelectedGroup(p); setShowTransactionsModal(true); }}>
                                <Receipt size={13} />
                              </button>
                            )}
                            {p.status !== "paid" && p.remaining_balance > 0 && (
                              <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#f1f5f9] text-[#10b981] transition-colors" title="Payer" onClick={() => { setSelectedGroup(p); setPaymentForm({ ...paymentForm, amount: p.remaining_balance.toString() }); setShowPaymentModal(true); }}>
                                <CheckCircle size={13} />
                              </button>
                            )}
                            <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#f1f5f9] text-[#8b5cf6] transition-colors" title="Relevé" onClick={() => { setSelectedGroup(p); setShowStatementModal(true); }}>
                              <Download size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {filtered.length > 0 && (
            <div className="px-6 py-3 border-t border-[#f1f5f9] bg-[#fafbfc] flex items-center justify-between">
              <p className="text-[11px] text-[#94a3b8]">
                {filtered.length} résultat{filtered.length !== 1 ? "s" : ""}
              </p>
              <div>
                <span className="text-[11px] text-[#64748b]">
                  Net total: <strong className="text-[#10b981] text-[13px]">{fmt(filtered.reduce((s,p)=>s+p.net_owner_earnings,0))} MAD</strong>
                </span>
              </div>
            </div>
          )}
          
          <PaginationControls />
        </div>
      </div>

      {/* Payment Modal - Modern */}
      {showPaymentModal && selectedGroup && (
        <div className="fixed inset-0 bg-[#0f172a]/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md transform transition-all">
            <div className="relative">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#10b981] to-[#059669] rounded-t-2xl"></div>
              <div className="p-6 border-b border-[#f1f5f9] flex justify-between items-center">
                <div>
                  <h2 className="text-[18px] font-bold bg-gradient-to-r from-[#111827] to-[#10b981] bg-clip-text text-transparent">Enregistrer un paiement</h2>
                  <p className="text-[11px] text-[#94a3b8] mt-0.5">{selectedGroup.property_name} · {selectedGroup.month_display}</p>
                </div>
                <button onClick={() => setShowPaymentModal(false)} className="text-[#94a3b8] hover:text-[#334155] transition-colors w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#f1f5f9]">
                  <X size={18} />
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="bg-gradient-to-r from-[#f0fdf4] to-[#dcfce7] rounded-xl p-4 mb-6 border border-[#d1fae5]">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[11px] text-[#64748b]">Net à payer</span>
                  <span className="font-bold text-[#1e293b] text-[14px]">{fmt(selectedGroup.net_owner_earnings)} MAD</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[11px] text-[#64748b]">Déjà payé</span>
                  <span className="font-semibold text-[#10b981] text-[14px]">{fmt(selectedGroup.amount_paid)} MAD</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-[#bbf7d0]">
                  <span className="text-[12px] font-semibold text-[#1e293b]">Solde restant</span>
                  <span className="font-bold text-[18px] text-[#ef4444]">{fmt(selectedGroup.remaining_balance)} MAD</span>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="text-[12px] font-semibold text-[#334155] mb-1.5 block">Montant *</label>
                  <input className="w-full p-2.5 rounded-xl border border-[#e2e8f0] bg-[#fafbfc] focus:outline-none focus:ring-2 focus:ring-[#10b981]/20 focus:border-[#10b981] text-[13px]" type="number" step="0.01" placeholder="0,00" value={paymentForm.amount} onChange={e => setPaymentForm({...paymentForm, amount:e.target.value})}/>
                </div>
                <div>
                  <label className="text-[12px] font-semibold text-[#334155] mb-1.5 block">Méthode *</label>
                  <select className="w-full p-2.5 rounded-xl border border-[#e2e8f0] bg-white focus:outline-none focus:ring-2 focus:ring-[#10b981]/20 focus:border-[#10b981] text-[13px]" value={paymentForm.payment_method} onChange={e => setPaymentForm({...paymentForm, payment_method:e.target.value})}>
                    {Object.entries(PAYMENT_METHODS).map(([v,l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[12px] font-semibold text-[#334155] mb-1.5 block">Référence transaction</label>
                  <input className="w-full p-2.5 rounded-xl border border-[#e2e8f0] bg-[#fafbfc] focus:outline-none focus:ring-2 focus:ring-[#10b981]/20 focus:border-[#10b981] text-[13px]" placeholder="N° de transaction" value={paymentForm.transaction_id} onChange={e => setPaymentForm({...paymentForm, transaction_id:e.target.value})}/>
                </div>
                <div>
                  <label className="text-[12px] font-semibold text-[#334155] mb-1.5 block">Notes</label>
                  <textarea className="w-full p-2.5 rounded-xl border border-[#e2e8f0] bg-[#fafbfc] focus:outline-none focus:ring-2 focus:ring-[#10b981]/20 focus:border-[#10b981] text-[13px] resize-none min-h-[80px]" placeholder="Notes optionnelles…" value={paymentForm.notes} onChange={e => setPaymentForm({...paymentForm, notes:e.target.value})}/>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-[#f1f5f9] flex gap-3">
              <button className="flex-1 py-2.5 rounded-xl border border-[#e2e8f0] text-[#64748b] font-semibold hover:bg-[#fafbfc] transition-all text-[13px]" onClick={() => setShowPaymentModal(false)}>Annuler</button>
              <button className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#10b981] to-[#059669] text-white font-semibold hover:shadow-lg transition-all text-[13px]" onClick={handleMarkAsPaid} disabled={submitting || !paymentForm.amount}>
                {submitting ? "Traitement…" : "Enregistrer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Details Modal - Modern */}
      {showDetailsModal && selectedPayout && (
        <div className="fixed inset-0 bg-[#0f172a]/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md transform transition-all">
            <div className="relative">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#10b981] to-[#059669] rounded-t-2xl"></div>
              <div className="p-6 border-b border-[#f1f5f9] flex justify-between items-center">
                <div>
                  <h2 className="text-[18px] font-bold bg-gradient-to-r from-[#111827] to-[#10b981] bg-clip-text text-transparent">Détails du paiement</h2>
                  <p className="text-[11px] text-[#94a3b8] mt-0.5">{selectedPayout.property_name}</p>
                </div>
                <button onClick={() => setShowDetailsModal(false)} className="text-[#94a3b8] hover:text-[#334155] transition-colors w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#f1f5f9]">
                  <X size={18} />
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="bg-[#fafbfc] rounded-xl p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[12px] text-[#64748b]">Propriétaire</span>
                  <span className="font-semibold text-[#1e293b] text-[13px]">{selectedPayout.owner_name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[12px] text-[#64748b]">Période</span>
                  <span className="font-semibold text-[#1e293b] text-[13px]">{getMonthDisplay(selectedPayout.month, selectedPayout.year)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[12px] text-[#64748b]">Revenus</span>
                  <span className="font-semibold text-[#1e293b] text-[13px]">{fmt(selectedPayout.total_revenue)} MAD</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[12px] text-[#64748b]">Commission</span>
                  <span className="text-[#ef4444] font-semibold text-[13px]">−{fmt(selectedPayout.commission)} MAD</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[12px] text-[#64748b]">Dépenses</span>
                  <span className="text-[#ef4444] font-semibold text-[13px]">−{fmt(selectedPayout.expenses)} MAD</span>
                </div>
                <div className="pt-2 border-t border-[#e2e8f0] flex justify-between items-center">
                  <span className="font-semibold text-[#1e293b] text-[13px]">Net à payer</span>
                  <span className="font-bold text-[#10b981] text-[16px]">{fmt(selectedPayout.net_owner_earnings)} MAD</span>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-[#f1f5f9]">
              <button className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#10b981] to-[#059669] text-white font-semibold hover:shadow-lg transition-all text-[13px]" onClick={() => setShowDetailsModal(false)}>Fermer</button>
            </div>
          </div>
        </div>
      )}

      {/* Transactions Modal - Modern */}
      {showTransactionsModal && selectedGroup && (
        <div className="fixed inset-0 bg-[#0f172a]/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto transform transition-all">
            <div className="relative">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#10b981] to-[#059669] rounded-t-2xl"></div>
              <div className="p-6 border-b border-[#f1f5f9] flex justify-between items-center sticky top-0 bg-white z-10">
                <div>
                  <h2 className="text-[18px] font-bold bg-gradient-to-r from-[#111827] to-[#10b981] bg-clip-text text-transparent">Transactions</h2>
                  <p className="text-[11px] text-[#94a3b8] mt-0.5">{selectedGroup.property_name} · {selectedGroup.month_display}</p>
                </div>
                <button onClick={() => setShowTransactionsModal(false)} className="text-[#94a3b8] hover:text-[#334155] transition-colors w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#f1f5f9]">
                  <X size={18} />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-3">
              {selectedGroup.payments?.length > 0 ? (
                selectedGroup.payments.map((pay, i) => (
                  <div key={i} className="border border-[#f1f5f9] rounded-xl p-4 hover:shadow-md transition-all">
                    <div className="flex justify-between items-center mb-3">
                      <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-medium bg-[#f0fdf4] text-[#16a34a] border border-[#bbf7d0]">
                        <CheckCircle size={10} /> Complété
                      </span>
                      <span className="font-bold text-[#16a34a] text-[16px]">{fmt(pay.amount)} MAD</span>
                    </div>
                    <p className="text-[13px] font-medium text-[#374151] mb-1">{pay.payment_method_display}</p>
                    <p className="text-[11px] text-[#94a3b8]">{new Date(pay.payment_date).toLocaleDateString("fr-FR")}</p>
                    {pay.transaction_id && <p className="text-[11px] text-[#94a3b8] mt-1">Réf: {pay.transaction_id}</p>}
                    {pay.notes && <p className="text-[12px] text-[#64748b] bg-[#fafbfc] rounded-lg p-2 mt-2">{pay.notes}</p>}
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Receipt size={32} className="mx-auto mb-3 text-[#cbd5e1]" />
                  <p className="text-[13px] text-[#94a3b8]">Aucune transaction</p>
                </div>
              )}
            </div>
            <div className="p-6 border-t border-[#f1f5f9] flex gap-3">
              <button className="flex-1 py-2.5 rounded-xl border border-[#e2e8f0] text-[#64748b] font-semibold hover:bg-[#fafbfc] transition-all text-[13px]" onClick={() => setShowTransactionsModal(false)}>Fermer</button>
              {selectedGroup.status !== "paid" && selectedGroup.remaining_balance > 0 && (
                <button className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#10b981] to-[#059669] text-white font-semibold hover:shadow-lg transition-all text-[13px]" onClick={() => { setShowTransactionsModal(false); setPaymentForm({...paymentForm, amount:selectedGroup.remaining_balance.toString()}); setShowPaymentModal(true); }}>
                  Ajouter un paiement
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Statement Modal - Modern */}
      {showStatementModal && selectedGroup && (
        <div className="fixed inset-0 bg-[#0f172a]/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md transform transition-all">
            <div className="relative">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] rounded-t-2xl"></div>
              <div className="p-6 border-b border-[#f1f5f9] flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#f5f3ff] flex items-center justify-center">
                    <FileText size={18} className="text-[#8b5cf6]" />
                  </div>
                  <div>
                    <h2 className="text-[18px] font-bold bg-gradient-to-r from-[#111827] to-[#8b5cf6] bg-clip-text text-transparent">Relevé de paiement</h2>
                    <p className="text-[11px] text-[#94a3b8] mt-0.5">{selectedGroup.month_display}</p>
                  </div>
                </div>
                <button onClick={() => setShowStatementModal(false)} className="text-[#94a3b8] hover:text-[#334155] transition-colors w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#f1f5f9]">
                  <X size={18} />
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <p className="text-[14px] font-bold text-[#1e293b]">{selectedGroup.property_name}</p>
                <p className="text-[12px] text-[#64748b] mt-0.5">{selectedGroup.owner_name}</p>
              </div>
              <div className="bg-[#fafbfc] rounded-xl p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[12px] text-[#64748b]">Revenus bruts</span>
                  <span className="font-semibold text-[#1e293b] text-[13px]">{fmt(selectedGroup.total_revenue)} MAD</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[12px] text-[#64748b]">Commission agence</span>
                  <span className="text-[#ef4444] font-semibold text-[13px]">−{fmt(selectedGroup.commission)} MAD</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[12px] text-[#64748b]">Dépenses</span>
                  <span className="text-[#ef4444] font-semibold text-[13px]">−{fmt(selectedGroup.expenses)} MAD</span>
                </div>
                <div className="h-px bg-[#e2e8f0] my-2"></div>
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-[#1e293b] text-[13px]">Net propriétaire</span>
                  <span className="font-bold text-[#10b981] text-[16px]">{fmt(selectedGroup.net_owner_earnings)} MAD</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[12px] text-[#64748b]">Montant payé</span>
                  <span className="font-semibold text-[#10b981] text-[13px]">{fmt(selectedGroup.amount_paid)} MAD</span>
                </div>
                <div className="h-px bg-[#e2e8f0] my-2"></div>
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-[#1e293b] text-[13px]">Solde restant</span>
                  <span className={`font-bold text-[16px] ${selectedGroup.remaining_balance > 0 ? 'text-[#ef4444]' : 'text-[#10b981]'}`}>
                    {fmt(selectedGroup.remaining_balance)} MAD
                  </span>
                </div>
              </div>
              <p className="text-[10px] text-[#cbd5e1] text-center mt-4">
                Généré le {new Date().toLocaleDateString("fr-FR")}
              </p>
            </div>
            <div className="p-6 border-t border-[#f1f5f9] flex gap-3">
              <button className="flex-1 py-2.5 rounded-xl border border-[#e2e8f0] text-[#64748b] font-semibold hover:bg-[#fafbfc] transition-all text-[13px]" onClick={() => setShowStatementModal(false)}>Fermer</button>
              <button className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] text-white font-semibold hover:shadow-lg transition-all text-[13px]" onClick={() => window.print()}>
                <Download size={13} className="inline mr-1" /> PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}