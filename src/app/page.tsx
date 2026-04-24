"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";

const BRAND = {
  gold: "#C9A84C",
  goldLight: "#E8C97A",
  goldDark: "#A07830",
  coffee: "#1A0E06",
  coffeeMid: "#2C1A0E",
  cream: "#FDF6E9",
  creamDark: "#F0E0C0",
  espresso: "#0D0700",
  text: "#E8D5B0",
  textMuted: "#9A7A5A",
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

  // ── Check for active order ──
  useEffect(() => {
    async function checkActiveOrder() {
      try {
        const savedTableId = localStorage.getItem("gb_active_table");
        const savedOrderId = localStorage.getItem("gb_active_order");

        if (!savedTableId || !savedOrderId) {
          setChecking(false);
          return;
        }

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
    // Stop scanner
    if (scannerRef.current) {
      try {
        scannerRef.current.clear();
      } catch { }
      scannerRef.current = null;
    }
    setScanning(false);

    // Extract table ID from URL or direct value
    let tableId = value;
    try {
      const url = new URL(value);
      const match = url.pathname.match(/\/order\/([a-zA-Z0-9]+)/);
      if (match) tableId = match[1];
    } catch {
      // Not a URL, use as-is
    }

    router.push(`/order/${tableId}`);
  };

  // ── Start scanning with html5-qrcode ──
  useEffect(() => {
    if (!scanning) return;

    let cancelled = false;

    async function startScanner() {
      try {
        setCameraError("");
        // Dynamic import to avoid SSR issues
        const { Html5Qrcode } = await import("html5-qrcode");

        if (cancelled) return;

        const scanner = new Html5Qrcode("qr-reader");
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 240, height: 240 },
            aspectRatio: 1.0,
          },
          (decodedText: string) => {
            handleQRDetected(decodedText);
          },
          () => {
            // Ignore scan errors (happens when no QR in frame)
          }
        );
      } catch (err) {
        console.error("QR scanner error:", err);
        setCameraError(
          err instanceof Error && err.message.includes("NotAllowed")
            ? "Camera permission denied. Please allow camera access in browser settings."
            : "Unable to access camera. Please use manual entry below."
        );
        setScanning(false);
      }
    }

    startScanner();

    return () => {
      cancelled = true;
      if (scannerRef.current) {
        try {
          scannerRef.current.stop().then(() => {
            scannerRef.current?.clear();
          }).catch(() => { });
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
      <div style={{ minHeight: "100vh", background: BRAND.cream, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: "60px", height: "60px", margin: "0 auto 16px", borderRadius: "50%", border: `3px solid ${BRAND.creamDark}`, borderTopColor: BRAND.gold, animation: "spin 1s linear infinite" }} />
          <p style={{ color: BRAND.textMuted, fontWeight: 700, fontSize: "14px" }}>Loading...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: `linear-gradient(180deg,${BRAND.coffee} 0%,${BRAND.coffeeMid} 100%)`, display: "flex", flexDirection: "column", maxWidth: "480px", margin: "0 auto", position: "relative", overflow: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=Nunito:wght@400;600;700;800;900&display=swap');
        * { -webkit-tap-highlight-color: transparent; box-sizing: border-box; font-family: 'Nunito', sans-serif; }
        @keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
        @keyframes pulse-ring { 0%,100%{box-shadow:0 0 0 0 rgba(201,168,76,0.4)} 50%{box-shadow:0 0 0 20px rgba(201,168,76,0)} }
        @keyframes float-up { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }

        /* Hide html5-qrcode default UI */
        #qr-reader__dashboard { display: none !important; }
        #qr-reader__scan_region { background: transparent !important; }
        #qr-reader__scan_region img { display: none !important; }
        #qr-reader video { border-radius: 20px; }
        #qr-reader { border: none !important; padding: 0 !important; }
      `}</style>

      <div style={{ height: "4px", background: `linear-gradient(90deg,${BRAND.goldDark},${BRAND.gold},${BRAND.goldLight},${BRAND.gold},${BRAND.goldDark})`, backgroundSize: "200% 100%", animation: "shimmer 3s linear infinite" }} />

      <div style={{ position: "absolute", top: "10%", right: "-50px", width: "200px", height: "200px", borderRadius: "50%", background: `radial-gradient(circle, rgba(201,168,76,0.15), transparent 70%)`, zIndex: 0 }} />
      <div style={{ position: "absolute", bottom: "20%", left: "-80px", width: "240px", height: "240px", borderRadius: "50%", background: `radial-gradient(circle, rgba(201,168,76,0.1), transparent 70%)`, zIndex: 0 }} />

      {!scanning ? (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "40px 24px 32px", position: "relative", zIndex: 1 }}>
          <div style={{ textAlign: "center", marginBottom: "24px", animation: "fadeIn 0.5s ease" }}>
            <div style={{ display: "inline-block", animation: "float-up 3s ease-in-out infinite" }}>
              <img src="/logo-large.png" alt="Golden Beans" style={{ width: "180px", height: "180px", objectFit: "contain", filter: "drop-shadow(0 12px 32px rgba(0,0,0,0.5))" }} />
            </div>
          </div>

          <div style={{ textAlign: "center", marginBottom: "32px" }}>
            <h1 style={{ fontWeight: 800, fontSize: "28px", color: BRAND.gold, margin: "0 0 8px", fontFamily: "'Playfair Display', serif" }}>
              Welcome!
            </h1>
            <p style={{ fontSize: "14px", color: "rgba(201,168,76,0.7)", margin: 0, fontWeight: 600, lineHeight: 1.6 }}>
              Scan the QR code on your table<br />to start ordering
            </p>
          </div>

          <button onClick={() => setScanning(true)} style={{
            background: `linear-gradient(135deg,${BRAND.goldDark},${BRAND.gold},${BRAND.goldLight})`,
            color: BRAND.coffee, border: "none", borderRadius: "20px",
            padding: "20px 24px", fontWeight: 900, fontSize: "16px",
            cursor: "pointer", boxShadow: `0 12px 40px rgba(201,168,76,0.5)`,
            display: "flex", alignItems: "center", justifyContent: "center",
            gap: "12px", fontFamily: "inherit",
            animation: "pulse-ring 2s infinite",
          }}>
            <span style={{ fontSize: "24px" }}>📷</span>
            <span>Scan QR Code</span>
          </button>

          <button onClick={() => setShowManual(!showManual)} style={{
            background: "none", border: "none",
            color: "rgba(201,168,76,0.7)", fontSize: "13px",
            marginTop: "20px", cursor: "pointer", fontWeight: 700,
            fontFamily: "inherit", textDecoration: "underline",
          }}>
            {showManual ? "← Back" : "Enter table code manually"}
          </button>

          {showManual && (
            <div style={{ marginTop: "20px", background: "rgba(255,255,255,0.05)", border: `1px solid rgba(201,168,76,0.3)`, borderRadius: "16px", padding: "16px", animation: "fadeIn 0.3s ease" }}>
              <label style={{ display: "block", fontSize: "11px", fontWeight: 800, color: BRAND.gold, marginBottom: "8px", letterSpacing: "0.5px", textTransform: "uppercase" }}>
                Table Code or URL
              </label>
              <input
                type="text"
                placeholder="Paste here..."
                value={manualCode}
                onChange={e => setManualCode(e.target.value)}
                style={{ width: "100%", padding: "12px 14px", borderRadius: "12px", border: `1px solid rgba(201,168,76,0.3)`, background: "rgba(255,255,255,0.05)", color: BRAND.text, fontSize: "14px", fontWeight: 600, outline: "none", boxSizing: "border-box", fontFamily: "inherit" }}
              />
              <button onClick={handleManualSubmit} disabled={!manualCode.trim()} style={{
                width: "100%", marginTop: "12px", padding: "12px",
                borderRadius: "12px", border: "none",
                background: manualCode.trim() ? `linear-gradient(135deg,${BRAND.goldDark},${BRAND.gold})` : "rgba(255,255,255,0.1)",
                color: manualCode.trim() ? BRAND.coffee : BRAND.textMuted,
                fontWeight: 900, cursor: manualCode.trim() ? "pointer" : "not-allowed",
                fontSize: "14px", fontFamily: "inherit",
              }}>
                Continue →
              </button>
            </div>
          )}

          {cameraError && (
            <div style={{ marginTop: "16px", background: "rgba(220,38,38,0.1)", border: "1px solid rgba(220,38,38,0.3)", borderRadius: "12px", padding: "12px 14px" }}>
              <p style={{ fontSize: "12px", color: "#f87171", margin: 0, fontWeight: 700 }}>{cameraError}</p>
            </div>
          )}

          <div style={{ marginTop: "auto", paddingTop: "32px", textAlign: "center" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(74,222,128,0.15)", border: "1px solid rgba(74,222,128,0.3)", borderRadius: "99px", padding: "6px 14px" }}>
              <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#4ade80" }} />
              <span style={{ fontSize: "11px", color: "#4ade80", fontWeight: 800 }}>🌿 100% Pure Vegetarian</span>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "20px 14px", position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
            <div>
              <h2 style={{ fontWeight: 900, fontSize: "18px", color: BRAND.gold, margin: 0, fontFamily: "'Playfair Display', serif" }}>Scan QR Code</h2>
              <p style={{ fontSize: "11px", color: "rgba(201,168,76,0.7)", margin: "2px 0 0", fontWeight: 600 }}>Point at table QR</p>
            </div>
            <button onClick={stopScanning} style={{ width: "36px", height: "36px", borderRadius: "50%", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(201,168,76,0.3)", color: BRAND.gold, cursor: "pointer", fontSize: "16px" }}>✕</button>
          </div>

          <div style={{ position: "relative", flex: 1, borderRadius: "20px", overflow: "hidden", background: "black", boxShadow: "0 20px 60px rgba(0,0,0,0.5)", border: `2px solid ${BRAND.gold}`, minHeight: "320px" }}>
            {/* html5-qrcode mounts video here */}
            <div id="qr-reader" style={{ width: "100%", height: "100%" }} />

            {/* Overlay corners */}
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
              <div style={{ width: "240px", height: "240px", position: "relative" }}>
                {[
                  { top: 0, left: 0, borderTop: `4px solid ${BRAND.gold}`, borderLeft: `4px solid ${BRAND.gold}`, borderRadius: "12px 0 0 0" },
                  { top: 0, right: 0, borderTop: `4px solid ${BRAND.gold}`, borderRight: `4px solid ${BRAND.gold}`, borderRadius: "0 12px 0 0" },
                  { bottom: 0, left: 0, borderBottom: `4px solid ${BRAND.gold}`, borderLeft: `4px solid ${BRAND.gold}`, borderRadius: "0 0 0 12px" },
                  { bottom: 0, right: 0, borderBottom: `4px solid ${BRAND.gold}`, borderRight: `4px solid ${BRAND.gold}`, borderRadius: "0 0 12px 0" },
                ].map((s, i) => (
                  <div key={i} style={{ position: "absolute", width: "32px", height: "32px", ...s }} />
                ))}
              </div>
            </div>
          </div>

          <p style={{ textAlign: "center", fontSize: "12px", color: "rgba(201,168,76,0.7)", marginTop: "16px", fontWeight: 600 }}>
            Hold steady — scanning automatically
          </p>
        </div>
      )}
    </div>
  );
}
