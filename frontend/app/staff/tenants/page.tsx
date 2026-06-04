"use client";

import { useState, useEffect } from "react";
import { 
  User, 
  Search, 
  Plus, 
  Phone, 
  Mail, 
  Home, 
  SlidersHorizontal,
  Eye,
  MessageSquare,
  AlertCircle
} from "lucide-react";
// Importation de ton instance axios configurée si nécessaire
// import { api } from "@/lib/axios";

interface TenantType {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  propertyAssigned: string; // Nom ou ID de la propriété louée
  status: "Actif" | "En attente" | "Terminé";
  rentDate: string;
}

export default function StaffTenants() {
  const [tenants, setTenants] = useState<TenantType[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Exemple de données fictives prêtes à être remplacées par un appel API Django
  useEffect(() => {
    const fetchTenants = async () => {
      // Mettre loading à true et appeler le backend si nécessaire :
      // const res = await api.get('/api/tenants/');
      const sampleData: TenantType[] = [
        {
          id: 1,
          fullName: "Amine El Amrani",
          email: "amine.amrani@gmail.com",
          phone: "+212 611-223344",
          propertyAssigned: "Villa Sunshine (Anfa)",
          status: "Actif",
          rentDate: "Janvier 2026"
        },
        {
          id: 2,
          fullName: "Yasmine Benjelloun",
          email: "yasmine.bj@outlook.com",
          phone: "+212 655-778899",
          propertyAssigned: "Apartment Atlas (Gueliz)",
          status: "Actif",
          rentDate: "Mars 2026"
        }
      ];
      setTenants(sampleData);
    };

    fetchTenants();
  }, []);

  // Filtrage en temps réel basé sur la recherche
  const filteredTenants = tenants.filter(t => 
    t.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.propertyAssigned.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
      <div style={{ width: 36, height: 36, border: "3px solid #ecfdf5", borderTop: "3px solid #10B981", borderRadius: "50%", animation: "spin .8s linear infinite" }}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <div style={{ width: "100%", maxWidth: "1200px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "2rem" }}>
      
      {/* En-tête */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "#111827", margin: 0, letterSpacing: "-0.02em" }}>
            Locataires
          </h1>
          <p style={{ fontSize: "0.875rem", color: "#6b7280", marginTop: "0.25rem" }}>
            Suivez et gérez les coordonnées, contrats et statuts de vos locataires actifs.
          </p>
        </div>
      </div>

      {/* Barre d'outils (Recherche & Actions) */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: "0.75rem", flex: 1, maxWidth: "500px" }}>
          <div style={{ display: "flex", alignItems: "center", background: "#ffffff", border: "1px solid #f3f4f6", borderRadius: "8px", padding: "0.55rem 1rem", gap: "0.75rem", flex: 1 }}>
            <Search size={18} color="#9ca3af" />
            <input 
              type="text" 
              placeholder="Rechercher un locataire, email, bien..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ border: "none", background: "transparent", outline: "none", width: "100%", fontSize: "0.875rem", color: "#374151" }}
            />
          </div>

          <button style={{ display: "flex", alignItems: "center", gap: "0.5rem", background: "#ffffff", border: "1px solid #f3f4f6", borderRadius: "8px", padding: "0.6rem 1rem", fontSize: "0.875rem", fontWeight: 500, color: "#374151", cursor: "pointer" }}>
            <SlidersHorizontal size={16} color="#6b7280" />
            Filtres
          </button>
        </div>

        <button 
          style={{ display: "flex", alignItems: "center", gap: "0.5rem", background: "#10B981", color: "#ffffff", border: "none", borderRadius: "8px", padding: "0.6rem 1.25rem", fontSize: "0.875rem", fontWeight: 600, cursor: "pointer", transition: "background 0.2s" }}
          onMouseEnter={(e) => e.currentTarget.style.background = "#059669"}
          onMouseLeave={(e) => e.currentTarget.style.background = "#10B981"}
        >
          <Plus size={18} />
          Nouveau locataire
        </button>
      </div>

      {/* Tableau des Locataires */}
      <div style={{ background: "#ffffff", borderRadius: "12px", border: "1px solid #f3f4f6", overflow: "hidden", boxShadow: "0 1px 2px rgba(0,0,0,0.02)" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ fontSize: "11px", fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", textAlign: "left", borderBottom: "1px solid #f3f4f6" }}>
                <th style={{ padding: "1rem 1.5rem" }}>Locataire</th>
                <th style={{ padding: "1rem 1.5rem" }}>Contact</th>
                <th style={{ padding: "1rem 1.5rem" }}>Bien Assigné</th>
                <th style={{ padding: "1rem 1.5rem" }}>Depuis</th>
                <th style={{ padding: "1rem 1.5rem" }}>Statut</th>
                <th style={{ padding: "1rem 1.5rem", textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody style={{ fontSize: "0.9rem", color: "#374151" }}>
              {filteredTenants.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: "3rem", textAlign: "center", color: "#6b7280" }}>
                    Aucun locataire trouvé.
                  </td>
                </tr>
              ) : (
                filteredTenants.map((tenant) => (
                  <tr key={tenant.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                    
                    {/* Profil / Nom */}
                    <td style={{ padding: "1.25rem 1.5rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center", color: "#6b7280", fontWeight: 600, fontSize: "0.85rem" }}>
                          {tenant.fullName.split(" ").map(n => n[0]).join("")}
                        </div>
                        <span style={{ fontWeight: 600, color: "#111827" }}>{tenant.fullName}</span>
                      </div>
                    </td>

                    {/* Coordonnées */}
                    <td style={{ padding: "1.25rem 1.5rem" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "2px", fontSize: "0.8rem", color: "#4b5563" }}>
                        <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><Mail size={12} color="#9ca3af" /> {tenant.email}</span>
                        <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><Phone size={12} color="#9ca3af" /> {tenant.phone}</span>
                      </div>
                    </td>

                    {/* Propriété occupée */}
                    <td style={{ padding: "1.25rem 1.5rem", color: "#374151", fontWeight: 500 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <Home size={14} color="#10B981" style={{ marginRight: "2px" }} />
                        {tenant.propertyAssigned}
                      </div>
                    </td>

                    {/* Date d'entrée */}
                    <td style={{ padding: "1.25rem 1.5rem", color: "#6b7280" }}>
                      {tenant.rentDate}
                    </td>

                    {/* Statut du badge */}
                    <td style={{ padding: "1.25rem 1.5rem" }}>
                      <span style={{
                        fontSize: "11px",
                        fontWeight: 500,
                        padding: "3px 8px",
                        borderRadius: "6px",
                        color: tenant.status === "Actif" ? "#065f46" : "#92400e",
                        background: tenant.status === "Actif" ? "#ecfdf5" : "#fef3c7",
                        border: `1px solid ${tenant.status === "Actif" ? "#d1fae5" : "#fde68a"}`
                      }}>
                        {tenant.status}
                      </span>
                    </td>

                    {/* Actions rapides */}
                    <td style={{ padding: "1.25rem 1.5rem", textAlign: "right" }}>
                      <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                        <button style={{ background: "none", border: "none", padding: "4px", cursor: "pointer", color: "#6b7280" }} title="Voir le profil complet">
                          <Eye size={16} />
                        </button>
                        <button style={{ background: "none", border: "none", padding: "4px", cursor: "pointer", color: "#6b7280" }} title="Contacter">
                          <MessageSquare size={16} />
                        </button>
                      </div>
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}