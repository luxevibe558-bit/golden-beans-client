"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { saveAdminSession, getAdminSession } from "@/lib/adminAuth";

const T = {
  emerald: "#0F3D2E", emeraldMid: "#1A5340",
  gold: "#D4A574", goldLight: "#E8C895",
  cream: "#FAF6F0", ivory: "#FFFBF5",
  border: "#E5DCC9", text: "#1A1208",
  textMuted: "#7A6B54", danger: "#C0392B",
};

const API = process.env.NEXT_PUBLIC_API_URL || "https://golden-beans-server.onrender.com/api";

export default function POSLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [totpToken, setTotpToken] = useState("");
  const [step, setStep] = useState<"credentials" | "2fa">("credentials");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const session = getAdminSession();
    if (session) router.replace("/pos");
  }, [router]);

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) { setError("Username and password required"); return; }
    setLoading(true); setError("");
    try {
      const res = await fetch(`${API}/admin-auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, totpToken: step === "2fa" ? totpToken : undefined }),
      });
      const data = await res.json();

      if (data.require2FA) { setStep("2fa"); setLoading(false); return; }
      if (!data.success) { setError(data.message || "Login failed"); setLoading(false); return; }

      saveAdminSession({
        token: data.data.token,
        name: data.data.user.name,
        username: data.data.user.username,
        role: data.data.user.role,
        permissions: data.data.user.permissions,
        expiresAt: data.data.user.expiresAt,
        totpVerifiedAt: Date.now(),
        sessionDuration: data.data.user.sessionDuration || 8,
      });

      router.replace("/pos");
    } catch { setError("Connection failed"); }
    finally { setLoading(false); }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: `linear-gradient(180deg, ${T.emerald} 0%, ${T.emeraldMid} 100%)`,
      display: "flex", alignItems: "center", justifyContent: "center", padding: "20px",
      fontFamily: "'Nunito', sans-serif",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=Nunito:wght@400;600;700;800;900&display=swap');
        @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        * { box-sizing: border-box; }
      `}</style>

      <div style={{ width: "100%", maxWidth: "400px", background: T.ivory, borderRadius: "24px", overflow: "hidden", boxShadow: "0 32px 64px rgba(0,0,0,0.3)", animation: "fadeIn 0.4s ease" }}>

        {/* Gold bar */}
        <div style={{ height: "4px", background: `linear-gradient(90deg, ${T.gold}, ${T.goldLight}, ${T.gold})` }} />

        {/* Header */}
        <div style={{ background: `linear-gradient(135deg, ${T.emerald}, ${T.emeraldMid})`, padding: "32px 28px 28px", textAlign: "center" }}>
          <div style={{ width: "80px", height: "80px", margin: "0 auto 16px", borderRadius: "20px", overflow: "hidden", background: "rgba(212,165,116,0.15)", border: "2px solid rgba(212,165,116,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <img src="/logo-small.png" alt="GB" draggable={false} style={{ width: "100%", height: "100%", objectFit: "contain", pointerEvents: "none" }} />
          </div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "26px", fontWeight: 800, color: T.gold, margin: "0 0 4px" }}>Golden Beans POS</h1>
          <p style={{ fontSize: "12px", color: "rgba(212,165,116,0.7)", margin: 0, fontWeight: 600 }}>Staff Login — Secure Access</p>
        </div>

        {/* Form */}
        <div style={{ padding: "28px" }}>
          {step === "credentials" ? (
            <>
              <div style={{ marginBottom: "14px" }}>
                <label style={{ display: "block", fontSize: "10px", fontWeight: 800, color: T.textMuted, marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.08em" }}>Username</label>
                <input type="text" placeholder="Enter username" value={username} onChange={e => setUsername(e.target.value)} autoFocus onKeyDown={e => e.key === "Enter" && handleLogin()}
                  style={{ width: "100%", padding: "13px 14px", borderRadius: "12px", border: `1.5px solid ${T.border}`, background: T.cream, color: T.text, fontSize: "15px", fontWeight: 600, outline: "none" }} />
              </div>
              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", fontSize: "10px", fontWeight: 800, color: T.textMuted, marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.08em" }}>Password</label>
                <div style={{ position: "relative" }}>
                  <input type={showPassword ? "text" : "password"} placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === "Enter" && handleLogin()}
                    style={{ width: "100%", padding: "13px 44px 13px 14px", borderRadius: "12px", border: `1.5px solid ${T.border}`, background: T.cream, color: T.text, fontSize: "15px", fontWeight: 600, outline: "none" }} />
                  <button onClick={() => setShowPassword(!showPassword)} style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: T.textMuted, fontSize: "18px" }}>
                    {showPassword ? "🙈" : "👁️"}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div style={{ marginBottom: "20px" }}>
              <div style={{ background: "rgba(212,165,116,0.1)", border: "1.5px solid rgba(212,165,116,0.3)", borderRadius: "14px", padding: "16px", marginBottom: "16px", textAlign: "center" }}>
                <p style={{ fontSize: "32px", margin: "0 0 8px" }}>🔐</p>
                <p style={{ fontWeight: 800, fontSize: "15px", color: T.emerald, margin: "0 0 4px" }}>Two-Factor Authentication</p>
                <p style={{ fontSize: "12px", color: T.textMuted, margin: 0, fontWeight: 600 }}>Enter 6-digit code from Google Authenticator</p>
              </div>
              <input type="number" placeholder="000000" value={totpToken} onChange={e => setTotpToken(e.target.value.slice(0, 6))} autoFocus onKeyDown={e => e.key === "Enter" && handleLogin()}
                style={{ width: "100%", padding: "16px", borderRadius: "12px", border: `1.5px solid ${T.border}`, background: T.cream, color: T.emerald, fontSize: "32px", fontWeight: 900, outline: "none", textAlign: "center", letterSpacing: "0.2em", fontFamily: "'DM Sans', sans-serif" }} />
              <button onClick={() => { setStep("credentials"); setTotpToken(""); setError(""); }} style={{ background: "none", border: "none", color: T.textMuted, fontSize: "12px", fontWeight: 700, cursor: "pointer", textDecoration: "underline", display: "block", margin: "10px auto 0" }}>
                ← Back
              </button>
            </div>
          )}

          {error && (
            <div style={{ background: "rgba(192,57,43,0.08)", border: "1.5px solid rgba(192,57,43,0.25)", borderRadius: "10px", padding: "10px 14px", marginBottom: "14px" }}>
              <p style={{ fontSize: "12px", color: T.danger, margin: 0, fontWeight: 700 }}>⚠ {error}</p>
            </div>
          )}

          <button onClick={handleLogin} disabled={loading}
            style={{ width: "100%", padding: "15px", background: loading ? T.textMuted : `linear-gradient(135deg, ${T.emerald}, ${T.emeraldMid})`, color: T.gold, border: "none", borderRadius: "14px", fontWeight: 900, fontSize: "16px", cursor: loading ? "wait" : "pointer", boxShadow: loading ? "none" : "0 8px 24px rgba(15,61,46,0.35)", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
            {loading ? (
              <><div style={{ width: "18px", height: "18px", borderRadius: "50%", border: "2.5px solid rgba(212,165,116,0.3)", borderTopColor: T.gold, animation: "spin 0.8s linear infinite" }} />Signing in...</>
            ) : (
              step === "2fa" ? "🔐 Verify & Enter" : "Sign In →"
            )}
          </button>

          <p style={{ fontSize: "10px", color: T.textMuted, textAlign: "center", margin: "16px 0 0", fontWeight: 600 }}>
            🔒 Staff access only · Golden Beans RMS
          </p>
        </div>
      </div>
    </div>
  );
}
