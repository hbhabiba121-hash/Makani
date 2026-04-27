"use client";
import { useState } from 'react';
import { Save, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function FinancialRecordsPage() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle');
  const [formData, setFormData] = useState({
    property: '', // Id d l-property
    month: new Date().getMonth() + 1,
    year: 2026,
    revenue: '',
    expenses: '',
    commission_rate: 20, // Business rule
    notes: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    
    // API call l l-backend (financials app)
    const res = await fetch('http://127.0.0.1:8000/api/financials/records/', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}` 
      },
      body: JSON.stringify(formData)
    });

    if (res.ok) {
      setStatus('success');
      setTimeout(() => setStatus('idle'), 3000);
    } else {
      setStatus('idle');
      alert("Erreur: check your data or permissions");
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-10">
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Financial Reporting</h1>
        <p className="text-gray-500 font-medium mt-1">Add monthly revenue and expenses for your properties.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-[40px] p-10 border border-gray-100 shadow-sm space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Month & Year Selection */}
          <div className="space-y-3">
            <label className="text-xs font-black text-gray-400 uppercase ml-2">Period</label>
            <div className="flex gap-4">
              <input type="number" placeholder="MM" className="w-1/3 p-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-purple-500" 
                value={formData.month} onChange={(e) => setFormData({...formData, month: parseInt(e.target.value)})} required />
              <input type="number" placeholder="YYYY" className="w-2/3 p-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-purple-500" 
                value={formData.year} onChange={(e) => setFormData({...formData, year: parseInt(e.target.value)})} required />
            </div>
          </div>

          {/* Property Selection (Read-only ID or Dropdown) */}
          <div className="space-y-3">
            <label className="text-xs font-black text-gray-400 uppercase ml-2">Property ID</label>
            <input type="text" placeholder="Select Property ID" className="w-full p-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-purple-500"
              onChange={(e) => setFormData({...formData, property: e.target.value})} required />
          </div>

          {/* Revenue & Expenses */}
          <div className="space-y-3">
            <label className="text-xs font-black text-gray-400 uppercase ml-2 tracking-widest text-green-600">Revenue (MAD)</label>
            <input type="number" placeholder="0.00" className="w-full p-4 bg-green-50/30 rounded-2xl outline-none border border-green-100 focus:ring-2 focus:ring-green-500 text-green-700 font-bold"
              onChange={(e) => setFormData({...formData, revenue: e.target.value})} required />
          </div>

          <div className="space-y-3">
            <label className="text-xs font-black text-gray-400 uppercase ml-2 tracking-widest text-red-400">Expenses (MAD)</label>
            <input type="number" placeholder="0.00" className="w-full p-4 bg-red-50/30 rounded-2xl outline-none border border-red-100 focus:ring-2 focus:ring-red-400 text-red-700 font-bold"
              onChange={(e) => setFormData({...formData, expenses: e.target.value})} required />
          </div>
        </div>

        {/* Commission Rate - Read Only for Staff */}
        <div className="p-6 bg-purple-50 rounded-3xl flex justify-between items-center border border-purple-100">
          <div className="flex items-center gap-3">
            <AlertCircle className="text-purple-600" size={20} />
            <p className="text-sm font-bold text-purple-700">Standard Commission Applied</p>
          </div>
          <span className="text-xl font-black text-purple-700">{formData.commission_rate}%</span>
        </div>

        <div className="space-y-3">
          <label className="text-xs font-black text-gray-400 uppercase ml-2">Notes & Observations</label>
          <textarea placeholder="Write any details about maintenance or bookings..." className="w-full p-4 bg-gray-50 rounded-2xl outline-none h-32"
            onChange={(e) => setFormData({...formData, notes: e.target.value})} />
        </div>

        <button 
          type="submit" 
          disabled={status === 'loading'}
          className={`w-full py-5 rounded-[24px] font-black text-lg transition-all flex items-center justify-center gap-3 ${
            status === 'success' ? 'bg-green-500 text-white' : 'bg-gray-900 text-white hover:bg-black'
          }`}
        >
          {status === 'loading' ? 'Saving...' : status === 'success' ? <><CheckCircle2 /> Record Saved!</> : <><Save size={20} /> Submit Record</>}
        </button>
      </form>
    </div>
  );
}