"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import CRMCaptureCard from '@/components/CRMCaptureCard';
import WaiterHelpSheet from '@/components/WaiterHelpSheet';
import { menuApi, orderApi, tableApi } from "@/lib/api";
import { getThumbnailUrl, getHeroUrl } from "@/lib/cloudinary";
import { Icons, Pill, Button, Skeleton } from "@/components/PremiumUI";
import LiveOrderTracker from "@/components/LiveOrderTracker";
import type { MenuCategory, MenuItem, CartItem, Table, Order, VariantGroup } from "@/types";

const T = {
  emerald: "#0F3D2E", emeraldMid: "#1A5340", emeraldLight: "#2D7A5F",
  gold: "#D4A574", goldLight: "#E8C895", goldDark: "#B08550",
  cream: "#FAF6F0", creamDark: "#F0E8DA", ivory: "#FFFBF5",
  text: "#1A1208", textMuted: "#7A6B54", textDim: "#A89B80",
  border: "#E5DCC9", success: "#4A8B4A", danger: "#C0392B",
  dark: "#0A0A0A", darkCard: "#141414", darkBorder: "#222",
};

interface ExtendedCartItem extends CartItem {
  variants?: { groupName: string; selected: string[]; }[];
  totalPriceModifier?: number;
  imageUrl?: string;
}

interface AppliedDiscount {
  promotionId: string; name: string; description: string;
  discount: number; type: "auto" | "code"; code?: string; promoCodeId?: string;
}

type BottomTab = "menu" | "order" | "cart" | "info";

interface SecurityResult {
  allowed: boolean; ipAllowed: boolean; gpsAllowed: boolean;
  gpsRequired: boolean; ipRequired: boolean; distance: number | null;
  cafeName: string; cafeAddress: string; cafePhone: string; wifiName: string; reason: string;
}

// ══════════════════════════════════════════════════
// WELCOME SCREEN
// ══════════════════════════════════════════════════
function WelcomeScreen({ onDone }: { cafeName: string; onDone: () => void }) {
  const [countdown, setCountdown] = useState(3);
  useEffect(() => {
    const iv = setInterval(() => {
      setCountdown(prev => { if (prev <= 1) { clearInterval(iv); onDone(); return 0; } return prev - 1; });
    }, 1000);
    return () => clearInterval(iv);
  }, [onDone]);

  return (
    <div style={{ minHeight: "100vh", background: "#000", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px", position: "relative", overflow: "hidden" }}>
      {/* Animated background */}
      <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse 80% 60% at 50% 40%, ${T.emerald}40 0%, transparent 70%)`, animation: "pulse 3s ease-in-out infinite" }} />
      <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse 60% 40% at 80% 80%, ${T.gold}20 0%, transparent 60%)` }} />

      <div style={{ textAlign: "center", maxWidth: "360px", width: "100%", position: "relative", zIndex: 1 }}>
        <div style={{ width: "130px", height: "130px", borderRadius: "50%", overflow: "hidden", margin: "0 auto 28px", border: "2px solid rgba(212,165,116,0.4)", boxShadow: `0 0 60px ${T.gold}40, 0 20px 60px rgba(0,0,0,0.8)`, animation: "welcomeLogo 1s cubic-bezier(0.34,1.56,0.64,1)" }}>
          <img src="/logo-large.png" alt="Golden Beans" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </div>
        <p style={{ fontSize: "11px", color: "rgba(212,165,116,0.6)", margin: "0 0 6px", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", animation: "fadeUp 0.6s 0.3s ease both" }}>Welcome to</p>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "42px", fontWeight: 800, color: T.gold, margin: "0 0 4px", lineHeight: 1, animation: "fadeUp 0.6s 0.4s ease both" }}>Golden Beans</h1>
        <p style={{ fontSize: "14px", color: "rgba(212,165,116,0.5)", margin: "0 0 40px", fontWeight: 600, animation: "fadeUp 0.6s 0.5s ease both" }}>Cafe & Bistro ☕</p>

        <div style={{ position: "relative", width: "70px", height: "70px", margin: "0 auto", animation: "fadeUp 0.6s 0.6s ease both" }}>
          <svg width="70" height="70" style={{ transform: "rotate(-90deg)" }}>
            <circle cx="35" cy="35" r="30" fill="none" stroke="rgba(212,165,116,0.15)" strokeWidth="3" />
            <circle cx="35" cy="35" r="30" fill="none" stroke={T.gold} strokeWidth="3"
              strokeDasharray={`${2 * Math.PI * 30}`}
              strokeDashoffset={`${2 * Math.PI * 30 * (1 - countdown / 3)}`}
              strokeLinecap="round" style={{ transition: "stroke-dashoffset 0.9s linear" }} />
          </svg>
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: "24px", fontWeight: 900, color: T.gold, fontFamily: "'DM Sans', sans-serif" }}>{countdown}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════
// SECURITY CHECK SCREEN
// ══════════════════════════════════════════════════
function SecurityCheckScreen({ onPassed, onFailed }: { onPassed: () => void; onFailed: (r: SecurityResult) => void }) {
  type CS = "pending" | "loading" | "success" | "failed";
  const [gpsCheck, setGpsCheck] = useState<CS>("pending");
  const [wifiCheck, setWifiCheck] = useState<CS>("pending");
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function run() {
      try {
        setGpsCheck("loading");
        await new Promise(r => setTimeout(r, 400));
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://golden-beans-server.onrender.com/api";
        const settingsRes = await fetch(`${apiUrl}/security/settings`).then(r => r.json());
        const settings = settingsRes.data;
        if (settings && !settings.ipWhitelistEnabled && !settings.geofenceEnabled) {
          if (mounted) { setGpsCheck("success"); setWifiCheck("success"); setShowWelcome(true); }
          return;
        }
        if (!("geolocation" in navigator)) {
          if (mounted) { setGpsCheck("failed"); await new Promise(r => setTimeout(r, 600)); onFailed({ allowed: false, ipAllowed: false, gpsAllowed: false, gpsRequired: true, ipRequired: true, distance: null, cafeName: "Golden Beans", cafeAddress: "", cafePhone: "", wifiName: "GoldenBeans-WiFi", reason: "GPS not supported" }); }
          return;
        }
        let position: GeolocationPosition | null = null;
        if (settings?.geofenceEnabled) {
          position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 });
          }).catch(err => { throw new Error(err.code === 1 ? "DENIED" : err.code === 2 ? "UNAVAILABLE" : "TIMEOUT"); });
        }
        if (mounted) setGpsCheck("success");
        await new Promise(r => setTimeout(r, 500));
        if (mounted) setWifiCheck("loading");
        const res = await fetch(`${apiUrl}/security/check`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ latitude: position?.coords.latitude, longitude: position?.coords.longitude }) });
        const data = await res.json();
        if (!data.success) throw new Error(data.message || "Security check failed");
        const result = data.data;
        if (mounted) {
          if (result.securityDisabled) { setGpsCheck("success"); setWifiCheck("success"); setShowWelcome(true); return; }
          setGpsCheck(result.gpsAllowed ? "success" : "failed");
          setWifiCheck(result.ipAllowed ? "success" : "failed");
          await new Promise(r => setTimeout(r, 800));
          if (result.allowed) setShowWelcome(true);
          else onFailed(result);
        }
      } catch (err: unknown) {
        if (!mounted) return;
        const msg = err instanceof Error ? err.message : "Unknown error";
        const isGPSDenied = msg === "DENIED" || msg.includes("permission") || msg.includes("denied");
        if (isGPSDenied || msg === "TIMEOUT" || msg === "UNAVAILABLE") setGpsCheck("failed");
        else setWifiCheck("failed");
        await new Promise(r => setTimeout(r, 800));
        onFailed({ allowed: false, ipAllowed: !msg.toLowerCase().includes("ip"), gpsAllowed: !isGPSDenied && msg !== "TIMEOUT" && msg !== "UNAVAILABLE", gpsRequired: true, ipRequired: true, distance: null, cafeName: "Golden Beans Cafe & Bistro", cafeAddress: "Pramukh Darshan Society, Dabholi, Surat", cafePhone: "+91 XXXXX XXXXX", wifiName: "GoldenBeans-WiFi", reason: isGPSDenied ? "Location access denied" : msg === "TIMEOUT" ? "Location timed out" : "Connect to cafe WiFi" });
      }
    }
    run();
    return () => { mounted = false; };
  }, [onPassed, onFailed]);

  if (showWelcome) return <WelcomeScreen cafeName="Golden Beans" onDone={onPassed} />;

  const CheckRow = ({ state, icon, title, desc }: { state: CS; icon: string; title: string; desc: string }) => {
    const c = { pending: "#333", loading: T.gold, success: T.success, failed: T.danger }[state];
    return (
      <div style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${c}40`, borderRadius: "16px", padding: "14px 16px", display: "flex", alignItems: "center", gap: "14px", marginBottom: "10px", transition: "all 0.4s" }}>
        <span style={{ fontSize: "22px" }}>{icon}</span>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: "13px", fontWeight: 800, color: c, margin: 0 }}>{title}</p>
          <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)", margin: "2px 0 0", fontWeight: 600 }}>{desc}</p>
        </div>
        {state === "loading" && <div style={{ width: "20px", height: "20px", borderRadius: "50%", border: `2px solid ${T.gold}40`, borderTopColor: T.gold, animation: "spin 0.8s linear infinite" }} />}
        {state === "success" && <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: T.success, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px" }}>✓</div>}
        {state === "failed" && <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: T.danger, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px" }}>✕</div>}
      </div>
    );
  };

  return (
    <div style={{ minHeight: "100vh", background: "#000", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
      <div style={{ maxWidth: "360px", width: "100%", textAlign: "center" }}>
        <div style={{ width: "90px", height: "90px", borderRadius: "50%", overflow: "hidden", margin: "0 auto 20px", border: "2px solid rgba(212,165,116,0.3)", boxShadow: `0 0 40px ${T.gold}30` }}>
          <img src="/logo-large.png" alt="GB" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </div>
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "22px", fontWeight: 800, color: T.gold, margin: "0 0 6px" }}>Verifying Access</h2>
        <p style={{ fontSize: "12px", color: "rgba(212,165,116,0.5)", margin: "0 0 28px", fontWeight: 600 }}>Confirming you're at Golden Beans</p>
        <CheckRow state={gpsCheck} icon="📍" title="Location Check" desc={gpsCheck === "loading" ? "Getting your location..." : gpsCheck === "success" ? "You're at the cafe ✓" : gpsCheck === "failed" ? "Location not verified" : "Waiting..."} />
        <CheckRow state={wifiCheck} icon="📶" title="Network Check" desc={wifiCheck === "loading" ? "Verifying network..." : wifiCheck === "success" ? "Cafe network confirmed ✓" : wifiCheck === "failed" ? "Network not verified" : "Waiting for location..."} />
        <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.2)", margin: "20px 0 0", fontWeight: 600 }}>🔒 Protecting against fake orders</p>
      </div>
    </div>
  );
}

function AwarenessScreen({ result, onRetry }: { result: SecurityResult; onRetry: () => void }) {
  return (
    <div style={{ minHeight: "100vh", background: "#000", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px" }}>
      <div style={{ maxWidth: "380px", width: "100%", textAlign: "center" }}>
        <div style={{ fontSize: "60px", marginBottom: "16px" }}>🚫</div>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "26px", fontWeight: 800, color: T.gold, margin: "0 0 10px" }}>Access Restricted</h1>
        <p style={{ fontSize: "14px", color: "rgba(212,165,116,0.7)", margin: "0 0 28px", lineHeight: 1.6 }}>{result.reason}</p>
        {!result.ipAllowed && <div style={{ background: "rgba(212,165,116,0.08)", border: "1px solid rgba(212,165,116,0.2)", borderRadius: "14px", padding: "14px", marginBottom: "12px", textAlign: "left" }}>
          <p style={{ fontWeight: 800, fontSize: "13px", color: T.gold, margin: "0 0 4px" }}>📶 Connect to Cafe WiFi</p>
          <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)", margin: 0 }}>Network: {result.wifiName}</p>
        </div>}
        {!result.gpsAllowed && <div style={{ background: "rgba(212,165,116,0.08)", border: "1px solid rgba(212,165,116,0.2)", borderRadius: "14px", padding: "14px", marginBottom: "12px", textAlign: "left" }}>
          <p style={{ fontWeight: 800, fontSize: "13px", color: T.gold, margin: "0 0 4px" }}>📍 Enable Location</p>
          <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)", margin: 0 }}>{result.distance ? `${result.distance}m from cafe` : "Allow location in browser settings"}</p>
        </div>}
        <button onClick={onRetry} style={{ width: "100%", padding: "16px", borderRadius: "14px", border: "none", background: `linear-gradient(135deg, ${T.gold}, ${T.goldLight})`, color: T.emerald, fontWeight: 900, fontSize: "15px", cursor: "pointer", marginTop: "8px" }}>Try Again</button>
      </div>
    </div>
  );
}

function SessionEndedScreen({ reason, onRestart }: { reason: string; onRestart: () => void }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const API = 'https://golden-beans-server.onrender.com/api';

  useEffect(() => { if (done) { const t = setTimeout(() => onRestart(), 5000); return () => clearTimeout(t); } }, [done, onRestart]);

  const submit = async () => {
    if (rating === 0) return;
    setSubmitting(true);
    try { await fetch(`${API}/feedback/submit`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ orderId: localStorage.getItem('gb_settled_order_id') || 'unknown', tableId: localStorage.getItem('gb_settled_table') || 'unknown', tableNumber: localStorage.getItem('gb_settled_table') || 'unknown', rating, categories: {}, comment }) }); } catch {}
    setSubmitting(false); setDone(true);
  };

  if (done) return (
    <div style={{ minHeight: "100vh", background: "#000", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
      <div style={{ textAlign: "center", maxWidth: "320px" }}>
        <div style={{ fontSize: "70px", marginBottom: "16px", animation: "welcomeLogo 0.6s cubic-bezier(0.34,1.56,0.64,1)" }}>🎉</div>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "32px", fontWeight: 800, color: T.gold, margin: "0 0 10px" }}>Thank You!</h1>
        <p style={{ fontSize: "14px", color: "rgba(212,165,116,0.6)", margin: "0 0 20px", lineHeight: 1.6 }}>{reason}</p>
        <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.2)", margin: 0 }}>Auto-redirecting in 5 seconds...</p>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#000", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px" }}>
      <div style={{ maxWidth: "380px", width: "100%" }}>
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <span style={{ fontSize: "48px" }}>⭐</span>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "26px", fontWeight: 800, color: T.gold, margin: "12px 0 4px" }}>Rate Your Experience</h1>
          <p style={{ fontSize: "13px", color: "rgba(212,165,116,0.5)", margin: 0 }}>How was your visit today?</p>
        </div>
        <div style={{ background: "#111", borderRadius: "24px", padding: "24px", border: "1px solid #222" }}>
          <div style={{ display: "flex", justifyContent: "center", gap: "12px", marginBottom: "20px" }}>
            {[1,2,3,4,5].map(s => (
              <button key={s} onClick={() => setRating(s)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: rating >= s ? "40px" : "32px", filter: rating >= s ? "none" : "grayscale(1) opacity(0.3)", transition: "all 0.15s", transform: rating >= s ? "scale(1.1)" : "scale(1)" }}>⭐</button>
            ))}
          </div>
          {rating > 0 && <p style={{ textAlign: "center", fontSize: "14px", fontWeight: 700, color: T.gold, margin: "0 0 16px" }}>{['','😞 Poor','😐 Fair','🙂 Good','😊 Great','🤩 Excellent!'][rating]}</p>}
          <textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="Any comments? (optional)" rows={3}
            style={{ width: "100%", padding: "12px", borderRadius: "12px", border: "1px solid #333", background: "#1a1a1a", color: "white", fontSize: "14px", outline: "none", resize: "none", boxSizing: "border-box", marginBottom: "16px", fontFamily: "inherit" }} />
          <div style={{ display: "flex", gap: "10px" }}>
            <button onClick={() => setDone(true)} style={{ flex: 1, padding: "13px", borderRadius: "12px", border: "1px solid #333", background: "transparent", color: "#666", fontSize: "14px", cursor: "pointer" }}>Skip</button>
            <button onClick={submit} disabled={rating === 0 || submitting} style={{ flex: 2, padding: "13px", borderRadius: "12px", border: "none", background: rating === 0 ? "#222" : `linear-gradient(135deg, ${T.emerald}, ${T.emeraldMid})`, color: rating === 0 ? "#444" : T.gold, fontSize: "14px", fontWeight: 800, cursor: rating === 0 ? "not-allowed" : "pointer" }}>
              {submitting ? "Submitting..." : "Submit Feedback"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════
// HERO CAROUSEL — Hotstar style
// ══════════════════════════════════════════════════
function HeroCarousel({ items, onTap, cart }: { items: MenuItem[]; onTap: (item: MenuItem) => void; cart: ExtendedCartItem[] }) {
  const [active, setActive] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [dragDelta, setDragDelta] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const featured = items.filter(i => i.isAvailable).slice(0, 5);

  const next = useCallback(() => setActive(p => (p + 1) % featured.length), [featured.length]);
  const prev = useCallback(() => setActive(p => (p - 1 + featured.length) % featured.length), [featured.length]);

  useEffect(() => {
    if (dragging) return;
    timerRef.current = setInterval(next, 4000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [next, dragging, active]);

  const onStart = (x: number) => { setDragging(true); setStartX(x); setDragDelta(0); if (timerRef.current) clearInterval(timerRef.current); };
  const onMove = (x: number) => { if (dragging) setDragDelta(x - startX); };
  const onEnd = () => {
    if (Math.abs(dragDelta) > 50) { dragDelta < 0 ? next() : prev(); }
    setDragging(false); setDragDelta(0);
  };

  if (featured.length === 0) return null;
  const item = featured[active];
  const cartQty = cart.filter(c => c.menuItemId === item._id).reduce((s, c) => s + c.quantity, 0);

  return (
    <div style={{ position: "relative", width: "100%", height: "65vw", maxHeight: "280px", overflow: "hidden", userSelect: "none" }}
      onTouchStart={e => onStart(e.touches[0].clientX)}
      onTouchMove={e => onMove(e.touches[0].clientX)}
      onTouchEnd={onEnd}
      onMouseDown={e => onStart(e.clientX)}
      onMouseMove={e => dragging && onMove(e.clientX)}
      onMouseUp={onEnd}
      onMouseLeave={onEnd}
    >
      {featured.map((fi, i) => (
        <div key={fi._id} style={{
          position: "absolute", inset: 0, transition: dragging ? "none" : "all 0.5s cubic-bezier(0.16,1,0.3,1)",
          opacity: i === active ? 1 : 0,
          transform: i === active ? `translateX(${dragDelta}px)` : i < active ? `translateX(calc(-100% + ${dragDelta}px))` : `translateX(calc(100% + ${dragDelta}px))`,
          zIndex: i === active ? 1 : 0,
        }}>
          {fi.imageUrl ? (
            <img src={getHeroUrl(fi.imageUrl)} alt={fi.name} style={{ width: "100%", height: "100%", objectFit: "cover", pointerEvents: "none" }} />
          ) : (
            <div style={{ width: "100%", height: "100%", background: `linear-gradient(135deg, ${T.emerald}, ${T.emeraldMid})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "80px" }}>☕</div>
          )}
        </div>
      ))}

      {/* Gradient overlay */}
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0) 70%)", zIndex: 2, pointerEvents: "none" }} />

      {/* Content */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "16px", zIndex: 3 }}>
        {item.tags?.includes("bestseller") && (
          <div style={{ display: "inline-flex", alignItems: "center", gap: "4px", background: `linear-gradient(135deg, ${T.gold}, ${T.goldLight})`, color: T.emerald, fontSize: "9px", fontWeight: 900, padding: "3px 10px", borderRadius: "99px", marginBottom: "6px", letterSpacing: "0.5px" }}>
            ⭐ BESTSELLER
          </div>
        )}
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={{ fontSize: "22px", fontWeight: 900, color: "white", margin: "0 0 2px", fontFamily: "'Playfair Display', serif", textShadow: "0 2px 8px rgba(0,0,0,0.5)" }}>{item.name}</h2>
            <p style={{ fontSize: "16px", fontWeight: 800, color: T.gold, margin: 0, fontFamily: "'DM Sans', sans-serif" }}>₹{item.price}</p>
          </div>
          <button onClick={() => onTap(item)} style={{
            background: cartQty > 0 ? `linear-gradient(135deg, ${T.emerald}, ${T.emeraldMid})` : `linear-gradient(135deg, ${T.gold}, ${T.goldLight})`,
            color: cartQty > 0 ? T.gold : T.emerald,
            border: "none", borderRadius: "12px", padding: "10px 18px",
            fontWeight: 900, fontSize: "13px", cursor: "pointer",
            boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
            flexShrink: 0, marginLeft: "12px",
          }}>
            {cartQty > 0 ? `✓ ${cartQty}` : "+ Add"}
          </button>
        </div>
      </div>

      {/* Dots */}
      <div style={{ position: "absolute", bottom: "8px", left: "50%", transform: "translateX(-50%)", display: "flex", gap: "5px", zIndex: 4 }}>
        {featured.map((_, i) => (
          <button key={i} onClick={() => setActive(i)} style={{ width: i === active ? "20px" : "6px", height: "6px", borderRadius: "99px", background: i === active ? T.gold : "rgba(255,255,255,0.4)", border: "none", cursor: "pointer", transition: "all 0.3s", padding: 0 }} />
        ))}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════
// HORIZONTAL SCROLL SECTION — Hotstar style rows
// ══════════════════════════════════════════════════
function ItemRow({ title, items, cart, onTap, emoji }: { title: string; items: MenuItem[]; cart: ExtendedCartItem[]; onTap: (i: MenuItem) => void; emoji?: string }) {
  if (items.length === 0) return null;
  return (
    <div style={{ marginBottom: "24px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "0 16px", marginBottom: "12px" }}>
        {emoji && <span style={{ fontSize: "18px" }}>{emoji}</span>}
        <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "18px", fontWeight: 800, color: "white", margin: 0 }}>{title}</h3>
      </div>
      <div style={{ display: "flex", gap: "12px", overflowX: "auto", padding: "4px 16px 4px", scrollbarWidth: "none" }} className="scrollbar-hide">
        {items.map((item, idx) => {
          const qty = cart.filter(c => c.menuItemId === item._id).reduce((s, c) => s + c.quantity, 0);
          return (
            <div key={item._id} onClick={() => item.isAvailable && onTap(item)}
              style={{ flexShrink: 0, width: "140px", cursor: item.isAvailable ? "pointer" : "not-allowed", opacity: item.isAvailable ? 1 : 0.5, animation: `fadeUp 0.4s ${idx * 0.06}s ease both` }}>
              <div style={{ position: "relative", width: "140px", height: "140px", borderRadius: "16px", overflow: "hidden", marginBottom: "8px", boxShadow: qty > 0 ? `0 0 0 2px ${T.gold}, 0 8px 24px rgba(212,165,116,0.3)` : "0 4px 16px rgba(0,0,0,0.4)" }}>
                {item.imageUrl ? (
                  <img src={getThumbnailUrl(item.imageUrl)} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover", pointerEvents: "none" }} />
                ) : (
                  <div style={{ width: "100%", height: "100%", background: `linear-gradient(135deg, ${T.emerald}60, ${T.emeraldMid}60)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "50px" }}>☕</div>
                )}
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 60%)" }} />
                {qty > 0 && (
                  <div style={{ position: "absolute", top: "8px", right: "8px", width: "24px", height: "24px", borderRadius: "50%", background: T.gold, color: T.emerald, fontSize: "11px", fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center" }}>{qty}</div>
                )}
                {item.tags?.includes("bestseller") && (
                  <div style={{ position: "absolute", top: "8px", left: "8px", background: `linear-gradient(135deg, ${T.gold}, ${T.goldLight})`, color: T.emerald, fontSize: "8px", fontWeight: 900, padding: "2px 7px", borderRadius: "99px" }}>⭐ BEST</div>
                )}
                <div style={{ position: "absolute", bottom: "8px", left: "8px", right: "8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "13px", fontWeight: 900, color: "white", fontFamily: "'DM Sans', sans-serif" }}>₹{item.price}</span>
                  {!item.isAvailable && <span style={{ fontSize: "8px", color: "#f87171", fontWeight: 800, background: "rgba(0,0,0,0.8)", padding: "2px 6px", borderRadius: "4px" }}>OUT</span>}
                </div>
              </div>
              <p style={{ fontSize: "12px", fontWeight: 700, color: "rgba(255,255,255,0.9)", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.name}</p>
              <div style={{ display: "flex", alignItems: "center", gap: "3px", marginTop: "2px" }}>
                <span style={{ color: T.gold, fontSize: "10px" }}>★</span>
                <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)", fontFamily: "'DM Sans', sans-serif" }}>{item.rating?.toFixed(1) || "4.5"}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════
// CATEGORY PILL BAR
// ══════════════════════════════════════════════════
function CategoryBar({ categories, active, onSelect }: { categories: MenuCategory[]; active: string; onSelect: (id: string) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current?.querySelector(`[data-active="true"]`) as HTMLElement;
    el?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [active]);

  return (
    <div ref={ref} style={{ display: "flex", gap: "8px", overflowX: "auto", padding: "0 16px 12px", scrollbarWidth: "none" }} className="scrollbar-hide">
      {categories.map(cat => {
        const isActive = cat._id === active;
        return (
          <button key={cat._id} data-active={isActive} onClick={() => onSelect(cat._id)}
            style={{ flexShrink: 0, padding: "8px 16px", borderRadius: "99px", border: `1.5px solid ${isActive ? T.gold : "#333"}`, background: isActive ? `linear-gradient(135deg, ${T.gold}, ${T.goldLight})` : "transparent", color: isActive ? T.emerald : "rgba(255,255,255,0.6)", fontWeight: isActive ? 900 : 600, fontSize: "12px", cursor: "pointer", transition: "all 0.2s", whiteSpace: "nowrap" }}>
            {cat.icon} {cat.name}
          </button>
        );
      })}
    </div>
  );
}

// ══════════════════════════════════════════════════
// PRODUCT DETAIL MODAL
// ══════════════════════════════════════════════════
function ProductDetailModal({ item, isOpen, onClose, onAddToCart }: {
  item: MenuItem | null; isOpen: boolean; onClose: () => void;
  onAddToCart: (item: MenuItem, qty: number, variants: { groupName: string; selected: string[] }[], mod: number) => void;
}) {
  const [quantity, setQuantity] = useState(1);
  const [selections, setSelections] = useState<Record<string, string[]>>({});

  useEffect(() => {
    if (item) {
      setQuantity(1);
      const defaults: Record<string, string[]> = {};
      item.variantGroups?.forEach(g => {
        const def = g.options.find(o => o.isDefault);
        if (def) defaults[g.name] = [def.name];
        else if (g.required && g.options.length > 0) defaults[g.name] = [g.options[0].name];
        else defaults[g.name] = [];
      });
      setSelections(defaults);
    }
  }, [item]);

  if (!isOpen || !item) return null;

  const toggleVariant = (gn: string, on: string, ms: boolean) => {
    setSelections(prev => {
      const cur = prev[gn] || [];
      if (ms) return { ...prev, [gn]: cur.includes(on) ? cur.filter(n => n !== on) : [...cur, on] };
      return { ...prev, [gn]: [on] };
    });
  };

  let mod = 0;
  item.variantGroups?.forEach(g => (selections[g.name] || []).forEach(n => { const o = g.options.find(o => o.name === n); if (o) mod += o.priceModifier; }));
  const total = (item.price + mod) * quantity;
  const varSel = Object.entries(selections).map(([gn, sel]) => ({ groupName: gn, selected: sel }));

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 200, display: "flex", alignItems: "flex-end", justifyContent: "center", backdropFilter: "blur(12px)" }}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#111", width: "100%", maxWidth: "480px", maxHeight: "92vh", borderRadius: "24px 24px 0 0", display: "flex", flexDirection: "column", animation: "slideUp 350ms cubic-bezier(0.32,0.72,0,1)", overflow: "hidden", border: "1px solid #222" }}>
        <div style={{ position: "relative", height: "260px", background: "#1a1a1a", overflow: "hidden", flexShrink: 0 }}>
          {item.imageUrl ? (
            <img src={getHeroUrl(item.imageUrl)} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <div style={{ width: "100%", height: "100%", background: `linear-gradient(135deg, ${T.emerald}, ${T.emeraldMid})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "80px" }}>☕</div>
          )}
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "60px", background: "linear-gradient(to top, #111, transparent)" }} />
          <button onClick={onClose} style={{ position: "absolute", top: "16px", right: "16px", width: "36px", height: "36px", borderRadius: "50%", background: "rgba(0,0,0,0.6)", border: "1px solid rgba(255,255,255,0.1)", color: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", backdropFilter: "blur(8px)" }}>✕</button>
          <div style={{ position: "absolute", top: "16px", left: "16px", display: "flex", gap: "6px" }}>
            <div style={{ background: T.success, color: "white", fontSize: "9px", fontWeight: 800, padding: "3px 8px", borderRadius: "99px" }}>🌿 VEG</div>
            {item.tags?.includes("bestseller") && <div style={{ background: `linear-gradient(135deg, ${T.gold}, ${T.goldLight})`, color: T.emerald, fontSize: "9px", fontWeight: 900, padding: "3px 8px", borderRadius: "99px" }}>⭐ BEST</div>}
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "20px" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "8px" }}>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "26px", fontWeight: 800, color: "white", margin: 0, flex: 1 }}>{item.name}</h2>
            <div style={{ display: "flex", alignItems: "center", gap: "4px", background: "#1a1a1a", padding: "4px 10px", borderRadius: "99px", flexShrink: 0, marginLeft: "12px" }}>
              <span style={{ color: T.gold, fontSize: "12px" }}>★</span>
              <span style={{ fontSize: "12px", fontWeight: 800, color: "white", fontFamily: "'DM Sans', sans-serif" }}>{item.rating?.toFixed(1) || "4.5"}</span>
            </div>
          </div>
          {item.description && <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.5)", margin: "0 0 20px", lineHeight: 1.6 }}>{item.description}</p>}

          {item.variantGroups?.map((g: VariantGroup) => (
            <div key={g.name} style={{ marginBottom: "20px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
                <h3 style={{ fontSize: "14px", fontWeight: 800, color: "white", margin: 0 }}>{g.name}</h3>
                {g.required && <span style={{ background: T.danger + "30", color: T.danger, fontSize: "9px", fontWeight: 800, padding: "2px 8px", borderRadius: "99px" }}>Required</span>}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: g.options.length > 3 ? "1fr 1fr" : `repeat(${g.options.length}, 1fr)`, gap: "8px" }}>
                {g.options.map(opt => {
                  const sel = selections[g.name]?.includes(opt.name);
                  return (
                    <button key={opt.name} onClick={() => toggleVariant(g.name, opt.name, g.multiSelect)}
                      style={{ padding: "12px", background: sel ? `linear-gradient(135deg, ${T.emerald}, ${T.emeraldMid})` : "#1a1a1a", border: `1.5px solid ${sel ? T.emerald : "#333"}`, borderRadius: "12px", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: "3px" }}>
                      <span style={{ fontWeight: 800, fontSize: "13px", color: sel ? T.gold : "white" }}>{opt.name}</span>
                      {opt.priceModifier !== 0 && <span style={{ fontSize: "11px", color: sel ? "rgba(212,165,116,0.6)" : "rgba(255,255,255,0.4)", fontFamily: "'DM Sans', sans-serif" }}>{opt.priceModifier > 0 ? `+₹${opt.priceModifier}` : `-₹${Math.abs(opt.priceModifier)}`}</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div style={{ padding: "16px 20px 24px", borderTop: "1px solid #222", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
            <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", fontWeight: 700 }}>QUANTITY</span>
            <div style={{ display: "flex", alignItems: "center", background: "#1a1a1a", borderRadius: "99px", overflow: "hidden", border: "1px solid #333" }}>
              <button onClick={() => setQuantity(Math.max(1, quantity - 1))} style={{ width: "40px", height: "40px", background: "none", border: "none", color: T.gold, cursor: "pointer", fontSize: "20px", display: "flex", alignItems: "center", justifyContent: "center" }}>−</button>
              <span style={{ minWidth: "36px", textAlign: "center", color: "white", fontWeight: 900, fontSize: "18px", fontFamily: "'DM Sans', sans-serif" }}>{quantity}</span>
              <button onClick={() => setQuantity(quantity + 1)} style={{ width: "40px", height: "40px", background: "none", border: "none", color: T.gold, cursor: "pointer", fontSize: "20px", display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
            </div>
          </div>
          <button onClick={() => { onAddToCart(item, quantity, varSel, mod); onClose(); }} style={{ width: "100%", background: `linear-gradient(135deg, ${T.emerald}, ${T.emeraldMid})`, color: T.gold, border: "none", borderRadius: "16px", padding: "18px 24px", fontWeight: 900, fontSize: "16px", cursor: "pointer", boxShadow: `0 8px 32px ${T.emerald}60`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span>Add to Cart</span>
            <span style={{ fontFamily: "'DM Sans', sans-serif" }}>₹{total.toFixed(0)}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════
// CART VIEW
// ══════════════════════════════════════════════════
function CartView({ cart, onUpdateQty, onPlaceOrder, isPlacing, appliedDiscount, onDiscountChange }: {
  cart: ExtendedCartItem[]; onUpdateQty: (k: string, d: number) => void; onPlaceOrder: () => void;
  isPlacing: boolean; appliedDiscount: AppliedDiscount | null; onDiscountChange: (d: AppliedDiscount | null) => void;
}) {
  const [promoCode, setPromoCode] = useState("");
  const [validating, setValidating] = useState(false);
  const [codeError, setCodeError] = useState("");

  const subtotal = cart.reduce((s, i) => s + (i.price + (i.totalPriceModifier || 0)) * i.quantity, 0);
  const discount = appliedDiscount?.discount || 0;
  const discountedSub = Math.max(0, subtotal - discount);
  const tax = discountedSub * 0.05;
  const total = discountedSub + tax;
  const totalItems = cart.reduce((s, i) => s + i.quantity, 0);

  useEffect(() => {
    if (cart.length === 0 || appliedDiscount?.type === "code") { if (cart.length === 0) onDiscountChange(null); return; }
    const items = cart.map(c => ({ menuItemId: c.menuItemId, name: c.name, price: c.price + (c.totalPriceModifier || 0), quantity: c.quantity }));
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://golden-beans-server.onrender.com/api";
    fetch(`${apiUrl}/promotions/calculate`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ items, subtotal }) })
      .then(r => r.json())
      .then(d => { if (d.success && d.data?.applied) onDiscountChange({ ...d.data.applied, type: "auto" }); else if (appliedDiscount?.type === "auto") onDiscountChange(null); })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cart.length, subtotal]);

  const applyCode = async () => {
    if (!promoCode.trim()) return;
    setValidating(true); setCodeError("");
    try {
      const items = cart.map(c => ({ menuItemId: c.menuItemId, name: c.name, price: c.price + (c.totalPriceModifier || 0), quantity: c.quantity }));
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://golden-beans-server.onrender.com/api";
      const res = await fetch(`${apiUrl}/promotions/codes/validate`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code: promoCode.trim(), items, subtotal }) });
      const data = await res.json();
      if (!data.success) { setCodeError(data.message || "Invalid code"); return; }
      onDiscountChange({ ...data.data, type: "code", code: data.data.code });
      setPromoCode("");
    } catch (e: unknown) { setCodeError(e instanceof Error ? e.message : "Failed"); }
    finally { setValidating(false); }
  };

  if (cart.length === 0) return (
    <div style={{ padding: "40px 20px", textAlign: "center" }}>
      <div style={{ fontSize: "60px", marginBottom: "12px" }}>🛒</div>
      <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "20px", color: "white", margin: "0 0 6px" }}>Cart is Empty</h3>
      <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.4)", margin: 0 }}>Browse the menu to add items</p>
    </div>
  );

  return (
    <div style={{ padding: "16px 16px 100px" }}>
      <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "22px", fontWeight: 800, color: "white", margin: "0 0 4px" }}>My Cart</h2>
      <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", margin: "0 0 16px" }}>{totalItems} item{totalItems !== 1 ? "s" : ""}</p>

      {cart.map(item => (
        <div key={item.menuItemId + JSON.stringify(item.variants)} style={{ background: "#1a1a1a", borderRadius: "16px", padding: "12px", marginBottom: "10px", border: "1px solid #222", display: "flex", gap: "12px", alignItems: "center" }}>
          <div style={{ flexShrink: 0 }}>
            {item.imageUrl ? (
              <img src={getThumbnailUrl(item.imageUrl)} alt={item.name} style={{ width: "56px", height: "56px", borderRadius: "12px", objectFit: "cover" }} />
            ) : (
              <div style={{ width: "56px", height: "56px", borderRadius: "12px", background: `linear-gradient(135deg, ${T.emerald}, ${T.emeraldMid})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px" }}>☕</div>
            )}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontWeight: 800, fontSize: "14px", color: "white", margin: "0 0 2px" }}>{item.name}</p>
            {item.variants && item.variants.some(v => v.selected.length > 0) && <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)", margin: "0 0 4px" }}>{item.variants.flatMap(v => v.selected).join(", ")}</p>}
            <p style={{ fontWeight: 900, fontSize: "14px", color: T.gold, margin: 0, fontFamily: "'DM Sans', sans-serif" }}>₹{((item.price + (item.totalPriceModifier || 0)) * item.quantity).toFixed(0)}</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", background: "#111", borderRadius: "10px", overflow: "hidden", border: "1px solid #333" }}>
            <button onClick={() => onUpdateQty(item.menuItemId + JSON.stringify(item.variants), -1)} style={{ width: "32px", height: "32px", background: "none", border: "none", color: T.gold, cursor: "pointer", fontSize: "18px" }}>−</button>
            <span style={{ fontWeight: 900, color: "white", fontSize: "13px", minWidth: "20px", textAlign: "center" }}>{item.quantity}</span>
            <button onClick={() => onUpdateQty(item.menuItemId + JSON.stringify(item.variants), 1)} style={{ width: "32px", height: "32px", background: "none", border: "none", color: T.gold, cursor: "pointer", fontSize: "18px" }}>+</button>
          </div>
        </div>
      ))}

      {/* Discount */}
      {appliedDiscount && (
        <div style={{ background: appliedDiscount.type === "auto" ? `${T.success}20` : `${T.gold}20`, borderRadius: "14px", padding: "12px 14px", marginTop: "12px", border: `1px solid ${appliedDiscount.type === "auto" ? T.success + "40" : T.gold + "40"}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <p style={{ fontSize: "11px", color: appliedDiscount.type === "auto" ? T.success : T.gold, fontWeight: 800, margin: "0 0 2px" }}>{appliedDiscount.type === "auto" ? "🎉 Auto Promo" : `🎫 Code: ${appliedDiscount.code}`}</p>
            <p style={{ fontSize: "13px", color: "white", fontWeight: 800, margin: 0 }}>Saved ₹{appliedDiscount.discount}</p>
          </div>
          {appliedDiscount.type === "code" && <button onClick={() => onDiscountChange(null)} style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "white", width: "28px", height: "28px", borderRadius: "50%", cursor: "pointer", fontSize: "14px" }}>✕</button>}
        </div>
      )}

      {/* Promo Code */}
      {(!appliedDiscount || appliedDiscount.type === "auto") && (
        <div style={{ background: "#1a1a1a", borderRadius: "14px", padding: "12px", marginTop: "12px", border: "1px dashed #333" }}>
          <p style={{ fontSize: "10px", fontWeight: 800, color: "rgba(255,255,255,0.4)", letterSpacing: "0.05em", textTransform: "uppercase", margin: "0 0 8px" }}>Promo Code</p>
          <div style={{ display: "flex", gap: "8px" }}>
            <input value={promoCode} onChange={e => { setPromoCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "")); setCodeError(""); }}
              placeholder="Enter code..." style={{ flex: 1, padding: "10px 12px", borderRadius: "10px", border: `1px solid ${codeError ? T.danger : "#333"}`, background: "#111", color: "white", fontSize: "14px", fontFamily: "'DM Sans', sans-serif", fontWeight: 700, outline: "none", letterSpacing: "0.05em" }} />
            <button onClick={applyCode} disabled={!promoCode.trim() || validating}
              style={{ padding: "10px 18px", borderRadius: "10px", background: promoCode.trim() ? `linear-gradient(135deg, ${T.emerald}, ${T.emeraldMid})` : "#222", color: promoCode.trim() ? T.gold : "#555", border: "none", fontWeight: 800, fontSize: "12px", cursor: promoCode.trim() ? "pointer" : "not-allowed" }}>
              {validating ? "..." : "Apply"}
            </button>
          </div>
          {codeError && <p style={{ fontSize: "11px", color: T.danger, margin: "6px 0 0", fontWeight: 700 }}>⚠ {codeError}</p>}
        </div>
      )}

      {/* Bill */}
      <div style={{ background: "#1a1a1a", borderRadius: "16px", padding: "16px", marginTop: "14px", border: "1px solid #222" }}>
        {[{ label: "Subtotal", value: `₹${subtotal.toFixed(0)}`, color: "rgba(255,255,255,0.6)" },
          ...(discount > 0 ? [{ label: "Discount", value: `-₹${discount.toFixed(0)}`, color: T.success }] : []),
          { label: "GST (5%)", value: `₹${tax.toFixed(0)}`, color: "rgba(255,255,255,0.6)" }
        ].map(row => (
          <div key={row.label} style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
            <span style={{ fontSize: "13px", color: row.color }}>{row.label}</span>
            <span style={{ fontSize: "13px", color: row.color, fontFamily: "'DM Sans', sans-serif", fontWeight: 700 }}>{row.value}</span>
          </div>
        ))}
        <div style={{ borderTop: "1px solid #333", paddingTop: "10px", marginTop: "4px", display: "flex", justifyContent: "space-between" }}>
          <span style={{ fontSize: "16px", fontWeight: 800, color: "white" }}>Total</span>
          <span style={{ fontSize: "18px", fontWeight: 900, color: T.gold, fontFamily: "'DM Sans', sans-serif" }}>₹{total.toFixed(0)}</span>
        </div>
        {discount > 0 && <p style={{ fontSize: "11px", color: T.success, textAlign: "center", margin: "10px 0 0", fontWeight: 800 }}>🎉 You're saving ₹{discount}!</p>}
      </div>

      <button onClick={onPlaceOrder} disabled={isPlacing} style={{ width: "100%", marginTop: "16px", padding: "18px", borderRadius: "16px", border: "none", background: isPlacing ? "#333" : `linear-gradient(135deg, ${T.emerald}, ${T.emeraldMid})`, color: isPlacing ? "#666" : T.gold, fontWeight: 900, fontSize: "16px", cursor: isPlacing ? "not-allowed" : "pointer", boxShadow: isPlacing ? "none" : `0 8px 32px ${T.emerald}60`, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
        {isPlacing ? "Placing Order..." : `🛒 Place Order — ₹${total.toFixed(0)}`}
      </button>
    </div>
  );
}

function TopCancelBar({ order, onCancelled }: { order: Order; onCancelled: () => void }) {
  const placedAt = new Date(order.createdAt).getTime();
  const [secondsLeft, setSecondsLeft] = useState(() => Math.max(0, 120 - Math.floor((Date.now() - placedAt) / 1000)));
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => { const iv = setInterval(() => setSecondsLeft(Math.max(0, 120 - Math.floor((Date.now() - placedAt) / 1000))), 1000); return () => clearInterval(iv); }, [placedAt]);
  if (secondsLeft <= 0) return null;

  const isUrgent = secondsLeft <= 30;
  const pct = (secondsLeft / 120) * 100;
  const mins = Math.floor(secondsLeft / 60); const secs = secondsLeft % 60;

  const handleCancel = async () => {
    if (cancelling || !confirm(`Cancel order #${order.orderNumber}?`)) return;
    setCancelling(true);
    try { await orderApi.cancelOrder(order._id); localStorage.removeItem("gb_active_order"); onCancelled(); }
    catch { alert("Failed"); setCancelling(false); }
  };

  return (
    <div style={{ position: "sticky", top: 0, zIndex: 45, background: isUrgent ? "linear-gradient(135deg, #7f1d1d, #C0392B)" : "linear-gradient(135deg, #0F3D2E, #1A5340)", borderBottom: `1px solid ${isUrgent ? "#ef4444" : T.gold}` }}>
      <div style={{ padding: "8px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: "8px", padding: "5px 10px", border: `1px solid ${isUrgent ? "rgba(255,255,255,0.4)" : T.gold}` }}>
            <span style={{ fontWeight: 900, fontSize: "12px", color: "white", fontFamily: "'DM Sans', sans-serif" }}>{mins}:{String(secs).padStart(2, "0")}</span>
          </div>
          <p style={{ fontWeight: 800, fontSize: "12px", color: "white", margin: 0 }}>{isUrgent ? "⚠️ Cancel ending!" : "Cancel within 2 min"}</p>
        </div>
        <button onClick={handleCancel} disabled={cancelling} style={{ background: "rgba(255,255,255,0.9)", color: isUrgent ? T.danger : T.emerald, border: "none", borderRadius: "8px", padding: "6px 14px", fontWeight: 800, fontSize: "11px", cursor: cancelling ? "wait" : "pointer" }}>
          {cancelling ? "..." : "✕ CANCEL"}
        </button>
      </div>
      <div style={{ height: "2px", background: "rgba(0,0,0,0.2)" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: isUrgent ? "linear-gradient(90deg, #fca5a5, white)" : `linear-gradient(90deg, ${T.gold}, ${T.goldLight})`, transition: "width 1s linear" }} />
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════
export default function CustomerOrderPage() {
  const params = useParams();
  const router = useRouter();
  const tableId = params.tableId as string;

  const [securityStatus, setSecurityStatus] = useState<"checking" | "passed" | "failed" | "session_ended">("checking");
  const [securityResult, setSecurityResult] = useState<SecurityResult | null>(null);
  const [sessionEndReason, setSessionEndReason] = useState("");
  const [menu, setMenu] = useState<MenuCategory[]>([]);
  const [table, setTable] = useState<Table | null>(null);
  const [existingOrder, setExistingOrder] = useState<Order | null>(null);
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<ExtendedCartItem[]>([]);
  const [activeTab, setActiveTab] = useState<BottomTab>("menu");
  const [isPlacing, setIsPlacing] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>("");
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [appliedDiscount, setAppliedDiscount] = useState<AppliedDiscount | null>(null);
  const [customerData, setCustomerData] = useState<{ name: string; phone: string } | null>(null);
  const prevStatusRef = useRef<string | null>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  const handleSecurityPassed = useCallback(() => setSecurityStatus("passed"), []);
  const handleSecurityFailed = useCallback((result: SecurityResult) => { setSecurityResult(result); setSecurityStatus("failed"); }, []);
  const handleRetrySecurity = useCallback(() => { setSecurityStatus("checking"); setSecurityResult(null); }, []);

  useEffect(() => {
    if (securityStatus !== "passed") return;
    const saved = localStorage.getItem("gb_customer");
    if (saved) { try { const d = JSON.parse(saved); setCustomerData({ name: d.name, phone: d.phone }); } catch {} }
    const handleStorage = () => { const u = localStorage.getItem("gb_customer"); if (u) { try { const d = JSON.parse(u); setCustomerData({ name: d.name, phone: d.phone }); } catch {} } };
    window.addEventListener("storage", handleStorage);
    const iv = setInterval(() => { const u = localStorage.getItem("gb_customer"); if (u) { try { const d = JSON.parse(u); setCustomerData(prev => prev?.name === d.name && prev?.phone === d.phone ? prev : { name: d.name, phone: d.phone }); } catch {} } }, 2000);
    return () => { window.removeEventListener("storage", handleStorage); clearInterval(iv); };
  }, [securityStatus]);

  useEffect(() => {
    if (securityStatus !== "passed") return;
    async function load() {
      try {
        setLoading(true);
        const [menuRes, tableRes] = await Promise.all([menuApi.getMenu(), tableApi.getTable(tableId)]);
        setMenu(menuRes.data.data); setTable(tableRes.data.data);
        if (menuRes.data.data.length > 0) setActiveCategory(menuRes.data.data[0]._id);
        const orderRes = await orderApi.getOrderByTable(tableId);
        if (orderRes.data.data) {
          const order = orderRes.data.data;
          if (["settled", "cancelled"].includes(order.status)) { localStorage.removeItem("gb_active_order"); setExistingOrder(null); }
          else { setExistingOrder(order); prevStatusRef.current = order.status; localStorage.setItem("gb_active_order", order._id); }
        }
      } catch {} finally { setLoading(false); }
    }
    load();
  }, [tableId, securityStatus]);

  useEffect(() => {
    if (securityStatus !== "passed") return;
    let cancelled = false;
    const checkOrder = async () => {
      if (cancelled) return;
      try {
        if (existingOrder) {
          const directRes = await orderApi.getOrder(existingOrder._id);
          const directOrder: Order | null = directRes.data?.data;
          if (directOrder) {
            if (directOrder.status === "settled") { localStorage.setItem("gb_settled_order_id", existingOrder._id); localStorage.setItem("gb_settled_table", existingOrder.tableNumber || tableId); localStorage.removeItem("gb_active_order"); localStorage.removeItem("gb_customer"); setSessionEndReason("Your bill has been settled. Thank you!"); setSecurityStatus("session_ended"); return; }
            if (directOrder.status === "cancelled") { localStorage.removeItem("gb_active_order"); setSessionEndReason("Your order was cancelled."); setSecurityStatus("session_ended"); return; }
          }
        }
        const [orderRes, allRes] = await Promise.all([orderApi.getOrderByTable(tableId), orderApi.getKdsOrders()]);
        if (cancelled) return;
        if (allRes.data.data) setAllOrders(allRes.data.data);
        const newOrder: Order | null = orderRes.data.data;
        if (!newOrder) return;
        prevStatusRef.current = newOrder.status;
        setExistingOrder(newOrder);
      } catch {}
    };
    pollRef.current = setInterval(checkOrder, 5000);
    const onVis = () => { if (document.visibilityState === "visible") checkOrder(); };
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("focus", checkOrder);
    checkOrder();
    return () => { cancelled = true; if (pollRef.current) clearInterval(pollRef.current); document.removeEventListener("visibilitychange", onVis); window.removeEventListener("focus", checkOrder); };
  }, [securityStatus, tableId, existingOrder]);

  const queuePosition = existingOrder ? allOrders.filter(o => ["kotSent", "open"].includes(o.status) && o._id !== existingOrder._id && new Date(o.createdAt).getTime() < new Date(existingOrder.createdAt).getTime()).length : undefined;

  const handleAddToCart = (item: MenuItem, qty: number, variants: { groupName: string; selected: string[] }[], modifier: number) => {
    const key = item._id + JSON.stringify(variants);
    setCart(prev => {
      const ex = prev.find(c => (c.menuItemId + JSON.stringify(c.variants)) === key);
      if (ex) return prev.map(c => (c.menuItemId + JSON.stringify(c.variants)) === key ? { ...c, quantity: c.quantity + qty } : c);
      return [...prev, { menuItemId: item._id, name: item.name, price: item.price, quantity: qty, notes: "", isVeg: true, variants, totalPriceModifier: modifier, imageUrl: item.imageUrl }];
    });
  };

  const updateQty = (key: string, delta: number) => {
    setCart(prev => {
      const ex = prev.find(c => (c.menuItemId + JSON.stringify(c.variants)) === key);
      if (!ex) return prev;
      if (ex.quantity + delta <= 0) return prev.filter(c => (c.menuItemId + JSON.stringify(c.variants)) !== key);
      return prev.map(c => (c.menuItemId + JSON.stringify(c.variants)) === key ? { ...c, quantity: c.quantity + delta } : c);
    });
  };

  const handlePlaceOrderClick = async () => {
    if (cart.length === 0) return;
    try {
      const API = process.env.NEXT_PUBLIC_API_URL || "https://golden-beans-server.onrender.com/api";
      const pmRes = await fetch(`${API}/settings/payment_mode`).then(r => r.json());
      const pm = pmRes.data || "counter";
      if (pm === "online" || pm === "both") await initiateRazorpayPayment();
      else placeOrder(customerData || undefined);
    } catch { placeOrder(customerData || undefined); }
  };

  const initiateRazorpayPayment = async () => {
    const subtotal = cart.reduce((s, i) => s + (i.price + (i.totalPriceModifier || 0)) * i.quantity, 0);
    const discount = appliedDiscount?.discount || 0;
    const total = Math.round(Math.max(0, subtotal - discount) * 1.05);
    const API = process.env.NEXT_PUBLIC_API_URL || "https://golden-beans-server.onrender.com/api";
    setIsPlacing(true);
    try {
      const res = await fetch(`${API}/payment/create-order`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ amount: total, tableNumber: table?.tableNumber }) }).then(r => r.json());
      if (!res.success) throw new Error(res.message);
      const { orderId: rzpOrderId, keyId } = res.data;
      await new Promise<void>((resolve, reject) => { if ((window as any).Razorpay) { resolve(); return; } const s = document.createElement("script"); s.src = "https://checkout.razorpay.com/v1/checkout.js"; s.onload = () => resolve(); s.onerror = () => reject(new Error("Razorpay load failed")); document.body.appendChild(s); });
      await new Promise<void>((resolve, reject) => {
        const rzp = new (window as any).Razorpay({ key: keyId, amount: total * 100, currency: "INR", name: "Golden Beans Café", description: `Table ${table?.tableNumber}`, order_id: rzpOrderId, prefill: { name: customerData?.name || "", contact: customerData?.phone || "" }, theme: { color: "#0F3D2E" }, handler: async (response: any) => { try { const v = await fetch(`${API}/payment/verify`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(response) }).then(r => r.json()); if (v.success) { await placeOrder(customerData || undefined, response.razorpay_payment_id); resolve(); } else reject(new Error("Verification failed")); } catch (e) { reject(e); } }, modal: { ondismiss: () => reject(new Error("Payment cancelled")) } });
        rzp.open();
      });
    } catch (err: any) { if (err.message !== "Payment cancelled") alert(err.message || "Payment failed"); }
    finally { setIsPlacing(false); }
  };

  const placeOrder = async (customer?: { name: string; phone: string }, paymentId?: string) => {
    if (cart.length === 0) return;
    setIsPlacing(true);
    try {
      const orderItems = cart.map(c => ({ menuItemId: c.menuItemId, name: c.name, price: c.price + (c.totalPriceModifier || 0), quantity: c.quantity, notes: c.variants && c.variants.length > 0 ? c.variants.flatMap(v => v.selected).join(", ") : c.notes, isVeg: c.isVeg }));
      const res = await orderApi.createOrder({ tableId, items: orderItems, createdBy: "customer", customerName: customer?.name || customerData?.name || "", customerPhone: customer?.phone || customerData?.phone || "", discount: appliedDiscount?.discount || 0, appliedPromoId: appliedDiscount?.promotionId || null, appliedPromoCode: appliedDiscount?.code || null, razorpayPaymentId: paymentId || null });
      const newOrder: Order = res.data.data;
      setCart([]); setAppliedDiscount(null); setExistingOrder(newOrder); prevStatusRef.current = newOrder.status; localStorage.setItem("gb_active_order", newOrder._id); setActiveTab("order");
    } catch (err: unknown) { alert(err instanceof Error ? err.message : "Failed"); }
    finally { setIsPlacing(false); }
  };

  const handleCancelled = () => { setExistingOrder(null); prevStatusRef.current = null; };
  const totalCartItems = cart.reduce((s, i) => s + i.quantity, 0);
  const activeCategory_items = (menu.find(c => c._id === activeCategory)?.items || []) as MenuItem[];
  const allItems = menu.flatMap(c => c.items as MenuItem[]);
  const bestsellers = allItems.filter(i => i.tags?.includes("bestseller") && i.isAvailable);

  if (securityStatus === "checking") return <SecurityCheckScreen onPassed={handleSecurityPassed} onFailed={handleSecurityFailed} />;
  if (securityStatus === "failed" && securityResult) return <AwarenessScreen result={securityResult} onRetry={handleRetrySecurity} />;
  if (securityStatus === "session_ended") return <SessionEndedScreen reason={sessionEndReason} onRestart={() => router.replace("/")} />;

  return (
    <div style={{ minHeight: "100vh", background: T.dark, display: "flex", flexDirection: "column", width: "100%", overflowX: "hidden", fontFamily: "'Nunito', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=Nunito:wght@400;600;700;800;900&family=DM+Sans:wght@400;600;700;800;900&display=swap');
        html, body { overflow-x: hidden; margin: 0; padding: 0; background: #0A0A0A; }
        .scrollbar-hide { scrollbar-width: none; -ms-overflow-style: none; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
        img { -webkit-user-drag: none; user-select: none; pointer-events: none; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes welcomeLogo { from { opacity: 0; transform: scale(0.6); } to { opacity: 1; transform: scale(1); } }
        @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 0.6; } 50% { opacity: 1; } }
        @keyframes cartBounce { 0%,100% { transform: scale(1); } 30% { transform: scale(1.5); } 80% { transform: scale(1.05); } }
      `}</style>

      {existingOrder && !["settled", "cancelled"].includes(existingOrder.status) && <TopCancelBar order={existingOrder} onCancelled={handleCancelled} />}

      {/* Header */}
      <header style={{ position: "sticky", top: 0, zIndex: 30, background: "rgba(10,10,10,0.95)", backdropFilter: "blur(20px)", padding: "12px 16px", borderBottom: "1px solid #1a1a1a" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ width: "36px", height: "36px", borderRadius: "10px", overflow: "hidden", border: "1px solid rgba(212,165,116,0.3)" }}>
              <img src="/logo-small.png" alt="GB" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
            </div>
            <div>
              <p style={{ fontFamily: "'Playfair Display', serif", fontSize: "16px", fontWeight: 800, color: T.gold, margin: 0, lineHeight: 1 }}>Golden Beans</p>
              <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.3)", margin: 0, fontWeight: 600 }}>
                {table ? `Table ${table.tableNumber}` : "..."}{customerData ? ` · ${customerData.name}` : ""}
              </p>
            </div>
          </div>
          {activeTab === "menu" && (
            <div style={{ display: "flex", alignItems: "center", gap: "6px", background: "#1a1a1a", borderRadius: "10px", padding: "6px 12px", border: "1px solid #222" }}>
              <span style={{ fontSize: "12px" }}>🌿</span>
              <span style={{ fontSize: "10px", fontWeight: 800, color: T.success }}>100% Veg</span>
            </div>
          )}
        </div>
      </header>

      <main style={{ flex: 1, paddingBottom: "80px" }}>
        {/* MENU TAB */}
        {activeTab === "menu" && (
          <div>
            {loading ? (
              <div style={{ padding: "20px" }}>
                <div style={{ height: "260px", background: "#1a1a1a", borderRadius: "0", marginBottom: "20px", animation: "pulse 1.5s infinite" }} />
                <div style={{ display: "flex", gap: "12px", overflowX: "auto", padding: "0 16px", marginBottom: "20px" }}>
                  {[1,2,3].map(i => <div key={i} style={{ flexShrink: 0, width: "140px", height: "160px", background: "#1a1a1a", borderRadius: "16px", animation: "pulse 1.5s infinite" }} />)}
                </div>
              </div>
            ) : (
              <>
                {/* Hero Carousel */}
                <HeroCarousel items={allItems} onTap={setSelectedItem} cart={cart} />

                <div style={{ padding: "20px 0 0" }}>
                  {/* Bestsellers row */}
                  {bestsellers.length > 0 && <ItemRow title="Bestsellers" emoji="⭐" items={bestsellers} cart={cart} onTap={setSelectedItem} />}

                  {/* Category filter */}
                  <CategoryBar categories={menu} active={activeCategory} onSelect={setActiveCategory} />

                  {/* Category items row */}
                  <ItemRow
                    title={menu.find(c => c._id === activeCategory)?.name || ""}
                    emoji={menu.find(c => c._id === activeCategory)?.icon}
                    items={activeCategory_items}
                    cart={cart}
                    onTap={setSelectedItem}
                  />

                  {/* All other categories */}
                  {menu.filter(c => c._id !== activeCategory).map(cat => (
                    <ItemRow key={cat._id} title={cat.name} emoji={cat.icon} items={cat.items as MenuItem[]} cart={cart} onTap={setSelectedItem} />
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* CART TAB */}
        {activeTab === "cart" && (
          <CartView cart={cart} onUpdateQty={updateQty} onPlaceOrder={handlePlaceOrderClick} isPlacing={isPlacing} appliedDiscount={appliedDiscount} onDiscountChange={setAppliedDiscount} />
        )}

        {/* ORDER TAB */}
        {activeTab === "order" && (
          <div style={{ paddingBottom: "20px" }}>
            <div style={{ padding: "16px 16px 0" }}>
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "22px", fontWeight: 800, color: "white", margin: "0 0 4px" }}>My Order</h2>
              <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", margin: "0 0 16px" }}>Live tracking</p>
            </div>
            {existingOrder ? <LiveOrderTracker order={existingOrder} queuePosition={queuePosition} /> : (
              <div style={{ textAlign: "center", padding: "60px 20px" }}>
                <div style={{ fontSize: "60px", marginBottom: "12px" }}>📋</div>
                <p style={{ fontWeight: 800, fontSize: "16px", color: "white", margin: "0 0 6px" }}>No Active Orders</p>
                <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.4)", margin: 0 }}>Place an order to track it here</p>
              </div>
            )}
          </div>
        )}

        {/* INFO TAB */}
        {activeTab === "info" && (
          <div style={{ padding: "20px 16px 20px" }}>
            <div style={{ background: `linear-gradient(135deg, ${T.emerald}, ${T.emeraldMid})`, borderRadius: "20px", padding: "24px", marginBottom: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "14px" }}>
                <img src="/logo-small.png" alt="GB" style={{ width: "52px", height: "52px", borderRadius: "14px" }} />
                <div>
                  <p style={{ fontFamily: "'Playfair Display', serif", fontSize: "22px", fontWeight: 800, color: T.gold, margin: 0 }}>Golden Beans</p>
                  <p style={{ fontSize: "11px", color: "rgba(212,165,116,0.7)", margin: "2px 0 0", letterSpacing: "0.1em", fontWeight: 700 }}>CAFE & BISTRO</p>
                </div>
              </div>
              <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.8)", margin: 0, lineHeight: 1.6 }}>Premium 100% pure vegetarian cafe in Surat. Handcrafted coffee, fresh snacks & more.</p>
            </div>
            {table && (
              <div style={{ background: "#1a1a1a", borderRadius: "16px", padding: "16px", border: "1px solid #222", display: "flex", alignItems: "center", gap: "12px" }}>
                <span style={{ fontSize: "28px" }}>🪑</span>
                <div>
                  <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.3)", fontWeight: 700, textTransform: "uppercase", margin: 0 }}>Your Table</p>
                  <p style={{ fontWeight: 900, fontSize: "18px", color: "white", margin: "2px 0 0" }}>Table {table.tableNumber}</p>
                </div>
              </div>
            )}
            <div style={{ marginTop: "16px", display: "flex", gap: "10px" }}>
              <div style={{ flex: 1, background: "#1a1a1a", borderRadius: "14px", padding: "14px", border: "1px solid #222", textAlign: "center" }}>
                <p style={{ fontSize: "22px", margin: "0 0 4px" }}>🌿</p>
                <p style={{ fontSize: "11px", fontWeight: 800, color: T.success, margin: 0 }}>100% Pure Vegetarian</p>
              </div>
              <div style={{ flex: 1, background: "#1a1a1a", borderRadius: "14px", padding: "14px", border: "1px solid #222", textAlign: "center" }}>
                <p style={{ fontSize: "22px", margin: "0 0 4px" }}>☕</p>
                <p style={{ fontSize: "11px", fontWeight: 800, color: T.gold, margin: 0 }}>Handcrafted Coffee</p>
              </div>
            </div>
          </div>
        )}

        <CRMCaptureCard tableId={tableId} />
        <WaiterHelpSheet tableId={tableId} tableNumber={table?.tableNumber || tableId} />
      </main>

      {/* Bottom Nav */}
      <nav style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "rgba(10,10,10,0.97)", backdropFilter: "blur(20px)", borderTop: "1px solid #1a1a1a", padding: "8px 0 max(8px, env(safe-area-inset-bottom))", zIndex: 40 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-around", maxWidth: "480px", margin: "0 auto" }}>
          {([
            { id: "menu", icon: "🍽️", label: "Menu", badge: null },
            { id: "order", icon: "📋", label: "Order", badge: existingOrder ? "•" : null },
            { id: "cart", icon: "🛒", label: "Cart", badge: totalCartItems > 0 ? totalCartItems : null },
            { id: "info", icon: "ℹ️", label: "Info", badge: null },
          ] as { id: BottomTab; icon: string; label: string; badge: number | string | null }[]).map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "3px", background: "none", border: "none", cursor: "pointer", padding: "4px 20px", position: "relative", transition: "all 0.2s" }}>
                <span style={{ fontSize: "22px", filter: isActive ? "none" : "grayscale(0.8) opacity(0.5)", transform: isActive ? "scale(1.1)" : "scale(1)", transition: "all 0.2s" }}>{tab.icon}</span>
                <span style={{ fontSize: "10px", fontWeight: isActive ? 800 : 600, color: isActive ? T.gold : "rgba(255,255,255,0.3)", transition: "color 0.2s" }}>{tab.label}</span>
                {isActive && <div style={{ position: "absolute", bottom: "-8px", left: "50%", transform: "translateX(-50%)", width: "20px", height: "2px", background: T.gold, borderRadius: "2px" }} />}
                {tab.badge !== null && (
                  <div style={{ position: "absolute", top: "0", right: "10px", minWidth: typeof tab.badge === "number" ? "18px" : "10px", height: typeof tab.badge === "number" ? "18px" : "10px", padding: typeof tab.badge === "number" ? "0 4px" : "0", borderRadius: "99px", background: T.danger, color: "white", fontSize: "9px", fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid #0A0A0A", animation: "cartBounce 0.5s ease" }}>
                    {typeof tab.badge === "number" ? tab.badge : ""}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      <ProductDetailModal item={selectedItem} isOpen={!!selectedItem} onClose={() => setSelectedItem(null)} onAddToCart={handleAddToCart} />
    </div>
  );
}
