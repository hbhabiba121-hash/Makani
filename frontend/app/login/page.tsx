"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react"; 
import api from "../../lib/axios";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false); 

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); 
    setLoading(true); 

    try {
      const response = await api.post('/api/token/', { 
        email: email, 
        password: password 
      });
      
      localStorage.setItem('access', response.data.access);
      localStorage.setItem('refresh', response.data.refresh);
      
      // Get user profile to know the role
      try {
        const userResponse = await api.get('/api/users/profile/');
        const userData = userResponse.data;
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('role', userData.role);
        
        // Redirect based on role
        if (userData.role === 'owner') {
          router.push("/owner");
        } else if (userData.role === 'admin') {
          router.push("/dashboard");  // ← THIS IS CORRECT - your dashboard is at /dashboard
        } else if (userData.role === 'staff') {
          router.push("/staff");
        } else {
          router.push("/dashboard");
        }
      } catch (userErr) {
        console.error("Failed to get user profile", userErr);
        router.push("/dashboard");
      }
      
    } catch (err: any) {
      setError("Email ou mot de passe incorrect.");
    } finally {
      setLoading(false); 
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black font-sans p-4">
      
      <div className="flex items-center gap-3 mb-8 animate-fade-in-down">
        <div className="w-12 h-12 bg-[#581c87] rounded-[12px] flex items-center justify-center text-white shadow-lg shadow-[#581c87]/20">
          <svg 
            width="24" 
            height="24" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2.5" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
        </div>
        <span className="text-2xl font-bold text-white tracking-tight">Makani</span>
      </div>

      <div className="bg-white p-10 md:p-12 rounded-[32px] shadow-2xl w-full max-w-[480px] animate-scale-in text-left">
        <h2 className="text-3xl font-extrabold text-gray-950 mb-3 tracking-tight">Welcome back</h2>
        <p className="text-gray-500 text-sm mb-10 font-medium">Enter your credentials to access your account</p>

        {error && (
          <div className="bg-red-50 text-red-600 text-xs p-4 rounded-xl mb-6 border border-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2 ml-1 text-left">Email</label>
            <input
              type="email"
              placeholder="admin@makani.com"
              className="w-full p-4 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#581c87]/20 focus:border-[#581c87] text-gray-950 transition-all bg-gray-50 focus:bg-white"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading} 
            />
          </div>

          <div className="relative">
            <div className="flex justify-between items-center mb-2 ml-1">
              <label className="text-sm font-semibold text-gray-800">Password</label>
              <button type="button" className="text-sm font-medium text-[#581c87] hover:underline">
                Forgot password?
              </button>
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                className="w-full p-4 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#581c87]/20 focus:border-[#581c87] text-gray-950 transition-all bg-gray-50 focus:bg-white"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#581c87]"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#581c87] text-white p-4 rounded-xl font-bold hover:bg-[#4c1d95] transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-[#581c87]/20 mt-4"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : "Sign in"}
          </button>
        </form>

        <div className="mt-10 text-center">
          <p className="text-gray-500 text-sm font-medium">
            Don't have an account? <span className="text-[#581c87] font-semibold cursor-pointer hover:underline">Sign up</span>
          </p>
        </div>
      </div>

      <p className="mt-12 text-gray-500 text-[13px] text-center max-w-xs leading-relaxed opacity-80">
        Property management platform for short-term rental agencies
      </p>
    </div>
  );
}