"use client";
import { useEffect, useState } from 'react';
import { Plus, UserCheck, Mail } from 'lucide-react';
import AddStaffModal from './AddStaffModal';

export default function StaffManagementPage() {
  const [staffList, setStaffList] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Function bach n-jbdou l-data mn l-Backend
  const fetchStaff = async () => {
    const response = await fetch('http://127.0.0.1:8000/api/users/agency/', {
      headers: { 
        'Authorization': `Bearer ${localStorage.getItem('token')}` 
      }
    });
    const data = await response.json();
    setStaffList(data);
  };

  useEffect(() => { fetchStaff(); }, []);

  return (
    <div className="p-8 bg-[#F9FAFB] min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Agency Staff</h1>
          <p className="text-gray-500">Manage your team and their access levels.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-[#9333ea] text-white px-6 py-3 rounded-2xl font-bold hover:shadow-lg transition-all"
        >
          <Plus size={20} /> Add New Staff
        </button>
      </div>

      {/* Modern Table */}
      <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50/50 text-gray-400 text-xs uppercase tracking-widest font-bold">
            <tr>
              <th className="px-8 py-5">Full Name</th>
              <th className="px-8 py-5">Email</th>
              <th className="px-8 py-5">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {staffList.map((member: any) => (
              <tr key={member.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-8 py-5 font-semibold text-gray-800">{member.full_name}</td>
                <td className="px-8 py-5 text-gray-500 flex items-center gap-2">
                  <Mail size={14} /> {member.email}
                </td>
                <td className="px-8 py-5">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                    member.is_active ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                  }`}>
                    {member.is_active ? 'Active' : 'Pending Invite'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AddStaffModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={fetchStaff} 
      />
    </div>
  );
}