"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus, Search, Eye, Edit, Trash2, MapPin, User,
  Building2, AlertCircle, X, Loader2, Image as ImageIcon,
  Upload, CheckCircle, XCircle, Home, Calendar, Wifi, Thermometer, Key, RefreshCw,
  Bed, Bath, Square, DollarSign, Building, ChevronLeft, ChevronRight
} from "lucide-react";
import api from "@/lib/axios";
import { useLang } from "@/app/components/contexts/LanguageContext";

const i18n = {
  fr: {
    properties: "Gestion des Propriétés",
    subtitle: "Gérez votre parc immobilier",
    addProperty: "Ajouter une propriété",
    editProperty: "Modifier la propriété",
    propertyName: "Nom de la propriété",
    address: "Adresse",
    city: "Ville",
    owner: "Propriétaire",
    description: "Description",
    status: "Statut",
    images: "Images",
    uploadImages: "Cliquez pour télécharger des images",
    save: "Enregistrer",
    cancel: "Annuler",
    delete: "Supprimer",
    viewDetails: "Voir détails",
    search: "Rechercher...",
    loading: "Chargement...",
    noData: "Aucune propriété trouvée",
    available: "Disponible",
    occupied: "Occupé",
    maintenance: "Maintenance",
    inactive: "Inactif",
    generalInfo: "Informations générales",
    location: "Emplacement",
    features: "Caractéristiques",
    changeStatus: "Changer le statut",
    confirmDelete: "Êtes-vous sûr de vouloir supprimer cette propriété ?",
    refresh: "Actualiser",
    bedrooms: "Chambres",
    bathrooms: "Salles de bain",
    area: "Surface (m²)",
    rent: "Loyer mensuel (DH)",
    propertyType: "Type de propriété",
    previous: "Précédent",
    next: "Suivant",
    page: "Page",
    of: "sur",
    apartment: "Appartement",
    house: "Maison",
    commercial: "Commercial",
    land: "Terrain",
    required: "Champ obligatoire",
  },
  ar: {
    properties: "إدارة العقارات",
    subtitle: "إدارة محفظتك العقارية",
    addProperty: "إضافة عقار",
    editProperty: "تعديل العقار",
    propertyName: "اسم العقار",
    address: "العنوان",
    city: "المدينة",
    owner: "المالك",
    description: "الوصف",
    status: "الحالة",
    images: "الصور",
    uploadImages: "انقر لتحميل الصور",
    save: "حفظ",
    cancel: "إلغاء",
    delete: "حذف",
    viewDetails: "عرض التفاصيل",
    search: "بحث...",
    loading: "جارٍ التحميل...",
    noData: "لم يتم العثور على عقارات",
    available: "متاح",
    occupied: "مشغول",
    maintenance: "صيانة",
    inactive: "غير نشط",
    generalInfo: "معلومات عامة",
    location: "الموقع",
    features: "الميزات",
    changeStatus: "تغيير الحالة",
    confirmDelete: "هل أنت متأكد من حذف هذا العقار؟",
    refresh: "تحديث",
    bedrooms: "غرف نوم",
    bathrooms: "حمامات",
    area: "المساحة (م²)",
    rent: "الإيجار الشهري (درهم)",
    propertyType: "نوع العقار",
    previous: "السابق",
    next: "التالي",
    page: "صفحة",
    of: "من",
    apartment: "شقة",
    house: "منزل",
    commercial: "تجاري",
    land: "أرض",
    required: "حقل إجباري",
  },
} as const;

const GREEN = "#22c55e";
const BLUE = "#3b82f6";
const ORANGE = "#f59e0b";
const RED = "#ef4444";
const PURPLE = "#8b5cf6";

interface Property {
  id: number;
  name: string;
  location: string;
  city?: string;
  status: "available" | "occupied" | "maintenance" | "inactive";
  owner?: number;
  owner_name?: string;
  owner_id?: number;
  description?: string;
  images?: { id: number; image_url: string; is_main: boolean }[];
  bedrooms?: number;
  bathrooms?: number;
  area_sqm?: number;
  monthly_rent?: number;
  property_type?: string;
  is_active?: boolean;
}

interface Owner {
  id: number;
  full_name: string;
}

export default function PropertiesPage() {
  const router = useRouter();
  const { lang } = useLang();
  const tx = i18n[lang];
  const isRTL = lang === "ar";

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [owners, setOwners] = useState<Owner[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Pagination states - 6 items per page (2 rows of 3 cards)
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(6);
  
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [newStatus, setNewStatus] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [imageFiles, setImageFiles] = useState<FileList | null>(null);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [form, setForm] = useState({
    name: "",
    location: "",
    city: "",
    owner_id: "",
    description: "",
    status: "available",
    bedrooms: "",
    bathrooms: "",
    area_sqm: "",
    monthly_rent: "",
    property_type: "apartment",
  });

  useEffect(() => {
    const token = localStorage.getItem("access");
    const role = localStorage.getItem("role");
    console.log("Token exists:", !!token);
    console.log("User role:", role);
    
    if (!token || role !== "property_staff") {
      console.log("Redirecting to login...");
      router.push("/login");
      return;
    }
    fetchProperties();
    fetchOwners();
  }, [router]);

  const fetchProperties = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log("Fetching properties...");
      const res = await api.get("/api/properties/");
      console.log("Raw API response:", res.data);
      
      let data = res.data;
      if (data.results) {
        data = data.results;
      }
      if (!Array.isArray(data)) {
        console.error("Data is not an array:", data);
        data = [];
      }
      
      console.log("Processed properties data:", data);
      console.log("Number of properties:", data.length);
      
      setProperties(data);
      setCurrentPage(1);
    } catch (err: any) {
      console.error("Error fetching properties:", err);
      setError(err.response?.data?.message || "Failed to load properties");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    await fetchProperties();
  };

  const fetchOwners = async () => {
    try {
      console.log("Fetching owners...");
      const res = await api.get("/api/owners/");
      console.log("Owners response:", res.data);
      
      let data = res.data.results || res.data;
      if (!Array.isArray(data)) {
        data = [];
      }
      
      const transformedOwners = data.map((owner: any) => ({
        id: owner.id,
        full_name: owner.full_name || owner.user?.full_name || `Owner ${owner.id}`
      }));
      
      console.log("Processed owners:", transformedOwners);
      setOwners(transformedOwners);
    } catch (err: any) {
      console.error("Error fetching owners:", err);
    }
  };

  const handleImageSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setImageFiles(files);
    const previews: string[] = [];
    for (let i = 0; i < files.length; i++) {
      previews.push(URL.createObjectURL(files[i]));
    }
    setImagePreviews(previews);
  };

  const removePreview = (index: number) => {
    URL.revokeObjectURL(imagePreviews[index]);
    const newPreviews = [...imagePreviews];
    newPreviews.splice(index, 1);
    setImagePreviews(newPreviews);
    if (imageFiles) {
      const dt = new DataTransfer();
      for (let i = 0; i < imageFiles.length; i++) {
        if (i !== index) dt.items.add(imageFiles[i]);
      }
      setImageFiles(dt.files.length > 0 ? dt.files : null);
    }
  };

  const uploadImages = async (propertyId: number) => {
    if (!imageFiles || imageFiles.length === 0) return;
    const formData = new FormData();
    for (let i = 0; i < imageFiles.length; i++) {
      formData.append("images", imageFiles[i]);
    }
    try {
      await api.post(`/api/properties/${propertyId}/upload-images/`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      console.log("Images uploaded successfully");
    } catch (err) {
      console.error("Error uploading images:", err);
    }
  };

  const handleSubmit = async () => {
    setFormError("");
    if (!form.name || !form.location || !form.owner_id) {
      setFormError("Veuillez remplir tous les champs obligatoires.");
      return;
    }
    setSubmitting(true);
    try {
      let propertyId: number;
      const propertyData = {
        name: form.name,
        location: form.location,
        city: form.city,
        owner: parseInt(form.owner_id),
        description: form.description,
        status: form.status,
        bedrooms: parseInt(form.bedrooms) || 0,
        bathrooms: parseInt(form.bathrooms) || 0,
        area_sqm: parseInt(form.area_sqm) || 0,
        monthly_rent: parseInt(form.monthly_rent) || 0,
        property_type: form.property_type,
      };
      
      console.log("Submitting property data:", propertyData);

      if (selectedProperty) {
        await api.put(`/api/properties/${selectedProperty.id}/`, propertyData);
        propertyId = selectedProperty.id;
      } else {
        const res = await api.post("/api/properties/", propertyData);
        propertyId = res.data.id;
      }
      
      if (imageFiles && imageFiles.length > 0) {
        await uploadImages(propertyId);
      }
      
      setShowModal(false);
      resetForm();
      await fetchProperties();
    } catch (err: any) {
      console.error("Error saving property:", err);
      setFormError(err.response?.data?.message || JSON.stringify(err.response?.data) || "Une erreur est survenue");
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async () => {
    if (!selectedProperty || !newStatus) return;
    setSubmitting(true);
    try {
      await api.patch(`/api/properties/${selectedProperty.id}/`, { status: newStatus });
      setShowStatusModal(false);
      setSelectedProperty(null);
      await fetchProperties();
    } catch (err) {
      console.error("Error updating status:", err);
      setFormError("Failed to update status");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedProperty) return;
    setSubmitting(true);
    try {
      await api.delete(`/api/properties/${selectedProperty.id}/`);
      setShowDeleteModal(false);
      setSelectedProperty(null);
      await fetchProperties();
    } catch (err) {
      console.error("Error deleting property:", err);
      setFormError("Failed to delete property");
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setForm({
      name: "",
      location: "",
      city: "",
      owner_id: "",
      description: "",
      status: "available",
      bedrooms: "",
      bathrooms: "",
      area_sqm: "",
      monthly_rent: "",
      property_type: "apartment",
    });
    setImageFiles(null);
    setImagePreviews([]);
    setSelectedProperty(null);
    setFormError("");
  };

  const openEditModal = (property: Property) => {
    console.log("Editing property:", property);
    setSelectedProperty(property);
    setForm({
      name: property.name,
      location: property.location || "",
      city: property.city || "",
      owner_id: property.owner?.toString() || property.owner_id?.toString() || "",
      description: property.description || "",
      status: property.status,
      bedrooms: property.bedrooms?.toString() || "",
      bathrooms: property.bathrooms?.toString() || "",
      area_sqm: property.area_sqm?.toString() || "",
      monthly_rent: property.monthly_rent?.toString() || "",
      property_type: property.property_type || "apartment",
    });
    setImageFiles(null);
    setImagePreviews([]);
    setShowModal(true);
  };

  const openStatusModal = (property: Property) => {
    setSelectedProperty(property);
    setNewStatus(property.status);
    setShowStatusModal(true);
  };

  const openDetailsModal = (property: Property) => {
    setSelectedProperty(property);
    setShowDetailsModal(true);
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, { color: string; bg: string; icon: any; label: string }> = {
      available: { color: GREEN, bg: "#f0fdf4", icon: CheckCircle, label: tx.available },
      occupied: { color: BLUE, bg: "#eff6ff", icon: Home, label: tx.occupied },
      maintenance: { color: ORANGE, bg: "#fff7ed", icon: AlertCircle, label: tx.maintenance },
      inactive: { color: RED, bg: "#fef2f2", icon: XCircle, label: tx.inactive },
    };
    const s = styles[status] || styles.available;
    const Icon = s.icon;
    return (
      <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 8px", borderRadius: 4, fontSize: 10.5, fontWeight: 500, background: s.bg, color: s.color }}>
        <Icon size={10} /> {s.label}
      </span>
    );
  };

  const getPropertyTypeIcon = (type: string) => {
    switch(type) {
      case 'house': return <Home size={14} />;
      case 'apartment': return <Building size={14} />;
      case 'commercial': return <Building2 size={14} />;
      default: return <Building size={14} />;
    }
  };

  // Filter properties based on search
  const filteredProperties = properties.filter(p =>
    p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.owner_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredProperties.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredProperties.length / itemsPerPage);

  const paginate = (pageNumber: number) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const inputClass = "w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-gray-700 bg-gray-50 focus:bg-white transition-all text-sm";
  const labelClass = "block text-xs font-medium text-gray-700 mb-1.5";

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "2rem" }}>
        <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "1rem", color: "#dc2626" }}>
          <h3>Error loading properties</h3>
          <p>{error}</p>
          <button onClick={fetchProperties} style={{ marginTop: "1rem", padding: "0.5rem 1rem", background: "#3b82f6", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer" }}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: isRTL ? "'Cairo', system-ui" : "'Geist', system-ui", direction: isRTL ? "rtl" : "ltr" }}>
      <div style={{ maxWidth: 1400, margin: "0 auto", padding: "2rem" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <h1 style={{ fontSize: "1.875rem", fontWeight: 700, color: "#111827", margin: 0 }}>{tx.properties}</h1>
            <p style={{ fontSize: "0.875rem", color: "#6B7280", marginTop: "0.25rem" }}>{tx.subtitle}</p>
            <p style={{ fontSize: "0.75rem", color: "#9ca3af", marginTop: "0.25rem" }}>
              {filteredProperties.length} property(ies) loaded
            </p>
          </div>
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button onClick={refreshData} disabled={refreshing} style={{
              display: "flex", alignItems: "center", gap: "0.5rem",
              padding: "0.5rem 1.25rem", borderRadius: "0.5rem", border: "1px solid #e2e8f0",
              background: "#fff", color: "#64748b", cursor: "pointer",
              fontSize: "0.8125rem", fontWeight: 500,
              transition: "all 0.2s"
            }}>
              <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} /> {tx.refresh}
            </button>
            <button onClick={() => { resetForm(); setShowModal(true); }} style={{
              display: "flex", alignItems: "center", gap: "0.5rem",
              padding: "0.5rem 1.25rem", borderRadius: "0.5rem", border: "none",
              background: GREEN, color: "#fff", cursor: "pointer",
              fontSize: "0.8125rem", fontWeight: 500,
              transition: "all 0.2s"
            }}>
              <Plus size={14} /> {tx.addProperty}
            </button>
          </div>
        </div>

        {/* Search */}
        <div style={{ position: "relative", maxWidth: 320, marginBottom: "2rem" }}>
          <Search size={14} style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
          <input
            type="text"
            placeholder={tx.search}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            style={{ width: "100%", padding: "0.5rem 0.75rem 0.5rem 2.25rem", border: "1px solid #e2e8f0", borderRadius: "0.5rem", fontSize: "0.8125rem" }}
          />
        </div>

        {/* Properties Grid - 3 cards per row, 6 items per page */}
        {currentItems.length === 0 ? (
          <div style={{ textAlign: "center", padding: "3rem", background: "#f9fafb", borderRadius: 12 }}>
            <Building2 size={48} style={{ margin: "0 auto 1rem", color: "#94a3b8" }} />
            <p style={{ color: "#64748b" }}>{searchQuery ? "No matching properties found" : tx.noData}</p>
          </div>
        ) : (
          <>
            <div style={{ 
              display: "grid", 
              gridTemplateColumns: "repeat(3, 1fr)", 
              gap: "1.5rem",
              marginBottom: "2rem"
            }}>
              {currentItems.map((property) => (
                <div
                  key={property.id}
                  style={{
                    background: "#fff",
                    borderRadius: "0.75rem",
                    border: "1px solid #e2e8f0",
                    overflow: "hidden",
                    transition: "all 0.3s ease",
                    cursor: "pointer",
                    boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-4px)";
                    e.currentTarget.style.boxShadow = "0 12px 24px rgba(0,0,0,0.1)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "0 1px 2px rgba(0,0,0,0.05)";
                  }}
                >
                  {/* Image Section */}
                  <div style={{ position: "relative", height: 200, background: "#f1f5f9", overflow: "hidden" }}>
                    {property.images && property.images.length > 0 ? (
                      <img
                        src={property.images[0].image_url}
                        alt={property.name}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    ) : (
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
                        <Building2 size={48} color="#cbd5e1" />
                      </div>
                    )}
                    <div style={{ position: "absolute", top: 12, right: 12 }}>
                      {getStatusBadge(property.status)}
                    </div>
                  </div>

                  {/* Content Section */}
                  <div style={{ padding: "1rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "0.5rem" }}>
                      <h3 style={{ fontSize: "1rem", fontWeight: 600, color: "#1e293b", margin: 0, flex: 1 }}>
                        {property.name}
                      </h3>
                      <div style={{ display: "flex", gap: "0.25rem" }}>
                        <button
                          onClick={(e) => { e.stopPropagation(); openDetailsModal(property); }}
                          style={{ padding: "0.25rem", background: "none", border: "none", cursor: "pointer", color: "#3b82f6", borderRadius: "0.25rem" }}
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); openEditModal(property); }}
                          style={{ padding: "0.25rem", background: "none", border: "none", cursor: "pointer", color: "#10b981", borderRadius: "0.25rem" }}
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); openStatusModal(property); }}
                          style={{ padding: "0.25rem", background: "none", border: "none", cursor: "pointer", color: "#f59e0b", borderRadius: "0.25rem" }}
                        >
                          <RefreshCw size={14} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setSelectedProperty(property); setShowDeleteModal(true); }}
                          style={{ padding: "0.25rem", background: "none", border: "none", cursor: "pointer", color: "#ef4444", borderRadius: "0.25rem" }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Location */}
                    <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", marginBottom: "0.5rem", color: "#64748b", fontSize: "0.75rem" }}>
                      <MapPin size={12} />
                      <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{property.location}</span>
                      {property.city && <span>• {property.city}</span>}
                    </div>

                    {/* Owner */}
                    <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", marginBottom: "0.75rem", color: "#64748b", fontSize: "0.75rem" }}>
                      <User size={12} />
                      <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{property.owner_name || `Owner ${property.owner || "Unknown"}`}</span>
                    </div>

                    {/* Features Grid */}
                    <div style={{ 
                      display: "grid", 
                      gridTemplateColumns: "repeat(2, 1fr)", 
                      gap: "0.5rem",
                      paddingTop: "0.75rem",
                      borderTop: "1px solid #f1f5f9"
                    }}>
                      {property.property_type && (
                        <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.7rem", color: "#64748b" }}>
                          {getPropertyTypeIcon(property.property_type)}
                          <span style={{ textTransform: "capitalize" }}>{property.property_type}</span>
                        </div>
                      )}
                      {property.bedrooms !== undefined && property.bedrooms > 0 && (
                        <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.7rem", color: "#64748b" }}>
                          <Bed size={12} />
                          <span>{property.bedrooms} {tx.bedrooms}</span>
                        </div>
                      )}
                      {property.bathrooms !== undefined && property.bathrooms > 0 && (
                        <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.7rem", color: "#64748b" }}>
                          <Bath size={12} />
                          <span>{property.bathrooms} {tx.bathrooms}</span>
                        </div>
                      )}
                      {property.area_sqm !== undefined && property.area_sqm > 0 && (
                        <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.7rem", color: "#64748b" }}>
                          <Square size={12} />
                          <span>{property.area_sqm} m²</span>
                        </div>
                      )}
                      {property.monthly_rent !== undefined && property.monthly_rent > 0 && (
                        <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.7rem", color: GREEN, fontWeight: 600 }}>
                          <DollarSign size={12} />
                          <span>{property.monthly_rent.toLocaleString()} DH</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: "0.5rem",
                marginTop: "2rem",
                padding: "1rem 0",
                borderTop: "1px solid #e2e8f0"
              }}>
                <button
                  onClick={goToPreviousPage}
                  disabled={currentPage === 1}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.25rem",
                    padding: "0.5rem 1rem",
                    borderRadius: "0.5rem",
                    border: "1px solid #e2e8f0",
                    background: currentPage === 1 ? "#f9fafb" : "#fff",
                    color: currentPage === 1 ? "#cbd5e1" : "#64748b",
                    cursor: currentPage === 1 ? "not-allowed" : "pointer",
                    fontSize: "0.875rem",
                    fontWeight: 500,
                    transition: "all 0.2s"
                  }}
                >
                  <ChevronLeft size={16} />
                  {tx.previous}
                </button>
                
                <div style={{ display: "flex", gap: "0.25rem" }}>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => paginate(pageNum)}
                        style={{
                          minWidth: "36px",
                          height: "36px",
                          borderRadius: "0.5rem",
                          border: currentPage === pageNum ? "none" : "1px solid #e2e8f0",
                          background: currentPage === pageNum ? GREEN : "#fff",
                          color: currentPage === pageNum ? "#fff" : "#64748b",
                          cursor: "pointer",
                          fontWeight: currentPage === pageNum ? 600 : 500,
                          fontSize: "0.875rem",
                          transition: "all 0.2s"
                        }}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                
                <button
                  onClick={goToNextPage}
                  disabled={currentPage === totalPages}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.25rem",
                    padding: "0.5rem 1rem",
                    borderRadius: "0.5rem",
                    border: "1px solid #e2e8f0",
                    background: currentPage === totalPages ? "#f9fafb" : "#fff",
                    color: currentPage === totalPages ? "#cbd5e1" : "#64748b",
                    cursor: currentPage === totalPages ? "not-allowed" : "pointer",
                    fontSize: "0.875rem",
                    fontWeight: 500,
                    transition: "all 0.2s"
                  }}
                >
                  {tx.next}
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
            
            {/* Page info */}
            {totalPages > 1 && (
              <div style={{
                textAlign: "center",
                marginTop: "0.5rem",
                fontSize: "0.75rem",
                color: "#94a3b8"
              }}>
                {tx.page} {currentPage} {tx.of} {totalPages}
              </div>
            )}
          </>
        )}
      </div>

      {/* Add/Edit Modal - Improved Design with better spacing */}
      {showModal && (
        <div style={{ 
          position: "fixed", 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          background: "rgba(0,0,0,0.5)", 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "center", 
          zIndex: 1000,
          padding: "1rem"
        }}>
          <div style={{ 
            background: "#fff", 
            borderRadius: "1rem", 
            width: "100%", 
            maxWidth: "560px", 
            maxHeight: "90vh", 
            overflow: "auto",
            boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)"
          }}>
            <div style={{ 
              padding: "1.25rem 1.5rem", 
              borderBottom: "1px solid #e2e8f0", 
              display: "flex", 
              justifyContent: "space-between", 
              alignItems: "center",
              background: "#f8fafc"
            }}>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 600, color: "#1e293b" }}>
                {selectedProperty ? tx.editProperty : tx.addProperty}
              </h2>
              <button 
                onClick={() => { setShowModal(false); resetForm(); }} 
                style={{ 
                  background: "none", 
                  border: "none", 
                  cursor: "pointer",
                  padding: "0.25rem",
                  borderRadius: "0.375rem",
                  transition: "background 0.2s"
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = "#f1f5f9"}
                onMouseLeave={(e) => e.currentTarget.style.background = "none"}
              >
                <X size={20} color="#64748b" />
              </button>
            </div>
            
            <div style={{ padding: "1.5rem" }}>
              {formError && (
                <div style={{ 
                  marginBottom: "1.25rem", 
                  padding: "0.75rem 1rem", 
                  background: "#fef2f2", 
                  color: "#dc2626", 
                  borderRadius: "0.5rem", 
                  fontSize: "0.8125rem",
                  borderLeft: `3px solid ${RED}`
                }}>
                  {formError}
                </div>
              )}
              
              <div style={{ marginBottom: "1rem" }}>
                <label className={labelClass}>{tx.propertyName} <span style={{ color: RED }}>*</span></label>
                <input 
                  type="text" 
                  className={inputClass} 
                  value={form.name} 
                  onChange={(e) => setForm({...form, name: e.target.value})}
                  placeholder="Ex: Villa Majorelle"
                />
              </div>
              
              <div style={{ marginBottom: "1rem" }}>
                <label className={labelClass}>{tx.address} <span style={{ color: RED }}>*</span></label>
                <input 
                  type="text" 
                  className={inputClass} 
                  value={form.location} 
                  onChange={(e) => setForm({...form, location: e.target.value})}
                  placeholder="Ex: 123 Avenue Mohammed V"
                />
              </div>
              
              <div style={{ marginBottom: "1rem" }}>
                <label className={labelClass}>{tx.city}</label>
                <input 
                  type="text" 
                  className={inputClass} 
                  value={form.city} 
                  onChange={(e) => setForm({...form, city: e.target.value})}
                  placeholder="Ex: Casablanca"
                />
              </div>
              
              <div style={{ marginBottom: "1rem" }}>
                <label className={labelClass}>{tx.owner} <span style={{ color: RED }}>*</span></label>
                <select 
                  className={inputClass} 
                  value={form.owner_id} 
                  onChange={(e) => setForm({...form, owner_id: e.target.value})}
                >
                  <option value="">Sélectionner un propriétaire</option>
                  {owners.map(owner => (
                    <option key={owner.id} value={owner.id}>{owner.full_name}</option>
                  ))}
                </select>
              </div>
              
              <div style={{ marginBottom: "1rem" }}>
                <label className={labelClass}>{tx.description}</label>
                <textarea 
                  className={inputClass} 
                  rows={3} 
                  value={form.description} 
                  onChange={(e) => setForm({...form, description: e.target.value})}
                  placeholder="Description de la propriété..."
                  style={{ resize: "vertical" }}
                />
              </div>
              
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
                <div>
                  <label className={labelClass}>{tx.bedrooms}</label>
                  <input 
                    type="number" 
                    className={inputClass} 
                    value={form.bedrooms} 
                    onChange={(e) => setForm({...form, bedrooms: e.target.value})}
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className={labelClass}>{tx.bathrooms}</label>
                  <input 
                    type="number" 
                    className={inputClass} 
                    value={form.bathrooms} 
                    onChange={(e) => setForm({...form, bathrooms: e.target.value})}
                    placeholder="0"
                  />
                </div>
              </div>
              
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
                <div>
                  <label className={labelClass}>{tx.area}</label>
                  <input 
                    type="number" 
                    className={inputClass} 
                    value={form.area_sqm} 
                    onChange={(e) => setForm({...form, area_sqm: e.target.value})}
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className={labelClass}>{tx.rent}</label>
                  <input 
                    type="number" 
                    className={inputClass} 
                    value={form.monthly_rent} 
                    onChange={(e) => setForm({...form, monthly_rent: e.target.value})}
                    placeholder="0"
                  />
                </div>
              </div>
              
              <div style={{ marginBottom: "1rem" }}>
                <label className={labelClass}>{tx.propertyType}</label>
                <select 
                  className={inputClass} 
                  value={form.property_type} 
                  onChange={(e) => setForm({...form, property_type: e.target.value})}
                >
                  <option value="apartment">{tx.apartment}</option>
                  <option value="house">{tx.house}</option>
                  <option value="commercial">{tx.commercial}</option>
                  <option value="land">{tx.land}</option>
                </select>
              </div>
              
              <div style={{ marginBottom: "0" }}>
                <label className={labelClass}>{tx.images}</label>
                <div style={{ 
                  border: "2px dashed #e2e8f0", 
                  borderRadius: "0.5rem", 
                  padding: "1rem", 
                  textAlign: "center",
                  transition: "border-color 0.2s",
                  cursor: "pointer"
                }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = GREEN}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = "#e2e8f0"}
                >
                  <input 
                    type="file" 
                    multiple 
                    accept="image/*" 
                    onChange={(e) => handleImageSelect(e.target.files)} 
                    style={{ display: "none" }} 
                    id="image-upload" 
                  />
                  <label htmlFor="image-upload" style={{ cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem" }}>
                    <Upload size={24} color="#94a3b8" />
                    <span style={{ fontSize: "0.8125rem", color: "#64748b" }}>{tx.uploadImages}</span>
                  </label>
                </div>
                {imagePreviews.length > 0 && (
                  <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.75rem", flexWrap: "wrap" }}>
                    {imagePreviews.map((preview, idx) => (
                      <div key={idx} style={{ position: "relative", width: "70px", height: "70px" }}>
                        <img 
                          src={preview} 
                          alt={`Preview ${idx}`} 
                          style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "0.5rem" }} 
                        />
                        <button 
                          onClick={() => removePreview(idx)} 
                          style={{ 
                            position: "absolute", 
                            top: "-6px", 
                            right: "-6px", 
                            background: RED, 
                            color: "#fff", 
                            border: "none", 
                            borderRadius: "50%", 
                            width: "20px", 
                            height: "20px", 
                            display: "flex", 
                            alignItems: "center", 
                            justifyContent: "center", 
                            cursor: "pointer",
                            transition: "transform 0.2s"
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.1)"}
                          onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            <div style={{ 
              padding: "1rem 1.5rem", 
              borderTop: "1px solid #e2e8f0", 
              display: "flex", 
              gap: "0.75rem", 
              justifyContent: "flex-end",
              background: "#fafbfc"
            }}>
              <button 
                onClick={() => { setShowModal(false); resetForm(); }} 
                style={{ 
                  padding: "0.5rem 1rem", 
                  borderRadius: "0.5rem", 
                  border: "1px solid #e2e8f0", 
                  background: "#fff", 
                  cursor: "pointer",
                  fontSize: "0.8125rem",
                  fontWeight: 500,
                  color: "#64748b",
                  transition: "all 0.2s"
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = "#f8fafc"}
                onMouseLeave={(e) => e.currentTarget.style.background = "#fff"}
              >
                {tx.cancel}
              </button>
              <button 
                onClick={handleSubmit} 
                disabled={submitting} 
                style={{ 
                  padding: "0.5rem 1.25rem", 
                  borderRadius: "0.5rem", 
                  border: "none", 
                  background: GREEN, 
                  color: "#fff", 
                  cursor: submitting ? "not-allowed" : "pointer",
                  fontSize: "0.8125rem",
                  fontWeight: 500,
                  opacity: submitting ? 0.7 : 1,
                  transition: "all 0.2s",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem"
                }}
                onMouseEnter={(e) => { if (!submitting) e.currentTarget.style.background = "#16a34a" }}
                onMouseLeave={(e) => { if (!submitting) e.currentTarget.style.background = GREEN }}
              >
                {submitting && <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />}
                {tx.save}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status Change Modal - Improved Design */}
      {showStatusModal && selectedProperty && (
        <div style={{ 
          position: "fixed", 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          background: "rgba(0,0,0,0.5)", 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "center", 
          zIndex: 1000,
          padding: "1rem"
        }}>
          <div style={{ background: "#fff", borderRadius: "1rem", width: "100%", maxWidth: "400px" }}>
            <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid #e2e8f0", background: "#f8fafc" }}>
              <h2 style={{ fontSize: "1.125rem", fontWeight: 600, color: "#1e293b" }}>{tx.changeStatus}</h2>
            </div>
            <div style={{ padding: "1.5rem" }}>
              <select 
                className={inputClass} 
                value={newStatus} 
                onChange={(e) => setNewStatus(e.target.value)}
                style={{ fontSize: "0.875rem" }}
              >
                <option value="available">{tx.available}</option>
                <option value="occupied">{tx.occupied}</option>
                <option value="maintenance">{tx.maintenance}</option>
                <option value="inactive">{tx.inactive}</option>
              </select>
            </div>
            <div style={{ padding: "1rem 1.5rem", borderTop: "1px solid #e2e8f0", display: "flex", gap: "0.75rem", justifyContent: "flex-end", background: "#fafbfc" }}>
              <button 
                onClick={() => setShowStatusModal(false)} 
                style={{ 
                  padding: "0.5rem 1rem", 
                  borderRadius: "0.5rem", 
                  border: "1px solid #e2e8f0", 
                  background: "#fff", 
                  cursor: "pointer",
                  fontSize: "0.8125rem",
                  color: "#64748b"
                }}
              >
                {tx.cancel}
              </button>
              <button 
                onClick={handleStatusChange} 
                disabled={submitting} 
                style={{ 
                  padding: "0.5rem 1.25rem", 
                  borderRadius: "0.5rem", 
                  border: "none", 
                  background: BLUE, 
                  color: "#fff", 
                  cursor: "pointer",
                  fontSize: "0.8125rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem"
                }}
              >
                {submitting && <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />}
                {tx.save}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal - Improved Design */}
      {showDeleteModal && selectedProperty && (
        <div style={{ 
          position: "fixed", 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          background: "rgba(0,0,0,0.5)", 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "center", 
          zIndex: 1000,
          padding: "1rem"
        }}>
          <div style={{ background: "#fff", borderRadius: "1rem", width: "100%", maxWidth: "400px" }}>
            <div style={{ padding: "1.5rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
                <div style={{ 
                  width: "40px", 
                  height: "40px", 
                  borderRadius: "50%", 
                  background: "#fef2f2", 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "center" 
                }}>
                  <Trash2 size={20} color={RED} />
                </div>
                <h2 style={{ fontSize: "1.125rem", fontWeight: 600, color: "#1e293b", margin: 0 }}>{tx.delete}</h2>
              </div>
              <p style={{ color: "#64748b", fontSize: "0.8125rem", marginBottom: "0.5rem" }}>{tx.confirmDelete}</p>
              <p style={{ marginTop: "0.5rem", fontWeight: 600, fontSize: "0.875rem", color: "#1e293b" }}>"{selectedProperty.name}"</p>
            </div>
            <div style={{ padding: "1rem 1.5rem", borderTop: "1px solid #e2e8f0", display: "flex", gap: "0.75rem", justifyContent: "flex-end", background: "#fafbfc" }}>
              <button 
                onClick={() => setShowDeleteModal(false)} 
                style={{ 
                  padding: "0.5rem 1rem", 
                  borderRadius: "0.5rem", 
                  border: "1px solid #e2e8f0", 
                  background: "#fff", 
                  cursor: "pointer",
                  fontSize: "0.8125rem",
                  color: "#64748b"
                }}
              >
                {tx.cancel}
              </button>
              <button 
                onClick={handleDelete} 
                disabled={submitting} 
                style={{ 
                  padding: "0.5rem 1.25rem", 
                  borderRadius: "0.5rem", 
                  border: "none", 
                  background: RED, 
                  color: "#fff", 
                  cursor: "pointer",
                  fontSize: "0.8125rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem"
                }}
              >
                {submitting && <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />}
                {tx.delete}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Details Modal - Improved Design */}
      {showDetailsModal && selectedProperty && (
        <div style={{ 
          position: "fixed", 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          background: "rgba(0,0,0,0.5)", 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "center", 
          zIndex: 1000,
          padding: "1rem"
        }}>
          <div style={{ 
            background: "#fff", 
            borderRadius: "1rem", 
            width: "100%", 
            maxWidth: "560px", 
            maxHeight: "90vh", 
            overflow: "auto",
            boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)"
          }}>
            <div style={{ 
              padding: "1.25rem 1.5rem", 
              borderBottom: "1px solid #e2e8f0", 
              display: "flex", 
              justifyContent: "space-between", 
              alignItems: "center",
              background: "#f8fafc"
            }}>
              <h2 style={{ fontSize: "1.125rem", fontWeight: 600, color: "#1e293b" }}>{selectedProperty.name}</h2>
              <button 
                onClick={() => setShowDetailsModal(false)} 
                style={{ 
                  background: "none", 
                  border: "none", 
                  cursor: "pointer",
                  padding: "0.25rem",
                  borderRadius: "0.375rem"
                }}
              >
                <X size={20} color="#64748b" />
              </button>
            </div>
            <div style={{ padding: "1.5rem" }}>
              {selectedProperty.images && selectedProperty.images.length > 0 && (
                <div style={{ marginBottom: "1.25rem" }}>
                  <h3 style={{ fontSize: "0.75rem", fontWeight: 600, color: "#64748b", marginBottom: "0.5rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>Images</h3>
                  <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                    {selectedProperty.images.map((img) => (
                      <img 
                        key={img.id} 
                        src={img.image_url} 
                        alt="Property" 
                        style={{ width: "90px", height: "90px", objectFit: "cover", borderRadius: "0.5rem" }} 
                      />
                    ))}
                  </div>
                </div>
              )}
              
              <div style={{ marginBottom: "1rem" }}>
                <h3 style={{ fontSize: "0.75rem", fontWeight: 600, color: "#64748b", marginBottom: "0.25rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>{tx.location}</h3>
                <p style={{ fontSize: "0.875rem", color: "#1e293b" }}>{selectedProperty.location || "No address provided"}</p>
                {selectedProperty.city && <p style={{ fontSize: "0.8125rem", color: "#64748b", marginTop: "0.25rem" }}>{selectedProperty.city}</p>}
              </div>
              
              <div style={{ marginBottom: "1rem" }}>
                <h3 style={{ fontSize: "0.75rem", fontWeight: 600, color: "#64748b", marginBottom: "0.25rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>{tx.owner}</h3>
                <p style={{ fontSize: "0.875rem", color: "#1e293b" }}>{selectedProperty.owner_name || `Owner ${selectedProperty.owner || "Unknown"}`}</p>
              </div>
              
              {selectedProperty.description && (
                <div style={{ marginBottom: "1rem" }}>
                  <h3 style={{ fontSize: "0.75rem", fontWeight: 600, color: "#64748b", marginBottom: "0.25rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>{tx.description}</h3>
                  <p style={{ fontSize: "0.875rem", color: "#64748b", lineHeight: "1.5" }}>{selectedProperty.description}</p>
                </div>
              )}
              
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1rem", padding: "0.75rem", background: "#f8fafc", borderRadius: "0.5rem" }}>
                {selectedProperty.property_type && (
                  <div>
                    <h3 style={{ fontSize: "0.7rem", fontWeight: 600, color: "#64748b", marginBottom: "0.25rem", textTransform: "uppercase" }}>{tx.propertyType}</h3>
                    <p style={{ fontSize: "0.8125rem", color: "#1e293b", textTransform: "capitalize" }}>{selectedProperty.property_type}</p>
                  </div>
                )}
                {selectedProperty.bedrooms !== undefined && selectedProperty.bedrooms > 0 && (
                  <div>
                    <h3 style={{ fontSize: "0.7rem", fontWeight: 600, color: "#64748b", marginBottom: "0.25rem", textTransform: "uppercase" }}>{tx.bedrooms}</h3>
                    <p style={{ fontSize: "0.8125rem", color: "#1e293b" }}>{selectedProperty.bedrooms}</p>
                  </div>
                )}
                {selectedProperty.bathrooms !== undefined && selectedProperty.bathrooms > 0 && (
                  <div>
                    <h3 style={{ fontSize: "0.7rem", fontWeight: 600, color: "#64748b", marginBottom: "0.25rem", textTransform: "uppercase" }}>{tx.bathrooms}</h3>
                    <p style={{ fontSize: "0.8125rem", color: "#1e293b" }}>{selectedProperty.bathrooms}</p>
                  </div>
                )}
                {selectedProperty.area_sqm !== undefined && selectedProperty.area_sqm > 0 && (
                  <div>
                    <h3 style={{ fontSize: "0.7rem", fontWeight: 600, color: "#64748b", marginBottom: "0.25rem", textTransform: "uppercase" }}>{tx.area}</h3>
                    <p style={{ fontSize: "0.8125rem", color: "#1e293b" }}>{selectedProperty.area_sqm} m²</p>
                  </div>
                )}
                {selectedProperty.monthly_rent !== undefined && selectedProperty.monthly_rent > 0 && (
                  <div>
                    <h3 style={{ fontSize: "0.7rem", fontWeight: 600, color: "#64748b", marginBottom: "0.25rem", textTransform: "uppercase" }}>{tx.rent}</h3>
                    <p style={{ fontSize: "0.8125rem", color: GREEN, fontWeight: 600 }}>{selectedProperty.monthly_rent.toLocaleString()} DH</p>
                  </div>
                )}
              </div>
              
              <div style={{ marginTop: "0.75rem" }}>
                <h3 style={{ fontSize: "0.75rem", fontWeight: 600, color: "#64748b", marginBottom: "0.25rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>{tx.status}</h3>
                {getStatusBadge(selectedProperty.status)}
              </div>
            </div>
          </div>
        </div>
      )}
      
      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
}