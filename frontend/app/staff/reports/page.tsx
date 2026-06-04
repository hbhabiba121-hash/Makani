"use client";

import { useState, useEffect } from "react";
import { 
  TrendingUp, 
  TrendingDown, 
  Building2, 
  DollarSign, 
  Percent, 
  Calendar,
  Download,
  BarChart3,
  AlertCircle
} from "lucide-react";
// Si tu utilises ton instance axios personnalisée :
// import { api } from "@/lib/axios";

interface MonthlyStat {
  month: string;
  revenue: number;
  expenses: number;
  netGain: number;
  occupancyRate: number;
}

export default function StaffReports() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState("2026");

  // Données fictives structurées prêtes à être branchées sur l'API Django
  const statsSummary = {
    totalRevenue: "142 500 MAD",
    totalCommission: "28 500 MAD",
    activeProperties: "12",
    averageOccupancy: "88%"
  };

  const monthlyBreakdown: MonthlyStat[] = [
    { month: "Mai 2026", revenue: 45000, expenses: 4200, netGain: 40800, occupancyRate: 92 },
    { month: "Avril 2026", revenue: 52000, expenses: 8500, netGain: 43500, occupancyRate: 95 },
    { month: "Mars 2026", revenue: 45500, expenses: 3100, netGain: 42400, occupancyRate: 78 },
  ];

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
      <div style={{ width: 36, height: 36, border: "3px solid #ecfdf5", borderTop: "3px solid #10B981", borderRadius: "50%", animation: "spin .8s linear infinite" }}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <div style={{ width: "100%", maxWidth: "1200px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "2rem" }}>
      
      {/* En-tête de la page */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "#111827", margin: 0, letterSpacing: "-0.02em" }}>
            Rapports & Analyses
          </h1>
          <p style={{ fontSize: "0.875rem", color: "#6b7280", marginTop: "0.25rem" }}>
            Suivez les performances financières et le taux d'occupation des biens sous votre gestion.
          </p>
        </div>

        {/* Sélecteur d'année & Export rapide */}
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", background: "#ffffff", border: "1px solid #f3f4f6", borderRadius: "8px", padding: "0.5rem 0.75rem", gap: "0.5rem" }}>
            <Calendar size={16} color="#9ca3af" />
            <select 
              value={selectedYear} 
              onChange={(e) => setSelectedYear(e.target.value)}
              style={{ border: "none", background: "transparent", outline: "none", fontSize: "0.875rem", color: "#374151", cursor: "pointer", fontWeight: 500 }}
            >
              <option value="2026">2026</option>
              <option value="2025">2025</option>
            </select>
          </div>

          <button style={{ display: "flex", alignItems: "center", gap: "0.5rem", background: "#ffffff", border: "1px solid #f3f4f6", borderRadius: "8px", padding: "0.55rem 1rem", fontSize: "0.875rem", fontWeight: 500, color: "#374151", cursor: "pointer" }}>
            <Download size={15} />
            Exporter
          </button>
        </div>
      </div>

      {error && (
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "1rem", background: "#fef2f2", borderRadius: "8px", border: "1px solid #fecaca", color: "#dc2626", fontSize: "0.875rem" }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Grille de KPI (Cartes de statistiques) */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1.25rem" }}>
        
        {/* Carte : Revenus Générés */}
        <div style={{ background: "#ffffff", padding: "1.5rem", borderRadius: "12px", border: "1px solid #f3f4f6", boxShadow: "0 1px 2px rgba(0,0,0,0.02)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <span style={{ fontSize: "0.85rem", fontWeight: 500, color: "#6b7280" }}>Revenus Générés</span>
            <div style={{ width: "32px", height: "32px", borderRadius: "6px", background: "#ecfdf5", display: "flex", alignItems: "center", justifyContent: "center", color: "#10B981" }}>
              <DollarSign size={16} />
            </div>
          </div>
          <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "#111827" }}>{statsSummary.totalRevenue}</div>
          <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "0.75rem", color: "#059669", marginTop: "0.5rem", fontWeight: 500 }}>
            <TrendingUp size={14} /> +12.4% <span style={{ color: "#9ca3af", fontWeight: 400 }}>vs mois dernier</span>
          </div>
        </div>

        {/* Carte : Commission Agence */}
        <div style={{ background: "#ffffff", padding: "1.5rem", borderRadius: "12px", border: "1px solid #f3f4f6", boxShadow: "0 1px 2px rgba(0,0,0,0.02)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <span style={{ fontSize: "0.85rem", fontWeight: 500, color: "#6b7280" }}>Commissions Makani (20%)</span>
            <div style={{ width: "32px", height: "32px", borderRadius: "6px", background: "#ecfdf5", display: "flex", alignItems: "center", justifyContent: "center", color: "#10B981" }}>
              <Percent size={16} />
            </div>
          </div>
          <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "#111827" }}>{statsSummary.totalCommission}</div>
          <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "0.75rem", color: "#059669", marginTop: "0.5rem", fontWeight: 500 }}>
            <TrendingUp size={14} /> +8.2% <span style={{ color: "#9ca3af", fontWeight: 400 }}>générées</span>
          </div>
        </div>

        {/* Carte : Taux d'Occupation */}
        <div style={{ background: "#ffffff", padding: "1.5rem", borderRadius: "12px", border: "1px solid #f3f4f6", boxShadow: "0 1px 2px rgba(0,0,0,0.02)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <span style={{ fontSize: "0.85rem", fontWeight: 500, color: "#6b7280" }}>Taux d'occupation moyen</span>
            <div style={{ width: "32px", height: "32px", borderRadius: "6px", background: "#ecfdf5", display: "flex", alignItems: "center", justifyContent: "center", color: "#10B981" }}>
              <BarChart3 size={16} />
            </div>
          </div>
          <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "#111827" }}>{statsSummary.averageOccupancy}</div>
          <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "0.75rem", color: "#ef4444", marginTop: "0.5rem", fontWeight: 500 }}>
            <TrendingDown size={14} /> -1.5% <span style={{ color: "#9ca3af", fontWeight: 400 }}>ce mois-ci</span>
          </div>
        </div>

        {/* Carte : Biens Gérés */}
        <div style={{ background: "#ffffff", padding: "1.5rem", borderRadius: "12px", border: "1px solid #f3f4f6", boxShadow: "0 1px 2px rgba(0,0,0,0.02)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <span style={{ fontSize: "0.85rem", fontWeight: 500, color: "#6b7280" }}>Biens sous gestion</span>
            <div style={{ width: "32px", height: "32px", borderRadius: "6px", background: "#ecfdf5", display: "flex", alignItems: "center", justifyContent: "center", color: "#10B981" }}>
              <Building2 size={16} />
            </div>
          </div>
          <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "#111827" }}>{statsSummary.activeProperties}</div>
          <div style={{ fontSize: "0.75rem", color: "#6b7280", marginTop: "0.7rem" }}>
            Tous les biens sont actifs
          </div>
        </div>

      </div>

      {/* Tableau détaillé de l'historique mensuel */}
      <div style={{ background: "#ffffff", borderRadius: "12px", border: "1px solid #f3f4f6", overflow: "hidden", boxShadow: "0 1px 2px rgba(0,0,0,0.02)" }}>
        <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid #f3f4f6" }}>
          <h2 style={{ fontSize: "0.95rem", fontWeight: 600, color: "#111827", margin: 0 }}>Détails de la performance mensuelle</h2>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ fontSize: "11px", fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", textAlign: "left", borderBottom: "1px solid #f3f4f6" }}>
                <th style={{ padding: "1rem 1.5rem" }}>Mois</th>
                <th style={{ padding: "1rem 1.5rem" }}>Revenus totaux</th>
                <th style={{ padding: "1rem 1.5rem" }}>Charges & Maintenance</th>
                <th style={{ padding: "1rem 1.5rem" }}>Bénéfice Net Propriétaires</th>
                <th style={{ padding: "1rem 1.5rem" }}>Taux d'occupation</th>
              </tr>
            </thead>
            <tbody style={{ fontSize: "0.9rem", color: "#374151" }}>
              {monthlyBreakdown.map((row, index) => (
                <tr key={index} style={{ borderBottom: "1px solid #f3f4f6" }}>
                  <td style={{ padding: "1.1rem 1.5rem", fontWeight: 600, color: "#111827" }}>{row.month}</td>
                  <td style={{ padding: "1.1rem 1.5rem", color: "#059669", fontWeight: 500 }}>+{row.revenue.toLocaleString("fr-FR")} MAD</td>
                  <td style={{ padding: "1.1rem 1.5rem", color: "#ef4444" }}>-{row.expenses.toLocaleString("fr-FR")} MAD</td>
                  <td style={{ padding: "1.1rem 1.5rem", fontWeight: 600, color: "#111827" }}>{row.netGain.toLocaleString("fr-FR")} MAD</td>
                  <td style={{ padding: "1.1rem 1.5rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      {/* Petite barre de progression visuelle pour le taux d'occupation */}
                      <div style={{ width: "60px", background: "#f3f4f6", height: "6px", borderRadius: "3px", overflow: "hidden" }}>
                        <div style={{ width: `${row.occupancyRate}%`, background: "#10B981", height: "100%" }} />
                      </div>
                      <span style={{ fontWeight: 500 }}>{row.occupancyRate}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}