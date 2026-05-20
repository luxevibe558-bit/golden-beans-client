"use client";
import { useState, useEffect, useRef } from "react";

const C = {
  void:"#030201",dark:"#0B0906",surface:"#15120E",raise:"#1E1A14",
  gold:"#C8922A",goldM:"#E8B84B",goldL:"#F5CC6A",
  ink:"#F5EDD8",inkSub:"#C4AA80",inkDim:"#7A6448",inkGh:"#2A2218",
  gl1:"rgba(255,255,255,0.03)",gl2:"rgba(255,255,255,0.06)",
  glBd:"rgba(255,255,255,0.08)",
  g08:"rgba(200,146,42,0.08)",g15:"rgba(200,146,42,0.15)",
  g25:"rgba(200,146,42,0.25)",g40:"rgba(200,146,42,0.40)",
  green:"#4ADE80",greenDim:"rgba(74,222,128,0.12)",
  greenBd:"rgba(74,222,128,0.25)",blue:"#60A5FA",
  red:"#F87171",purple:"#C084FC",
};
const GG   = `linear-gradient(135deg,${C.gold} 0%,${C.goldM} 52%,${C.goldL} 100%)`;
const SPR  = "cubic-bezier(0.34,1.56,0.64,1)";
const EASE = "cubic-bezier(0.25,0.46,0.45,0.94)";
const API  = process.env.NEXT_PUBLIC_API_URL||"https://golden-beans-server.onrender.com/api";

// ── Sub-options for smart requests ──
interface SubOption { id:string; label:string; detail:string; icon:string }
interface Request {
  id:string; icon:string; label:string; desc:string;
  quote:string; priority:"high"|"normal"; color:string;
  category:"help"|"food"|"comfort"|"payment";
  subOptions?: SubOption[];
}

const ALL_REQUESTS:Request[] = [
  {
    id:"waiter",icon:"🙋",label:"Call Waiter",desc:"Need personal assistance",
    quote:"\"Your wish is our command — we're here for you.\"",
    priority:"high",color:C.gold,category:"help",
  },
  {
    id:"water",icon:"💧",label:"Water Refill",desc:"Fresh water at your table",
    quote:"\"Staying hydrated, staying happy!\"",
    priority:"normal",color:C.blue,category:"food",
    subOptions:[
      {id:"chilled",label:"Chilled Water",detail:"Cold with ice cubes",icon:"🧊"},
      {id:"normal", label:"Normal Water", detail:"Room temperature",   icon:"💧"},
    ],
  },
  {
    id:"bill",icon:"🧾",label:"Request Bill",desc:"Ready to settle your order",
    quote:"\"Thank you for dining with us tonight.\"",
    priority:"high",color:C.green,category:"payment",
  },
  {
    id:"cutlery",icon:"🍴",label:"Extra Cutlery",desc:"Spoons, forks or knives",
    quote:"\"Perfect tools for a perfect meal.\"",
    priority:"normal",color:C.goldM,category:"food",
    subOptions:[
      {id:"spoon",  label:"Spoon",     detail:"Dessert or soup spoon", icon:"🥄"},
      {id:"fork",   label:"Fork",      detail:"Regular dining fork",   icon:"🍴"},
      {id:"knife",  label:"Knife",     detail:"Butter or dinner knife", icon:"🔪"},
      {id:"all",    label:"Full Set",  detail:"Spoon + fork + knife",  icon:"✨"},
    ],
  },
  {
    id:"tissue",icon:"🧻",label:"Napkins",desc:"Fresh napkins or tissues",
    quote:"\"Every detail matters to us.\"",
    priority:"normal",color:C.inkSub,category:"comfort",
  },
  {
    id:"condiment",icon:"🌶️",label:"Condiments",desc:"Sauces, ketchup, chutney",
    quote:"\"The right flavour, just for you.\"",
    priority:"normal",color:C.red,category:"food",
    subOptions:[
      {id:"ketchup",  label:"Ketchup",       detail:"Heinz tomato ketchup",  icon:"🍅"},
      {id:"chutney",  label:"Green Chutney", detail:"Mint & coriander",      icon:"🌿"},
      {id:"tamarind", label:"Tamarind",      detail:"Sweet & sour chutney",  icon:"🟤"},
      {id:"sauce",    label:"Extra Sauce",   detail:"Chef's special sauce",  icon:"🌶️"},
    ],
  },
  {
    id:"dessert",icon:"🍰",label:"Dessert Menu",desc:"See our sweet delights",
    quote:"\"Save room for something sweet!\"",
    priority:"normal",color:C.purple,category:"food",
  },
  {
    id:"ac",icon:"❄️",label:"AC Comfort",desc:"Adjust the temperature",
    quote:"\"Your comfort is our priority.\"",
    priority:"normal",color:C.blue,category:"comfort",
    subOptions:[
      {id:"cooler", label:"Make It Cooler", detail:"It's too warm, please cool it down", icon:"❄️"},
      {id:"warmer", label:"Make It Warmer", detail:"It's too cold, please turn it down",  icon:"🌡️"},
    ],
  },
  {
    id:"order",icon:"➕",label:"Add to Order",desc:"Want to order something more?",
    quote:"\"Good taste knows no limits.\"",
    priority:"normal",color:C.goldL,category:"food",
  },
  {
    id:"other",icon:"💬",label:"Other Request",desc:"Something we haven't listed",
    quote:"\"Just ask — we are here for you.\"",
    priority:"normal",color:C.inkSub,category:"help",
  },
];

interface Props {
  tableId:string; tableNumber:string;
  orderStatus?:string; orderTime?:string;
}

export default function WaiterHelpSheet({tableId,tableNumber,orderStatus="",orderTime=""}:Props) {
  const [open,        setOpen       ] = useState(false);
  const [phase,       setPhase      ] = useState<"select"|"subopts"|"countdown"|"sending"|"sent">("select");
  const [selected,    setSelected   ] = useState<string|null>(null);
  const [subSelected, setSubSelected] = useState<string|null>(null);
  const [note,        setNote       ] = useState("");
  const [noteOpen,    setNoteOpen   ] = useState(false);
  const [countdown,   setCountdown  ] = useState(3);
  const [prevRequests,setPrevRequests] = useState<string[]>([]);
  const [activeCategory,setActiveCategory] = useState("all");
  const [btnPulse,    setBtnPulse   ] = useState(false);
  const cdTimer = useRef<NodeJS.Timeout|null>(null);

  const minutesElapsed = orderTime ? Math.floor((Date.now()-new Date(orderTime).getTime())/60000) : 0;
  const selectedReq    = ALL_REQUESTS.find(r=>r.id===selected);
  const hasSubOpts     = !!selectedReq?.subOptions?.length;

  // Smart suggestions based on context
  const smartSuggestions = (() => {
    const s:string[] = [];
    if(orderStatus==="delivered"||orderStatus==="ready"){
      if(!prevRequests.includes("water"))     s.push("water");
      if(!prevRequests.includes("condiment")) s.push("condiment");
      if(minutesElapsed>20&&!prevRequests.includes("dessert")) s.push("dessert");
    }
    if(minutesElapsed>30&&!prevRequests.includes("bill")) s.push("bill");
    if(!s.length){ if(!prevRequests.includes("waiter")) s.push("waiter"); if(!prevRequests.includes("water")) s.push("water"); }
    return s.slice(0,3);
  })();

  const contextMsg = (() => {
    if(orderStatus==="delivered"){ if(minutesElapsed>25) return {emoji:"🍰",text:"Enjoying your meal?",sub:"Perhaps some dessert?"}; return {emoji:"❤️",text:"How's your meal?",sub:"We hope every bite is delightful!"}; }
    if(orderStatus==="ready") return {emoji:"🛎️",text:"Your order is ready!",sub:"Need anything while you wait?"};
    if(orderStatus==="kotSent") return {emoji:"👨‍🍳",text:"Chef is crafting your order",sub:"Can we make your wait more comfortable?"};
    if(minutesElapsed>30) return {emoji:"⏰",text:"Been a while?",sub:"Ready for the bill or something more?"};
    return {emoji:"✨",text:"Your Table Butler",sub:"We're here to make your experience perfect"};
  })();

  // Pulse button periodically
  useEffect(()=>{ const iv=setInterval(()=>{setBtnPulse(true);setTimeout(()=>setBtnPulse(false),2000);},45000); return()=>clearInterval(iv); },[]);

  // Countdown logic
  useEffect(()=>{
    if(phase!=="countdown") return;
    setCountdown(3);
    let c=3;
    cdTimer.current=setInterval(()=>{
      c--;
      setCountdown(c);
      if(c<=0){
        clearInterval(cdTimer.current!);
        sendRequest();
      }
    },1000);
    return()=>{ if(cdTimer.current) clearInterval(cdTimer.current); };
  },[phase]);

  const cancelCountdown=()=>{
    if(cdTimer.current) clearInterval(cdTimer.current);
    setPhase("select");
    setCountdown(3);
  };

  const sendRequest=async()=>{
    setPhase("sending");
    const req=ALL_REQUESTS.find(r=>r.id===selected);
    const sub=req?.subOptions?.find(s=>s.id===subSelected);
    const noteText=sub?`${sub.label} — ${sub.detail}`:(note||req?.desc||"");
    try{
      await fetch(`${API}/waiter/request`,{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          tableId,tableNumber,
          type:selected,
          subType:subSelected||null,
          note:noteText,
          label:req?.label||selected,
          icon:req?.icon||"🙋",
          priority:req?.priority||"normal",
          subLabel:sub?.label||null,
        }),
      });
    }catch{ /* silent */ }
    setPrevRequests(p=>[...p,selected!]);
    setPhase("sent");
  };

  const categories=[
    {id:"all",label:"All",icon:"✨"},
    {id:"help",label:"Help",icon:"🙋"},
    {id:"food",label:"Food",icon:"🍽️"},
    {id:"comfort",label:"Comfort",icon:"❄️"},
    {id:"payment",label:"Payment",icon:"💳"},
  ];

  const filteredRequests=activeCategory==="all"?ALL_REQUESTS:ALL_REQUESTS.filter(r=>r.category===activeCategory);

  const handleSelectRequest=(id:string)=>{
    const wasSelected=selected===id;
    setSelected(wasSelected?null:id);
    setSubSelected(null);
  };

  const handleProceed=()=>{
    if(!selected)return;
    if(hasSubOpts&&!subSelected){ setPhase("subopts"); return; }
    setPhase("countdown");
  };

  const close=()=>{
    if(phase==="sending")return;
    if(cdTimer.current) clearInterval(cdTimer.current);
    setOpen(false);
    setTimeout(()=>{ setPhase("select");setSelected(null);setSubSelected(null);setNote("");setNoteOpen(false);setCountdown(3); },350);
  };

  const reset=()=>{ if(cdTimer.current) clearInterval(cdTimer.current); setPhase("select");setSelected(null);setSubSelected(null);setNote("");setNoteOpen(false);setCountdown(3); };

  return(
    <>
      {/* Floating Butler Button */}
      <button onClick={()=>setOpen(true)} style={{
        position:"fixed",bottom:86,right:16,width:56,height:56,borderRadius:"50%",
        background:GG,border:"none",
        boxShadow:`0 6px 24px ${C.g40}, 0 0 0 ${btnPulse?"10px":"0px"} ${C.g15}`,
        color:C.void,fontSize:24,cursor:"pointer",
        display:"flex",alignItems:"center",justifyContent:"center",zIndex:39,
        transition:`box-shadow 0.4s ${EASE},transform 0.2s ${SPR}`,
        transform:open?"scale(0.92)":"scale(1)",
      }}>
        🛎️
        {prevRequests.length>0&&(
          <div style={{position:"absolute",top:-2,right:-2,width:17,height:17,borderRadius:"50%",
            background:C.green,border:`2px solid ${C.void}`,
            fontSize:9,color:C.void,fontWeight:900,
            display:"flex",alignItems:"center",justifyContent:"center"}}>
            {prevRequests.length}
          </div>
        )}
      </button>

      {/* Bottom Sheet */}
      {open&&(
        <div onClick={close} style={{
          position:"fixed",inset:0,zIndex:100,
          background:"rgba(2,1,0,0.92)",backdropFilter:"blur(28px)",WebkitBackdropFilter:"blur(28px)",
          display:"flex",alignItems:"flex-end",justifyContent:"center",
          animation:`btlerBgIn 0.25s ${EASE}`,
        }}>
          <div onClick={e=>e.stopPropagation()} style={{
            background:`linear-gradient(180deg,${C.surface} 0%,${C.dark} 100%)`,
            width:"100%",maxWidth:480,borderRadius:"26px 26px 0 0",
            border:`1px solid ${C.glBd}`,borderBottom:"none",
            maxHeight:"92dvh",display:"flex",flexDirection:"column",overflow:"hidden",
            animation:`btlerSheetUp 0.38s cubic-bezier(0.32,0.72,0,1)`,
            boxShadow:`0 -24px 80px rgba(0,0,0,0.9),0 0 0 1px ${C.glBd}`,
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
                    <h3 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,fontWeight:600,color:C.ink,margin:0,lineHeight:1}}>
                      {contextMsg.text}
                    </h3>
                  </div>
                  <p style={{fontSize:12,color:C.inkDim,margin:0,fontFamily:"'DM Sans',sans-serif"}}>{contextMsg.sub}</p>
                </div>
                <button onClick={close} style={{width:32,height:32,borderRadius:"50%",background:C.gl1,border:`1px solid ${C.glBd}`,color:C.inkSub,cursor:"pointer",fontSize:14,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>✕</button>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:6,marginTop:10,background:C.g08,border:`1px solid ${C.g15}`,borderRadius:10,padding:"6px 12px",width:"fit-content"}}>
                <div style={{width:6,height:6,borderRadius:"50%",background:C.gold,animation:"btlerPulse 1.5s ease-in-out infinite"}}/>
                <span style={{fontSize:10,color:C.gold,fontFamily:"'DM Mono',monospace",letterSpacing:".08em"}}>TABLE {tableNumber} · BUTLER ACTIVE</span>
              </div>
            </div>

            {/* Scrollable Content */}
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
                          const sel=selected===id;
                          return(
                            <button key={id} onClick={()=>handleSelectRequest(id)} style={{
                              display:"flex",alignItems:"center",gap:7,padding:"8px 14px",borderRadius:99,
                              background:sel?GG:C.g08,border:`1px solid ${sel?"transparent":C.g25}`,
                              color:sel?C.void:C.goldL,fontSize:12,fontWeight:700,cursor:"pointer",
                              fontFamily:"'DM Sans',sans-serif",boxShadow:sel?`0 4px 16px ${C.g40}`:"none",
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

                  {/* Request grid */}
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:9,marginBottom:14}}>
                    {filteredRequests.map((req,i)=>{
                      const sel=selected===req.id;
                      const done=prevRequests.includes(req.id);
                      return(
                        <button key={req.id} onClick={()=>handleSelectRequest(req.id)} style={{
                          background:sel?`linear-gradient(135deg,${C.g15},${C.g08})`:done?C.greenDim:C.gl1,
                          border:`1.5px solid ${sel?"rgba(200,146,42,0.6)":done?C.greenBd:C.glBd}`,
                          borderRadius:16,padding:"14px 12px",cursor:"pointer",textAlign:"left",position:"relative",
                          boxShadow:sel?`0 0 20px ${C.g25}`:"none",
                          transition:`all 0.22s ${EASE}`,
                          animation:`btlerOptIn 0.3s ${i*0.04}s ${EASE} both`,
                        }}>
                          {done&&<div style={{position:"absolute",top:8,right:8,width:14,height:14,borderRadius:"50%",background:C.green,fontSize:8,color:C.void,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900}}>✓</div>}
                          {req.priority==="high"&&!done&&<div style={{position:"absolute",top:8,left:8,background:req.id==="bill"?"rgba(74,222,128,0.2)":C.g08,border:`1px solid ${req.id==="bill"?C.greenBd:C.g15}`,borderRadius:99,padding:"1px 6px",fontSize:8,color:req.id==="bill"?C.green:C.gold,fontFamily:"'DM Mono',monospace"}}>PRIORITY</div>}
                          {req.subOptions&&<div style={{position:"absolute",bottom:8,right:8,fontSize:9,color:C.inkDim,fontFamily:"'DM Mono',monospace"}}>OPTIONS ›</div>}
                          <span style={{fontSize:26,display:"block",marginBottom:7}}>{req.icon}</span>
                          <p style={{fontSize:12.5,fontWeight:600,margin:"0 0 3px",color:sel?C.goldL:done?C.green:C.ink,fontFamily:"'DM Sans',sans-serif"}}>{req.label}</p>
                          <p style={{fontSize:10,color:C.inkDim,margin:0,fontFamily:"'DM Sans',sans-serif",lineHeight:1.4}}>{req.desc}</p>
                        </button>
                      );
                    })}
                  </div>

                  {/* Quote */}
                  {selected&&selectedReq&&(
                    <div style={{background:C.g08,border:`1px solid ${C.g15}`,borderRadius:12,padding:"12px 14px",marginBottom:14,animation:`btlerQuoteIn 0.3s ${EASE}`}}>
                      <p style={{fontSize:12,color:C.inkSub,margin:0,fontFamily:"'Cormorant Garamond',serif",fontStyle:"italic",fontWeight:500,lineHeight:1.6}}>
                        {selectedReq.quote}
                      </p>
                    </div>
                  )}

                  {/* Note */}
                  {!hasSubOpts&&selected&&(
                    <>
                      <button onClick={()=>setNoteOpen(p=>!p)} style={{width:"100%",padding:"10px 14px",borderRadius:12,background:noteOpen?C.g08:C.gl1,border:`1px solid ${noteOpen?C.g15:C.glBd}`,color:noteOpen?C.goldL:C.inkDim,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",display:"flex",alignItems:"center",gap:8,marginBottom:noteOpen?10:14,transition:`all 0.2s ${EASE}`}}>
                        <span>📝</span>Add a note (optional)
                        <span style={{marginLeft:"auto",fontSize:14,transform:noteOpen?"rotate(180deg)":"none",transition:`transform 0.2s ${EASE}`}}>⌄</span>
                      </button>
                      {noteOpen&&(
                        <textarea value={note} onChange={e=>setNote(e.target.value)} placeholder="e.g. Extra spicy please, no onions..." rows={2} autoFocus style={{width:"100%",padding:"11px 13px",borderRadius:12,border:`1px solid ${C.g15}`,background:C.gl1,color:C.ink,fontSize:13,outline:"none",resize:"none",boxSizing:"border-box",marginBottom:14,fontFamily:"'DM Sans',sans-serif",lineHeight:1.5}}/>
                      )}
                    </>
                  )}

                  {/* CTA */}
                  <button onClick={handleProceed} disabled={!selected} style={{
                    width:"100%",padding:"16px",borderRadius:14,border:"none",
                    background:selected?GG:C.gl1,color:selected?C.void:C.inkDim,
                    fontWeight:700,fontSize:15,cursor:selected?"pointer":"not-allowed",
                    fontFamily:"'DM Sans',sans-serif",boxShadow:selected?`0 8px 28px ${C.g40}`:"none",
                    display:"flex",alignItems:"center",justifyContent:"center",gap:9,
                    transition:`all 0.25s ${EASE}`,
                  }}>
                    <span>🔔</span>
                    {selected?(hasSubOpts?"Choose Preference →":"Send Request"):"Select a request"}
                  </button>
                  {prevRequests.length>0&&<p style={{textAlign:"center",fontSize:11,color:C.inkDim,margin:"12px 0 0",fontFamily:"'DM Mono',monospace",letterSpacing:".06em"}}>{prevRequests.length} request{prevRequests.length>1?"s":""} sent this session</p>}
                </>
              )}

              {/* ── SUB-OPTIONS PHASE ── */}
              {phase==="subopts"&&selectedReq?.subOptions&&(
                <div style={{animation:`btlerQuoteIn 0.3s ${EASE}`}}>
                  <button onClick={()=>setPhase("select")} style={{display:"flex",alignItems:"center",gap:6,background:"none",border:"none",color:C.inkDim,cursor:"pointer",fontSize:13,fontFamily:"'DM Sans',sans-serif",marginBottom:16,padding:0}}>← Back</button>
                  <div style={{textAlign:"center",marginBottom:20}}>
                    <span style={{fontSize:48,display:"block",marginBottom:10,animation:"btlerFloat 2s ease-in-out infinite"}}>{selectedReq.icon}</span>
                    <h3 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,fontWeight:600,color:C.goldL,margin:"0 0 6px"}}>{selectedReq.label}</h3>
                    <p style={{fontSize:12,color:C.inkSub,fontFamily:"'DM Sans',sans-serif",margin:0}}>Choose your preference</p>
                  </div>
                  <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:18}}>
                    {selectedReq.subOptions.map(sub=>{
                      const sel=subSelected===sub.id;
                      return(
                        <button key={sub.id} onClick={()=>setSubSelected(sel?null:sub.id)} style={{
                          display:"flex",alignItems:"center",gap:14,padding:"16px 18px",borderRadius:16,
                          background:sel?`linear-gradient(135deg,${C.g15},${C.g08})`:C.gl1,
                          border:`1.5px solid ${sel?"rgba(200,146,42,0.6)":C.glBd}`,cursor:"pointer",
                          textAlign:"left",boxShadow:sel?`0 0 20px ${C.g25}`:"none",
                          transition:`all 0.22s ${EASE}`,
                        }}>
                          <span style={{fontSize:28,flexShrink:0}}>{sub.icon}</span>
                          <div style={{flex:1}}>
                            <p style={{fontSize:14,fontWeight:700,color:sel?C.goldL:C.ink,margin:"0 0 3px",fontFamily:"'DM Sans',sans-serif"}}>{sub.label}</p>
                            <p style={{fontSize:11,color:C.inkDim,margin:0,fontFamily:"'DM Sans',sans-serif"}}>{sub.detail}</p>
                          </div>
                          {sel&&<div style={{width:20,height:20,borderRadius:"50%",background:GG,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:C.void,fontWeight:900,flexShrink:0}}>✓</div>}
                        </button>
                      );
                    })}
                  </div>
                  <button onClick={()=>{ if(subSelected) setPhase("countdown"); }} disabled={!subSelected} style={{width:"100%",padding:"16px",borderRadius:14,border:"none",background:subSelected?GG:C.gl1,color:subSelected?C.void:C.inkDim,fontWeight:700,fontSize:15,cursor:subSelected?"pointer":"not-allowed",fontFamily:"'DM Sans',sans-serif",boxShadow:subSelected?`0 8px 28px ${C.g40}`:"none",transition:`all 0.25s ${EASE}`}}>
                    {subSelected?"Confirm & Send ›":"Select an option"}
                  </button>
                </div>
              )}

              {/* ── COUNTDOWN PHASE ── */}
              {phase==="countdown"&&(
                <div style={{textAlign:"center",padding:"32px 20px",animation:`btlerQuoteIn 0.3s ${EASE}`}}>
                  <span style={{fontSize:52,display:"block",marginBottom:16,animation:"btlerFloat 1s ease-in-out infinite"}}>{selectedReq?.icon}</span>
                  <h3 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:24,fontWeight:600,color:C.goldL,margin:"0 0 6px"}}>{selectedReq?.label}</h3>
                  {subSelected&&selectedReq?.subOptions&&(
                    <p style={{fontSize:13,color:C.gold,fontFamily:"'DM Mono',monospace",margin:"0 0 6px"}}>
                      {selectedReq.subOptions.find(s=>s.id===subSelected)?.label}
                    </p>
                  )}
                  {note&&<p style={{fontSize:12,color:C.inkSub,fontFamily:"'DM Sans',sans-serif",margin:"0 0 16px",fontStyle:"italic"}}>"{note}"</p>}

                  {/* Countdown ring */}
                  <div style={{position:"relative",width:100,height:100,margin:"0 auto 20px"}}>
                    <svg width={100} height={100} style={{transform:"rotate(-90deg)"}}>
                      <circle cx={50} cy={50} r={44} fill="none" stroke={C.gl2} strokeWidth={5}/>
                      <circle cx={50} cy={50} r={44} fill="none" stroke={C.gold} strokeWidth={5}
                        strokeLinecap="round"
                        strokeDasharray={276}
                        strokeDashoffset={276*(1-countdown/3)}
                        style={{transition:"stroke-dashoffset 0.9s linear"}}/>
                    </svg>
                    <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
                      <span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:36,fontWeight:700,color:C.goldL,lineHeight:1}}>{countdown}</span>
                      <span style={{fontSize:9,color:C.inkDim,fontFamily:"'DM Mono',monospace",letterSpacing:".08em"}}>SENDING</span>
                    </div>
                  </div>

                  <p style={{fontSize:13,color:C.inkSub,fontFamily:"'DM Sans',sans-serif",margin:"0 0 20px",lineHeight:1.5}}>
                    Sending automatically... tap to cancel
                  </p>
                  <button onClick={cancelCountdown} style={{padding:"12px 28px",borderRadius:12,background:C.gl1,border:`1px solid ${C.glBd}`,color:C.inkSub,fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>
                    Cancel
                  </button>
                </div>
              )}

              {/* ── SENDING PHASE ── */}
              {phase==="sending"&&(
                <div style={{textAlign:"center",padding:"48px 20px",animation:`btlerQuoteIn 0.3s ${EASE}`}}>
                  <div style={{width:72,height:72,borderRadius:"50%",border:`3px solid ${C.g25}`,borderTopColor:C.gold,animation:"btlerSpin 0.8s linear infinite",margin:"0 auto 20px"}}/>
                  <p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:20,color:C.goldL,margin:"0 0 6px",fontWeight:600}}>Notifying your butler...</p>
                  <p style={{fontSize:12,color:C.inkDim,fontFamily:"'DM Sans',sans-serif",margin:0}}>Sending request to our team</p>
                </div>
              )}

              {/* ── SENT PHASE ── */}
              {phase==="sent"&&(
                <div style={{animation:`btlerQuoteIn 0.4s ${SPR}`,padding:"8px 0"}}>
                  <div style={{textAlign:"center",padding:"20px 0 24px"}}>
                    <div style={{position:"relative",width:88,height:88,margin:"0 auto 18px"}}>
                      <div style={{position:"absolute",inset:-8,borderRadius:"50%",background:`radial-gradient(circle,${C.greenDim},transparent)`,animation:"btlerGlow 2s ease-in-out infinite"}}/>
                      <div style={{width:88,height:88,borderRadius:"50%",background:C.greenDim,border:`2px solid ${C.greenBd}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:36,boxShadow:`0 0 32px rgba(74,222,128,0.3)`,animation:`btlerPop 0.5s ${SPR}`}}>
                        {selectedReq?.icon||"✓"}
                      </div>
                    </div>
                    <h3 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:26,fontWeight:600,color:C.green,margin:"0 0 6px"}}>Request Sent!</h3>
                    <p style={{fontSize:13,color:C.inkSub,fontFamily:"'DM Sans',sans-serif",lineHeight:1.6,margin:0}}>
                      {selectedReq?.label}{subSelected&&selectedReq?.subOptions?` — ${selectedReq.subOptions.find(s=>s.id===subSelected)?.label}`:""} · Table {tableNumber}
                    </p>
                  </div>
                  <div style={{background:C.greenDim,border:`1px solid ${C.greenBd}`,borderRadius:16,padding:"16px 18px",marginBottom:16}}>
                    <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
                      <div style={{width:8,height:8,borderRadius:"50%",background:C.green,animation:"btlerPulse 1.2s ease-in-out infinite"}}/>
                      <span style={{fontSize:10,color:C.green,fontFamily:"'DM Mono',monospace",letterSpacing:".1em",fontWeight:700}}>LIVE STATUS</span>
                    </div>
                    <p style={{fontSize:14,fontWeight:700,color:C.ink,fontFamily:"'DM Sans',sans-serif",margin:"0 0 4px"}}>Waiter has been notified ✓</p>
                    <p style={{fontSize:12,color:C.inkSub,fontFamily:"'DM Sans',sans-serif",margin:0}}>Someone will be at your table shortly...</p>
                  </div>
                  <div style={{background:C.g08,border:`1px solid ${C.g15}`,borderRadius:12,padding:"12px 14px",marginBottom:16,textAlign:"center"}}>
                    <p style={{fontSize:12,color:C.inkSub,margin:0,fontFamily:"'Cormorant Garamond',serif",fontStyle:"italic",lineHeight:1.6}}>
                      {selectedReq?.quote||"\"Your comfort is our commitment.\""}
                    </p>
                  </div>
                  <div style={{display:"flex",gap:9}}>
                    <button onClick={reset} style={{flex:1,padding:"13px",borderRadius:12,background:C.gl1,border:`1px solid ${C.glBd}`,color:C.inkSub,fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>New Request</button>
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
