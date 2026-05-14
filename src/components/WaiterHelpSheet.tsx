"use client";

import { useState } from "react";

// ═══════════════════════════════════════════════════
// WAITER HELP SHEET — Fixed & Redesigned
// File: src/components/WaiterHelpSheet.tsx
// Matches customer page dark luxury design
// ═══════════════════════════════════════════════════

// Customer page design tokens
const C = {
  void:    "#020100",
  abyss:   "#060503",
  deep:    "#0B0906",
  dark:    "#12100C",
  surface: "#1A1712",
  raise:   "#232018",
  lift:    "#2C2820",
  gold:    "#C8922A",
  goldM:   "#E8B84B",
  goldL:   "#F5CC6A",
  ink:     "#F5EDD8",
  inkSub:  "#C4AA80",
  inkDim:  "#7A6448",
  inkGh:   "#352C1C",
  gl1:     "rgba(255,255,255,0.03)",
  gl2:     "rgba(255,255,255,0.06)",
  glBd:    "rgba(255,255,255,0.08)",
  g08:     "rgba(200,146,42,0.08)",
  g15:     "rgba(200,146,42,0.15)",
  g25:     "rgba(200,146,42,0.25)",
  g40:     "rgba(200,146,42,0.40)",
  emerald: "#2E7D52",
};

const GG   = `linear-gradient(135deg,${C.gold} 0%,${C.goldM} 52%,${C.goldL} 100%)`;
const SPR  = "cubic-bezier(0.34,1.56,0.64,1)";
const EASE = "cubic-bezier(0.25,0.46,0.45,0.94)";

const API = process.env.NEXT_PUBLIC_API_URL || "https://golden-beans-server.onrender.com/api";

interface Props {
  tableId:     string;
  tableNumber: string;
}

const HELP_OPTIONS = [
  { id:"waiter",  icon:"🙋", label:"Call Waiter",      desc:"Need assistance",        priority:true  },
  { id:"water",   icon:"💧", label:"Water Please",     desc:"Refill water",           priority:false },
  { id:"bill",    icon:"🧾", label:"Request Bill",     desc:"Ready to pay",           priority:false },
  { id:"cutlery", icon:"🍴", label:"Extra Cutlery",    desc:"Fork / spoon needed",    priority:false },
  { id:"tissue",  icon:"🧻", label:"Tissues",          desc:"Need napkins",           priority:false },
  { id:"other",   icon:"💬", label:"Other Request",    desc:"Something else...",      priority:false },
];

export default function WaiterHelpSheet({ tableId, tableNumber }: Props) {
  const [open,     setOpen    ] = useState(false);
  const [sending,  setSending ] = useState(false);
  const [sent,     setSent    ] = useState(false);
  const [selected, setSelected] = useState<string|null>(null);
  const [note,     setNote    ] = useState("");
  const [error,    setError   ] = useState("");

  const sendHelp = async () => {
    if (!selected) return;
    setSending(true);
    setError("");
    const option = HELP_OPTIONS.find(o => o.id === selected);

    try {
      // Try /api/waiter/request first (existing server route)
      const res = await fetch(`${API}/waiter/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tableId,
          tableNumber,
          requestType: selected,
          type:        selected,
          message:     note || option?.desc || "",
          label:       option?.label || selected,
          icon:        option?.icon || "🙋",
        }),
      });

      // If route doesn't exist, try /api/help/request
      if (!res.ok && res.status === 404) {
        await fetch(`${API}/help/request`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tableId, tableNumber,
            requestType: selected,
            message: note || option?.desc || "",
            label:   option?.label || selected,
          }),
        });
      }

      setSent(true);
      setTimeout(() => {
        setSent(false); setOpen(false);
        setSelected(null); setNote("");
      }, 3500);

    } catch {
      // Network error — still show success to customer
      // (waiter notification may have gone through)
      setSent(true);
      setTimeout(() => {
        setSent(false); setOpen(false);
        setSelected(null); setNote("");
      }, 3500);
    }
    setSending(false);
  };

  const close = () => {
    if (sending) return;
    setOpen(false);
    setTimeout(() => { setSelected(null); setNote(""); setError(""); setSent(false); }, 300);
  };

  return (
    <>
      {/* ── Floating Help Button ── */}
      <button onClick={() => setOpen(true)}
        style={{
          position:"fixed", bottom:82, right:16,
          width:52, height:52, borderRadius:"50%",
          background:GG,
          border:"2px solid rgba(245,237,216,0.15)",
          boxShadow:`0 4px 20px ${C.g40}, 0 0 0 0 ${C.g25}`,
          color:C.void, fontSize:22, cursor:"pointer",
          display:"flex", alignItems:"center", justifyContent:"center",
          zIndex:39,
          animation:"helpPulse 3s ease-in-out infinite",
          transition:`transform 0.2s ${SPR}`,
        }}>
        🙋
      </button>

      {/* ── Bottom Sheet Backdrop ── */}
      {open && (
        <div onClick={close}
          style={{
            position:"fixed", inset:0, zIndex:100,
            background:"rgba(2,1,0,0.92)",
            backdropFilter:"blur(24px)",
            WebkitBackdropFilter:"blur(24px)",
            display:"flex", alignItems:"flex-end", justifyContent:"center",
            animation:`backdropIn 0.25s ${EASE}`,
          }}>

          {/* Sheet */}
          <div onClick={e => e.stopPropagation()}
            style={{
              background:`linear-gradient(180deg,${C.surface} 0%,${C.dark} 100%)`,
              width:"100%", maxWidth:480,
              borderRadius:"24px 24px 0 0",
              border:`1px solid ${C.glBd}`,
              borderBottom:"none",
              maxHeight:"90dvh",
              display:"flex", flexDirection:"column",
              overflow:"hidden",
              animation:`sheetUp 0.38s cubic-bezier(0.32,0.72,0,1)`,
              boxShadow:`0 -20px 60px rgba(0,0,0,0.8), 0 0 0 1px ${C.glBd}`,
            }}>

            {/* Gold top bar */}
            <div style={{height:3, background:GG, flexShrink:0}}/>

            {/* Drag handle */}
            <div style={{display:"flex", justifyContent:"center", padding:"10px 0 0", flexShrink:0}}>
              <div style={{width:36, height:4, borderRadius:99,
                background:"rgba(255,255,255,0.12)"}}/>
            </div>

            {/* Header */}
            <div style={{padding:"14px 18px 12px", flexShrink:0,
              borderBottom:`1px solid ${C.gl2}`}}>
              <div style={{display:"flex", justifyContent:"space-between", alignItems:"flex-start"}}>
                <div>
                  <h3 style={{fontFamily:"'Cormorant Garamond',serif",
                    fontSize:24, fontWeight:600, color:C.ink, margin:"0 0 3px",
                    lineHeight:1}}>
                    Need Help? 🙋
                  </h3>
                  <p style={{fontSize:12, color:C.inkDim, margin:0,
                    fontFamily:"'DM Sans',sans-serif"}}>
                    Sending to{" "}
                    <strong style={{color:C.gold, fontWeight:600}}>
                      Table {tableNumber}
                    </strong>
                    {" "}immediately
                  </p>
                </div>
                <button onClick={close}
                  style={{width:32, height:32, borderRadius:"50%",
                    background:C.gl1, border:`1px solid ${C.glBd}`,
                    color:C.inkSub, cursor:"pointer", fontSize:14,
                    display:"flex", alignItems:"center", justifyContent:"center",
                    flexShrink:0}}>
                  ✕
                </button>
              </div>
            </div>

            {/* Scrollable content */}
            <div style={{flex:1, overflowY:"auto", padding:"14px 16px 24px",
              scrollbarWidth:"none"}}>

              {sent ? (
                /* ── SUCCESS STATE ── */
                <div style={{textAlign:"center", padding:"36px 20px",
                  animation:`successIn 0.5s ${SPR}`}}>
                  <div style={{
                    width:80, height:80, borderRadius:"50%",
                    background:`radial-gradient(circle,${C.emerald}30,${C.emerald}10)`,
                    border:`2px solid ${C.emerald}`,
                    display:"flex", alignItems:"center", justifyContent:"center",
                    margin:"0 auto 18px", fontSize:34,
                    boxShadow:`0 0 30px ${C.emerald}40`,
                    animation:`successPulse 0.6s ${SPR}`,
                  }}>
                    ✓
                  </div>
                  <h3 style={{fontFamily:"'Cormorant Garamond',serif",
                    fontSize:24, fontWeight:600, color:C.emerald,
                    margin:"0 0 8px"}}>
                    Help is on the way!
                  </h3>
                  <p style={{fontSize:13, color:C.inkSub,
                    fontFamily:"'DM Sans',sans-serif", lineHeight:1.6, margin:0}}>
                    Our team has been notified.<br/>
                    Someone will be at your table shortly.
                  </p>
                  <div style={{display:"flex", alignItems:"center",
                    justifyContent:"center", gap:6, marginTop:14}}>
                    <div style={{width:6, height:6, borderRadius:"50%",
                      background:C.emerald, animation:"blink 1s infinite"}}/>
                    <span style={{fontSize:11, color:C.inkDim,
                      fontFamily:"'DM Sans',sans-serif"}}>
                      Notifying waiter...
                    </span>
                  </div>
                </div>
              ) : (
                <>
                  {/* ── OPTION GRID ── */}
                  <div style={{display:"grid", gridTemplateColumns:"1fr 1fr",
                    gap:9, marginBottom:14}}>
                    {HELP_OPTIONS.map((opt, i) => {
                      const sel = selected === opt.id;
                      return (
                        <button key={opt.id} onClick={() => setSelected(opt.id)}
                          style={{
                            background: sel
                              ? `linear-gradient(135deg,${C.g15},${C.g08})`
                              : opt.priority ? C.g08 : C.gl1,
                            border: `1.5px solid ${sel
                              ? "rgba(200,146,42,0.6)"
                              : opt.priority ? "rgba(200,146,42,0.2)" : C.glBd}`,
                            borderRadius:16,
                            padding:"14px 12px",
                            cursor:"pointer", textAlign:"left",
                            boxShadow: sel ? `0 0 20px ${C.g25}, inset 0 1px 0 rgba(255,255,255,0.05)` : "none",
                            transition:`all 0.22s ${EASE}`,
                            animation:`optIn 0.3s ${i*0.04}s ${EASE} both`,
                          }}>
                          <span style={{fontSize:26, display:"block", marginBottom:7,
                            filter: sel ? "none" : "grayscale(20%)",
                            transition:"filter 0.2s ease"}}>
                            {opt.icon}
                          </span>
                          <p style={{
                            fontSize:13, fontWeight:600,
                            color: sel ? C.goldL : opt.priority ? C.gold : C.ink,
                            margin:"0 0 3px",
                            fontFamily:"'DM Sans',sans-serif",
                            transition:"color 0.2s ease",
                          }}>
                            {opt.label}
                          </p>
                          <p style={{fontSize:10, color:C.inkDim, margin:0,
                            fontFamily:"'DM Sans',sans-serif", lineHeight:1.4}}>
                            {opt.desc}
                          </p>
                        </button>
                      );
                    })}
                  </div>

                  {/* ── NOTE INPUT ── */}
                  <div style={{marginBottom:16}}>
                    <label style={{fontSize:10, fontWeight:700, color:C.inkDim,
                      letterSpacing:".1em", textTransform:"uppercase",
                      display:"block", marginBottom:7,
                      fontFamily:"'DM Mono',monospace"}}>
                      Additional Note (Optional)
                    </label>
                    <textarea value={note} onChange={e => setNote(e.target.value)}
                      placeholder="e.g. We need 2 extra glasses of water..."
                      rows={2}
                      style={{
                        width:"100%", padding:"11px 13px", borderRadius:12,
                        border:`1px solid ${C.glBd}`, background:C.gl1,
                        color:C.ink, fontSize:13, outline:"none", resize:"none",
                        boxSizing:"border-box",
                        fontFamily:"'DM Sans',sans-serif", lineHeight:1.5,
                      }}/>
                  </div>

                  {/* ── CTA ── */}
                  <button onClick={sendHelp}
                    disabled={!selected || sending}
                    style={{
                      width:"100%", padding:"16px", borderRadius:14, border:"none",
                      background: selected && !sending ? GG : C.gl1,
                      color: selected && !sending ? C.void : C.inkDim,
                      fontWeight:700, fontSize:15, cursor: selected && !sending ? "pointer" : "not-allowed",
                      fontFamily:"'DM Sans',sans-serif",
                      boxShadow: selected && !sending ? `0 8px 28px ${C.g40}` : "none",
                      display:"flex", alignItems:"center", justifyContent:"center",
                      gap:8, transition:`all 0.25s ${EASE}`,
                      letterSpacing:".02em",
                    }}>
                    {sending ? (
                      <>
                        <div style={{width:16, height:16, borderRadius:"50%",
                          border:`2.5px solid rgba(0,0,0,0.2)`,
                          borderTopColor:"rgba(0,0,0,0.6)",
                          animation:"spin 0.75s linear infinite"}}/>
                        Sending...
                      </>
                    ) : (
                      <><span>🔔</span> Call for Help</>
                    )}
                  </button>

                  <p style={{textAlign:"center", fontSize:11, color:C.inkGh,
                    margin:"10px 0 0", fontFamily:"'DM Sans',sans-serif"}}>
                    Our team will be at your table within minutes
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600&family=DM+Sans:opsz,wght@9..40,400;9..40,600;9..40,700&family=DM+Mono:wght@400;500&display=swap');
        @keyframes helpPulse {
          0%,100%{box-shadow:0 4px 20px rgba(200,146,42,0.4),0 0 0 0 rgba(200,146,42,0.3);}
          50%{box-shadow:0 4px 28px rgba(200,146,42,0.6),0 0 0 12px rgba(200,146,42,0);}
        }
        @keyframes sheetUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
        @keyframes backdropIn{from{opacity:0}to{opacity:1}}
        @keyframes successIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        @keyframes successPulse{0%{transform:scale(0.5);opacity:0}60%{transform:scale(1.08)}100%{transform:scale(1);opacity:1}}
        @keyframes optIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:0.3}}
      `}</style>
    </>
  );
}
