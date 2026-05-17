"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Plus, Mail, Phone, Building2, MoreVertical, Users, Loader2, X, Edit, Trash2, 
  Eye, Copy, Search, ChevronRight, User, MapPin, Calendar, DollarSign 
} from "lucide-react";
import api from "@/lib/axios";

interface Owner {
  id: number;
  full_name: string;
  email: string;
  phone: string;
  address: string;
  created_at: string;
  properties_count?: number;
  total_earnings?: number;
}

interface Property {
  id: number;
  monthly_rent: number;
  owner: number;
}

const emptyForm = {
  full_name: "",
  email: "",
  phone: "",
  address: "",
};

export default function OwnersPage() {
  const router = useRouter();
  const [owners, setOwners] = useState<Owner[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedOwner, setSelectedOwner] = useState<Owner | null>(null);
  const [newOwnerPassword, setNewOwnerPassword] = useState("");
  const [newOwnerEmail, setNewOwnerEmail] = useState("");
  const [newOwnerName, setNewOwnerName] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [showMenu, setShowMenu] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("access");
    if (!token) router.push("/login");
  }, [router]);

  const fetchOwners = async () => {
    try {
      setLoading(true);
      const ownersRes = await api.get("/api/owners/");
      const ownersData = Array.isArray(ownersRes.data) ? ownersRes.data : ownersRes.data.results ?? [];
      
      if (ownersData.length === 0) {
        setOwners([]);
        setLoading(false);
        return;
      }

      let allProperties: Property[] = [];
      try {
        const propertiesRes = await api.get("/api/properties/");
        allProperties = Array.isArray(propertiesRes.data) 
          ? propertiesRes.data 
          : propertiesRes.data.results ?? [];
      } catch (propError) {
        console.error("Error fetching properties:", propError);
        setOwners(ownersData.map((owner: Owner) => ({
          ...owner,
          properties_count: 0,
          total_earnings: 0
        })));
        setLoading(false);
        return;
      }

      const ownersWithStats = ownersData.map((owner: Owner) => {
        const ownerProperties = allProperties.filter(
          (property: Property) => property.owner === owner.id
        );
        
        const properties_count = ownerProperties.length;
        const total_earnings = ownerProperties.reduce(
          (sum: number, property: Property) => sum + (Number(property.monthly_rent) || 0), 
          0
        );
        
        return {
          ...owner,
          properties_count,
          total_earnings,
        };
      });
      
      setOwners(ownersWithStats);
    } catch (err) {
      console.error("Error fetching owners:", err);
      setOwners([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOwners();
  }, []);

  const handleSubmit = async () => {
    setFormError("");
    if (!form.full_name || !form.email) {
      setFormError("Veuillez remplir tous les champs obligatoires.");
      return;
    }
    const parts = form.full_name.trim().split(" ");
    const first_name = parts[0];
    const last_name = parts.slice(1).join(" ") || parts[0];

    setSubmitting(true);
    try {
      if (selectedOwner) {
        await api.put(`/api/owners/${selectedOwner.id}/`, {
          first_name,
          last_name,
          email: form.email,
          phone: form.phone,
          address: form.address,
        });
      } else {
        const response = await api.post("/api/owners/", {
          first_name,
          last_name,
          email: form.email,
          phone: form.phone,
          address: form.address,
        });
        
        if (response.data.temp_password) {
          setNewOwnerPassword(response.data.temp_password);
          setNewOwnerEmail(form.email);
          setNewOwnerName(form.full_name);
          setShowPasswordModal(true);
        }
      }
      
      setShowModal(false);
      setForm(emptyForm);
      setSelectedOwner(null);
      fetchOwners();
    } catch (err: unknown) {
      console.error("Error:", err);
      const error = err as { response?: { data?: { email?: string[]; detail?: string } } };
      if (error.response?.data?.email) {
        setFormError(error.response.data.email[0]);
      } else if (error.response?.data?.detail) {
        setFormError(error.response.data.detail);
      } else {
        setFormError("Une erreur est survenue. Veuillez réessayer.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedOwner) return;
    setSubmitting(true);
    try {
      await api.delete(`/api/owners/${selectedOwner.id}/`);
      setShowDeleteModal(false);
      setSelectedOwner(null);
      fetchOwners();
    } catch (err) {
      console.error("Delete error:", err);
      alert("Échec de la suppression. Vérifiez qu'aucun bien n'est assigné.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (owner: Owner) => {
    setSelectedOwner(owner);
    setForm({
      full_name: owner.full_name,
      email: owner.email,
      phone: owner.phone || "",
      address: owner.address || "",
    });
    setShowModal(true);
    setShowMenu(null);
  };

  const handleViewDetails = (owner: Owner) => {
    setSelectedOwner(owner);
    setShowDetailsModal(true);
    setShowMenu(null);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 3);
  };

  const avatarColors = [
    "bg-[#e0e7ff] text-[#6366f1]",
    "bg-[#dbeafe] text-[#3b82f6]",
    "bg-[#d1fae5] text-[#10b981]",
    "bg-[#ffedd5] text-[#f97316]",
    "bg-[#fce7f3] text-[#ec4899]",
  ];

  const inputClass = "w-full p-2.5 rounded-lg border border-[#e2e8f0] focus:outline-none focus:ring-2 focus:ring-[#10b981]/20 focus:border-[#10b981] text-[#334155] bg-[#f8fafc] focus:bg-white transition-all text-[13px] font-medium";

  const filteredOwners = owners.filter(o => 
    o.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.phone?.includes(searchQuery)
  );

  const totalOwners = owners.length;
  const totalPropertiesManaged = owners.reduce((sum, o) => sum + (o.properties_count || 0), 0);
  const totalPayouts = owners.reduce((sum, o) => sum + (o.total_earnings || 0), 0);

  const stats = [
    { label: "Propriétaires", value: totalOwners, icon: Users, accent: "#6366f1" },
    { label: "Biens gérés", value: totalPropertiesManaged, icon: Building2, accent: "#10b981" },
    { label: "Revenus (YTD)", value: `${totalPayouts.toLocaleString()} MAD`, icon: DollarSign, accent: "#581c87" },
  ];

  return (
    <div className="min-h-screen bg-[#f4f7f6]">
      <div className="p-4 max-w-[1280px] mx-auto">

        {/* Action Button */}
        <div className="mb-4 flex justify-end">
          <button
            onClick={() => { setSelectedOwner(null); setForm(emptyForm); setShowModal(true); }}
            className="flex items-center gap-1.5 bg-[#10b981] text-white px-4 py-2 rounded-lg text-[12px] font-semibold hover:bg-[#059669] transition-all shadow-[0_1px_2px_rgba(16,185,129,0.25)]"
          >
            <Plus size={14} />
            Ajouter
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
          {stats.map((s, i) => (
            <div key={i} className="bg-white rounded-xl border border-[#e2e8f0] p-4 hover:shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[11px] text-[#64748b] font-medium">{s.label}</p>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: s.accent + "12" }}>
                  <s.icon size={14} style={{ color: s.accent }} />
                </div>
              </div>
              <p className="text-[22px] font-bold text-[#1e293b] tracking-tight">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Search Bar */}
        <div className="mb-4">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
            <input
              type="text"
              placeholder="Rechercher un propriétaire..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-[320px] pl-9 pr-3 py-2 bg-white border border-[#e2e8f0] rounded-lg text-[13px] text-[#334155] placeholder-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#10b981]/20 focus:border-[#10b981] transition-all"
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-[#e2e8f0] overflow-hidden">
          {loading ? (
            <div className="divide-y divide-[#f1f5f9]">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="px-4 py-4 flex items-center gap-4 animate-pulse">
                  <div className="w-10 h-10 rounded-full bg-[#f1f5f9]" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-[#f1f5f9] rounded w-32" />
                    <div className="h-2.5 bg-[#f1f5f9] rounded w-48" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredOwners.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-12 h-12 bg-[#f1f5f9] rounded-xl flex items-center justify-center mx-auto mb-3">
                <Users size={22} className="text-[#94a3b8]" />
              </div>
              <p className="text-[14px] font-semibold text-[#334155]">Aucun propriétaire trouvé</p>
              <p className="text-[12px] text-[#94a3b8] mt-0.5">Ajoutez votre premier propriétaire</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#e2e8f0]">
                    <th className="text-left px-4 py-3 text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">Propriétaire</th>
                    <th className="text-left px-4 py-3 text-[11px] font-semibold text-[#64748b] uppercase tracking-wider hidden sm:table-cell">Contact</th>
                    <th className="text-left px-4 py-3 text-[11px] font-semibold text-[#64748b] uppercase tracking-wider hidden md:table-cell">Biens</th>
                    <th className="text-left px-4 py-3 text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">Revenus</th>
                    <th className="text-right px-4 py-3 text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f1f5f9]">
                  {filteredOwners.map((owner, i) => (
                    <tr key={owner.id} className="hover:bg-[#f8fafc] transition-colors cursor-pointer" onClick={() => handleViewDetails(owner)}>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-[11px] font-bold ${avatarColors[i % avatarColors.length]}`}>
                            {getInitials(owner.full_name)}
                          </div>
                          <div>
                            <span className="font-semibold text-[#1e293b] text-[13px] block">{owner.full_name}</span>
                            <span className="text-[10px] text-[#94a3b8] sm:hidden">{owner.email}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 hidden sm:table-cell">
                        <div className="flex flex-col gap-1">
                          <span className="flex items-center gap-1.5 text-[12px] text-[#64748b]">
                            <Mail size={12} /> <span className="truncate max-w-[140px]">{owner.email}</span>
                          </span>
                          <span className="flex items-center gap-1.5 text-[12px] text-[#64748b]">
                            <Phone size={12} /> {owner.phone || "—"}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4 hidden md:table-cell">
                        <div className="flex items-center gap-1.5 text-[12px] text-[#64748b]">
                          <Building2 size={13} />
                          <span>{owner.properties_count || 0} biens</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className="font-bold text-[#10b981] text-[13px]">
                          {(owner.total_earnings || 0).toLocaleString()} MAD
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <button 
                            onClick={() => setShowMenu(showMenu === owner.id ? null : owner.id)}
                            className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-[#f1f5f9] text-[#64748b] transition-colors"
                          >
                            <MoreVertical size={13} />
                          </button>
                          {showMenu === owner.id && (
                            <>
                              <div className="fixed inset-0 z-10" onClick={() => setShowMenu(null)} />
                              <div className="absolute right-0 mt-1 w-40 bg-white rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.08)] border border-[#e2e8f0] z-20 overflow-hidden">
                                <button
                                  onClick={() => handleViewDetails(owner)}
                                  className="w-full text-left px-3.5 py-2 text-[12px] text-[#334155] hover:bg-[#f8fafc] flex items-center gap-2"
                                >
                                  <Eye size={13} /> Détails
                                </button>
                                <button
                                  onClick={() => handleEdit(owner)}
                                  className="w-full text-left px-3.5 py-2 text-[12px] text-[#334155] hover:bg-[#f8fafc] flex items-center gap-2"
                                >
                                  <Edit size={13} /> Modifier
                                </button>
                                <button
                                  onClick={() => { setSelectedOwner(owner); setShowDeleteModal(true); setShowMenu(null); }}
                                  className="w-full text-left px-3.5 py-2 text-[12px] text-[#ef4444] hover:bg-[#fef2f2] flex items-center gap-2"
                                >
                                  <Trash2 size={13} /> Supprimer
                                </button>
                              </div>
                            </>
                          )}
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

      {/* Password Display Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-[#0f172a]/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.12)] w-full max-w-md">
            <div className="p-5">
              <div className="text-center mb-5">
                <div className="w-12 h-12 bg-[#d1fae5] rounded-xl flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-[#10b981]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-[16px] font-bold text-[#1e293b]">Propriétaire ajouté !</h2>
                <p className="text-[12px] text-[#64748b] mt-1">Voici les identifiants de connexion</p>
              </div>

              <div className="bg-[#f8fafc] rounded-xl p-4 mb-4 border border-[#e2e8f0]">
                <div className="mb-3">
                  <label className="text-[10px] text-[#64748b] font-medium">Nom</label>
                  <p className="text-[#1e293b] font-semibold text-[13px]">{newOwnerName}</p>
                </div>
                <div className="mb-3">
                  <label className="text-[10px] text-[#64748b] font-medium">Email</label>
                  <p className="text-[#1e293b] font-semibold text-[13px]">{newOwnerEmail}</p>
                </div>
                <div>
                  <label className="text-[10px] text-[#64748b] font-medium">Mot de passe temporaire</label>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="flex-1 bg-white px-3 py-2 rounded-lg text-[12px] font-mono text-[#10b981] border border-[#e2e8f0]">
                      {newOwnerPassword}
                    </code>
                    <button
                      onClick={() => copyToClipboard(newOwnerPassword)}
                      className="p-2 bg-[#10b981] text-white rounded-lg hover:bg-[#059669] transition-all"
                      title="Copier"
                    >
                      <Copy size={14} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-[#fff7ed] border border-[#fed7aa] rounded-xl p-3 mb-5">
                <p className="text-[11px] text-[#c2410c]">
                  ⚠️ Partagez ces identifiants avec le propriétaire. Il pourra changer son mot de passe après sa première connexion.
                </p>
              </div>

              <button
                onClick={() => setShowPasswordModal(false)}
                className="w-full py-2.5 rounded-lg bg-[#10b981] text-white font-semibold hover:bg-[#059669] transition-all text-[13px]"
              >
                Terminé
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-[#0f172a]/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.12)] w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-5">
              <div className="flex justify-between items-start mb-5">
                <div>
                  <h2 className="text-[16px] font-bold text-[#1e293b]">{selectedOwner ? "Modifier le propriétaire" : "Ajouter un propriétaire"}</h2>
                  <p className="text-[12px] text-[#94a3b8] mt-0.5">{selectedOwner ? "Mettre à jour les informations" : "Nouveau propriétaire"}</p>
                </div>
                <button onClick={() => { setShowModal(false); setForm(emptyForm); setSelectedOwner(null); setFormError(""); }} className="text-[#94a3b8] hover:text-[#334155] transition-colors w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#f1f5f9]">
                  <X size={18} />
                </button>
              </div>

              {formError && (
                <div className="bg-[#fef2f2] text-[#ef4444] text-[12px] p-3 rounded-lg mb-4 border border-[#fecaca] flex items-center gap-2">
                  <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  {formError}
                </div>
              )}

              <div className="space-y-3">
                <div>
                  <label className="text-[12px] font-semibold text-[#334155] mb-1 block">Nom complet *</label>
                  <input className={inputClass} placeholder="Youssef Benali" value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} />
                </div>
                <div>
                  <label className="text-[12px] font-semibold text-[#334155] mb-1 block">Email *</label>
                  <input type="email" className={inputClass} placeholder="youssef@email.ma" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                </div>
                <div>
                  <label className="text-[12px] font-semibold text-[#334155] mb-1 block">Téléphone</label>
                  <input className={inputClass} placeholder="+212 6 12 34 56 78" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                </div>
                <div>
                  <label className="text-[12px] font-semibold text-[#334155] mb-1 block">Adresse</label>
                  <input className={inputClass} placeholder="Casablanca, Maroc" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
                </div>
              </div>

              <div className="flex gap-2.5 mt-5 pt-4 border-t border-[#f1f5f9]">
                <button onClick={() => { setShowModal(false); setForm(emptyForm); setSelectedOwner(null); setFormError(""); }} className="flex-1 py-2.5 rounded-lg border border-[#e2e8f0] text-[#64748b] font-semibold hover:bg-[#f8fafc] transition-all text-[13px]">
                  Annuler
                </button>
                <button onClick={handleSubmit} disabled={submitting} className="flex-1 py-2.5 rounded-lg bg-[#10b981] text-white font-semibold hover:bg-[#059669] transition-all flex items-center justify-center gap-1.5 shadow-[0_1px_2px_rgba(16,185,129,0.25)] text-[13px]">
                  {submitting ? <Loader2 className="animate-spin" size={16} /> : (selectedOwner ? "Mettre à jour" : "Ajouter")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedOwner && (
        <div className="fixed inset-0 bg-[#0f172a]/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.12)] w-full max-w-sm">
            <div className="p-5">
              <div className="w-10 h-10 bg-[#fef2f2] rounded-xl flex items-center justify-center mx-auto mb-3">
                <Trash2 size={18} className="text-[#ef4444]" />
              </div>
              <h2 className="text-[16px] font-bold text-[#1e293b] text-center mb-1">Supprimer</h2>
              <p className="text-[#64748b] text-[13px] text-center mb-5">
                Supprimer <span className="font-semibold text-[#1e293b]">"{selectedOwner.full_name}"</span> ? Action irréversible.
                {selectedOwner.properties_count !== undefined && selectedOwner.properties_count > 0 && (
                  <span className="block mt-2 text-[#ef4444] text-[11px]">
                    ⚠️ Ce propriétaire a {selectedOwner.properties_count} bien(s). Réassignez-les d'abord.
                  </span>
                )}
              </p>
              <div className="flex gap-2.5">
                <button onClick={() => setShowDeleteModal(false)} className="flex-1 py-2.5 rounded-lg border border-[#e2e8f0] text-[#64748b] font-semibold hover:bg-[#f8fafc] transition-all text-[13px]">
                  Annuler
                </button>
                <button
                  onClick={handleDelete}
                  disabled={submitting || (selectedOwner.properties_count !== undefined && selectedOwner.properties_count > 0)}
                  className="flex-1 py-2.5 rounded-lg bg-[#ef4444] text-white font-semibold hover:bg-[#dc2626] transition-all flex items-center justify-center gap-1.5 text-[13px] disabled:opacity-50"
                >
                  {submitting ? <Loader2 className="animate-spin" size={16} /> : "Supprimer"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Owner Details Modal */}
      {showDetailsModal && selectedOwner && (
        <div className="fixed inset-0 bg-[#0f172a]/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.12)] w-full max-w-md">
            <div className="p-5">
              <div className="flex justify-between items-start mb-5">
                <h2 className="text-[16px] font-bold text-[#1e293b]">Détails du propriétaire</h2>
                <button onClick={() => setShowDetailsModal(false)} className="text-[#94a3b8] hover:text-[#334155] transition-colors w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#f1f5f9]">
                  <X size={18} />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center gap-4 pb-4 border-b border-[#f1f5f9]">
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-[14px] font-bold ${avatarColors[0]}`}>
                    {getInitials(selectedOwner.full_name)}
                  </div>
                  <div>
                    <h3 className="font-bold text-[#1e293b] text-[15px]">{selectedOwner.full_name}</h3>
                    <p className="text-[11px] text-[#64748b] flex items-center gap-1">
                      <Calendar size={11} /> Depuis {new Date(selectedOwner.created_at).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>
                
                <div>
                  <p className="text-[10px] text-[#64748b] uppercase tracking-wider mb-2 font-medium">Contact</p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-[12px]">
                      <Mail size={13} className="text-[#94a3b8]" />
                      <span className="text-[#334155]">{selectedOwner.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[12px]">
                      <Phone size={13} className="text-[#94a3b8]" />
                      <span className="text-[#334155]">{selectedOwner.phone || "Non renseigné"}</span>
                    </div>
                    {selectedOwner.address && (
                      <div className="flex items-start gap-2 text-[12px]">
                        <MapPin size={13} className="text-[#94a3b8] mt-0.5" />
                        <span className="text-[#334155]">{selectedOwner.address}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="pt-4 border-t border-[#f1f5f9]">
                  <p className="text-[10px] text-[#64748b] uppercase tracking-wider mb-3 font-medium">Statistiques</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-[#f8fafc] rounded-xl p-3 border border-[#e2e8f0]">
                      <div className="flex items-center gap-2 mb-1">
                        <Building2 size={14} className="text-[#6366f1]" />
                        <p className="text-[10px] text-[#64748b]">Biens</p>
                      </div>
                      <p className="text-[20px] font-bold text-[#1e293b]">{selectedOwner.properties_count || 0}</p>
                    </div>
                    <div className="bg-[#f8fafc] rounded-xl p-3 border border-[#e2e8f0]">
                      <div className="flex items-center gap-2 mb-1">
                        <DollarSign size={14} className="text-[#10b981]" />
                        <p className="text-[10px] text-[#64748b]">Revenus</p>
                      </div>
                      <p className="text-[20px] font-bold text-[#10b981]">{(selectedOwner.total_earnings || 0).toLocaleString()} MAD</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2.5 mt-5 pt-4 border-t border-[#f1f5f9]">
                <button
                  onClick={() => { setShowDetailsModal(false); handleEdit(selectedOwner); }}
                  className="flex-1 py-2.5 rounded-lg border border-[#e2e8f0] text-[#334155] font-semibold hover:bg-[#f8fafc] transition-all text-[13px] flex items-center justify-center gap-1.5"
                >
                  <Edit size={14} /> Modifier
                </button>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="flex-1 py-2.5 rounded-lg bg-[#10b981] text-white font-semibold hover:bg-[#059669] transition-all text-[13px]"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}