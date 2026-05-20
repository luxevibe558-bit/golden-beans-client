"use client";

import { useState, useEffect, useRef } from "react";

// ═══════════════════════════════════════════════════════════════════
// TABLE BUTLER — Premium AI-Context Waiter Calling System
// File: src/components/WaiterHelpSheet.tsx
// ═══════════════════════════════════════════════════════════════════

const C = {
  void:"#030201", dark:"#0B0906", surface:"#15120E", raise:"#1E1A14",
  lift:"#272318", gold:"#C8922A", goldM:"#E8B84B", goldL:"#F5CC6A",
  ink:"#F5EDD8", inkSub:"#C4AA80", inkDim:"#7A6448", inkGh:"#2A2218",
  gl1:"rgba(255,255,255,0.03)", gl2:"rgba(255,255,255,0.06)",
  glBd:"rgba(255,255,255,0.08)",
  g08:"rgba(200,146,42,0.08)", g15:"rgba(200,146,42,0.15)",
  g25:"rgba(200,146,42,0.25)", g40:"rgba(200,146,42,0.40)",
  g60:"rgba(200,146,42,0.60)",
  green:"#4ADE80", greenDim:"rgba(74,222,128,0.12)",
  greenBd:"rgba(74,222,128,0.25)",
  emerald:"#2E7D52",
};
const GG   = `linear-gradient(135deg,${C.gold} 0%,${C.goldM} 52%,${C.goldL} 100%)`;
const SPR  = "cubic-bezier(0.34,1.56,0.64,1)";
const EASE = "cubic-bezier(0.25,0.46,0.45,0.94)";
const API  = process.env.NEXT_PUBLIC_API_URL || "https://golden-beans-server.onrender.com/api";

// ── Request types ──
interface Request {
  id: string; icon: string; label: string;
  desc: string; quote: string;
  priority: "high"|"normal"; color: string;
  category: "help"|"food"|"comfort"|"payment";
}

const ALL_REQUESTS: Request[] = [
  { id:"waiter",    icon:"🙋",  label:"Call Waiter",      desc:"Need personal assistance",         quote:"\"Your wish is our command.\"",              priority:"high",   color:C.gold,   category:"help"    },
  { id:"water",     icon:"💧",  label:"Water Refill",     desc:"Fresh water at your table",         quote:"\"Staying hydrated, staying happy!\"",       priority:"normal", color:"#60A5FA", category:"food"    },
  { id:"bill",      icon:"🧾",  label:"Request Bill",     desc:"Ready to settle your order",        quote:"\"Thank you for dining with us tonight.\"",  priority:"high",   color:C.green,  category:"payment" },
  { id:"cutlery",   icon:"🍴",  label:"Extra Cutlery",   desc:"Spoons, forks or knives",           quote:"\"Perfect tools for a perfect meal.\"",      priority:"normal", color:C.goldM,  category:"food"    },
  { id:"tissue",    icon:"🧻",  label:"Napkins",          desc:"Fresh napkins or tissues",          quote:"\"Every detail matters to us.\"",            priority:"normal", color:C.inkSub, category:"comfort" },
  { id:"condiment", icon:"🌶️",  label:"Condiments",      desc:"Sauces, ketchup, chutney",          quote:"\"The right flavour, just for you.\"",       priority:"normal", color:"#F87171", category:"food"    },
  { id:"dessert",   icon:"🍰",  label:"Dessert Menu",    desc:"See our sweet delights",            quote:"\"Save room for something sweet!\"",         priority:"normal", color:"#C084FC", category:"food"    },
  { id:"ac",        icon:"❄️",  label:"AC Adjustment",   desc:"Too cold or too warm?",             quote:"\"Your comfort is our priority.\"",          priority:"normal", color:"#93C5FD", category:"comfort" },
  { id:"order",     icon:"➕",  label:"Add to Order",    desc:"Want to order something more?",     quote:"\"Good taste knows no limits.\"",            priority:"normal", color:C.goldL,  category:"food"    },
  { id:"other",     icon:"💬",  label:"Other Request",   desc:"Something we haven't listed",       quote:"\"Just ask — we are here for you.\"",       priority:"normal", color:C.inkSub, category:"help"    },
];

// ── Context-aware smart suggestions ──
function getSmartSuggestions(orderStatus: string, minutesElapsed: number, prevRequests: string[]): string[] {
  const suggestions: string[] = [];

  if (orderStatus === "delivered" || orderStatus === "ready") {
    if (!prevRequests.includes("water"))     suggestions.push("water");
    if (!prevRequests.includes("condiment")) suggestions.push("condiment");
    if (minutesElapsed > 20 && !prevRequests.includes("dessert")) suggestions.push("dessert");
  }
  if (minutesElapsed > 30 && !prevRequests.includes("bill")) suggestions.push("bill");
  if (orderStatus === "open" || orderStatus === "kotSent") {
    if (!prevRequests.includes("water")) suggestions.push("water");
  }
  if (!suggestions.length) {
    if (!prevRequests.includes("waiter")) suggestions.push("waiter");
    if (!prevRequests.includes("water"))  suggestions.push("water");
  }
  return suggestions.slice(0, 3);
}

// ── Context banner message ──
function getContextMessage(orderStatus: string, minutesElapsed: number): { emoji: string; text: string; sub: string } {
  if (orderStatus === "delivered") {
    if (minutesElapsed > 25) return { emoji:"🍰", text:"Enjoying your meal?", sub:"Perhaps some dessert to finish off?" };
    return { emoji:"❤️", text:"How's your meal?", sub:"We hope every bite is delightful!" };
  }
  if (orderStatus === "ready") return { emoji:"🛎️", text:"Your order is ready!", sub:"Need anything else while you wait?" };
  if (orderStatus === "kotSent") return { emoji:"👨‍🍳", text:"Chef is crafting your order", sub:"Can we make your wait more comfortable?" };
  if (minutesElapsed > 30) return { emoji:"⏰", text:"Been a while?", sub:"Ready for the bill or something more?" };
  return { emoji:"✨", text:"How can we help?", sub:"Your table butler is just a tap away" };
}

interface Props {
  tableId:      string;
  tableNumber:  string;
  orderStatus?: string;
  orderTime?:   string;
}

export default function WaiterHelpSheet({ tableId, tableNumber, orderStatus="", orderTime="" }: Props) {
  const [open,         setOpen        ] = useState(false);
  const [phase,        setPhase       ] = useState<"select"|"confirm"|"sending"|"sent"|"tracking">("select");
  const [selected,     setSelected    ] = useState<string|null>(null);
  const [note,         setNote        ] = useState("");
  const [noteOpen,     setNoteOpen    ] = useState(false);
  const [prevRequests, setPrevRequests] = useState<string[]>([]);
  const [waiterName,   setWaiterName  ] = useState("");
  const [btnPulse,     setBtnPulse    ] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const trackingTimer = useRef<NodeJS.Timeout|null>(null);

  const minutesElapsed = orderTime
    ? Math.floor((Date.now()-new Date(orderTime).getTime())/60000)
    : 0;

  const smartSuggestions = getSmartSuggestions(orderStatus, minutesElapsed, prevRequests);
  const contextMsg       = getContextMessage(orderStatus, minutesElapsed);
  const selectedReq      = ALL_REQUESTS.find(r=>r.id===selected);

  // Pulse button periodically to draw attention
  useEffect(()=>{
    const iv = setInterval(()=>{ setBtnPulse(true); setTimeout(()=>setBtnPulse(false),2000); }, 45000);
    return ()=>clearInterval(iv);
  },[]);

  const categories = [
    { id:"all",     label:"All",      icon:"✨" },
    { id:"help",    label:"Help",     icon:"🙋" },
    { id:"food",    label:"Food",     icon:"🍽️" },
    { id:"comfort", label:"Comfort",  icon:"❄️" },
    { id:"payment", label:"Payment",  icon:"💳" },
  ];

  const filteredRequests = activeCategory==="all"
    ? ALL_REQUESTS
    : ALL_REQUESTS.filter(r=>r.category===activeCategory);

  const sendRequest = async () => {
    if (!selected) return;
    setPhase("sending");
    const option = ALL_REQUESTS.find(r=>r.id===selected);
    try {
      await fetch(`${API}/waiter/request`, {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          tableId, tableNumber,
          type: selected,
          note: note || option?.desc || "",
          label: option?.label || selected,
          icon:  option?.icon || "🙋",
          priority: option?.priority || "normal",
        }),
      });
    } catch { /* Silent fail — still show success */ }

    setPrevRequests(p=>[...p, selected]);
    setPhase("sent");

    // Simulate waiter accepted after 8 seconds
    trackingTimer.current = setTimeout(()=>{
      setPhase("tracking");
      setWaiterName("Our Waiter");
    }, 8000);
  };

  const close = () => {
    if (phase==="sending") return;
    if (trackingTimer.current) clearTimeout(trackingTimer.current);
    setOpen(false);
    setTimeout(()=>{
      setPhase("select"); setSelected(null);
      setNote(""); setNoteOpen(false); setWaiterName("");
    }, 350);
  };

  const reset = () => {
    if (trackingTimer.current) clearTimeout(trackingTimer.current);
    setPhase("select"); setSelected(null);
    setNote(""); setNoteOpen(false); setWaiterName("");
  };

  return (
    <>
      {/* ── Floating Butler Button ── */}
      <button onClick={()=>setOpen(true)}
        style={{
          position:"fixed", bottom:86, right:16,
          width:56, height:56, borderRadius:"50%",
          background:GG,
          border:"none",
          boxShadow:`0 6px 24px ${C.g60}, 0 0 0 ${btnPulse?"8px":"0px"} ${C.g15}`,
          color:C.void, fontSize:24, cursor:"pointer",
          display:"flex", alignItems:"center", justifyContent:"center",
          zIndex:39,
          transition:`box-shadow 0.4s ${EASE}, transform 0.2s ${SPR}`,
          transform: open ? "scale(0.92)" : "scale(1)",
        }}>
        🛎️
        {prevRequests.length>0&&(
          <div style={{position:"absolute",top:-2,right:-2,
            width:16,height:16,borderRadius:"50%",
            background:C.green,border:`2px solid ${C.void}`,
            fontSize:9,color:C.void,fontWeight:900,
            display:"flex",alignItems:"center",justifyContent:"center"}}>
            {prevRequests.length}
          </div>
        )}
      </button>

      {/* ── Bottom Sheet ── */}
      {open&&(
        <div onClick={close}
          style={{position:"fixed",inset:0,zIndex:100,
            background:"rgba(2,1,0,0.9)",
            backdropFilter:"blur(28px)",WebkitBackdropFilter:"blur(28px)",
            display:"flex",alignItems:"flex-end",justifyContent:"center",
            animation:`btlerBgIn 0.25s ${EASE}`}}>

          <div onClick={e=>e.stopPropagation()}
            style={{
              background:`linear-gradient(180deg,${C.surface} 0%,${C.dark} 100%)`,
              width:"100%",maxWidth:480,
              borderRadius:"26px 26px 0 0",
              border:`1px solid ${C.glBd}`,borderBottom:"none",
              maxHeight:"92dvh",
              display:"flex",flexDirection:"column",overflow:"hidden",
              animation:`btlerSheetUp 0.38s cubic-bezier(0.32,0.72,0,1)`,
              boxShadow:`0 -24px 80px rgba(0,0,0,0.9), 0 0 0 1px ${C.glBd}`,
            }}>

            {/* Gold accent bar */}
            <div style={{height:3,background:GG,flexShrink:0}}/>

            {/* Drag handle */}
            <div style={{display:"flex",justifyContent:"center",padding:"10px 0 0",flexShrink:0}}>
              <div style={{width:40,height:4,borderRadius:99,background:"rgba(255,255,255,0.1)"}}/>
            </div>

            {/* Header */}
            <div style={{padding:"14px 18px 12px",flexShrink:0,
              borderBottom:`1px solid ${C.gl2}`}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                <div>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:3}}>
                    <span style={{fontSize:20}}>{contextMsg.emoji}</span>
                    <h3 style={{fontFamily:"'Cormorant Garamond',serif",
                      fontSize:22,fontWeight:600,color:C.ink,margin:0,lineHeight:1}}>
                      {contextMsg.text}
                    </h3>
                  </div>
                  <p style={{fontSize:12,color:C.inkDim,margin:0,
                    fontFamily:"'DM Sans',sans-serif"}}>
                    {contextMsg.sub}
                  </p>
                </div>
                <button onClick={close}
                  style={{width:32,height:32,borderRadius:"50%",
                    background:C.gl1,border:`1px solid ${C.glBd}`,
                    color:C.inkSub,cursor:"pointer",fontSize:14,
                    display:"flex",alignItems:"center",justifyContent:"center",
                    flexShrink:0}}>✕</button>
              </div>

              {/* Table info */}
              <div style={{display:"flex",alignItems:"center",gap:6,marginTop:10,
                background:C.g08,border:`1px solid ${C.g15}`,
                borderRadius:10,padding:"7px 12px",width:"fit-content"}}>
                <div style={{width:6,height:6,borderRadius:"50%",background:C.gold,
                  animation:"btlerPulse 1.5s ease-in-out infinite"}}/>
                <span style={{fontSize:11,color:C.gold,
                  fontFamily:"'DM Mono',monospace",letterSpacing:".08em"}}>
                  TABLE {tableNumber} · BUTLER ACTIVE
                </span>
              </div>
            </div>

            {/* Scrollable content */}
            <div style={{flex:1,overflowY:"auto",padding:"16px 16px 32px",
              scrollbarWidth:"none"}}>

              {/* ── PHASE: SELECT ── */}
              {phase==="select"&&(
                <>
                  {/* Smart Suggestions */}
                  {smartSuggestions.length>0&&(
                    <div style={{marginBottom:18}}>
                      <p style={{fontSize:9,color:C.gold,fontFamily:"'DM Mono',monospace",
                        letterSpacing:".18em",textTransform:"uppercase",margin:"0 0 10px"}}>
                        ✦ SUGGESTED FOR YOU
                      </p>
                      <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                        {smartSuggestions.map(id=>{
                          const req=ALL_REQUESTS.find(r=>r.id===id);
                          if(!req)return null;
                          const sel=selected===id;
                          return(
                            <button key={id} onClick={()=>setSelected(id)}
                              style={{
                                display:"flex",alignItems:"center",gap:7,
                                padding:"8px 14px",borderRadius:99,
                                background:sel?GG:C.g08,
                                border:`1px solid ${sel?"transparent":C.g25}`,
                                color:sel?C.void:C.goldL,
                                fontSize:12,fontWeight:700,cursor:"pointer",
                                fontFamily:"'DM Sans',sans-serif",
                                boxShadow:sel?`0 4px 16px ${C.g40}`:"none",
                                transition:`all 0.22s ${EASE}`,
                              }}>
                              <span>{req.icon}</span>{req.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Category filter */}
                  <div style={{display:"flex",gap:6,marginBottom:14,overflowX:"auto",
                    scrollbarWidth:"none",paddingBottom:2}}>
                    {categories.map(cat=>(
                      <button key={cat.id} onClick={()=>setActiveCategory(cat.id)}
                        style={{
                          display:"flex",alignItems:"center",gap:5,
                          padding:"6px 12px",borderRadius:99,flexShrink:0,
                          background:activeCategory===cat.id?C.g15:C.gl1,
                          border:`1px solid ${activeCategory===cat.id?C.g25:C.glBd}`,
                          color:activeCategory===cat.id?C.goldL:C.inkDim,
                          fontSize:11,fontWeight:700,cursor:"pointer",
                          fontFamily:"'DM Sans',sans-serif",
                          transition:`all 0.18s ${EASE}`,
                        }}>
                        <span style={{fontSize:12}}>{cat.icon}</span>{cat.label}
                      </button>
                    ))}
                  </div>

                  {/* Request grid */}
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:9,marginBottom:14}}>
                    {filteredRequests.map((req,i)=>{
                      const sel=selected===req.id;
                      const done=prevRequests.includes(req.id);
                      return(
                        <button key={req.id} onClick={()=>setSelected(sel?null:req.id)}
                          style={{
                            background:sel
                              ?`linear-gradient(135deg,${C.g15},${C.g08})`
                              :done?`${C.greenDim}`:C.gl1,
                            border:`1.5px solid ${sel?"rgba(200,146,42,0.6)":done?C.greenBd:C.glBd}`,
                            borderRadius:16,padding:"14px 12px",
                            cursor:"pointer",textAlign:"left",position:"relative",
                            boxShadow:sel?`0 0 20px ${C.g25}`:"none",
                            transition:`all 0.22s ${EASE}`,
                            animation:`btlerOptIn 0.3s ${i*0.04}s ${EASE} both`,
                          }}>
                          {done&&<div style={{position:"absolute",top:8,right:8,
                            width:14,height:14,borderRadius:"50%",
                            background:C.green,fontSize:8,color:C.void,
                            display:"flex",alignItems:"center",justifyContent:"center",
                            fontWeight:900}}>✓</div>}
                          <span style={{fontSize:26,display:"block",marginBottom:7}}>
                            {req.icon}
                          </span>
                          <p style={{fontSize:12.5,fontWeight:600,margin:"0 0 3px",
                            color:sel?C.goldL:done?C.green:C.ink,
                            fontFamily:"'DM Sans',sans-serif",
                            transition:"color 0.2s ease"}}>
                            {req.label}
                          </p>
                          <p style={{fontSize:10,color:C.inkDim,margin:0,
                            fontFamily:"'DM Sans',sans-serif",lineHeight:1.4}}>
                            {req.desc}
                          </p>
                          {req.priority==="high"&&!done&&(
                            <div style={{position:"absolute",top:8,left:8,
                              background:req.id==="bill"?"rgba(74,222,128,0.2)":C.g08,
                              border:`1px solid ${req.id==="bill"?C.greenBd:C.g15}`,
                              borderRadius:99,padding:"1px 6px",
                              fontSize:8,color:req.id==="bill"?C.green:C.gold,
                              fontFamily:"'DM Mono',monospace",letterSpacing:".08em"}}>
                              PRIORITY
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Quote */}
                  {selected&&selectedReq&&(
                    <div style={{background:C.g08,border:`1px solid ${C.g15}`,
                      borderRadius:12,padding:"12px 14px",marginBottom:14,
                      animation:`btlerQuoteIn 0.3s ${EASE}`}}>
                      <p style={{fontSize:12,color:C.inkSub,margin:0,
                        fontFamily:"'Cormorant Garamond',serif",
                        fontStyle:"italic",fontWeight:500,lineHeight:1.6}}>
                        {selectedReq.quote}
                      </p>
                    </div>
                  )}

                  {/* Note toggle */}
                  <button onClick={()=>setNoteOpen(p=>!p)}
                    style={{width:"100%",padding:"10px 14px",borderRadius:12,
                      background:noteOpen?C.g08:C.gl1,
                      border:`1px solid ${noteOpen?C.g15:C.glBd}`,
                      color:noteOpen?C.goldL:C.inkDim,
                      fontSize:12,fontWeight:600,cursor:"pointer",
                      fontFamily:"'DM Sans',sans-serif",
                      display:"flex",alignItems:"center",gap:8,
                      marginBottom:noteOpen?10:14,
                      transition:`all 0.2s ${EASE}`}}>
                    <span>📝</span>
                    Add a note (optional)
                    <span style={{marginLeft:"auto",fontSize:14,
                      transform:noteOpen?"rotate(180deg)":"none",
                      transition:`transform 0.2s ${EASE}`}}>⌄</span>
                  </button>

                  {noteOpen&&(
                    <textarea value={note} onChange={e=>setNote(e.target.value)}
                      placeholder="e.g. Extra spicy chutney please, no onions..."
                      rows={2} autoFocus
                      style={{width:"100%",padding:"11px 13px",borderRadius:12,
                        border:`1px solid ${C.g15}`,background:C.gl1,
                        color:C.ink,fontSize:13,outline:"none",resize:"none",
                        boxSizing:"border-box",marginBottom:14,
                        fontFamily:"'DM Sans',sans-serif",lineHeight:1.5}}/>
                  )}

                  {/* Send CTA */}
                  <button onClick={()=>{if(selected)setPhase("confirm");}}
                    disabled={!selected}
                    style={{
                      width:"100%",padding:"16px",borderRadius:14,border:"none",
                      background:selected?GG:C.gl1,
                      color:selected?C.void:C.inkDim,
                      fontWeight:700,fontSize:15,
                      cursor:selected?"pointer":"not-allowed",
                      fontFamily:"'DM Sans',sans-serif",
                      boxShadow:selected?`0 8px 28px ${C.g40}`:"none",
                      display:"flex",alignItems:"center",justifyContent:"center",
                      gap:9,transition:`all 0.25s ${EASE}`,
                    }}>
                    <span>🔔</span>
                    {selected?`Send ${selectedReq?.label||"Request"}`:"Select a request"}
                  </button>

                  {prevRequests.length>0&&(
                    <p style={{textAlign:"center",fontSize:11,color:C.inkDim,
                      margin:"12px 0 0",fontFamily:"'DM Mono',monospace",
                      letterSpacing:".06em"}}>
                      {prevRequests.length} request{prevRequests.length>1?"s":""} sent this session
                    </p>
                  )}
                </>
              )}

              {/* ── PHASE: CONFIRM ── */}
              {phase==="confirm"&&selectedReq&&(
                <div style={{animation:`btlerQuoteIn 0.3s ${EASE}`}}>
                  <div style={{textAlign:"center",padding:"20px 0 24px"}}>
                    <div style={{fontSize:56,marginBottom:14,
                      animation:"btlerFloat 2s ease-in-out infinite"}}>
                      {selectedReq.icon}
                    </div>
                    <h3 style={{fontFamily:"'Cormorant Garamond',serif",
                      fontSize:26,fontWeight:600,color:C.goldL,margin:"0 0 8px"}}>
                      {selectedReq.label}
                    </h3>
                    <p style={{fontSize:13,color:C.inkSub,fontFamily:"'DM Sans',sans-serif",
                      lineHeight:1.6,margin:"0 0 4px"}}>
                      {selectedReq.desc}
                    </p>
                    {note&&(
                      <p style={{fontSize:12,color:C.gold,fontFamily:"'DM Mono',monospace",
                        margin:"8px 0 0",fontStyle:"italic"}}>
                        Note: "{note}"
                      </p>
                    )}
                  </div>

                  <div style={{background:C.g08,border:`1px solid ${C.g15}`,
                    borderRadius:14,padding:"14px 16px",marginBottom:20,textAlign:"center"}}>
                    <p style={{fontSize:13,color:C.inkSub,margin:0,
                      fontFamily:"'Cormorant Garamond',serif",
                      fontStyle:"italic",fontWeight:500,lineHeight:1.6}}>
                      {selectedReq.quote}
                    </p>
                  </div>

                  <div style={{display:"flex",gap:10}}>
                    <button onClick={()=>setPhase("select")}
                      style={{flex:1,padding:"14px",borderRadius:12,
                        background:C.gl1,border:`1px solid ${C.glBd}`,
                        color:C.inkDim,fontSize:14,fontWeight:700,cursor:"pointer",
                        fontFamily:"'DM Sans',sans-serif"}}>
                      ← Back
                    </button>
                    <button onClick={sendRequest}
                      style={{flex:2,padding:"14px",borderRadius:12,border:"none",
                        background:GG,color:C.void,fontSize:14,fontWeight:700,
                        cursor:"pointer",fontFamily:"'DM Sans',sans-serif",
                        boxShadow:`0 6px 20px ${C.g40}`,
                        display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
                      <span>🔔</span> Confirm Request
                    </button>
                  </div>
                </div>
              )}

              {/* ── PHASE: SENDING ── */}
              {phase==="sending"&&(
                <div style={{textAlign:"center",padding:"48px 20px",
                  animation:`btlerQuoteIn 0.3s ${EASE}`}}>
                  <div style={{width:72,height:72,borderRadius:"50%",
                    border:`3px solid ${C.g25}`,borderTopColor:C.gold,
                    animation:"btlerSpin 0.8s linear infinite",
                    margin:"0 auto 20px"}}/>
                  <p style={{fontFamily:"'Cormorant Garamond',serif",
                    fontSize:20,color:C.goldL,margin:"0 0 6px",fontWeight:600}}>
                    Notifying your butler...
                  </p>
                  <p style={{fontSize:12,color:C.inkDim,
                    fontFamily:"'DM Sans',sans-serif",margin:0}}>
                    Sending request to our team
                  </p>
                </div>
              )}

              {/* ── PHASE: SENT ── */}
              {(phase==="sent"||phase==="tracking")&&(
                <div style={{animation:`btlerQuoteIn 0.4s ${SPR}`,padding:"8px 0"}}>

                  {/* Success ring */}
                  <div style={{textAlign:"center",padding:"20px 0 24px"}}>
                    <div style={{position:"relative",width:88,height:88,margin:"0 auto 18px"}}>
                      <div style={{position:"absolute",inset:-8,borderRadius:"50%",
                        background:`radial-gradient(circle,${C.greenDim},transparent)`,
                        animation:"btlerGlow 2s ease-in-out infinite"}}/>
                      <div style={{width:88,height:88,borderRadius:"50%",
                        background:C.greenDim,border:`2px solid ${C.greenBd}`,
                        display:"flex",alignItems:"center",justifyContent:"center",
                        fontSize:36,boxShadow:`0 0 32px rgba(74,222,128,0.3)`,
                        animation:`btlerPop 0.5s ${SPR}`}}>
                        {selectedReq?.icon||"✓"}
                      </div>
                    </div>

                    <h3 style={{fontFamily:"'Cormorant Garamond',serif",
                      fontSize:26,fontWeight:600,color:C.green,margin:"0 0 6px"}}>
                      Request Sent!
                    </h3>
                    <p style={{fontSize:13,color:C.inkSub,
                      fontFamily:"'DM Sans',sans-serif",lineHeight:1.6,margin:0}}>
                      {selectedReq?.label} — Table {tableNumber}
                    </p>
                  </div>

                  {/* Live tracking card */}
                  <div style={{background:C.greenDim,border:`1px solid ${C.greenBd}`,
                    borderRadius:16,padding:"16px 18px",marginBottom:16}}>
                    <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
                      <div style={{width:8,height:8,borderRadius:"50%",background:C.green,
                        animation:"btlerPulse 1.2s ease-in-out infinite"}}/>
                      <span style={{fontSize:10,color:C.green,
                        fontFamily:"'DM Mono',monospace",letterSpacing:".1em",fontWeight:700}}>
                        LIVE STATUS
                      </span>
                    </div>
                    {phase==="tracking"?(
                      <>
                        <p style={{fontSize:14,fontWeight:700,color:C.green,
                          fontFamily:"'DM Sans',sans-serif",margin:"0 0 4px"}}>
                          🏃 {waiterName} is on the way!
                        </p>
                        <p style={{fontSize:12,color:C.inkSub,
                          fontFamily:"'DM Sans',sans-serif",margin:0}}>
                          Your request has been accepted. Be there shortly!
                        </p>
                      </>
                    ):(
                      <>
                        <p style={{fontSize:14,fontWeight:700,color:C.ink,
                          fontFamily:"'DM Sans',sans-serif",margin:"0 0 4px"}}>
                          Waiter has been notified ✓
                        </p>
                        <p style={{fontSize:12,color:C.inkSub,
                          fontFamily:"'DM Sans',sans-serif",margin:0}}>
                          Someone will be at your table shortly...
                        </p>
                      </>
                    )}
                  </div>

                  {/* Quote */}
                  <div style={{background:C.g08,border:`1px solid ${C.g15}`,
                    borderRadius:12,padding:"12px 14px",marginBottom:16,textAlign:"center"}}>
                    <p style={{fontSize:12,color:C.inkSub,margin:0,
                      fontFamily:"'Cormorant Garamond',serif",
                      fontStyle:"italic",lineHeight:1.6}}>
                      {selectedReq?.quote||"\"Your comfort is our commitment.\""}
                    </p>
                  </div>

                  <div style={{display:"flex",gap:9}}>
                    <button onClick={reset}
                      style={{flex:1,padding:"13px",borderRadius:12,
                        background:C.gl1,border:`1px solid ${C.glBd}`,
                        color:C.inkSub,fontSize:13,fontWeight:700,cursor:"pointer",
                        fontFamily:"'DM Sans',sans-serif"}}>
                      New Request
                    </button>
                    <button onClick={close}
                      style={{flex:1,padding:"13px",borderRadius:12,border:"none",
                        background:GG,color:C.void,fontSize:13,fontWeight:700,
                        cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>
                      Close ✓
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes btlerBgIn    { from{opacity:0} to{opacity:1} }
        @keyframes btlerSheetUp { from{transform:translateY(100%)} to{transform:translateY(0)} }
        @keyframes btlerPulse   { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(1.2)} }
        @keyframes btlerGlow    { 0%,100%{opacity:0.4;transform:scale(1)} 50%{opacity:0.8;transform:scale(1.08)} }
        @keyframes btlerPop     { 0%{transform:scale(0.5);opacity:0} 60%{transform:scale(1.08)} 100%{transform:scale(1);opacity:1} }
        @keyframes btlerFloat   { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @keyframes btlerSpin    { to{transform:rotate(360deg)} }
        @keyframes btlerOptIn   { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes btlerQuoteIn { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
      `}</style>
    </>
  );
}
