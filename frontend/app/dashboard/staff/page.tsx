// frontend/app/dashboard/staff/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Plus, Mail, Users, Loader2, X, Edit, Trash2, 
  Eye, Copy, Search, Calendar, User, Camera, Phone, MessageCircle,
  Shield, TrendingUp, Home, Power, Key, CheckCircle, XCircle
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
  is_active: boolean;
  created_at: string;
  picture?: string | null;
  picture_url?: string | null;
}

const emptyForm = {
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  role: "property_staff",
};

// ONLY 3 STAFF ROLES
const STAFF_ROLES = ['agency_manager', 'finance_staff', 'property_staff'];

// Role definitions with French labels - NO PERMISSIONS LIST
const roleLabels: Record<string, { labelFr: string; labelEn: string; icon: any; color: string; bg: string }> = {
  agency_manager: { 
    labelFr: "Gestionnaire Agence", 
    labelEn: "Agency Manager",
    icon: Shield, 
    color: "#3B82F6", 
    bg: "#EFF6FF",
  },
  finance_staff: { 
    labelFr: "Staff Finance", 
    labelEn: "Finance Staff",
    icon: TrendingUp, 
    color: "#10B981", 
    bg: "#D1FAE5",
  },
  property_staff: { 
    labelFr: "Staff Propriétés", 
    labelEn: "Property Staff",
    icon: Home, 
    color: "#F59E0B", 
    bg: "#FEF3C7",
  },
};

const statusLabels = {
  active: { label: "Actif", color: "#10B981", bg: "#D1FAE5", icon: CheckCircle },
  inactive: { label: "Inactif", color: "#6B7280", bg: "#F3F4F6", icon: XCircle },
};

export default function StaffPage() {
  const router = useRouter();
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
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
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("access");
    const role = localStorage.getItem("role");
    if (!token) router.push("/login");
    
    // Check if user has permission to manage staff (only agency owner can)
    if (role !== 'agency_owner' && role !== 'admin') {
      router.push("/dashboard");
      return;
    }
    
    setCurrentUserRole(role);
  }, [router]);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const response = await api.get("/api/users/staff/");
      const staffData = Array.isArray(response.data) ? response.data : response.data.results ?? [];
      
      // Filter ONLY staff roles (agency_manager, finance_staff, property_staff)
      const filteredStaff = staffData.filter((s: any) => 
        STAFF_ROLES.includes(s.role)
      );
      
      const staffWithStatus = filteredStaff.map((s: any) => ({
        ...s,
        status: s.is_active ? 'active' : 'inactive'
      }));
      setStaff(staffWithStatus);
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
        const updateData: any = {
          first_name: form.first_name,
          last_name: form.last_name,
          email: form.email,
          phone: form.phone,
          role: form.role,
        };
        
        await api.patch(`/api/users/staff/${selectedStaff.id}/`, updateData);
        
        if (imageFile) {
          await uploadProfilePicture(selectedStaff.id, imageFile);
        }
      } else {
        const response = await api.post("/api/users/staff/create/", {
          first_name: form.first_name,
          last_name: form.last_name,
          email: form.email,
          phone: form.phone,
          role: form.role,
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

  const handleUpdateRole = async (newRole: string) => {
    if (!selectedStaff) return;
    setSubmitting(true);
    setFormError("");
    
    try {
      await api.patch(`/api/users/staff/${selectedStaff.id}/`, {
        role: newRole
      });
      
      setShowRoleModal(false);
      setSelectedStaff(null);
      await fetchStaff();
    } catch (err: any) {
      console.error("Error updating role:", err);
      const errorMessage = err.response?.data?.error || err.response?.data?.detail || "Impossible de modifier le rôle";
      setFormError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (newStatus: 'active' | 'inactive') => {
    if (!selectedStaff) return;
    setSubmitting(true);
    try {
      const isActive = newStatus === 'active';
      await api.patch(`/api/users/staff/${selectedStaff.id}/`, {
        is_active: isActive,
      });
      setShowStatusModal(false);
      setSelectedStaff(null);
      await fetchStaff();
    } catch (err) {
      console.error("Error updating status:", err);
      setFormError("Impossible de modifier le statut");
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetPassword = async () => {
    if (!selectedStaff) return;
    setSubmitting(true);
    try {
      const tempPassword = Math.random().toString(36).slice(-12) + "A1!";
      await api.patch(`/api/users/staff/${selectedStaff.id}/`, {
        password: tempPassword,
      });
      setNewStaffPassword(tempPassword);
      setNewStaffEmail(selectedStaff.email);
      setNewStaffName(`${selectedStaff.first_name} ${selectedStaff.last_name}`);
      setShowPasswordModal(true);
      setShowDetailsModal(false);
    } catch (err) {
      console.error("Error resetting password:", err);
      setFormError("Impossible de réinitialiser le mot de passe");
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
      role: staffMember.role || "property_staff",
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
    (roleLabels[s.role]?.labelFr.toLowerCase() || '').includes(searchQuery.toLowerCase())
  );

  const totalStaff = staff.length;
  const activeStaff = staff.filter(s => s.is_active).length;

  const stats = [
    { label: "Total Staff", value: totalStaff, icon: Users, accent: "#6366f1" },
    { label: "Staff Actifs", value: activeStaff, icon: User, accent: "#10b981" },
    { label: "Rôles", value: Object.keys(roleLabels).length, icon: Shield, accent: "#581c87" },
  ];

  const getRoleBadge = (role: string) => {
    const roleInfo = roleLabels[role];
    if (!roleInfo) return null;
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold`} style={{ backgroundColor: roleInfo.bg, color: roleInfo.color }}>
        <roleInfo.icon size={12} />
        {roleInfo.labelFr}
      </span>
    );
  };

  const getStatusBadge = (isActive: boolean) => {
    const status = isActive ? statusLabels.active : statusLabels.inactive;
    const StatusIcon = status.icon;
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold`} style={{ backgroundColor: status.bg, color: status.color }}>
        <StatusIcon size={10} />
        {status.label}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-[#f4f7f6]">
      <div className="p-6 max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Gestion du Staff</h1>
          <p className="text-gray-500 text-sm mt-1">Gérez les membres de votre équipe et leurs rôles</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
          {stats.map((s, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">{s.label}</p>
                  <p className="text-3xl font-bold text-gray-800 mt-1">{s.value}</p>
                </div>
                <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ backgroundColor: s.accent + "12" }}>
                  <s.icon size={22} style={{ color: s.accent }} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Search and Add Button */}
        <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search size="18" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par nom, email, téléphone ou rôle..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#10b981]/20 focus:border-[#10b981] transition-all"
            />
          </div>
          <button
            onClick={() => { setSelectedStaff(null); setForm(emptyForm); setImagePreview(null); setImageFile(null); setShowModal(true); }}
            className="flex items-center gap-2 bg-[#10b981] text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#059669] transition-all shadow-sm"
          >
            <Plus size="18" />
            Ajouter un membre
          </button>
        </div>

        {/* Staff Table */}
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
          {loading ? (
            <div className="divide-y divide-gray-50">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="px-6 py-4 flex items-center gap-4 animate-pulse">
                  <div className="w-10 h-10 rounded-full bg-gray-100" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-gray-100 rounded w-32" />
                    <div className="h-2.5 bg-gray-100 rounded w-48" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredStaff.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Users size="28" className="text-gray-400" />
              </div>
              <p className="text-base font-semibold text-gray-700">Aucun membre trouvé</p>
              <p className="text-sm text-gray-400 mt-1">Ajoutez votre premier membre d'équipe</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Membre</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Téléphone</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Rôle</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Statut</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Inscription</th>
                    <th className="text-center px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredStaff.map((member, i) => {
                    const pictureUrl = getProfilePictureUrl(member);
                    const hasImageError = imageErrors[member.id];
                    const showImage = pictureUrl && !hasImageError;
                    
                    return (
                      <tr key={member.id} className="hover:bg-gray-50/30 transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            {showImage ? (
                              <img 
                                src={pictureUrl} 
                                alt={`${member.first_name} ${member.last_name}`}
                                className="w-9 h-9 rounded-full object-cover"
                                onError={() => handleImageError(member.id)}
                              />
                            ) : (
                              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold ${avatarColors[i % avatarColors.length]}`}>
                                {getInitials(member.first_name, member.last_name)}
                              </div>
                            )}
                            <div>
                              <div className="font-medium text-gray-800 text-sm">{member.first_name} {member.last_name}</div>
                              <div className="text-xs text-gray-400 lg:hidden">{member.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Mail size="13" />
                            <span className="truncate max-w-[180px]">{member.email}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          {member.phone ? (
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <Phone size="13" />
                              <span>{member.phone}</span>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400 italic">— Non renseigné —</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5">
                          {getRoleBadge(member.role)}
                        </td>
                        <td className="px-5 py-3.5">
                          {getStatusBadge(member.is_active)}
                        </td>
                        <td className="px-5 py-3.5 hidden lg:table-cell">
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Calendar size="13" />
                            <span>{new Date(member.created_at).toLocaleDateString('fr-FR')}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleViewDetails(member)}
                              className="p-1.5 rounded-lg hover:bg-gray-100 text-indigo-500 transition-colors"
                              title="Voir détails"
                            >
                              <Eye size="15" />
                            </button>
                            <button
                              onClick={() => handleEdit(member)}
                              className="p-1.5 rounded-lg hover:bg-gray-100 text-emerald-500 transition-colors"
                              title="Modifier"
                            >
                              <Edit size="15" />
                            </button>
                            <button
                              onClick={() => { setSelectedStaff(member); setShowStatusModal(true); }}
                              className="p-1.5 rounded-lg hover:bg-gray-100 text-amber-500 transition-colors"
                              title={member.is_active ? "Désactiver" : "Activer"}
                            >
                              <Power size="15" />
                            </button>
                            <button
                              onClick={() => openWhatsApp(member.phone || '', member.first_name)}
                              className={`p-1.5 rounded-lg transition-colors ${
                                member.phone 
                                  ? 'hover:bg-gray-100 text-[#25D366]' 
                                  : 'text-gray-300 cursor-not-allowed'
                              }`}
                              title={member.phone ? "Contacter sur WhatsApp" : "Aucun numéro de téléphone enregistré"}
                            >
                              <MessageCircle size="15" />
                            </button>
                            <button
                              onClick={() => { setSelectedStaff(member); setShowDeleteModal(true); }}
                              className="p-1.5 rounded-lg hover:bg-gray-100 text-red-500 transition-colors"
                              title="Supprimer"
                            >
                              <Trash2 size="15" />
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
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="p-6">
              <div className="text-center mb-5">
                <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Key className="w-7 h-7 text-emerald-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-800">Membre ajouté !</h2>
                <p className="text-sm text-gray-500 mt-1">Voici les identifiants de connexion</p>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 mb-5 border border-gray-100">
                <div className="mb-3">
                  <label className="text-xs text-gray-500 font-medium uppercase tracking-wide">Nom</label>
                  <p className="text-gray-800 font-semibold text-sm mt-1">{newStaffName}</p>
                </div>
                <div className="mb-3">
                  <label className="text-xs text-gray-500 font-medium uppercase tracking-wide">Email</label>
                  <p className="text-gray-800 font-semibold text-sm mt-1">{newStaffEmail}</p>
                </div>
                <div>
                  <label className="text-xs text-gray-500 font-medium uppercase tracking-wide">Mot de passe temporaire</label>
                  <div className="flex items-center gap-2 mt-2">
                    <code className="flex-1 bg-white px-3 py-2 rounded-lg text-sm font-mono text-emerald-600 border border-gray-200">
                      {newStaffPassword}
                    </code>
                    <button
                      onClick={() => copyToClipboard(newStaffPassword)}
                      className="p-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-all"
                      title="Copier"
                    >
                      <Copy size="16" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-5">
                <p className="text-xs text-amber-700">
                  ⚠️ Partagez ces identifiants avec le membre. Il pourra changer son mot de passe après sa première connexion.
                </p>
              </div>

              <button
                onClick={() => setShowPasswordModal(false)}
                className="w-full py-3 rounded-xl bg-emerald-500 text-white font-semibold hover:bg-emerald-600 transition-all text-sm"
              >
                Terminé
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-5">
                <div>
                  <h2 className="text-xl font-bold text-gray-800">{selectedStaff ? "Modifier le membre" : "Ajouter un membre"}</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {selectedStaff ? `Modification de ${selectedStaff.first_name} ${selectedStaff.last_name}` : "Nouveau membre d'équipe"}
                  </p>
                </div>
                <button onClick={() => { setShowModal(false); setForm(emptyForm); setSelectedStaff(null); setFormError(""); setImageFile(null); setImagePreview(null); }} className="text-gray-400 hover:text-gray-600 transition-colors w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100">
                  <X size="18" />
                </button>
              </div>

              {formError && (
                <div className="bg-red-50 text-red-600 text-xs p-3 rounded-lg mb-4 border border-red-200 flex items-center gap-2">
                  <AlertCircle size="14" />
                  {formError}
                </div>
              )}

              {/* Profile Picture Upload */}
              <div className="flex justify-center mb-5">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 border-2 border-gray-200">
                    {imagePreview ? (
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : selectedStaff?.picture_url ? (
                      <img 
                        src={getProfilePictureUrl(selectedStaff) || ''} 
                        alt={selectedStaff.first_name} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <User size="32" />
                      </div>
                    )}
                  </div>
                  <label className="absolute bottom-0 right-0 bg-emerald-500 rounded-full p-1.5 cursor-pointer hover:bg-emerald-600 transition-colors">
                    <Camera size="14" className="text-white" />
                    <input type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
                  </label>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Prénom *</label>
                  <input 
                    className={inputClass} 
                    placeholder="Ahmed" 
                    value={form.first_name} 
                    onChange={e => setForm({ ...form, first_name: e.target.value })} 
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Nom *</label>
                  <input 
                    className={inputClass} 
                    placeholder="Benali" 
                    value={form.last_name} 
                    onChange={e => setForm({ ...form, last_name: e.target.value })} 
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Email *</label>
                  <input 
                    type="email" 
                    className={inputClass} 
                    placeholder="ahmed@email.ma" 
                    value={form.email} 
                    onChange={e => setForm({ ...form, email: e.target.value })} 
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Téléphone</label>
                  <input 
                    type="tel" 
                    className={inputClass} 
                    placeholder="+212 6 12 34 56 78" 
                    value={form.phone} 
                    onChange={e => setForm({ ...form, phone: e.target.value })} 
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Rôle *</label>
                  <select 
                    className={inputClass}
                    value={form.role}
                    onChange={e => setForm({ ...form, role: e.target.value })}
                  >
                    <option value="agency_manager">Gestionnaire Agence</option>
                    <option value="finance_staff">Staff Finance</option>
                    <option value="property_staff">Staff Propriétés</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 mt-6 pt-4 border-t border-gray-100">
                <button onClick={() => { setShowModal(false); setForm(emptyForm); setSelectedStaff(null); setFormError(""); setImageFile(null); setImagePreview(null); }} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition-all text-sm">
                  Annuler
                </button>
                <button onClick={handleSubmit} disabled={submitting} className="flex-1 py-2.5 rounded-xl bg-emerald-500 text-white font-semibold hover:bg-emerald-600 transition-all flex items-center justify-center gap-2 shadow-sm text-sm">
                  {submitting ? <Loader2 className="animate-spin" size="16" /> : (selectedStaff ? "Mettre à jour" : "Ajouter")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Staff Details Modal - NO PERMISSIONS, NO ROLE BUTTON */}
      {showDetailsModal && selectedStaff && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="p-6">
              <div className="flex justify-between items-start mb-5">
                <h2 className="text-xl font-bold text-gray-800">Détails du membre</h2>
                <button onClick={() => setShowDetailsModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100">
                  <X size="18" />
                </button>
              </div>
              
              <div className="space-y-5">
                <div className="flex items-center gap-4 pb-4 border-b border-gray-100">
                  {getProfilePictureUrl(selectedStaff) && !imageErrors[selectedStaff.id] ? (
                    <img 
                      src={getProfilePictureUrl(selectedStaff)!} 
                      alt={`${selectedStaff.first_name} ${selectedStaff.last_name}`}
                      className="w-16 h-16 rounded-full object-cover"
                      onError={() => handleImageError(selectedStaff.id)}
                    />
                  ) : (
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center text-lg font-bold ${avatarColors[0]}`}>
                      {getInitials(selectedStaff.first_name, selectedStaff.last_name)}
                    </div>
                  )}
                  <div>
                    <h3 className="font-bold text-gray-800 text-lg">{selectedStaff.first_name} {selectedStaff.last_name}</h3>
                    <div className="mt-2">{getRoleBadge(selectedStaff.role)}</div>
                    <div className="mt-1">{getStatusBadge(selectedStaff.is_active)}</div>
                  </div>
                </div>
                
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-3 font-semibold">Contact</p>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-sm">
                      <Mail size="14" className="text-gray-400" />
                      <span className="text-gray-700">{selectedStaff.email}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <Phone size="14" className="text-gray-400" />
                      <span className="text-gray-700">{selectedStaff.phone || "Non renseigné"}</span>
                    </div>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-gray-100">
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-3 font-semibold">Inscription</p>
                  <div className="flex items-center gap-3 text-sm">
                    <Calendar size="14" className="text-gray-400" />
                    <span className="text-gray-700">{new Date(selectedStaff.created_at).toLocaleDateString('fr-FR')}</span>
                  </div>
                </div>

                {selectedStaff.phone && (
                  <div className="pt-2">
                    <button
                      onClick={() => openWhatsApp(selectedStaff.phone!, selectedStaff.first_name)}
                      className="w-full flex items-center justify-center gap-2 bg-[#25D366] text-white py-2.5 rounded-xl hover:bg-[#20b859] transition-all text-sm font-semibold"
                    >
                      <MessageCircle size="16" />
                      Contacter sur WhatsApp
                    </button>
                  </div>
                )}
              </div>
              
              <div className="flex gap-2 mt-6 pt-4 border-t border-gray-100">
                <button
                  onClick={() => { setShowDetailsModal(false); handleEdit(selectedStaff); }}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition-all text-sm flex items-center justify-center gap-2"
                >
                  <Edit size="14" /> Modifier
                </button>
                <button
                  onClick={handleResetPassword}
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-xl bg-amber-500 text-white font-semibold hover:bg-amber-600 transition-all text-sm flex items-center justify-center gap-2"
                >
                  <Key size="14" /> Reset
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Role Change Modal */}
      {showRoleModal && selectedStaff && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="p-6">
              <div className="text-center mb-5">
                <div className="w-14 h-14 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-7 h-7 text-indigo-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-800">Changer le rôle</h2>
                <p className="text-sm text-gray-500 mt-1">
                  {selectedStaff.first_name} {selectedStaff.last_name}
                </p>
              </div>

              <div className="space-y-2 mb-5">
                {Object.entries(roleLabels).map(([role, info]) => (
                  <button
                    key={role}
                    onClick={() => handleUpdateRole(role)}
                    className={`w-full text-left p-3 rounded-xl border transition-all ${selectedStaff.role === role ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 hover:bg-gray-50'}`}
                    disabled={submitting}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: info.bg }}>
                        <info.icon size="16" style={{ color: info.color }} />
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-gray-800">{info.labelFr}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              <button
                onClick={() => setShowRoleModal(false)}
                className="w-full py-2.5 rounded-xl border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition-all text-sm"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status Change Modal */}
      {showStatusModal && selectedStaff && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
            <div className="p-6">
              <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Power size="20" className="text-amber-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-800 text-center mb-2">
                {selectedStaff.is_active ? "Désactiver le compte" : "Activer le compte"}
              </h2>
              <p className="text-gray-500 text-sm text-center mb-5">
                {selectedStaff.is_active 
                  ? `Désactiver "${selectedStaff.first_name} ${selectedStaff.last_name}" ? L'utilisateur ne pourra plus se connecter.`
                  : `Activer "${selectedStaff.first_name} ${selectedStaff.last_name}" ? L'utilisateur pourra se connecter.`
                }
              </p>
              <div className="flex gap-3">
                <button onClick={() => setShowStatusModal(false)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition-all text-sm">
                  Annuler
                </button>
                <button
                  onClick={() => handleUpdateStatus(selectedStaff.is_active ? 'inactive' : 'active')}
                  disabled={submitting}
                  className={`flex-1 py-2.5 rounded-xl text-white font-semibold transition-all flex items-center justify-center gap-2 text-sm ${selectedStaff.is_active ? 'bg-red-500 hover:bg-red-600' : 'bg-emerald-500 hover:bg-emerald-600'}`}
                >
                  {submitting ? <Loader2 className="animate-spin" size="16" /> : (selectedStaff.is_active ? "Désactiver" : "Activer")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedStaff && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
            <div className="p-6">
              <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Trash2 size="20" className="text-red-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-800 text-center mb-2">Confirmer la suppression</h2>
              <p className="text-gray-500 text-sm text-center mb-5">
                Supprimer <span className="font-semibold text-gray-800">"{selectedStaff.first_name} {selectedStaff.last_name}"</span> ? Action irréversible.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setShowDeleteModal(false)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition-all text-sm">
                  Annuler
                </button>
                <button
                  onClick={handleDelete}
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-xl bg-red-500 text-white font-semibold hover:bg-red-600 transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50"
                >
                  {submitting ? <Loader2 className="animate-spin" size="16" /> : "Supprimer"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}