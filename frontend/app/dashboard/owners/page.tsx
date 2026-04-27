"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Mail, Phone, Building2, MoreVertical, Users, Loader2, X, Edit, Trash2, Eye, Copy } from "lucide-react";
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

  useEffect(() => {
    const token = localStorage.getItem("access");
    if (!token) router.push("/login");
  }, [router]);

  const fetchOwners = async () => {
    try {
      setLoading(true);
      // Fetch all owners first
      const ownersRes = await api.get("/api/owners/");
      const ownersData = Array.isArray(ownersRes.data) ? ownersRes.data : ownersRes.data.results ?? [];
      
      if (ownersData.length === 0) {
        setOwners([]);
        setLoading(false);
        return;
      }

      // Fetch ALL properties in one request (or paginated if needed)
      let allProperties: Property[] = [];
      try {
        const propertiesRes = await api.get("/api/properties/");
        allProperties = Array.isArray(propertiesRes.data) 
          ? propertiesRes.data 
          : propertiesRes.data.results ?? [];
      } catch (propError) {
        console.error("Error fetching properties:", propError);
        // If properties fetch fails, still show owners without stats
        setOwners(ownersData.map((owner: Owner) => ({
          ...owner,
          properties_count: 0,
          total_earnings: 0
        })));
        setLoading(false);
        return;
      }

      // Calculate stats for each owner by filtering properties
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
      // Show error to user
      setOwners([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
  const load = async () => {
    await fetchOwners();
  };

  load();
}, []);

  const handleSubmit = async () => {
    setFormError("");
    if (!form.full_name || !form.email) {
      setFormError("Please fill all required fields.");
      return;
    }
    const parts = form.full_name.trim().split(" ");
    const first_name = parts[0];
    const last_name = parts.slice(1).join(" ") || parts[0];

    setSubmitting(true);
    try {
      if (selectedOwner) {
        // UPDATE - Use PUT request
        await api.put(`/api/owners/${selectedOwner.id}/`, {
          first_name,
          last_name,
          email: form.email,
          phone: form.phone,
          address: form.address,
        });
      } else {
        // CREATE - Use POST request
        const response = await api.post("/api/owners/", {
          first_name,
          last_name,
          email: form.email,
          phone: form.phone,
          address: form.address,
        });
        
        // Show password modal only for new owners
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
        setFormError("Something went wrong. Please try again.");
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
      alert("Failed to delete owner. Make sure they have no properties assigned.");
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
    alert("Password copied to clipboard!");
  };

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 3);
  };

  const avatarColors = [
    "bg-purple-100 text-purple-700",
    "bg-blue-100 text-blue-700",
    "bg-green-100 text-green-700",
    "bg-orange-100 text-orange-700",
    "bg-pink-100 text-pink-700",
  ];

  const inputClass = "w-full p-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#581c87]/20 focus:border-[#581c87] text-gray-900 bg-gray-50 focus:bg-white transition-all text-sm";

  const totalOwners = owners.length;
  const totalPropertiesManaged = owners.reduce((sum, o) => sum + (o.properties_count || 0), 0);
  const totalPayouts = owners.reduce((sum, o) => sum + (o.total_earnings || 0), 0);

  return (
    <div className="p-8 bg-[#f9fafb] min-h-screen">

      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Property Owners</h1>
          <p className="text-gray-500">Manage property owner information and contacts</p>
        </div>
        <button
          onClick={() => { setSelectedOwner(null); setForm(emptyForm); setShowModal(true); }}
          className="flex items-center gap-2 bg-[#581c87] text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-[#4c1d95] transition-all shadow-lg shadow-[#581c87]/20"
        >
          <Plus size={18} />
          Add Owner
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <p className="text-sm text-gray-500 font-medium mb-2">Total Owners</p>
          <p className="text-3xl font-bold text-gray-900">{totalOwners}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <p className="text-sm text-gray-500 font-medium mb-2">Total Properties Managed</p>
          <p className="text-3xl font-bold text-gray-900">{totalPropertiesManaged}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <p className="text-sm text-gray-500 font-medium mb-2">Total Payouts (YTD)</p>
          <p className="text-3xl font-bold text-[#581c87]">{totalPayouts.toLocaleString()} MAD</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-50">
          <h2 className="font-bold text-gray-900 text-lg">All Owners</h2>
        </div>

        {loading ? (
          <div className="divide-y divide-gray-50">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="px-6 py-4 flex items-center gap-4 animate-pulse">
                <div className="w-10 h-10 rounded-full bg-gray-100" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-100 rounded w-40" />
                  <div className="h-3 bg-gray-100 rounded w-56" />
                </div>
              </div>
            ))}
          </div>
        ) : owners.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <Users size={48} className="mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium">No owners found</p>
            <p className="text-sm">Add your first owner to get started</p>
          </div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-400 text-[12px] uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 font-semibold">Owner</th>
                <th className="px-6 py-4 font-semibold">Contact</th>
                <th className="px-6 py-4 font-semibold">Properties</th>
                <th className="px-6 py-4 font-semibold">Total Earnings</th>
                <th className="px-6 py-4 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {owners.map((owner, i) => (
                <tr key={owner.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold ${avatarColors[i % avatarColors.length]}`}>
                        {getInitials(owner.full_name)}
                      </div>
                      <span className="font-semibold text-gray-900">{owner.full_name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <span className="flex items-center gap-1.5 text-sm text-gray-500">
                        <Mail size={13} /> {owner.email}
                      </span>
                      <span className="flex items-center gap-1.5 text-sm text-gray-500">
                        <Phone size={13} /> {owner.phone || "—"}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-sm text-gray-500">
                      <Building2 size={14} />
                      <span>{owner.properties_count || 0} properties</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-bold text-[#581c87]">
                    {(owner.total_earnings || 0).toLocaleString()} MAD
                  </td>
                  <td className="px-6 py-4 relative">
                    <button 
                      onClick={() => setShowMenu(showMenu === owner.id ? null : owner.id)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <MoreVertical size={18} />
                    </button>
                    {showMenu === owner.id && (
                      <div className="absolute right-0 mt-2 w-36 bg-white rounded-xl shadow-lg border border-gray-100 z-10">
                        <button
                          onClick={() => handleViewDetails(owner)}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-t-xl flex items-center gap-2"
                        >
                          <Eye size={14} /> View Details
                        </button>
                        <button
                          onClick={() => handleEdit(owner)}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                        >
                          <Edit size={14} /> Edit
                        </button>
                        <button
                          onClick={() => { setSelectedOwner(owner); setShowDeleteModal(true); setShowMenu(null); }}
                          className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-b-xl flex items-center gap-2"
                        >
                          <Trash2 size={14} /> Delete
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Password Display Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md transform transition-all">
            <div className="p-8">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Owner Created Successfully!</h2>
                <p className="text-gray-500 mt-2">Here are the login credentials</p>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 mb-6">
                <div className="mb-3">
                  <label className="text-xs text-gray-500 font-medium">Name</label>
                  <p className="text-gray-900 font-semibold">{newOwnerName}</p>
                </div>
                <div className="mb-3">
                  <label className="text-xs text-gray-500 font-medium">Email</label>
                  <p className="text-gray-900 font-semibold">{newOwnerEmail}</p>
                </div>
                <div>
                  <label className="text-xs text-gray-500 font-medium">Temporary Password</label>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="flex-1 bg-white px-3 py-2 rounded-lg text-sm font-mono text-[#581c87] border border-gray-200">
                      {newOwnerPassword}
                    </code>
                    <button
                      onClick={() => copyToClipboard(newOwnerPassword)}
                      className="p-2 bg-[#581c87] text-white rounded-lg hover:bg-[#4c1d95] transition-all"
                    >
                      <Copy size={18} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
                <p className="text-sm text-yellow-800">
                  ⚠️ Please share these credentials with the owner. They can change their password after first login.
                </p>
              </div>

              <button
                onClick={() => setShowPasswordModal(false)}
                className="w-full py-3 rounded-xl bg-[#581c87] text-white font-semibold hover:bg-[#4c1d95] transition-all"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg">
            <div className="p-8">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{selectedOwner ? "Edit Owner" : "Add New Owner"}</h2>
                  <p className="text-sm text-gray-400 mt-1">{selectedOwner ? "Update owner information" : "Enter the details of the new property owner"}</p>
                </div>
                <button onClick={() => { setShowModal(false); setForm(emptyForm); setSelectedOwner(null); setFormError(""); }} className="text-gray-400 hover:text-gray-600">
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
                  <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Full Name *</label>
                  <input
                    className={inputClass}
                    placeholder="Youssef Benali"
                    value={form.full_name}
                    onChange={e => setForm({ ...form, full_name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Email Address *</label>
                  <input
                    type="email"
                    className={inputClass}
                    placeholder="youssef.benali@email.ma"
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Phone Number</label>
                  <input
                    className={inputClass}
                    placeholder="+212 6 12 34 56 78"
                    value={form.phone}
                    onChange={e => setForm({ ...form, phone: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Address</label>
                  <input
                    className={inputClass}
                    placeholder="Casablanca, Morocco"
                    value={form.address}
                    onChange={e => setForm({ ...form, address: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => { setShowModal(false); setForm(emptyForm); setSelectedOwner(null); setFormError(""); }}
                  className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="flex-1 py-3 rounded-xl bg-[#581c87] text-white font-semibold hover:bg-[#4c1d95] transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#581c87]/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? <Loader2 className="animate-spin" size={18} /> : (selectedOwner ? "Update Owner" : "Add Owner")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedOwner && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md">
            <div className="p-8">
              <h2 className="text-xl font-bold text-gray-900 mb-2">Delete Owner</h2>
              <p className="text-gray-500 mb-6">
                Are you sure you want to delete &quot;{selectedOwner.full_name}&quot;? This action cannot be undone.
                {selectedOwner.properties_count && selectedOwner.properties_count > 0 && (
                  <span className="block mt-2 text-red-500">
                    Warning: This owner has {selectedOwner.properties_count} properties. Please reassign or delete them first.
                  </span>
                )}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={submitting || (selectedOwner.properties_count !== undefined && selectedOwner.properties_count > 0)}
                  className="flex-1 py-3 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? <Loader2 className="animate-spin" size={18} /> : "Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Owner Details Modal */}
      {showDetailsModal && selectedOwner && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md">
            <div className="p-8">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-xl font-bold text-gray-900">Owner Details</h2>
                <button onClick={() => setShowDetailsModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={22} />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center gap-4 pb-4 border-b border-gray-100">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold ${avatarColors[0]}`}>
                    {getInitials(selectedOwner.full_name)}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">{selectedOwner.full_name}</h3>
                    <p className="text-sm text-gray-500">Owner since {new Date(selectedOwner.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Contact Information</p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Mail size={16} className="text-gray-400" />
                      <span className="text-gray-700">{selectedOwner.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Phone size={16} className="text-gray-400" />
                      <span className="text-gray-700">{selectedOwner.phone || "Not provided"}</span>
                    </div>
                  </div>
                </div>
                
                {selectedOwner.address && (
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Address</p>
                    <p className="text-sm text-gray-700">{selectedOwner.address}</p>
                  </div>
                )}
                
                <div className="pt-4 border-t border-gray-100">
                  <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Statistics</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-2xl font-bold text-gray-900">{selectedOwner.properties_count || 0}</p>
                      <p className="text-xs text-gray-500">Properties</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-[#581c87]">{(selectedOwner.total_earnings || 0).toLocaleString()} MAD</p>
                      <p className="text-xs text-gray-500">Total Earnings</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="flex-1 py-3 rounded-xl bg-[#581c87] text-white font-semibold hover:bg-[#4c1d95] transition-all"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}