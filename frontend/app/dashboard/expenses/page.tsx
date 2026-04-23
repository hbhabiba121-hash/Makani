"use client";

import { useEffect, useState } from "react";
import { Plus, X, Upload, ChevronDown, Loader2, FileText, MoreVertical } from "lucide-react";
import api from "@/lib/axios"; 

interface Property {
  id: number;
  name: string;
}

interface Expense {
  id: number;
  property_name: string;
  category: string;
  description: string;
  date: string;
  amount: string;
  has_receipt: boolean;
}

export default function ExpensesPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [properties, setProperties] = useState<Property[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loadingProps, setLoadingProps] = useState(true);
  const [loadingExpenses, setLoadingExpenses] = useState(false); 

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      const res = await api.get("/api/properties/");
      const data = Array.isArray(res.data) ? res.data : res.data.results ?? [];
      setProperties(data);
    } catch (err) {
      console.error("Error fetching properties:", err);
    } finally {
      setLoadingProps(false);
    }
  };

  return (
    <div className="p-8 bg-[#f8fafc] min-h-screen relative">
      
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#1e293b]">Expense Management</h1>
          <p className="text-slate-500 mt-1 text-[15px]">Track and manage all property expenses</p>
        </div>

        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-[#5a1b8d] hover:bg-[#4a1675] text-white px-5 py-2.5 rounded-xl transition-all font-semibold shadow-sm"
        >
          <Plus size={20} strokeWidth={2.5} />
          <span className="text-[15px] tracking-wide">Add Expense</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatCard title="Total Expenses" value="$2,315" valueColor="text-red-600" />
        <StatCard title="Top Category" value="Maintenance" />
        <StatCard title="Total Records" value="7" />
        <StatCard title="With Receipts" value="5" valueColor="text-green-600" />
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm mb-8">
        <h2 className="text-lg font-bold text-slate-800 mb-6">Expense Breakdown by Category</h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <BreakdownCard label="Cleaning" amount="$650" bgColor="bg-blue-50" textColor="text-blue-600" />
          <BreakdownCard label="WiFi" amount="$120" bgColor="bg-purple-50" textColor="text-purple-600" />
          <BreakdownCard label="Electricity" amount="$280" bgColor="bg-yellow-50" textColor="text-yellow-600" />
          <BreakdownCard label="Maintenance" amount="$1,170" bgColor="bg-red-50" textColor="text-red-600" />
          <BreakdownCard label="Supplies" amount="$95" bgColor="bg-green-50" textColor="text-green-600" />
        </div>
      </div>

      <div className="flex gap-4 mb-6">
        <FilterSelect label="All Properties" options={properties} loading={loadingProps} />
        <FilterSelect label="All Categories" options={["Cleaning", "WiFi", "Electricity", "Maintenance", "Supplies"]} />
      </div>

      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-50">
          <h3 className="font-bold text-slate-800 text-lg">All Expenses</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50/50">
              <tr>
                <th className="px-6 py-4 text-[13px] font-semibold text-slate-500 uppercase tracking-wider">Property</th>
                <th className="px-6 py-4 text-[13px] font-semibold text-slate-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-4 text-[13px] font-semibold text-slate-500 uppercase tracking-wider">Description</th>
                <th className="px-6 py-4 text-[13px] font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-[13px] font-semibold text-slate-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-4 text-[13px] font-semibold text-slate-500 uppercase tracking-wider">Receipt</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loadingExpenses ? (
                <tr>
                  <td colSpan={7} className="py-20 text-center">
                    <Loader2 className="animate-spin mx-auto text-[#5a1b8d]" size={32} />
                    <p className="text-slate-400 mt-2">Loading expenses...</p>
                  </td>
                </tr>
              ) : expenses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-20 text-center text-slate-400 italic">
                    No records found.
                  </td>
                </tr>
              ) : (
                expenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-700">{exp.property_name}</td>
                    <td className="px-6 py-4">
                      <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg text-xs font-semibold">
                        {exp.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500 max-w-xs truncate">{exp.description}</td>
                    <td className="px-6 py-4 text-slate-500">{exp.date}</td>
                    <td className="px-6 py-4 font-bold text-red-500">${exp.amount}</td>
                    <td className="px-6 py-4">
                      {exp.has_receipt ? (
                        <span className="flex items-center gap-1 text-green-600 bg-green-50 w-fit px-2 py-1 rounded text-xs font-bold">
                          <FileText size={14} /> YES
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs font-bold px-2 py-1 bg-slate-50 rounded">NO</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors">
                        <MoreVertical size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 flex justify-between items-start">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Add New Expense</h2>
                <p className="text-slate-500 text-sm">Record a new expense</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>

            <div className="px-6 pb-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Property</label>
                <select className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-slate-600 outline-none focus:border-[#5a1b8d]">
                  <option value="">Select property</option>
                  {properties.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Amount ($)</label>
                  <input type="number" placeholder="0.00" className="w-full border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-[#5a1b8d]" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Date</label>
                  <input type="date" className="w-full border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-[#5a1b8d]" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Category</label>
                <select className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-slate-600 outline-none focus:border-[#5a1b8d]">
                  <option>Select category</option>
                  <option>Cleaning</option>
                  <option>WiFi</option>
                  <option>Electricity</option>
                  <option>Maintenance</option>
                  <option>Supplies</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Description</label>
                <textarea placeholder="Describe the expense..." rows={3} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-[#5a1b8d] resize-none"></textarea>
              </div>

              <div className="flex gap-3 mt-6">
                <button onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-3 rounded-xl border border-slate-200 font-semibold text-slate-700 hover:bg-slate-50 transition-all">
                  Cancel
                </button>
                <button className="flex-1 px-4 py-3 rounded-xl bg-[#5a1b8d] text-white font-semibold hover:bg-[#4a1675] transition-all">
                  Add Expense
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value, valueColor = "text-slate-900" }: { title: string; value: string; valueColor?: string }) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
      <p className="text-slate-500 text-sm font-medium mb-4">{title}</p>
      <h3 className={`text-2xl font-bold ${valueColor}`}>{value}</h3>
    </div>
  );
}

function BreakdownCard({ label, amount, bgColor, textColor }: { label: string; amount: string; bgColor: string; textColor: string }) {
  return (
    <div className="border border-slate-100 rounded-xl p-5 hover:shadow-md transition-shadow">
      <span className={`${bgColor} ${textColor} px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider`}>
        {label}
      </span>
      <h4 className="text-2xl font-bold text-slate-800 mt-4">{amount}</h4>
    </div>
  );
}

function FilterSelect({ label, options, loading = false }: { label: string; options: any[]; loading?: boolean }) {
  return (
    <div className="relative min-w-[200px]">
      <select className="appearance-none w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-slate-700 font-medium outline-none focus:ring-2 focus:ring-[#5a1b8d]/10 transition-all cursor-pointer">
        <option value="">{label}</option>
        {loading ? (
          <option>Loading...</option>
        ) : (
          options.map((opt, i) => (
            <option key={i} value={typeof opt === 'string' ? opt : opt.id}>
              {typeof opt === 'string' ? opt : opt.name}
            </option>
          ))
        )}
      </select>
      <ChevronDown size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
    </div>
  );
}