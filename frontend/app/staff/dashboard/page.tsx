"use client";
import { useEffect, useState } from 'react';
import { BarChart3, TrendingUp, AlertCircle, Loader2, Search } from 'lucide-react';

interface PropertyEarning {
  id: number;
  name: string;
  revenue: number;
  expenses: number;
  net_profit: number;
  commission: number;
}

export default function StaffDetailedDashboard() {
  const [earningsData, setEarningsData] = useState<PropertyEarning[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEarnings = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://127.0.0.1:8000/api/staff/earnings/', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error('Impossible de récupérer les données d\'analyses.');
        }
        
        const data = await response.json();
        setEarningsData(data);
      } catch (err: any) {
        setError(err.message || 'Une erreur est survenue.');
      } finally {
        setLoading(false);
      }
    };

    fetchEarnings();
  }, []);

  // Filter les propriétés 3la hsab chno ktab f la barre de recherche
  const filteredEarnings = earningsData.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalCommission = filteredEarnings.reduce((sum, item) => sum + item.commission, 0);
  const totalRevenue = filteredEarnings.reduce((sum, item) => sum + item.revenue, 0);

  return (
    <div className="space-y-6 text-gray-700">
      {/* Title Header matchi m3a "Propriétaires" */}
      <div>
        <h1 className="text-[26px] font-bold text-[#111827] tracking-tight">Analyse des gains</h1>
        <p className="text-sm text-gray-400 mt-0.5">Suivez et gérez vos commissions sur les propriétés de l'agence.</p>
      </div>

      {/* Grid dial les mini-cards b7al dyal l-image exactly */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: Portefeuille / Chiffre d'affaire */}
        <div className="p-6 bg-white rounded-2xl border border-gray-100 flex justify-between items-start">
          <div className="space-y-2">
            <span className="text-[13px] font-semibold text-gray-400 block">Chiffre d'affaires</span>
            <span className="text-3xl font-bold text-gray-900 block">
              {loading ? '...' : `${totalRevenue.toLocaleString()} MAD`}
            </span>
          </div>
          <div className="p-2.5 bg-purple-50 text-purple-500 rounded-xl">
            <BarChart3 size={18} />
          </div>
        </div>

        {/* Card 2: Commission Actifs Matchi m3a l'UI dyal Makani */}
        <div className="p-6 bg-white rounded-2xl border border-gray-100 flex justify-between items-start">
          <div className="space-y-2">
            <span className="text-[13px] font-semibold text-gray-400 block">Ma Commission (20%)</span>
            <span className="text-3xl font-bold text-gray-900 block">
              {loading ? '...' : `${totalCommission.toLocaleString()} MAD`}
            </span>
          </div>
          <div className="p-2.5 bg-[#e6f8f1] text-[#00b977] rounded-xl">
            <TrendingUp size={18} />
          </div>
        </div>
      </div>

      {/* Input de recherche b7al "Rechercher un propriétaire..." */}
      <div className="relative w-full max-w-xl">
        <span className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-gray-400">
          <Search size={18} />
        </span>
        <input
          type="text"
          placeholder="Rechercher une propriété..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-11 pr-4 py-3 bg-white border border-gray-100 rounded-xl text-sm placeholder-gray-400 focus:outline-none focus:border-[#00b977] focus:ring-1 focus:ring-[#00b977] transition-all"
        />
      </div>

      {/* Main Container dyal la table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-16 flex flex-col items-center justify-center gap-3 text-gray-400">
              <Loader2 className="animate-spin text-[#00b977]" size={28} />
              <p className="text-sm font-medium">Chargement des données...</p>
            </div>
          ) : error ? (
            <div className="p-16 flex flex-col items-center justify-center gap-2 text-red-500">
              <AlertCircle size={28} />
              <p className="text-sm font-semibold">{error}</p>
            </div>
          ) : filteredEarnings.length === 0 ? (
            // Empty State view kib7al "Aucun propriétaire trouvé"
            <div className="p-16 flex flex-col items-center justify-center text-center">
              <div className="p-4 bg-gray-50 rounded-2xl text-gray-400 mb-4">
                <BarChart3 size={32} />
              </div>
              <h3 className="text-base font-bold text-gray-900">Aucune propriété trouvée</h3>
              <p className="text-sm text-gray-400 mt-1 max-w-xs">Il n'y a pas de données d'analyses pour ce filtre actuellement.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-[14px]">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100 text-xs font-bold text-gray-400 uppercase tracking-wider">
                  <th className="px-6 py-4">Propriété</th>
                  <th className="px-6 py-4">Revenu</th>
                  <th className="px-6 py-4">Dépenses</th>
                  <th className="px-6 py-4">Bénéfice Net</th>
                  <th className="px-6 py-4 text-[#00b977]">Commission Generated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 font-medium text-gray-700">
                {filteredEarnings.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/30 transition-colors">
                    <td className="px-6 py-4.5 font-semibold text-gray-900">{item.name}</td>
                    <td className="px-6 py-4.5 text-emerald-600">+{item.revenue.toLocaleString()} MAD</td>
                    <td className="px-6 py-4.5 text-red-400">-{item.expenses.toLocaleString()} MAD</td>
                    <td className="px-6 py-4.5 text-gray-500">{item.net_profit.toLocaleString()} MAD</td>
                    <td className="px-6 py-4.5 font-bold text-[#00b977] bg-[#00b977]/5">
                      {item.commission.toLocaleString()} MAD
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Info Warning Banner matches le style */}
      <div className="flex items-start gap-3 p-5 bg-gray-50 rounded-2xl border border-gray-100 text-gray-500 text-xs leading-relaxed">
        <AlertCircle size={16} className="text-[#00b977] shrink-0 mt-0.5" />
        <p>
          Toutes les commissions sont calculées automatiquement sur la base du taux standard de <span className="font-bold text-gray-800">20%</span> défini par la direction de l'agence Makani.
        </p>
      </div>
    </div>
  );
}