"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Bell, Globe, Eye, EyeOff, Check, Save, User, Mail, Building, Phone, Shield, AlertCircle, CheckCircle } from "lucide-react";
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
    passwordStrength: "Force du mot de passe",
    weak: "Faible",
    medium: "Moyen",
    strong: "Fort",
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
    passwordStrength: "قوة كلمة المرور",
    weak: "ضعيفة",
    medium: "متوسطة",
    strong: "قوية",
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

const GREEN = "#22c55e";
const GREEN_DARK = "#16a34a";
const GREEN_BG = "#f0fdf4";

export default function OwnerSettingsPage() {
  const router = useRouter();
  const { lang, setLang } = useLang();
  const tx = labels[lang];
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

  const getPasswordStrength = (password: string): { score: number; label: string; color: string } => {
    if (!password) return { score: 0, label: "", color: "#e5e7eb" };
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    
    if (score <= 2) return { score: 25, label: tx.weak, color: "#ef4444" };
    if (score <= 4) return { score: 60, label: tx.medium, color: "#f59e0b" };
    return { score: 100, label: tx.strong, color: GREEN };
  };

  const passwordStrength = getPasswordStrength(newPwd);

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

  return (
    <div style={{
      fontFamily: isRTL ? "'Cairo', system-ui" : "'Geist', system-ui",
      direction: isRTL ? "rtl" : "ltr",
      background: "#f9fafb",
      minHeight: "100vh",
      padding: "1.75rem 2rem"
    }}>
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: "2rem" }}>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#111827", margin: 0, letterSpacing: "-0.02em" }}>
            {tx.title}
          </h1>
          <p style={{ fontSize: "0.85rem", color: "#6b7280", marginTop: 4 }}>{tx.subtitle}</p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {/* Account Information Card */}
          <div style={{
            background: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: 16,
            overflow: "hidden",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
          }}>
            <div style={{
              padding: "1rem 1.5rem",
              borderBottom: "1px solid #f3f4f6",
              background: "#fafafa",
              display: "flex",
              alignItems: "center",
              gap: 10
            }}>
              <div style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: GREEN_BG,
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}>
                <User size={16} color={GREEN} />
              </div>
              <div>
                <div style={{ fontSize: "0.95rem", fontWeight: 600, color: "#111827" }}>{tx.accountInfo}</div>
                <div style={{ fontSize: "0.7rem", color: "#9ca3af", marginTop: 2 }}>{tx.accountInfoSub}</div>
              </div>
            </div>
            
            <div style={{ padding: "1.5rem" }}>
              <div style={{ display: "grid", gridTemplateColumns: isRTL ? "1fr 1fr" : "1fr 1fr", gap: "1rem" }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 500, color: "#9ca3af", marginBottom: 5, display: "flex", alignItems: "center", gap: 5 }}>
                    <User size={11} /> {tx.firstName}
                  </div>
                  <div style={{
                    fontSize: 13.5,
                    fontWeight: 500,
                    color: "#374151",
                    padding: "9px 13px",
                    background: "#f9fafb",
                    border: "1.5px solid #f3f4f6",
                    borderRadius: 10
                  }}>
                    {userInfo?.first_name || "—"}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 500, color: "#9ca3af", marginBottom: 5, display: "flex", alignItems: "center", gap: 5 }}>
                    <User size={11} /> {tx.lastName}
                  </div>
                  <div style={{
                    fontSize: 13.5,
                    fontWeight: 500,
                    color: "#374151",
                    padding: "9px 13px",
                    background: "#f9fafb",
                    border: "1.5px solid #f3f4f6",
                    borderRadius: 10
                  }}>
                    {userInfo?.last_name || "—"}
                  </div>
                </div>
                <div style={{ gridColumn: "1 / -1" }}>
                  <div style={{ fontSize: 11, fontWeight: 500, color: "#9ca3af", marginBottom: 5, display: "flex", alignItems: "center", gap: 5 }}>
                    <Mail size={11} /> {tx.emailLabel}
                  </div>
                  <div style={{
                    fontSize: 13.5,
                    fontWeight: 500,
                    color: "#374151",
                    padding: "9px 13px",
                    background: "#f9fafb",
                    border: "1.5px solid #f3f4f6",
                    borderRadius: 10
                  }}>
                    {userInfo?.email || "—"}
                  </div>
                </div>
                
                {/* Agency Section Separator */}
                <div style={{
                  gridColumn: "1 / -1",
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: "0.06em",
                  color: "#9ca3af",
                  textTransform: "uppercase",
                  padding: "0.5rem 0",
                  marginTop: "0.25rem",
                  borderTop: "1px solid #f3f4f6",
                  display: "flex",
                  alignItems: "center",
                  gap: 6
                }}>
                  <Building size={11} /> {tx.agencyLabel}
                </div>
                
                <div style={{ gridColumn: "1 / -1" }}>
                  <div style={{ fontSize: 11, fontWeight: 500, color: "#9ca3af", marginBottom: 5, display: "flex", alignItems: "center", gap: 5 }}>
                    <Building size={11} /> {tx.agencyLabel}
                  </div>
                  <div style={{
                    fontSize: 13.5,
                    fontWeight: 500,
                    color: userInfo?.agency_name ? "#374151" : "#9ca3af",
                    padding: "9px 13px",
                    background: "#f9fafb",
                    border: "1.5px solid #f3f4f6",
                    borderRadius: 10,
                    fontStyle: userInfo?.agency_name ? "normal" : "italic"
                  }}>
                    {userInfo?.agency_name || tx.noAgency}
                  </div>
                </div>
                
                {userInfo?.agency_phone && (
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 500, color: "#9ca3af", marginBottom: 5, display: "flex", alignItems: "center", gap: 5 }}>
                      <Phone size={11} /> {tx.agencyPhone}
                    </div>
                    <div style={{
                      fontSize: 13.5,
                      fontWeight: 500,
                      color: "#374151",
                      padding: "9px 13px",
                      background: "#f9fafb",
                      border: "1.5px solid #f3f4f6",
                      borderRadius: 10
                    }}>
                      {userInfo.agency_phone}
                    </div>
                  </div>
                )}
                
                {userInfo?.agency_email && (
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 500, color: "#9ca3af", marginBottom: 5, display: "flex", alignItems: "center", gap: 5 }}>
                      <Mail size={11} /> {tx.agencyEmail}
                    </div>
                    <div style={{
                      fontSize: 13.5,
                      fontWeight: 500,
                      color: "#374151",
                      padding: "9px 13px",
                      background: "#f9fafb",
                      border: "1.5px solid #f3f4f6",
                      borderRadius: 10
                    }}>
                      {userInfo.agency_email}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Security Card */}
          <div style={{
            background: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: 16,
            overflow: "hidden",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
          }}>
            <div style={{
              padding: "1rem 1.5rem",
              borderBottom: "1px solid #f3f4f6",
              background: "#fafafa",
              display: "flex",
              alignItems: "center",
              gap: 10
            }}>
              <div style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: GREEN_BG,
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}>
                <Shield size={16} color={GREEN} />
              </div>
              <div>
                <div style={{ fontSize: "0.95rem", fontWeight: 600, color: "#111827" }}>{tx.security}</div>
                <div style={{ fontSize: "0.7rem", color: "#9ca3af", marginTop: 2 }}>{tx.securitySub}</div>
              </div>
            </div>
            
            <div style={{ padding: "1.5rem" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {/* Current Password */}
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "#374151", marginBottom: 6 }}>{tx.currentPwd}</label>
                  <div style={{ position: "relative" }}>
                    <input
                      type={showCurrent ? "text" : "password"}
                      value={currentPwd}
                      onChange={(e) => setCurrentPwd(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "10px 40px 10px 14px",
                        border: "1.5px solid #e5e7eb",
                        borderRadius: 10,
                        fontSize: 13.5,
                        color: "#111827",
                        background: "#f9fafb",
                        outline: "none",
                        transition: "all 0.15s"
                      }}
                      onFocus={(e) => e.currentTarget.style.borderColor = GREEN}
                      onBlur={(e) => e.currentTarget.style.borderColor = "#e5e7eb"}
                    />
                    <button
                      onClick={() => setShowCurrent(!showCurrent)}
                      style={{
                        position: "absolute",
                        top: "50%",
                        right: 12,
                        transform: "translateY(-50%)",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "#9ca3af",
                        padding: 0
                      }}
                    >
                      {showCurrent ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "#374151", marginBottom: 6 }}>{tx.newPwd}</label>
                  <div style={{ position: "relative" }}>
                    <input
                      type={showNew ? "text" : "password"}
                      value={newPwd}
                      onChange={(e) => setNewPwd(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "10px 40px 10px 14px",
                        border: "1.5px solid #e5e7eb",
                        borderRadius: 10,
                        fontSize: 13.5,
                        color: "#111827",
                        background: "#f9fafb",
                        outline: "none",
                        transition: "all 0.15s"
                      }}
                      onFocus={(e) => e.currentTarget.style.borderColor = GREEN}
                      onBlur={(e) => e.currentTarget.style.borderColor = "#e5e7eb"}
                    />
                    <button
                      onClick={() => setShowNew(!showNew)}
                      style={{
                        position: "absolute",
                        top: "50%",
                        right: 12,
                        transform: "translateY(-50%)",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "#9ca3af",
                        padding: 0
                      }}
                    >
                      {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  
                  {/* Password Strength Indicator */}
                  {newPwd && (
                    <div style={{ marginTop: 8 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                        <span style={{ fontSize: 10.5, color: "#9ca3af" }}>{tx.passwordStrength}</span>
                        <span style={{ fontSize: 10.5, fontWeight: 500, color: passwordStrength.color }}>{passwordStrength.label}</span>
                      </div>
                      <div style={{ width: "100%", height: 4, background: "#e5e7eb", borderRadius: 2, overflow: "hidden" }}>
                        <div style={{ width: `${passwordStrength.score}%`, height: "100%", background: passwordStrength.color, borderRadius: 2, transition: "width 0.3s ease" }} />
                      </div>
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "#374151", marginBottom: 6 }}>{tx.confirmPwd}</label>
                  <div style={{ position: "relative" }}>
                    <input
                      type={showConfirm ? "text" : "password"}
                      value={confirmPwd}
                      onChange={(e) => setConfirmPwd(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "10px 40px 10px 14px",
                        border: "1.5px solid #e5e7eb",
                        borderRadius: 10,
                        fontSize: 13.5,
                        color: "#111827",
                        background: "#f9fafb",
                        outline: "none",
                        transition: "all 0.15s"
                      }}
                      onFocus={(e) => e.currentTarget.style.borderColor = GREEN}
                      onBlur={(e) => e.currentTarget.style.borderColor = "#e5e7eb"}
                    />
                    <button
                      onClick={() => setShowConfirm(!showConfirm)}
                      style={{
                        position: "absolute",
                        top: "50%",
                        right: 12,
                        transform: "translateY(-50%)",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "#9ca3af",
                        padding: 0
                      }}
                    >
                      {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Error/Success Messages */}
              {pwdError && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#ef4444", marginTop: 12, padding: "8px 12px", background: "#fef2f2", borderRadius: 8 }}>
                  <AlertCircle size={14} />
                  {pwdError}
                </div>
              )}
              {pwdSuccess && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: GREEN, marginTop: 12, padding: "8px 12px", background: GREEN_BG, borderRadius: 8 }}>
                  <CheckCircle size={14} />
                  {pwdSuccess}
                </div>
              )}

              <button
                onClick={handlePasswordSave}
                disabled={pwdSaving || !currentPwd || !newPwd || !confirmPwd}
                style={{
                  marginTop: "1.25rem",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "10px 20px",
                  borderRadius: 10,
                  border: "none",
                  background: GREEN,
                  color: "#fff",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  transition: "opacity 0.15s",
                  opacity: (pwdSaving || !currentPwd || !newPwd || !confirmPwd) ? 0.5 : 1
                }}
              >
                <Save size={14} />
                {pwdSaving ? tx.saving : tx.savePassword}
              </button>
            </div>
          </div>

          {/* Notifications Card */}
          <div style={{
            background: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: 16,
            overflow: "hidden",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
          }}>
            <div style={{
              padding: "1rem 1.5rem",
              borderBottom: "1px solid #f3f4f6",
              background: "#fafafa",
              display: "flex",
              alignItems: "center",
              gap: 10
            }}>
              <div style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: GREEN_BG,
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}>
                <Bell size={16} color={GREEN} />
              </div>
              <div>
                <div style={{ fontSize: "0.95rem", fontWeight: 600, color: "#111827" }}>{tx.notifications}</div>
                <div style={{ fontSize: "0.7rem", color: "#9ca3af", marginTop: 2 }}>{tx.notifSub}</div>
              </div>
            </div>
            
            <div style={{ padding: "1.5rem" }}>
              {[
                { label: tx.notifMonthly, desc: tx.notifMonthlyD, val: notifMonthly, set: setNotifMonthly },
                { label: tx.notifBooking, desc: tx.notifBookingD, val: notifBooking, set: setNotifBooking },
                { label: tx.notifPayment, desc: tx.notifPaymentD, val: notifPayment, set: setNotifPayment },
              ].map(({ label, desc, val, set }, idx) => (
                <div key={label} style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: idx === 0 ? "0 0 12px 0" : "12px 0",
                  borderBottom: idx === 2 ? "none" : "1px solid #f3f4f6"
                }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: "#111827" }}>{label}</div>
                    <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>{desc}</div>
                  </div>
                  <label style={{ position: "relative", width: 44, height: 24, flexShrink: 0 }}>
                    <input
                      type="checkbox"
                      checked={val}
                      onChange={(e) => set(e.target.checked)}
                      style={{ opacity: 0, width: 0, height: 0 }}
                    />
                    <span style={{
                      position: "absolute",
                      inset: 0,
                      background: val ? GREEN : "#e5e7eb",
                      borderRadius: 999,
                      cursor: "pointer",
                      transition: "background 0.2s"
                    }}>
                      <span style={{
                        position: "absolute",
                        width: 18,
                        height: 18,
                        borderRadius: "50%",
                        background: "white",
                        top: 3,
                        left: val ? 23 : 3,
                        transition: "transform 0.2s, left 0.2s",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.15)"
                      }} />
                    </span>
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Language Card */}
          <div style={{
            background: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: 16,
            overflow: "hidden",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
          }}>
            <div style={{
              padding: "1rem 1.5rem",
              borderBottom: "1px solid #f3f4f6",
              background: "#fafafa",
              display: "flex",
              alignItems: "center",
              gap: 10
            }}>
              <div style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: GREEN_BG,
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}>
                <Globe size={16} color={GREEN} />
              </div>
              <div>
                <div style={{ fontSize: "0.95rem", fontWeight: 600, color: "#111827" }}>{tx.language}</div>
                <div style={{ fontSize: "0.7rem", color: "#9ca3af", marginTop: 2 }}>{tx.languageSub}</div>
              </div>
            </div>
            
            <div style={{ padding: "1.5rem" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <button
                  onClick={() => setLang("fr")}
                  style={{
                    padding: "12px",
                    borderRadius: 10,
                    border: lang === "fr" ? `2px solid ${GREEN}` : "1.5px solid #e5e7eb",
                    background: lang === "fr" ? GREEN_BG : "#f9fafb",
                    cursor: "pointer",
                    fontFamily: "inherit",
                    transition: "all 0.15s",
                    fontSize: 13,
                    fontWeight: 500,
                    color: lang === "fr" ? GREEN : "#374151",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8
                  }}
                >
                  🇫🇷 {tx.french}
                  {lang === "fr" && <Check size={14} color={GREEN} />}
                </button>
                <button
                  onClick={() => setLang("ar")}
                  style={{
                    padding: "12px",
                    borderRadius: 10,
                    border: lang === "ar" ? `2px solid ${GREEN}` : "1.5px solid #e5e7eb",
                    background: lang === "ar" ? GREEN_BG : "#f9fafb",
                    cursor: "pointer",
                    fontFamily: "inherit",
                    transition: "all 0.15s",
                    fontSize: 13,
                    fontWeight: 500,
                    color: lang === "ar" ? GREEN : "#374151",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8
                  }}
                >
                  🇸🇦 {tx.arabic}
                  {lang === "ar" && <Check size={14} color={GREEN} />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}