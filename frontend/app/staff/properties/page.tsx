"use client";

import { useEffect, useState } from "react";
import { 
  Building2, 
  Search, 
  Plus, 
  MapPin, 
  User, 
  SlidersHorizontal,
  Eye,
  Edit3,
  AlertCircle
} from "lucide-react";
// Importation de ton instance axios configurée
import { api } from "@/lib/axios"; 

interface PropertyType {
  id: number;
  name: string;
  address: string;
  owner_name: string; // ou selon la structure de ton serializer Django
  rent: number;
  status: string;
  type: string;
}

export default function StaffProperties() {
  const [properties, setProperties] = useState<PropertyType[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fonction pour charger les données depuis le backend Django
  const loadProperties = async () => {
    try {
      setLoading(true);
      setError(null);
      // Remplace '/properties/' par ton endpoint Django exact (ex: '/api/properties/')
      const response = await api.get("/properties/");
      setProperties(response.data);
    } catch (err) {
      console.error("Error fetching properties:", err);
      setError("Impossible de charger les propriétés. Vérifiez la connexion avec le serveur.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProperties();
  }, []);

  // Filtrage dynamique côté client avec la barre de recherche
  const filteredProperties = properties.filter(p => 
    p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.owner_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Écran de chargement épuré (Vert Makani)
  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
      <div style={{ width: 36, height: 36, border: "3px solid #ecfdf5", borderTop: "3px solid #10B981", borderRadius: "50%", animation: "spin .8s linear infinite" }}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <div style={{ width: "100%", maxWidth: "1200px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "2rem" }}>
      
      {/* En-tête */}
      <div>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "#111827", margin: 0, letterSpacing: "-0.02em" }}>
          Propriétés assignées
        </h1>
        <p style={{ fontSize: "0.875rem", color: "#6b7280", marginTop: "0.25rem" }}>
          Consultez et gérez le parc immobilier sous votre responsabilité directe.
        </p>
      </div>

      {/* Message d'erreur si le backend ne répond pas */}
      {error && (
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "1rem", background: "#fef2f2", borderRadius: "8px", border: "1px solid #fecaca", color: "#dc2626", fontSize: "0.875rem" }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Barre d'outils */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: "0.75rem", flex: 1, maxWidth: "500px" }}>
          <div style={{ display: "flex", alignItems: "center", background: "#ffffff", border: "1px solid #f3f4f6", borderRadius: "8px", padding: "0.55rem 1rem", gap: "0.75rem", flex: 1 }}>
            <Search size={18} color="#9ca3af" />
            <input 
              type="text" 
              placeholder="Rechercher par nom, ville, propriétaire..." 
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
          Ajouter un bien
        </button>
      </div>

      {/* Tableau des données réelles */}
      <div style={{ background: "#ffffff", borderRadius: "12px", border: "1px solid #f3f4f6", overflow: "hidden", boxShadow: "0 1px 2px rgba(0,0,0,0.02)" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ fontSize: "11px", fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", textAlign: "left", borderBottom: "1px solid #f3f4f6" }}>
                <th style={{ padding: "1rem 1.5rem" }}>Bien Immobilier</th>
                <th style={{ padding: "1rem 1.5rem" }}>Propriétaire</th>
                <th style={{ padding: "1rem 1.5rem" }}>Loyer mensuel</th>
                <th style={{ padding: "1rem 1.5rem" }}>Statut</th>
                <th style={{ padding: "1rem 1.5rem", textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody style={{ fontSize: "0.9rem", color: "#374151" }}>
              {filteredProperties.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: "3rem", textAlign: "center", color: "#6b7280" }}>
                    Aucune propriété trouvée.
                  </td>
                </tr>
              ) : (
                filteredProperties.map((property) => (
                  <tr key={property.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                    
                    <td style={{ padding: "1.25rem 1.5rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        <div style={{ width: "40px", height: "40px", borderRadius: "8px", background: "#ecfdf5", display: "flex", alignItems: "center", justifyContent: "center", color: "#10B981" }}>
                          <Building2 size={20} />
                        </div>
                        <div style={{ display: "flex", flexDirection: "column" }}>
                          <span style={{ fontWeight: 600, color: "#111827" }}>{property.name}</span>
                          <span style={{ fontSize: "0.75rem", color: "#6b7280", display: "flex", alignItems: "center", gap: "2px", marginTop: "2px" }}>
                            <MapPin size={12} color="#9ca3af" /> {property.address}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td style={{ padding: "1.25rem 1.5rem", color: "#4b5563" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                        <User size={14} color="#9ca3af" />
                        {property.owner_name || "—"}
                      </div>
                    </td>

                    <td style={{ padding: "1.25rem 1.5rem", fontWeight: 600, color: "#111827" }}>
                      {typeof property.rent === 'number' ? `${property.rent.toLocaleString('fr-FR')} MAD` : property.rent}
                    </td>

                    <td style={{ padding: "1.25rem 1.5rem" }}>
                      <span style={{
                        fontSize: "11px",
                        fontWeight: 500,
                        padding: "3px 8px",
                        borderRadius: "6px",
                        color: property.status === "Loué" || property.status === "rented" ? "#065f46" : "#92400e",
                        background: property.status === "Loué" || property.status === "rented" ? "#ecfdf5" : "#fef3c7",
                        border: `1px solid ${property.status === "Loué" || property.status === "rented" ? "#d1fae5" : "#fde68a"}`
                      }}>
                        {property.status === "rented" ? "Loué" : property.status === "available" ? "Disponible" : property.status}
                      </span>
                    </td>

                    <td style={{ padding: "1.25rem 1.5rem", textAlign: "right" }}>
                      <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                        <button style={{ background: "none", border: "none", padding: "4px", cursor: "pointer", color: "#6b7280" }}>
                          <Eye size={16} />
                        </button>
                        <button style={{ background: "none", border: "none", padding: "4px", cursor: "pointer", color: "#6b7280" }}>
                          <Edit3 size={16} />
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