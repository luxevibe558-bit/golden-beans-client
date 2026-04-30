"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";

const T = {
  emerald: "#0F3D2E",
  emeraldMid: "#1A5340",
  emeraldLight: "#2D7A5F",
  gold: "#D4A574",
  goldLight: "#E8C895",
  goldDark: "#B08550",
  cream: "#FAF6F0",
  creamDark: "#F0E8DA",
  ivory: "#FFFBF5",
  text: "#2C2418",
  textMuted: "#7A6B54",
  success: "#4A8B4A",
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Html5QrcodeScanner = any;

export default function HomePage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [manualCode, setManualCode] = useState("");
  const [showManual, setShowManual] = useState(false);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    // PWA standalone mode માં waiter app open કરો
    if (window.matchMedia('(display-mode: standalone)').matches) {
      const path = window.location.pathname;
      if (path === '/' || path === '/waiter-app') {
        router.replace('/waiter');
        return;
      }
    }
  }, [router]);

  useEffect(() => {
    async function checkActiveOrder() {
      try {
        const savedTableId = localStorage.getItem("gb_active_table");
        const savedOrderId = localStorage.getItem("gb_active_order");
        if (!savedTableId || !savedOrderId) { setChecking(false); return; }

        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://golden-beans-server.onrender.com/api";
        const res = await fetch(`${apiUrl}/orders/${savedOrderId}`, {
          headers: { "ngrok-skip-browser-warning": "true" },
        });
        const data = await res.json();

        if (data.success && data.data) {
          const order = data.data;
          if (["settled", "cancelled"].includes(order.status)) {
            localStorage.removeItem("gb_active_table");
            localStorage.removeItem("gb_active_order");
            setChecking(false);
            return;
          }
          router.replace(`/order/${savedTableId}`);
          return;
        }
        localStorage.removeItem("gb_active_table");
        localStorage.removeItem("gb_active_order");
        setChecking(false);
      } catch {
        setChecking(false);
      }
    }
    checkActiveOrder();
  }, [router]);

  const handleQRDetected = (value: string) => {
    if (scannerRef.current) {
      try { scannerRef.current.clear(); } catch { }
      scannerRef.current = null;
    }
    setScanning(false);

    let tableId = value;
    try {
      const url = new URL(value);
      const match = url.pathname.match(/\/order\/([a-zA-Z0-9]+)/);
      if (match) tableId = match[1];
    } catch { }
    router.push(`/order/${tableId}`);
  };

  useEffect(() => {
    if (!scanning) return;
    let cancelled = false;

    async function startScanner() {
      try {
        setCameraError("");
        const { Html5Qrcode } = await import("html5-qrcode");
        if (cancelled) return;

        const scanner = new Html5Qrcode("qr-reader");
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 220, height: 220 }, aspectRatio: 1.0 },
          (decodedText: string) => handleQRDetected(decodedText),
          () => { }
        );
      } catch (err) {
        console.error("QR scanner error:", err);
        setCameraError(
          err instanceof Error && err.message.includes("NotAllowed")
            ? "Camera permission denied. Please allow camera access."
            : "Unable to access camera. Please use manual entry."
        );
        setScanning(false);
      }
    }

    startScanner();

    return () => {
      cancelled = true;
      if (scannerRef.current) {
        try {
          scannerRef.current.stop().then(() => scannerRef.current?.clear()).catch(() => { });
        } catch { }
        scannerRef.current = null;
      }
    };
  }, [scanning]);

  const stopScanning = () => {
    if (scannerRef.current) {
      try {
        scannerRef.current.stop().then(() => {
          scannerRef.current?.clear();
          scannerRef.current = null;
        }).catch(() => { });
      } catch { }
    }
    setScanning(false);
  };

  const handleManualSubmit = () => {
    if (!manualCode.trim()) return;
    handleQRDetected(manualCode.trim());
  };

  if (checking) {
    return (
      <div style={{ minHeight: "100vh", background: T.cream, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: "50px", height: "50px", margin: "0 auto 12px", borderRadius: "50%", border: `3px solid ${T.creamDark}`, borderTopColor: T.emerald, animation: "spin 1s linear infinite" }} />
          <p style={{ color: T.textMuted, fontWeight: 700, fontSize: "13px" }}>Loading...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: `linear-gradient(180deg, ${T.emerald} 0%, ${T.emeraldMid} 100%)`, display: "flex", flexDirection: "column", width: "100%", margin: "0 auto", position: "relative", overflowX: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=Nunito:wght@400;600;700;800;900&display=swap');
        html, body { overflow-x: hidden; margin: 0; padding: 0; max-width: 100vw; width: 100%; }
        * { -webkit-tap-highlight-color: transparent; box-sizing: border-box; font-family: 'Nunito', sans-serif; }
        @keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
        @keyframes pulse-ring { 0%,100%{box-shadow:0 0 0 0 rgba(212,165,116,0.4)} 50%{box-shadow:0 0 0 14px rgba(212,165,116,0)} }
        @keyframes float-up { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
        #qr-reader__dashboard { display: none !important; }
        #qr-reader__scan_region { background: transparent !important; }
        #qr-reader__scan_region img { display: none !important; }
        #qr-reader video { border-radius: 16px; }
        #qr-reader { border: none !important; padding: 0 !important; }
      `}</style>

      <div style={{ height: "3px", background: `linear-gradient(90deg, ${T.goldDark}, ${T.gold}, ${T.goldLight}, ${T.gold}, ${T.goldDark})`, backgroundSize: "200% 100%", animation: "shimmer 3s linear infinite" }} />

      <div style={{ position: "absolute", top: "10%", right: "-40px", width: "160px", height: "160px", borderRadius: "50%", background: `radial-gradient(circle, rgba(212,165,116,0.15), transparent 70%)`, zIndex: 0 }} />
      <div style={{ position: "absolute", bottom: "20%", left: "-60px", width: "200px", height: "200px", borderRadius: "50%", background: `radial-gradient(circle, rgba(212,165,116,0.1), transparent 70%)`, zIndex: 0 }} />

      {!scanning ? (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "32px 20px 24px", position: "relative", zIndex: 1 }}>
          <div style={{ textAlign: "center", marginBottom: "20px", animation: "fadeIn 0.5s ease" }}>
            <div style={{ display: "inline-block", animation: "float-up 3s ease-in-out infinite" }}>
              <img src="/logo-large.png" alt="Golden Beans" style={{ width: "150px", height: "150px", objectFit: "contain", filter: "drop-shadow(0 10px 24px rgba(0,0,0,0.5))" }} />
            </div>
          </div>

          <div style={{ textAlign: "center", marginBottom: "24px" }}>
            <h1 style={{ fontWeight: 800, fontSize: "24px", color: T.gold, margin: "0 0 6px", fontFamily: "'Playfair Display', serif" }}>
              Welcome!
            </h1>
            <p style={{ fontSize: "12px", color: "rgba(212,165,116,0.75)", margin: 0, fontWeight: 600, lineHeight: 1.5 }}>
              Scan the QR code on your table<br />to start ordering
            </p>
          </div>

          <button onClick={() => setScanning(true)} style={{
            background: `linear-gradient(135deg, ${T.goldDark}, ${T.gold}, ${T.goldLight})`,
            color: T.emerald, border: "none", borderRadius: "16px",
            padding: "16px 20px", fontWeight: 900, fontSize: "14px",
            cursor: "pointer", boxShadow: `0 10px 28px rgba(212,165,116,0.5)`,
            display: "flex", alignItems: "center", justifyContent: "center",
            gap: "10px", fontFamily: "inherit", animation: "pulse-ring 2s infinite",
          }}>
            <span style={{ fontSize: "20px" }}>📷</span>
            <span>Scan QR Code</span>
          </button>

          <button onClick={() => setShowManual(!showManual)} style={{
            background: "none", border: "none",
            color: "rgba(212,165,116,0.75)", fontSize: "12px",
            marginTop: "16px", cursor: "pointer", fontWeight: 700,
            fontFamily: "inherit", textDecoration: "underline",
          }}>
            {showManual ? "← Back" : "Enter table code manually"}
          </button>

          {showManual && (
            <div style={{ marginTop: "14px", background: "rgba(255,255,255,0.05)", border: `1px solid rgba(212,165,116,0.3)`, borderRadius: "12px", padding: "12px", animation: "fadeIn 0.3s ease" }}>
              <label style={{ display: "block", fontSize: "10px", fontWeight: 800, color: T.gold, marginBottom: "5px", letterSpacing: "0.5px", textTransform: "uppercase" }}>
                Table Code or URL
              </label>
              <input type="text" placeholder="Paste here..." value={manualCode} onChange={e => setManualCode(e.target.value)}
                style={{ width: "100%", padding: "10px 12px", borderRadius: "9px", border: `1px solid rgba(212,165,116,0.3)`, background: "rgba(255,255,255,0.08)", color: T.ivory, fontSize: "12px", fontWeight: 600, outline: "none", boxSizing: "border-box", fontFamily: "inherit" }}
              />
              <button onClick={handleManualSubmit} disabled={!manualCode.trim()} style={{
                width: "100%", marginTop: "9px", padding: "10px",
                borderRadius: "9px", border: "none",
                background: manualCode.trim() ? `linear-gradient(135deg, ${T.goldDark}, ${T.gold})` : "rgba(255,255,255,0.1)",
                color: manualCode.trim() ? T.emerald : T.textMuted,
                fontWeight: 900, cursor: manualCode.trim() ? "pointer" : "not-allowed",
                fontSize: "12px", fontFamily: "inherit",
              }}>
                Continue →
              </button>
            </div>
          )}

          {cameraError && (
            <div style={{ marginTop: "12px", background: "rgba(192,57,43,0.15)", border: "1px solid rgba(192,57,43,0.35)", borderRadius: "10px", padding: "10px 12px" }}>
              <p style={{ fontSize: "11px", color: "#fca5a5", margin: 0, fontWeight: 700 }}>{cameraError}</p>
            </div>
          )}

          <div style={{ marginTop: "auto", paddingTop: "24px", textAlign: "center" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(74,139,74,0.2)", border: "1px solid rgba(74,139,74,0.4)", borderRadius: "99px", padding: "5px 12px" }}>
              <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: T.success }} />
              <span style={{ fontSize: "10px", color: "#86c686", fontWeight: 800 }}>🌿 100% Pure Vegetarian</span>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "18px 12px", position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
            <div>
              <h2 style={{ fontWeight: 900, fontSize: "16px", color: T.gold, margin: 0, fontFamily: "'Playfair Display', serif" }}>Scan QR Code</h2>
              <p style={{ fontSize: "10px", color: "rgba(212,165,116,0.7)", margin: "2px 0 0", fontWeight: 600 }}>Point at table QR</p>
            </div>
            <button onClick={stopScanning} style={{ width: "32px", height: "32px", borderRadius: "50%", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(212,165,116,0.3)", color: T.gold, cursor: "pointer", fontSize: "14px" }}>✕</button>
          </div>

          <div style={{ position: "relative", flex: 1, borderRadius: "16px", overflow: "hidden", background: "black", boxShadow: "0 16px 48px rgba(0,0,0,0.5)", border: `2px solid ${T.gold}`, minHeight: "280px" }}>
            <div id="qr-reader" style={{ width: "100%", height: "100%" }} />

            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
              <div style={{ width: "220px", height: "220px", position: "relative" }}>
                {[
                  { top: 0, left: 0, borderTop: `4px solid ${T.gold}`, borderLeft: `4px solid ${T.gold}`, borderRadius: "10px 0 0 0" },
                  { top: 0, right: 0, borderTop: `4px solid ${T.gold}`, borderRight: `4px solid ${T.gold}`, borderRadius: "0 10px 0 0" },
                  { bottom: 0, left: 0, borderBottom: `4px solid ${T.gold}`, borderLeft: `4px solid ${T.gold}`, borderRadius: "0 0 0 10px" },
                  { bottom: 0, right: 0, borderBottom: `4px solid ${T.gold}`, borderRight: `4px solid ${T.gold}`, borderRadius: "0 0 10px 0" },
                ].map((s, i) => (
                  <div key={i} style={{ position: "absolute", width: "28px", height: "28px", ...s }} />
                ))}
              </div>
            </div>
          </div>

          <p style={{ textAlign: "center", fontSize: "11px", color: "rgba(212,165,116,0.7)", marginTop: "14px", fontWeight: 600 }}>
            Hold steady — scanning automatically
          </p>
        </div>
      )}
    </div>
  );
}
