// frontend/app/dashboard/payments/page.tsx - COMPLETE REPLACEMENT

"use client";

import { useEffect, useState } from "react";
import {
  DollarSign, TrendingUp, AlertCircle, CheckCircle, Clock,
  Eye, Download, Receipt, RefreshCw, X, Search,
  Building2, User as UserIcon, FileText
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

// Status config
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
      // Use month and year from the payout data
      const month = p.month;
      const year = p.year;
      
      if (!month || !year) {
        console.warn("Missing month/year for payout:", p);
        return;
      }
      
      const key = `${p.owner}_${p.property}_${year}_${month}`;
      const monthKey = getMonthKey(month, year);

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

      // Update status based on remaining balance
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
      
      // Fetch payouts from the summary endpoint
      const pr = await api.get("/api/payments/payouts/summary/");
      const payoutsData = pr.data || [];
      
      console.log("Payouts data:", payoutsData);
      
      const processed = processPayoutsByMonth(payoutsData);
      setGroupedPayouts(processed);
      
      // Fetch payment history
      const pmr = await api.get("/api/payments/payments/history/");
      setPayments((pmr.data || []).map((p: any) => ({ 
        ...p, 
        amount: parseFloat(p.amount) || 0 
      })));

      // Extract available months and years from processed payouts
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
      // Format month as YYYY-MM
      const monthKey = getMonthKey(selectedGroup.month, selectedGroup.year);
      
      await api.post("/api/payments/payments/create/", {
        owner: selectedGroup.owner,
        property: selectedGroup.property,
        amount: amt,
        payment_method: paymentForm.payment_method,
        notes: paymentForm.notes || "",
        transaction_id: paymentForm.transaction_id || "",
        month: monthKey,  // Send month in YYYY-MM format
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
      // Fetch specific payout details
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

  // Filter payouts based on selections
  const filtered = groupedPayouts.filter(p => {
    // Month filter - compare YYYY-MM format
    if (selectedMonth) {
      const payoutMonthKey = getMonthKey(p.month, p.year);
      if (payoutMonthKey !== selectedMonth) return false;
    }
    
    // Year filter
    if (selectedYear && p.year.toString() !== selectedYear) return false;
    
    // Status filter
    if (statusFilter !== "all" && p.status !== statusFilter) return false;
    
    // Search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return p.owner_name?.toLowerCase().includes(q) || 
             p.property_name?.toLowerCase().includes(q);
    }
    
    return true;
  });

  // KPIs
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
    { label: "En attente", value: `${fmt(totalPending)} MAD`, icon: Clock, color: "#d97706", bg: "#fffbeb", border: "#fde68a" },
    { label: "Payé ce mois", value: `${fmt(totalPaidMonth)} MAD`, icon: CheckCircle, color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0" },
    { label: "Total revenus", value: `${fmt(totalEarnings)} MAD`, icon: TrendingUp, color: "#2563eb", bg: "#eff6ff", border: "#bfdbfe" },
    { label: "Soldes impayés", value: `${fmt(totalUnpaid)} MAD`, icon: AlertCircle, color: "#dc2626", bg: "#fef2f2", border: "#fecaca" },
  ];

  // Modal styles
  const overlay: React.CSSProperties = {
    position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)",
    backdropFilter: "blur(4px)", display: "flex",
    alignItems: "center", justifyContent: "center", zIndex: 50, padding: "1rem",
  };
  
  const modal: React.CSSProperties = {
    background: "#fff", borderRadius: 14, width: "100%", maxWidth: 460,
    boxShadow: "0 20px 60px rgba(0,0,0,0.12)",
    border: "1px solid #e5e7eb", overflow: "hidden",
  };
  
  const mHead: React.CSSProperties = {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "1.125rem 1.5rem", borderBottom: "1px solid #f3f4f6",
  };
  
  const mBody: React.CSSProperties = { padding: "1.5rem" };
  const mFoot: React.CSSProperties = {
    display: "flex", gap: 8, padding: "1rem 1.5rem",
    borderTop: "1px solid #f3f4f6",
  };
  
  const infoRow: React.CSSProperties = {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "7px 0", borderBottom: "1px solid #f9fafb", fontSize: 13,
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700&display=swap');
        .py-pg { font-family:'Geist',system-ui,sans-serif; color:#111827; }
        .py-input {
          font-family:'Geist',system-ui,sans-serif;
          background:#fafafa; border:1.5px solid #e5e7eb; border-radius:8px;
          font-size:13px; color:#111827; padding:8.5px 12px;
          outline:none; width:100%; transition:border-color .15s, box-shadow .15s;
        }
        .py-input::placeholder { color:#d1d5db; }
        .py-input:focus { border-color:#22c55e; background:#fff; box-shadow:0 0 0 3px rgba(34,197,94,.1); }
        .py-select {
          font-family:'Geist',system-ui,sans-serif;
          background:#fff; border:1.5px solid #e5e7eb; border-radius:8px;
          font-size:13px; color:#374151; padding:8.5px 12px;
          outline:none; cursor:pointer; transition:border-color .15s;
        }
        .py-select:focus { border-color:#22c55e; box-shadow:0 0 0 3px rgba(34,197,94,.1); }
        .py-btn-green {
          display:inline-flex; align-items:center; justify-content:center; gap:6px;
          padding:9px 20px; border-radius:8px; border:none; cursor:pointer;
          font-family:'Geist',system-ui,sans-serif; font-size:13px; font-weight:500;
          background:#22c55e; color:#fff;
          transition:background .14s;
        }
        .py-btn-green:hover:not(:disabled) { background:#16a34a; }
        .py-btn-green:disabled { opacity:.45; cursor:not-allowed; }
        .py-btn-outline {
          display:inline-flex; align-items:center; justify-content:center; gap:6px;
          padding:9px 20px; border-radius:8px; cursor:pointer;
          font-family:'Geist',system-ui,sans-serif; font-size:13px; font-weight:500;
          background:#fff; color:#374151; border:1.5px solid #e5e7eb;
        }
        .py-btn-outline:hover { background:#f9fafb; }
        .py-btn-icon {
          width:32px; height:32px; border-radius:7px; border:none; background:none;
          display:flex; align-items:center; justify-content:center;
          cursor:pointer; transition:background .12s;
        }
        .py-tr:hover { background:#fafafa; }
        textarea.py-input { resize:vertical; min-height:72px; }
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
      `}</style>

      <div className="py-pg" style={{ padding:"1.75rem 2rem", minHeight:"100vh", background:"#f9fafb" }}>

        {/* Header */}
        <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:"1.5rem" }}>
          <div>
            <h1 style={{ fontSize:19, fontWeight:700, letterSpacing:"-.02em", color:"#111827", marginBottom:3 }}>
              Paiements propriétaires
            </h1>
            <p style={{ fontSize:12.5, color:"#9ca3af" }}>
              Net à payer = Revenus − Commission − Dépenses
            </p>
          </div>
          <button
            className="py-btn-outline"
            onClick={handleRefresh}
            disabled={refreshing}
            style={{ gap:6, fontSize:12.5, padding:"7px 14px" }}
          >
            <RefreshCw size={13} style={{ animation: refreshing ? "spin .8s linear infinite" : "none" }}/>
            {refreshing ? "Actualisation…" : "Actualiser"}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div style={{ background:"#fef2f2", border:"1px solid #fecaca", borderLeft:"3px solid #ef4444", borderRadius:8, padding:"11px 14px", fontSize:13, color:"#dc2626", marginBottom:"1.25rem", display:"flex", alignItems:"center", gap:8 }}>
            <AlertCircle size={14}/>{error}
          </div>
        )}

        {/* KPI Cards */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"1rem", marginBottom:"1.5rem" }}>
          {kpis.map((k, i) => (
            <div key={i} style={{ background:"#fff", border:"1px solid #f3f4f6", borderRadius:12, padding:"1.125rem 1.25rem", boxShadow:"0 1px 3px rgba(0,0,0,.04)" }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
                <div style={{ width:34, height:34, borderRadius:8, background:k.bg, border:`1px solid ${k.border}`, display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <k.icon size={15} color={k.color}/>
                </div>
              </div>
              <p style={{ fontSize:11.5, color:"#9ca3af", marginBottom:4 }}>{k.label}</p>
              <p style={{ fontSize:20, fontWeight:700, color:"#111827", letterSpacing:"-.025em", lineHeight:1 }}>{k.value}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div style={{ display:"flex", gap:8, marginBottom:"1.25rem", flexWrap:"wrap" }}>
          <div style={{ position:"relative", flex:1, minWidth:220 }}>
            <Search size={13} style={{ position:"absolute", left:11, top:"50%", transform:"translateY(-50%)", color:"#d1d5db", pointerEvents:"none" }}/>
            <input className="py-input" style={{ paddingLeft:32 }} placeholder="Rechercher propriétaire ou bien…" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}/>
          </div>
          
          <select className="py-select" value={selectedYear} onChange={e => setSelectedYear(e.target.value)}>
            <option value="">Toutes les années</option>
            {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          
          <select className="py-select" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)}>
            <option value="">Tous les mois</option>
            {availableMonths.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
          
          <select className="py-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="all">Tous les statuts</option>
            <option value="pending">En attente</option>
            <option value="partial">Partiel</option>
            <option value="paid">Payé</option>
            <option value="overdue">En retard</option>
          </select>
        </div>

        {/* Table */}
        <div style={{ background:"#fff", border:"1px solid #e5e7eb", borderRadius:12, overflow:"hidden", boxShadow:"0 1px 3px rgba(0,0,0,.04)", marginBottom:"1.5rem" }}>
          <div style={{ padding:"1rem 1.5rem", borderBottom:"1px solid #f3f4f6", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div>
              <p style={{ fontSize:14, fontWeight:600, color:"#111827" }}>Paiements groupés</p>
              <p style={{ fontSize:11.5, color:"#9ca3af", marginTop:2 }}>{filtered.length} enregistrement{filtered.length !== 1 ? "s" : ""}</p>
            </div>
          </div>

          {loading ? (
            <div>
              {[...Array(5)].map((_, i) => (
                <div key={i} style={{ padding:"1rem 1.5rem", borderBottom:"1px solid #f9fafb", display:"flex", gap:12 }}>
                  <div style={{ height:14, borderRadius:4, background:"linear-gradient(90deg,#f3f4f6 25%,#e9eaeb 50%,#f3f4f6 75%)", backgroundSize:"200% 100%", animation:"shimmer 1.4s infinite", width:"25%" }}/>
                  <div style={{ height:14, borderRadius:4, background:"linear-gradient(90deg,#f3f4f6 25%,#e9eaeb 50%,#f3f4f6 75%)", backgroundSize:"200% 100%", animation:"shimmer 1.4s infinite", width:"15%" }}/>
                  <div style={{ height:14, borderRadius:4, background:"linear-gradient(90deg,#f3f4f6 25%,#e9eaeb 50%,#f3f4f6 75%)", backgroundSize:"200% 100%", animation:"shimmer 1.4s infinite", width:"10%" }}/>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign:"center", padding:"4rem 1rem" }}>
              <DollarSign size={32} style={{ margin:"0 auto 10px", display:"block", color:"#d1d5db" }}/>
              <p style={{ fontSize:14, fontWeight:500, color:"#374151" }}>Aucun paiement trouvé</p>
              <p style={{ fontSize:12.5, color:"#9ca3af", marginTop:4 }}>Modifiez les filtres pour afficher des résultats</p>
            </div>
          ) : (
            <div style={{ overflowX:"auto" }}>
              <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
                <thead>
                  <tr style={{ background:"#f9fafb", borderBottom:"1px solid #f3f4f6" }}>
                    {["Bien / Propriétaire","Période","Revenus","Commission","Dépenses","Net","Payé","Restant","Statut",""].map((h, i) => (
                      <th key={i} style={{
                        padding:"10px 16px", textAlign: i >= 2 && i <= 7 ? "right" : i === 8 ? "center" : "left",
                        fontSize:10.5, fontWeight:600, color:"#9ca3af",
                        letterSpacing:"0.06em", textTransform:"uppercase",
                        whiteSpace:"nowrap",
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(p => {
                    const s = STATUS[p.status] ?? STATUS.pending;
                    const SIcon = s.icon;
                    return (
                      <tr key={p.id} className="py-tr" style={{ borderBottom:"1px solid #f9fafb" }}>
                        <td style={{ padding:"13px 16px" }}>
                          <p style={{ fontWeight:500, color:"#111827", marginBottom:2 }}>{p.property_name || "—"}</p>
                          <div style={{ display:"flex", alignItems:"center", gap:5, color:"#9ca3af" }}>
                            <UserIcon size={11}/>
                            <span style={{ fontSize:12 }}>{p.owner_name || "—"}</span>
                          </div>
                        </td>
                        <td style={{ padding:"13px 16px" }}>
                          <span style={{ fontSize:12.5, color:"#374151", whiteSpace:"nowrap" }}>{p.month_display}</span>
                        </td>
                        <td style={{ padding:"13px 16px", textAlign:"right", fontWeight:500, color:"#111827", whiteSpace:"nowrap" }}>
                          {fmt(p.total_revenue)} MAD
                        </td>
                        <td style={{ padding:"13px 16px", textAlign:"right", color:"#dc2626", whiteSpace:"nowrap" }}>
                          −{fmt(p.commission)} MAD
                        </td>
                        <td style={{ padding:"13px 16px", textAlign:"right", color:"#dc2626", whiteSpace:"nowrap" }}>
                          −{fmt(p.expenses)} MAD
                        </td>
                        <td style={{ padding:"13px 16px", textAlign:"right", fontWeight:700, color:"#16a34a", whiteSpace:"nowrap" }}>
                          {fmt(p.net_owner_earnings)} MAD
                        </td>
                        <td style={{ padding:"13px 16px", textAlign:"right", color:"#374151", whiteSpace:"nowrap" }}>
                          {fmt(p.amount_paid)} MAD
                        </td>
                        <td style={{ padding:"13px 16px", textAlign:"right", fontWeight:600, color: p.remaining_balance > 0 ? "#dc2626" : "#16a34a", whiteSpace:"nowrap" }}>
                          {fmt(p.remaining_balance)} MAD
                        </td>
                        <td style={{ padding:"13px 16px", textAlign:"center" }}>
                          <span style={{
                            display:"inline-flex", alignItems:"center", gap:5,
                            padding:"4px 10px", borderRadius:6,
                            fontSize:11.5, fontWeight:500,
                            color:s.color, background:s.bg, border:`1px solid ${s.border}`,
                            whiteSpace:"nowrap",
                          }}>
                            <SIcon size={11}/>{p.status_display}
                          </span>
                        </td>
                        <td style={{ padding:"13px 16px" }}>
                          <div style={{ display:"flex", alignItems:"center", gap:2, justifyContent:"flex-end" }}>
                            <button className="py-btn-icon" style={{ color:"#6b7280" }} title="Détails"
                              onClick={() => handleViewDetails(p)}>
                              <Eye size={14}/>
                            </button>
                            {p.payments.length > 0 && (
                              <button className="py-btn-icon" style={{ color:"#2563eb" }} title="Transactions"
                                onClick={() => { setSelectedGroup(p); setShowTransactionsModal(true); }}>
                                <Receipt size={14}/>
                              </button>
                            )}
                            {p.status !== "paid" && p.remaining_balance > 0 && (
                              <button className="py-btn-icon" style={{ color:"#16a34a" }} title="Payer"
                                onClick={() => { setSelectedGroup(p); setPaymentForm({ ...paymentForm, amount: p.remaining_balance.toString() }); setShowPaymentModal(true); }}>
                                <CheckCircle size={14}/>
                              </button>
                            )}
                            <button className="py-btn-icon" style={{ color:"#8b5cf6" }} title="Relevé"
                              onClick={() => { setSelectedGroup(p); setShowStatementModal(true); }}>
                              <Download size={14}/>
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
            <div style={{ padding:"10px 1.5rem", borderTop:"1px solid #f3f4f6", background:"#f9fafb", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
              <p style={{ fontSize:12, color:"#9ca3af" }}>
                {filtered.length} résultat{filtered.length !== 1 ? "s" : ""}
              </p>
              <div style={{ display:"flex", gap:4, alignItems:"center" }}>
                <span style={{ fontSize:11.5, color:"#9ca3af" }}>
                  Net total: <strong style={{ color:"#16a34a" }}>{fmt(filtered.reduce((s,p)=>s+p.net_owner_earnings,0))} MAD</strong>
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && selectedGroup && (
        <div style={overlay} onClick={e => e.target === e.currentTarget && setShowPaymentModal(false)}>
          <div style={modal}>
            <div style={mHead}>
              <div>
                <p style={{ fontSize:15, fontWeight:600, color:"#111827" }}>Enregistrer un paiement</p>
                <p style={{ fontSize:12, color:"#9ca3af", marginTop:2 }}>{selectedGroup.property_name} · {selectedGroup.month_display}</p>
              </div>
              <button className="py-btn-icon" onClick={() => setShowPaymentModal(false)} style={{ color:"#9ca3af" }}>
                <X size={16}/>
              </button>
            </div>
            <div style={mBody}>
              <div style={{ background:"#f9fafb", border:"1px solid #f3f4f6", borderRadius:9, padding:"1rem", marginBottom:"1.25rem" }}>
                <div style={infoRow}><span style={{ color:"#9ca3af" }}>Net à payer</span><span style={{ fontWeight:600, color:"#111827" }}>{fmt(selectedGroup.net_owner_earnings)} MAD</span></div>
                <div style={infoRow}><span style={{ color:"#9ca3af" }}>Déjà payé</span><span style={{ fontWeight:600, color:"#16a34a" }}>{fmt(selectedGroup.amount_paid)} MAD</span></div>
                <div style={{ ...infoRow, borderBottom:"none", paddingTop:10 }}>
                  <span style={{ fontWeight:500, color:"#111827" }}>Solde restant</span>
                  <span style={{ fontWeight:700, color:"#dc2626" }}>{fmt(selectedGroup.remaining_balance)} MAD</span>
                </div>
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:"1rem" }}>
                <div>
                  <label style={{ fontSize:11.5, fontWeight:500, color:"#374151", marginBottom:5, display:"block" }}>Montant *</label>
                  <input className="py-input" type="number" step="0.01" placeholder="0,00" value={paymentForm.amount} onChange={e => setPaymentForm({...paymentForm, amount:e.target.value})}/>
                </div>
                <div>
                  <label style={{ fontSize:11.5, fontWeight:500, color:"#374151", marginBottom:5, display:"block" }}>Méthode *</label>
                  <select className="py-select" style={{ width:"100%" }} value={paymentForm.payment_method} onChange={e => setPaymentForm({...paymentForm, payment_method:e.target.value})}>
                    {Object.entries(PAYMENT_METHODS).map(([v,l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize:11.5, fontWeight:500, color:"#374151", marginBottom:5, display:"block" }}>Référence transaction</label>
                  <input className="py-input" placeholder="N° de transaction" value={paymentForm.transaction_id} onChange={e => setPaymentForm({...paymentForm, transaction_id:e.target.value})}/>
                </div>
                <div>
                  <label style={{ fontSize:11.5, fontWeight:500, color:"#374151", marginBottom:5, display:"block" }}>Notes</label>
                  <textarea className="py-input" placeholder="Notes optionnelles…" value={paymentForm.notes} onChange={e => setPaymentForm({...paymentForm, notes:e.target.value})}/>
                </div>
              </div>
            </div>
            <div style={mFoot}>
              <button className="py-btn-outline" style={{ flex:1 }} onClick={() => setShowPaymentModal(false)}>Annuler</button>
              <button className="py-btn-green" style={{ flex:1 }} onClick={handleMarkAsPaid} disabled={submitting || !paymentForm.amount}>
                {submitting ? "Traitement…" : "Enregistrer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedPayout && (
        <div style={overlay} onClick={e => e.target === e.currentTarget && setShowDetailsModal(false)}>
          <div style={{ ...modal, maxWidth:480, maxHeight:"90vh", overflowY:"auto" }}>
            <div style={mHead}>
              <div>
                <p style={{ fontSize:15, fontWeight:600, color:"#111827" }}>Détails du paiement</p>
                <p style={{ fontSize:12, color:"#9ca3af", marginTop:2 }}>{selectedPayout.property_name}</p>
              </div>
              <button className="py-btn-icon" onClick={() => setShowDetailsModal(false)} style={{ color:"#9ca3af" }}>
                <X size={16}/>
              </button>
            </div>
            <div style={mBody}>
              <div style={{ background:"#f9fafb", border:"1px solid #f3f4f6", borderRadius:9, padding:"1rem", marginBottom:"1.25rem" }}>
                <div style={infoRow}><span style={{ color:"#9ca3af" }}>Propriétaire</span><span style={{ fontWeight:500, color:"#111827" }}>{selectedPayout.owner_name}</span></div>
                <div style={infoRow}><span style={{ color:"#9ca3af" }}>Période</span><span style={{ fontWeight:500, color:"#111827" }}>{getMonthDisplay(selectedPayout.month, selectedPayout.year)}</span></div>
                <div style={infoRow}><span style={{ color:"#9ca3af" }}>Revenus</span><span style={{ fontWeight:500, color:"#111827" }}>{fmt(selectedPayout.total_revenue)} MAD</span></div>
                <div style={infoRow}><span style={{ color:"#9ca3af" }}>Commission</span><span style={{ color:"#dc2626" }}>−{fmt(selectedPayout.commission)} MAD</span></div>
                <div style={infoRow}><span style={{ color:"#9ca3af" }}>Dépenses</span><span style={{ color:"#dc2626" }}>−{fmt(selectedPayout.expenses)} MAD</span></div>
                <div style={{ ...infoRow, borderBottom:"none", paddingTop:10 }}>
                  <span style={{ fontWeight:500, color:"#111827" }}>Net à payer</span>
                  <span style={{ fontWeight:700, color:"#16a34a" }}>{fmt(selectedPayout.net_owner_earnings)} MAD</span>
                </div>
              </div>
            </div>
            <div style={mFoot}>
              <button className="py-btn-green" style={{ flex:1 }} onClick={() => setShowDetailsModal(false)}>Fermer</button>
            </div>
          </div>
        </div>
      )}

      {/* Transactions Modal */}
      {showTransactionsModal && selectedGroup && (
        <div style={overlay} onClick={e => e.target === e.currentTarget && setShowTransactionsModal(false)}>
          <div style={{ ...modal, maxWidth:520 }}>
            <div style={mHead}>
              <div>
                <p style={{ fontSize:15, fontWeight:600, color:"#111827" }}>Transactions</p>
                <p style={{ fontSize:12, color:"#9ca3af", marginTop:2 }}>{selectedGroup.property_name} · {selectedGroup.month_display}</p>
              </div>
              <button className="py-btn-icon" onClick={() => setShowTransactionsModal(false)} style={{ color:"#9ca3af" }}>
                <X size={16}/>
              </button>
            </div>
            <div style={{ ...mBody, maxHeight:400, overflowY:"auto" }}>
              {selectedGroup.payments?.length > 0 ? (
                <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                  {selectedGroup.payments.map((pay, i) => (
                    <div key={i} style={{ border:"1px solid #f3f4f6", borderRadius:9, padding:"1rem" }}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
                        <span style={{
                          display:"inline-flex", alignItems:"center", gap:4,
                          fontSize:11, fontWeight:500, color:"#16a34a",
                          background:"#f0fdf4", border:"1px solid #bbf7d0", borderRadius:5, padding:"2px 8px"
                        }}>
                          <CheckCircle size={10}/> Complété
                        </span>
                        <span style={{ fontSize:16, fontWeight:700, color:"#16a34a" }}>{fmt(pay.amount)} MAD</span>
                      </div>
                      <p style={{ fontSize:12.5, color:"#374151" }}>{pay.payment_method_display}</p>
                      <p style={{ fontSize:12, color:"#9ca3af", marginTop:3 }}>{new Date(pay.payment_date).toLocaleDateString("fr-FR")}</p>
                      {pay.transaction_id && <p style={{ fontSize:11.5, color:"#9ca3af", marginTop:3 }}>Réf: {pay.transaction_id}</p>}
                      {pay.notes && <p style={{ fontSize:12.5, color:"#6b7280", background:"#f9fafb", borderRadius:6, padding:"6px 9px", marginTop:6 }}>{pay.notes}</p>}
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign:"center", padding:"2.5rem 0" }}>
                  <Receipt size={28} style={{ margin:"0 auto 8px", display:"block", color:"#d1d5db" }}/>
                  <p style={{ fontSize:13, color:"#9ca3af" }}>Aucune transaction</p>
                </div>
              )}
            </div>
            <div style={mFoot}>
              <button className="py-btn-outline" style={{ flex:1 }} onClick={() => setShowTransactionsModal(false)}>Fermer</button>
              {selectedGroup.status !== "paid" && selectedGroup.remaining_balance > 0 && (
                <button className="py-btn-green" style={{ flex:1 }} onClick={() => { setShowTransactionsModal(false); setPaymentForm({...paymentForm, amount:selectedGroup.remaining_balance.toString()}); setShowPaymentModal(true); }}>
                  Ajouter un paiement
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Statement Modal */}
      {showStatementModal && selectedGroup && (
        <div style={overlay} onClick={e => e.target === e.currentTarget && setShowStatementModal(false)}>
          <div style={modal}>
            <div style={mHead}>
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <div style={{ width:34, height:34, borderRadius:8, background:"#f5f3ff", border:"1px solid #ddd6fe", display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <FileText size={15} color="#8b5cf6"/>
                </div>
                <div>
                  <p style={{ fontSize:15, fontWeight:600, color:"#111827" }}>Relevé de paiement</p>
                  <p style={{ fontSize:12, color:"#9ca3af", marginTop:1 }}>{selectedGroup.month_display}</p>
                </div>
              </div>
              <button className="py-btn-icon" onClick={() => setShowStatementModal(false)} style={{ color:"#9ca3af" }}>
                <X size={16}/>
              </button>
            </div>
            <div style={mBody}>
              <div style={{ marginBottom:"1.25rem" }}>
                <p style={{ fontSize:13.5, fontWeight:600, color:"#111827" }}>{selectedGroup.property_name}</p>
                <p style={{ fontSize:12.5, color:"#9ca3af", marginTop:2 }}>{selectedGroup.owner_name}</p>
              </div>
              <div style={{ background:"#f9fafb", border:"1px solid #f3f4f6", borderRadius:9, padding:"1rem" }}>
                <div style={infoRow}><span style={{ color:"#9ca3af" }}>Revenus bruts</span><span style={{ fontWeight:500, color:"#111827" }}>{fmt(selectedGroup.total_revenue)} MAD</span></div>
                <div style={infoRow}><span style={{ color:"#9ca3af" }}>Commission agence</span><span style={{ color:"#dc2626" }}>−{fmt(selectedGroup.commission)} MAD</span></div>
                <div style={infoRow}><span style={{ color:"#9ca3af" }}>Dépenses</span><span style={{ color:"#dc2626" }}>−{fmt(selectedGroup.expenses)} MAD</span></div>
                <div style={{ height:1, background:"#e5e7eb", margin:"8px 0" }}/>
                <div style={infoRow}><span style={{ fontWeight:600, color:"#111827" }}>Net propriétaire</span><span style={{ fontWeight:700, color:"#16a34a" }}>{fmt(selectedGroup.net_owner_earnings)} MAD</span></div>
                <div style={infoRow}><span style={{ color:"#9ca3af" }}>Montant payé</span><span style={{ fontWeight:600, color:"#16a34a" }}>{fmt(selectedGroup.amount_paid)} MAD</span></div>
                <div style={{ height:1, background:"#e5e7eb", margin:"8px 0" }}/>
                <div style={{ ...infoRow, borderBottom:"none" }}>
                  <span style={{ fontWeight:600, color:"#111827" }}>Solde restant</span>
                  <span style={{ fontWeight:700, color: selectedGroup.remaining_balance > 0 ? "#dc2626" : "#16a34a" }}>
                    {fmt(selectedGroup.remaining_balance)} MAD
                  </span>
                </div>
              </div>
              <p style={{ fontSize:11, color:"#d1d5db", textAlign:"center", marginTop:12 }}>
                Généré le {new Date().toLocaleDateString("fr-FR")}
              </p>
            </div>
            <div style={mFoot}>
              <button className="py-btn-outline" style={{ flex:1 }} onClick={() => setShowStatementModal(false)}>Fermer</button>
              <button className="py-btn-green" style={{ flex:1 }} onClick={() => window.print()}>
                <Download size={13}/> PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}