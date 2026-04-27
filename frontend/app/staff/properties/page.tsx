"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function StaffProperties() {
  const [properties, setProperties] = useState([]);

  useEffect(() => {
    fetch('http://127.0.0.1:8000/api/properties/', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    })
    .then(res => res.json())
    .then(data => setProperties(data));
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-black mb-6 uppercase tracking-tight">Agency Properties</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {properties.map((prop: any) => (
          <div key={prop.id} className="p-6 bg-white border border-gray-100 rounded-[24px] shadow-sm flex justify-between items-center">
            <div>
              <h3 className="font-bold text-lg">{prop.name}</h3>
              <p className="text-gray-400 text-sm">{prop.location}</p>
            </div>
            <Link 
              href={`/staff/records?propertyId=${prop.id}`}
              className="bg-purple-600 text-white px-4 py-2 rounded-xl text-sm font-bold"
            >
              Add Records
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}