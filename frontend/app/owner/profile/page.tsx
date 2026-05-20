// frontend/app/owner/profile/page.tsx
"use client";

import { useEffect, useState } from "react";
import { 
  User, 
  Mail, 
  Building, 
  Briefcase, 
  Camera, 
  Save, 
  X,
  CheckCircle,
  AlertCircle,
  Edit2
} from "lucide-react";
import { getCurrentUser, updateUserProfile, uploadProfileImage } from "@/lib/axios";

interface UserType {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  role: string;
  picture?: string | null;
  picture_url?: string | null;
  agency?: { id: number; name: string } | null;
  created_at?: string;
}

const ROLES: Record<string, { label: string; color: string; bg: string; border: string }> = {
  admin: { label: "Administrateur", color: "#8b5cf6", bg: "#f5f3ff", border: "#ddd6fe" },
  owner: { label: "Propriétaire",   color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0" },
  staff: { label: "Staff",          color: "#2563eb", bg: "#eff6ff", border: "#bfdbfe" },
};

export default function OwnerProfilePage() {
  const [user, setUser] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
  });

  const loadUser = async () => {
    try {
      const userData = await getCurrentUser();
      setUser(userData);
      setFormData({
        first_name: userData.first_name || '',
        last_name: userData.last_name || '',
        email: userData.email || '',
      });
    } catch (error) {
      console.error('Error loading user:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUser();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setMessage({ type: 'error', text: 'Image trop grande (max 5 Mo)' });
        return;
      }
      if (!file.type.startsWith('image/')) {
        setMessage({ type: 'error', text: 'Fichier image requis' });
        return;
      }
      
      setImageFile(file);
      const preview = URL.createObjectURL(file);
      setImagePreview(preview);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    
    try {
      await updateUserProfile({
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
      });
      
      if (imageFile) {
        await uploadProfileImage(imageFile);
      }
      
      await loadUser();
      
      setMessage({ type: 'success', text: 'Profil mis à jour avec succès.' });
      setEditing(false);
      setImageFile(null);
      setImagePreview(null);
    } catch (error) {
      setMessage({ type: 'error', text: 'Erreur lors de la mise à jour.' });
    } finally {
      setSaving(false);
    }
  };

  const cancel = () => {
    setEditing(false);
    setImageFile(null);
    setImagePreview(null);
    setFormData({ first_name: user?.first_name || '', last_name: user?.last_name || '', email: user?.email || '' });
  };

  const getRoleLabel = (role: string) => {
    const roles: Record<string, string> = {
      admin: 'Administrator',
      owner: 'Property Owner',
      staff: 'Staff Member',
    };
    return roles[role] || role;
  };

  const getProfilePictureUrl = () => {
    if (imagePreview) return imagePreview;
    if (user?.picture_url) {
      if (user.picture_url.startsWith('http')) return user.picture_url;
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      return `${baseUrl}${user.picture_url}`;
    }
    return null;
  };

  const avatarSrc = imagePreview
    || (user?.picture_url?.startsWith("http")
        ? user.picture_url
        : user?.picture_url
          ? `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}${user.picture_url}`
          : null);

  const initials = `${user?.first_name?.[0] ?? ""}${user?.last_name?.[0] ?? ""}`.toUpperCase() || "–";
  const role = ROLES[user?.role ?? ""] ?? { label: getRoleLabel(user?.role || ""), color: "#6b7280", bg: "#f9fafb", border: "#e5e7eb" };

  if (loading) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"60vh" }}>
      <div style={{ width:36, height:36, border:"3px solid #f0fdf4", borderTop:"3px solid #22c55e", borderRadius:"50%", animation:"spin .8s linear infinite" }}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; }
        .pf {
          --green:    #22c55e;
          --g-dark:   #16a34a;
          --g-bg:     #f0fdf4;
          --g-ring:   rgba(34,197,94,.12);
          --ink:      #111827;
          --ink2:     #374151;
          --ink3:     #9ca3af;
          --ink4:     #d1d5db;
          --border:   #e5e7eb;
          --border2:  #f3f4f6;
          --bg:       #f9fafb;
          --surface:  #ffffff;
          --f:        'Geist', system-ui, sans-serif;
          font-family: var(--f);
          height: 100%;
          display: grid;
          grid-template-columns: 300px 1fr;
          grid-template-rows: auto 1fr;
          gap: 1.25rem;
          padding: 0;
          align-content: start;
        }

        /* ── Toast ── */
        .pf-toast {
          grid-column: 1 / -1;
          display: flex; align-items: center; gap: 9px;
          padding: 11px 16px; border-radius: 9px;
          font-size: 13px;
        }
        .pf-toast.ok  { background:#f0fdf4; border:1px solid #bbf7d0; color:#15803d; }
        .pf-toast.err { background:#fef2f2; border:1px solid #fecaca; color:#dc2626; }

        /* ── Left column ── */
        .pf-left {
          display: flex; flex-direction: column; gap: 1.25rem;
        }

        /* Avatar card */
        .pf-av-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 14px;
          padding: 2rem 1.5rem;
          display: flex; flex-direction: column; align-items: center;
          text-align: center;
          box-shadow: 0 1px 3px rgba(0,0,0,.04);
        }

        .pf-av {
          position: relative;
          width: 96px; height: 96px;
          border-radius: 14px;
          overflow: hidden;
          background: var(--g-bg);
          border: 2px solid var(--border);
          margin-bottom: 1rem;
          flex-shrink: 0;
        }
        .pf-av img { width:100%; height:100%; object-fit:cover; }
        .pf-av-initials {
          width:100%; height:100%;
          display:flex; align-items:center; justify-content:center;
          font-size:30px; font-weight:700;
          color: var(--g-dark); letter-spacing:-.02em;
        }
        .pf-cam {
          position:absolute; bottom:0; left:0; right:0;
          height:30px; display:flex; align-items:center; justify-content:center;
          background:rgba(0,0,0,.45); cursor:pointer;
          transition:opacity .15s;
          opacity: 0;
        }
        .pf-av:hover .pf-cam { opacity: 1; }
        .pf-cam-dis { cursor: not-allowed !important; }

        .pf-av-name {
          font-size: 17px; font-weight: 700;
          color: var(--ink); letter-spacing: -.02em;
          margin-bottom: 6px;
        }
        .pf-role-badge {
          font-size: 11px; font-weight: 500;
          padding: 3px 10px; border-radius: 5px;
          display: inline-block;
        }
        .pf-av-meta {
          width: 100%;
          margin-top: 1.25rem;
          border-top: 1px solid var(--border2);
          padding-top: 1.125rem;
          display: flex; flex-direction: column; gap: 9px;
        }
        .pf-meta-row {
          display:flex; align-items:center; gap:8px;
          font-size:12.5px; color:var(--ink3);
        }
        .pf-meta-row span { color:var(--ink2); font-weight:400; }

        /* ── Right column ── */
        .pf-right {
          display: flex; flex-direction: column; gap: 1.25rem;
        }

        .pf-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 14px;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0,0,0,.04);
        }
        .pf-card-head {
          display: flex; align-items: center; justify-content: space-between;
          padding: 1.125rem 1.5rem;
          border-bottom: 1px solid var(--border2);
        }
        .pf-card-title {
          font-size: 14px; font-weight: 600; color: var(--ink);
        }
        .pf-card-sub {
          font-size: 12px; color: var(--ink3); margin-top: 2px;
        }
        .pf-card-body {
          padding: 1.5rem;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.125rem;
        }
        .pf-card-body.single { grid-template-columns: 1fr; }

        /* Field */
        .pf-field {}
        .pf-field-label {
          font-size: 11.5px; font-weight: 500;
          color: var(--ink3); margin-bottom: 6px;
          display: flex; align-items: center; gap: 5px;
          letter-spacing: .01em;
        }
        .pf-field-val {
          font-size: 14px; color: var(--ink2);
          padding: 9.5px 13px;
          background: var(--bg);
          border: 1.5px solid var(--border2);
          border-radius: 8px;
          font-family: var(--f);
          min-height: 40px; display:flex; align-items:center;
        }
        .pf-input {
          font-size: 14px; color: var(--ink);
          padding: 9.5px 13px;
          background: #fff;
          border: 1.5px solid var(--border);
          border-radius: 8px;
          font-family: var(--f);
          width: 100%; outline: none;
          -webkit-appearance: none;
          transition: border-color .15s, box-shadow .15s;
        }
        .pf-input::placeholder { color: var(--ink4); }
        .pf-input:focus {
          border-color: var(--green);
          box-shadow: 0 0 0 3px var(--g-ring);
        }

        /* Buttons */
        .pf-btn {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 8px 18px; border-radius: 8px;
          font-family: var(--f); font-size: 13px; font-weight: 500;
          cursor: pointer; border: none; transition: all .14s;
        }
        .pf-btn-green {
          background: var(--green); color: #fff;
        }
        .pf-btn-green:hover:not(:disabled) {
          background: var(--g-dark);
          box-shadow: 0 3px 10px rgba(34,197,94,.25);
          transform: translateY(-1px);
        }
        .pf-btn-green:disabled { opacity:.5; cursor:not-allowed; }
        .pf-btn-outline {
          background: #fff; color: var(--ink2);
          border: 1.5px solid var(--border) !important;
        }
        .pf-btn-outline:hover { background: var(--bg); }
      `}</style>

      <div className="pf">

        {/* Toast */}
        {message && (
          <div className={`pf-toast ${message.type === "success" ? "ok" : "err"}`}>
            {message.type === "success" ? <CheckCircle size={14}/> : <AlertCircle size={14}/>}
            {message.text}
            <button onClick={() => setMessage(null)} style={{ marginLeft:"auto", background:"none", border:"none", cursor:"pointer", color:"inherit", padding:0, display:"flex" }}>
              <X size={13}/>
            </button>
          </div>
        )}

        {/* ══ LEFT ══ */}
        <div className="pf-left">

          {/* Avatar card */}
          <div className="pf-av-card">
            <div className="pf-av">
              {avatarSrc
                ? <img src={avatarSrc} alt={user?.full_name}/>
                : <div className="pf-av-initials">{initials}</div>
              }
              <label className={`pf-cam${!editing ? " pf-cam-dis" : ""}`}>
                <Camera size={14} color="#fff"/>
                <input type="file" accept="image/*" onChange={handleImageSelect} disabled={!editing} style={{ display:"none" }}/>
              </label>
            </div>

            <div className="pf-av-name">{user?.full_name || "—"}</div>
            <span className="pf-role-badge" style={{ color:role.color, background:role.bg, border:`1px solid ${role.border}` }}>
              {role.label}
            </span>

            <div className="pf-av-meta">
              <div className="pf-meta-row">
                <Mail size={13}/>
                <span>{user?.email}</span>
              </div>
              {user?.agency && (
                <div className="pf-meta-row">
                  <Building size={13}/>
                  <span>{user.agency.name}</span>
                </div>
              )}
              {user?.created_at && (
                <div className="pf-meta-row">
                  <Briefcase size={13}/>
                  <span>Depuis {new Date(user.created_at).toLocaleDateString("fr-FR", { year:"numeric", month:"long" })}</span>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* ══ RIGHT ══ */}
        <div className="pf-right">

          {/* Personal info card */}
          <div className="pf-card">
            <div className="pf-card-head">
              <div>
                <div className="pf-card-title">Informations personnelles</div>
                <div className="pf-card-sub">Gérez vos informations de profil</div>
              </div>
              {!editing
                ? <button className="pf-btn pf-btn-outline" onClick={() => setEditing(true)}>
                    <Edit2 size={13}/> Modifier
                  </button>
                : <div style={{ display:"flex", gap:8 }}>
                    <button className="pf-btn pf-btn-outline" onClick={cancel} disabled={saving}>
                      <X size={13}/> Annuler
                    </button>
                    <button className="pf-btn pf-btn-green" onClick={handleSave} disabled={saving}>
                      {saving
                        ? <><span style={{ width:12, height:12, border:"2px solid rgba(255,255,255,.4)", borderTop:"2px solid #fff", borderRadius:"50%", animation:"spin .7s linear infinite", display:"inline-block" }}/> Enregistrement…</>
                        : <><Save size={13}/> Enregistrer</>
                      }
                    </button>
                  </div>
              }
            </div>

            <div className="pf-card-body">
              {/* Prénom */}
              <div className="pf-field">
                <div className="pf-field-label"><User size={11}/> Prénom</div>
                {editing
                  ? <input className="pf-input" name="first_name" value={formData.first_name} onChange={handleInputChange} placeholder="Prénom"/>
                  : <div className="pf-field-val">{user?.first_name || "—"}</div>
                }
              </div>

              {/* Nom */}
              <div className="pf-field">
                <div className="pf-field-label"><User size={11}/> Nom</div>
                {editing
                  ? <input className="pf-input" name="last_name" value={formData.last_name} onChange={handleInputChange} placeholder="Nom de famille"/>
                  : <div className="pf-field-val">{user?.last_name || "—"}</div>
                }
              </div>

              {/* Email */}
              <div className="pf-field">
                <div className="pf-field-label"><Mail size={11}/> Adresse email</div>
                {editing
                  ? <input className="pf-input" name="email" type="email" value={formData.email} onChange={handleInputChange} placeholder="email@exemple.com"/>
                  : <div className="pf-field-val">{user?.email || "—"}</div>
                }
              </div>

              {/* Rôle */}
              <div className="pf-field">
                <div className="pf-field-label"><Briefcase size={11}/> Rôle</div>
                <div className="pf-field-val" style={{ background:"transparent", border:"none", padding:"9.5px 0" }}>
                  <span className="pf-role-badge" style={{ color:role.color, background:role.bg, border:`1px solid ${role.border}` }}>
                    {role.label}
                  </span>
                </div>
              </div>

              {/* Agence */}
              {user?.agency && (
                <div className="pf-field">
                  <div className="pf-field-label"><Building size={11}/> Agence</div>
                  <div className="pf-field-val">{user.agency.name}</div>
                </div>
              )}

              {/* Membre depuis */}
              {user?.created_at && (
                <div className="pf-field">
                  <div className="pf-field-label"><Briefcase size={11}/> Membre depuis</div>
                  <div className="pf-field-val">
                    {new Date(user.created_at).toLocaleDateString("fr-FR", { day:"numeric", month:"long", year:"numeric" })}
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>

      </div>
    </>
  );
}