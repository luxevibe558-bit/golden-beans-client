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
  emerald: "#0F3D2E",
  emeraldMid: "#1A5340",
  emeraldLight: "#2D7A5F",
  gold: "#D4A574",
  goldLight: "#E8C895",
  goldDark: "#B08550",
  cream: "#FAF6F0",
  creamDark: "#F0E8DA",
  ivory: "#FFFBF5",
  text: "#1A1208",
  textMuted: "#7A6B54",
  textDim: "#A89B80",
  border: "#E5DCC9",
  success: "#4A8B4A",
  danger: "#C0392B",
};

interface ExtendedCartItem extends CartItem {
  variants?: { groupName: string; selected: string[]; }[];
  totalPriceModifier?: number;
  imageUrl?: string;
}

interface AppliedDiscount {
  promotionId: string;
  name: string;
  description: string;
  discount: number;
  type: "auto" | "code";
  code?: string;
  promoCodeId?: string;
}

type BottomTab = "menu" | "order" | "cart" | "info";

interface SecurityResult {
  allowed: boolean;
  ipAllowed: boolean;
  gpsAllowed: boolean;
  gpsRequired: boolean;
  ipRequired: boolean;
  distance: number | null;
  cafeName: string;
  cafeAddress: string;
  cafePhone: string;
  wifiName: string;
  reason: string;
}

// ═════════════════════════════════════════════════════════════
// SECURITY CHECK PAGE
// ═════════════════════════════════════════════════════════════
// ════════════════════════════════════════════════════════════
// PREMIUM SECURITY CHECK SCREEN - Step by step verification
// Replace the existing SecurityCheckScreen function in 
// client-new/src/app/order/[tableId]/page.tsx
// ════════════════════════════════════════════════════════════
 
// FIND THIS in your page.tsx:
//   function SecurityCheckScreen({ onPassed, onFailed }: {
//     onPassed: () => void;
//     onFailed: (result: SecurityResult) => void;
//   }) {
//     ...entire function...
//   }
 
// REPLACE WITH:
 
function SecurityCheckScreen({ onPassed, onFailed }: {
  onPassed: () => void;
  onFailed: (result: SecurityResult) => void;
}) {
  type CheckState = "pending" | "loading" | "success" | "failed";
 
  const [gpsCheck, setGpsCheck] = useState<CheckState>("pending");
  const [wifiCheck, setWifiCheck] = useState<CheckState>("pending");
 
  useEffect(() => {
    let mounted = true;
 
    async function runSecurityCheck() {
      try {
        // ─── Step 1: GPS Permission ───
        if (mounted) setGpsCheck("loading");
        await new Promise(r => setTimeout(r, 400)); // brief loading state
 
        if (!("geolocation" in navigator)) {
          if (mounted) {
            setGpsCheck("failed");
            await new Promise(r => setTimeout(r, 600));
            onFailed({
              allowed: false, ipAllowed: false, gpsAllowed: false,
              gpsRequired: true, ipRequired: true,
              distance: null, cafeName: "Golden Beans", cafeAddress: "",
              cafePhone: "", wifiName: "GoldenBeans-WiFi",
              reason: "GPS not supported on this device",
            });
          }
          return;
        }
 
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 0,
          });
        }).catch(err => {
          throw new Error(err.code === 1 ? "DENIED" : err.code === 2 ? "UNAVAILABLE" : "TIMEOUT");
        });
 
        if (mounted) setGpsCheck("success");
        await new Promise(r => setTimeout(r, 500));
 
        // ─── Step 2: Server Check (IP + GPS) ───
        if (mounted) setWifiCheck("loading");
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://golden-beans-server.onrender.com/api";
        const res = await fetch(`${apiUrl}/security/check`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          }),
        });
 
        const data = await res.json();
        if (!data.success) throw new Error(data.message || "Security check failed");
 
        const result: SecurityResult = data.data;
 
        if (mounted) {
          // Update individual checks
          setGpsCheck(result.gpsAllowed ? "success" : "failed");
          setWifiCheck(result.ipAllowed ? "success" : "failed");
 
          await new Promise(r => setTimeout(r, 800));
 
          if (result.allowed) {
            onPassed();
          } else {
            onFailed(result);
          }
        }
      } catch (err: unknown) {
        if (!mounted) return;
        const msg = err instanceof Error ? err.message : "Unknown error";
        const isGPSDenied = msg === "DENIED" || msg.includes("permission") || msg.includes("denied");
 
        if (isGPSDenied || msg === "TIMEOUT" || msg === "UNAVAILABLE") {
          setGpsCheck("failed");
        } else {
          setWifiCheck("failed");
        }
 
        await new Promise(r => setTimeout(r, 800));
 
        onFailed({
          allowed: false,
          ipAllowed: !msg.toLowerCase().includes("ip") && !msg.toLowerCase().includes("connect"),
          gpsAllowed: !isGPSDenied && msg !== "TIMEOUT" && msg !== "UNAVAILABLE",
          gpsRequired: true,
          ipRequired: true,
          distance: null,
          cafeName: "Golden Beans Cafe & Bistro",
          cafeAddress: "Pramukh Darshan Society, Dabholi, Surat",
          cafePhone: "+91 XXXXX XXXXX",
          wifiName: "GoldenBeans-WiFi",
          reason: isGPSDenied
            ? "Location access denied"
            : msg === "TIMEOUT"
              ? "Location request timed out"
              : "Connection error. Please connect to cafe WiFi.",
        });
      }
    }
 
    runSecurityCheck();
    return () => { mounted = false; };
  }, [onPassed, onFailed]);
 
  return (
    <div style={{
      minHeight: "100vh",
      background: `linear-gradient(180deg, ${T.emerald} 0%, ${T.emeraldMid} 100%)`,
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "20px",
    }}>
      <div style={{ textAlign: "center", maxWidth: "360px", width: "100%" }}>
        <div style={{
          width: "110px", height: "110px",
          borderRadius: "50%",
          overflow: "hidden",
          margin: "0 auto 20px",
          border: "3px solid rgba(212,165,116,0.5)",
          boxShadow: "0 0 0 6px rgba(212,165,116,0.1), 0 12px 32px rgba(0,0,0,0.4)",
          background: "#1A1A1A",
          flexShrink: 0,
        }}>
          <img src="/logo-large.png" alt="Golden Beans" draggable={false}
            style={{ width: "100%", height: "100%", objectFit: "cover", pointerEvents: "none" }} />
        </div>
 
        <h2 style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: "24px", fontWeight: 800,
          color: T.gold, margin: "0 0 6px",
          letterSpacing: "-0.02em",
        }}>Securing Your Session</h2>
 
        <p style={{ fontSize: "12px", color: "rgba(212,165,116,0.7)", margin: "0 0 24px", fontWeight: 600, lineHeight: 1.5 }}>
          Verifying you&apos;re at Golden Beans Cafe
        </p>
 
        {/* ─── Check Items ─── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "20px" }}>
          <CheckItem
            state={gpsCheck}
            icon={<Icons.Location size={18} />}
            title="Location Verification"
            description={
              gpsCheck === "pending" ? "Waiting to start..." :
                gpsCheck === "loading" ? "Checking your location..." :
                  gpsCheck === "success" ? "You're at the cafe ✓" :
                    "Location not verified"
            }
          />
 
          <CheckItem
            state={wifiCheck}
            icon={<Icons.Wifi size={18} />}
            title="Network Verification"
            description={
              wifiCheck === "pending" ? "Waiting for location check..." :
                wifiCheck === "loading" ? "Confirming cafe WiFi..." :
                  wifiCheck === "success" ? "Connected to cafe network ✓" :
                    "Network not verified"
            }
          />
        </div>
 
        <p style={{ fontSize: "10px", color: "rgba(212,165,116,0.45)", margin: 0, fontWeight: 600, lineHeight: 1.5 }}>
          🔒 This protects against fake orders & spam<br />
          Your privacy is our priority
        </p>
      </div>
    </div>
  );
}
 
// ─── CheckItem Component ───
function CheckItem({ state, icon, title, description }: {
  state: "pending" | "loading" | "success" | "failed";
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  const colors = {
    pending: { bg: "rgba(255,255,255,0.04)", border: "rgba(212,165,116,0.15)", iconBg: "rgba(255,255,255,0.05)", iconColor: "rgba(212,165,116,0.4)", titleColor: "rgba(212,165,116,0.5)", descColor: "rgba(212,165,116,0.35)" },
    loading: { bg: "rgba(212,165,116,0.08)", border: "rgba(212,165,116,0.35)", iconBg: "rgba(212,165,116,0.15)", iconColor: T.gold, titleColor: T.gold, descColor: "rgba(212,165,116,0.7)" },
    success: { bg: "rgba(74,139,74,0.12)", border: "rgba(74,139,74,0.45)", iconBg: "rgba(74,139,74,0.25)", iconColor: "#86c686", titleColor: "#86c686", descColor: "rgba(134,198,134,0.85)" },
    failed: { bg: "rgba(192,57,43,0.12)", border: "rgba(192,57,43,0.45)", iconBg: "rgba(192,57,43,0.25)", iconColor: "#fca5a5", titleColor: "#fca5a5", descColor: "rgba(252,165,165,0.85)" },
  };
  const c = colors[state];
 
  return (
    <div style={{
      background: c.bg,
      border: `1.5px solid ${c.border}`,
      borderRadius: "16px",
      padding: "12px 14px",
      display: "flex",
      alignItems: "center",
      gap: "12px",
      transition: "all 400ms cubic-bezier(0.16, 1, 0.3, 1)",
      animation: state === "success" ? "gb-fadeInUp 300ms ease both" : undefined,
      boxShadow: state === "success" ? "0 4px 16px rgba(74,139,74,0.15)" : state === "loading" ? "0 4px 16px rgba(212,165,116,0.2)" : state === "failed" ? "0 4px 16px rgba(192,57,43,0.15)" : "none",
    }}>
      {/* Icon */}
      <div style={{
        width: "40px", height: "40px",
        borderRadius: "10px",
        background: c.iconBg,
        display: "flex", alignItems: "center", justifyContent: "center",
        color: c.iconColor,
        flexShrink: 0,
        transition: "all 300ms ease",
      }}>
        {icon}
      </div>
 
      {/* Info */}
      <div style={{ flex: 1, minWidth: 0, textAlign: "left" }}>
        <p style={{
          fontWeight: 800, fontSize: "13px",
          color: c.titleColor,
          margin: "0 0 2px",
          letterSpacing: "-0.01em",
          transition: "color 300ms ease",
        }}>{title}</p>
        <p style={{
          fontSize: "11px",
          color: c.descColor,
          margin: 0,
          fontWeight: 600,
          lineHeight: 1.4,
          transition: "color 300ms ease",
        }}>{description}</p>
      </div>
 
      {/* Status indicator */}
      <div style={{ flexShrink: 0, width: "28px", height: "28px", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {state === "pending" && (
          <div style={{
            width: "10px", height: "10px",
            borderRadius: "50%",
            border: "2px solid rgba(212,165,116,0.25)",
          }} />
        )}
 
        {state === "loading" && (
          <div style={{
            width: "20px", height: "20px",
            borderRadius: "50%",
            border: `2.5px solid rgba(212,165,116,0.2)`,
            borderTopColor: T.gold,
            animation: "gb-spin 0.7s linear infinite",
          }} />
        )}
 
        {state === "success" && (
          <div style={{
            width: "26px", height: "26px",
            borderRadius: "50%",
            background: "linear-gradient(135deg, #4A8B4A, #2d6a2d)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "white",
            boxShadow: "0 4px 12px rgba(74,139,74,0.5)",
            animation: "gb-scaleInBounce 400ms cubic-bezier(0.34, 1.56, 0.64, 1)",
          }}>
            <Icons.Check size={16} />
          </div>
        )}
 
        {state === "failed" && (
          <div style={{
            width: "26px", height: "26px",
            borderRadius: "50%",
            background: "linear-gradient(135deg, #C0392B, #d63b2a)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "white",
            boxShadow: "0 4px 12px rgba(192,57,43,0.5)",
            animation: "gb-scaleInBounce 400ms cubic-bezier(0.34, 1.56, 0.64, 1)",
          }}>
            <Icons.Close size={14} />
          </div>
        )}
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════
// AWARENESS SCREEN — When security check fails
// ═════════════════════════════════════════════════════════════
function AwarenessScreen({ result, onRetry }: { result: SecurityResult; onRetry: () => void }) {
  return (
    <div style={{
      minHeight: "100vh",
      background: `linear-gradient(180deg, ${T.emerald} 0%, ${T.emeraldMid} 100%)`,
      display: "flex", flexDirection: "column",
      padding: "20px",
      overflowX: "hidden",
    }}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", maxWidth: "400px", width: "100%", margin: "0 auto" }}>
        <div style={{
  width: "100px", height: "100px",
  borderRadius: "50%",
  overflow: "hidden",
  marginBottom: "20px",
  border: "3px solid rgba(212,165,116,0.5)",
  boxShadow: "0 0 0 6px rgba(212,165,116,0.1), 0 8px 24px rgba(0,0,0,0.4)",
  background: "#1A1A1A",
}}>
  <img src="/logo-large.png" alt="Golden Beans" draggable={false} style={{ width: "100%", height: "100%", objectFit: "cover", pointerEvents: "none" }} />
</div>

        <div style={{
          width: "76px", height: "76px",
          background: "linear-gradient(135deg, rgba(192,57,43,0.15), rgba(192,57,43,0.05))",
          border: "2px solid rgba(192,57,43,0.3)",
          borderRadius: "20px",
          display: "flex", alignItems: "center", justifyContent: "center",
          marginBottom: "20px",
          color: "#f87171",
          animation: "gb-pulse 2s ease-in-out infinite",
        }}>
          <Icons.Wifi size={36} />
        </div>

        <h1 style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: "26px", fontWeight: 800,
          color: T.gold, margin: "0 0 8px",
          textAlign: "center", letterSpacing: "-0.02em",
          lineHeight: 1.2,
        }}>
          Access Restricted
        </h1>

        <p style={{
          fontSize: "13px",
          color: "rgba(212,165,116,0.85)",
          textAlign: "center",
          margin: "0 0 24px",
          fontWeight: 500, lineHeight: 1.6,
          maxWidth: "320px",
        }}>
          {result.reason}
        </p>

        {/* Issue Cards */}
        <div style={{ width: "100%", marginBottom: "20px" }}>
          {!result.ipAllowed && (
            <div style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(212,165,116,0.2)",
              borderRadius: "16px",
              padding: "14px",
              marginBottom: "10px",
              display: "flex", gap: "12px", alignItems: "flex-start",
            }}>
              <div style={{
                width: "36px", height: "36px",
                borderRadius: "10px",
                background: "rgba(212,165,116,0.15)",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: T.gold, flexShrink: 0,
              }}>
                <Icons.Wifi size={16} />
              </div>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontWeight: 800, fontSize: "12px", color: T.gold, margin: "0 0 3px" }}>
                  Connect to Cafe WiFi
                </p>
                <p style={{ fontSize: "11px", color: "rgba(212,165,116,0.7)", margin: 0, lineHeight: 1.5 }}>
                  Network: <strong style={{ color: T.goldLight }}>{result.wifiName}</strong>
                </p>
                <p style={{ fontSize: "10px", color: "rgba(212,165,116,0.5)", margin: "5px 0 0", lineHeight: 1.4 }}>
                  Please disconnect from mobile data and join our WiFi
                </p>
              </div>
            </div>
          )}

          {!result.gpsAllowed && (
            <div style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(212,165,116,0.2)",
              borderRadius: "16px",
              padding: "14px",
              marginBottom: "10px",
              display: "flex", gap: "12px", alignItems: "flex-start",
            }}>
              <div style={{
                width: "36px", height: "36px",
                borderRadius: "10px",
                background: "rgba(212,165,116,0.15)",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: T.gold, flexShrink: 0,
              }}>
                <Icons.Location size={16} />
              </div>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontWeight: 800, fontSize: "12px", color: T.gold, margin: "0 0 3px" }}>
                  Enable Location Access
                </p>
                <p style={{ fontSize: "11px", color: "rgba(212,165,116,0.7)", margin: 0, lineHeight: 1.5 }}>
                  {result.distance !== null
                    ? `You're ${result.distance}m away from cafe`
                    : "Please allow location to verify you're at the cafe"}
                </p>
                <p style={{ fontSize: "10px", color: "rgba(212,165,116,0.5)", margin: "5px 0 0", lineHeight: 1.4 }}>
                  Settings → Privacy → Location → Browser → Allow
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Privacy Notice */}
        <div style={{
          background: "rgba(74,139,74,0.1)",
          border: "1px solid rgba(74,139,74,0.3)",
          borderRadius: "16px",
          padding: "14px",
          width: "100%",
          marginBottom: "20px",
        }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
            <div style={{
              width: "30px", height: "30px",
              borderRadius: "8px",
              background: "rgba(74,139,74,0.2)",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}>
              <span style={{ fontSize: "16px" }}>🔒</span>
            </div>
            <div>
              <p style={{ fontWeight: 800, fontSize: "12px", color: "#86c686", margin: "0 0 4px" }}>
                Why these checks?
              </p>
              <p style={{ fontSize: "11px", color: "rgba(212,165,116,0.7)", margin: 0, lineHeight: 1.6 }}>
                Restricting menu access to cafe customers protects you and us from fake orders, scam attempts, and ensures every order is legitimate.
              </p>
            </div>
          </div>
        </div>

        {/* Cafe Info */}
        <div style={{ width: "100%", marginBottom: "20px" }}>
          <div style={{
            background: "rgba(255,255,255,0.04)",
            borderRadius: "14px",
            padding: "12px 14px",
            display: "flex", alignItems: "center", gap: "10px",
            marginBottom: "8px",
          }}>
            <Icons.Location size={14} color="rgba(212,165,116,0.6)" />
            <span style={{ fontSize: "11px", color: "rgba(212,165,116,0.85)", fontWeight: 600 }}>
              {result.cafeAddress}
            </span>
          </div>
          <div style={{
            background: "rgba(255,255,255,0.04)",
            borderRadius: "14px",
            padding: "12px 14px",
            display: "flex", alignItems: "center", gap: "10px",
          }}>
            <Icons.Phone size={14} color="rgba(212,165,116,0.6)" />
            <span style={{ fontSize: "11px", color: "rgba(212,165,116,0.85)", fontWeight: 600 }}>
              {result.cafePhone}
            </span>
          </div>
        </div>

        <Button variant="gold" size="lg" fullWidth onClick={onRetry} icon={<Icons.ArrowRight size={14} />} iconPosition="right">
          Try Again
        </Button>

        <p style={{ fontSize: "10px", color: "rgba(212,165,116,0.4)", textAlign: "center", margin: "16px 0 0", fontWeight: 600 }}>
          {result.cafeName}
        </p>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════
// SETTLEMENT KILL SCREEN
// ═════════════════════════════════════════════════════════════
function SessionEndedScreen({ reason, onRestart }: { reason: string; onRestart: () => void; orderId?: string; tableId?: string; totalAmount?: number }) {
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [categories, setCategories] = useState({ food: 0, service: 0, ambiance: 0, value: 0 });
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [screen, setScreen] = useState<'feedback' | 'thankyou'>('feedback');

  const API = 'https://golden-beans-server.onrender.com/api';

  const handleSubmitFeedback = async () => {
    if (rating === 0) return;
    setSubmitting(true);
    try {
      await fetch(`${API}/feedback/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: localStorage.getItem('gb_settled_order_id') || 'unknown',
          tableId: localStorage.getItem('gb_settled_table') || 'unknown',
          tableNumber: localStorage.getItem('gb_settled_table') || 'unknown',
          rating,
          categories,
          comment,
        }),
      });
    } catch {}
    setSubmitting(false);
    setFeedbackSubmitted(true);
    setScreen('thankyou');
  };

  const handleSkip = () => {
    setScreen('thankyou');
  };

  // Auto redirect only after feedback submitted or on thank you screen
  useEffect(() => {
    if (screen !== 'thankyou') return;
    const timer = setTimeout(() => onRestart(), 5000);
    return () => clearTimeout(timer);
  }, [screen, onRestart]);

  // ── THANK YOU SCREEN ──
  if (screen === 'thankyou') return (
    <div style={{ minHeight: "100vh", background: `linear-gradient(180deg, ${T.emerald} 0%, ${T.emeraldMid} 100%)`, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
      <div style={{ textAlign: "center", maxWidth: "320px" }}>
        <div style={{ width: "84px", height: "84px", margin: "0 auto 20px", borderRadius: "50%", background: `linear-gradient(135deg, ${T.gold}, ${T.goldLight})`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 12px 32px rgba(212,165,116,0.4)", animation: "gb-scaleInBounce 0.5s cubic-bezier(0.34,1.56,0.64,1)" }}>
          <Icons.Check size={42} color={T.emerald} />
        </div>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "28px", fontWeight: 800, color: T.gold, margin: "0 0 8px", letterSpacing: "-0.02em" }}>Thank You!</h1>
        <p style={{ fontSize: "14px", color: "rgba(212,165,116,0.85)", margin: "0 0 24px", fontWeight: 500, lineHeight: 1.6 }}>{reason}</p>
        {feedbackSubmitted && (
          <div style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(212,165,116,0.25)", borderRadius: "14px", padding: "12px 14px", marginBottom: "20px" }}>
            <p style={{ fontSize: "13px", color: T.goldLight, margin: 0, fontWeight: 600 }}>⭐ Thank you for your feedback!</p>
          </div>
        )}
        <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(212,165,116,0.2)", borderRadius: "14px", padding: "12px 14px", marginBottom: "20px" }}>
          <p style={{ fontSize: "11px", color: "rgba(212,165,116,0.7)", margin: 0, fontWeight: 600, lineHeight: 1.5 }}>
            ☕ We hope you enjoyed your visit!<br />See you again at Golden Beans soon.
          </p>
        </div>
        <Button variant="gold" size="md" onClick={onRestart}>Scan QR for new session</Button>
        <p style={{ fontSize: "10px", color: "rgba(212,165,116,0.4)", margin: "16px 0 0", fontWeight: 600 }}>Auto-redirecting in 5 seconds...</p>
      </div>
    </div>
  );

  // ── FEEDBACK SCREEN ──
  const CATEGORY_LABELS = [
    { key: 'food', emoji: '🍽️', label: 'Food' },
    { key: 'service', emoji: '🙋', label: 'Service' },
    { key: 'ambiance', emoji: '✨', label: 'Ambiance' },
    { key: 'value', emoji: '💰', label: 'Value' },
  ];

  return (
    <div style={{ minHeight: "100vh", background: `linear-gradient(180deg, ${T.emerald} 0%, #071f17 100%)`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px", fontFamily: "DM Sans, sans-serif", overflowY: "auto" }}>

      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "28px" }}>
        <div style={{ fontSize: "48px", marginBottom: "8px" }}>⭐</div>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "26px", fontWeight: 800, color: T.goldLight, margin: "0 0 6px" }}>How was your experience?</h1>
        <p style={{ fontSize: "13px", color: "rgba(232,200,149,0.6)", margin: 0 }}>Your feedback helps us serve you better</p>
      </div>

      {/* Card */}
      <div style={{ background: T.ivory, borderRadius: "28px", padding: "24px", width: "100%", maxWidth: "380px", boxShadow: "0 24px 64px rgba(0,0,0,0.4)" }}>

        {/* Overall Rating */}
        <p style={{ fontSize: "12px", fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: "0.8px", margin: "0 0 12px", textAlign: "center" }}>Overall Rating</p>
        <div style={{ display: "flex", justifyContent: "center", gap: "10px", marginBottom: "24px" }}>
          {[1, 2, 3, 4, 5].map(star => (
            <button key={star}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              onClick={() => setRating(star)}
              style={{ background: "none", border: "none", cursor: "pointer", padding: "4px", fontSize: (hoverRating || rating) >= star ? "38px" : "32px", transition: "all 0.15s ease", filter: (hoverRating || rating) >= star ? "none" : "grayscale(1) opacity(0.4)" }}>
              ⭐
            </button>
          ))}
        </div>

        {/* Rating label */}
        {rating > 0 && (
          <p style={{ textAlign: "center", fontSize: "14px", fontWeight: 700, color: T.emerald, margin: "-12px 0 20px" }}>
            {['', '😞 Poor', '😐 Fair', '🙂 Good', '😊 Great', '🤩 Excellent!'][rating]}
          </p>
        )}

        {/* Category Ratings */}
        <p style={{ fontSize: "12px", fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: "0.8px", margin: "0 0 12px" }}>Rate Each Category</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "20px" }}>
          {CATEGORY_LABELS.map(cat => (
            <div key={cat.key} style={{ background: T.cream, borderRadius: "14px", padding: "12px", border: "1px solid #EDE8E0" }}>
              <p style={{ margin: "0 0 8px", fontSize: "13px", fontWeight: 700, color: T.emerald }}>{cat.emoji} {cat.label}</p>
              <div style={{ display: "flex", gap: "4px" }}>
                {[1, 2, 3, 4, 5].map(star => (
                  <button key={star} onClick={() => setCategories(prev => ({ ...prev, [cat.key]: star }))}
                    style={{ background: "none", border: "none", cursor: "pointer", padding: "0", fontSize: categories[cat.key as keyof typeof categories] >= star ? "16px" : "13px", filter: categories[cat.key as keyof typeof categories] >= star ? "none" : "grayscale(1) opacity(0.4)", transition: "all 0.1s" }}>
                    ⭐
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Comment */}
        <p style={{ fontSize: "12px", fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: "0.8px", margin: "0 0 8px" }}>Comments (Optional)</p>
        <textarea
          value={comment}
          onChange={e => setComment(e.target.value)}
          placeholder="Tell us what you loved or how we can improve..."
          rows={3}
          style={{ width: "100%", padding: "12px 14px", borderRadius: "14px", border: "1.5px solid #EDE8E0", background: T.cream, fontSize: "14px", fontFamily: "DM Sans, sans-serif", outline: "none", boxSizing: "border-box", resize: "none", color: "#1a1a1a" }}
        />

        {/* Buttons */}
        <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
          <button onClick={handleSkip}
            style={{ flex: 1, padding: "13px", borderRadius: "14px", border: "1.5px solid #EDE8E0", background: "transparent", color: "#aaa", fontSize: "14px", fontFamily: "DM Sans, sans-serif", cursor: "pointer" }}>
            Skip
          </button>
          <button onClick={handleSubmitFeedback} disabled={rating === 0 || submitting}
            style={{ flex: 2, padding: "13px", borderRadius: "14px", border: "none", background: rating === 0 ? "#ccc" : `linear-gradient(135deg, ${T.emerald}, ${T.emeraldMid})`, color: T.goldLight, fontSize: "14px", fontWeight: "700", fontFamily: "DM Sans, sans-serif", cursor: rating === 0 ? "not-allowed" : "pointer", boxShadow: rating > 0 ? "0 6px 20px rgba(15,61,46,0.25)" : "none", transition: "all 0.2s" }}>
            {submitting ? 'Submitting...' : '⭐ Submit Feedback'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════
// IMAGE & SUB-COMPONENTS (same as before)
// ═════════════════════════════════════════════════════════════
function ItemImagePlaceholder({ name, size = 100 }: { name: string; size?: number }) {
  const initials = name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
  return (
    <div style={{
      width: size, height: size,
      background: `linear-gradient(135deg, ${T.emerald}, ${T.emeraldMid})`,
      borderRadius: "50%",
      display: "flex", alignItems: "center", justifyContent: "center",
      color: T.gold, fontWeight: 800, fontSize: size * 0.25,
      fontFamily: "'Playfair Display', serif",
      letterSpacing: "0.03em",
      boxShadow: "inset 0 -3px 8px rgba(0,0,0,0.2), 0 4px 12px rgba(15,61,46,0.15)",
      flexShrink: 0,
    }}>
      {initials}
    </div>
  );
}

function VerticalCategoryTabs({ categories, activeCategoryId, onSelect }: {
  categories: MenuCategory[];
  activeCategoryId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div style={{
      width: "44px", flexShrink: 0,
      background: T.emerald,
      borderRadius: "0 16px 16px 0",
      display: "flex", flexDirection: "column",
      paddingTop: "8px", paddingBottom: "8px",
      boxShadow: "2px 0 12px rgba(15,61,46,0.15)",
      position: "sticky", top: "120px",
      maxHeight: "calc(100vh - 200px)",
      overflowY: "auto",
    }} className="scrollbar-hide">
      {categories.map((cat, idx) => {
        const isActive = activeCategoryId === cat._id;
        return (
          <button
            key={cat._id}
            onClick={() => onSelect(cat._id)}
            style={{
              padding: "16px 4px",
              background: isActive ? T.gold : "transparent",
              color: isActive ? T.emerald : "rgba(212,165,116,0.7)",
              border: "none",
              cursor: "pointer",
              fontFamily: "'Inter', sans-serif",
              fontWeight: isActive ? 800 : 600,
              fontSize: "11px",
              letterSpacing: "0.05em",
              writingMode: "vertical-rl",
              textOrientation: "mixed",
              transition: "all 200ms ease",
              borderRadius: isActive ? "10px" : "0",
              margin: "2px 4px",
              animation: `gb-fadeInUp 0.3s ${idx * 0.05}s ease both`,
            }}
          >
            {cat.name.toUpperCase()}
          </button>
        );
      })}
    </div>
  );
}

function ProductCard({ item, onTap, cartQty }: { item: MenuItem; onTap: () => void; cartQty: number }) {
  return (
    <div onClick={item.isAvailable ? onTap : undefined} style={{
      background: item.isAvailable ? T.ivory : T.creamDark,
      borderRadius: "20px", padding: "16px 12px 12px",
      cursor: item.isAvailable ? "pointer" : "not-allowed",
      boxShadow: item.isAvailable ? "0 4px 16px rgba(15,61,46,0.06)" : "none",
      transition: "all 250ms cubic-bezier(0.16, 1, 0.3, 1)",
      position: "relative", border: `1px solid ${item.isAvailable ? T.creamDark : '#E0D8CC'}`,
      overflow: "hidden", opacity: item.isAvailable ? 1 : 0.75,
      filter: item.isAvailable ? "none" : "grayscale(0.3)",
    }}>
      
      {item.tags?.includes("bestseller") && (
        <div style={{
          position: "absolute", top: "8px", left: "8px",
          background: `linear-gradient(135deg, ${T.gold}, ${T.goldLight})`,
          padding: "3px 8px", borderRadius: "99px",
          fontSize: "9px", fontWeight: 800, color: T.emerald,
          zIndex: 2, display: "flex", alignItems: "center", gap: "3px",
        }}>
          <Icons.Sparkle size={9} /> BEST
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "center", marginBottom: "12px", position: "relative" }}>
        {item.imageUrl ? (
          <div style={{ width: "100px", height: "100px", borderRadius: "50%", overflow: "hidden", border: `3px solid ${T.cream}`, boxShadow: "0 6px 16px rgba(15,61,46,0.15)" }}>
            <img src={getThumbnailUrl(item.imageUrl)} alt={item.name} draggable={false} style={{ width: "100%", height: "100%", objectFit: "cover", pointerEvents: "none" }} loading="lazy" />
          </div>
        ) : (
          <ItemImagePlaceholder name={item.name} size={100} />
        )}
        <div style={{
          position: "absolute", bottom: "0", right: "calc(50% - 50px - 4px)",
          width: "20px", height: "20px", background: T.success, borderRadius: "5px",
          display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid white",
        }}>
          <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "white" }} />
        </div>
      </div>

      <p style={{
        fontWeight: 800, fontSize: "14px", color: T.text, margin: "0 0 4px",
        textAlign: "center", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
      }}>{item.name}</p>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px", padding: "0 4px" }}>
        <span style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 800, fontSize: "16px", color: T.emerald }}>₹{item.price}</span>
        <div style={{ display: "flex", alignItems: "center", gap: "3px" }}>
          <span style={{ color: T.gold, fontSize: "11px" }}>★</span>
          <span style={{ fontSize: "11px", fontWeight: 700, color: T.textMuted, fontFamily: "'DM Sans', sans-serif" }}>
            {item.rating?.toFixed(1) || "4.5"}
          </span>
        </div>
      </div>

      <button onClick={(e) => { e.stopPropagation(); if(item.isAvailable) onTap(); }} style={{
        width: "100%",
        background: !item.isAvailable ? T.creamDark : cartQty > 0 ? `linear-gradient(135deg, ${T.emerald}, ${T.emeraldMid})` : `linear-gradient(135deg, ${T.gold}, ${T.goldLight})`,
        color: !item.isAvailable ? T.textDim : cartQty > 0 ? T.gold : T.emerald,
        border: "none", borderRadius: "12px", padding: "10px",
        fontWeight: 800, fontSize: "12px",
        cursor: !item.isAvailable ? "not-allowed" : "pointer",
        boxShadow: !item.isAvailable ? "none" : cartQty > 0 ? "0 4px 12px rgba(15,61,46,0.3)" : "0 4px 12px rgba(212,165,116,0.4)",
        display: "flex", alignItems: "center", justifyContent: "center", gap: "5px",
        opacity: !item.isAvailable ? 0.7 : 1,
      }}>
        {!item.isAvailable ? <>⛔ Out of Stock</> : cartQty > 0 ? (<><Icons.Check size={12} /> ADDED ({cartQty})</>) : (<><Icons.Plus size={12} /> ADD</>)}
      </button>
    </div>
  );
}

function ProductDetailModal({ item, isOpen, onClose, onAddToCart }: {
  item: MenuItem | null; isOpen: boolean; onClose: () => void;
  onAddToCart: (item: MenuItem, quantity: number, variants: { groupName: string; selected: string[] }[], priceModifier: number) => void;
}) {
  const [quantity, setQuantity] = useState(1);
  const [selections, setSelections] = useState<Record<string, string[]>>({});

  useEffect(() => {
    if (item) {
      setQuantity(1);
      const defaults: Record<string, string[]> = {};
      item.variantGroups?.forEach(group => {
        const def = group.options.find(o => o.isDefault);
        if (def) defaults[group.name] = [def.name];
        else if (group.required && group.options.length > 0) defaults[group.name] = [group.options[0].name];
        else defaults[group.name] = [];
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

  let priceModifier = 0;
  item.variantGroups?.forEach(g => (selections[g.name] || []).forEach(n => {
    const o = g.options.find(o => o.name === n);
    if (o) priceModifier += o.priceModifier;
  }));

  const itemTotal = (item.price + priceModifier) * quantity;
  const variantSelections = Object.entries(selections).map(([gn, sel]) => ({ groupName: gn, selected: sel }));

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(15,61,46,0.75)", zIndex: 100, display: "flex", alignItems: "flex-end", justifyContent: "center", backdropFilter: "blur(8px)" }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: T.ivory, width: "100%", maxWidth: "480px", maxHeight: "92vh",
        borderRadius: "28px 28px 0 0", display: "flex", flexDirection: "column",
        animation: "gb-slideUpModal 350ms cubic-bezier(0.32, 0.72, 0, 1)", overflow: "hidden",
      }}>
        <div style={{ position: "relative", height: "260px", background: item.imageUrl ? "transparent" : `linear-gradient(135deg, ${T.emerald}, ${T.emeraldMid})`, overflow: "hidden" }}>
          {item.imageUrl ? (
            <img src={getHeroUrl(item.imageUrl)} alt={item.name} draggable={false} style={{ width: "100%", height: "100%", objectFit: "cover", pointerEvents: "none" }} />
          ) : (
            <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <ItemImagePlaceholder name={item.name} size={140} />
            </div>
          )}
          <div style={{ position: "absolute", bottom: "-1px", left: 0, right: 0, height: "32px", background: T.ivory, borderRadius: "32px 32px 0 0" }} />
          <button onClick={onClose} style={{ position: "absolute", top: "16px", right: "16px", width: "36px", height: "36px", borderRadius: "50%", background: "rgba(255,255,255,0.95)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", color: T.emerald, boxShadow: "0 4px 12px rgba(15,61,46,0.2)" }}>
            <Icons.Close size={18} />
          </button>
          <div style={{ position: "absolute", top: "16px", left: "16px", display: "flex", gap: "6px" }}>
            <Pill variant="success" size="sm" icon={<Icons.Leaf size={10} />}>VEG</Pill>
            {item.tags?.includes("bestseller") && <Pill variant="gold" size="sm" icon={<Icons.Sparkle size={10} />}>BESTSELLER</Pill>}
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px 0" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "8px", gap: "12px" }}>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "24px", fontWeight: 800, color: T.text, margin: 0 }}>{item.name}</h2>
            <div style={{ display: "flex", alignItems: "center", gap: "4px", flexShrink: 0, background: T.cream, padding: "4px 10px", borderRadius: "99px" }}>
              <span style={{ color: T.gold, fontSize: "13px" }}>★</span>
              <span style={{ fontSize: "12px", fontWeight: 800, color: T.emerald, fontFamily: "'DM Sans', sans-serif" }}>{item.rating?.toFixed(1) || "4.5"}</span>
            </div>
          </div>
          {item.description && <p style={{ fontSize: "13px", color: T.textMuted, margin: "0 0 16px", lineHeight: 1.5, fontWeight: 500 }}>{item.description}</p>}

          {item.variantGroups?.map((group: VariantGroup, gIdx: number) => (
            <div key={group.name} style={{ marginBottom: "20px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
                <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "16px", fontWeight: 700, color: T.emerald, margin: 0 }}>{group.name}</h3>
                {group.required && <Pill variant="danger" size="sm">Required</Pill>}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: group.options.length > 3 ? "1fr 1fr" : `repeat(${group.options.length}, 1fr)`, gap: "8px" }}>
                {group.options.map(opt => {
                  const sel = selections[group.name]?.includes(opt.name);
                  return (
                    <button key={opt.name} onClick={() => toggleVariant(group.name, opt.name, group.multiSelect)} style={{
                      padding: "12px",
                      background: sel ? `linear-gradient(135deg, ${T.emerald}, ${T.emeraldMid})` : T.cream,
                      border: `2px solid ${sel ? T.emerald : T.creamDark}`, borderRadius: "14px",
                      cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: "4px",
                      boxShadow: sel ? "0 4px 12px rgba(15,61,46,0.25)" : "none",
                    }}>
                      <span style={{ fontWeight: 800, fontSize: "13px", color: sel ? T.gold : T.text }}>{opt.name}</span>
                      {opt.priceModifier !== 0 && (
                        <span style={{ fontSize: "11px", color: sel ? "rgba(212,165,116,0.7)" : T.textMuted, fontFamily: "'DM Sans', sans-serif", fontWeight: 600 }}>
                          {opt.priceModifier > 0 ? `+₹${opt.priceModifier}` : `-₹${Math.abs(opt.priceModifier)}`}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div style={{ padding: "14px 20px 20px", borderTop: `1px solid ${T.border}`, background: T.ivory }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
            <span style={{ fontSize: "12px", color: T.textMuted, fontWeight: 700 }}>Quantity</span>
            <div style={{ display: "flex", alignItems: "center", background: T.emerald, borderRadius: "99px", overflow: "hidden", boxShadow: "0 4px 12px rgba(15,61,46,0.25)" }}>
              <button onClick={() => setQuantity(Math.max(1, quantity - 1))} style={{ width: "36px", height: "36px", background: "none", border: "none", color: T.gold, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><Icons.Minus size={14} /></button>
              <span style={{ minWidth: "30px", textAlign: "center", color: T.gold, fontWeight: 900, fontSize: "16px", fontFamily: "'DM Sans', sans-serif" }}>{quantity}</span>
              <button onClick={() => setQuantity(quantity + 1)} style={{ width: "36px", height: "36px", background: "none", border: "none", color: T.gold, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><Icons.Plus size={14} /></button>
            </div>
          </div>
          <button onClick={() => { onAddToCart(item, quantity, variantSelections, priceModifier); onClose(); }} style={{
            width: "100%", background: `linear-gradient(135deg, ${T.emerald}, ${T.emeraldMid})`,
            color: T.gold, border: "none", borderRadius: "16px", padding: "16px 22px",
            fontWeight: 800, fontSize: "15px", cursor: "pointer",
            boxShadow: "0 8px 24px rgba(15,61,46,0.35)",
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <span>Add to Cart</span>
            <span style={{ fontFamily: "'DM Sans', sans-serif" }}>₹{itemTotal.toFixed(0)}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function CustomerDataPopup({ onSubmit, onSkip }: { onSubmit: (d: { name: string; phone: string; birthdate: string; anniversary: string }) => void; onSkip: () => void; }) {
  const [name, setName] = useState(""); const [phone, setPhone] = useState("");
  const [birthdate, setBirthdate] = useState(""); const [anniversary, setAnniversary] = useState("");
  const [step, setStep] = useState(1);
  const handleSubmit = () => {
    if (step === 1) { if (!name.trim() || phone.length < 10) return alert("Valid name and 10-digit phone needed"); setStep(2); }
    else onSubmit({ name, phone, birthdate, anniversary });
  };
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,61,46,0.75)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px", backdropFilter: "blur(8px)" }}>
      <div style={{ width: "100%", maxWidth: "400px", background: T.ivory, borderRadius: "20px", padding: "0 0 16px", animation: "gb-scaleIn 0.3s cubic-bezier(0.34,1.56,0.64,1)" }}>
        <div style={{ height: "3px", background: `linear-gradient(90deg, ${T.goldDark}, ${T.gold}, ${T.goldLight}, ${T.gold}, ${T.goldDark})`, borderRadius: "20px 20px 0 0" }} />
        <div style={{ padding: "18px 20px 0" }}>
          <div style={{ textAlign: "center", marginBottom: "14px" }}>
            <div style={{ fontSize: "32px", marginBottom: "4px" }}>{step === 1 ? "👋" : "🎂"}</div>
            <h2 style={{ fontWeight: 800, fontSize: "20px", color: T.emerald, margin: "0 0 3px", fontFamily: "'Playfair Display', serif" }}>{step === 1 ? "Welcome!" : "Special dates?"}</h2>
            <p style={{ fontSize: "12px", color: T.textMuted, margin: 0 }}>{step === 1 ? "Quick detail" : "We'll surprise you! 🎁"}</p>
          </div>
          {step === 1 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <div>
                <label style={{ display: "block", fontSize: "10px", fontWeight: 800, color: T.textMuted, marginBottom: "4px", textTransform: "uppercase" }}>Your Name *</label>
                <input type="text" placeholder="e.g. Nirav" value={name} onChange={e => setName(e.target.value)} autoFocus style={{ width: "100%", padding: "11px 13px", borderRadius: "10px", border: `2px solid ${name ? T.gold : T.creamDark}`, background: T.cream, fontSize: "16px", outline: "none", boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "10px", fontWeight: 800, color: T.textMuted, marginBottom: "4px", textTransform: "uppercase" }}>Mobile *</label>
                <input type="tel" placeholder="10-digit" value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))} style={{ width: "100%", padding: "11px 13px", borderRadius: "10px", border: `2px solid ${phone.length === 10 ? T.gold : T.creamDark}`, background: T.cream, fontSize: "16px", outline: "none", boxSizing: "border-box" }} />
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <div>
                <label style={{ display: "block", fontSize: "10px", fontWeight: 800, color: T.textMuted, marginBottom: "4px", textTransform: "uppercase" }}>🎂 Birthday (Optional)</label>
                <input type="date" value={birthdate} onChange={e => setBirthdate(e.target.value)} style={{ width: "100%", padding: "11px 13px", borderRadius: "10px", border: `2px solid ${birthdate ? T.gold : T.creamDark}`, background: T.cream, fontSize: "16px", outline: "none", boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "10px", fontWeight: 800, color: T.textMuted, marginBottom: "4px", textTransform: "uppercase" }}>💑 Anniversary (Optional)</label>
                <input type="date" value={anniversary} onChange={e => setAnniversary(e.target.value)} style={{ width: "100%", padding: "11px 13px", borderRadius: "10px", border: `2px solid ${anniversary ? T.gold : T.creamDark}`, background: T.cream, fontSize: "16px", outline: "none", boxSizing: "border-box" }} />
              </div>
            </div>
          )}
          <div style={{ display: "flex", gap: "8px", marginTop: "14px" }}>
            <Button variant="secondary" fullWidth onClick={onSkip}>Skip</Button>
            <Button variant="primary" fullWidth onClick={handleSubmit}>{step === 1 ? "Continue →" : "Place Order"}</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function TopCancelBar({ order, onCancelled }: { order: Order; onCancelled: () => void }) {
  const placedAt = new Date(order.createdAt).getTime();
  const [secondsLeft, setSecondsLeft] = useState(() => Math.max(0, 120 - Math.floor((Date.now() - placedAt) / 1000)));
  const [cancelling, setCancelling] = useState(false);
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    const iv = setInterval(() => {
      setSecondsLeft(Math.max(0, 120 - Math.floor((Date.now() - placedAt) / 1000)));
      setPulse(p => !p);
    }, 1000);
    return () => clearInterval(iv);
  }, [placedAt]);

  if (secondsLeft <= 0) return null;
  const mins = Math.floor(secondsLeft / 60); const secs = secondsLeft % 60;
  const isUrgent = secondsLeft <= 30; const pct = (secondsLeft / 120) * 100;

  const handleCancel = async () => {
    if (cancelling) return;
    if (!confirm(`Cancel order #${order.orderNumber}?`)) return;
    setCancelling(true);
    try { await orderApi.cancelOrder(order._id); localStorage.removeItem("gb_active_order"); onCancelled(); }
    catch { alert("Failed"); setCancelling(false); }
  };
  return (
    <div style={{
  position: "sticky", top: 0, zIndex: 45,
  background: isUrgent
    ? "linear-gradient(135deg, #7f1d1d, #C0392B)"
    : `linear-gradient(135deg, ${T.emerald}, ${T.emeraldMid})`,
  borderBottom: `2px solid ${isUrgent ? "#ef4444" : T.gold}`,
  boxShadow: isUrgent
    ? `0 4px 20px rgba(192,57,43,0.5), 0 0 ${pulse ? "20px" : "8px"} rgba(239,68,68,0.4)`
    : `0 4px 20px rgba(15,61,46,0.3), 0 0 ${pulse ? "16px" : "6px"} rgba(212,165,116,0.3)`,
  transition: "box-shadow 500ms ease",
}}>
  <div style={{ padding: "8px 12px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
    <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1 }}>
      <div style={{
        width: "38px", height: "38px", borderRadius: "10px",
        background: isUrgent
          ? `rgba(255,255,255,${pulse ? "0.25" : "0.15"})`
          : `rgba(212,165,116,${pulse ? "0.25" : "0.15"})`,
        display: "flex", alignItems: "center", justifyContent: "center",
        border: `2px solid ${isUrgent ? "rgba(255,255,255,0.6)" : T.gold}`,
        boxShadow: pulse
          ? `0 0 12px ${isUrgent ? "rgba(255,255,255,0.4)" : "rgba(212,165,116,0.5)"}`
          : "none",
        transition: "all 500ms ease",
        flexShrink: 0,
      }}>
        <span style={{
          fontWeight: 900, fontSize: "11px", color: "white",
          fontFamily: "'DM Sans', sans-serif",
          fontVariantNumeric: "tabular-nums",
          textShadow: pulse ? "0 0 8px rgba(255,255,255,0.8)" : "none",
          transition: "text-shadow 500ms ease",
        }}>{mins}:{String(secs).padStart(2, "0")}</span>
      </div>
      <div>
        <p style={{
          fontWeight: 800, fontSize: "11px", color: "white", margin: 0,
          textShadow: isUrgent && pulse ? "0 0 8px rgba(255,255,255,0.5)" : "none",
          transition: "text-shadow 500ms ease",
        }}>
          {isUrgent ? "⚠️ Cancel ending!" : "✕ Cancel within 2 min"}
        </p>
        <p style={{ fontSize: "9px", color: "rgba(255,255,255,0.75)", margin: "1px 0 0", fontWeight: 600 }}>
          Order #{order.orderNumber}
        </p>
      </div>
    </div>
    <button
      onClick={handleCancel}
      disabled={cancelling}
      style={{
        background: isUrgent
          ? `rgba(255,255,255,${pulse ? "1" : "0.9"})`
          : "white",
        color: isUrgent ? T.danger : T.emerald,
        border: "none", borderRadius: "8px",
        padding: "7px 14px",
        fontWeight: 800, fontSize: "11px",
        cursor: cancelling ? "wait" : "pointer",
        fontFamily: "'Inter', sans-serif",
        boxShadow: isUrgent && pulse ? "0 0 12px rgba(255,255,255,0.6)" : "none",
        transition: "all 300ms ease",
        letterSpacing: "0.02em",
      }}
    >
      {cancelling ? "..." : "✕ CANCEL"}
    </button>
  </div>

  {/* Premium animated progress bar */}
  <div style={{ height: "3px", background: "rgba(0,0,0,0.2)", position: "relative", overflow: "hidden" }}>
    <div style={{
      height: "100%", width: `${pct}%`,
      background: isUrgent
        ? "linear-gradient(90deg, #fca5a5, white, #fca5a5)"
        : `linear-gradient(90deg, ${T.goldDark}, ${T.gold}, ${T.goldLight}, ${T.gold}, ${T.goldDark})`,
      backgroundSize: "200% 100%",
      transition: "width 1s linear",
      animation: "gb-shimmer 2s linear infinite",
      boxShadow: `0 0 8px ${isUrgent ? "rgba(255,255,255,0.6)" : "rgba(212,165,116,0.6)"}`,
    }} />
  </div>
</div>
  );
}

function CartView({
  cart,
  onUpdateQty,
  onPlaceOrder,
  isPlacing,
  appliedDiscount,
  onDiscountChange,
}: {
  cart: ExtendedCartItem[];
  onUpdateQty: (k: string, d: number) => void;
  onPlaceOrder: () => void;
  isPlacing: boolean;
  appliedDiscount: AppliedDiscount | null;
  onDiscountChange: (d: AppliedDiscount | null) => void;
}) {
  const [promoCode, setPromoCode] = useState("");
  const [validating, setValidating] = useState(false);
  const [codeError, setCodeError] = useState("");
  const [autoChecking, setAutoChecking] = useState(false);

  const subtotal = cart.reduce((s, i) => s + (i.price + (i.totalPriceModifier || 0)) * i.quantity, 0);
  const discount = appliedDiscount?.discount || 0;
  const discountedSubtotal = Math.max(0, subtotal - discount);
  const tax = discountedSubtotal * 0.05;
  const total = discountedSubtotal + tax;
  const totalItems = cart.reduce((s, i) => s + i.quantity, 0);

  // ─── Auto-check promotions when cart changes ───
  useEffect(() => {
    if (cart.length === 0 || appliedDiscount?.type === "code") {
      // Don't auto-check if user has manually applied code
      if (cart.length === 0) onDiscountChange(null);
      return;
    }

    const items = cart.map(c => ({
      menuItemId: c.menuItemId,
      name: c.name,
      price: c.price + (c.totalPriceModifier || 0),
      quantity: c.quantity,
    }));

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://golden-beans-server.onrender.com/api";

    setAutoChecking(true);
    fetch(`${apiUrl}/promotions/calculate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items, subtotal }),
    })
      .then(r => r.json())
      .then(d => {
        if (d.success && d.data?.applied) {
          onDiscountChange({
            ...d.data.applied,
            type: "auto",
          });
        } else if (appliedDiscount?.type === "auto") {
          onDiscountChange(null);
        }
      })
      .catch(() => { })
      .finally(() => setAutoChecking(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cart.length, subtotal]);

  const handleApplyCode = async () => {
    if (!promoCode.trim()) return;
    setValidating(true);
    setCodeError("");
    try {
      const items = cart.map(c => ({
        menuItemId: c.menuItemId,
        name: c.name,
        price: c.price + (c.totalPriceModifier || 0),
        quantity: c.quantity,
      }));
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://golden-beans-server.onrender.com/api";
      const res = await fetch(`${apiUrl}/promotions/codes/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: promoCode.trim(), items, subtotal }),
      });
      const data = await res.json();
      if (!data.success) {
        setCodeError(data.message || "Invalid code");
        return;
      }
      onDiscountChange({
        ...data.data,
        type: "code",
        code: data.data.code,
      });
      setPromoCode("");
    } catch (e: unknown) {
      setCodeError(e instanceof Error ? e.message : "Failed to apply");
    } finally {
      setValidating(false);
    }
  };

  const handleRemoveDiscount = () => {
    onDiscountChange(null);
    setPromoCode("");
    setCodeError("");
  };

  return (
    <div style={{ padding: "16px 14px 100px" }}>
      <h2 style={{ fontWeight: 800, fontSize: "22px", color: T.emerald, margin: "0 0 4px", fontFamily: "'Playfair Display', serif" }}>My Cart</h2>
      <p style={{ fontSize: "12px", color: T.textMuted, margin: "0 0 16px" }}>
        {totalItems > 0 ? `${totalItems} item${totalItems !== 1 ? "s" : ""}` : "Cart empty"}
      </p>

      {cart.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 20px" }}>
          <div style={{ width: "80px", height: "80px", margin: "0 auto 16px", borderRadius: "20px", background: T.cream, display: "flex", alignItems: "center", justifyContent: "center", color: T.emerald }}>
            <Icons.Cart size={36} />
          </div>
          <p style={{ fontWeight: 800, fontSize: "16px", color: T.emerald, margin: "0 0 4px" }}>Cart is empty</p>
          <p style={{ fontSize: "12px", color: T.textMuted, margin: 0 }}>Browse menu to add</p>
        </div>
      ) : (
        <>
          {cart.map(item => (
            <div key={item.menuItemId + JSON.stringify(item.variants)} style={{
              background: T.ivory, borderRadius: "16px", padding: "12px",
              marginBottom: "10px", border: `1px solid ${T.creamDark}`,
              display: "flex", gap: "12px",
            }}>
              <div style={{ flexShrink: 0 }}>
                {item.imageUrl ? (
                  <img src={getThumbnailUrl(item.imageUrl)} alt={item.name} draggable={false}
                    style={{ width: "60px", height: "60px", borderRadius: "12px", objectFit: "cover", pointerEvents: "none" }} />
                ) : (
                  <ItemImagePlaceholder name={item.name} size={60} />
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontWeight: 800, fontSize: "14px", color: T.text, margin: "0 0 2px" }}>{item.name}</p>
                {item.variants && item.variants.some(v => v.selected.length > 0) && (
                  <p style={{ fontSize: "10px", color: T.textMuted, margin: "0 0 4px", fontWeight: 600 }}>
                    {item.variants.flatMap(v => v.selected).join(", ")}
                  </p>
                )}
                <p style={{ fontWeight: 800, fontSize: "13px", color: T.emerald, margin: 0, fontFamily: "'DM Sans', sans-serif" }}>
                  ₹{((item.price + (item.totalPriceModifier || 0)) * item.quantity).toFixed(0)}
                </p>
              </div>
              <div style={{ display: "flex", alignItems: "center", background: T.emerald, borderRadius: "10px", overflow: "hidden", height: "fit-content" }}>
                <button onClick={() => onUpdateQty(item.menuItemId + JSON.stringify(item.variants), -1)}
                  style={{ width: "28px", height: "28px", background: "none", border: "none", color: T.gold, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icons.Minus size={12} />
                </button>
                <span style={{ fontWeight: 900, color: T.gold, fontSize: "12px", minWidth: "20px", textAlign: "center", fontFamily: "'DM Sans', sans-serif" }}>{item.quantity}</span>
                <button onClick={() => onUpdateQty(item.menuItemId + JSON.stringify(item.variants), 1)}
                  style={{ width: "28px", height: "28px", background: "none", border: "none", color: T.gold, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icons.Plus size={12} />
                </button>
              </div>
            </div>
          ))}

          {/* ─── Auto-applied Discount Banner ─── */}
          {appliedDiscount && appliedDiscount.type === "auto" && (
            <div style={{
              background: `linear-gradient(135deg, ${T.success}, #2d6a2d)`,
              borderRadius: "14px", padding: "12px 14px", marginTop: "12px",
              display: "flex", alignItems: "center", justifyContent: "space-between",
              boxShadow: "0 4px 16px rgba(74,139,74,0.25)",
              animation: "gb-fadeInUp 0.3s ease both",
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "3px" }}>
                  <Icons.Sparkle size={12} color="white" />
                  <span style={{ fontSize: "10px", color: "white", fontWeight: 800, letterSpacing: "0.05em", textTransform: "uppercase", opacity: 0.9 }}>
                    Auto Promotion Applied
                  </span>
                </div>
                <p style={{ fontSize: "13px", color: "white", margin: 0, fontWeight: 800 }}>
                  🎉 You saved ₹{appliedDiscount.discount}!
                </p>
                <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.85)", margin: "2px 0 0", fontWeight: 600 }}>
                  {appliedDiscount.name} · {appliedDiscount.description}
                </p>
              </div>
            </div>
          )}

          {/* ─── Code-applied Discount Banner ─── */}
          {appliedDiscount && appliedDiscount.type === "code" && (
            <div style={{
              background: `linear-gradient(135deg, ${T.gold}, ${T.goldLight})`,
              borderRadius: "14px", padding: "12px 14px", marginTop: "12px",
              display: "flex", alignItems: "center", justifyContent: "space-between",
              boxShadow: "0 4px 16px rgba(212,165,116,0.35)",
              animation: "gb-fadeInUp 0.3s ease both",
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "3px" }}>
                  <span style={{ fontSize: "11px" }}>🎫</span>
                  <span style={{ fontSize: "10px", color: T.emerald, fontWeight: 800, letterSpacing: "0.05em", textTransform: "uppercase" }}>
                    Code: {appliedDiscount.code}
                  </span>
                </div>
                <p style={{ fontSize: "13px", color: T.emerald, margin: 0, fontWeight: 800 }}>
                  💰 Saved ₹{appliedDiscount.discount}
                </p>
                <p style={{ fontSize: "11px", color: "rgba(15,61,46,0.75)", margin: "2px 0 0", fontWeight: 600 }}>
                  {appliedDiscount.name}
                </p>
              </div>
              <button onClick={handleRemoveDiscount} style={{
                width: "32px", height: "32px", borderRadius: "50%",
                background: T.emerald, color: T.gold, border: "none", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
              }}>
                <Icons.Close size={14} />
              </button>
            </div>
          )}

          {/* ─── Promo Code Input ─── */}
          {(!appliedDiscount || appliedDiscount.type === "auto") && (
            <div style={{
              background: T.ivory, borderRadius: "14px", padding: "12px",
              marginTop: "12px", border: `1px dashed ${T.creamDark}`,
            }}>
              <p style={{ fontSize: "10px", fontWeight: 800, color: T.textMuted, letterSpacing: "0.05em", textTransform: "uppercase", margin: "0 0 8px" }}>
                Have a Promo Code?
              </p>
              <div style={{ display: "flex", gap: "6px" }}>
                <input
                  type="text"
                  placeholder="Enter code..."
                  value={promoCode}
                  onChange={e => { setPromoCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "")); setCodeError(""); }}
                  style={{
                    flex: 1, padding: "10px 12px", borderRadius: "10px",
                    border: `1.5px solid ${codeError ? T.danger : T.border}`,
                    background: T.cream, color: T.text, fontSize: "14px",
                    fontFamily: "'DM Sans', sans-serif", letterSpacing: "0.05em",
                    fontWeight: 700, outline: "none", boxSizing: "border-box",
                  }}
                />
                <button
                  onClick={handleApplyCode}
                  disabled={!promoCode.trim() || validating}
                  style={{
                    padding: "10px 18px", borderRadius: "10px",
                    background: !promoCode.trim() ? T.creamDark : `linear-gradient(135deg, ${T.emerald}, ${T.emeraldMid})`,
                    color: !promoCode.trim() ? T.textDim : T.gold,
                    border: "none",
                    fontWeight: 800, fontSize: "12px",
                    cursor: !promoCode.trim() ? "not-allowed" : "pointer",
                    fontFamily: "'Inter', sans-serif",
                    whiteSpace: "nowrap",
                  }}
                >
                  {validating ? "..." : "Apply"}
                </button>
              </div>
              {codeError && (
                <p style={{ fontSize: "11px", color: T.danger, margin: "6px 0 0", fontWeight: 700 }}>
                  ⚠ {codeError}
                </p>
              )}
            </div>
          )}

          {/* ─── Bill Summary ─── */}
          <div style={{ background: T.ivory, borderRadius: "16px", padding: "14px", marginTop: "14px", border: `1px solid ${T.creamDark}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: T.textMuted, marginBottom: "5px" }}>
              <span>Subtotal</span>
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, color: T.text }}>₹{subtotal.toFixed(0)}</span>
            </div>
            {discount > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: T.success, marginBottom: "5px", fontWeight: 700 }}>
                <span>Discount</span>
                <span style={{ fontFamily: "'DM Sans', sans-serif" }}>-₹{discount.toFixed(0)}</span>
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: T.textMuted, paddingBottom: "9px", borderBottom: `1px dashed ${T.creamDark}`, marginBottom: "9px" }}>
              <span>Taxes (5%)</span>
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, color: T.text }}>₹{tax.toFixed(0)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 800, fontSize: "16px", color: T.emerald }}>
              <span>Total</span>
              <span style={{ fontFamily: "'DM Sans', sans-serif" }}>₹{total.toFixed(0)}</span>
            </div>
            {discount > 0 && (
              <p style={{ fontSize: "10px", color: T.success, margin: "8px 0 0", textAlign: "center", fontWeight: 800 }}>
                🎉 You&apos;re saving ₹{discount} on this order!
              </p>
            )}
          </div>

          <div style={{ marginTop: "14px" }}>
            <Button variant="primary" size="xl" fullWidth onClick={onPlaceOrder} loading={isPlacing}>
              Proceed to Checkout
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

function OrderView({ order, queuePosition }: { order: Order | null; queuePosition?: number }) {
  if (!order) return (
    <div style={{ padding: "16px 14px 100px" }}>
      <h2 style={{ fontWeight: 800, fontSize: "22px", color: T.emerald, margin: "0 0 4px", fontFamily: "'Playfair Display', serif" }}>My Orders</h2>
      <p style={{ fontSize: "12px", color: T.textMuted, margin: "0 0 16px" }}>Active orders will appear here</p>
      <div style={{ textAlign: "center", padding: "60px 20px" }}>
        <div style={{ width: "80px", height: "80px", margin: "0 auto 16px", borderRadius: "20px", background: T.cream, display: "flex", alignItems: "center", justifyContent: "center", color: T.emerald }}><Icons.Receipt size={36} /></div>
        <p style={{ fontWeight: 800, fontSize: "16px", color: T.emerald, margin: "0 0 4px" }}>No active orders</p>
        <p style={{ fontSize: "12px", color: T.textMuted, margin: 0 }}>Place an order to see live tracking</p>
      </div>
    </div>
  );
  return (
    <div style={{ paddingBottom: "100px" }}>
      <div style={{ padding: "16px 14px 0" }}>
        <h2 style={{ fontWeight: 800, fontSize: "22px", color: T.emerald, margin: "0 0 4px", fontFamily: "'Playfair Display', serif" }}>My Order</h2>
        <p style={{ fontSize: "12px", color: T.textMuted, margin: "0 0 12px" }}>Live tracking</p>
      </div>
      <LiveOrderTracker order={order} queuePosition={queuePosition} />
    </div>
  );
}

function InfoView({ table }: { table: Table | null }) {
  return (
    <div style={{ padding: "16px 14px 100px" }}>
      <h2 style={{ fontWeight: 800, fontSize: "22px", color: T.emerald, margin: "0 0 4px", fontFamily: "'Playfair Display', serif" }}>About Us</h2>
      <p style={{ fontSize: "12px", color: T.textMuted, margin: "0 0 16px" }}>Golden Beans Cafe & Bistro</p>
      <div style={{ background: `linear-gradient(135deg, ${T.emerald}, ${T.emeraldMid})`, borderRadius: "20px", padding: "20px", marginBottom: "12px", boxShadow: "0 8px 20px rgba(15,61,46,0.25)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
          <img src="/logo-small.png" alt="GB" draggable={false} style={{ width: "48px", height: "48px", borderRadius: "12px", pointerEvents: "none" }} />
          <div>
            <p style={{ fontFamily: "'Playfair Display', serif", fontSize: "20px", fontWeight: 800, color: T.gold, margin: 0 }}>Golden Beans</p>
            <p style={{ fontSize: "10px", color: "rgba(212,165,116,0.8)", margin: "2px 0 0", fontWeight: 600, letterSpacing: "0.1em" }}>CAFE & BISTRO</p>
          </div>
        </div>
        <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.85)", margin: 0, lineHeight: 1.6 }}>Premium 100% pure vegetarian cafe in Surat. Handcrafted coffee, fresh snacks.</p>
      </div>
      {table && <div style={{ background: T.ivory, borderRadius: "16px", padding: "14px", marginBottom: "12px", border: `1px solid ${T.creamDark}`, display: "flex", alignItems: "center", gap: "12px" }}>
        <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: T.cream, display: "flex", alignItems: "center", justifyContent: "center", color: T.emerald }}><Icons.ChairFill size={20} /></div>
        <div><p style={{ fontSize: "10px", color: T.textMuted, fontWeight: 700, textTransform: "uppercase", margin: 0 }}>Your Table</p><p style={{ fontWeight: 800, fontSize: "14px", color: T.emerald, margin: "2px 0 0" }}>Table {table.tableNumber}</p></div>
      </div>}
      <div style={{ marginTop: "20px", textAlign: "center", padding: "16px" }}><Pill variant="success" size="md" icon={<Icons.Leaf size={11} />}>100% Pure Vegetarian</Pill></div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═════════════════════════════════════════════════════════════
export default function CustomerOrderPage() {
  const params = useParams();
  const router = useRouter();
  const tableId = params.tableId as string;

  // ─── Security state ───
  const [securityStatus, setSecurityStatus] = useState<"checking" | "passed" | "failed" | "session_ended">("checking");
  const [securityResult, setSecurityResult] = useState<SecurityResult | null>(null);
  const [sessionEndReason, setSessionEndReason] = useState("");

  // ─── App state ───
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
  const [showCustomerPopup, setShowCustomerPopup] = useState(false);
  const [appliedDiscount, setAppliedDiscount] = useState<AppliedDiscount | null>(null);
  const [customerData, setCustomerData] = useState<{ name: string; phone: string } | null>(null);
  const prevStatusRef = useRef<string | null>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  const handleSecurityPassed = useCallback(() => setSecurityStatus("passed"), []);
  const handleSecurityFailed = useCallback((result: SecurityResult) => {
    setSecurityResult(result);
    setSecurityStatus("failed");
  }, []);
  const handleRetrySecurity = useCallback(() => {
    setSecurityStatus("checking");
    setSecurityResult(null);
  }, []);

  useEffect(() => {
    if (securityStatus !== "passed") return;
    const saved = localStorage.getItem("gb_customer");
    if (saved) {
      try { const data = JSON.parse(saved); setCustomerData({ name: data.name, phone: data.phone }); }
      catch { }
    }
  }, [securityStatus]);

  useEffect(() => {
    if (securityStatus !== "passed") return;
    async function load() {
      try {
        setLoading(true);
        const [menuRes, tableRes] = await Promise.all([menuApi.getMenu(), tableApi.getTable(tableId)]);
        setMenu(menuRes.data.data);
        setTable(tableRes.data.data);
        if (menuRes.data.data.length > 0) setActiveCategory(menuRes.data.data[0]._id);
        const orderRes = await orderApi.getOrderByTable(tableId);
        if (orderRes.data.data) {
          const order = orderRes.data.data;
          if (["settled", "cancelled"].includes(order.status)) {
            localStorage.removeItem("gb_active_order");
            setExistingOrder(null);
          } else {
            setExistingOrder(order);
            prevStatusRef.current = order.status;
            localStorage.setItem("gb_active_order", order._id);
          }
        }
      } catch { }
      finally { setLoading(false); }
    }
    load();
  }, [tableId, securityStatus]);

  useEffect(() => {
    if (securityStatus !== "passed") return;

    let cancelled = false;

    const checkOrder = async () => {
      if (cancelled) return;
      try {
        // ─── SETTLEMENT WATCHER (Priority Check) ───
        if (existingOrder) {
          try {
            const directRes = await orderApi.getOrder(existingOrder._id);
            const directOrder: Order | null = directRes.data?.data;
            if (directOrder) {
              if (directOrder.status === "settled") {
                // orderId save કરો feedback માટે — remove પહેલા
                localStorage.setItem("gb_settled_order_id", existingOrder._id);
                localStorage.setItem("gb_settled_table", existingOrder.tableNumber || tableId);
                localStorage.removeItem("gb_active_order");
                localStorage.removeItem("gb_customer");
                setSessionEndReason("Your bill has been settled. Thank you for visiting!");
                setSecurityStatus("session_ended");
                return;
              }
              if (directOrder.status === "cancelled") {
                localStorage.removeItem("gb_active_order");
                setSessionEndReason("Your order was cancelled.");
                setSecurityStatus("session_ended");
                return;
              }
            }
          } catch { }
        }

        const [orderRes, allRes] = await Promise.all([
          orderApi.getOrderByTable(tableId),
          orderApi.getKdsOrders(),
        ]);
        if (cancelled) return;
        if (allRes.data.data) setAllOrders(allRes.data.data);

        const newOrder: Order | null = orderRes.data.data;
        if (!newOrder) return;
        prevStatusRef.current = newOrder.status;
        setExistingOrder(newOrder);
      } catch { }
    };

    // Start polling every 5 seconds
    pollRef.current = setInterval(checkOrder, 5000);

    // Re-check immediately when page becomes visible (iPhone Safari fix)
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        checkOrder();
      }
    };
    const handleFocus = () => checkOrder();
    const handlePageShow = () => checkOrder();

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);
    window.addEventListener("pageshow", handlePageShow);

    // Initial check
    checkOrder();

    return () => {
      cancelled = true;
      if (pollRef.current) clearInterval(pollRef.current);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("pageshow", handlePageShow);
    };
  }, [securityStatus, tableId, existingOrder]);

  const queuePosition = existingOrder
    ? allOrders.filter(o => ["kotSent", "open"].includes(o.status) && o._id !== existingOrder._id)
      .filter(o => new Date(o.createdAt).getTime() < new Date(existingOrder.createdAt).getTime()).length
    : undefined;

  const handleAddToCart = (item: MenuItem, qty: number, variants: { groupName: string; selected: string[] }[], modifier: number) => {
    const cartKey = item._id + JSON.stringify(variants);
    setCart(prev => {
      const ex = prev.find(c => (c.menuItemId + JSON.stringify(c.variants)) === cartKey);
      if (ex) return prev.map(c => (c.menuItemId + JSON.stringify(c.variants)) === cartKey ? { ...c, quantity: c.quantity + qty } : c);
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

  const handlePlaceOrderClick = () => {
    if (customerData) placeOrder(customerData);
    else setShowCustomerPopup(true);
  };

  const handleCustomerDataSubmit = (data: { name: string; phone: string; birthdate: string; anniversary: string }) => {
    setCustomerData({ name: data.name, phone: data.phone });
    localStorage.setItem("gb_customer", JSON.stringify(data));
    setShowCustomerPopup(false);
    placeOrder(data);
  };

  const placeOrder = async (customer?: { name: string; phone: string }) => {
    if (cart.length === 0) return;
    setIsPlacing(true);
    try {
      const orderItems = cart.map(c => ({
        menuItemId: c.menuItemId, name: c.name,
        price: c.price + (c.totalPriceModifier || 0),
        quantity: c.quantity,
        notes: c.variants && c.variants.length > 0 ? c.variants.flatMap(v => v.selected).join(", ") : c.notes,
        isVeg: c.isVeg,
      }));
      const res = await orderApi.createOrder({
  tableId,
  items: orderItems,
  createdBy: "customer",
  customerName: customer?.name || "",
  customerPhone: customer?.phone || "",
  discount: appliedDiscount?.discount || 0,
  appliedPromoId: appliedDiscount?.promotionId || null,
  appliedPromoCode: appliedDiscount?.code || null,
});
       
      const newOrder: Order = res.data.data;
      setCart([]);
      setAppliedDiscount(null);
      setExistingOrder(newOrder);
      prevStatusRef.current = newOrder.status;
      localStorage.setItem("gb_active_order", newOrder._id);
      setActiveTab("order");
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed");
    } finally { setIsPlacing(false); }
  };

  const handleCancelled = () => { setExistingOrder(null); prevStatusRef.current = null; };
  const totalCartItems = cart.reduce((s, i) => s + i.quantity, 0);
  const activeCategoryItems = (menu.find(c => c._id === activeCategory)?.items || []) as MenuItem[];

  // ─── RENDER ─── 
  if (securityStatus === "checking") {
    return <SecurityCheckScreen onPassed={handleSecurityPassed} onFailed={handleSecurityFailed} />;
  }

  if (securityStatus === "failed" && securityResult) {
    return <AwarenessScreen result={securityResult} onRetry={handleRetrySecurity} />;
  }

  if (securityStatus === "session_ended") {
    return <SessionEndedScreen reason={sessionEndReason} onRestart={() => router.replace("/")} />;
  }

  return (
    <div className="customer-app" style={{ minHeight: "100vh", background: T.cream, display: "flex", flexDirection: "column", width: "100%", margin: "0 auto", overflowX: "hidden" }}>
      <style>{`
        html, body { overflow-x: hidden; margin: 0; padding: 0; max-width: 100vw; touch-action: pan-y; overscroll-behavior: none; }
        .customer-app { -webkit-user-select: none; user-select: none; -webkit-touch-callout: none; -webkit-tap-highlight-color: transparent; }
        .customer-app input, .customer-app textarea { -webkit-user-select: text; user-select: text; }
        .customer-app img { -webkit-user-drag: none; user-drag: none; pointer-events: none; }
        @keyframes gb-shimmer { 0% { background-position: 200% center; } 100% { background-position: -200% center; } }
@keyframes cartBadgeBounce { 0%,100% { transform: scale(1); } 30% { transform: scale(1.5); } 60% { transform: scale(0.9); } 80% { transform: scale(1.1); } }
      `}</style>

      {showCustomerPopup && <CustomerDataPopup onSubmit={handleCustomerDataSubmit} onSkip={() => { setShowCustomerPopup(false); placeOrder(); }} />}
      {existingOrder && !["settled", "cancelled"].includes(existingOrder.status) && <TopCancelBar order={existingOrder} onCancelled={handleCancelled} />}

      <header style={{ background: `linear-gradient(180deg, ${T.cream} 0%, ${T.ivory} 100%)`, position: "sticky", top: 0, zIndex: 30, padding: "12px 16px 12px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
          <div style={{ width: "40px", height: "40px", borderRadius: "12px", overflow: "hidden", background: T.emerald, flexShrink: 0 }}>
            <img src="/logo-small.png" alt="GB" draggable={false} style={{ width: "100%", height: "100%", objectFit: "contain", pointerEvents: "none" }} />
          </div>
          <div style={{ flex: 1, textAlign: "center", padding: "0 12px" }}>
            <p style={{ fontFamily: "'Playfair Display', serif", fontSize: "20px", fontWeight: 800, color: T.emerald, margin: 0 }}>Golden Beans</p>
            <p style={{ fontSize: "10px", color: T.textMuted, margin: "1px 0 0", fontWeight: 600 }}>{table ? `Table ${table.tableNumber}` : "..."}</p>
          </div>
          <div style={{ width: "40px", height: "40px", borderRadius: "12px", background: T.emerald, color: T.gold, display: "flex", alignItems: "center", justifyContent: "center" }}><Icons.Coffee size={16} /></div>
        </div>
        {activeTab === "menu" && (
          <div>
            <p style={{ fontSize: "13px", color: T.textMuted, fontWeight: 600, margin: "0 0 2px" }}>Welcome{customerData ? "," : "!"}</p>
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "24px", fontWeight: 800, color: T.emerald, margin: 0, letterSpacing: "-0.02em", lineHeight: 1.1 }}>{customerData?.name || "Order Now"} ☕</h1>
          </div>
        )}
      </header>

      <main style={{ flex: 1, paddingBottom: "80px" }}>
        {activeTab === "menu" && (
          <div style={{ display: "flex", paddingBottom: "12px" }}>
            {menu.length > 0 && <VerticalCategoryTabs categories={menu} activeCategoryId={activeCategory} onSelect={setActiveCategory} />}
            <div style={{ flex: 1, padding: "12px 14px 12px 12px" }}>
              {loading ? (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} height="200px" style={{ borderRadius: "20px" }} />)}
                </div>
              ) : activeCategoryItems.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 16px" }}><div style={{ fontSize: "40px", marginBottom: "8px" }}>☕</div><p style={{ fontWeight: 700, color: T.emerald, fontSize: "14px" }}>No items here yet</p></div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  {activeCategoryItems.map((item, idx) => {
                    const cartQty = cart.filter(c => c.menuItemId === item._id).reduce((s, c) => s + c.quantity, 0);
                    return <div key={item._id} style={{ animation: `gb-fadeInUp 0.3s ${idx * 0.05}s ease both` }}><ProductCard item={item} cartQty={cartQty} onTap={() => setSelectedItem(item)} /></div>;
                  })}
                </div>
              )}
            </div>
          </div>
        )}
        {activeTab === "cart" && (
  <CartView
    cart={cart}
    onUpdateQty={updateQty}
    onPlaceOrder={handlePlaceOrderClick}
    isPlacing={isPlacing}
    appliedDiscount={appliedDiscount}
    onDiscountChange={setAppliedDiscount}
  />
)}
        {activeTab === "order" && <OrderView order={existingOrder} queuePosition={queuePosition} />}
        {activeTab === "info" && <InfoView table={table} />}
      <CRMCaptureCard tableId={tableId} />
<WaiterHelpSheet
  tableId={tableId}
  tableNumber={table?.tableNumber || tableId}
/>
      </main>

      <nav style={{ position: "fixed", bottom: "12px", left: "50%", transform: "translateX(-50%)", background: T.emerald, borderRadius: "99px", padding: "6px", display: "flex", alignItems: "center", gap: "4px", boxShadow: "0 8px 32px rgba(15,61,46,0.4)", zIndex: 40 }}>
        {([
          { id: "menu", icon: <Icons.Menu size={18} />, label: "Menu", badge: null },
          { id: "order", icon: <Icons.Receipt size={18} />, label: "Order", badge: existingOrder ? "•" : null },
          { id: "cart", icon: <Icons.Cart size={18} />, label: "Cart", badge: totalCartItems > 0 ? totalCartItems : null },
          { id: "info", icon: <Icons.Coffee size={18} />, label: "Info", badge: null },
        ] as { id: BottomTab; icon: React.ReactNode; label: string; badge: number | string | null }[]).map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
              background: isActive ? `linear-gradient(135deg, ${T.gold}, ${T.goldLight})` : "transparent",
              color: isActive ? T.emerald : "rgba(212,165,116,0.7)",
              borderRadius: "99px",
              padding: isActive ? "10px 16px" : "10px 12px",
              display: "flex", alignItems: "center", gap: "6px",
              cursor: "pointer", border: "none",
              transition: "all 200ms cubic-bezier(0.16, 1, 0.3, 1)",
              fontWeight: 800, fontSize: "11px", position: "relative", whiteSpace: "nowrap",
            }}>
              {tab.icon}
              {isActive && <span>{tab.label}</span>}
              {tab.badge !== null && !isActive && (
                <div key={typeof tab.badge === "number" ? tab.badge : "dot"} style={{
                  position: "absolute", top: "4px", right: "4px",
                  minWidth: typeof tab.badge === "number" ? "16px" : "8px",
                  height: typeof tab.badge === "number" ? "16px" : "8px",
                  padding: typeof tab.badge === "number" ? "0 4px" : "0",
                  borderRadius: "99px", background: T.danger, color: "white",
                  fontSize: "9px", fontWeight: 800,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  border: `2px solid ${T.emerald}`, fontFamily: "'DM Sans', sans-serif",
                  animation: "cartBadgeBounce 0.5s cubic-bezier(0.36, 0.07, 0.19, 0.97)",
                }}>{typeof tab.badge === "number" ? tab.badge : ""}</div>
              )}
            </button>
          );
        })}
      </nav>

      <ProductDetailModal item={selectedItem} isOpen={!!selectedItem} onClose={() => setSelectedItem(null)} onAddToCart={handleAddToCart} />
    </div>
  );
}
