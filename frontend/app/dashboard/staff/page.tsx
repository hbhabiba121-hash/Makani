// frontend/app/dashboard/staff/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Plus, Mail, Users, Loader2, X, Edit, Trash2, 
  Eye, Copy, Search, Calendar, Briefcase, User, Camera, Phone, MessageCircle 
} from "lucide-react";
import api from "@/lib/axios";

interface Staff {
  id: number;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  phone: string;
  role: string;
  created_at: string;
  picture?: string | null;
  picture_url?: string | null;
}

const emptyForm = {
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
};

export default function StaffPage() {
  const router = useRouter();
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [newStaffPassword, setNewStaffPassword] = useState("");
  const [newStaffEmail, setNewStaffEmail] = useState("");
  const [newStaffName, setNewStaffName] = useState("");
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

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const response = await api.get("/api/users/staff/");
      const staffData = Array.isArray(response.data) ? response.data : response.data.results ?? [];
      setStaff(staffData);
    } catch (err) {
      console.error("Error fetching staff:", err);
      setStaff([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const uploadProfilePicture = async (staffId: number, file: File) => {
    const formData = new FormData();
    formData.append('picture', file);
    try {
      const response = await api.post(`/api/users/staff/${staffId}/upload-picture/`, formData, {
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
      if (selectedStaff) {
        await api.patch(`/api/users/staff/${selectedStaff.id}/`, {
          first_name: form.first_name,
          last_name: form.last_name,
          email: form.email,
          phone: form.phone,
        });
        
        if (imageFile) {
          await uploadProfilePicture(selectedStaff.id, imageFile);
        }
      } else {
        const response = await api.post("/api/users/staff/create/", {
          first_name: form.first_name,
          last_name: form.last_name,
          email: form.email,
          phone: form.phone,
        });
        
        if (imageFile && response.data.user?.id) {
          await uploadProfilePicture(response.data.user.id, imageFile);
        }
        
        if (response.data.temp_password) {
          setNewStaffPassword(response.data.temp_password);
          setNewStaffEmail(form.email);
          setNewStaffName(`${form.first_name} ${form.last_name}`);
          setShowPasswordModal(true);
        }
      }
      
      setShowModal(false);
      setForm(emptyForm);
      setSelectedStaff(null);
      setImageFile(null);
      setImagePreview(null);
      await fetchStaff();
    } catch (err: unknown) {
      console.error("Error:", err);
      const error = err as { response?: { data?: { email?: string[]; detail?: string; error?: string } } };
      if (error.response?.data?.email) {
        setFormError(error.response.data.email[0]);
      } else if (error.response?.data?.error) {
        setFormError(error.response.data.error);
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
    if (!selectedStaff) return;
    setSubmitting(true);
    try {
      await api.delete(`/api/users/staff/${selectedStaff.id}/delete/`);
      setShowDeleteModal(false);
      setSelectedStaff(null);
      await fetchStaff();
    } catch (err) {
      console.error("Delete error:", err);
      setFormError("Échec de la suppression. Veuillez réessayer.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (staffMember: Staff) => {
    setSelectedStaff(staffMember);
    setForm({
      first_name: staffMember.first_name || "",
      last_name: staffMember.last_name || "",
      email: staffMember.email || "",
      phone: staffMember.phone || "",
    });
    setImagePreview(null);
    setImageFile(null);
    setShowModal(true);
  };

  const handleViewDetails = (staffMember: Staff) => {
    setSelectedStaff(staffMember);
    setShowDetailsModal(true);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Mot de passe copié !");
  };

  const openWhatsApp = (phoneNumber: string, name: string) => {
    if (!phoneNumber) {
      alert("Ce membre n'a pas de numéro de téléphone enregistré");
      return;
    }
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

  const getProfilePictureUrl = (staffMember: Staff) => {
    if (staffMember.picture_url) {
      if (staffMember.picture_url.startsWith('http')) return staffMember.picture_url;
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      return `${baseUrl}${staffMember.picture_url}`;
    }
    return null;
  };

  const handleImageError = (staffId: number) => {
    setImageErrors(prev => ({ ...prev, [staffId]: true }));
  };

  const avatarColors = [
    "bg-[#e0e7ff] text-[#6366f1]",
    "bg-[#dbeafe] text-[#3b82f6]",
    "bg-[#d1fae5] text-[#10b981]",
    "bg-[#ffedd5] text-[#f97316]",
    "bg-[#fce7f3] text-[#ec4899]",
  ];

  const inputClass = "w-full p-2.5 rounded-lg border border-[#e2e8f0] focus:outline-none focus:ring-2 focus:ring-[#10b981]/20 focus:border-[#10b981] text-[#334155] bg-[#f8fafc] focus:bg-white transition-all text-[13px] font-medium";

  const filteredStaff = staff.filter(s => 
    (s.first_name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (s.last_name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (s.email?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (s.phone?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (s.role?.toLowerCase() || '').includes(searchQuery.toLowerCase())
  );

  const totalStaff = staff.length;

  const stats = [
    { label: "Membres", value: totalStaff, icon: Users, accent: "#6366f1" },
    { label: "Actifs", value: totalStaff, icon: User, accent: "#10b981" },
    { label: "Rôle", value: "Staff", icon: Briefcase, accent: "#581c87" },
  ];

  const getRoleBadge = (role: string) => {
    switch(role) {
      case 'admin':
        return <span className="px-2 py-1 rounded-full text-[10px] font-semibold bg-[#e0e7ff] text-[#6366f1]">Admin</span>;
      case 'staff':
        return <span className="px-2 py-1 rounded-full text-[10px] font-semibold bg-[#d1fae5] text-[#10b981]">Staff</span>;
      case 'owner':
        return <span className="px-2 py-1 rounded-full text-[10px] font-semibold bg-[#ffedd5] text-[#f97316]">Propriétaire</span>;
      default:
        return <span className="px-2 py-1 rounded-full text-[10px] font-semibold bg-[#f3f4f6] text-[#6b7280]">{role}</span>;
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f7f6]">
      <div className="p-4 max-w-[1400px] mx-auto">


        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {stats.map((s, i) => (
            <div key={i} className="bg-white rounded-xl border border-[#e2e8f0] p-5 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] text-[#64748b] font-medium uppercase tracking-wide">{s.label}</p>
                  <p className="text-[28px] font-bold text-[#1e293b] mt-1">{s.value}</p>
                </div>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: s.accent + "12" }}>
                  <s.icon size={20} style={{ color: s.accent }} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Search and Add Button */}
        <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
            <input
              type="text"
              placeholder="Rechercher par nom, email, téléphone ou rôle..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#e2e8f0] rounded-xl text-[13px] text-[#334155] placeholder-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#10b981]/20 focus:border-[#10b981] transition-all"
            />
          </div>
          <button
            onClick={() => { setSelectedStaff(null); setForm(emptyForm); setImagePreview(null); setImageFile(null); setShowModal(true); }}
            className="flex items-center gap-2 bg-[#10b981] text-white px-5 py-2.5 rounded-xl text-[13px] font-semibold hover:bg-[#059669] transition-all shadow-sm"
          >
            <Plus size={16} />
            Ajouter un membre
          </button>
        </div>

        {/* Staff Table */}
        <div className="bg-white rounded-xl border border-[#e2e8f0] overflow-hidden shadow-sm">
          {loading ? (
            <div className="divide-y divide-[#f1f5f9]">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="px-6 py-4 flex items-center gap-4 animate-pulse">
                  <div className="w-10 h-10 rounded-full bg-[#f1f5f9]" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-[#f1f5f9] rounded w-32" />
                    <div className="h-2.5 bg-[#f1f5f9] rounded w-48" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredStaff.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-[#f1f5f9] rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Users size={28} className="text-[#94a3b8]" />
              </div>
              <p className="text-[15px] font-semibold text-[#334155]">Aucun membre trouvé</p>
              <p className="text-[13px] text-[#94a3b8] mt-1">Ajoutez votre premier membre d'équipe</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#e2e8f0] bg-[#f8fafc]">
                    <th className="text-left px-6 py-4 text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">Membre</th>
                    <th className="text-left px-6 py-4 text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">Email</th>
                    <th className="text-left px-6 py-4 text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">Téléphone</th>
                    <th className="text-left px-6 py-4 text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">Rôle</th>
                    <th className="text-left px-6 py-4 text-[11px] font-semibold text-[#64748b] uppercase tracking-wider hidden lg:table-cell">Inscription</th>
                    <th className="text-center px-6 py-4 text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f1f5f9]">
                  {filteredStaff.map((member, i) => {
                    const pictureUrl = getProfilePictureUrl(member);
                    const hasImageError = imageErrors[member.id];
                    const showImage = pictureUrl && !hasImageError;
                    
                    return (
                      <tr key={member.id} className="hover:bg-[#fafcff] transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {showImage ? (
                              <img 
                                src={pictureUrl} 
                                alt={`${member.first_name} ${member.last_name}`}
                                className="w-10 h-10 rounded-full object-cover"
                                onError={() => handleImageError(member.id)}
                              />
                            ) : (
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-[13px] font-bold ${avatarColors[i % avatarColors.length]}`}>
                                {getInitials(member.first_name, member.last_name)}
                              </div>
                            )}
                            <div>
                              <div className="font-semibold text-[#1e293b] text-[14px]">{member.first_name} {member.last_name}</div>
                              <div className="text-[11px] text-[#94a3b8] lg:hidden">{member.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-[13px] text-[#64748b]">
                            <Mail size={13} />
                            <span className="truncate max-w-[180px]">{member.email}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {member.phone ? (
                            <div className="flex items-center gap-2 text-[13px] text-[#64748b]">
                              <Phone size={13} />
                              <span>{member.phone}</span>
                            </div>
                          ) : (
                            <span className="text-[12px] text-[#94a3b8] italic">— Non renseigné —</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {getRoleBadge(member.role || "staff")}
                        </td>
                        <td className="px-6 py-4 hidden lg:table-cell">
                          <div className="flex items-center gap-2 text-[13px] text-[#64748b]">
                            <Calendar size={13} />
                            <span>{new Date(member.created_at).toLocaleDateString('fr-FR')}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleViewDetails(member)}
                              className="p-2 rounded-lg hover:bg-[#f1f5f9] text-[#6366f1] transition-colors"
                              title="Voir détails"
                            >
                              <Eye size={16} />
                            </button>
                            <button
                              onClick={() => handleEdit(member)}
                              className="p-2 rounded-lg hover:bg-[#f1f5f9] text-[#10b981] transition-colors"
                              title="Modifier"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => openWhatsApp(member.phone || '', member.first_name)}
                              className={`p-2 rounded-lg transition-colors ${
                                member.phone 
                                  ? 'hover:bg-[#f1f5f9] text-[#25D366]' 
                                  : 'text-[#94a3b8] cursor-not-allowed opacity-50'
                              }`}
                              title={member.phone ? "Contacter sur WhatsApp" : "Aucun numéro de téléphone enregistré"}
                            >
                              <MessageCircle size={16} />
                            </button>
                            <button
                              onClick={() => { setSelectedStaff(member); setShowDeleteModal(true); }}
                              className="p-2 rounded-lg hover:bg-[#f1f5f9] text-[#ef4444] transition-colors"
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

      {/* Modals remain the same */}
      {/* Password Display Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-[#0f172a]/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="p-6">
              <div className="text-center mb-5">
                <div className="w-14 h-14 bg-[#d1fae5] rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-7 h-7 text-[#10b981]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-lg font-bold text-[#1e293b]">Membre ajouté !</h2>
                <p className="text-[13px] text-[#64748b] mt-1">Voici les identifiants de connexion</p>
              </div>

              <div className="bg-[#f8fafc] rounded-xl p-4 mb-5 border border-[#e2e8f0]">
                <div className="mb-3">
                  <label className="text-[10px] text-[#64748b] font-medium uppercase tracking-wide">Nom</label>
                  <p className="text-[#1e293b] font-semibold text-[14px] mt-1">{newStaffName}</p>
                </div>
                <div className="mb-3">
                  <label className="text-[10px] text-[#64748b] font-medium uppercase tracking-wide">Email</label>
                  <p className="text-[#1e293b] font-semibold text-[14px] mt-1">{newStaffEmail}</p>
                </div>
                <div>
                  <label className="text-[10px] text-[#64748b] font-medium uppercase tracking-wide">Mot de passe temporaire</label>
                  <div className="flex items-center gap-2 mt-2">
                    <code className="flex-1 bg-white px-3 py-2 rounded-lg text-[13px] font-mono text-[#10b981] border border-[#e2e8f0]">
                      {newStaffPassword}
                    </code>
                    <button
                      onClick={() => copyToClipboard(newStaffPassword)}
                      className="p-2 bg-[#10b981] text-white rounded-lg hover:bg-[#059669] transition-all"
                      title="Copier"
                    >
                      <Copy size={16} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-[#fff7ed] border border-[#fed7aa] rounded-xl p-3 mb-5">
                <p className="text-[11px] text-[#c2410c]">
                  ⚠️ Partagez ces identifiants avec le membre. Il pourra changer son mot de passe après sa première connexion.
                </p>
              </div>

              <button
                onClick={() => setShowPasswordModal(false)}
                className="w-full py-3 rounded-xl bg-[#10b981] text-white font-semibold hover:bg-[#059669] transition-all text-[14px]"
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
            <div className="p-6">
              <div className="flex justify-between items-start mb-5">
                <div>
                  <h2 className="text-lg font-bold text-[#1e293b]">{selectedStaff ? "Modifier le membre" : "Ajouter un membre"}</h2>
                  <p className="text-[13px] text-[#94a3b8] mt-1">
                    {selectedStaff ? `Modification de ${selectedStaff.first_name} ${selectedStaff.last_name}` : "Nouveau membre d'équipe"}
                  </p>
                </div>
                <button onClick={() => { setShowModal(false); setForm(emptyForm); setSelectedStaff(null); setFormError(""); setImageFile(null); setImagePreview(null); }} className="text-[#94a3b8] hover:text-[#334155] transition-colors w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#f1f5f9]">
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
              <div className="flex justify-center mb-5">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full overflow-hidden bg-[#f1f5f9] border-2 border-[#e2e8f0]">
                    {imagePreview ? (
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : selectedStaff?.picture_url ? (
                      <img 
                        src={getProfilePictureUrl(selectedStaff) || ''} 
                        alt={selectedStaff.first_name} 
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

              <div className="space-y-4">
                <div>
                  <label className="text-[13px] font-semibold text-[#334155] mb-1.5 block">Prénom *</label>
                  <input 
                    className={inputClass} 
                    placeholder="Ahmed" 
                    value={form.first_name} 
                    onChange={e => setForm({ ...form, first_name: e.target.value })} 
                  />
                </div>
                <div>
                  <label className="text-[13px] font-semibold text-[#334155] mb-1.5 block">Nom *</label>
                  <input 
                    className={inputClass} 
                    placeholder="Benali" 
                    value={form.last_name} 
                    onChange={e => setForm({ ...form, last_name: e.target.value })} 
                  />
                </div>
                <div>
                  <label className="text-[13px] font-semibold text-[#334155] mb-1.5 block">Email *</label>
                  <input 
                    type="email" 
                    className={inputClass} 
                    placeholder="ahmed@email.ma" 
                    value={form.email} 
                    onChange={e => setForm({ ...form, email: e.target.value })} 
                  />
                </div>
                <div>
                  <label className="text-[13px] font-semibold text-[#334155] mb-1.5 block">Téléphone</label>
                  <input 
                    type="tel" 
                    className={inputClass} 
                    placeholder="+212 6 12 34 56 78" 
                    value={form.phone} 
                    onChange={e => setForm({ ...form, phone: e.target.value })} 
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6 pt-4 border-t border-[#f1f5f9]">
                <button onClick={() => { setShowModal(false); setForm(emptyForm); setSelectedStaff(null); setFormError(""); setImageFile(null); setImagePreview(null); }} className="flex-1 py-2.5 rounded-xl border border-[#e2e8f0] text-[#64748b] font-semibold hover:bg-[#f8fafc] transition-all text-[13px]">
                  Annuler
                </button>
                <button onClick={handleSubmit} disabled={submitting} className="flex-1 py-2.5 rounded-xl bg-[#10b981] text-white font-semibold hover:bg-[#059669] transition-all flex items-center justify-center gap-2 shadow-sm text-[13px]">
                  {submitting ? <Loader2 className="animate-spin" size={16} /> : (selectedStaff ? "Mettre à jour" : "Ajouter")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedStaff && (
        <div className="fixed inset-0 bg-[#0f172a]/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
            <div className="p-6">
              <div className="w-12 h-12 bg-[#fef2f2] rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Trash2 size={20} className="text-[#ef4444]" />
              </div>
              <h2 className="text-lg font-bold text-[#1e293b] text-center mb-2">Confirmer la suppression</h2>
              <p className="text-[#64748b] text-[13px] text-center mb-5">
                Supprimer <span className="font-semibold text-[#1e293b]">"{selectedStaff.first_name} {selectedStaff.last_name}"</span> ? Action irréversible.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setShowDeleteModal(false)} className="flex-1 py-2.5 rounded-xl border border-[#e2e8f0] text-[#64748b] font-semibold hover:bg-[#f8fafc] transition-all text-[13px]">
                  Annuler
                </button>
                <button
                  onClick={handleDelete}
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-xl bg-[#ef4444] text-white font-semibold hover:bg-[#dc2626] transition-all flex items-center justify-center gap-2 text-[13px] disabled:opacity-50"
                >
                  {submitting ? <Loader2 className="animate-spin" size={16} /> : "Supprimer"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Staff Details Modal */}
      {showDetailsModal && selectedStaff && (
        <div className="fixed inset-0 bg-[#0f172a]/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="p-6">
              <div className="flex justify-between items-start mb-5">
                <h2 className="text-lg font-bold text-[#1e293b]">Détails du membre</h2>
                <button onClick={() => setShowDetailsModal(false)} className="text-[#94a3b8] hover:text-[#334155] transition-colors w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#f1f5f9]">
                  <X size={18} />
                </button>
              </div>
              
              <div className="space-y-5">
                <div className="flex items-center gap-4 pb-4 border-b border-[#f1f5f9]">
                  {getProfilePictureUrl(selectedStaff) && !imageErrors[selectedStaff.id] ? (
                    <img 
                      src={getProfilePictureUrl(selectedStaff)!} 
                      alt={`${selectedStaff.first_name} ${selectedStaff.last_name}`}
                      className="w-16 h-16 rounded-full object-cover"
                      onError={() => handleImageError(selectedStaff.id)}
                    />
                  ) : (
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center text-[18px] font-bold ${avatarColors[0]}`}>
                      {getInitials(selectedStaff.first_name, selectedStaff.last_name)}
                    </div>
                  )}
                  <div>
                    <h3 className="font-bold text-[#1e293b] text-[16px]">{selectedStaff.first_name} {selectedStaff.last_name}</h3>
                    <p className="text-[12px] text-[#64748b] flex items-center gap-1 mt-1">
                      <Briefcase size={12} /> {getRoleBadge(selectedStaff.role || "staff")}
                    </p>
                  </div>
                </div>
                
                <div>
                  <p className="text-[11px] text-[#64748b] uppercase tracking-wider mb-3 font-semibold">Contact</p>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-[13px]">
                      <Mail size={14} className="text-[#94a3b8]" />
                      <span className="text-[#334155]">{selectedStaff.email}</span>
                    </div>
                    <div className="flex items-center gap-3 text-[13px]">
                      <Phone size={14} className="text-[#94a3b8]" />
                      <span className="text-[#334155]">{selectedStaff.phone || "Non renseigné"}</span>
                    </div>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-[#f1f5f9]">
                  <p className="text-[11px] text-[#64748b] uppercase tracking-wider mb-3 font-semibold">Inscription</p>
                  <div className="flex items-center gap-3 text-[13px]">
                    <Calendar size={14} className="text-[#94a3b8]" />
                    <span className="text-[#334155]">{new Date(selectedStaff.created_at).toLocaleDateString('fr-FR')}</span>
                  </div>
                </div>

                {selectedStaff.phone && (
                  <div className="pt-2">
                    <button
                      onClick={() => openWhatsApp(selectedStaff.phone!, selectedStaff.first_name)}
                      className="w-full flex items-center justify-center gap-2 bg-[#25D366] text-white py-2.5 rounded-xl hover:bg-[#20b859] transition-all text-[13px] font-semibold"
                    >
                      <MessageCircle size={16} />
                      Contacter sur WhatsApp
                    </button>
                  </div>
                )}
              </div>
              
              <div className="flex gap-3 mt-6 pt-4 border-t border-[#f1f5f9]">
                <button
                  onClick={() => { setShowDetailsModal(false); handleEdit(selectedStaff); }}
                  className="flex-1 py-2.5 rounded-xl border border-[#e2e8f0] text-[#334155] font-semibold hover:bg-[#f8fafc] transition-all text-[13px] flex items-center justify-center gap-2"
                >
                  <Edit size={14} /> Modifier
                </button>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-[#10b981] text-white font-semibold hover:bg-[#059669] transition-all text-[13px]"
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