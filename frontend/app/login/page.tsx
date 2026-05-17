"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, ArrowRight, Loader2, Globe } from "lucide-react";
import api from "../../lib/axios";

type Language = "fr" | "ar";

const translations = {
  fr: {
    title: "Bon retour sur Makani",
    subtitle: "Entrez vos identifiants pour accéder à votre espace.",
    email: "Adresse email",
    password: "Mot de passe",
    forgotPassword: "Mot de passe oublié ?",
    login: "Accéder au tableau de bord",
    or: "ou",
    noAccount: "Pas de compte ?",
    requestAccess: "Demander un accès",
    error: "Email ou mot de passe incorrect.",
    logo: "Makani",
    heroTitle: "Centralisez. Calculez. Transparentisez.",
    heroDesc: "La plateforme SaaS pour agences Airbnb au Maroc — suivi financier, commissions automatisées, tableaux de bord propriétaires en temps réel.",
    properties: "Propriétés",
    clients: "Clients",
    agents: "Agents",
    trust: "Données sécurisées · Hébergé au Maroc",
    credit: "Gestion locative courte durée · Maroc",
    tag: "Location courte durée · Maroc"
  },
  ar: {
    title: "مرحباً بعودتك إلى مكاني",
    subtitle: "أدخل بيانات الدخول للوصول إلى مساحتك الخاصة",
    email: "البريد الإلكتروني",
    password: "كلمة المرور",
    forgotPassword: "نسيت كلمة المرور؟",
    login: "الوصول إلى لوحة التحكم",
    or: "أو",
    noAccount: "ليس لديك حساب؟",
    requestAccess: "طلب الوصول",
    error: "البريد الإلكتروني أو كلمة المرور غير صحيحة",
    logo: "مكاني",
    heroTitle: "مركز. احسب. وضوح.",
    heroDesc: "منصة SaaS لوكالات Airbnb في المغرب — تتبع مالي، عمولات آلية، لوحات تحكم للمالكين في الوقت الفعلي.",
    properties: "عقارات",
    clients: "عملاء",
    agents: "وكلاء",
    trust: "بيانات آمنة · استضافة في المغرب",
    credit: "إدارة الإيجارات قصيرة المدى · المغرب",
    tag: "إيجارات قصيرة المدى · المغرب"
  }
};

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [language, setLanguage] = useState<Language>("fr");
  const [showLangMenu, setShowLangMenu] = useState(false);

  const t = translations[language];

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 60);
    return () => clearTimeout(t);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.post("/api/token/", { email, password });
      localStorage.setItem("access", res.data.access);
      localStorage.setItem("refresh", res.data.refresh);
      try {
        const u = await api.get("/api/users/profile/");
        localStorage.setItem("user", JSON.stringify(u.data));
        localStorage.setItem("role", u.data.role);
        if (u.data.role === "owner") router.push("/owner");
        else if (u.data.role === "admin") router.push("/dashboard");
        else if (u.data.role === "staff") router.push("/staff");
        else router.push("/dashboard");
      } catch { router.push("/dashboard"); }
    } catch { setError(t.error); }
    finally { setLoading(false); }
  };

  const toggleLanguage = () => {
    setLanguage(lang => lang === "fr" ? "ar" : "fr");
    setShowLangMenu(false);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@300;400;500;600;700&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --green:        #1a9e5c;
          --green-hover:  #178a4f;
          --green-ring:   rgba(26,158,92,0.12);
          --green-light:  #22c55e;
          --ink:          #111110;
          --ink-2:        #444440;
          --ink-3:        #96968e;
          --ink-4:        #c4c4bc;
          --surface:      #ffffff;
          --bg:           #f7f7f5;
          --border:       #e5e5e0;
          --border-2:     #d0d0c8;
          --panel:        #0f0f0e;
          --f:            'Geist', system-ui, sans-serif;
          --f-ar:         'Noto Sans Arabic', 'Geist', system-ui, sans-serif;
          --r:            9px;
        }

        html, body { height: 100%; background: var(--bg); }

        [dir="rtl"] {
          --f: var(--f-ar);
        }

        .mk {
          font-family: var(--f);
          min-height: 100vh;
          display: flex;
        }

        [dir="rtl"] .mk {
          direction: rtl;
        }

        /* ─── LEFT PANEL ─── */
        .mk-panel {
          display: none;
          position: relative;
          width: 46%;
          flex-shrink: 0;
          background: var(--panel);
          overflow: hidden;
        }
        @media (min-width: 960px) { .mk-panel { display: block; } }

        .mk-grain {
          position: absolute; inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)'/%3E%3C/svg%3E");
          opacity: 0.04; pointer-events: none; z-index: 0;
        }

        .mk-blob {
          position: absolute; border-radius: 50%;
          pointer-events: none; z-index: 0;
        }
        .mk-blob-1 {
          width: 440px; height: 440px;
          background: radial-gradient(circle, rgba(26,158,92,0.15) 0%, transparent 65%);
          top: -100px; right: -150px;
        }
        [dir="rtl"] .mk-blob-1 {
          right: auto; left: -150px;
        }
        .mk-blob-2 {
          width: 240px; height: 240px;
          background: radial-gradient(circle, rgba(26,158,92,0.08) 0%, transparent 65%);
          bottom: 60px; left: -60px;
        }
        [dir="rtl"] .mk-blob-2 {
          left: auto; right: -60px;
        }

        .mk-rules {
          position: absolute; inset: 0;
          background-image: repeating-linear-gradient(
            0deg, transparent, transparent 71px,
            rgba(255,255,255,0.02) 72px
          );
          pointer-events: none; z-index: 0;
        }

        .mk-pi {
          position: relative; z-index: 1;
          height: 100%;
          display: flex; flex-direction: column;
          padding: 2.75rem 3rem;
        }

        /* Logo */
        .mk-logo {
          display: flex; align-items: center; gap: 10px;
        }
        .mk-logo-icon {
          width: 33px; height: 33px;
          background: var(--green);
          border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .mk-logo-text {
          font-size: 16px; font-weight: 600;
          color: #fff; letter-spacing: -0.01em;
        }

        /* Hero block */
        .mk-hero {
          margin: auto 0;
          padding-bottom: 0.5rem;
        }

        .mk-tag {
          display: inline-flex; align-items: center; gap: 6px;
          margin-bottom: 2rem;
          font-size: 10.5px; font-weight: 500;
          letter-spacing: 0.1em; text-transform: uppercase;
          color: var(--green-light);
        }
        .mk-tag-dot {
          width: 5px; height: 5px; border-radius: 50%;
          background: var(--green-light);
          animation: blink 2.5s ease-in-out infinite;
        }
        @keyframes blink {
          0%,100% { opacity: 1; } 50% { opacity: 0.3; }
        }

        .mk-h1 {
          font-size: clamp(30px, 3vw, 42px);
          font-weight: 700;
          color: #fff;
          line-height: 1.1;
          letter-spacing: -0.03em;
          margin-bottom: 1.25rem;
        }

        /* Green underline on last word */
        .mk-h1 span {
          position: relative;
          display: inline-block;
          color: var(--green-light);
        }

        .mk-body {
          font-size: 13.5px;
          color: rgba(255,255,255,0.36);
          line-height: 1.7;
          font-weight: 300;
          max-width: 300px;
        }

        /* Divider */
        .mk-div {
          width: 100%; height: 1px;
          background: rgba(255,255,255,0.07);
          margin: 2.25rem 0;
        }

        /* Stats */
        .mk-stats {
          display: grid; grid-template-columns: repeat(3,1fr);
        }
        .mk-stat {
          padding: 1.125rem 1rem;
          border-right: 1px solid rgba(255,255,255,0.07);
        }
        [dir="rtl"] .mk-stat {
          border-right: none;
          border-left: 1px solid rgba(255,255,255,0.07);
        }
        .mk-stat:first-child { padding-left: 0; }
        [dir="rtl"] .mk-stat:first-child { padding-left: 1rem; padding-right: 0; }
        .mk-stat:last-child { border-right: none; }
        [dir="rtl"] .mk-stat:last-child { border-left: none; }

        .mk-stat-n {
          font-size: 20px; font-weight: 600;
          color: #fff; letter-spacing: -0.025em;
          line-height: 1; margin-bottom: 5px;
        }
        .mk-delta {
          display: inline-flex; align-items: center; gap: 1px;
          font-size: 10px; font-weight: 500;
          color: var(--green-light);
          margin-left: 5px;
          vertical-align: middle;
          position: relative; top: -1px;
        }
        .mk-stat-l {
          font-size: 11px;
          color: rgba(255,255,255,0.28);
          font-weight: 400;
        }

        /* Trust */
        .mk-trust {
          display: flex; align-items: center; gap: 7px;
          margin-top: auto;
        }
        .mk-trust-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: var(--green);
          animation: blink 2.5s ease-in-out infinite;
        }
        .mk-trust-t {
          font-size: 11px;
          color: rgba(255,255,255,0.22);
          font-weight: 300; letter-spacing: 0.02em;
        }

        /* ─── RIGHT — FORM ─── */
        .mk-right {
          flex: 1;
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          padding: 2.5rem 1.5rem;
          background: var(--bg);
          position: relative;
        }

        /* Language Switcher */
        .mk-lang-switcher {
          position: absolute;
          top: 1.5rem;
          right: 1.5rem;
          z-index: 100;
        }
        [dir="rtl"] .mk-lang-switcher {
          right: auto;
          left: 1.5rem;
        }
        .mk-lang-btn {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 40px;
          padding: 6px 12px;
          font-size: 12px;
          font-weight: 500;
          color: var(--ink-2);
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: all 0.15s;
          font-family: var(--f);
        }
        .mk-lang-btn:hover {
          border-color: var(--green);
          color: var(--green);
        }

        .mk-mob-logo {
          display: flex; align-items: center; gap: 9px;
          margin-bottom: 2.5rem;
        }
        @media (min-width: 960px) { .mk-mob-logo { display: none; } }
        .mk-mob-logo .mk-logo-text { color: var(--ink); }

        /* Animated form wrapper */
        .mk-fw {
          width: 100%; max-width: 390px;
          opacity: 0; transform: translateY(16px);
          transition: opacity 0.42s ease, transform 0.42s cubic-bezier(.22,.68,0,1.15);
        }
        .mk-fw.in { opacity: 1; transform: translateY(0); }

        /* Heading */
        .mk-ft {
          margin-bottom: 1.875rem;
        }
        .mk-ft-title {
          font-size: 24px; font-weight: 700;
          color: var(--ink);
          letter-spacing: -0.025em;
          line-height: 1.15;
          margin-bottom: 5px;
        }
        .mk-ft-sub {
          font-size: 13px; font-weight: 300;
          color: var(--ink-3); line-height: 1.5;
        }

        /* Error */
        .mk-err {
          display: flex; align-items: center; gap: 8px;
          background: #fff8f8;
          border: 1px solid #fad0d0;
          border-left: 3px solid #e53e3e;
          border-radius: var(--r);
          color: #c53030;
          font-size: 12.5px; padding: 10px 12px;
          margin-bottom: 1.25rem; line-height: 1.4;
        }
        [dir="rtl"] .mk-err {
          border-left: 1px solid #fad0d0;
          border-right: 3px solid #e53e3e;
        }

        /* Fields */
        .mk-fields { display: flex; flex-direction: column; gap: 1rem; margin-bottom: 1.25rem; }

        .mk-row {
          display: flex; justify-content: space-between; align-items: baseline;
          margin-bottom: 6px;
        }
        .mk-lbl {
          font-size: 12px; font-weight: 500;
          color: var(--ink-2); letter-spacing: 0.01em;
        }
        .mk-link {
          font-size: 11.5px; font-weight: 400;
          color: var(--green);
          background: none; border: none;
          cursor: pointer; font-family: var(--f); padding: 0;
          transition: opacity 0.15s;
        }
        .mk-link:hover { opacity: 0.65; text-decoration: underline; }

        .mk-iw { position: relative; }

        .mk-input {
          width: 100%;
          background: var(--surface);
          border: 1.5px solid var(--border);
          border-radius: var(--r);
          color: var(--ink);
          font-family: var(--f);
          font-size: 13.5px; font-weight: 400;
          padding: 10.5px 13px;
          outline: none; -webkit-appearance: none;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .mk-input::placeholder { color: var(--ink-4); font-weight: 300; }
        .mk-input:hover:not(:focus):not(:disabled) { border-color: var(--border-2); }
        .mk-input:focus {
          border-color: var(--green);
          box-shadow: 0 0 0 3.5px var(--green-ring);
        }
        .mk-input:disabled { opacity: 0.45; }
        .mk-input-pw { padding-right: 42px; }
        [dir="rtl"] .mk-input-pw { padding-right: 13px; padding-left: 42px; }

        .mk-eye {
          position: absolute; right: 12px; top: 50%;
          transform: translateY(-50%);
          background: none; border: none; cursor: pointer;
          color: var(--ink-4); display: flex; align-items: center;
          padding: 2px; border-radius: 4px;
          transition: color 0.15s;
        }
        [dir="rtl"] .mk-eye {
          right: auto;
          left: 12px;
        }
        .mk-eye:hover { color: var(--ink-2); }

        /* Submit */
        .mk-btn {
          width: 100%;
          background: var(--green);
          border: none; border-radius: var(--r);
          color: #fff;
          font-family: var(--f);
          font-size: 13.5px; font-weight: 500;
          padding: 12px 1rem;
          cursor: pointer;
          display: flex; align-items: center; justify-content: center; gap: 7px;
          letter-spacing: 0.01em;
          position: relative; overflow: hidden;
          transition: background 0.16s, box-shadow 0.16s, transform 0.1s;
        }
        .mk-btn::before {
          content: '';
          position: absolute; inset: 0;
          background: linear-gradient(180deg, rgba(255,255,255,0.08) 0%, transparent 100%);
          pointer-events: none;
        }
        .mk-btn:hover:not(:disabled) {
          background: var(--green-hover);
          box-shadow: 0 4px 16px rgba(26,158,92,0.26);
          transform: translateY(-1px);
        }
        .mk-btn:active:not(:disabled) { transform: translateY(0); box-shadow: none; }
        .mk-btn:disabled { opacity: 0.45; cursor: not-allowed; }

        /* Sep */
        .mk-sep {
          display: flex; align-items: center; gap: 10px;
          margin: 1.375rem 0 1.25rem;
        }
        .mk-sep-l { flex: 1; height: 1px; background: var(--border); }
        .mk-sep-t { font-size: 11px; color: var(--ink-4); letter-spacing: 0.06em; }

        /* Footer */
        .mk-foot {
          font-size: 12.5px; color: var(--ink-3);
          text-align: center; font-weight: 300;
        }
        .mk-foot button {
          background: none; border: none;
          color: var(--green); font-weight: 500;
          font-size: inherit; cursor: pointer;
          font-family: inherit; padding: 0;
          transition: opacity 0.15s;
        }
        .mk-foot button:hover { opacity: 0.65; text-decoration: underline; }

        /* Credit */
        .mk-credit {
          margin-top: 2.5rem;
          display: flex; align-items: center; gap: 5px;
          font-size: 10.5px; color: var(--ink-4);
          letter-spacing: 0.03em;
        }
        .mk-dot {
          width: 3px; height: 3px; border-radius: 50%;
          background: var(--ink-4); opacity: 0.5;
        }
      `}</style>

      <div className="mk" dir={language === "ar" ? "rtl" : "ltr"}>

        {/* LEFT */}
        <aside className="mk-panel">
          <div className="mk-grain" />
          <div className="mk-blob mk-blob-1" />
          <div className="mk-blob mk-blob-2" />
          <div className="mk-rules" />

          <div className="mk-pi">
            <div className="mk-logo">
              <div className="mk-logo-icon">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none"
                  stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                  <polyline points="9 22 9 12 15 12 15 22"/>
                </svg>
              </div>
              <span className="mk-logo-text">{t.logo}</span>
            </div>

            <div className="mk-hero">
              <div className="mk-tag">
                <span className="mk-tag-dot" />
                {t.tag}
              </div>

              <h2 className="mk-h1">
                {language === "ar" ? (
                  <>
                    {t.heroTitle.split(".").map((part, i) => (
                      <span key={i}>{part}{i < 2 ? ".\n" : ""}</span>
                    ))}
                  </>
                ) : (
                  <>
                    Centralisez.<br />
                    Calculez.<br />
                    <span>Transparentisez.</span>
                  </>
                )}
              </h2>

              <p className="mk-body">
                {t.heroDesc}
              </p>

              <div className="mk-div" />

              <div className="mk-stats">
                <div className="mk-stat">
                  <div className="mk-stat-n">
                    2 854
                    <span className="mk-delta">
                      <svg width="8" height="8" viewBox="0 0 10 10" fill="none">
                        <path d="M5 8V2M2 5l3-3 3 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                      </svg>
                      2%
                    </span>
                  </div>
                  <div className="mk-stat-l">{t.properties}</div>
                </div>
                <div className="mk-stat">
                  <div className="mk-stat-n">
                    9 431
                    <span className="mk-delta">
                      <svg width="8" height="8" viewBox="0 0 10 10" fill="none">
                        <path d="M5 8V2M2 5l3-3 3 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                      </svg>
                      5.8%
                    </span>
                  </div>
                  <div className="mk-stat-l">{t.clients}</div>
                </div>
                <div className="mk-stat">
                  <div className="mk-stat-n">
                    705
                    <span className="mk-delta">
                      <svg width="8" height="8" viewBox="0 0 10 10" fill="none">
                        <path d="M5 8V2M2 5l3-3 3 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                      </svg>
                      5.8%
                    </span>
                  </div>
                  <div className="mk-stat-l">{t.agents}</div>
                </div>
              </div>
            </div>

            <div className="mk-trust">
              <span className="mk-trust-dot" />
              <span className="mk-trust-t">{t.trust}</span>
            </div>
          </div>
        </aside>

        {/* RIGHT */}
        <main className="mk-right">

          {/* Language Switcher */}
          <div className="mk-lang-switcher">
            <button onClick={toggleLanguage} className="mk-lang-btn">
              <Globe size={12} />
              {language === "fr" ? "العربية" : "Français"}
            </button>
          </div>

          <div className="mk-mob-logo">
            <div className="mk-logo-icon">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
            </div>
            <span className="mk-logo-text">{t.logo}</span>
          </div>

          <div className={`mk-fw${ready ? " in" : ""}`}>

            <div className="mk-ft">
              <h1 className="mk-ft-title">{t.title}</h1>
              <p className="mk-ft-sub">{t.subtitle}</p>
            </div>

            {error && (
              <div className="mk-err">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0 }}>
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                {error}
              </div>
            )}

            <form onSubmit={handleLogin}>
              <div className="mk-fields">
                <div>
                  <div className="mk-row">
                    <label className="mk-lbl" htmlFor="email">{t.email}</label>
                  </div>
                  <div className="mk-iw">
                    <input id="email" type="email" placeholder={language === "ar" ? "أنت@makani.ma" : "vous@makani.ma"}
                      className="mk-input" value={email}
                      onChange={e => setEmail(e.target.value)}
                      disabled={loading} autoComplete="email" />
                  </div>
                </div>

                <div>
                  <div className="mk-row">
                    <label className="mk-lbl" htmlFor="password">{t.password}</label>
                    <button type="button" className="mk-link">{t.forgotPassword}</button>
                  </div>
                  <div className="mk-iw">
                    <input id="password" type={showPassword ? "text" : "password"}
                      placeholder="••••••••••" className="mk-input mk-input-pw"
                      value={password} onChange={e => setPassword(e.target.value)}
                      disabled={loading} autoComplete="current-password" />
                    <button type="button" className="mk-eye"
                      onClick={() => setShowPassword(v => !v)} aria-label={language === "ar" ? "عرض كلمة المرور" : "Voir le mot de passe"}>
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>
              </div>

              <button type="submit" className="mk-btn" disabled={loading}>
                {loading
                  ? <Loader2 size={16} className="animate-spin" />
                  : <>{t.login} <ArrowRight size={14} /></>
                }
              </button>
            </form>

            <div className="mk-sep">
              <span className="mk-sep-l" /><span className="mk-sep-t">{t.or}</span><span className="mk-sep-l" />
            </div>

            <p className="mk-foot">
              {t.noAccount} <button type="button">{t.requestAccess}</button>
            </p>

          </div>

          <div className="mk-credit">
            <span>{t.logo}</span>
            <span className="mk-dot" />
            <span>{t.credit}</span>
          </div>

        </main>
      </div>
    </>
  );
}