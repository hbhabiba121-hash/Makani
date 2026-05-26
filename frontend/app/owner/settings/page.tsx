"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Bell, Globe, Eye, EyeOff, Check, Save, User, Mail, Building, Phone } from "lucide-react";
import api from "@/lib/axios";
import { useLang } from "@/app/components/contexts/LanguageContext";

const labels = {
  fr: {
    title:          "Paramètres",
    subtitle:       "Gérez vos préférences et sécurité",
    accountInfo:    "Informations du compte",
    accountInfoSub: "Vos informations personnelles et agence",
    firstName:      "Prénom",
    lastName:       "Nom",
    emailLabel:     "Adresse email",
    agencyLabel:    "Agence",
    agencyPhone:    "Téléphone agence",
    agencyEmail:    "Email agence",
    noAgency:       "Non assigné",
    security:       "Sécurité",
    securitySub:    "Modifier votre mot de passe",
    currentPwd:     "Mot de passe actuel",
    newPwd:         "Nouveau mot de passe",
    confirmPwd:     "Confirmer le nouveau mot de passe",
    savePassword:   "Enregistrer le mot de passe",
    notifications:  "Notifications",
    notifSub:       "Gérez vos préférences de notifications",
    notifMonthly:   "Rapports mensuels par email",
    notifMonthlyD:  "Recevez votre rapport financier chaque mois",
    notifBooking:   "Nouvelles réservations",
    notifBookingD:  "Soyez notifié lors d'une nouvelle réservation",
    notifPayment:   "Paiements reçus",
    notifPaymentD:  "Recevez une alerte à chaque paiement",
    language:       "Langue",
    languageSub:    "Choisissez votre langue d'affichage",
    french:         "Français",
    arabic:         "العربية",
    saving:         "Enregistrement...",
    pwdMismatch:    "Les mots de passe ne correspondent pas",
    pwdShort:       "Le mot de passe doit contenir au moins 8 caractères",
    pwdSuccess:     "Mot de passe modifié avec succès",
    pwdError:       "Erreur lors de la modification",
  },
  ar: {
    title:          "الإعدادات",
    subtitle:       "إدارة تفضيلاتك وأمانك",
    accountInfo:    "معلومات الحساب",
    accountInfoSub: "معلوماتك الشخصية والوكالة",
    firstName:      "الاسم الأول",
    lastName:       "اسم العائلة",
    emailLabel:     "البريد الإلكتروني",
    agencyLabel:    "الوكالة",
    agencyPhone:    "هاتف الوكالة",
    agencyEmail:    "بريد الوكالة",
    noAgency:       "غير محدد",
    security:       "الأمان",
    securitySub:    "تغيير كلمة المرور",
    currentPwd:     "كلمة المرور الحالية",
    newPwd:         "كلمة المرور الجديدة",
    confirmPwd:     "تأكيد كلمة المرور الجديدة",
    savePassword:   "حفظ كلمة المرور",
    notifications:  "الإشعارات",
    notifSub:       "إدارة تفضيلات الإشعارات",
    notifMonthly:   "التقارير الشهرية عبر البريد",
    notifMonthlyD:  "استلم تقريرك المالي كل شهر",
    notifBooking:   "الحجوزات الجديدة",
    notifBookingD:  "احصل على إشعار عند كل حجز جديد",
    notifPayment:   "المدفوعات المستلمة",
    notifPaymentD:  "احصل على تنبيه عند كل دفعة",
    language:       "اللغة",
    languageSub:    "اختر لغة العرض",
    french:         "Français",
    arabic:         "العربية",
    saving:         "جارٍ الحفظ...",
    pwdMismatch:    "كلمات المرور غير متطابقة",
    pwdShort:       "كلمة المرور يجب أن تحتوي على 8 أحرف على الأقل",
    pwdSuccess:     "تم تغيير كلمة المرور بنجاح",
    pwdError:       "حدث خطأ أثناء التغيير",
  },
} as const;

interface UserInfo {
  first_name:    string;
  last_name:     string;
  email:         string;
  agency_name?:  string;
  agency_phone?: string;
  agency_email?: string;
}

export default function OwnerSettingsPage() {
  const router = useRouter();
  const { lang, setLang } = useLang();
  const tx    = labels[lang];
  const isRTL = lang === "ar";

  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);

  const [currentPwd,  setCurrentPwd]  = useState("");
  const [newPwd,      setNewPwd]      = useState("");
  const [confirmPwd,  setConfirmPwd]  = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew,     setShowNew]     = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pwdError,    setPwdError]    = useState("");
  const [pwdSuccess,  setPwdSuccess]  = useState("");
  const [pwdSaving,   setPwdSaving]   = useState(false);

  const [notifMonthly, setNotifMonthly] = useState(true);
  const [notifBooking, setNotifBooking] = useState(true);
  const [notifPayment, setNotifPayment] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("access");
    if (!token) { router.push("/login"); return; }

    const stored = localStorage.getItem("user");
    if (stored) {
      try {
        const u = JSON.parse(stored);
        setUserInfo({
          first_name:   u.first_name   || "",
          last_name:    u.last_name    || "",
          email:        u.email        || "",
          agency_name:  u.agency_name  || "",  
          agency_phone: u.phone        || "",
          agency_email: "",
        });
      } catch {}
    }

    api.get("/api/users/profile/").then(res => {
      const u = res.data;
      setUserInfo({
        first_name:   u.first_name   || "",
        last_name:    u.last_name    || "",
        email:        u.email        || "",
        agency_name:  u.agency_name  || "",  
        agency_phone: u.phone        || "",
        agency_email: "",
      });
    }).catch(() => {});
  }, [router]);

  const handlePasswordSave = async () => {
    setPwdError(""); setPwdSuccess("");
    if (newPwd.length < 8)     { setPwdError(tx.pwdShort);    return; }
    if (newPwd !== confirmPwd) { setPwdError(tx.pwdMismatch); return; }
    setPwdSaving(true);
    try {
      await api.post("/api/users/change-password/", {
        old_password: currentPwd,
        new_password: newPwd,
      });
      setPwdSuccess(tx.pwdSuccess);
      setCurrentPwd(""); setNewPwd(""); setConfirmPwd("");
    } catch {
      setPwdError(tx.pwdError);
    } finally {
      setPwdSaving(false);
    }
  };

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700&display=swap');
    @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700&display=swap');

    .st {
      --green:      #22c55e;
      --green-bg:   #f0fdf4;
      --green-text: #16a34a;
      --green-dim:  rgba(34,197,94,0.1);
      --ink:        #111827;
      --ink-2:      #374151;
      --ink-3:      #6b7280;
      --ink-4:      #9ca3af;
      --border:     #f3f4f6;
      --border-2:   #e5e7eb;
      --bg:         #f9fafb;
      --surface:    #ffffff;
      --f: ${isRTL ? "'Cairo'" : "'Geist'"}, system-ui, sans-serif;
      font-family: var(--f);
      direction: ${isRTL ? "rtl" : "ltr"};
      background: var(--bg);
      min-height: 100vh;
      padding: 2rem;
      color: var(--ink);
    }

    .st-header { margin-bottom: 2rem; }
    .st-title  { font-size: 22px; font-weight: 700; color: var(--ink); letter-spacing: -0.02em; }
    .st-sub    { font-size: 13px; color: var(--ink-4); margin-top: 4px; }

    .st-sections { display: flex; flex-direction: column; gap: 1.5rem; max-width: 640px; }

    .st-card { background: var(--surface); border: 1px solid var(--border-2); border-radius: 16px; overflow: hidden; }

    .st-card-head {
      padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--border);
      display: flex; align-items: center; gap: 10px;
      ${isRTL ? "flex-direction: row-reverse" : ""};
    }
    .st-card-head-icon {
      width: 36px; height: 36px; border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
      background: var(--green-dim); flex-shrink: 0;
    }
    .st-card-head-title { font-size: 15px; font-weight: 700; color: var(--ink); }
    .st-card-head-sub   { font-size: 12px; color: var(--ink-4); margin-top: 2px; }
    .st-card-body { padding: 1.5rem; }

    .st-info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .st-info-label {
      font-size: 11px; font-weight: 500; color: var(--ink-4);
      margin-bottom: 5px; display: flex; align-items: center; gap: 5px;
      ${isRTL ? "flex-direction: row-reverse; text-align: right" : ""};
    }
    .st-info-val {
      font-size: 13.5px; font-weight: 500; color: var(--ink-2);
      padding: 9px 13px; background: var(--bg);
      border: 1.5px solid var(--border-2); border-radius: 10px;
      min-height: 40px; display: flex; align-items: center;
      ${isRTL ? "justify-content: flex-end" : ""};
    }
    .st-info-val.muted { color: var(--ink-4); font-style: italic; }

    .st-section-sep {
      font-size: 11px; font-weight: 600; letter-spacing: 0.06em;
      color: var(--ink-4); text-transform: uppercase;
      padding: 0.5rem 0; margin: 0.25rem 0;
      border-top: 1px solid var(--border);
      grid-column: 1 / -1;
      ${isRTL ? "text-align: right" : ""};
    }

    .st-field { margin-bottom: 1rem; }
    .st-field:last-of-type { margin-bottom: 0; }
    .st-label {
      display: block; font-size: 12px; font-weight: 500;
      color: var(--ink-2); margin-bottom: 6px;
      ${isRTL ? "text-align: right" : ""};
    }
    .st-input-wrap { position: relative; }
    .st-input {
      width: 100%; padding: 10px 14px;
      border: 1.5px solid var(--border-2); border-radius: 10px;
      font-size: 13.5px; color: var(--ink);
      font-family: var(--f); background: var(--bg);
      outline: none; transition: border-color 0.15s, box-shadow 0.15s;
      ${isRTL ? "text-align: right; padding-left: 40px" : "padding-right: 40px"};
    }
    .st-input:focus { border-color: var(--green); box-shadow: 0 0 0 3px rgba(34,197,94,0.1); background: var(--surface); }
    .st-eye {
      position: absolute; top: 50%;
      ${isRTL ? "left: 12px" : "right: 12px"};
      transform: translateY(-50%);
      background: none; border: none; cursor: pointer;
      color: var(--ink-4); padding: 0; display: flex; align-items: center;
    }
    .st-eye:hover { color: var(--ink-2); }

    .st-error   { font-size: 12px; color: #ef4444; margin-top: 8px; ${isRTL ? "text-align: right" : ""}; }
    .st-success { font-size: 12px; color: var(--green-text); margin-top: 8px; ${isRTL ? "text-align: right" : ""}; }

    .st-btn {
      margin-top: 1.25rem; display: flex; align-items: center; gap: 7px;
      padding: 10px 20px; border-radius: 10px; border: none;
      background: var(--green); color: #fff;
      font-size: 13px; font-weight: 600; cursor: pointer;
      font-family: var(--f); transition: opacity 0.12s;
      box-shadow: 0 2px 8px rgba(34,197,94,0.25);
      ${isRTL ? "flex-direction: row-reverse" : ""};
    }
    .st-btn:hover    { opacity: 0.88; }
    .st-btn:disabled { opacity: 0.45; cursor: not-allowed; }

    .st-notif-row {
      display: flex; justify-content: space-between; align-items: center;
      padding: 12px 0; border-bottom: 1px solid var(--border);
      ${isRTL ? "flex-direction: row-reverse" : ""};
    }
    .st-notif-row:last-child  { border-bottom: none; padding-bottom: 0; }
    .st-notif-row:first-child { padding-top: 0; }
    .st-notif-label { font-size: 13.5px; font-weight: 500; color: var(--ink); }
    .st-notif-desc  { font-size: 11px; color: var(--ink-4); margin-top: 2px; }
    .st-toggle { position: relative; width: 44px; height: 24px; flex-shrink: 0; }
    .st-toggle input { opacity: 0; width: 0; height: 0; }
    .st-toggle-slider {
      position: absolute; inset: 0; background: var(--border-2);
      border-radius: 999px; cursor: pointer; transition: background 0.2s;
    }
    .st-toggle-slider::before {
      content: ""; position: absolute; width: 18px; height: 18px;
      border-radius: 50%; background: white; top: 3px; left: 3px;
      transition: transform 0.2s; box-shadow: 0 1px 3px rgba(0,0,0,0.15);
    }
    .st-toggle input:checked + .st-toggle-slider { background: var(--green); }
    .st-toggle input:checked + .st-toggle-slider::before { transform: translateX(20px); }

    .st-lang-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .st-lang-btn {
      padding: 14px; border-radius: 12px; border: 2px solid var(--border-2);
      background: var(--bg); cursor: pointer; font-family: var(--f);
      transition: all 0.15s; display: flex; align-items: center;
      justify-content: center; gap: 8px;
      font-size: 14px; font-weight: 500; color: var(--ink-2);
    }
    .st-lang-btn:hover { border-color: var(--green); background: var(--green-bg); }
    .st-lang-btn.active { border-color: var(--green); background: var(--green-bg); color: var(--green-text); }
    .st-lang-check {
      width: 18px; height: 18px; border-radius: 50%; background: var(--green);
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
  `;

  return (
    <>
      <style>{css}</style>
      <div className="st">

        <div className="st-header">
          <h1 className="st-title">{tx.title}</h1>
          <p className="st-sub">{tx.subtitle}</p>
        </div>

        <div className="st-sections">

          <div className="st-card">
            <div className="st-card-head">
              <div className="st-card-head-icon">
                <User size={16} color="var(--green-text)" />
              </div>
              <div>
                <div className="st-card-head-title">{tx.accountInfo}</div>
                <div className="st-card-head-sub">{tx.accountInfoSub}</div>
              </div>
            </div>
            <div className="st-card-body">
              <div className="st-info-grid">

                <div>
                  <div className="st-info-label"><User size={11} /> {tx.firstName}</div>
                  <div className="st-info-val">{userInfo?.first_name || "—"}</div>
                </div>
                <div>
                  <div className="st-info-label"><User size={11} /> {tx.lastName}</div>
                  <div className="st-info-val">{userInfo?.last_name || "—"}</div>
                </div>

                <div style={{ gridColumn: "1 / -1" }}>
                  <div className="st-info-label"><Mail size={11} /> {tx.emailLabel}</div>
                  <div className="st-info-val">{userInfo?.email || "—"}</div>
                </div>

                <div className="st-section-sep">
                  <Building size={11} style={{ display: "inline", marginRight: 5 }} />
                  {tx.agencyLabel}
                </div>

                <div style={{ gridColumn: "1 / -1" }}>
                  <div className="st-info-label"><Building size={11} /> {tx.agencyLabel}</div>
                  <div className={`st-info-val${!userInfo?.agency_name ? " muted" : ""}`}>
                    {userInfo?.agency_name || tx.noAgency}
                  </div>
                </div>

                {userInfo?.agency_phone && (
                  <div>
                    <div className="st-info-label"><Phone size={11} /> {tx.agencyPhone}</div>
                    <div className="st-info-val">{userInfo.agency_phone}</div>
                  </div>
                )}

                {userInfo?.agency_email && (
                  <div>
                    <div className="st-info-label"><Mail size={11} /> {tx.agencyEmail}</div>
                    <div className="st-info-val">{userInfo.agency_email}</div>
                  </div>
                )}

              </div>
            </div>
          </div>

          <div className="st-card">
            <div className="st-card-head">
              <div className="st-card-head-icon"><Lock size={16} color="var(--green-text)" /></div>
              <div>
                <div className="st-card-head-title">{tx.security}</div>
                <div className="st-card-head-sub">{tx.securitySub}</div>
              </div>
            </div>
            <div className="st-card-body">
              {[
                { label: tx.currentPwd, val: currentPwd, set: setCurrentPwd, show: showCurrent, toggle: () => setShowCurrent(v => !v) },
                { label: tx.newPwd,     val: newPwd,     set: setNewPwd,     show: showNew,     toggle: () => setShowNew(v => !v) },
                { label: tx.confirmPwd, val: confirmPwd, set: setConfirmPwd, show: showConfirm, toggle: () => setShowConfirm(v => !v) },
              ].map(({ label, val, set, show, toggle }) => (
                <div key={label} className="st-field">
                  <label className="st-label">{label}</label>
                  <div className="st-input-wrap">
                    <input type={show ? "text" : "password"} className="st-input"
                      value={val} onChange={e => set(e.target.value)} />
                    <button className="st-eye" onClick={toggle}>
                      {show ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>
              ))}
              {pwdError   && <div className="st-error">{pwdError}</div>}
              {pwdSuccess && <div className="st-success">{pwdSuccess}</div>}
              <button className="st-btn" onClick={handlePasswordSave}
                disabled={pwdSaving || !currentPwd || !newPwd || !confirmPwd}>
                <Save size={14} strokeWidth={2} />
                {pwdSaving ? tx.saving : tx.savePassword}
              </button>
            </div>
          </div>

          <div className="st-card">
            <div className="st-card-head">
              <div className="st-card-head-icon"><Bell size={16} color="var(--green-text)" /></div>
              <div>
                <div className="st-card-head-title">{tx.notifications}</div>
                <div className="st-card-head-sub">{tx.notifSub}</div>
              </div>
            </div>
            <div className="st-card-body">
              {[
                { label: tx.notifMonthly, desc: tx.notifMonthlyD, val: notifMonthly, set: setNotifMonthly },
                { label: tx.notifBooking, desc: tx.notifBookingD, val: notifBooking, set: setNotifBooking },
                { label: tx.notifPayment, desc: tx.notifPaymentD, val: notifPayment, set: setNotifPayment },
              ].map(({ label, desc, val, set }) => (
                <div key={label} className="st-notif-row">
                  <div>
                    <div className="st-notif-label">{label}</div>
                    <div className="st-notif-desc">{desc}</div>
                  </div>
                  <label className="st-toggle">
                    <input type="checkbox" checked={val} onChange={e => set(e.target.checked)} />
                    <span className="st-toggle-slider" />
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="st-card">
            <div className="st-card-head">
              <div className="st-card-head-icon"><Globe size={16} color="var(--green-text)" /></div>
              <div>
                <div className="st-card-head-title">{tx.language}</div>
                <div className="st-card-head-sub">{tx.languageSub}</div>
              </div>
            </div>
            <div className="st-card-body">
              <div className="st-lang-grid">
                <button className={`st-lang-btn${lang === "fr" ? " active" : ""}`} onClick={() => setLang("fr")}>
                  🇫🇷 {tx.french}
                  {lang === "fr" && <span className="st-lang-check"><Check size={11} color="white" strokeWidth={3} /></span>}
                </button>
                <button className={`st-lang-btn${lang === "ar" ? " active" : ""}`} onClick={() => setLang("ar")}>
                  🇸🇦 {tx.arabic}
                  {lang === "ar" && <span className="st-lang-check"><Check size={11} color="white" strokeWidth={3} /></span>}
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}