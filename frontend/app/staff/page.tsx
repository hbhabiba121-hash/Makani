"use client";
import { useEffect, useState } from 'react';
import { Wallet, Building, ArrowUpRight, Clock } from 'lucide-react';

export default function StaffOverview() {
  const [stats, setStats] = useState({
    total_properties: 0,
    monthly_earnings: 0,
    pending_records: 0
  });

  useEffect(() => {
    // Hna ghadi t-fetchi stats mn l-backend
    // Daba ndiro data simple bach n-testiw l-UI
    setStats({
      total_properties: 12,
      monthly_earnings: 4500.50,
      pending_records: 3
    });
  }, []);

  const cards = [
    { name: 'My Properties', value: stats.total_properties, icon: <Building className="text-blue-600" />, color: 'bg-blue-50' },
    { name: 'Monthly Commission', value: `${stats.monthly_earnings} MAD`, icon: <Wallet className="text-green-600" />, color: 'bg-green-50' },
    { name: 'Pending Tasks', value: stats.pending_records, icon: <Clock className="text-orange-600" />, color: 'bg-orange-50' },
  ];

  return (
    <div className="space-y-10">
      {/* Welcome Header */}
      <div>
        <h1 className="text-4xl font-black text-gray-900 tracking-tight">Welcome back! 👋</h1>
        <p className="text-gray-500 mt-2 font-medium">Here's what's happening with your properties today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {cards.map((card, i) => (
          <div key={i} className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm hover:shadow-md transition-all">
            <div className={`w-14 h-14 ${card.color} rounded-2xl flex items-center justify-center mb-6`}>
              {card.icon}
            </div>
            <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">{card.name}</p>
            <h2 className="text-3xl font-black text-gray-900 mt-2">{card.value}</h2>
          </div>
        ))}
      </div>

      {/* Recent Activity Section */}
      <div className="bg-white rounded-[40px] p-10 border border-gray-100 shadow-sm">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-black text-gray-900">Recent Financial Entries</h2>
          <button className="text-[#9333ea] font-bold flex items-center gap-1 hover:underline">
            View All <ArrowUpRight size={18} />
          </button>
        </div>
        
        {/* Placeholder for table or list */}
        <div className="text-center py-12 bg-gray-50 rounded-[32px] border-2 border-dashed border-gray-200">
          <p className="text-gray-400 font-medium">No recent entries found for this month.</p>
        </div>
      </div>
    </div>
  );
}