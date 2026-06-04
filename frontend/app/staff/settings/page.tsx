"use client";

import { useState } from "react";
import { 
  User, 
  Lock, 
  Bell, 
  Globe, 
  Save, 
  CheckCircle2, 
  AlertCircle 
} from "lucide-react";
// Importation optionnelle de ton instance axios si nécessaire
// import { api } from "@/lib/axios";

export default function StaffSettings() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  
  // États locaux pour gérer les formulaires
  const [profileData, setProfileData] = useState({
    firstName: "Habiba",
    lastName: "Hash",
    email: "habiba.staff@makani.ma",
    phone: "+212 600-000000"
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');

    // Simulation d'une mise à jour vers l'API Django
    setTimeout(() => {
      // Si tout est bon :
      setStatus('success');
      setTimeout(() => setStatus('idle'), 3000);
      
      // En cas d'erreur, tu peux passer à 'error'
      // setStatus('error');
    }, 1200);
  };

  return (
    <div style={{ width: "100%", maxWidth: "800px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "2rem" }}>
      
      {/* En-tête */}
      <div>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "#111827", margin: 0, letterSpacing: "-0.02em" }}>
          Paramètres du compte
        </h1>
        <p style={{ fontSize: "0.875rem", color: "#6b7280", marginTop: "0.25rem" }}>
          Gérez vos informations personnelles, votre sécurité et vos préférences de notification.
        </p>
      </div>

      {/* Notifications de Statut globales */}
      {status === 'success' && (
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "1rem", background: "#ecfdf5", borderRadius: "8px", border: "1px solid #d1fae5", color: "#065f46", fontSize: "0.875rem" }}>
          <CheckCircle2 size={18} />
          <span>Modifications enregistrées avec succès !</span>
        </div>
      )}

      {status === 'error' && (
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "1rem", background: "#fef2f2", borderRadius: "8px", border: "1px solid #fecaca", color: "#dc2626", fontSize: "0.875rem" }}>
          <AlertCircle size={18} />
          <span>Une erreur est survenue lors de la mise à jour.</span>
        </div>
      )}

      <form onSubmit={handleSaveSettings} style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
        
        {/* SECTION 1 : INFORMATIONS PERSONNELLES */}
        <div style={{ background: "#ffffff", borderRadius: "12px", padding: "2rem", border: "1px solid #f3f4f6", boxShadow: "0 1px 2px rgba(0,0,0,0.02)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.5rem", borderBottom: "1px solid #f9fafb", paddingBottom: "0.75rem" }}>
            <User size={18} color="#10B981" />
            <h2 style={{ fontSize: "1rem", fontWeight: 600, color: "#111827", margin: 0 }}>Informations Personnelles</h2>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <label style={{ fontSize: "11px", fontWeight: 600, color: "#9ca3af", textTransform: "uppercase" }}>Prénom</label>
              <input 
                type="text" 
                value={profileData.firstName}
                onChange={(e) => setProfileData({...profileData, firstName: e.target.value})}
                style={{ width: "100%", padding: "0.65rem 0.75rem", background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: "8px", outline: "none", fontSize: "0.875rem", color: "#374151" }}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <label style={{ fontSize: "11px", fontWeight: 600, color: "#9ca3af", textTransform: "uppercase" }}>Nom</label>
              <input 
                type="text" 
                value={profileData.lastName}
                onChange={(e) => setProfileData({...profileData, lastName: e.target.value})}
                style={{ width: "100%", padding: "0.65rem 0.75rem", background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: "8px", outline: "none", fontSize: "0.875rem", color: "#374151" }}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <label style={{ fontSize: "11px", fontWeight: 600, color: "#9ca3af", textTransform: "uppercase" }}>Adresse Email</label>
              <input 
                type="email" 
                value={profileData.email}
                disabled // Généralement géré par l'admin ou non modifiable directement
                style={{ width: "100%", padding: "0.65rem 0.75rem", background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: "8px", outline: "none", fontSize: "0.875rem", color: "#9ca3af", cursor: "not-allowed" }}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <label style={{ fontSize: "11px", fontWeight: 600, color: "#9ca3af", textTransform: "uppercase" }}>Téléphone</label>
              <input 
                type="text" 
                value={profileData.phone}
                onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                style={{ width: "100%", padding: "0.65rem 0.75rem", background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: "8px", outline: "none", fontSize: "0.875rem", color: "#374151" }}
              />
            </div>
          </div>
        </div>

        {/* SECTION 2 : SÉCURITÉ ET MOT DE PASSE */}
        <div style={{ background: "#ffffff", borderRadius: "12px", padding: "2rem", border: "1px solid #f3f4f6", boxShadow: "0 1px 2px rgba(0,0,0,0.02)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.5rem", borderBottom: "1px solid #f9fafb", paddingBottom: "0.75rem" }}>
            <Lock size={18} color="#10B981" />
            <h2 style={{ fontSize: "1rem", fontWeight: 600, color: "#111827", margin: 0 }}>Sécurité du compte</h2>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <label style={{ fontSize: "11px", fontWeight: 600, color: "#9ca3af", textTransform: "uppercase" }}>Mot de passe actuel</label>
              <input 
                type="password" 
                placeholder="••••••••"
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                style={{ width: "100%", maxWidth: "400px", padding: "0.65rem 0.75rem", background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: "8px", outline: "none", fontSize: "0.875rem" }}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <label style={{ fontSize: "11px", fontWeight: 600, color: "#9ca3af", textTransform: "uppercase" }}>Nouveau mot de passe</label>
                <input 
                  type="password" 
                  placeholder="Minimum 8 caractères"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                  style={{ width: "100%", padding: "0.65rem 0.75rem", background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: "8px", outline: "none", fontSize: "0.875rem" }}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <label style={{ fontSize: "11px", fontWeight: 600, color: "#9ca3af", textTransform: "uppercase" }}>Confirmer le mot de passe</label>
                <input 
                  type="password" 
                  placeholder="Confirmer"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                  style={{ width: "100%", padding: "0.65rem 0.75rem", background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: "8px", outline: "none", fontSize: "0.875rem" }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 3 : PRÉFÉRENCES APPLICATIVES */}
        <div style={{ background: "#ffffff", borderRadius: "12px", padding: "2rem", border: "1px solid #f3f4f6", boxShadow: "0 1px 2px rgba(0,0,0,0.02)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.5rem", borderBottom: "1px solid #f9fafb", paddingBottom: "0.75rem" }}>
            <Bell size={18} color="#10B981" />
            <h2 style={{ fontSize: "1rem", fontWeight: 600, color: "#111827", margin: 0 }}>Préférences & Système</h2>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {/* Option Notification mail */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "#374151", display: "block" }}>Notifications par email</span>
                <span style={{ fontSize: "0.75rem", color: "#6b7280" }}>Recevoir un récapitulatif lors de l'attribution d'un nouveau bien immobilier.</span>
              </div>
              <input type="checkbox" defaultChecked style={{ width: "16px", height: "16px", accentColor: "#10B981", cursor: "pointer" }} />
            </div>

            <hr style={{ border: "none", borderTop: "1px solid #f3f4f6", margin: "0.5rem 0" }} />

            {/* Option Langue par défaut */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Globe size={16} color="#6b7280" />
                <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "#374151" }}>Langue de l'interface</span>
              </div>
              <select style={{ padding: "0.4rem 0.75rem", background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: "6px", fontSize: "0.825rem", color: "#374151", outline: "none", cursor: "pointer" }}>
                <option value="fr">Français (FR)</option>
                <option value="en">English (EN)</option>
              </select>
            </div>
          </div>
        </div>

        {/* BOUTON SAUVEGARDE GLOBALE */}
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button 
            type="submit" 
            disabled={status === 'loading'}
            style={{ 
              display: "flex", 
              alignItems: "center", 
              gap: "0.5rem", 
              background: "#10B981", 
              color: "#ffffff", 
              border: "none", 
              borderRadius: "8px", 
              padding: "0.75rem 1.5rem", 
              fontSize: "0.875rem", 
              fontWeight: 600, 
              cursor: status === 'loading' ? 'not-allowed' : 'pointer',
              transition: "background 0.2s",
              opacity: status === 'loading' ? 0.7 : 1
            }}
            onMouseEnter={(e) => { if(status === 'idle') e.currentTarget.style.background = "#059669" }}
            onMouseLeave={(e) => { if(status === 'idle') e.currentTarget.style.background = "#10B981" }}
          >
            {status === 'loading' ? (
              "Enregistrement..."
            ) : (
              <>
                <Save size={16} />
                Enregistrer les modifications
              </>
            )}
          </button>
        </div>

      </form>
    </div>
  );
}