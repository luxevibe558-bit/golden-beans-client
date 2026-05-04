"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getAdminSession, needsTOTPReVerify, saveAdminSession } from "@/lib/adminAuth";

const API = process.env.NEXT_PUBLIC_API_URL || "https://golden-beans-server.onrender.com/api";

const T = {
  emerald: "#0F3D2E", emeraldMid: "#1A5340",
  gold: "#D4A574", goldLight: "#E8C895",
  cream: "#FAF6F0", ivory: "#FFFBF5",
  border: "#E5DCC9", danger: "#C0392B", textMuted: "#7A6B54",
};

// Pages that don't need auth
const PUBLIC_PATHS = ["/pos/login"];

function TOTPReVerify({ onVerified, onLogout }: { onVerified: () => void; onLogout: () => void }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {
    if (code.length !== 6) { setError("6-digit code required"); return; }
    setLoading(true); setError("");
    try {
      const session = getAdminSession();
      if (!session) { onLogout(); return; }
      const res = await fetch(`${API}/admin-auth/verify-totp`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-token": session.token },
        body: JSON.stringify({ totpToken: code }),
      }).then(r => r.json());
      if (res.success) {
        saveAdminSession({ ...session, totpVerifiedAt: Date.now() });
        onVerified();
      } else { setError("Invalid code — try again"); }
    } catch { setError("Connection failed"); }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: "100vh", background: `linear-gradient(180deg, ${T.emerald} 0%, ${T.emeraldMid} 100%)`, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px", fontFamily: "'Nunito', sans-serif" }}>
      <div style={{ background: T.ivory, borderRadius: "24px", padding: "36px", width: "100%", maxWidth: "360px", boxShadow: "0 32px 64px rgba(0,0,0,0.4)", textAlign: "center" }}>
        <div style={{ height: "4px", background: `linear-gradient(90deg, ${T.gold}, ${T.goldLight}, ${T.gold})`, borderRadius: "4px 4px 0 0", margin: "-36px -36px 28px" }} />
        <p style={{ fontSize: "52px", margin: "0 0 16px" }}>🔐</p>
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "24px", fontWeight: 800, color: T.emerald, margin: "0 0 8px" }}>Shift Ended</h2>
        <p style={{ fontSize: "13px", color: T.textMuted, margin: "0 0 24px", fontWeight: 600, lineHeight: 1.6 }}>Your session has expired.<br />Enter TOTP to continue.</p>
        <input value={code} onChange={e => { setCode(e.target.value.replace(/\D/g, "").slice(0, 6)); setError(""); }}
          placeholder="000000" maxLength={6} onKeyDown={e => e.key === "Enter" && handleVerify()}
          style={{ width: "100%", padding: "16px", borderRadius: "14px", border: `2px solid ${error ? T.danger : T.border}`, background: T.cream, fontSize: "28px", fontWeight: 900, color: T.emerald, textAlign: "center", letterSpacing: "10px", outline: "none", boxSizing: "border-box", marginBottom: "12px", fontFamily: "'DM Sans', sans-serif" }} />
        {error && <p style={{ fontSize: "12px", color: T.danger, fontWeight: 700, margin: "0 0 12px" }}>⚠ {error}</p>}
        <button onClick={handleVerify} disabled={loading || code.length !== 6}
          style={{ width: "100%", padding: "14px", borderRadius: "14px", border: "none", background: code.length === 6 ? `linear-gradient(135deg, ${T.emerald}, ${T.emeraldMid})` : "#E5DCC9", color: code.length === 6 ? T.gold : T.textMuted, fontWeight: 900, fontSize: "15px", cursor: code.length === 6 ? "pointer" : "not-allowed", marginBottom: "12px" }}>
          {loading ? "Verifying..." : "✓ Verify & Continue"}
        </button>
        <button onClick={onLogout} style={{ background: "none", border: "none", color: T.textMuted, fontSize: "12px", cursor: "pointer", textDecoration: "underline", fontWeight: 600 }}>
          Sign out
        </button>
      </div>
    </div>
  );
}

export default function POSAuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [status, setStatus] = useState<"loading" | "ok" | "reVerify" | "redirect">("loading");

  useEffect(() => {
    // Public paths — no auth needed
    if (PUBLIC_PATHS.some(p => pathname.startsWith(p))) {
      setStatus("ok");
      return;
    }

    const session = getAdminSession();

    // No session → redirect to login
    if (!session) {
      router.replace("/pos/login");
      setStatus("redirect");
      return;
    }

    // TOTP re-verify needed (only for admin role)
    if (session.role === "admin" && needsTOTPReVerify(session)) {
      setStatus("reVerify");
      return;
    }

    setStatus("ok");
  }, [pathname, router]);

  const handleLogout = () => {
    localStorage.removeItem("gb_admin_session");
    localStorage.removeItem("gb_admin_token");
    localStorage.removeItem("gb_admin_user");
    router.replace("/pos/login");
  };

  if (status === "loading") {
    return (
      <div style={{ minHeight: "100vh", background: T.emerald, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: "40px", height: "40px", borderRadius: "50%", border: `3px solid rgba(212,165,116,0.3)`, borderTopColor: T.gold, animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (status === "reVerify") {
    return <TOTPReVerify onVerified={() => setStatus("ok")} onLogout={handleLogout} />;
  }

  if (status === "redirect") return null;

  return <>{children}</>;
}
