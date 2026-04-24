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

export default function HomePage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [manualCode, setManualCode] = useState("");
  const [showManual, setShowManual] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // ── Check for active order on mount ──
  useEffect(() => {
    async function checkActiveOrder() {
      try {
        const savedTableId = localStorage.getItem("gb_active_table");
        const savedOrderId = localStorage.getItem("gb_active_order");

        if (!savedTableId || !savedOrderId) {
          setChecking(false);
          return;
        }

        // Verify order is still active
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://golden-beans-server.onrender.com/api";
        const res = await fetch(`${apiUrl}/orders/${savedOrderId}`, {
          headers: { "ngrok-skip-browser-warning": "true" },
        });
        const data = await res.json();

        if (data.success && data.data) {
          const order = data.data;
          // If order is settled/cancelled, clear storage and show home
          if (["settled", "cancelled"].includes(order.status)) {
            localStorage.removeItem("gb_active_table");
            localStorage.removeItem("gb_active_order");
            setChecking(false);
            return;
          }
          // Active order — redirect
          router.replace(`/order/${savedTableId}`);
          return;
        }

        // Order not found — clear
        localStorage.removeItem("gb_active_table");
        localStorage.removeItem("gb_active_order");
        setChecking(false);
      } catch {
        setChecking(false);
      }
    }
    checkActiveOrder();
  }, [router]);

  // ── Camera QR scan ──
  const startScanning = async () => {
    setCameraError("");
    setScanning(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }

      // Use BarcodeDetector API if available
      if ("BarcodeDetector" in window) {
        const detector = new (window as unknown as {
          BarcodeDetector: new (options: { formats: string[] }) => {
            detect: (source: HTMLVideoElement) => Promise<Array<{ rawValue: string }>>;
          };
        }).BarcodeDetector({ formats: ["qr_code"] });

        const scanLoop = async () => {
          if (!videoRef.current || !streamRef.current) return;
          try {
            const codes = await detector.detect(videoRef.current);
            if (codes.length > 0) {
              const value = codes[0].rawValue;
              handleQRDetected(value);
              return;
            }
          } catch { }
          if (streamRef.current) requestAnimationFrame(scanLoop);
        };
        requestAnimationFrame(scanLoop);
      } else {
        setCameraError("QR scanner not supported on this browser. Please enter table code manually.");
        stopScanning();
      }
    } catch (err) {
      setCameraError("Camera access denied. Please enable camera or enter code manually.");
      setScanning(false);
    }
  };

  const stopScanning = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setScanning(false);
  };

  const handleQRDetected = (value: string) => {
    stopScanning();
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

  const handleManualSubmit = () => {
    if (!manualCode.trim()) return;
    handleQRDetected(manualCode.trim());
  };

  useEffect(() => {
    return () => { stopScanning(); };
  }, []);

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
        @keyframes scan-line { 0%{transform:translateY(0)} 50%{transform:translateY(200px)} 100%{transform:translateY(0)} }
        @keyframes pulse-ring { 0%,100%{box-shadow:0 0 0 0 rgba(201,168,76,0.4)} 50%{box-shadow:0 0 0 20px rgba(201,168,76,0)} }
        @keyframes float-up { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
      `}</style>

      {/* Gold shimmer top */}
      <div style={{ height: "4px", background: `linear-gradient(90deg,${BRAND.goldDark},${BRAND.gold},${BRAND.goldLight},${BRAND.gold},${BRAND.goldDark})`, backgroundSize: "200% 100%", animation: "shimmer 3s linear infinite" }} />

      {/* Background decoration */}
      <div style={{ position: "absolute", top: "10%", right: "-50px", width: "200px", height: "200px", borderRadius: "50%", background: `radial-gradient(circle, rgba(201,168,76,0.15), transparent 70%)`, zIndex: 0 }} />
      <div style={{ position: "absolute", bottom: "20%", left: "-80px", width: "240px", height: "240px", borderRadius: "50%", background: `radial-gradient(circle, rgba(201,168,76,0.1), transparent 70%)`, zIndex: 0 }} />

      {!scanning ? (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "40px 24px 32px", position: "relative", zIndex: 1 }}>
          {/* Logo */}
          <div style={{ textAlign: "center", marginBottom: "24px", animation: "fadeIn 0.5s ease" }}>
            <div style={{ display: "inline-block", animation: "float-up 3s ease-in-out infinite" }}>
              <img src="/logo-large.png" alt="Golden Beans" style={{ width: "180px", height: "180px", objectFit: "contain", filter: "drop-shadow(0 12px 32px rgba(0,0,0,0.5))" }} />
            </div>
          </div>

          {/* Heading */}
          <div style={{ textAlign: "center", marginBottom: "32px" }}>
            <h1 style={{ fontWeight: 800, fontSize: "28px", color: BRAND.gold, margin: "0 0 8px", fontFamily: "'Playfair Display', serif", letterSpacing: "-0.3px" }}>
              Welcome!
            </h1>
            <p style={{ fontSize: "14px", color: "rgba(201,168,76,0.7)", margin: 0, fontWeight: 600, lineHeight: 1.6 }}>
              Scan the QR code on your table<br />to start ordering
            </p>
          </div>

          {/* Scan Button */}
          <button onClick={startScanning} style={{
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

          {/* Manual Entry Toggle */}
          <button onClick={() => setShowManual(!showManual)} style={{
            background: "none", border: "none",
            color: "rgba(201,168,76,0.7)", fontSize: "13px",
            marginTop: "20px", cursor: "pointer", fontWeight: 700,
            fontFamily: "inherit", textDecoration: "underline",
          }}>
            {showManual ? "← Back to scanner" : "Enter table code manually"}
          </button>

          {showManual && (
            <div style={{ marginTop: "20px", background: "rgba(255,255,255,0.05)", border: `1px solid rgba(201,168,76,0.3)`, borderRadius: "16px", padding: "16px", animation: "fadeIn 0.3s ease" }}>
              <label style={{ display: "block", fontSize: "11px", fontWeight: 800, color: BRAND.gold, marginBottom: "8px", letterSpacing: "0.5px", textTransform: "uppercase" }}>
                Table Code or URL
              </label>
              <input
                type="text"
                placeholder="Paste table code here..."
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
            <div style={{ marginTop: "16px", background: "rgba(220,38,38,0.1)", border: "1px solid rgba(220,38,38,0.3)", borderRadius: "12px", padding: "12px 14px", textAlign: "center" }}>
              <p style={{ fontSize: "12px", color: "#f87171", margin: 0, fontWeight: 700 }}>{cameraError}</p>
            </div>
          )}

          {/* Info strip */}
          <div style={{ marginTop: "auto", paddingTop: "32px", textAlign: "center" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(74,222,128,0.15)", border: "1px solid rgba(74,222,128,0.3)", borderRadius: "99px", padding: "6px 14px" }}>
              <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#4ade80" }} />
              <span style={{ fontSize: "11px", color: "#4ade80", fontWeight: 800 }}>🌿 100% Pure Vegetarian</span>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "24px 16px", position: "relative", zIndex: 1 }}>
          {/* Scanner header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
            <div>
              <h2 style={{ fontWeight: 900, fontSize: "20px", color: BRAND.gold, margin: 0, fontFamily: "'Playfair Display', serif" }}>Scan QR Code</h2>
              <p style={{ fontSize: "12px", color: "rgba(201,168,76,0.7)", margin: "2px 0 0", fontWeight: 600 }}>Point camera at table QR</p>
            </div>
            <button onClick={stopScanning} style={{ width: "36px", height: "36px", borderRadius: "50%", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(201,168,76,0.3)", color: BRAND.gold, cursor: "pointer", fontSize: "16px" }}>✕</button>
          </div>

          {/* Camera viewport */}
          <div style={{ position: "relative", flex: 1, borderRadius: "24px", overflow: "hidden", background: "black", boxShadow: "0 20px 60px rgba(0,0,0,0.5)", border: `2px solid ${BRAND.gold}` }}>
            <video ref={videoRef} playsInline autoPlay muted style={{ width: "100%", height: "100%", objectFit: "cover" }} />

            {/* Overlay frame */}
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
              <div style={{ width: "220px", height: "220px", position: "relative" }}>
                {/* Corners */}
                {[
                  { top: 0, left: 0, borderTop: `4px solid ${BRAND.gold}`, borderLeft: `4px solid ${BRAND.gold}`, borderRadius: "12px 0 0 0" },
                  { top: 0, right: 0, borderTop: `4px solid ${BRAND.gold}`, borderRight: `4px solid ${BRAND.gold}`, borderRadius: "0 12px 0 0" },
                  { bottom: 0, left: 0, borderBottom: `4px solid ${BRAND.gold}`, borderLeft: `4px solid ${BRAND.gold}`, borderRadius: "0 0 0 12px" },
                  { bottom: 0, right: 0, borderBottom: `4px solid ${BRAND.gold}`, borderRight: `4px solid ${BRAND.gold}`, borderRadius: "0 0 12px 0" },
                ].map((s, i) => (
                  <div key={i} style={{ position: "absolute", width: "30px", height: "30px", ...s }} />
                ))}

                {/* Animated scan line */}
                <div style={{ position: "absolute", left: "10%", right: "10%", height: "2px", background: `linear-gradient(90deg, transparent, ${BRAND.gold}, transparent)`, animation: "scan-line 2s ease-in-out infinite", boxShadow: `0 0 8px ${BRAND.gold}` }} />
              </div>
            </div>
          </div>

          <p style={{ textAlign: "center", fontSize: "13px", color: "rgba(201,168,76,0.7)", marginTop: "20px", fontWeight: 600 }}>
            Hold steady — scanning automatically
          </p>
        </div>
      )}
    </div>
  );
}
