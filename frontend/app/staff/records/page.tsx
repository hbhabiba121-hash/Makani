"use client";

import { useState } from 'react';
import { Save, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function FinancialRecordsPage() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle');
  const [formData, setFormData] = useState({
    property: '', // ID de la propriété
    month: new Date().getMonth() + 1,
    year: 2026,
    revenue: '',
    expenses: '',
    commission_rate: 20, // Business rule standard
    notes: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    
    try {
      const res = await fetch('http://127.0.0.1:8000/api/financials/records/', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}` 
        },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        setStatus('success');
        setTimeout(() => setStatus('idle'), 3000);
      } else {
        setStatus('idle');
        alert("Erreur : Vérifiez vos données ou vos permissions.");
      }
    } catch (err) {
      console.error(err);
      setStatus('idle');
      alert("Erreur de connexion au serveur.");
    }
  };

  return (
    <div style={{ width: "100%", maxWidth: "800px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "2rem" }}>
      
      {/* En-tête de la page */}
      <div>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "#111827", margin: 0, letterSpacing: "-0.02em" }}>
          Rapport financier
        </h1>
        <p style={{ fontSize: "0.875rem", color: "#6b7280", marginTop: "0.25rem" }}>
          Ajoutez les revenus et dépenses mensuels pour vos propriétés assignées.
        </p>
      </div>

      {/* Formulaire Épuré */}
      <form onSubmit={handleSubmit} style={{ background: "#ffffff", borderRadius: "12px", padding: "2rem", border: "1px solid #f3f4f6", boxShadow: "0 1px 2px rgba(0,0,0,0.02)", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
          
          {/* Sélection Période */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <label style={{ fontSize: "11px", fontWeight: 600, color: "#9ca3af", textTransform: "uppercase" }}>Période</label>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <input 
                type="number" 
                placeholder="MM" 
                min="1" max="12"
                style={{ width: "35%", padding: "0.65rem 0.75rem", bg: "#ffffff", border: "1px solid #e5e7eb", borderRadius: "8px", outline: "none", fontSize: "0.875rem", textAlign: "center" }}
                value={formData.month} 
                onChange={(e) => setFormData({...formData, month: parseInt(e.target.value)})} 
                required 
              />
              <input 
                type="number" 
                placeholder="AAAA" 
                style={{ width: "65%", padding: "0.65rem 0.75rem", bg: "#ffffff", border: "1px solid #e5e7eb", borderRadius: "8px", outline: "none", fontSize: "0.875rem", textAlign: "center" }}
                value={formData.year} 
                onChange={(e) => setFormData({...formData, year: parseInt(e.target.value)})} 
                required 
              />
            </div>
          </div>

          {/* Identifiant de la propriété */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <label style={{ fontSize: "11px", fontWeight: 600, color: "#9ca3af", textTransform: "uppercase" }}>ID Propriété</label>
            <input 
              type="text" 
              placeholder="Ex: 4" 
              style={{ width: "100%", padding: "0.65rem 0.75rem", bg: "#ffffff", border: "1px solid #e5e7eb", borderRadius: "8px", outline: "none", fontSize: "0.875rem" }}
              onChange={(e) => setFormData({...formData, property: e.target.value})} 
              required 
            />
          </div>

          {/* Revenus */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <label style={{ fontSize: "11px", fontWeight: 700, color: "#10B981", textTransform: "uppercase", letterSpacing: "0.05em" }}>Revenus (MAD)</label>
            <input 
              type="number" 
              placeholder="0.00" 
              step="0.01"
              style={{ width: "100%", padding: "0.65rem 0.75rem", background: "#ecfdf5", border: "1px solid #d1fae5", borderRadius: "8px", outline: "none", color: "#065f46", fontWeight: 600, fontSize: "0.9rem" }}
              onChange={(e) => setFormData({...formData, revenue: e.target.value})} 
              required 
            />
          </div>

          {/* Dépenses */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <label style={{ fontSize: "11px", fontWeight: 700, color: "#ef4444", textTransform: "uppercase", letterSpacing: "0.05em" }}>Dépenses (MAD)</label>
            <input 
              type="number" 
              placeholder="0.00" 
              step="0.01"
              style={{ width: "100%", padding: "0.65rem 0.75rem", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px", outline: "none", color: "#991b1b", fontWeight: 600, fontSize: "0.9rem" }}
              onChange={(e) => setFormData({...formData, expenses: e.target.value})} 
              required 
            />
          </div>

        </div>

        {/* Note de Commission de l'agence (Thème Vert Makani) */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem", background: "#f9fafb", borderRadius: "8px", border: "1px solid #f3f4f6" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <AlertCircle style={{ color: "#10B981" }} size={18} />
            <p style={{ fontSize: "0.85rem", fontWeight: 500, color: "#374151", margin: 0 }}>Taux de commission standard appliqué</p>
          </div>
          <span style={{ fontSize: "1.1rem", fontWeight: 700, color: "#111827" }}>{formData.commission_rate}%</span>
        </div>

        {/* Notes & Observations */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <label style={{ fontSize: "11px", fontWeight: 600, color: "#9ca3af", textTransform: "uppercase" }}>Notes & Observations</label>
          <textarea 
            placeholder="Détails sur la maintenance, réservations exceptionnelles..." 
            style={{ width: "100%", padding: "0.65rem 0.75rem", bg: "#ffffff", border: "1px solid #e5e7eb", borderRadius: "8px", outline: "none", fontSize: "0.875rem", height: "100px", resize: "vertical", fontFamily: "inherit" }}
            onChange={(e) => setFormData({...formData, notes: e.target.value})} 
          />
        </div>

        {/* Bouton de soumission */}
        <button 
          type="submit" 
          disabled={status === 'loading'}
          style={{ 
            width: "100%", 
            padding: "0.85rem", 
            borderRadius: "8px", 
            fontWeight: 600, 
            fontSize: "0.95rem", 
            border: "none",
            cursor: status === 'loading' ? 'not-allowed' : 'pointer',
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center", 
            gap: "0.5rem",
            transition: "all 0.2s",
            background: status === 'success' ? '#10B981' : '#111827',
            color: '#ffffff'
          }}
          onMouseEnter={(e) => { if (status === 'idle') e.currentTarget.style.background = '#000000'; }}
          onMouseLeave={(e) => { if (status === 'idle') e.currentTarget.style.background = '#111827'; }}
        >
          {status === 'loading' ? (
            'Enregistrement...'
          ) : status === 'success' ? (
            <><CheckCircle2 size={18} /> Données enregistrées !</>
          ) : (
            <><Save size={18} /> Soumettre le rapport</>
          )}
        </button>
      </form>
    </div>
  );
}