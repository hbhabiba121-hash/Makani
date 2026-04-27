"use client";
import React, { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import { Loader2 } from "lucide-react";

const COLORS = ['#ef4444', '#9333ea']; // Red for Expenses, Purple for Net Profit

export default function ReportsPage() {
  const [dataPerformance, setDataPerformance] = useState([]);
  const [dataPie, setDataPie] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1. Fetch l-data mn l-Backend (Django)
  useEffect(() => {
    const fetchReportData = async () => {
      try {
        const response = await fetch('http://127.0.0.1:8000/api/reports/financials/');
        const result = await response.json();
        
        // n-stbdlo l-data l-9dima b l-jdida jaya mn l-API
        setDataPerformance(result.performance); // [ {name: 'Jan', revenue: 5000, expenses: 2000}, ... ]
        setDataPie(result.pie_data);           // [ {name: 'Expenses', value: 30}, {name: 'Net Profit', value: 70} ]
      } catch (err) {
        console.error("Erreur f fetch dyal reports:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchReportData();
  }, []);

  if (loading) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-[#9333ea]" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Financial Reports</h1>
        <p className="text-sm text-gray-500">Visual summary of your business performance</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Line Chart: Revenue vs Expenses */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm h-[350px]">
          <h2 className="text-sm font-bold text-gray-700 mb-6 uppercase tracking-wider">Revenue vs Expenses</h2>
          <ResponsiveContainer width="100%" height="90%">
            <LineChart data={dataPerformance}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} />
              <YAxis axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{borderRadius: '10px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}} />
              <Legend />
              <Line type="monotone" dataKey="revenue" stroke="#9333ea" strokeWidth={3} dot={{ r: 6 }} />
              <Line type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={3} dot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart: Profit Margin */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm h-[350px]">
          <h2 className="text-sm font-bold text-gray-700 mb-6 uppercase tracking-wider">Profit Margin</h2>
          <ResponsiveContainer width="100%" height="90%">
            <PieChart>
              <Pie data={dataPie} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                {dataPie.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend verticalAlign="bottom" height={36}/>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}