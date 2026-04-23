"use client";
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion'; // L-mouharrik dyal l-animations
import { financialService } from '@/lib/financialService';

export default function ReportsPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    financialService.getOwnerReports()
      .then(data => {
        setReports(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Variants dyal l-animation
  const containerVars = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 } // Koul card kat-tla3 wra khtha b 0.1s
    }
  };

  const itemVars = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  if (loading) return <div className="p-10 text-purple-500 font-mono animate-pulse">Initializing Secure Connection...</div>;

  return (
    <div className="min-h-screen bg-[#0b0e14] text-white p-8 font-sans">
      {/* Animated Header */}
      <motion.div 
        initial={{ x: -50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="mb-12"
      >
        <h1 className="text-4xl font-black tracking-tighter uppercase">
          Financial <span className="text-purple-600 drop-shadow-[0_0_15px_rgba(147,51,234,0.5)]">Vault</span>
        </h1>
        <p className="text-gray-500 mt-2 font-medium">Archived statements and performance metrics.</p>
      </motion.div>

      {/* Grid d les Reports m-animya */}
      <motion.div 
        variants={containerVars}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {reports.length > 0 ? reports.map((report: any, index) => (
          <motion.div 
            key={index}
            variants={itemVars}
            whileHover={{ scale: 1.03, borderColor: '#9333ea' }} // Glow mlli t-7etti l-la souris
            className="bg-[#161b22] border border-gray-800 p-6 rounded-[32px] cursor-pointer shadow-xl transition-colors group"
          >
            <div className="flex justify-between items-start mb-6">
              <div className="p-3 bg-purple-600/10 rounded-2xl group-hover:bg-purple-600 transition-colors">
                <span className="text-2xl">📊</span>
              </div>
              <span className="text-[10px] font-bold bg-gray-800 px-3 py-1 rounded-full text-gray-400">
                PDF SECURE
              </span>
            </div>
            
            <h3 className="text-xl font-bold mb-1">{report.month || 'Monthly Report'}</h3>
            <p className="text-gray-500 text-xs mb-6 font-mono">{report.id || 'REF-2026-X'}</p>
            
            <a 
              href={report.pdf_url}
              className="inline-flex items-center gap-2 text-purple-400 font-black text-xs uppercase tracking-widest hover:text-white transition-all"
            >
              Get Statement <span className="text-lg">→</span>
            </a>
          </motion.div>
        )) : (
          <div className="col-span-full py-20 text-center border-2 border-dashed border-gray-800 rounded-[40px]">
             <p className="text-gray-600 font-bold uppercase tracking-widest text-sm">No encrypted data found</p>
          </div>
        )}
      </motion.div>
    </div>
  );
}