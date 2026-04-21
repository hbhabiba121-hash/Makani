"use client";
import React from 'react';

export default function RevenuePage() {
  return (
    <div className="min-h-screen bg-[#0b0e14] text-white p-8">
      {/* Header CyphX Identity */}
      <div className="flex justify-between items-center mb-10 text-white">
        <h1 className="text-3xl font-extrabold tracking-tight border-l-8 border-purple-600 pl-4 uppercase">
          Revenue <span className="text-purple-500">Management</span>
        </h1>
        <button className="bg-purple-600 hover:bg-purple-700 px-6 py-2 rounded-lg font-medium transition shadow-[0_0_20px_rgba(147,51,234,0.3)] text-white">
          + Add Transaction
        </button>
      </div>

      {/* Metric Cards (Revenue, Commission, Net) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-[#161b22] p-6 rounded-2xl border border-gray-800 border-t-purple-500 border-t-4">
          <p className="text-gray-400 text-xs uppercase mb-1">Total Revenue</p>
          <p className="text-2xl font-bold text-green-400">0.00 MAD</p>
        </div>
        <div className="bg-[#161b22] p-6 rounded-2xl border border-gray-800">
          <p className="text-gray-400 text-xs uppercase mb-1">Commission</p>
          <p className="text-2xl font-bold text-purple-400">0.00 MAD</p>
        </div>
        <div className="bg-[#161b22] p-6 rounded-2xl border border-gray-800">
          <p className="text-gray-400 text-xs uppercase mb-1">Owner Net</p>
          <p className="text-2xl font-bold text-blue-400">0.00 MAD</p>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-[#161b22] rounded-2xl border border-gray-800 overflow-hidden shadow-2xl">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#21262d] text-gray-400 uppercase text-xs">
            <tr>
              <th className="px-6 py-4">Property</th>
              <th className="px-6 py-4">Revenue</th>
              <th className="px-6 py-4">Expenses</th>
              <th className="px-6 py-4">Net Payout</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            <tr>
              <td className="px-6 py-10 text-center text-gray-500 font-medium" colSpan={4}>
                Ready to sync with Backend.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}