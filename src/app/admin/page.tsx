"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { saveAdminSession, getAdminSession } from "@/lib/adminAuth";

const T = {
  emerald: "#0F3D2E", emeraldMid: "#1A5340",
  gold: "#D4A574", goldLight: "#E8C895",
  cream: "#FAF6F0", ivory: "#FFFBF5",
  border: "#E5DCC9", text: "#1A1208",
  textMuted: "#7A6B54", danger: "#C0392B", success: "#4A8B4A",
};

const API = process.env.NEXT_PUBLIC_API_URL || "https://golden-beans-server.onrender.com/api";

export default function AdminLoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<"credentials" | "2fa">("credentials");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [totpToken, setTotpToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const session = getAdminSession();
    if (session) router.replace("/admin/dashboard");
  }, [router]);

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      setError("Please enter username and password");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API}/admin-auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          password,
          totpToken: step === "2fa" ? totpToken : undefined,
        }),
      });
      const data = await res.json();

      if (data.require2FA) {
        setStep("2fa");
        setLoading(false);
        return;
      }

      if (!data.success) {
        setError(data.message || "Login failed");
        setLoading(false);
        return;
      }

      // Save full session with new format
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

      router.replace("/admin/dashboard");
    } catch {
      setError("Connection failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: `linear-gradient(180deg, ${T.emerald} 0%, ${T.emeraldMid} 100%)`,
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "20px",
    }}>
      <div style={{
        width: "100%", maxWidth: "400px",
        background: T.ivory, borderRadius: "24px",
        overflow: "hidden", boxShadow: "0 32px 64px rgba(0,0,0,0.3)",
        animation: "fadeIn 0.4s ease",
      }}>
        <style>{`
          @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
          @keyframes spin { to { transform: rotate(360deg); } }
          * { box-sizing: border-box; }
          input { font-family: 'Inter', sans-serif; }
        `}</style>

        <div style={{ height: "4px", background: `linear-gradient(90deg, ${T.gold}, ${T.goldLight}, ${T.gold})` }} />

        <div style={{ background: `linear-gradient(135deg, ${T.emerald}, ${T.emeraldMid})`, padding: "28px 28px 24px", textAlign: "center" }}>
          <div style={{ width: "72px", height: "72px", margin: "0 auto 16px", borderRadius: "18px", overflow: "hidden", background: "rgba(212,165,116,0.15)", border: "2px solid rgba(212,165,116,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <img src="/logo-small.png" alt="GB" draggable={false} style={{ width: "100%", height: "100%", objectFit: "contain", pointerEvents: "none" }} />
          </div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "24px", fontWeight: 800, color: T.gold, margin: "0 0 4px", letterSpacing: "-0.02em" }}>Admin Panel</h1>
          <p style={{ fontSize: "12px", color: "rgba(212,165,116,0.7)", margin: 0, fontWeight: 600 }}>Golden Beans Cafe & Bistro</p>
        </div>

        <div style={{ padding: "24px 28px 28px" }}>
          {step === "credentials" ? (
            <>
              <p style={{ fontSize: "13px", fontWeight: 700, color: T.textMuted, margin: "0 0 16px", textAlign: "center" }}>Sign in to continue</p>
              <div style={{ marginBottom: "12px" }}>
                <label style={{ display: "block", fontSize: "10px", fontWeight: 800, color: T.textMuted, marginBottom: "6px", letterSpacing: "0.08em", textTransform: "uppercase" }}>Username</label>
                <input type="text" placeholder="admin" value={username} onChange={e => setUsername(e.target.value)} autoFocus onKeyDown={e => e.key === "Enter" && handleLogin()}
                  style={{ width: "100%", padding: "12px 14px", borderRadius: "10px", border: `1.5px solid ${T.border}`, background: T.cream, color: T.text, fontSize: "16px", fontWeight: 600, outline: "none" }} />
              </div>
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "10px", fontWeight: 800, color: T.textMuted, marginBottom: "6px", letterSpacing: "0.08em", textTransform: "uppercase" }}>Password</label>
                <div style={{ position: "relative" }}>
                  <input type={showPassword ? "text" : "password"} placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === "Enter" && handleLogin()}
                    style={{ width: "100%", padding: "12px 44px 12px 14px", borderRadius: "10px", border: `1.5px solid ${T.border}`, background: T.cream, color: T.text, fontSize: "16px", fontWeight: 600, outline: "none" }} />
                  <button onClick={() => setShowPassword(!showPassword)} style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: T.textMuted, fontSize: "16px" }}>
                    {showPassword ? "🙈" : "👁️"}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              <div style={{ background: "rgba(212,165,116,0.1)", border: "1.5px solid rgba(212,165,116,0.3)", borderRadius: "12px", padding: "14px", marginBottom: "16px", textAlign: "center" }}>
                <p style={{ fontSize: "28px", margin: "0 0 6px" }}>🔐</p>
                <p style={{ fontWeight: 800, fontSize: "14px", color: T.emerald, margin: "0 0 4px" }}>Two-Factor Authentication</p>
                <p style={{ fontSize: "12px", color: T.textMuted, margin: 0, fontWeight: 600 }}>Open Google Authenticator and enter the 6-digit code</p>
              </div>
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "10px", fontWeight: 800, color: T.textMuted, marginBottom: "6px", letterSpacing: "0.08em", textTransform: "uppercase" }}>Authenticator Code</label>
                <input type="number" placeholder="000000" value={totpToken} onChange={e => setTotpToken(e.target.value.slice(0, 6))} autoFocus onKeyDown={e => e.key === "Enter" && handleLogin()}
                  style={{ width: "100%", padding: "16px 14px", borderRadius: "10px", border: `1.5px solid ${T.border}`, background: T.cream, color: T.emerald, fontSize: "28px", fontWeight: 900, outline: "none", textAlign: "center", letterSpacing: "0.2em", fontFamily: "'DM Sans', sans-serif" }} />
              </div>
              <button onClick={() => { setStep("credentials"); setTotpToken(""); setError(""); }}
                style={{ background: "none", border: "none", color: T.textMuted, fontSize: "12px", fontWeight: 700, cursor: "pointer", textDecoration: "underline", display: "block", margin: "0 auto 12px" }}>
                ← Back to login
              </button>
            </>
          )}

          {error && (
            <div style={{ background: "rgba(192,57,43,0.08)", border: "1.5px solid rgba(192,57,43,0.25)", borderRadius: "8px", padding: "10px 12px", marginBottom: "14px" }}>
              <p style={{ fontSize: "12px", color: T.danger, margin: 0, fontWeight: 700 }}>⚠ {error}</p>
            </div>
          )}

          <button onClick={handleLogin} disabled={loading}
            style={{ width: "100%", padding: "14px", background: loading ? T.textMuted : `linear-gradient(135deg, ${T.emerald}, ${T.emeraldMid})`, color: T.gold, border: "none", borderRadius: "12px", fontWeight: 800, fontSize: "15px", cursor: loading ? "wait" : "pointer", boxShadow: loading ? "none" : "0 8px 24px rgba(15,61,46,0.3)", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
            {loading ? (
              <><div style={{ width: "16px", height: "16px", borderRadius: "50%", border: "2px solid rgba(212,165,116,0.3)", borderTopColor: T.gold, animation: "spin 0.8s linear infinite" }} />Signing in...</>
            ) : (
              step === "2fa" ? "🔐 Verify Code" : "Sign In →"
            )}
          </button>

          <p style={{ fontSize: "10px", color: T.textMuted, textAlign: "center", margin: "16px 0 0", fontWeight: 600 }}>
            🔒 Secure admin access · Golden Beans RMS
          </p>
        </div>
      </div>
    </div>
  );
}
