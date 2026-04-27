"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Mail, MoreVertical, Users, Loader2, X, Edit, Trash2, Eye, Copy, Briefcase } from "lucide-react";
import api from "@/lib/axios";

interface Staff {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  created_at: string;
}

const emptyForm = {
  first_name: "",
  last_name: "",
  email: "",
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
  const [showMenu, setShowMenu] = useState<number | null>(null);

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
    const load = async () => {
      await fetchStaff();
    };
    load();
  }, []);

  const handleSubmit = async () => {
    setFormError("");
    if (!form.first_name || !form.last_name || !form.email) {
      setFormError("Please fill all required fields.");
      return;
    }

    setSubmitting(true);
    try {
      if (selectedStaff) {
        // UPDATE
        await api.patch(`/api/users/staff/${selectedStaff.id}/`, {
          first_name: form.first_name,
          last_name: form.last_name,
          email: form.email,
        });
      } else {
        // CREATE
        const response = await api.post("/api/users/staff/create/", {
          first_name: form.first_name,
          last_name: form.last_name,
          email: form.email,
        });
        
        // Show password modal only for new staff
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
      fetchStaff();
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
        setFormError("Something went wrong. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedStaff) return;
    setSubmitting(true);
    try {
      await api.delete(`/api/users/staff/${selectedStaff.id}/delete/`);
      setShowDeleteModal(false);
      setSelectedStaff(null);
      fetchStaff();
    } catch (err) {
      console.error("Delete error:", err);
      setFormError("Failed to delete staff member. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (staffMember: Staff) => {
    setSelectedStaff(staffMember);
    setForm({
      first_name: staffMember.first_name,
      last_name: staffMember.last_name,
      email: staffMember.email,
    });
    setShowModal(true);
    setShowMenu(null);
  };

  const handleViewDetails = (staffMember: Staff) => {
    setSelectedStaff(staffMember);
    setShowDetailsModal(true);
    setShowMenu(null);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Password copied to clipboard!");
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  };

  const avatarColors = [
    "bg-purple-100 text-purple-700",
    "bg-blue-100 text-blue-700",
    "bg-green-100 text-green-700",
    "bg-orange-100 text-orange-700",
    "bg-pink-100 text-pink-700",
  ];

  const inputClass = "w-full p-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#581c87]/20 focus:border-[#581c87] text-gray-900 bg-gray-50 focus:bg-white transition-all text-sm";

  const totalStaff = staff.length;

  return (
    <div className="p-8 bg-[#f9fafb] min-h-screen">

      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Staff Management</h1>
          <p className="text-gray-500">Manage your agency staff members and their permissions</p>
        </div>
        <button
          onClick={() => { setSelectedStaff(null); setForm(emptyForm); setShowModal(true); }}
          className="flex items-center gap-2 bg-[#581c87] text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-[#4c1d95] transition-all shadow-lg shadow-[#581c87]/20"
        >
          <Plus size={18} />
          Add Staff
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <p className="text-sm text-gray-500 font-medium mb-2">Total Staff</p>
          <p className="text-3xl font-bold text-gray-900">{totalStaff}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <p className="text-sm text-gray-500 font-medium mb-2">Active Staff</p>
          <p className="text-3xl font-bold text-gray-900">{totalStaff}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <p className="text-sm text-gray-500 font-medium mb-2">Roles</p>
          <p className="text-3xl font-bold text-[#581c87]">Staff</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-50">
          <h2 className="font-bold text-gray-900 text-lg">All Staff Members</h2>
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
        ) : staff.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <Users size={48} className="mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium">No staff members found</p>
            <p className="text-sm">Add your first staff member to get started</p>
          </div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-400 text-[12px] uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 font-semibold">Staff Member</th>
                <th className="px-6 py-4 font-semibold">Contact</th>
                <th className="px-6 py-4 font-semibold">Role</th>
                <th className="px-6 py-4 font-semibold">Joined</th>
                <th className="px-6 py-4 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {staff.map((member, i) => (
                <tr key={member.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold ${avatarColors[i % avatarColors.length]}`}>
                        {getInitials(member.first_name, member.last_name)}
                      </div>
                      <span className="font-semibold text-gray-900">{member.first_name} {member.last_name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <span className="flex items-center gap-1.5 text-sm text-gray-500">
                        <Mail size={13} /> {member.email}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-sm text-gray-500">
                      <Briefcase size={14} />
                      <span className="capitalize">{member.role || "Staff"}</span>
                    </div>
                   </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(member.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 relative">
                    <button 
                      onClick={() => setShowMenu(showMenu === member.id ? null : member.id)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <MoreVertical size={18} />
                    </button>
                    {showMenu === member.id && (
                      <div className="absolute right-0 mt-2 w-36 bg-white rounded-xl shadow-lg border border-gray-100 z-10">
                        <button
                          onClick={() => handleViewDetails(member)}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-t-xl flex items-center gap-2"
                        >
                          <Eye size={14} /> View Details
                        </button>
                        <button
                          onClick={() => handleEdit(member)}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                        >
                          <Edit size={14} /> Edit
                        </button>
                        <button
                          onClick={() => { setSelectedStaff(member); setShowDeleteModal(true); setShowMenu(null); }}
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
                <h2 className="text-2xl font-bold text-gray-900">Staff Created Successfully!</h2>
                <p className="text-gray-500 mt-2">Here are the login credentials</p>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 mb-6">
                <div className="mb-3">
                  <label className="text-xs text-gray-500 font-medium">Name</label>
                  <p className="text-gray-900 font-semibold">{newStaffName}</p>
                </div>
                <div className="mb-3">
                  <label className="text-xs text-gray-500 font-medium">Email</label>
                  <p className="text-gray-900 font-semibold">{newStaffEmail}</p>
                </div>
                <div>
                  <label className="text-xs text-gray-500 font-medium">Temporary Password</label>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="flex-1 bg-white px-3 py-2 rounded-lg text-sm font-mono text-[#581c87] border border-gray-200">
                      {newStaffPassword}
                    </code>
                    <button
                      onClick={() => copyToClipboard(newStaffPassword)}
                      className="p-2 bg-[#581c87] text-white rounded-lg hover:bg-[#4c1d95] transition-all"
                    >
                      <Copy size={18} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
                <p className="text-sm text-yellow-800">
                  ⚠️ Please share these credentials with the staff member. They can change their password after first login.
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
                  <h2 className="text-xl font-bold text-gray-900">{selectedStaff ? "Edit Staff" : "Add New Staff"}</h2>
                  <p className="text-sm text-gray-400 mt-1">{selectedStaff ? "Update staff information" : "Enter the details of the new staff member"}</p>
                </div>
                <button onClick={() => { setShowModal(false); setForm(emptyForm); setSelectedStaff(null); setFormError(""); }} className="text-gray-400 hover:text-gray-600">
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
                  <label className="text-sm font-semibold text-gray-700 mb-1.5 block">First Name *</label>
                  <input
                    className={inputClass}
                    placeholder="Ahmed"
                    value={form.first_name}
                    onChange={e => setForm({ ...form, first_name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Last Name *</label>
                  <input
                    className={inputClass}
                    placeholder="Benali"
                    value={form.last_name}
                    onChange={e => setForm({ ...form, last_name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Email Address *</label>
                  <input
                    type="email"
                    className={inputClass}
                    placeholder="ahmed.benali@email.ma"
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => { setShowModal(false); setForm(emptyForm); setSelectedStaff(null); setFormError(""); }}
                  className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="flex-1 py-3 rounded-xl bg-[#581c87] text-white font-semibold hover:bg-[#4c1d95] transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#581c87]/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? <Loader2 className="animate-spin" size={18} /> : (selectedStaff ? "Update Staff" : "Add Staff")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedStaff && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md">
            <div className="p-8">
              <h2 className="text-xl font-bold text-gray-900 mb-2">Delete Staff Member</h2>
              <p className="text-gray-500 mb-6">
                Are you sure you want to delete &quot;{selectedStaff.first_name} {selectedStaff.last_name}&quot;? This action cannot be undone.
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
                  disabled={submitting}
                  className="flex-1 py-3 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? <Loader2 className="animate-spin" size={18} /> : "Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Staff Details Modal */}
      {showDetailsModal && selectedStaff && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md">
            <div className="p-8">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-xl font-bold text-gray-900">Staff Details</h2>
                <button onClick={() => setShowDetailsModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={22} />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center gap-4 pb-4 border-b border-gray-100">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold ${avatarColors[0]}`}>
                    {getInitials(selectedStaff.first_name, selectedStaff.last_name)}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">{selectedStaff.first_name} {selectedStaff.last_name}</h3>
                    <p className="text-sm text-gray-500">Staff Member</p>
                  </div>
                </div>
                
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Contact Information</p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Mail size={16} className="text-gray-400" />
                      <span className="text-gray-700">{selectedStaff.email}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Role</p>
                  <div className="flex items-center gap-2 text-sm">
                    <Briefcase size={16} className="text-gray-400" />
                    <span className="text-gray-700 capitalize">{selectedStaff.role || "Staff"}</span>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-gray-100">
                  <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Joined</p>
                  <p className="text-sm text-gray-700">{new Date(selectedStaff.created_at).toLocaleDateString()}</p>
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