"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, MapPin, Bed, Bath, MoreVertical, Home, X, Loader2 } from "lucide-react";
import api from "@/lib/axios";

interface Property {
  id: number;
  name: string;
  location: string;
  property_type: string;
  property_type_display: string;
  status: string;
  status_display: string;
  bedrooms: number;
  bathrooms: number;
  monthly_rent: string;
  owner_name: string;
}

interface Owner {
  id: number;
  full_name: string;
}

const emptyForm = {
  name: "",
  location: "",
  property_type: "",
  bedrooms: "",
  bathrooms: "",
  area_sqm: "",
  monthly_rent: "",
  owner: "",
  description: "",
};

export default function PropertiesPage() {
  const router = useRouter();
  const [properties, setProperties] = useState<Property[]>([]);
  const [owners, setOwners] = useState<Owner[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("access");
    if (!token) router.push("/login");
  }, []);

  useEffect(() => {
    fetchProperties();
    fetchOwners();
  }, []);

  const fetchProperties = async () => {
    try {
      const res = await api.get("/api/properties/");
      const data = Array.isArray(res.data) ? res.data : res.data.results ?? [];
      setProperties(data);
    } catch (err) {
      console.error("Error fetching properties:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchOwners = async () => {
    try {
      const res = await api.get("/api/owners/");
      const data = Array.isArray(res.data) ? res.data : res.data.results ?? [];
      setOwners(data);
    } catch (err) {
      console.error("Error fetching owners:", err);
    }
  };

  const handleSubmit = async () => {
    setFormError("");
    if (!form.name || !form.location || !form.property_type || !form.owner) {
      setFormError("Please fill all required fields.");
      return;
    }
    setSubmitting(true);
    try {
      await api.post("/api/properties/", {
        name: form.name,
        location: form.location,
        property_type: form.property_type,
        bedrooms: Number(form.bedrooms) || 1,
        bathrooms: Number(form.bathrooms) || 1,
        area_sqm: Number(form.area_sqm) || 0,
        monthly_rent: Number(form.monthly_rent) || 0,
        owner: Number(form.owner),
        description: form.description,
      });
      setShowModal(false);
      setForm(emptyForm);
      fetchProperties(); 
    } catch (err) {
      setFormError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const totalProperties = properties.length;
  const activeProperties = properties.filter(p => p.status === "available" || p.status === "rented").length;
  const maintenanceProperties = properties.filter(p => p.status === "maintenance").length;
  const totalRevenue = properties.reduce((sum, p) => sum + Number(p.monthly_rent), 0);

  const statusStyle = (status: string) => {
    switch (status) {
      case "available": return "bg-green-500";
      case "rented": return "bg-orange-500";
      case "maintenance": return "bg-red-500";
      default: return "bg-gray-400";
    }
  };

  const placeholderColor = (type: string) => {
    switch (type) {
      case "villa": return "bg-purple-100";
      case "apartment": return "bg-blue-100";
      case "studio": return "bg-green-100";
      case "riad": return "bg-orange-100";
      default: return "bg-gray-100";
    }
  };

  const stats = [
    { label: "Total Properties", value: totalProperties, color: "text-gray-900" },
    { label: "Active", value: activeProperties, color: "text-green-600" },
    { label: "Maintenance", value: maintenanceProperties, color: "text-red-500" },
    { label: "Total Revenue", value: `${totalRevenue.toLocaleString()} MAD`, color: "text-[#581c87]" },
  ];

  const inputClass = "w-full p-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#581c87]/20 focus:border-[#581c87] text-gray-900 bg-gray-50 focus:bg-white transition-all text-sm";

  return (
    <div className="p-8 bg-[#f9fafb] min-h-screen">

      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Properties</h1>
          <p className="text-gray-500">Manage all your rental properties</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-[#581c87] text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-[#4c1d95] transition-all shadow-lg shadow-[#581c87]/20"
        >
          <Plus size={18} />
          Add Property
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((s, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <p className="text-sm text-gray-500 font-medium mb-2">{s.label}</p>
            <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-pulse">
              <div className="h-48 bg-gray-100" />
              <div className="p-5 space-y-3">
                <div className="h-4 bg-gray-100 rounded w-3/4" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : properties.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <Home size={48} className="mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium">No properties found</p>
          <p className="text-sm">Add your first property to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map((p) => (
            <div key={p.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
              <div className={`h-48 ${placeholderColor(p.property_type)} flex items-center justify-center relative`}>
                <Home size={48} className="text-gray-300" />
                <span className={`absolute top-3 right-3 text-white text-xs font-bold px-3 py-1 rounded-full ${statusStyle(p.status)}`}>
                  {p.status_display}
                </span>
              </div>
              <div className="p-5">
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-bold text-gray-900 text-lg">{p.name}</h3>
                  <button className="text-gray-400 hover:text-gray-600"><MoreVertical size={18} /></button>
                </div>
                <div className="flex items-center gap-1 text-gray-400 text-sm mb-3">
                  <MapPin size={13} /><span>{p.location}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-gray-500 text-sm">
                    <span className="flex items-center gap-1"><Bed size={14} /> {p.bedrooms} bed</span>
                    <span className="flex items-center gap-1"><Bath size={14} /> {p.bathrooms} bath</span>
                  </div>
                  <span className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded-lg">{p.property_type_display}</span>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-50 flex justify-between items-center">
                  <div>
                    <p className="text-xs text-gray-400">Monthly Rent</p>
                    <p className="font-bold text-[#581c87]">{Number(p.monthly_rent).toLocaleString()} MAD</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400">Owner</p>
                    <p className="text-sm font-semibold text-gray-700">{p.owner_name}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-8">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Add New Property</h2>
                  <p className="text-sm text-gray-400 mt-1">Enter the details of the new property</p>
                </div>
                <button onClick={() => { setShowModal(false); setForm(emptyForm); setFormError(""); }} className="text-gray-400 hover:text-gray-600">
                  <X size={22} />
                </button>
              </div>

              {formError && (
                <div className="bg-red-50 text-red-600 text-sm p-3 rounded-xl mb-4 border border-red-100">
                  {formError}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Property Name *</label>
                  <input className={inputClass} placeholder="Riad Palais Medina" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Location *</label>
                  <input className={inputClass} placeholder="Marrakech, Morocco" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} />
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Property Type *</label>
                  <select className={inputClass} value={form.property_type} onChange={e => setForm({ ...form, property_type: e.target.value })}>
                    <option value="">Select type</option>
                    <option value="apartment">Apartment</option>
                    <option value="villa">Villa</option>
                    <option value="studio">Studio</option>
                    <option value="house">House</option>
                    <option value="commercial">Commercial</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Bedrooms</label>
                    <input type="number" className={inputClass} placeholder="3" value={form.bedrooms} onChange={e => setForm({ ...form, bedrooms: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Bathrooms</label>
                    <input type="number" className={inputClass} placeholder="2" value={form.bathrooms} onChange={e => setForm({ ...form, bathrooms: e.target.value })} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Area (m²)</label>
                    <input type="number" className={inputClass} placeholder="75" value={form.area_sqm} onChange={e => setForm({ ...form, area_sqm: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Monthly Rent (MAD)</label>
                    <input type="number" className={inputClass} placeholder="5000" value={form.monthly_rent} onChange={e => setForm({ ...form, monthly_rent: e.target.value })} />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Owner *</label>
                  <select className={inputClass} value={form.owner} onChange={e => setForm({ ...form, owner: e.target.value })}>
                    <option value="">Select owner</option>
                    {owners.map(o => (
                      <option key={o.id} value={o.id}>{o.full_name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Description</label>
                  <textarea className={inputClass} rows={3} placeholder="Brief description..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => { setShowModal(false); setForm(emptyForm); setFormError(""); }}
                  className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="flex-1 py-3 rounded-xl bg-[#581c87] text-white font-semibold hover:bg-[#4c1d95] transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#581c87]/20"
                >
                  {submitting ? <Loader2 className="animate-spin" size={18} /> : "Add Property"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}