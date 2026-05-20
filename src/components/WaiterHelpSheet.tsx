"use client";
import { useState, useEffect, useRef } from "react";

// ═══════════════════════════════════════════════════════════════════
// TABLE BUTLER — Smart One-Tap Waiter Calling System
// Single tap → instant send. No countdown. Dirty hands friendly.
// ═══════════════════════════════════════════════════════════════════

const C = {
  void:"#030201",dark:"#0B0906",surface:"#15120E",
  gold:"#C8922A",goldM:"#E8B84B",goldL:"#F5CC6A",
  ink:"#F5EDD8",inkSub:"#C4AA80",inkDim:"#7A6448",
  gl1:"rgba(255,255,255,0.03)",gl2:"rgba(255,255,255,0.06)",
  glBd:"rgba(255,255,255,0.08)",
  g08:"rgba(200,146,42,0.08)",g15:"rgba(200,146,42,0.15)",
  g25:"rgba(200,146,42,0.25)",g40:"rgba(200,146,42,0.40)",
  green:"#4ADE80",greenDim:"rgba(74,222,128,0.12)",
  greenBd:"rgba(74,222,128,0.25)",
  red:"#F87171",blue:"#60A5FA",purple:"#C084FC",
};
const GG   = `linear-gradient(135deg,${C.gold} 0%,${C.goldM} 52%,${C.goldL} 100%)`;
const SPR  = "cubic-bezier(0.34,1.56,0.64,1)";
const EASE = "cubic-bezier(0.25,0.46,0.45,0.94)";
const API  = process.env.NEXT_PUBLIC_API_URL||"https://golden-beans-server.onrender.com/api";

interface SubOption { id:string; label:string; detail:string; icon:string }
interface Request {
  id:string; icon:string; label:string; desc:string;
  quote:string; priority:"high"|"normal"; color:string;
  category:"help"|"food"|"comfort"|"payment";
  subOptions?: SubOption[];
}

const ALL_REQUESTS:Request[] = [
  { id:"waiter",    icon:"🙋",  label:"Call Waiter",     desc:"Need personal assistance",          quote:"\"Your wish is our command — we're here for you.\"",  priority:"high",   color:C.gold,   category:"help"    },
  { id:"water",     icon:"💧",  label:"Water Refill",    desc:"Fresh water at your table",          quote:"\"Staying hydrated, staying happy!\"",                priority:"normal", color:C.blue,   category:"food",
    subOptions:[
      {id:"chilled",label:"Chilled",  detail:"Cold with ice cubes",    icon:"🧊"},
      {id:"normal", label:"Normal",   detail:"Room temperature",       icon:"💧"},
    ]},
  { id:"bill",      icon:"🧾",  label:"Request Bill",    desc:"Ready to settle your order",         quote:"\"Thank you for dining with us tonight.\"",            priority:"high",   color:C.green,  category:"payment" },
  { id:"cutlery",   icon:"🍴",  label:"Extra Cutlery",  desc:"Spoons, forks or knives",            quote:"\"Perfect tools for a perfect meal.\"",               priority:"normal", color:C.goldM,  category:"food",
    subOptions:[
      {id:"spoon", label:"Spoon",    detail:"Dessert or soup spoon",   icon:"🥄"},
      {id:"fork",  label:"Fork",     detail:"Regular dining fork",     icon:"🍴"},
      {id:"knife", label:"Knife",    detail:"Butter or dinner knife",  icon:"🔪"},
      {id:"set",   label:"Full Set", detail:"Spoon + fork + knife",    icon:"✨"},
    ]},
  { id:"tissue",    icon:"🧻",  label:"Napkins",         desc:"Fresh napkins or tissues",           quote:"\"Every detail matters to us.\"",                     priority:"normal", color:C.inkSub, category:"comfort" },
  { id:"condiment", icon:"🌶️", label:"Condiments",      desc:"Sauces, ketchup, chutney",           quote:"\"The right flavour, just for you.\"",                priority:"normal", color:C.red,    category:"food",
    subOptions:[
      {id:"ketchup",  label:"Ketchup",       detail:"Heinz tomato ketchup",   icon:"🍅"},
      {id:"chutney",  label:"Green Chutney", detail:"Mint & coriander",       icon:"🌿"},
      {id:"tamarind", label:"Tamarind",      detail:"Sweet & sour chutney",   icon:"🟤"},
      {id:"sauce",    label:"Extra Sauce",   detail:"Chef's special sauce",   icon:"🌶️"},
    ]},
  { id:"dessert",   icon:"🍰",  label:"Dessert Menu",   desc:"See our sweet delights",             quote:"\"Save room for something sweet!\"",                  priority:"normal", color:C.purple, category:"food"    },
  { id:"ac",        icon:"❄️",  label:"AC Comfort",     desc:"Adjust the temperature",             quote:"\"Your comfort is our priority.\"",                   priority:"normal", color:C.blue,   category:"comfort",
    subOptions:[
      {id:"cooler", label:"Make Cooler", detail:"It's too warm, cool it down", icon:"❄️"},
      {id:"warmer", label:"Make Warmer", detail:"It's too cold, turn it down", icon:"🌡️"},
    ]},
  { id:"order",     icon:"➕",  label:"Add to Order",   desc:"Want to order something more?",      quote:"\"Good taste knows no limits.\"",                     priority:"normal", color:C.goldL,  category:"food"    },
  { id:"other",     icon:"💬",  label:"Other Request",  desc:"Something we haven't listed",        quote:"\"Just ask — we are here for you.\"",                 priority:"normal", color:C.inkSub, category:"help"    },
];

// ── Context aware suggestions ──
function getSmartSuggestions(orderStatus:string, minutesElapsed:number, prevRequests:string[]):string[]{
  const s:string[]=[];
  if(orderStatus==="delivered"||orderStatus==="ready"){
    if(!prevRequests.includes("water"))     s.push("water");
    if(!prevRequests.includes("condiment")) s.push("condiment");
    if(minutesElapsed>20&&!prevRequests.includes("dessert")) s.push("dessert");
  }
  if(minutesElapsed>30&&!prevRequests.includes("bill")) s.push("bill");
  if(!s.length){ if(!prevRequests.includes("waiter")) s.push("waiter"); if(!prevRequests.includes("water")) s.push("water"); }
  return s.slice(0,3);
}

function getContextMsg(orderStatus:string, minutesElapsed:number){
  if(orderStatus==="delivered"){ if(minutesElapsed>25) return {emoji:"🍰",text:"Enjoying your meal?",sub:"Perhaps some dessert?"}; return {emoji:"❤️",text:"How's your meal?",sub:"Tap anything — we're one touch away"}; }
  if(orderStatus==="ready") return {emoji:"🛎️",text:"Your order is ready!",sub:"Need anything while you wait?"};
  if(orderStatus==="kotSent") return {emoji:"👨‍🍳",text:"Chef is crafting your order",sub:"Tap to call us — we're here for you"};
  if(minutesElapsed>30) return {emoji:"⏰",text:"Been a while?",sub:"Ready for the bill or something more?"};
  return {emoji:"✨",text:"Your Table Butler",sub:"One tap — we'll be right there"};
}

interface Props {
  tableId:string; tableNumber:string;
  orderStatus?:string; orderTime?:string;
  onRequestComplete?:(requestId:string)=>void;
}

export default function WaiterHelpSheet({tableId,tableNumber,orderStatus="",orderTime="",onRequestComplete}:Props){
  const [open,          setOpen         ] = useState(false);
  const [phase,         setPhase        ] = useState<"select"|"subopts"|"sending"|"sent">("select");
  const [selected,      setSelected     ] = useState<string|null>(null);
  const [subSelected,   setSubSelected  ] = useState<string|null>(null);
  const [prevRequests,  setPrevRequests ] = useState<string[]>([]);
  // requestId → track waiter completion for badge
  const [sentRequests,  setSentRequests ] = useState<{uid:string;id:string;reqId:string;subLabel?:string}[]>([]);
  const [activeCategory,setActiveCategory]=useState("all");
  const [btnPulse,      setBtnPulse     ] = useState(false);
  const closeTimer = useRef<NodeJS.Timeout|null>(null);

  const minutesElapsed = orderTime ? Math.floor((Date.now()-new Date(orderTime).getTime())/60000) : 0;
  const selectedReq    = ALL_REQUESTS.find(r=>r.id===selected);
  const hasSubOpts     = !!selectedReq?.subOptions?.length;
  const pendingCount   = sentRequests.length;

  const smartSuggestions = getSmartSuggestions(orderStatus, minutesElapsed, prevRequests);
  const contextMsg       = getContextMsg(orderStatus, minutesElapsed);

  // Pulse button periodically
  useEffect(()=>{
    const iv=setInterval(()=>{setBtnPulse(true);setTimeout(()=>setBtnPulse(false),2000);},45000);
    return()=>clearInterval(iv);
  },[]);

  // Poll every 10s to check if requests are completed → remove from badge
  useEffect(()=>{
    if(sentRequests.length===0) return;
    const iv=setInterval(async()=>{
      try{
        const ids=sentRequests.map(r=>r.reqId).filter(Boolean);
        if(!ids.length) return;
        // Check each request status
        const results = await Promise.all(
          ids.map(id=>fetch(`${API}/waiter/request-status/${id}`).then(r=>r.json()).catch(()=>null))
        );
        results.forEach((data,i)=>{
          if(data?.status==="completed"||data?.status==="cancelled"){
            setSentRequests(p=>p.filter(r=>r.reqId!==ids[i]));
          }
        });
      }catch{}
    },10000);
    return()=>clearInterval(iv);
  },[sentRequests]);

  // ── INSTANT SEND — no countdown, auto-close in 3s ──
  const sendRequest=async(reqId:string, subId?:string)=>{
    setPhase("sending");
    const req=ALL_REQUESTS.find(r=>r.id===reqId);
    const sub=req?.subOptions?.find(s=>s.id===subId);
    const noteText=sub?`${sub.label} — ${sub.detail}`:(req?.desc||"");
    let serverReqId="";
    const uid=`${reqId}_${subId||""}_${Date.now()}`;
    try{
      const res=await fetch(`${API}/waiter/request`,{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          tableId, tableNumber,
          type:reqId,
          subType:subId||null,
          subLabel:sub?.label||null,
          note:noteText,
          label:req?.label||reqId,
          icon:req?.icon||"🙋",
          priority:req?.priority||"normal",
        }),
      });
      const data=await res.json();
      if(data.request?._id) serverReqId=data.request._id;
    }catch{}
    setPrevRequests(p=>[...p,reqId]);
    setSentRequests(p=>[...p,{uid,id:reqId,reqId:serverReqId,subLabel:sub?.label}]);
    setPhase("sent");

    // Auto-close after 1 second
    if(closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current=setTimeout(()=>{
      setOpen(false);
      setTimeout(()=>{ setPhase("select");setSelected(null);setSubSelected(null); },300);
    },1000);
  };

  const handleSelectRequest=(id:string)=>{
    setSelected(selected===id?null:id);
    setSubSelected(null);
  };

  // When request selected — if has sub options show them, else instant send
  const handleProceed=()=>{
    if(!selected) return;
    if(hasSubOpts){ setPhase("subopts"); return; }
    sendRequest(selected);
  };

  // Sub option selected — instant send
  const handleSubSelect=(subId:string)=>{
    setSubSelected(subId);
    sendRequest(selected!, subId);
  };

  // Waiter completed → remove from badge
  const markDone=(reqId:string)=>{
    setSentRequests(p=>p.filter(r=>r.id!==reqId));
    if(onRequestComplete) onRequestComplete(reqId);
  };

  const close=()=>{
    if(phase==="sending") return;
    setOpen(false);
    setTimeout(()=>{ setPhase("select");setSelected(null);setSubSelected(null); },350);
  };

  const reset=()=>{ setPhase("select");setSelected(null);setSubSelected(null); };

  const categories=[
    {id:"all",label:"All",icon:"✨"},
    {id:"help",label:"Help",icon:"🙋"},
    {id:"food",label:"Food",icon:"🍽️"},
    {id:"comfort",label:"Comfort",icon:"❄️"},
    {id:"payment",label:"Payment",icon:"💳"},
  ];
  const filteredRequests=activeCategory==="all"?ALL_REQUESTS:ALL_REQUESTS.filter(r=>r.category===activeCategory);

  return(
    <>
      {/* ── Floating Butler Button ── */}
      <button onClick={()=>setOpen(true)} style={{
        position:"fixed",bottom:86,right:16,
        width:56,height:56,borderRadius:"50%",
        background:GG,border:"none",
        boxShadow:`0 6px 24px ${C.g40}, 0 0 0 ${btnPulse?"10px":"0px"} rgba(200,146,42,0.15)`,
        color:C.void,fontSize:22,cursor:"pointer",
        display:"flex",alignItems:"center",justifyContent:"center",
        zIndex:39,
        transition:`box-shadow 0.4s ${EASE},transform 0.2s ${SPR}`,
        transform:open?"scale(0.92)":"scale(1)",
      }}>
        🛎️
        {pendingCount>0&&(
          <div style={{position:"absolute",top:-3,right:-3,
            minWidth:18,height:18,borderRadius:99,
            background:C.red,border:`2px solid ${C.void}`,
            fontSize:9,color:"white",fontWeight:900,
            display:"flex",alignItems:"center",justifyContent:"center",
            padding:"0 4px"}}>
            {pendingCount}
          </div>
        )}
      </button>

      {/* ── Bottom Sheet ── */}
      {open&&(
        <div onClick={close} style={{
          position:"fixed",inset:0,zIndex:100,
          background:"rgba(2,1,0,0.92)",
          backdropFilter:"blur(28px)",WebkitBackdropFilter:"blur(28px)",
          display:"flex",alignItems:"flex-end",justifyContent:"center",
          animation:`btlerBgIn 0.25s ${EASE}`,
        }}>
          <div onClick={e=>e.stopPropagation()} style={{
            background:`linear-gradient(180deg,${C.surface} 0%,${C.dark} 100%)`,
            width:"100%",maxWidth:480,borderRadius:"26px 26px 0 0",
            border:`1px solid ${C.glBd}`,borderBottom:"none",
            maxHeight:"92dvh",display:"flex",flexDirection:"column",overflow:"hidden",
            animation:`btlerSheetUp 0.38s cubic-bezier(0.32,0.72,0,1)`,
            boxShadow:`0 -24px 80px rgba(0,0,0,0.9)`,
          }}>
            <div style={{height:3,background:GG,flexShrink:0}}/>
            <div style={{display:"flex",justifyContent:"center",padding:"10px 0 0",flexShrink:0}}>
              <div style={{width:40,height:4,borderRadius:99,background:"rgba(255,255,255,0.1)"}}/>
            </div>

            {/* Header */}
            <div style={{padding:"14px 18px 12px",flexShrink:0,borderBottom:`1px solid ${C.gl2}`}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                <div>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:3}}>
                    <span style={{fontSize:20}}>{contextMsg.emoji}</span>
                    <h3 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,fontWeight:600,color:C.ink,margin:0,lineHeight:1}}>{contextMsg.text}</h3>
                  </div>
                  <p style={{fontSize:12,color:C.inkDim,margin:0,fontFamily:"'DM Sans',sans-serif"}}>{contextMsg.sub}</p>
                </div>
                <button onClick={close} style={{width:32,height:32,borderRadius:"50%",background:C.gl1,border:`1px solid ${C.glBd}`,color:C.inkSub,cursor:"pointer",fontSize:14,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>✕</button>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:6,marginTop:10,background:C.g08,border:`1px solid ${C.g15}`,borderRadius:10,padding:"6px 12px",width:"fit-content"}}>
                <div style={{width:6,height:6,borderRadius:"50%",background:C.gold,animation:"btlerPulse 1.5s ease-in-out infinite"}}/>
                <span style={{fontSize:10,color:C.gold,fontFamily:"'DM Mono',monospace",letterSpacing:".08em"}}>TABLE {tableNumber} · ONE TAP SERVICE</span>
              </div>
            </div>

            {/* Content */}
            <div style={{flex:1,overflowY:"auto",padding:"16px 16px 32px",scrollbarWidth:"none"}}>

              {/* ── SELECT PHASE ── */}
              {phase==="select"&&(
                <>
                  {/* Smart suggestions */}
                  {smartSuggestions.length>0&&(
                    <div style={{marginBottom:16}}>
                      <p style={{fontSize:9,color:C.gold,fontFamily:"'DM Mono',monospace",letterSpacing:".18em",textTransform:"uppercase",margin:"0 0 10px"}}>✦ SUGGESTED FOR YOU</p>
                      <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                        {smartSuggestions.map(id=>{
                          const req=ALL_REQUESTS.find(r=>r.id===id); if(!req)return null;
                          const done=prevRequests.includes(id);
                          return(
                            <button key={id} onClick={()=>{
                              setSelected(id);
                              const r=ALL_REQUESTS.find(x=>x.id===id);
                              if(!r?.subOptions?.length){ sendRequest(id); }
                              else { setPhase("subopts"); }
                            }} style={{
                              display:"flex",alignItems:"center",gap:7,padding:"8px 14px",borderRadius:99,
                              background:done?"rgba(74,222,128,0.12)":C.g08,
                              border:`1px solid ${done?C.greenBd:C.g25}`,
                              color:done?C.green:C.goldL,
                              fontSize:12,fontWeight:700,cursor:"pointer",
                              fontFamily:"'DM Sans',sans-serif",
                              transition:`all 0.22s ${EASE}`,
                            }}>
                              <span>{req.icon}</span>{req.label}{done&&" ✓"}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Category filter */}
                  <div style={{display:"flex",gap:6,marginBottom:14,overflowX:"auto",scrollbarWidth:"none",paddingBottom:2}}>
                    {categories.map(cat=>(
                      <button key={cat.id} onClick={()=>setActiveCategory(cat.id)} style={{
                        display:"flex",alignItems:"center",gap:5,padding:"6px 12px",borderRadius:99,flexShrink:0,
                        background:activeCategory===cat.id?C.g15:C.gl1,
                        border:`1px solid ${activeCategory===cat.id?C.g25:C.glBd}`,
                        color:activeCategory===cat.id?C.goldL:C.inkDim,
                        fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",
                        transition:`all 0.18s ${EASE}`,
                      }}>
                        <span style={{fontSize:12}}>{cat.icon}</span>{cat.label}
                      </button>
                    ))}
                  </div>

                  {/* ── ONE TAP REQUEST GRID ── */}
                  <p style={{fontSize:9,color:C.inkDim,fontFamily:"'DM Mono',monospace",letterSpacing:".15em",textTransform:"uppercase",margin:"0 0 10px"}}>TAP ONCE TO SEND</p>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:9,marginBottom:14}}>
                    {filteredRequests.map((req,i)=>{
                      const done=prevRequests.includes(req.id);
                      const pending=sentRequests.some(r=>r.id===req.id);
                      return(
                        <button key={req.id} onClick={()=>{
                          if(req.subOptions?.length){ setSelected(req.id); setPhase("subopts"); return; }
                          sendRequest(req.id);
                        }} style={{
                          background:pending?"rgba(74,222,128,0.08)":done?C.gl2:C.gl1,
                          border:`1.5px solid ${pending?C.greenBd:done?"rgba(255,255,255,0.05)":C.glBd}`,
                          borderRadius:16,padding:"14px 12px",
                          cursor:"pointer",textAlign:"left",position:"relative",
                          transition:`all 0.18s ${EASE}`,
                          animation:`btlerOptIn 0.3s ${i*0.03}s ${EASE} both`,
                          opacity:done&&!pending?0.5:1,
                        }}>
                          {pending&&<div style={{position:"absolute",top:8,right:8,width:7,height:7,borderRadius:"50%",background:C.green,animation:"btlerPulse 1.2s ease-in-out infinite"}}/>}
                          {req.priority==="high"&&!done&&<div style={{position:"absolute",top:8,left:8,background:req.id==="bill"?"rgba(74,222,128,0.2)":C.g08,border:`1px solid ${req.id==="bill"?C.greenBd:C.g15}`,borderRadius:99,padding:"1px 6px",fontSize:8,color:req.id==="bill"?C.green:C.gold,fontFamily:"'DM Mono',monospace"}}>PRIORITY</div>}
                          {req.subOptions&&<div style={{position:"absolute",bottom:8,right:8,fontSize:9,color:C.inkDim,fontFamily:"'DM Mono',monospace"}}>OPTIONS ›</div>}
                          <span style={{fontSize:26,display:"block",marginBottom:7}}>{req.icon}</span>
                          <p style={{fontSize:12.5,fontWeight:600,margin:"0 0 3px",color:pending?C.green:C.ink,fontFamily:"'DM Sans',sans-serif"}}>{req.label}</p>
                          <p style={{fontSize:10,color:C.inkDim,margin:0,fontFamily:"'DM Sans',sans-serif",lineHeight:1.4}}>{pending?"Notifying waiter...":req.desc}</p>
                        </button>
                      );
                    })}
                  </div>

                  {/* Active requests */}
                  {sentRequests.length>0&&(
                    <div style={{background:C.greenDim,border:`1px solid ${C.greenBd}`,borderRadius:14,padding:"12px 14px",marginBottom:12}}>
                      <p style={{fontSize:9,color:C.green,fontFamily:"'DM Mono',monospace",letterSpacing:".15em",textTransform:"uppercase",margin:"0 0 10px"}}>⚡ ACTIVE REQUESTS</p>
                      {sentRequests.map(r=>{
                        const req=ALL_REQUESTS.find(x=>x.id===r.id);
                        return(
                          <div key={r.uid} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"6px 0",borderBottom:`1px solid rgba(74,222,128,0.1)`}}>
                            <div style={{display:"flex",alignItems:"center",gap:8}}>
                              <span style={{fontSize:16}}>{req?.icon||"🙋"}</span>
                              <div>
                                <p style={{fontSize:12,color:C.ink,fontWeight:600,margin:0}}>{req?.label}</p>
                                {r.subLabel&&<p style={{fontSize:10,color:C.green,margin:0}}>{r.subLabel}</p>}
                              </div>
                            </div>
                            <div style={{display:"flex",alignItems:"center",gap:6}}>
                              <div style={{width:6,height:6,borderRadius:"50%",background:C.green,animation:"btlerPulse 1.5s ease-in-out infinite"}}/>
                              <span style={{fontSize:10,color:C.green,fontFamily:"'DM Mono',monospace"}}>Sent</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}

              {/* ── SUB OPTIONS PHASE ── */}
              {phase==="subopts"&&selectedReq?.subOptions&&(
                <div style={{animation:`btlerQuoteIn 0.3s ${EASE}`}}>
                  <button onClick={reset} style={{display:"flex",alignItems:"center",gap:6,background:"none",border:"none",color:C.inkDim,cursor:"pointer",fontSize:13,fontFamily:"'DM Sans',sans-serif",marginBottom:16,padding:0}}>← Back</button>
                  <div style={{textAlign:"center",marginBottom:20}}>
                    <span style={{fontSize:48,display:"block",marginBottom:10,animation:"btlerFloat 2s ease-in-out infinite"}}>{selectedReq.icon}</span>
                    <h3 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,fontWeight:600,color:C.goldL,margin:"0 0 4px"}}>{selectedReq.label}</h3>
                    <p style={{fontSize:12,color:C.inkDim,fontFamily:"'DM Sans',sans-serif",margin:0}}>Tap your preference — sends instantly</p>
                  </div>
                  <div style={{display:"flex",flexDirection:"column",gap:10}}>
                    {selectedReq.subOptions.map(sub=>(
                      <button key={sub.id} onClick={()=>handleSubSelect(sub.id)} style={{
                        display:"flex",alignItems:"center",gap:14,padding:"18px",borderRadius:16,
                        background:C.gl1,border:`1.5px solid ${C.glBd}`,cursor:"pointer",
                        textAlign:"left",transition:`all 0.18s ${EASE}`,
                        animation:`btlerOptIn 0.2s ${EASE} both`,
                      }}>
                        <span style={{fontSize:32,flexShrink:0}}>{sub.icon}</span>
                        <div style={{flex:1}}>
                          <p style={{fontSize:15,fontWeight:700,color:C.ink,margin:"0 0 3px",fontFamily:"'DM Sans',sans-serif"}}>{sub.label}</p>
                          <p style={{fontSize:11,color:C.inkDim,margin:0,fontFamily:"'DM Sans',sans-serif"}}>{sub.detail}</p>
                        </div>
                        <span style={{fontSize:18,color:C.inkDim,flexShrink:0}}>→</span>
                      </button>
                    ))}
                  </div>
                  <div style={{background:C.g08,border:`1px solid ${C.g15}`,borderRadius:12,padding:"12px 14px",marginTop:16,textAlign:"center"}}>
                    <p style={{fontSize:12,color:C.inkSub,margin:0,fontFamily:"'Cormorant Garamond',serif",fontStyle:"italic",lineHeight:1.6}}>{selectedReq.quote}</p>
                  </div>
                </div>
              )}

              {/* ── SENDING PHASE ── */}
              {phase==="sending"&&(
                <div style={{textAlign:"center",padding:"48px 20px",animation:`btlerQuoteIn 0.3s ${EASE}`}}>
                  <div style={{width:64,height:64,borderRadius:"50%",border:`3px solid ${C.g25}`,borderTopColor:C.gold,animation:"btlerSpin 0.7s linear infinite",margin:"0 auto 20px"}}/>
                  <p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:20,color:C.goldL,margin:"0 0 6px",fontWeight:600}}>Notifying your waiter...</p>
                  <p style={{fontSize:12,color:C.inkDim,fontFamily:"'DM Sans',sans-serif",margin:0}}>Just a moment</p>
                </div>
              )}

              {/* ── SENT PHASE ── */}
              {phase==="sent"&&(
                <div style={{animation:`btlerQuoteIn 0.4s ${SPR}`,padding:"8px 0"}}>
                  <div style={{textAlign:"center",padding:"20px 0 24px"}}>
                    <div style={{position:"relative",width:88,height:88,margin:"0 auto 18px"}}>
                      <div style={{position:"absolute",inset:-8,borderRadius:"50%",background:`radial-gradient(circle,rgba(74,222,128,0.12),transparent)`,animation:"btlerGlow 2s ease-in-out infinite"}}/>
                      <div style={{width:88,height:88,borderRadius:"50%",background:"rgba(74,222,128,0.12)",border:"2px solid rgba(74,222,128,0.25)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:36,boxShadow:"0 0 32px rgba(74,222,128,0.3)",animation:`btlerPop 0.5s ${SPR}`}}>
                        {selectedReq?.icon||"✓"}
                      </div>
                    </div>
                    <h3 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:26,fontWeight:600,color:C.green,margin:"0 0 6px"}}>We're on our way!</h3>
                    <p style={{fontSize:13,color:C.inkSub,fontFamily:"'DM Sans',sans-serif",lineHeight:1.6,margin:0}}>
                      {selectedReq?.label}{subSelected&&selectedReq?.subOptions?` — ${selectedReq.subOptions.find(s=>s.id===subSelected)?.label}`:""} · Table {tableNumber}
                    </p>
                  </div>
                  <div style={{background:"rgba(74,222,128,0.12)",border:"1px solid rgba(74,222,128,0.25)",borderRadius:16,padding:"16px 18px",marginBottom:16}}>
                    <p style={{fontSize:14,fontWeight:700,color:C.ink,fontFamily:"'DM Sans',sans-serif",margin:"0 0 4px"}}>Waiter has been notified ✓</p>
                    <p style={{fontSize:12,color:C.inkSub,fontFamily:"'DM Sans',sans-serif",margin:0}}>Someone will be at your table shortly</p>
                  </div>
                  <div style={{background:C.g08,border:`1px solid ${C.g15}`,borderRadius:12,padding:"12px 14px",marginBottom:16,textAlign:"center"}}>
                    <p style={{fontSize:12,color:C.inkSub,margin:0,fontFamily:"'Cormorant Garamond',serif",fontStyle:"italic",lineHeight:1.6}}>{selectedReq?.quote||"\"Your comfort is our commitment.\""}</p>
                  </div>
                  <div style={{display:"flex",gap:9}}>
                    <button onClick={reset} style={{flex:1,padding:"13px",borderRadius:12,background:C.gl1,border:`1px solid ${C.glBd}`,color:C.inkSub,fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>More Requests</button>
                    <button onClick={close} style={{flex:1,padding:"13px",borderRadius:12,border:"none",background:GG,color:C.void,fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>Close ✓</button>
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
        @keyframes btlerPulse   { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(1.3)} }
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
