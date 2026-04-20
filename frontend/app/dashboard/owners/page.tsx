"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Mail, Phone, Building2, MoreVertical, Users, Loader2, X } from "lucide-react";
import api from "@/lib/axios";

interface Owner {
  id: number;
  full_name: string;
  email: string;
  phone: string;
  address: string;
  created_at: string;
}

const emptyForm = {
  full_name: "",
  email: "",
  phone: "",
};

export default function OwnersPage() {
  const router = useRouter();
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
    fetchOwners();
  }, []);

  const fetchOwners = async () => {
    try {
      const res = await api.get("/api/owners/");
      const data = Array.isArray(res.data) ? res.data : res.data.results ?? [];
      setOwners(data);
    } catch (err) {
      console.error("Error fetching owners:", err);
    } finally {
      setLoading(false);
    }
  };

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
      await api.post("/api/owners/", {
        first_name,
        last_name,
        email: form.email,
        phone: form.phone,
        address: "",
      });
      setShowModal(false);
      setForm(emptyForm);
      fetchOwners();
    } catch (err) {
      setFormError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
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

  return (
    <div className="p-8 bg-[#f9fafb] min-h-screen">

      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Property Owners</h1>
          <p className="text-gray-500">Manage property owner information and contacts</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
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
          <p className="text-3xl font-bold text-gray-900">{owners.length}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <p className="text-sm text-gray-500 font-medium mb-2">Total Properties Managed</p>
          <p className="text-3xl font-bold text-gray-900">—</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <p className="text-sm text-gray-500 font-medium mb-2">Total Payouts (YTD)</p>
          <p className="text-3xl font-bold text-[#581c87]">— MAD</p>
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
                      <span>— properties</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-bold text-[#581c87]">— MAD</td>
                  <td className="px-6 py-4">
                    <button className="text-gray-400 hover:text-gray-600">
                      <MoreVertical size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg">
            <div className="p-8">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Add New Owner</h2>
                  <p className="text-sm text-gray-400 mt-1">Enter the details of the new property owner</p>
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
                  <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Full Name</label>
                  <input
                    className={inputClass}
                    placeholder="Youssef Benali"
                    value={form.full_name}
                    onChange={e => setForm({ ...form, full_name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Email Address</label>
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
                  {submitting ? <Loader2 className="animate-spin" size={18} /> : "Add Owner"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}