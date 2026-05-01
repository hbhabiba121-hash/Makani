"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, ArrowRight, Loader2 } from "lucide-react";
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
      const response = await api.post("/api/token/", {
        email,
        password,
      });

      localStorage.setItem("access", response.data.access);
      localStorage.setItem("refresh", response.data.refresh);

      try {
        const userResponse = await api.get("/api/users/profile/");
        const userData = userResponse.data;
        localStorage.setItem("user", JSON.stringify(userData));
        localStorage.setItem("role", userData.role);

        if (userData.role === "owner") {
          router.push("/owner");
        } else if (userData.role === "admin") {
          router.push("/dashboard");
        } else if (userData.role === "staff") {
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
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');

        .login-root {
          font-family: 'DM Sans', sans-serif;
          min-height: 100vh;
          background: #000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          position: relative;
          overflow: hidden;
        }

        .login-grid-bg {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(88, 28, 135, 0.07) 1px, transparent 1px),
            linear-gradient(90deg, rgba(88, 28, 135, 0.07) 1px, transparent 1px);
          background-size: 48px 48px;
          pointer-events: none;
        }

        .login-glow {
          position: absolute;
          width: 500px;
          height: 500px;
          background: radial-gradient(circle, rgba(88, 28, 135, 0.15) 0%, transparent 70%);
          top: -100px;
          right: -100px;
          pointer-events: none;
        }

        .login-glow-2 {
          position: absolute;
          width: 300px;
          height: 300px;
          background: radial-gradient(circle, rgba(88, 28, 135, 0.08) 0%, transparent 70%);
          bottom: -60px;
          left: -60px;
          pointer-events: none;
        }

        .login-card {
          position: relative;
          background: #0a0a0a;
          border: 0.5px solid rgba(88, 28, 135, 0.35);
          width: 100%;
          max-width: 460px;
          overflow: hidden;
        }

        /* Corner bracket accents */
        .login-card::before,
        .login-card::after {
          content: '';
          position: absolute;
          width: 14px;
          height: 14px;
          border-color: #581c87;
          border-style: solid;
          opacity: 0.7;
          z-index: 10;
        }
        .login-card::before { top: -1px; left: -1px; border-width: 1.5px 0 0 1.5px; }
        .login-card::after  { top: -1px; right: -1px; border-width: 1.5px 1.5px 0 0; }

        .login-card-corner-bl,
        .login-card-corner-br {
          position: absolute;
          width: 14px;
          height: 14px;
          border-color: #581c87;
          border-style: solid;
          opacity: 0.7;
          z-index: 10;
        }
        .login-card-corner-bl { bottom: -1px; left: -1px; border-width: 0 0 1.5px 1.5px; }
        .login-card-corner-br { bottom: -1px; right: -1px; border-width: 0 1.5px 1.5px 0; }

        /* Purple header bar */
        .login-header {
          background: #581c87;
          padding: 1.375rem 2rem;
          display: flex;
          align-items: center;
          gap: 12px;
          border-bottom: 0.5px solid rgba(255, 255, 255, 0.08);
        }

        .login-logo-box {
          width: 36px;
          height: 36px;
          background: rgba(255, 255, 255, 0.12);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .login-brand-name {
          font-family: 'Syne', sans-serif;
          font-size: 18px;
          font-weight: 800;
          color: #fff;
          letter-spacing: 0.02em;
          line-height: 1.2;
        }

        .login-brand-sub {
          font-size: 10.5px;
          color: rgba(255, 255, 255, 0.5);
          font-weight: 300;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          margin-top: 2px;
        }

        /* Form body */
        .login-body {
          padding: 2rem;
        }

        .login-heading {
          font-family: 'Syne', sans-serif;
          font-size: 22px;
          font-weight: 700;
          color: #fff;
          letter-spacing: -0.01em;
          margin-bottom: 4px;
        }

        .login-subheading {
          font-size: 13px;
          color: rgba(255, 255, 255, 0.35);
          font-weight: 300;
          margin-bottom: 1.75rem;
          letter-spacing: 0.01em;
        }

        /* Error banner */
        .login-error {
          background: rgba(163, 45, 45, 0.15);
          border: 0.5px solid rgba(163, 45, 45, 0.45);
          color: #f09595;
          font-size: 12px;
          padding: 10px 12px;
          margin-bottom: 1.25rem;
        }

        /* Fields */
        .login-field {
          margin-bottom: 1.125rem;
        }

        .login-field-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 6px;
        }

        .login-label {
          font-size: 11px;
          font-weight: 500;
          color: rgba(255, 255, 255, 0.45);
          text-transform: uppercase;
          letter-spacing: 0.07em;
        }

        .login-forgot {
          font-size: 11px;
          color: #a855f7;
          background: none;
          border: none;
          cursor: pointer;
          padding: 0;
          letter-spacing: 0.03em;
          font-family: 'DM Sans', sans-serif;
        }
        .login-forgot:hover { text-decoration: underline; }

        .login-input-wrap {
          position: relative;
        }

        .login-input {
          width: 100%;
          background: #111;
          border: 0.5px solid rgba(255, 255, 255, 0.09);
          color: #fff;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          padding: 11px 14px;
          outline: none;
          transition: border-color 0.15s, background 0.15s;
          font-weight: 400;
          -webkit-appearance: none;
        }
        .login-input::placeholder { color: rgba(255, 255, 255, 0.18); }
        .login-input:focus {
          border-color: #581c87;
          background: #0d0d0d;
        }
        .login-input:disabled { opacity: 0.45; }

        .login-input-password {
          padding-right: 42px;
        }

        .login-eye-btn {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          color: rgba(255, 255, 255, 0.28);
          display: flex;
          align-items: center;
          padding: 0;
          transition: color 0.15s;
        }
        .login-eye-btn:hover { color: rgba(255, 255, 255, 0.6); }

        /* Submit button */
        .login-btn {
          width: 100%;
          background: #581c87;
          border: none;
          color: #fff;
          font-family: 'Syne', sans-serif;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          padding: 13px 1rem;
          cursor: pointer;
          transition: background 0.15s;
          margin-top: 0.375rem;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        .login-btn:hover:not(:disabled) { background: #6d28d9; }
        .login-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        .login-divider {
          border: none;
          border-top: 0.5px solid rgba(255, 255, 255, 0.07);
          margin: 1.5rem 0;
        }

        .login-footer {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.25);
          text-align: center;
          font-weight: 300;
        }
        .login-footer span {
          color: #a855f7;
          cursor: pointer;
        }
        .login-footer span:hover { text-decoration: underline; }

        .login-page-footer {
          position: absolute;
          bottom: 1.5rem;
          left: 50%;
          transform: translateX(-50%);
          font-size: 11px;
          color: rgba(255, 255, 255, 0.15);
          text-align: center;
          letter-spacing: 0.04em;
          white-space: nowrap;
        }
      `}</style>

      <div className="login-root">
        <div className="login-grid-bg" />
        <div className="login-glow" />
        <div className="login-glow-2" />

        <div className="login-card">
          {/* Corner brackets */}
          <span className="login-card-corner-bl" />
          <span className="login-card-corner-br" />

          {/* Purple header */}
          <div className="login-header">
            <div className="login-logo-box">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#fff"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            </div>
            <div>
              <div className="login-brand-name">Makani</div>
              <div className="login-brand-sub">Property Management</div>
            </div>
          </div>

          {/* Form body */}
          <div className="login-body">
            <h1 className="login-heading">Welcome back</h1>
            <p className="login-subheading">Enter your credentials to continue</p>

            {error && <div className="login-error">{error}</div>}

            <form onSubmit={handleLogin}>
              {/* Email */}
              <div className="login-field">
                <div className="login-field-header">
                  <label className="login-label" htmlFor="email">Email</label>
                </div>
                <div className="login-input-wrap">
                  <input
                    id="email"
                    type="email"
                    placeholder="admin@makani.com"
                    className="login-input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    autoComplete="email"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="login-field">
                <div className="login-field-header">
                  <label className="login-label" htmlFor="password">Password</label>
                  <button type="button" className="login-forgot">
                    Forgot password?
                  </button>
                </div>
                <div className="login-input-wrap">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="login-input login-input-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="login-eye-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button type="submit" className="login-btn" disabled={loading}>
                {loading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <>
                    Sign in
                    <ArrowRight size={14} />
                  </>
                )}
              </button>
            </form>

            <hr className="login-divider" />

            <p className="login-footer">
              No account? <span>Request access</span>
            </p>
          </div>
        </div>

        <p className="login-page-footer">
          Short-term rental management platform
        </p>
      </div>
    </>
  );
}