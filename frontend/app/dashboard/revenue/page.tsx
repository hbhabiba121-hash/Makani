"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, ArrowUpRight, TrendingUp, Calendar } from 'lucide-react';
import { financialService } from '@/lib/financialService'; // T-akdi blli had l-service kheddam

export default function RevenuePage() {
  const [revenueData, setRevenueData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch data mn l-backend
    financialService.getRevenueStats()
      .then(data => {
        setRevenueData(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-10 text-purple-500 font-mono animate-pulse">Loading Financial Data...</div>;

  return (
    <div className="p-8 bg-white min-h-screen">
      {/* Header m-animy */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-between items-center mb-8"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Revenue Overview</h1>
          <p className="text-gray-500">Track your incoming cash flow and property earnings.</p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-gray-100 rounded-xl text-sm font-medium hover:bg-gray-200 transition-all">
            Download Report
          </button>
          <button className="px-4 py-2 bg-[#581c87] text-white rounded-xl text-sm font-medium shadow-lg hover:bg-purple-800 transition-all">
            + Add Revenue
          </button>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {[
          { label: "Total Revenue", value: revenueData?.total || "0 MAD", icon: DollarSign, color: "text-green-600", bg: "bg-green-50" },
          { label: "This Month", value: revenueData?.thisMonth || "0 MAD", icon: Calendar, color: "text-purple-600", bg: "bg-purple-50" },
          { label: "Growth", value: "+12.5%", icon: TrendingUp, color: "text-blue-600", bg: "bg-blue-50" },
        ].map((stat, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            className="p-6 bg-white border border-gray-100 rounded-2xl shadow-sm"
          >
            <div className={`w-12 h-12 ${stat.bg} ${stat.color} rounded-xl flex items-center justify-center mb-4`}>
              <stat.icon size={24} />
            </div>
            <p className="text-sm text-gray-500 font-medium">{stat.label}</p>
            <h3 className="text-2xl font-bold text-gray-800 mt-1">{stat.value}</h3>
          </motion.div>
        ))}
      </div>

      {/* List dyal l-Mu3amalat (Recent Transactions) */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden"
      >
        <div className="p-6 border-b border-gray-50">
          <h2 className="text-lg font-bold text-gray-800">Recent Revenue</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-bold">
              <tr>
                <th className="px-6 py-4">Property</th>
                <th className="px-6 py-4">Owner</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {revenueData?.transactions?.length > 0 ? revenueData.transactions.map((t: any, i: number) => (
                <tr key={i} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-800">{t.property}</td>
                  <td className="px-6 py-4 text-gray-600">{t.owner}</td>
                  <td className="px-6 py-4 font-bold text-green-600">{t.amount} MAD</td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-[10px] font-bold">PAID</span>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-gray-400">No revenue records found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}