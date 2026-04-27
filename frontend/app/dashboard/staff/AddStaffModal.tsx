"use client";
import { useState } from 'react';

export default function AddStaffModal({ isOpen, onClose, onSuccess }: any) {
  const [formData, setFormData] = useState({ first_name: '', last_name: '', email: '', role: 'staff' });
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const res = await fetch('http://127.0.0.1:8000/api/users/create-staff/', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}` 
      },
      body: JSON.stringify(formData)
    });

    if (res.ok) {
      onSuccess(); // Refresh table
      onClose();
    } else {
      alert("Error sending invitation.");
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-md rounded-[40px] p-10 shadow-2xl">
        <h2 className="text-2xl font-black mb-2">Invite Staff</h2>
        <p className="text-gray-500 mb-8 text-sm">A temporary password will be emailed to them.</p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-4">
            <input 
              className="w-1/2 p-4 bg-gray-50 rounded-2xl outline-none border-none focus:ring-2 focus:ring-purple-500" 
              placeholder="First Name" 
              onChange={(e) => setFormData({...formData, first_name: e.target.value})} 
              required
            />
            <input 
              className="w-1/2 p-4 bg-gray-50 rounded-2xl outline-none border-none focus:ring-2 focus:ring-purple-500" 
              placeholder="Last Name" 
              onChange={(e) => setFormData({...formData, last_name: e.target.value})} 
              required
            />
          </div>
          <input 
            className="w-full p-4 bg-gray-50 rounded-2xl outline-none border-none focus:ring-2 focus:ring-purple-500" 
            placeholder="Email" 
            type="email" 
            onChange={(e) => setFormData({...formData, email: e.target.value})} 
            required
          />
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-[#9333ea] text-white py-4 rounded-2xl font-bold hover:brightness-110 transition-all disabled:opacity-50"
          >
            {loading ? "Sending..." : "Send Invitation"}
          </button>
        </form>
      </div>
    </div>
  );
}