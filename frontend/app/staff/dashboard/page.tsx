"use client";
import { useEffect, useState } from 'react';
import { BarChart3, TrendingUp, AlertCircle } from 'lucide-react';

export default function StaffDetailedDashboard() {
  const [earningsData, setEarningsData] = useState([]);

  useEffect(() => {
    // Fetch detailed earnings per property
    // Hna katti-3ayti l-backend bach i-3tik l-data d l-chhar
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-sm font-black text-purple-600 uppercase tracking-widest">Analytics</h2>
          <h1 className="text-3xl font-black text-gray-900 mt-1">Earnings Analysis</h1>
        </div>
        <div className="flex gap-2">
          <span className="px-4 py-2 bg-white border border-gray-100 rounded-xl text-sm font-bold shadow-sm">April 2026</span>
        </div>
      </div>

      {/* Earnings Table / List */}
      <div className="bg-white rounded-[35px] border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-gray-50 bg-gray-50/30">
          <h3 className="font-bold text-gray-800 flex items-center gap-2">
            <BarChart3 size={20} className="text-purple-500" /> 
            Property Performance & Commission
          </h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50">
                <th className="px-8 py-5">Property</th>
                <th className="px-8 py-5">Revenue</th>
                <th className="px-8 py-5">Expenses</th>
                <th className="px-8 py-5">Net Profit</th>
                <th className="px-8 py-5 text-purple-600">My Commission (20%)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-sm">
              {/* Example Row - Bach t-choufi l-UI */}
              <tr className="hover:bg-gray-50/50 transition-colors">
                <td className="px-8 py-5 font-bold text-gray-800">Villa Sunshine</td>
                <td className="px-8 py-5 text-green-600 font-medium">+12,000 MAD</td>
                <td className="px-8 py-5 text-red-400">-1,500 MAD</td>
                <td className="px-8 py-5 font-bold text-gray-700">10,500 MAD</td>
                <td className="px-8 py-5 font-black text-purple-600 bg-purple-50/30">2,100 MAD</td>
              </tr>
              <tr className="hover:bg-gray-50/50 transition-colors">
                <td className="px-8 py-5 font-bold text-gray-800">Apartment Atlas</td>
                <td className="px-8 py-5 text-green-600 font-medium">+8,500 MAD</td>
                <td className="px-8 py-5 text-red-400">-800 MAD</td>
                <td className="px-8 py-5 font-bold text-gray-700">7,700 MAD</td>
                <td className="px-8 py-5 font-black text-purple-600 bg-purple-50/30">1,540 MAD</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Info Note */}
      <div className="flex items-center gap-3 p-6 bg-blue-50 rounded-3xl border border-blue-100 text-blue-700 text-sm">
        <AlertCircle size={20} />
        <p className="font-medium">All earnings are calculated based on the 20% commission rate set by your agency administrator.</p>
      </div>
    </div>
  );
}