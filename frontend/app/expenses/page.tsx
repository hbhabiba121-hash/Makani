"use client";
import React, { useState } from 'react';

export default function ExpensePage() {
  return (
    <div className="min-h-screen bg-[#0b0e14] text-white p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-10">
        <h1 className="text-3xl font-extrabold border-l-8 border-red-600 pl-4 uppercase">
          Expense <span className="text-red-500">Management</span>
        </h1>
      </div>

      {/* Formulaire Add Expense */}
      <div className="bg-[#161b22] p-8 rounded-2xl border border-gray-800 mb-10 shadow-2xl">
        <h2 className="text-xl font-semibold mb-6 text-gray-300 italic">Record New Expense</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-sm text-gray-400">Expense Title</label>
            <input type="text" placeholder="e.g. Plumbing Repair" className="bg-[#0b0e14] border border-gray-700 p-3 rounded-lg focus:border-red-500 outline-none" />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm text-gray-400">Amount (MAD)</label>
            <input type="number" placeholder="0.00" className="bg-[#0b0e14] border border-gray-700 p-3 rounded-lg focus:border-red-500 outline-none" />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm text-gray-400">Category</label>
            <select className="bg-[#0b0e14] border border-gray-700 p-3 rounded-lg outline-none">
              <option>Maintenance</option>
              <option>Cleaning</option>
              <option>Taxes</option>
              <option>Utilities</option>
            </select>
          </div>
          <div className="flex items-end">
            <button className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg transition shadow-[0_0_15px_rgba(220,38,38,0.3)]">
              Save Expense
            </button>
          </div>
        </div>
      </div>

      {/* Recent Expenses Table */}
      <div className="bg-[#161b22] rounded-2xl border border-gray-800 overflow-hidden shadow-2xl">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#21262d] text-gray-400 uppercase text-xs">
            <tr>
              <th className="px-6 py-4">Description</th>
              <th className="px-6 py-4">Category</th>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
             <tr className="hover:bg-[#2d333b]">
                <td className="px-6 py-4">Lock Replacement</td>
                <td className="px-6 py-4 italic text-gray-400">Maintenance</td>
                <td className="px-6 py-4 text-gray-500">2026-04-20</td>
                <td className="px-6 py-4 text-red-400 font-bold">-250.00 MAD</td>
             </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}