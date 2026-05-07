// ════════════════════════════════════════════════════════════════
// GOLDEN BEANS — CINEMATIC HOME PAGE
// Design Direction: Dark Luxury / OTT Cinematic
// Fonts: Cormorant Garamond (display) + DM Sans (body) + DM Mono
// Palette: Deep charcoal (#070604) + Warm amber gold (#C8922A→#F5CC6A)
// Motion: GPU-accelerated, staggered reveals, parallax, breathing
// ════════════════════════════════════════════════════════════════

"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { getThumbnailUrl, getHeroUrl } from "@/lib/cloudinary";
import type { MenuCategory, MenuItem } from "@/types";

// ─── Design System ───────────────────────────────────────────────
const D = {
  // Backgrounds — layered darkness
  void:    "#030201",
  deep:    "#070604",
  dark:    "#0D0B08",
  surface: "#13110D",
  raised:  "#1A1710",
  lifted:  "#221F17",
  // Gold — warm amber spectrum
  goldDeep:"#7A5010",
  gold:    "#C8922A",
  goldMid: "#E8B84B",
  goldLt:  "#F5CC6A",
  goldXlt: "#FAE0A0",
  // Glow values
  glow0:   "rgba(200,146,42,0)",
  glow10:  "rgba(200,146,42,0.10)",
  glow20:  "rgba(200,146,42,0.20)",
  glow35:  "rgba(200,146,42,0.35)",
  glow55:  "rgba(200,146,42,0.55)",
  // Text
  ink:     "#F5EDD8",
  inkDim:  "#B8A888",
  inkMute: "#7A6B50",
  inkGhost:"#3D3428",
  // Glass
  glassWk: "rgba(255,255,255,0.025)",
  glassMd: "rgba(255,255,255,0.05)",
  glassSt: "rgba(255,255,255,0.08)",
  glassBd: "rgba(255,255,255,0.06)",
};

const GG   = `linear-gradient(135deg, ${D.gold} 0%, ${D.goldMid} 55%, ${D.goldLt} 100%)`;
const GGV  = `linear-gradient(180deg, ${D.gold} 0%, ${D.goldMid} 100%)`;
const EASE = "cubic-bezier(0.25, 0.46, 0.45, 0.94)";
const SPRING = "cubic-bezier(0.34, 1.56, 0.64, 1)";

// ─── Global Styles ───────────────────────────────────────────────
const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,600;1,700&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800;1,9..40,300;1,9..40,400&family=DM+Mono:wght@300;400;500&display=swap');

*, *::before, *::after {
  box-sizing: border-box;
  -webkit-tap-highlight-color: transparent;
  -webkit-font-smoothing: antialiased;
}

html, body {
  background: ${D.void};
  overflow-x: hidden;
  overscroll-behavior: none;
}

img {
  user-select: none;
  pointer-events: none;
  -webkit-user-drag: none;
}

input, textarea {
  -webkit-user-select: text !important;
  user-select: text !important;
}

/* Hide scrollbars */
.hs { scrollbar-width: none; -ms-overflow-style: none; }
.hs::-webkit-scrollbar { display: none; }

/* ── Cinematic keyframes ── */
@keyframes fadeRise {
  from { opacity: 0; transform: translateY(28px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes fadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}
@keyframes scaleReveal {
  from { opacity: 0; transform: scale(0.88); }
  to   { opacity: 1; transform: scale(1); }
}
@keyframes slideLeft {
  from { opacity: 0; transform: translateX(32px); }
  to   { opacity: 1; transform: translateX(0); }
}
@keyframes slideRight {
  from { opacity: 0; transform: translateX(-32px); }
  to   { opacity: 1; transform: translateX(0); }
}
@keyframes kenBurns {
  from { transform: scale(1.0) translate(0%, 0%); }
  to   { transform: scale(1.08) translate(-1%, -0.5%); }
}
@keyframes breatheGold {
  0%, 100% { opacity: 0.4; transform: scale(1); }
  50%       { opacity: 0.7; transform: scale(1.06); }
}
@keyframes floatY {
  0%, 100% { transform: translateY(0); }
  50%       { transform: translateY(-8px); }
}
@keyframes spin {
  to { transform: rotate(360deg); }
}
@keyframes shimmer {
  from { background-position: 200% center; }
  to   { background-position: -200% center; }
}
@keyframes rippleOut {
  from { transform: scale(0.6); opacity: 0.8; }
  to   { transform: scale(2.4); opacity: 0; }
}
@keyframes cartPop {
  0%   { transform: scale(1); }
  30%  { transform: scale(1.55); }
  65%  { transform: scale(0.88); }
  100% { transform: scale(1); }
}
@keyframes glowPulse {
  0%, 100% { box-shadow: 0 0 24px ${D.glow20}, 0 0 0 0 ${D.glow20}; }
  50%       { box-shadow: 0 0 48px ${D.glow35}, 0 0 0 8px ${D.glow0}; }
}
@keyframes lineSweep {
  from { transform: translateX(-100%); }
  to   { transform: translateX(400%); }
}
@keyframes smokeRise {
  0%   { opacity: 0; transform: translateY(0) scaleX(1); }
  30%  { opacity: 0.6; }
  100% { opacity: 0; transform: translateY(-52px) scaleX(2.2); }
}
@keyframes textReveal {
  from { clip-path: inset(0 100% 0 0); opacity: 0; }
  to   { clip-path: inset(0 0% 0 0); opacity: 1; }
}
@keyframes staggerIn {
  from { opacity: 0; transform: translateY(20px) scale(0.96); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}

/* Utility */
.gt {
  background: ${GG};
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
.sk {
  background: linear-gradient(90deg, ${D.surface} 25%, ${D.raised} 50%, ${D.surface} 75%);
  background-size: 200% 100%;
  animation: shimmer 2s ease-in-out infinite;
}
.press:active { transform: scale(0.94) !important; transition: transform 0.1s ease !important; }
`;

// ─── Interfaces ──────────────────────────────────────────────────
interface ECI {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  variants?: { groupName: string; selected: string[] }[];
  totalPriceModifier?: number;
  imageUrl?: string;
}

interface HomePageProps {
  menu: MenuCategory[];
  cart: ECI[];
  loading: boolean;
  customerData: { name: string; phone: string } | null;
  table: { tableNumber: string } | null;
  onItemTap: (item: MenuItem) => void;
  onCategorySelect: (id: string) => void;
  activeCategoryId: string;
  onViewCart: () => void;
  onExploreMenu: () => void;
  favs: Set<string>;
  onToggleFav: (id: string) => void;
}
// ════════════════════════════════════════════════════════════════
// CINEMATIC HERO BANNER
// Full-bleed, layered parallax, breathing glow, steam particles
// ════════════════════════════════════════════════════════════════
function CinematicHero({
  items, cart, onItemTap, onExplore, greeting, customerName
}: {
  items: MenuItem[]; cart: ECI[]; onItemTap:(i:MenuItem)=>void;
  onExplore:()=>void; greeting: string; customerName?: string;
}) {
  const [active, setActive] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [dragDelta, setDragDelta] = useState(0);
  const startX = useRef(0);
  const timer = useRef<NodeJS.Timeout | null>(null);
  const [revealed, setRevealed] = useState(false);

  const slides = items.filter(i => i.isAvailable).slice(0, 5);

  const next = useCallback(() => setActive(p => (p + 1) % slides.length), [slides.length]);
  const prev = useCallback(() => setActive(p => (p - 1 + slides.length) % slides.length), [slides.length]);

  useEffect(() => {
    const t = setTimeout(() => setRevealed(true), 80);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (dragging || !slides.length) return;
    timer.current = setInterval(next, 5200);
    return () => { if (timer.current) clearInterval(timer.current); };
  }, [next, dragging, active, slides.length]);

  if (!slides.length) return null;

  const slide = slides[active];
  const cartQty = cart.filter(c => c.menuItemId === slide._id).reduce((s,c) => s + c.quantity, 0);

  const onStart = (x: number) => {
    setDragging(true); startX.current = x;
    if (timer.current) clearInterval(timer.current);
  };
  const onMove = (x: number) => { if (dragging) setDragDelta(x - startX.current); };
  const onEnd = () => {
    if (Math.abs(dragDelta) > 48) dragDelta < 0 ? next() : prev();
    setDragging(false); setDragDelta(0);
  };

  return (
    <div style={{ position: "relative", width: "100%", height: "100svh", maxHeight: 680, minHeight: 480, overflow: "hidden", background: D.void }}
      onTouchStart={e => onStart(e.touches[0].clientX)}
      onTouchMove ={e => onMove(e.touches[0].clientX)}
      onTouchEnd  ={onEnd}
      onMouseDown ={e => onStart(e.clientX)}
      onMouseMove ={e => dragging && onMove(e.clientX)}
      onMouseUp   ={onEnd}
      onMouseLeave={onEnd}
    >
      {/* ── Image layers with parallax depth ── */}
      {slides.map((s, i) => (
        <div key={s._id} style={{
          position: "absolute", inset: "-5%",
          transition: dragging ? "none" : `all 0.75s ${EASE}`,
          opacity: i === active ? 1 : 0,
          transform: i === active
            ? `translateX(${dragDelta * 0.4}px) scale(1)`
            : i < active
              ? `translateX(calc(-110% + ${dragDelta * 0.4}px)) scale(0.96)`
              : `translateX(calc(110% + ${dragDelta * 0.4}px)) scale(0.96)`,
          zIndex: i === active ? 1 : 0,
        }}>
          {s.imageUrl
            ? <img src={getHeroUrl(s.imageUrl)} alt={s.name}
                style={{ width: "100%", height: "100%", objectFit: "cover",
                  animation: i === active ? "kenBurns 10s ease-out forwards" : "none",
                  transform: "scale(1.1)",
                }} />
            : <div style={{ width:"100%", height:"100%",
                background: `radial-gradient(ellipse 80% 80% at 60% 40%, #3D2010 0%, #1A0E06 40%, ${D.void} 100%)` }}/>
          }
        </div>
      ))}

      {/* ── Cinematic vignette layers ── */}
      {/* Bottom gradient — darkest, for text readability */}
      <div style={{ position:"absolute", inset:0, zIndex:3, pointerEvents:"none",
        background: `linear-gradient(to top,
          ${D.void} 0%,
          rgba(7,6,4,0.92) 18%,
          rgba(7,6,4,0.70) 35%,
          rgba(7,6,4,0.30) 55%,
          transparent 75%
        )` }} />
      {/* Left vignette — for text layer */}
      <div style={{ position:"absolute", inset:0, zIndex:3, pointerEvents:"none",
        background: `linear-gradient(to right,
          rgba(7,6,4,0.88) 0%,
          rgba(7,6,4,0.55) 40%,
          transparent 72%
        )` }} />
      {/* Gold ambient light — top right corner */}
      <div style={{ position:"absolute", top:"-10%", right:"-5%", width:"55%", height:"60%", zIndex:2, pointerEvents:"none",
        background: `radial-gradient(ellipse at top right, ${D.glow10} 0%, transparent 65%)`,
        animation: "breatheGold 6s ease-in-out infinite",
      }} />
      {/* Bottom ambient */}
      <div style={{ position:"absolute", bottom:0, left:"50%", transform:"translateX(-50%)", width:"70%", height:"35%", zIndex:2, pointerEvents:"none",
        background: `radial-gradient(ellipse at bottom, ${D.glow10} 0%, transparent 70%)`,
      }} />

      {/* ── Steam particles ── */}
      {[0,1,2,3].map(i => (
        <div key={i} style={{
          position:"absolute", zIndex:4, pointerEvents:"none",
          bottom: "28%", left: `${36 + i * 6}%`,
          width: 5 + i * 1.5, height: 28 + i * 8,
          borderRadius: 99,
          background: `linear-gradient(to top, rgba(245,204,106,0.35), transparent)`,
          animation: `smokeRise ${2.4 + i * 0.5}s ${i * 0.65}s ease-out infinite`,
          filter: "blur(2px)",
          opacity: 0,
        }} />
      ))}

      {/* ── Cinematic scan line (subtle texture) ── */}
      <div style={{ position:"absolute", inset:0, zIndex:4, pointerEvents:"none", opacity:0.025,
        backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(255,255,255,0.05) 1px, rgba(255,255,255,0.05) 2px)",
        backgroundSize: "100% 4px",
      }} />

      {/* ── Content ── */}
      <div style={{ position:"absolute", inset:0, zIndex:5, display:"flex", flexDirection:"column", justifyContent:"flex-end", padding:"0 22px 36px" }}>

        {/* Greeting */}
        {revealed && (
          <div style={{ marginBottom: 6, animation: `fadeRise 0.6s 0.1s ${EASE} both` }}>
            <span style={{ fontSize: 12, color: D.goldMid, fontFamily:"'DM Sans',sans-serif", fontWeight:500, letterSpacing:"0.12em", textTransform:"uppercase" }}>
              {greeting}{customerName ? `, ${customerName}` : ""} ✦
            </span>
          </div>
        )}

        {/* Hero headline */}
        {revealed && (
          <div style={{ marginBottom: 16, animation: `fadeRise 0.7s 0.2s ${EASE} both` }}>
            <h1 style={{
              fontFamily: "'Cormorant Garamond',serif",
              fontSize: "clamp(38px, 11vw, 58px)",
              fontWeight: 300,
              color: D.ink,
              lineHeight: 1.08,
              margin: 0,
              letterSpacing: "-0.01em",
            }}>
              Brewed to<br />
              <em style={{ fontStyle:"italic", fontWeight:600, color: D.goldLt }}>perfection,</em><br />
              <span style={{ fontWeight: 300 }}>just for you.</span>
            </h1>
          </div>
        )}

        {/* Subtext */}
        {revealed && (
          <div style={{ marginBottom: 24, animation: `fadeRise 0.7s 0.35s ${EASE} both` }}>
            <p style={{ fontSize:13, color: D.inkDim, fontFamily:"'DM Sans',sans-serif", fontWeight:400, margin:0, lineHeight:1.5, maxWidth:240 }}>
              {slide.description || "Handcrafted with rare single-origin beans and artisanal care."}
            </p>
          </div>
        )}

        {/* CTA row */}
        {revealed && (
          <div style={{ display:"flex", gap:12, alignItems:"center", animation:`fadeRise 0.7s 0.45s ${EASE} both` }}>
            {/* Explore button */}
            <button onClick={onExplore} className="press"
              style={{ display:"flex", alignItems:"center", gap:8,
                background: `linear-gradient(135deg, rgba(200,146,42,0.18) 0%, rgba(200,146,42,0.08) 100%)`,
                backdropFilter: "blur(20px)",
                border: `1px solid rgba(200,146,42,0.38)`,
                borderRadius: 99,
                padding: "11px 22px",
                color: D.goldLt,
                fontSize: 13,
                fontWeight: 600,
                fontFamily: "'DM Sans',sans-serif",
                cursor: "pointer",
                letterSpacing: "0.02em",
                boxShadow: `inset 0 1px 0 rgba(255,255,255,0.08)`,
              }}>
              Explore Menu
              <svg width={14} height={14} viewBox="0 0 14 14" fill="none">
                <path d="M2 7h10M8 3l4 4-4 4" stroke={D.goldLt} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>

            {/* Quick add */}
            <button onClick={() => onItemTap(slide)} className="press"
              style={{ position:"relative", width: 46, height: 46, borderRadius:"50%",
                background: cartQty > 0 ? GG : `rgba(200,146,42,0.12)`,
                border: `1.5px solid ${cartQty > 0 ? D.goldMid : "rgba(200,146,42,0.45)"}`,
                color: cartQty > 0 ? D.void : D.gold,
                cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 19,
                fontWeight: 800,
                backdropFilter: "blur(12px)",
                boxShadow: cartQty > 0 ? `0 0 0 4px ${D.glow10}, 0 8px 24px ${D.glow35}` : "none",
                transition: `all 0.3s ${SPRING}`,
              }}>
              {cartQty > 0 ? "✓" : "+"}
              {cartQty > 0 && (
                <div style={{ position:"absolute", top:-5, right:-5, width:18, height:18, borderRadius:"50%",
                  background: GG, color: D.void, fontSize:9, fontWeight:900,
                  display:"flex", alignItems:"center", justifyContent:"center",
                  border: `2px solid ${D.void}`, animation: "cartPop 0.45s ease",
                  fontFamily:"'DM Mono',monospace",
                }}>{cartQty}</div>
              )}
            </button>
          </div>
        )}
      </div>

      {/* ── Slide indicators ── */}
      <div style={{ position:"absolute", right:20, bottom:"50%", transform:"translateY(50%)", zIndex:6,
        display:"flex", flexDirection:"column", gap:6, alignItems:"center" }}>
        {/* Counter */}
        <span style={{ fontSize:10, color: D.gold, fontFamily:"'DM Mono',monospace", fontWeight:500, marginBottom:4,
          writingMode:"horizontal-tb" }}>
          0{active+1}
        </span>
        {/* Dots */}
        {slides.map((_,i) => (
          <button key={i} onClick={() => setActive(i)}
            style={{ width: i === active ? 2.5 : 2, height: i === active ? 22 : 7, borderRadius:99,
              background: i === active ? GGV : `rgba(200,146,42,0.28)`,
              border:"none", cursor:"pointer", padding:0,
              transition: `all 0.4s ${SPRING}`,
              boxShadow: i === active ? `0 0 8px ${D.glow35}` : "none",
            }} />
        ))}
        <span style={{ fontSize:10, color: D.inkGhost, fontFamily:"'DM Mono',monospace", marginTop:4 }}>
          0{slides.length}
        </span>
      </div>

      {/* ── Item name tag — bottom right ── */}
      {revealed && (
        <div style={{ position:"absolute", right:22, bottom:80, zIndex:6,
          textAlign:"right", animation:`slideLeft 0.6s 0.5s ${EASE} both` }}>
          <p style={{ fontSize:11, color: D.gold, fontFamily:"'DM Mono',monospace", fontWeight:400, margin:"0 0 3px", letterSpacing:"0.1em", textTransform:"uppercase" }}>
            Featured
          </p>
          <p style={{ fontSize:15, color: D.ink, fontFamily:"'Cormorant Garamond',serif", fontWeight:600, margin:"0 0 2px" }}>
            {slide.name}
          </p>
          <p style={{ fontSize:13, color: D.gold, fontFamily:"'DM Mono',monospace", fontWeight:400 }}>
            ₹{slide.price}
          </p>
        </div>
      )}
    </div>
  );
}
// ════════════════════════════════════════════════════════════════
// GLASSMORPHISM CATEGORY BAR
// Floating pill bar with gold glow selection
// ════════════════════════════════════════════════════════════════
function GlassCategoryBar({ categories, active, onSelect }: {
  categories: MenuCategory[]; active: string; onSelect:(id:string)=>void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current?.querySelector('[data-active="true"]') as HTMLElement;
    el?.scrollIntoView({ behavior:"smooth", block:"nearest", inline:"center" });
  }, [active]);

  return (
    <div style={{ padding:"24px 0 8px", position:"relative" }}>
      {/* Section label */}
      <div style={{ padding:"0 22px", marginBottom:12 }}>
        <span style={{ fontSize:10, color: D.gold, fontFamily:"'DM Mono',monospace", letterSpacing:"0.18em", textTransform:"uppercase" }}>
          ✦ Explore
        </span>
      </div>
      {/* Scrollable pills */}
      <div ref={ref} className="hs"
        style={{ display:"flex", gap:10, overflowX:"auto", padding:"4px 22px 8px" }}>
        {categories.map((cat, idx) => {
          const isA = cat._id === active;
          return (
            <button key={cat._id} data-active={isA} onClick={() => onSelect(cat._id)}
              className="press"
              style={{
                flexShrink: 0,
                display: "flex", alignItems: "center", gap: 8,
                background: isA
                  ? `linear-gradient(135deg, rgba(200,146,42,0.22) 0%, rgba(232,184,75,0.12) 100%)`
                  : D.glassWk,
                backdropFilter: "blur(24px)",
                WebkitBackdropFilter: "blur(24px)",
                border: `1px solid ${isA ? "rgba(200,146,42,0.52)" : D.glassBd}`,
                borderRadius: 99,
                padding: "9px 18px 9px 12px",
                cursor: "pointer",
                boxShadow: isA
                  ? `0 0 24px ${D.glow20}, inset 0 1px 0 rgba(255,255,255,0.06), 0 4px 16px rgba(0,0,0,0.4)`
                  : `inset 0 1px 0 rgba(255,255,255,0.04), 0 2px 8px rgba(0,0,0,0.3)`,
                transition: `all 0.32s ${SPRING}`,
                animation: `staggerIn 0.45s ${idx * 0.06}s ${EASE} both`,
                position: "relative", overflow: "hidden",
              }}>
              {/* Shine sweep on active */}
              {isA && (
                <div style={{ position:"absolute", inset:0, pointerEvents:"none", overflow:"hidden", borderRadius:99 }}>
                  <div style={{ position:"absolute", top:0, left:0, width:"30%", height:"100%",
                    background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)",
                    animation: "lineSweep 2.5s ease-in-out infinite",
                  }} />
                </div>
              )}

              <span style={{ fontSize:20, lineHeight:1 }}>{cat.icon}</span>
              <span style={{
                fontSize: 12.5, fontWeight: isA ? 700 : 500,
                color: isA ? D.goldLt : D.inkDim,
                fontFamily: "'DM Sans',sans-serif",
                whiteSpace: "nowrap",
                letterSpacing: "0.01em",
              }}>{cat.name}</span>

              {isA && (
                <div style={{ width:5, height:5, borderRadius:"50%", background: D.gold,
                  boxShadow: `0 0 6px ${D.gold}`, marginLeft:2 }} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// CINEMATIC PRODUCT CARD
// Floating, layered depth, gold hover, rich shadows
// ════════════════════════════════════════════════════════════════
function CinematicCard({ item, qty, isFav, onFav, onTap, delay=0, size="normal" }: {
  item: MenuItem; qty: number; isFav: boolean;
  onFav:()=>void; onTap:()=>void; delay?:number;
  size?: "normal" | "large" | "compact";
}) {
  const [pressed, setPressed] = useState(false);
  const [ripple, setRipple] = useState<{x:number;y:number}|null>(null);

  const W = size === "large" ? 220 : size === "compact" ? 148 : 172;
  const H = size === "large" ? 180 : size === "compact" ? 128 : 156;

  const tap = (e: React.MouseEvent) => {
    if (!item.isAvailable) return;
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setRipple({ x: e.clientX - r.left, y: e.clientY - r.top });
    setTimeout(() => setRipple(null), 700);
    onTap();
  };

  return (
    <div
      onClick={tap}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      onTouchStart={() => setPressed(true)}
      onTouchEnd={() => setPressed(false)}
      style={{
        flexShrink: 0,
        width: W,
        borderRadius: 20,
        overflow: "hidden",
        cursor: item.isAvailable ? "pointer" : "not-allowed",
        opacity: item.isAvailable ? 1 : 0.4,
        background: `linear-gradient(160deg, ${D.raised} 0%, ${D.surface} 100%)`,
        border: `1px solid ${qty > 0 ? "rgba(200,146,42,0.45)" : D.glassBd}`,
        boxShadow: qty > 0
          ? `0 0 0 1px ${D.glow20}, 0 8px 32px ${D.glow20}, 0 2px 8px rgba(0,0,0,0.6)`
          : `0 4px 20px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.04)`,
        transform: pressed ? "scale(0.955) translateY(2px)" : "scale(1) translateY(0)",
        transition: `all 0.28s ${SPRING}`,
        animation: `staggerIn 0.5s ${delay}s ${EASE} both`,
        position: "relative",
      }}
    >
      {/* Image section */}
      <div style={{ position:"relative", height: H, overflow:"hidden" }}>
        {item.imageUrl
          ? <img src={getThumbnailUrl(item.imageUrl)} alt={item.name}
              style={{ width:"100%", height:"100%", objectFit:"cover",
                transition: "transform 0.5s ease",
                transform: pressed ? "scale(1.06)" : "scale(1.01)",
              }} loading="lazy" />
          : <div style={{ width:"100%", height:"100%",
              background: `radial-gradient(ellipse at 50% 30%, #3D2010 0%, #1A0E06 50%, ${D.surface} 100%)`,
              display:"flex", alignItems:"center", justifyContent:"center", fontSize:52, opacity:0.7 }}>☕</div>
        }

        {/* Bottom image gradient */}
        <div style={{ position:"absolute", inset:0,
          background: `linear-gradient(to top, ${D.surface} 0%, rgba(19,17,13,0.6) 45%, transparent 70%)`,
        }} />

        {/* Top-left badge */}
        {item.tags?.includes("bestseller") && (
          <div style={{ position:"absolute", top:10, left:10,
            background: GG, color: D.void,
            fontSize:8.5, fontWeight:800, padding:"2.5px 9px", borderRadius:99,
            letterSpacing:"0.06em", fontFamily:"'DM Sans',sans-serif",
            boxShadow: `0 2px 8px ${D.glow35}`,
          }}>⭐ BEST</div>
        )}
        {!item.isAvailable && (
          <div style={{ position:"absolute", top:10, left:10,
            background:"rgba(229,57,53,0.85)", color:"white",
            fontSize:8, fontWeight:800, padding:"2px 8px", borderRadius:99, letterSpacing:"0.05em",
          }}>SOLD OUT</div>
        )}

        {/* Qty badge */}
        {qty > 0 && (
          <div style={{ position:"absolute", top:8, right:42,
            width:22, height:22, borderRadius:"50%",
            background: GG, color: D.void,
            fontSize:10, fontWeight:900, display:"flex", alignItems:"center", justifyContent:"center",
            border: `2px solid ${D.surface}`, animation:"cartPop 0.45s ease",
            fontFamily:"'DM Mono',monospace",
          }}>{qty}</div>
        )}

        {/* Fav button */}
        <button onClick={e=>{e.stopPropagation();onFav();}} className="press"
          style={{ position:"absolute", top:8, right:8,
            width:30, height:30, borderRadius:"50%",
            background:"rgba(7,6,4,0.65)", backdropFilter:"blur(8px)",
            border:`1px solid ${isFav ? "rgba(229,57,53,0.6)" : D.glassBd}`,
            color: isFav ? "#ef4444" : D.inkDim,
            cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:13, transition:`all 0.2s ${EASE}`,
          }}>{isFav?"❤":"🤍"}</button>

        {/* Price — overlaid on image bottom */}
        <div style={{ position:"absolute", bottom:9, left:11, right:11,
          display:"flex", justifyContent:"space-between", alignItems:"flex-end" }}>
          <span style={{ fontSize:17, fontWeight:500, color:D.gold, fontFamily:"'DM Mono',monospace" }}>
            ₹{item.price}
          </span>
          {item.rating && (
            <div style={{ display:"flex", alignItems:"center", gap:3 }}>
              <span style={{ color:D.gold, fontSize:10 }}>★</span>
              <span style={{ fontSize:10, color:"rgba(245,237,216,0.5)", fontFamily:"'DM Mono',monospace" }}>
                {item.rating.toFixed(1)}
              </span>
            </div>
          )}
        </div>

        {/* Ripple */}
        {ripple && (
          <div style={{ position:"absolute", left:ripple.x-20, top:ripple.y-20, width:40, height:40,
            borderRadius:"50%", background:`rgba(200,146,42,0.35)`,
            animation:"rippleOut 0.7s ease-out forwards", pointerEvents:"none",
          }} />
        )}
      </div>

      {/* Text body */}
      <div style={{ padding:"10px 12px 12px" }}>
        <p style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:16, fontWeight:600,
          color:D.ink, margin:"0 0 3px", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
          {item.name}
        </p>
        {size !== "compact" && (
          <p style={{ fontSize:10.5, color:D.inkMute, margin:"0 0 10px", lineHeight:1.45,
            fontFamily:"'DM Sans',sans-serif",
            display:"-webkit-box", WebkitLineClamp:1, WebkitBoxOrient:"vertical", overflow:"hidden" }}>
            {item.description || "Artisanal quality, crafted with care"}
          </p>
        )}

        {/* Add button */}
        <button onClick={e=>{e.stopPropagation();if(item.isAvailable)onTap();}} className="press"
          style={{ width:"100%", padding:"9px 0",
            borderRadius:11,
            border: `1px solid ${qty > 0 ? "rgba(200,146,42,0.55)" : D.glassBd}`,
            background: qty > 0
              ? `linear-gradient(135deg, rgba(200,146,42,0.22) 0%, rgba(232,184,75,0.12) 100%)`
              : D.glassWk,
            color: qty > 0 ? D.goldLt : D.inkDim,
            fontWeight: 600, fontSize:12,
            cursor: item.isAvailable ? "pointer" : "not-allowed",
            fontFamily:"'DM Sans',sans-serif",
            display:"flex", alignItems:"center", justifyContent:"center", gap:5,
            transition:`all 0.25s ${EASE}`,
            backdropFilter:"blur(8px)",
            boxShadow: qty > 0 ? `0 4px 16px ${D.glow20}` : "none",
          }}>
          {!item.isAvailable
            ? <><span style={{opacity:0.5}}>⛔</span> Unavailable</>
            : qty > 0
              ? <><span style={{fontSize:13}}>✓</span> Added ({qty})</>
              : <><span style={{fontSize:15, fontWeight:700}}>+</span> Add to Cart</>
          }
        </button>
      </div>
    </div>
  );
}
// ════════════════════════════════════════════════════════════════
// CINEMATIC SECTION ROW
// Full-width horizontal scroll with depth perspective
// ════════════════════════════════════════════════════════════════
function CinematicRow({ title, eyebrow, items, cart, onTap, favs, onFav, featured=false }: {
  title:string; eyebrow?:string; items:MenuItem[]; cart:ECI[];
  onTap:(i:MenuItem)=>void; favs:Set<string>; onFav:(id:string)=>void;
  featured?:boolean;
}) {
  if (!items.length) return null;

  return (
    <section style={{ marginBottom: 40, position:"relative" }}>
      {/* Section header */}
      <div style={{ padding:"0 22px", marginBottom:16, display:"flex", justifyContent:"space-between", alignItems:"flex-end" }}>
        <div>
          {eyebrow && (
            <p style={{ fontSize:10, color:D.gold, fontFamily:"'DM Mono',monospace",
              letterSpacing:"0.15em", textTransform:"uppercase", margin:"0 0 4px" }}>
              {eyebrow}
            </p>
          )}
          <h3 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:22, fontWeight:600,
            color:D.ink, margin:0, letterSpacing:"-0.01em" }}>
            {title}
          </h3>
        </div>
        <button style={{ fontSize:12, color:D.gold, background:"none", border:"none", cursor:"pointer",
          fontFamily:"'DM Sans',sans-serif", fontWeight:500, display:"flex", alignItems:"center", gap:4,
          opacity:0.75 }}>
          See all
          <svg width={12} height={12} viewBox="0 0 12 12"><path d="M2 6h8M6 2l4 4-4 4" stroke={D.gold} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
      </div>

      {/* Horizontal scroll */}
      <div className="hs" style={{ display:"flex", gap:12, overflowX:"auto",
        padding:"4px 22px 12px", scrollSnapType:"x mandatory" }}>
        {items.map((item, idx) => {
          const qty = cart.filter(c => c.menuItemId === item._id).reduce((s,c) => s+c.quantity, 0);
          return (
            <div key={item._id} style={{ flexShrink:0, scrollSnapAlign:"start" }}>
              <CinematicCard
                item={item} qty={qty}
                isFav={favs.has(item._id)} onFav={() => onFav(item._id)}
                onTap={() => onTap(item)}
                delay={idx * 0.055}
                size={featured && idx === 0 ? "large" : idx > 3 ? "compact" : "normal"}
              />
            </div>
          );
        })}
      </div>

      {/* Fade edge right */}
      <div style={{ position:"absolute", right:0, top:"30%", width:60, height:"50%", pointerEvents:"none",
        background:`linear-gradient(to left, ${D.deep}, transparent)` }} />
    </section>
  );
}

// ════════════════════════════════════════════════════════════════
// CINEMATIC COMPACT HORIZONTAL LIST
// ════════════════════════════════════════════════════════════════
function CompactCinematicRow({ title, eyebrow, items, cart, onTap }: {
  title:string; eyebrow?:string; items:MenuItem[]; cart:ECI[];
  onTap:(i:MenuItem)=>void;
}) {
  if (!items.length) return null;

  return (
    <section style={{ marginBottom:36, padding:"0 22px" }}>
      <div style={{ marginBottom:14, display:"flex", justifyContent:"space-between", alignItems:"flex-end" }}>
        <div>
          {eyebrow && <p style={{ fontSize:10, color:D.gold, fontFamily:"'DM Mono',monospace", letterSpacing:"0.15em", textTransform:"uppercase", margin:"0 0 4px" }}>{eyebrow}</p>}
          <h3 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:21, fontWeight:600, color:D.ink, margin:0 }}>{title}</h3>
        </div>
        <button style={{ fontSize:12, color:D.gold, background:"none", border:"none", cursor:"pointer", fontFamily:"'DM Sans',sans-serif", fontWeight:500 }}>See all</button>
      </div>

      <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
        {items.slice(0,5).map((item, idx) => {
          const qty = cart.filter(c=>c.menuItemId===item._id).reduce((s,c)=>s+c.quantity,0);
          return (
            <div key={item._id} onClick={()=>item.isAvailable&&onTap(item)}
              style={{
                display:"flex", gap:13, alignItems:"center",
                background:`linear-gradient(135deg, ${D.surface} 0%, ${D.raised} 100%)`,
                borderRadius:16,
                padding:"11px 13px",
                border:`1px solid ${qty>0?"rgba(200,146,42,0.38)":D.glassBd}`,
                boxShadow: qty>0 ? `0 0 0 1px ${D.glow10}, 0 4px 16px rgba(0,0,0,0.4)` : "0 2px 12px rgba(0,0,0,0.35)",
                cursor:item.isAvailable?"pointer":"not-allowed",
                opacity:item.isAvailable?1:0.45,
                animation:`staggerIn 0.4s ${idx*0.07}s ${EASE} both`,
                transition:`all 0.25s ${EASE}`,
              }}>
              {/* Thumbnail */}
              <div style={{ width:56, height:56, borderRadius:13, overflow:"hidden", flexShrink:0,
                background:`linear-gradient(135deg, #3D2010, ${D.surface})` }}>
                {item.imageUrl && <img src={getThumbnailUrl(item.imageUrl)} alt={item.name}
                  style={{width:"100%",height:"100%",objectFit:"cover"}} loading="lazy"/>}
              </div>
              {/* Info */}
              <div style={{flex:1,minWidth:0}}>
                <p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:16,fontWeight:600,color:D.ink,margin:"0 0 2px",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{item.name}</p>
                <p style={{fontSize:10,color:D.inkMute,margin:"0 0 5px",fontFamily:"'DM Sans',sans-serif",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.description||"Premium quality"}</p>
                <span style={{fontSize:14,fontWeight:500,color:D.gold,fontFamily:"'DM Mono',monospace"}}>₹{item.price}</span>
              </div>
              {/* Quick add */}
              <button onClick={e=>{e.stopPropagation();if(item.isAvailable)onTap(item);}} className="press"
                style={{width:32,height:32,borderRadius:"50%",
                  border:`1.5px solid ${qty>0?"rgba(200,146,42,0.7)":D.glassBd}`,
                  background:qty>0?`linear-gradient(135deg,rgba(200,146,42,0.25),rgba(232,184,75,0.12))`:"transparent",
                  color:qty>0?D.goldLt:D.inkDim,cursor:"pointer",
                  display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:700,
                  transition:`all 0.22s ${SPRING}`,
                  boxShadow:qty>0?`0 0 12px ${D.glow20}`:"none",
                }}>
                {qty>0?"✓":"+"}
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ════════════════════════════════════════════════════════════════
// PROMO ATMOSPHERE CARD
// ════════════════════════════════════════════════════════════════
function AtmospherePromo({ onTap }: { onTap:()=>void }) {
  return (
    <div style={{ margin:"0 22px 36px" }}>
      <div onClick={onTap} className="press"
        style={{
          background: `radial-gradient(ellipse 100% 100% at 80% 50%, rgba(60,30,8,0.9) 0%, rgba(30,14,4,0.98) 60%, ${D.surface} 100%)`,
          borderRadius:22,
          padding:"22px 20px",
          position:"relative",
          overflow:"hidden",
          border:`1px solid rgba(200,146,42,0.28)`,
          boxShadow:`0 8px 36px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.04)`,
          cursor:"pointer",
        }}>

        {/* Ambient glow circle */}
        <div style={{ position:"absolute", right:-24, top:"50%", transform:"translateY(-50%)",
          width:160, height:160, borderRadius:"50%",
          background:`radial-gradient(circle, ${D.glow20} 0%, transparent 70%)`,
          animation:"breatheGold 5s ease-in-out infinite",
        }} />
        {/* Coffee steam decoration */}
        {[0,1].map(i=>(
          <div key={i} style={{ position:"absolute", right:40+i*14, bottom:"50%",
            width:4,height:20,borderRadius:99,
            background:`linear-gradient(to top, ${D.glow35}, transparent)`,
            animation:`smokeRise 2s ${i*0.7}s ease-out infinite`,
            filter:"blur(1px)", opacity:0,
          }} />
        ))}
        {/* Large faded ☕ */}
        <div style={{ position:"absolute", right:10, bottom:-8, fontSize:72,
          opacity:0.08, pointerEvents:"none", userSelect:"none" }}>☕</div>

        <p style={{ fontSize:9.5, color:D.gold, fontFamily:"'DM Mono',monospace",
          letterSpacing:"0.18em", textTransform:"uppercase", margin:"0 0 5px" }}>
          Special For You
        </p>
        <h3 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:34, fontWeight:700,
          color:D.goldLt, margin:"0 0 5px", lineHeight:1 }}>
          Flat 20% Off
        </h3>
        <p style={{ fontSize:12.5, color:D.inkDim, margin:"0 0 18px",
          fontFamily:"'DM Sans',sans-serif", maxWidth:200 }}>
          On all beverages this evening
        </p>
        <div style={{ display:"flex", alignItems:"center", gap:8,
          background:`linear-gradient(135deg, rgba(200,146,42,0.14), rgba(200,146,42,0.06))`,
          backdropFilter:"blur(12px)",
          border:`1px solid rgba(200,146,42,0.35)`,
          borderRadius:99, padding:"8px 16px", width:"fit-content",
          boxShadow:`inset 0 1px 0 rgba(255,255,255,0.07)`,
        }}>
          <span style={{ fontSize:12, color:D.goldLt, fontFamily:"'DM Sans',sans-serif", fontWeight:600 }}>
            Order Now
          </span>
          <svg width={13} height={13} viewBox="0 0 13 13"><path d="M2 6.5h9M7 2.5l4 4-4 4" stroke={D.goldLt} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"/></svg>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// SKELETON LOADER — cinematic shimmer
// ════════════════════════════════════════════════════════════════
function HomeSkeletons() {
  return (
    <div style={{ animation:`fadeIn 0.4s ${EASE}` }}>
      {/* Hero skeleton */}
      <div className="sk" style={{ width:"100%", height:"60vh", maxHeight:520, minHeight:380 }} />

      {/* Category skeleton */}
      <div style={{ display:"flex", gap:10, padding:"20px 22px", overflow:"hidden" }}>
        {[80,100,90,110,85].map((w,i) => (
          <div key={i} className="sk" style={{ flexShrink:0, width:w, height:38, borderRadius:99 }} />
        ))}
      </div>

      {/* Card rows skeleton */}
      {[0,1].map(row => (
        <div key={row} style={{ padding:"12px 22px 20px" }}>
          <div className="sk" style={{ width:140, height:16, borderRadius:8, marginBottom:12 }} />
          <div style={{ display:"flex", gap:12, overflow:"hidden" }}>
            {[172,172,148,148].map((w,i) => (
              <div key={i} style={{ flexShrink:0, width:w }}>
                <div className="sk" style={{ height:156, borderRadius:"20px 20px 0 0" }} />
                <div style={{ background:D.surface, borderRadius:"0 0 20px 20px", padding:12 }}>
                  <div className="sk" style={{ height:14, borderRadius:6, marginBottom:7, width:"80%" }} />
                  <div className="sk" style={{ height:30, borderRadius:11 }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
// ════════════════════════════════════════════════════════════════
// FLOATING CART BAR
// ════════════════════════════════════════════════════════════════
function FloatingCartBar({ cart, discount, onView }: { cart:ECI[]; discount:number; onView:()=>void }) {
  const total = cart.reduce((s,i)=>s+(i.price+(i.totalPriceModifier||0))*i.quantity,0);
  const items = cart.reduce((s,i)=>s+i.quantity,0);
  const [bump, setBump] = useState(false);
  const prev = useRef(0);

  useEffect(()=>{
    if(cart.length!==prev.current){setBump(true);setTimeout(()=>setBump(false),500);}
    prev.current=cart.length;
  },[cart.length]);

  if(!cart.length) return null;

  return (
    <div style={{
      position:"fixed", bottom:76, left:14, right:14, zIndex:50,
      animation:`staggerIn 0.5s ${SPRING}`,
    }}>
      <button onClick={onView}
        style={{
          width:"100%",
          background:`linear-gradient(135deg, rgba(19,17,13,0.97) 0%, rgba(26,23,16,0.97) 100%)`,
          backdropFilter:"blur(28px)",
          WebkitBackdropFilter:"blur(28px)",
          borderRadius:20,
          padding:"12px 14px",
          border:`1px solid rgba(200,146,42,0.42)`,
          boxShadow:`0 8px 40px rgba(0,0,0,0.75), 0 0 0 1px ${D.glow10}, 0 0 28px ${D.glow20}`,
          display:"flex", alignItems:"center", justifyContent:"space-between",
          cursor:"pointer",
          transform: bump ? "scale(1.025)" : "scale(1)",
          transition:`transform 0.35s ${SPRING}`,
        }}>

        {/* Left side */}
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          {/* Cart icon with badge */}
          <div style={{position:"relative"}}>
            <div style={{
              width:44,height:44,borderRadius:14,
              background:`linear-gradient(135deg,rgba(200,146,42,0.20),rgba(232,184,75,0.10))`,
              border:`1.5px solid rgba(200,146,42,0.45)`,
              display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,
              backdropFilter:"blur(8px)",
            }}>🛒</div>
            <div style={{
              position:"absolute",top:-7,right:-7,
              width:20,height:20,borderRadius:"50%",
              background:GG,color:D.void,fontSize:9.5,fontWeight:900,
              display:"flex",alignItems:"center",justifyContent:"center",
              border:`2px solid ${D.dark}`,
              fontFamily:"'DM Mono',monospace",
              animation:bump?"cartPop 0.45s ease":"none",
              boxShadow:`0 2px 8px ${D.glow35}`,
            }}>{items}</div>
          </div>

          <div style={{textAlign:"left"}}>
            <p style={{fontFamily:"'DM Mono',monospace",fontWeight:500,fontSize:17,color:D.ink,margin:0,lineHeight:1}}>
              ₹{(total*1.05).toFixed(0)}
            </p>
            {discount>0 && (
              <p style={{fontSize:10,color:"#4CAF6A",margin:"3px 0 0",fontWeight:600,fontFamily:"'DM Sans',sans-serif"}}>
                Saving ₹{discount} ✦
              </p>
            )}
          </div>
        </div>

        {/* Right CTA */}
        <div style={{
          display:"flex",alignItems:"center",gap:7,
          background:GG, borderRadius:13, padding:"10px 18px",
          boxShadow:`0 4px 20px ${D.glow35}`,
        }}>
          <span style={{fontFamily:"'DM Sans',sans-serif",fontWeight:700,fontSize:13.5,color:D.void}}>
            View Cart
          </span>
          <svg width={14} height={14} viewBox="0 0 14 14"><path d="M2 7h10M8 3l4 4-4 4" stroke={D.void} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"/></svg>
        </div>
      </button>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// AMBIENT SECTION DIVIDER
// ════════════════════════════════════════════════════════════════
function AmbientDivider() {
  return (
    <div style={{ position:"relative", height:1, margin:"8px 22px 32px", overflow:"visible" }}>
      <div style={{ height:1, background:`linear-gradient(90deg, transparent, ${D.glow20}, ${D.glow35}, ${D.glow20}, transparent)` }} />
      {/* Center jewel */}
      <div style={{ position:"absolute", left:"50%", top:"50%", transform:"translate(-50%,-50%)",
        width:6, height:6, borderRadius:"50%", background:D.gold,
        boxShadow:`0 0 12px ${D.glow55}, 0 0 24px ${D.glow20}`,
      }} />
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// STICKY HEADER — transparent → solid scroll effect
// ════════════════════════════════════════════════════════════════
function StickyHeader({ table, customerData }: { table:{tableNumber:string}|null; customerData:{name:string}|null }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(()=>{
    const el = document.querySelector(".home-scroll");
    if(!el) return;
    const fn=()=>setScrolled(el.scrollTop>80);
    el.addEventListener("scroll",fn);
    return()=>el.removeEventListener("scroll",fn);
  },[]);

  return (
    <header style={{
      position:"sticky",top:0,zIndex:30,
      background: scrolled
        ? `linear-gradient(180deg, rgba(7,6,4,0.97) 0%, rgba(7,6,4,0.96) 100%)`
        : "transparent",
      backdropFilter: scrolled ? "blur(24px)" : "none",
      WebkitBackdropFilter: scrolled ? "blur(24px)" : "none",
      padding:"13px 18px",
      borderBottom: scrolled ? `1px solid ${D.glassBd}` : "none",
      transition:`all 0.35s ${EASE}`,
    }}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{display:"flex",alignItems:"center",gap:11}}>
          {/* Logo */}
          <div style={{
            width:40,height:40,borderRadius:13,overflow:"hidden",
            border:`1.5px solid rgba(200,146,42,${scrolled?0.55:0.3})`,
            boxShadow:`0 0 16px ${D.glow20}`,
            transition:`all 0.3s ${EASE}`,
          }}>
            <img src="/logo-small.png" alt="GB"
              style={{width:"100%",height:"100%",objectFit:"contain"}}
              onError={e=>{(e.target as HTMLImageElement).style.display="none";}}/>
          </div>

          <div>
            <p style={{
              fontFamily:"'Cormorant Garamond',serif",
              fontSize:17.5,fontWeight:600,
              color: scrolled ? D.ink : "rgba(245,237,216,0.9)",
              margin:0,lineHeight:1.1,
              transition:`color 0.3s ${EASE}`,
            }}>Golden Beans</p>
            <p style={{
              fontSize:10,color:scrolled?D.inkMute:"rgba(245,237,216,0.45)",
              margin:0,fontFamily:"'DM Sans',sans-serif",fontWeight:400,
              transition:`color 0.3s ${EASE}`,
            }}>
              {table?`Table ${table.tableNumber} ✦ `:""}
              {customerData?customerData.name:"Cafe & Bistro"}
            </p>
          </div>
        </div>

        {/* Search + Notification */}
        <div style={{display:"flex",gap:8}}>
          {["🔍","🔔"].map((ic,i)=>(
            <button key={i} style={{
              width:38,height:38,borderRadius:12,
              background:`rgba(255,255,255,${scrolled?0.06:0.04})`,
              border:`1px solid ${D.glassBd}`,
              backdropFilter:"blur(12px)",
              color:D.ink,cursor:"pointer",
              display:"flex",alignItems:"center",justifyContent:"center",
              fontSize:16,
              transition:`all 0.3s ${EASE}`,
            }}>{ic}</button>
          ))}
        </div>
      </div>
    </header>
  );
}
// ════════════════════════════════════════════════════════════════
// CINEMATIC HOME PAGE — Main Export
// ════════════════════════════════════════════════════════════════
export default function CinematicHomePage({
  menu, cart, loading, customerData, table,
  onItemTap, onCategorySelect, activeCategoryId,
  onViewCart, onExploreMenu, favs, onToggleFav,
}: HomePageProps) {

  const allItems   = menu.flatMap(c => c.items as MenuItem[]);
  const bestsellers= allItems.filter(i => i.tags?.includes("bestseller") && i.isAvailable);
  const catItems   = (menu.find(c=>c._id===activeCategoryId)?.items||[]) as MenuItem[];

  const hour = new Date().getHours();
  const greeting = hour<5?"Still Up Late?":hour<12?"Good Morning":hour<17?"Good Afternoon":hour<21?"Good Evening":"Good Night";

  return (
    <div style={{ minHeight:"100dvh", background:D.deep, overflowX:"hidden" }}>
      <style>{STYLES}</style>

      {/* ── Sticky header overlaying hero ── */}
      <div style={{ position:"sticky", top:0, zIndex:30 }}>
        <StickyHeader table={table} customerData={customerData}/>
      </div>

      {/* ── Scrollable content ── */}
      <div className="home-scroll" style={{ overflowY:"auto", overflowX:"hidden",
        marginTop:"-60px", /* Pull content behind sticky header */
        paddingBottom: cart.length > 0 ? 160 : 96,
      }}>

        {loading ? <HomeSkeletons/> : (
          <>
            {/* ── 1. CINEMATIC HERO ── */}
            <CinematicHero
              items={allItems}
              cart={cart}
              onItemTap={onItemTap}
              onExplore={onExploreMenu}
              greeting={greeting}
              customerName={customerData?.name}
            />

            {/* ── 2. GLASSMORPHISM CATEGORY BAR ── */}
            <GlassCategoryBar
              categories={menu}
              active={activeCategoryId}
              onSelect={onCategorySelect}
            />

            <AmbientDivider/>

            {/* ── 3. SMART RECOMMENDATION — "Made For You" ── */}
            {bestsellers.length>0 && (
              <CinematicRow
                eyebrow="✦ Smart Pick"
                title={`Made For You${customerData?`, ${customerData.name.split(" ")[0]}`:""}`}
                items={bestsellers}
                cart={cart}
                onTap={onItemTap}
                favs={favs}
                onFav={onToggleFav}
                featured
              />
            )}

            {/* ── 4. PROMO ATMOSPHERE CARD ── */}
            <AtmospherePromo onTap={onExploreMenu}/>

            {/* ── 5. ACTIVE CATEGORY ITEMS ── */}
            {catItems.length>0 && (
              <CinematicRow
                eyebrow="✦ From The Menu"
                title={`${menu.find(c=>c._id===activeCategoryId)?.icon||""} ${menu.find(c=>c._id===activeCategoryId)?.name||""}`}
                items={catItems.filter(i=>i.isAvailable)}
                cart={cart}
                onTap={onItemTap}
                favs={favs}
                onFav={onToggleFav}
              />
            )}

            {/* ── 6. CONTINUE YOUR FAVORITES (compact) ── */}
            {allItems.filter(i=>i.isAvailable).length>0 && (
              <CompactCinematicRow
                eyebrow="✦ Quick Picks"
                title="Continue Your Favorites"
                items={allItems.filter(i=>i.isAvailable).slice(4,9)}
                cart={cart}
                onTap={onItemTap}
              />
            )}

            <AmbientDivider/>

            {/* ── 7. ALL CATEGORY ROWS ── */}
            {menu.slice(0,4).map(cat => (
              <CinematicRow
                key={cat._id}
                eyebrow={`✦ ${cat.name}`}
                title={`${cat.icon} ${cat.name}`}
                items={(cat.items as MenuItem[]).filter(i=>i.isAvailable).slice(0,8)}
                cart={cart}
                onTap={onItemTap}
                favs={favs}
                onFav={onToggleFav}
              />
            ))}

            {/* ── Bottom atmosphere ── */}
            <div style={{ textAlign:"center", padding:"20px 22px 12px" }}>
              <div style={{ display:"inline-flex", alignItems:"center", gap:6 }}>
                <div style={{width:32,height:1,background:`linear-gradient(to right,transparent,${D.glow35})`}}/>
                <span style={{fontSize:11,color:D.gold,fontFamily:"'DM Mono',monospace",letterSpacing:"0.12em"}}>
                  🌿 100% Pure Vegetarian
                </span>
                <div style={{width:32,height:1,background:`linear-gradient(to left,transparent,${D.glow35})`}}/>
              </div>
              <p style={{fontSize:10,color:D.inkGhost,margin:"6px 0 0",fontFamily:"'DM Sans',sans-serif"}}>
                Crafted with passion · Served with love
              </p>
            </div>
          </>
        )}
      </div>

      {/* ── Floating Cart ── */}
      <FloatingCartBar cart={cart} discount={0} onView={onViewCart}/>
    </div>
  );
}
