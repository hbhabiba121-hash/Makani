// frontend/app/dashboard/owners/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Plus, Mail, Phone, Building2, MoreVertical, Users, Loader2, X, Edit, Trash2, 
  Eye, Copy, Search, User, MapPin, Calendar, DollarSign, Camera, MessageCircle 
} from "lucide-react";
import api from "@/lib/axios";

interface Owner {
  id: number;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  phone: string;
  address: string;
  created_at: string;
  properties_count?: number;
  total_earnings?: number;
  picture?: string | null;
  picture_url?: string | null;
}

const emptyForm = {
  first_name: "",
  last_name: "",
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
  const [searchQuery, setSearchQuery] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageErrors, setImageErrors] = useState<Record<number, boolean>>({});

  useEffect(() => {
    const token = localStorage.getItem("access");
    if (!token) router.push("/login");
  }, [router]);

  const fetchOwners = async () => {
    try {
      setLoading(true);
      const response = await api.get("/api/owners/");
      let ownersData = Array.isArray(response.data) ? response.data : response.data.results ?? [];
      setOwners(ownersData);
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

  const uploadProfilePicture = async (ownerId: number, file: File) => {
    const formData = new FormData();
    formData.append('picture', file);
    try {
      const response = await api.post(`/api/owners/${ownerId}/upload-picture/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    } catch (err) {
      console.error("Error uploading picture:", err);
      throw err;
    }
  };

  const handleSubmit = async () => {
    setFormError("");
    if (!form.first_name || !form.last_name || !form.email) {
      setFormError("Veuillez remplir tous les champs obligatoires.");
      return;
    }

    setSubmitting(true);
    try {
      let response;
      if (selectedOwner) {
        response = await api.put(`/api/owners/${selectedOwner.id}/`, {
          first_name: form.first_name,
          last_name: form.last_name,
          email: form.email,
          phone: form.phone,
          address: form.address,
        });
        
        if (imageFile) {
          await uploadProfilePicture(selectedOwner.id, imageFile);
        }
      } else {
        response = await api.post("/api/owners/", {
          first_name: form.first_name,
          last_name: form.last_name,
          email: form.email,
          phone: form.phone,
          address: form.address,
        });
        
        if (imageFile && response.data.id) {
          await uploadProfilePicture(response.data.id, imageFile);
        }
        
        if (response.data.temp_password) {
          setNewOwnerPassword(response.data.temp_password);
          setNewOwnerEmail(form.email);
          setNewOwnerName(`${form.first_name} ${form.last_name}`);
          setShowPasswordModal(true);
        }
      }
      
      setShowModal(false);
      setForm(emptyForm);
      setSelectedOwner(null);
      setImageFile(null);
      setImagePreview(null);
      await fetchOwners();
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

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setFormError("L'image ne doit pas dépasser 5MB");
        return;
      }
      if (!file.type.startsWith('image/')) {
        setFormError("Veuillez sélectionner une image");
        return;
      }
      setImageFile(file);
      const preview = URL.createObjectURL(file);
      setImagePreview(preview);
    }
  };

  const handleDelete = async () => {
    if (!selectedOwner) return;
    setSubmitting(true);
    try {
      await api.delete(`/api/owners/${selectedOwner.id}/`);
      setShowDeleteModal(false);
      setSelectedOwner(null);
      await fetchOwners();
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
      first_name: owner.first_name || "",
      last_name: owner.last_name || "",
      email: owner.email || "",
      phone: owner.phone || "",
      address: owner.address || "",
    });
    setImagePreview(null);
    setImageFile(null);
    setShowModal(true);
  };

  const handleViewDetails = (owner: Owner) => {
    setSelectedOwner(owner);
    setShowDetailsModal(true);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Mot de passe copié !");
  };

  const openWhatsApp = (phoneNumber: string, name: string) => {
    if (!phoneNumber) return;
    let cleanNumber = phoneNumber.replace(/\D/g, '');
    if (cleanNumber.startsWith('0') && cleanNumber.length === 10) {
      cleanNumber = '212' + cleanNumber.substring(1);
    } else if (!cleanNumber.startsWith('212') && !cleanNumber.startsWith('+')) {
      cleanNumber = '212' + cleanNumber;
    }
    const message = encodeURIComponent(`Bonjour ${name}, je vous contacte depuis Makani.`);
    window.open(`https://wa.me/${cleanNumber}?text=${message}`, '_blank');
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  const getProfilePictureUrl = (owner: Owner) => {
    if (owner.picture_url) {
      if (owner.picture_url.startsWith('http')) return owner.picture_url;
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      return `${baseUrl}${owner.picture_url}`;
    }
    return null;
  };

  const handleImageError = (ownerId: number) => {
    setImageErrors(prev => ({ ...prev, [ownerId]: true }));
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
    o.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.phone?.includes(searchQuery)
  );

  const totalOwners = owners.length;

  const stats = [
    { label: "Propriétaires", value: totalOwners, icon: Users, accent: "#6366f1" },
    { label: "Actifs", value: totalOwners, icon: User, accent: "#10b981" },
    { label: "Portefeuille", value: `${totalOwners}`, icon: Building2, accent: "#581c87" },
  ];

  return (
    <div className="min-h-screen bg-[#f4f7f6]">
      <div className="p-4 max-w-[1280px] mx-auto">

 

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
          {stats.map((s, i) => (
            <div key={i} className="bg-white rounded-xl border border-[#e2e8f0] p-4 hover:shadow-md transition-shadow">
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

        {/* Search and Add Button */}
        <div className="flex flex-col sm:flex-row justify-between gap-4 mb-4">
          <div className="relative flex-1 max-w-md">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
            <input
              type="text"
              placeholder="Rechercher un propriétaire..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white border border-[#e2e8f0] rounded-lg text-[13px] text-[#334155] placeholder-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#10b981]/20 focus:border-[#10b981] transition-all"
            />
          </div>
          <button
            onClick={() => { setSelectedOwner(null); setForm(emptyForm); setImagePreview(null); setImageFile(null); setShowModal(true); }}
            className="flex items-center gap-1.5 bg-[#10b981] text-white px-4 py-2 rounded-lg text-[12px] font-semibold hover:bg-[#059669] transition-all shadow-sm"
          >
            <Plus size={14} />
            Ajouter un propriétaire
          </button>
        </div>

        {/* Owners Table */}
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
                  <tr className="border-b border-[#e2e8f0] bg-[#f8fafc]">
                    <th className="text-left px-4 py-3 text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">Propriétaire</th>
                    <th className="text-left px-4 py-3 text-[11px] font-semibold text-[#64748b] uppercase tracking-wider hidden sm:table-cell">Contact</th>
                    <th className="text-left px-4 py-3 text-[11px] font-semibold text-[#64748b] uppercase tracking-wider hidden md:table-cell">Inscription</th>
                    <th className="text-center px-4 py-3 text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f1f5f9]">
                  {filteredOwners.map((owner, i) => {
                    const pictureUrl = getProfilePictureUrl(owner);
                    const hasImageError = imageErrors[owner.id];
                    const showImage = pictureUrl && !hasImageError;
                    
                    return (
                      <tr key={owner.id} className="hover:bg-[#f8fafc] transition-colors">
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            {showImage ? (
                              <img 
                                src={pictureUrl} 
                                alt={owner.full_name}
                                className="w-10 h-10 rounded-full object-cover"
                                onError={() => handleImageError(owner.id)}
                              />
                            ) : (
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-[12px] font-bold ${avatarColors[i % avatarColors.length]}`}>
                                {getInitials(owner.first_name, owner.last_name)}
                              </div>
                            )}
                            <div>
                              <div className="font-semibold text-[#1e293b] text-[14px]">{owner.full_name || `${owner.first_name} ${owner.last_name}`}</div>
                              <div className="text-[11px] text-[#94a3b8] sm:hidden">{owner.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 hidden sm:table-cell">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1.5 text-[12px] text-[#64748b]">
                              <Mail size={12} /> <span className="truncate max-w-[140px]">{owner.email}</span>
                            </div>
                            {owner.phone && (
                              <div className="flex items-center gap-1.5 text-[12px] text-[#64748b]">
                                <Phone size={12} /> {owner.phone}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4 hidden md:table-cell">
                          <div className="flex items-center gap-1.5 text-[12px] text-[#64748b]">
                            <Calendar size={12} />
                            <span>{new Date(owner.created_at).toLocaleDateString('fr-FR')}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleViewDetails(owner)}
                              className="p-1.5 rounded-md hover:bg-[#f1f5f9] text-[#6366f1] transition-colors"
                              title="Voir détails"
                            >
                              <Eye size={16} />
                            </button>
                            <button
                              onClick={() => handleEdit(owner)}
                              className="p-1.5 rounded-md hover:bg-[#f1f5f9] text-[#10b981] transition-colors"
                              title="Modifier"
                            >
                              <Edit size={16} />
                            </button>
                            {owner.phone && (
                              <button
                                onClick={() => openWhatsApp(owner.phone!, owner.first_name)}
                                className="p-1.5 rounded-md hover:bg-[#f1f5f9] text-[#25D366] transition-colors"
                                title="WhatsApp"
                              >
                                <MessageCircle size={16} />
                              </button>
                            )}
                            <button
                              onClick={() => { setSelectedOwner(owner); setShowDeleteModal(true); }}
                              className="p-1.5 rounded-md hover:bg-[#f1f5f9] text-[#ef4444] transition-colors"
                              title="Supprimer"
                            >
                              <Trash2 size={16} />
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
        </div>
      </div>

      {/* Password Display Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-[#0f172a]/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
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
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-5">
              <div className="flex justify-between items-start mb-5">
                <div>
                  <h2 className="text-[16px] font-bold text-[#1e293b]">{selectedOwner ? "Modifier le propriétaire" : "Ajouter un propriétaire"}</h2>
                  <p className="text-[12px] text-[#94a3b8] mt-0.5">
                    {selectedOwner ? `Modification de ${selectedOwner.first_name} ${selectedOwner.last_name}` : "Nouveau propriétaire"}
                  </p>
                </div>
                <button onClick={() => { setShowModal(false); setForm(emptyForm); setSelectedOwner(null); setFormError(""); setImageFile(null); setImagePreview(null); }} className="text-[#94a3b8] hover:text-[#334155] transition-colors w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#f1f5f9]">
                  <X size={18} />
                </button>
              </div>

              {formError && (
                <div className="bg-[#fef2f2] text-[#ef4444] text-[12px] p-3 rounded-lg mb-4 border border-[#fecaca] flex items-center gap-2">
                  <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  {formError}
                </div>
              )}

              {/* Profile Picture Upload */}
              <div className="flex justify-center mb-4">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full overflow-hidden bg-[#f1f5f9] border-2 border-[#e2e8f0]">
                    {imagePreview ? (
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : selectedOwner?.picture_url ? (
                      <img 
                        src={getProfilePictureUrl(selectedOwner) || ''} 
                        alt={selectedOwner.full_name} 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          const parent = e.currentTarget.parentElement;
                          if (parent) {
                            parent.innerHTML = `<div class="w-full h-full flex items-center justify-center text-[#94a3b8]"><svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg></div>`;
                          }
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#94a3b8]">
                        <User size={32} />
                      </div>
                    )}
                  </div>
                  <label className="absolute bottom-0 right-0 bg-[#10b981] rounded-full p-1.5 cursor-pointer hover:bg-[#059669] transition-colors">
                    <Camera size={14} className="text-white" />
                    <input type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
                  </label>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-[12px] font-semibold text-[#334155] mb-1 block">Prénom *</label>
                  <input 
                    className={inputClass} 
                    placeholder="Youssef" 
                    value={form.first_name} 
                    onChange={e => setForm({ ...form, first_name: e.target.value })} 
                  />
                </div>
                <div>
                  <label className="text-[12px] font-semibold text-[#334155] mb-1 block">Nom *</label>
                  <input 
                    className={inputClass} 
                    placeholder="Benali" 
                    value={form.last_name} 
                    onChange={e => setForm({ ...form, last_name: e.target.value })} 
                  />
                </div>
                <div>
                  <label className="text-[12px] font-semibold text-[#334155] mb-1 block">Email *</label>
                  <input 
                    type="email" 
                    className={inputClass} 
                    placeholder="youssef@email.ma" 
                    value={form.email} 
                    onChange={e => setForm({ ...form, email: e.target.value })} 
                  />
                </div>
                <div>
                  <label className="text-[12px] font-semibold text-[#334155] mb-1 block">Téléphone</label>
                  <input 
                    className={inputClass} 
                    placeholder="+212 6 12 34 56 78" 
                    value={form.phone} 
                    onChange={e => setForm({ ...form, phone: e.target.value })} 
                  />
                </div>
                <div>
                  <label className="text-[12px] font-semibold text-[#334155] mb-1 block">Adresse</label>
                  <input 
                    className={inputClass} 
                    placeholder="Casablanca, Maroc" 
                    value={form.address} 
                    onChange={e => setForm({ ...form, address: e.target.value })} 
                  />
                </div>
              </div>

              <div className="flex gap-2.5 mt-5 pt-4 border-t border-[#f1f5f9]">
                <button onClick={() => { setShowModal(false); setForm(emptyForm); setSelectedOwner(null); setFormError(""); setImageFile(null); setImagePreview(null); }} className="flex-1 py-2.5 rounded-lg border border-[#e2e8f0] text-[#64748b] font-semibold hover:bg-[#f8fafc] transition-all text-[13px]">
                  Annuler
                </button>
                <button onClick={handleSubmit} disabled={submitting} className="flex-1 py-2.5 rounded-lg bg-[#10b981] text-white font-semibold hover:bg-[#059669] transition-all flex items-center justify-center gap-1.5 shadow-sm text-[13px]">
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
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
            <div className="p-5">
              <div className="w-10 h-10 bg-[#fef2f2] rounded-xl flex items-center justify-center mx-auto mb-3">
                <Trash2 size={18} className="text-[#ef4444]" />
              </div>
              <h2 className="text-[16px] font-bold text-[#1e293b] text-center mb-1">Confirmer la suppression</h2>
              <p className="text-[#64748b] text-[13px] text-center mb-5">
                Supprimer <span className="font-semibold text-[#1e293b]">"{selectedOwner.full_name}"</span> ? Action irréversible.
              </p>
              <div className="flex gap-2.5">
                <button onClick={() => setShowDeleteModal(false)} className="flex-1 py-2.5 rounded-lg border border-[#e2e8f0] text-[#64748b] font-semibold hover:bg-[#f8fafc] transition-all text-[13px]">
                  Annuler
                </button>
                <button
                  onClick={handleDelete}
                  disabled={submitting}
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
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="p-5">
              <div className="flex justify-between items-start mb-5">
                <h2 className="text-[16px] font-bold text-[#1e293b]">Détails du propriétaire</h2>
                <button onClick={() => setShowDetailsModal(false)} className="text-[#94a3b8] hover:text-[#334155] transition-colors w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#f1f5f9]">
                  <X size={18} />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center gap-4 pb-4 border-b border-[#f1f5f9]">
                  {getProfilePictureUrl(selectedOwner) && !imageErrors[selectedOwner.id] ? (
                    <img 
                      src={getProfilePictureUrl(selectedOwner)!} 
                      alt={selectedOwner.full_name}
                      className="w-14 h-14 rounded-full object-cover"
                      onError={() => handleImageError(selectedOwner.id)}
                    />
                  ) : (
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center text-[16px] font-bold ${avatarColors[0]}`}>
                      {getInitials(selectedOwner.first_name, selectedOwner.last_name)}
                    </div>
                  )}
                  <div>
                    <h3 className="font-bold text-[#1e293b] text-[15px]">{selectedOwner.full_name || `${selectedOwner.first_name} ${selectedOwner.last_name}`}</h3>
                    <p className="text-[11px] text-[#64748b] flex items-center gap-1">
                      <Calendar size={11} /> Membre depuis {new Date(selectedOwner.created_at).toLocaleDateString('fr-FR')}
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
                    {selectedOwner.phone && (
                      <div className="flex items-center gap-2 text-[12px]">
                        <Phone size={13} className="text-[#94a3b8]" />
                        <span className="text-[#334155]">{selectedOwner.phone}</span>
                      </div>
                    )}
                    {selectedOwner.address && (
                      <div className="flex items-start gap-2 text-[12px]">
                        <MapPin size={13} className="text-[#94a3b8] mt-0.5" />
                        <span className="text-[#334155]">{selectedOwner.address}</span>
                      </div>
                    )}
                  </div>
                </div>

                {selectedOwner.phone && (
                  <div className="pt-2">
                    <button
                      onClick={() => openWhatsApp(selectedOwner.phone!, selectedOwner.first_name)}
                      className="w-full flex items-center justify-center gap-2 bg-[#25D366] text-white py-2.5 rounded-lg hover:bg-[#20b859] transition-all text-[13px] font-semibold"
                    >
                      <MessageCircle size={16} />
                      Contacter sur WhatsApp
                    </button>
                  </div>
                )}
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