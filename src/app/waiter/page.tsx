"use client";
import { useState, useEffect, useRef, useCallback } from "react";

// ═══════════════════════════════════════════════════════════
// GOLDEN BEANS — PREMIUM WAITER PAGE
// File: src/app/waiter/page.tsx
// Real-time requests + order delivery management
// ═══════════════════════════════════════════════════════════

const C = {
  void:"#030201", dark:"#0A0806", surface:"#14110C", raise:"#1C1812",
  gold:"#C8922A", goldM:"#E8B84B", goldL:"#F5CC6A",
  ink:"#F5EDD8", inkSub:"#C4AA80", inkDim:"#7A6448",
  gl1:"rgba(255,255,255,0.03)", gl2:"rgba(255,255,255,0.06)",
  glBd:"rgba(255,255,255,0.08)",
  g08:"rgba(200,146,42,0.08)", g15:"rgba(200,146,42,0.15)",
  g25:"rgba(200,146,42,0.25)", g40:"rgba(200,146,42,0.40)",
  green:"#4ADE80", greenDim:"rgba(74,222,128,0.12)", greenBd:"rgba(74,222,128,0.25)",
  red:"#F87171", redDim:"rgba(248,113,113,0.12)", redBd:"rgba(248,113,113,0.25)",
  blue:"#60A5FA", purple:"#C084FC", amber:"#FBBF24",
};
const GG   = `linear-gradient(135deg,${C.gold} 0%,${C.goldM} 52%,${C.goldL} 100%)`;
const EASE = "cubic-bezier(0.25,0.46,0.45,0.94)";
const API  = process.env.NEXT_PUBLIC_API_URL||"https://golden-beans-server.onrender.com/api";

// ── Priority config ──
const PRIORITY_CONFIG = {
  high:   { color:C.red,    bg:C.redDim,   bd:C.redBd,   label:"URGENT",  ring:true  },
  normal: { color:C.gold,   bg:C.g08,      bd:C.g25,     label:"REQUEST", ring:false },
};

// ── Request type config ──
const REQ_CONFIG: Record<string,{icon:string;color:string;label:string}> = {
  waiter:    {icon:"🙋", color:C.gold,   label:"Call Waiter"},
  water:     {icon:"💧", color:C.blue,   label:"Water Refill"},
  bill:      {icon:"🧾", color:C.green,  label:"Request Bill"},
  cutlery:   {icon:"🍴", color:C.goldM,  label:"Extra Cutlery"},
  tissue:    {icon:"🧻", color:C.inkSub, label:"Napkins"},
  condiment: {icon:"🌶️", color:C.red,    label:"Condiments"},
  dessert:   {icon:"🍰", color:C.purple, label:"Dessert Menu"},
  ac:        {icon:"❄️", color:C.blue,   label:"AC Comfort"},
  order:     {icon:"➕", color:C.goldL,  label:"Add to Order"},
  other:     {icon:"💬", color:C.inkSub, label:"Other Request"},
};

function timeAgo(ts: string) {
  const secs = Math.floor((Date.now()-new Date(ts).getTime())/1000);
  if(secs<60) return `${secs}s ago`;
  if(secs<3600) return `${Math.floor(secs/60)}m ago`;
  return `${Math.floor(secs/3600)}h ago`;
}

function elapsedMins(ts: string) {
  return Math.floor((Date.now()-new Date(ts).getTime())/60000);
}

interface WaiterRequest {
  _id: string;
  tableId: string;
  tableNumber: string;
  type: string;
  subType?: string;
  subLabel?: string;
  label: string;
  note?: string;
  priority: "high"|"normal";
  status: "pending"|"acknowledged"|"completed";
  createdAt: string;
  acknowledgedAt?: string;
}

interface ReadyOrder {
  _id: string;
  orderNumber: string;
  tableNumber: string;
  tableId: string;
  customerName?: string;
  items: {name:string;quantity:number;notes?:string}[];
  totalAmount: number;
  createdAt: string;
  status: string;
}

interface WaiterInfo {
  _id: string;
  name: string;
  username: string;
  role: string;
  sessionToken?: string;
}

export default function WaiterPage() {
  const [waiter,    setWaiter   ] = useState<WaiterInfo|null>(null);
  const [requests,  setRequests ] = useState<WaiterRequest[]>([]);
  const [readyOrders,setReadyOrders]=useState<ReadyOrder[]>([]);
  const [activeTab, setActiveTab] = useState<"requests"|"orders">("requests");
  const [loading,   setLoading  ] = useState(true);
  const [completing,setCompleting]=useState<string|null>(null);
  const [justDone,  setJustDone ] = useState<Set<string>>(new Set());
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPin,  setLoginPin ] = useState("");
  const [loginErr,  setLoginErr ] = useState("");
  const [loginLoading,setLoginLoading]=useState(false);
  const [tick,      setTick     ] = useState(0); // For time refresh
  const pollRef = useRef<NodeJS.Timeout|null>(null);

  // Tick every 30s to refresh time displays
  useEffect(()=>{
    const iv=setInterval(()=>setTick(p=>p+1),30000);
    return()=>clearInterval(iv);
  },[]);

  const loadData = useCallback(async()=>{
    if(!waiter) return;
    const token = waiter.sessionToken||"";
    const headers: Record<string,string> = { "Content-Type":"application/json", "x-waiter-token": token };
    try{
      const [rRes, oRes] = await Promise.all([
        fetch(`${API}/waiter/my-requests`, { headers }),
        fetch(`${API}/waiter/ready-orders`, { headers }),
      ]);
      const rData = await rRes.json();
      const oData = await oRes.json();
      if(rData.requests) setRequests(rData.requests);
      if(oData.success && oData.data) setReadyOrders(oData.data);
      else if(Array.isArray(oData)) setReadyOrders(oData);
    }catch{}
    setLoading(false);
  },[waiter]);

  // Poll every 8 seconds
  useEffect(()=>{
    if(!waiter) return;
    loadData();
    pollRef.current=setInterval(loadData,8000);
    return()=>{ if(pollRef.current) clearInterval(pollRef.current); };
  },[waiter,loadData]);

  const handleLogin = async()=>{
    if(!loginUsername.trim()||loginPin.length<4) return;
    setLoginLoading(true);
    setLoginErr("");
    try{
      const res=await fetch(`${API}/waiter/login`,{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({username:loginUsername.trim(),pin:loginPin}),
      });
      const data=await res.json();
      if(data.success&&data.waiter){
        const waiterData = { ...data.waiter, sessionToken: data.sessionToken };
        setWaiter(waiterData);
        localStorage.setItem("gb_waiter",JSON.stringify(waiterData));
      } else {
        setLoginErr(data.error||"Invalid username or PIN. Try again.");
        setLoginPin("");
      }
    }catch{ setLoginErr("Connection failed."); }
    setLoginLoading(false);
  };

  // Check saved session
  useEffect(()=>{
    const saved=localStorage.getItem("gb_waiter");
    if(saved){ try{ setWaiter(JSON.parse(saved)); }catch{} }
  },[]);

  const getAuthHeaders = ()=>({ "Content-Type":"application/json", "x-waiter-token": waiter?.sessionToken||"" });

  const acknowledge=async(id:string)=>{
    try{
      await fetch(`${API}/waiter/requests/${id}/accept`,{method:"PATCH",headers:getAuthHeaders()});
      setRequests(p=>p.map(r=>r._id===id?{...r,status:"acknowledged",acknowledgedAt:new Date().toISOString()}:r));
    }catch{}
  };

  const completeRequest=async(id:string)=>{
    setCompleting(id);
    try{
      await fetch(`${API}/waiter/requests/${id}/complete`,{method:"PATCH",headers:getAuthHeaders()});
      setJustDone(p=>new Set([...p,id]));
      setTimeout(()=>{
        setRequests(p=>p.filter(r=>r._id!==id));
        setJustDone(p=>{ const n=new Set(p); n.delete(id); return n; });
      },1500);
    }catch{}
    setCompleting(null);
  };

  const deliverOrder=async(orderId:string)=>{
    setCompleting(orderId);
    try{
      await fetch(`${API}/waiter/deliver-order/${orderId}`,{method:"PATCH",headers:getAuthHeaders()});
      setJustDone(p=>new Set([...p,orderId]));
      setTimeout(()=>{
        setReadyOrders(p=>p.filter(o=>o._id!==orderId));
        setJustDone(p=>{ const n=new Set(p); n.delete(orderId); return n; });
      },1500);
    }catch{}
    setCompleting(null);
  };

  const pendingReqs   = requests.filter(r=>r.status==="pending");
  const ackReqs       = requests.filter(r=>r.status==="acknowledged");
  const urgentCount   = pendingReqs.filter(r=>r.priority==="high").length;
  const totalBadge    = pendingReqs.length + readyOrders.length;

  // ── LOGIN SCREEN ──
  if(!waiter){
    return(
      <div style={{minHeight:"100dvh",background:C.void,display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
        <div style={{width:"100%",maxWidth:360,background:C.surface,borderRadius:24,
          border:`1px solid ${C.glBd}`,overflow:"hidden",boxShadow:"0 32px 80px rgba(0,0,0,0.8)"}}>
          <div style={{height:3,background:GG}}/>
          <div style={{padding:"28px 24px 32px",textAlign:"center"}}>
            <div style={{fontSize:52,marginBottom:16,animation:"wFloat 3s ease-in-out infinite"}}>🧑‍🍳</div>
            <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:26,fontWeight:600,
              color:C.ink,margin:"0 0 6px"}}>Waiter Login</h2>
            <p style={{fontSize:13,color:C.inkDim,fontFamily:"'DM Sans',sans-serif",
              margin:"0 0 20px"}}>Enter your username and 4-digit PIN</p>

            {/* Username input */}
            <input
              value={loginUsername}
              onChange={e=>setLoginUsername(e.target.value)}
              placeholder="Username (e.g. rahul)"
              autoCapitalize="none"
              style={{width:"100%",padding:"13px 16px",borderRadius:14,
                border:`1.5px solid ${loginUsername?C.g25:C.glBd}`,
                background:C.gl1,color:C.ink,fontSize:14,outline:"none",
                boxSizing:"border-box",marginBottom:16,
                fontFamily:"'DM Sans',sans-serif",
                transition:`all 0.2s ${EASE}`}}/>

            {/* PIN display */}
            <div style={{display:"flex",justifyContent:"center",gap:10,marginBottom:20}}>
              {[0,1,2,3].map(i=>(
                <div key={i} style={{width:52,height:52,borderRadius:14,
                  background:loginPin.length>i?C.g15:C.gl1,
                  border:`1.5px solid ${loginPin.length>i?C.g25:C.glBd}`,
                  display:"flex",alignItems:"center",justifyContent:"center",
                  fontSize:22,color:C.gold,transition:`all 0.2s ${EASE}`}}>
                  {loginPin.length>i?"●":""}
                </div>
              ))}
            </div>

            {/* Keypad */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:16}}>
              {[1,2,3,4,5,6,7,8,9,"",0,"⌫"].map((k,i)=>(
                <button key={i} onClick={()=>{
                  if(k==="") return;
                  if(k==="⌫") setLoginPin(p=>p.slice(0,-1));
                  else if(loginPin.length<4) setLoginPin(p=>p+k);
                }} style={{
                  height:56,borderRadius:14,border:`1px solid ${C.glBd}`,
                  background:k===""?"transparent":C.gl1,
                  color:k==="⌫"?C.red:C.ink,fontSize:k==="⌫"?20:20,
                  fontWeight:600,cursor:k===""?"default":"pointer",
                  fontFamily:"'DM Sans',sans-serif",
                  transition:`all 0.15s ${EASE}`,
                }}>{k}</button>
              ))}
            </div>

            {loginErr&&<p style={{fontSize:12,color:C.red,marginBottom:12,fontFamily:"'DM Sans',sans-serif"}}>{loginErr}</p>}

            <button onClick={handleLogin} disabled={!loginUsername.trim()||loginPin.length<4||loginLoading}
              style={{width:"100%",padding:"15px",borderRadius:14,border:"none",
                background:(loginUsername.trim()&&loginPin.length===4)?GG:C.gl1,
                color:(loginUsername.trim()&&loginPin.length===4)?C.void:C.inkDim,
                fontWeight:700,fontSize:15,
                cursor:(loginUsername.trim()&&loginPin.length===4)?"pointer":"not-allowed",
                fontFamily:"'DM Sans',sans-serif",
                boxShadow:(loginUsername.trim()&&loginPin.length===4)?`0 8px 24px ${C.g40}`:"none",
                transition:`all 0.25s ${EASE}`}}>
              {loginLoading?"Signing in...":"Sign In ✓"}
            </button>
          </div>
        </div>
        <style>{`@keyframes wFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}`}</style>
      </div>
    );
  }

  // ── MAIN WAITER PAGE ──
  return(
    <div style={{minHeight:"100dvh",background:C.void,display:"flex",flexDirection:"column",
      fontFamily:"'DM Sans',sans-serif",color:C.ink,maxWidth:480,margin:"0 auto"}}>

      {/* Header */}
      <div style={{background:C.surface,borderBottom:`1px solid ${C.glBd}`,
        padding:"14px 18px",paddingTop:"calc(14px + env(safe-area-inset-top, 44px))",
        flexShrink:0,position:"sticky",top:0,zIndex:10}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:38,height:38,borderRadius:12,
              background:GG,display:"flex",alignItems:"center",justifyContent:"center",
              fontSize:18,boxShadow:`0 4px 12px ${C.g40}`}}>🧑‍🍳</div>
            <div>
              <p style={{fontSize:15,fontWeight:700,color:C.ink,margin:0}}>{waiter.name}</p>
              <p style={{fontSize:10,color:C.gold,fontFamily:"'DM Mono',monospace",
                letterSpacing:".1em",margin:0}}>
                {waiter.role==="senior_waiter"?"SENIOR WAITER":"WAITER"} · ON SHIFT
              </p>
            </div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            {/* Live indicator */}
            <div style={{display:"flex",alignItems:"center",gap:5,
              background:C.greenDim,border:`1px solid ${C.greenBd}`,
              borderRadius:99,padding:"4px 10px"}}>
              <div style={{width:6,height:6,borderRadius:"50%",background:C.green,
                animation:"wPulse 1.5s ease-in-out infinite"}}/>
              <span style={{fontSize:10,color:C.green,fontFamily:"'DM Mono',monospace",
                letterSpacing:".06em"}}>LIVE</span>
            </div>
            <button onClick={()=>{ localStorage.removeItem("gb_waiter"); setWaiter(null); }}
              style={{width:32,height:32,borderRadius:10,background:C.redDim,
                border:`1px solid ${C.redBd}`,color:C.red,cursor:"pointer",fontSize:14,
                display:"flex",alignItems:"center",justifyContent:"center"}}>⏻</button>
          </div>
        </div>

        {/* Tab bar */}
        <div style={{display:"flex",gap:8}}>
          {([
            {id:"requests",label:"Requests",badge:pendingReqs.length},
            {id:"orders",  label:"Ready Orders",badge:readyOrders.length},
          ] as const).map(tab=>(
            <button key={tab.id} onClick={()=>setActiveTab(tab.id)} style={{
              flex:1,padding:"8px 0",borderRadius:10,border:`1px solid ${activeTab===tab.id?C.g25:C.glBd}`,
              background:activeTab===tab.id?C.g08:"transparent",
              color:activeTab===tab.id?C.goldL:C.inkDim,
              fontWeight:700,fontSize:13,cursor:"pointer",
              display:"flex",alignItems:"center",justifyContent:"center",gap:7,
              transition:`all 0.2s ${EASE}`,
            }}>
              {tab.label}
              {tab.badge>0&&(
                <span style={{background:activeTab===tab.id?C.gold:C.gl2,
                  color:activeTab===tab.id?C.void:C.inkSub,
                  borderRadius:99,padding:"1px 7px",fontSize:10,fontWeight:800}}>
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{flex:1,overflowY:"auto",padding:"14px 14px 24px",scrollbarWidth:"none"}}>

        {/* ── REQUESTS TAB ── */}
        {activeTab==="requests"&&(
          <>
            {/* Urgent banner */}
            {urgentCount>0&&(
              <div style={{background:"rgba(248,113,113,0.1)",border:`1px solid ${C.redBd}`,
                borderRadius:14,padding:"12px 16px",marginBottom:14,
                display:"flex",alignItems:"center",gap:10,
                animation:"wShake 0.4s ease"}}>
                <span style={{fontSize:24}}>🚨</span>
                <div>
                  <p style={{fontSize:13,fontWeight:700,color:C.red,margin:"0 0 2px"}}>
                    {urgentCount} Urgent Request{urgentCount>1?"s":""}!
                  </p>
                  <p style={{fontSize:11,color:"rgba(248,113,113,0.7)",
                    fontFamily:"'DM Mono',monospace",margin:0}}>
                    Attend immediately — high priority
                  </p>
                </div>
              </div>
            )}

            {/* Pending requests */}
            {pendingReqs.length>0&&(
              <div style={{marginBottom:16}}>
                <p style={{fontSize:9,color:C.gold,fontFamily:"'DM Mono',monospace",
                  letterSpacing:".18em",textTransform:"uppercase",margin:"0 0 10px"}}>
                  ⚡ PENDING — {pendingReqs.length} REQUEST{pendingReqs.length>1?"S":""}
                </p>
                <div style={{display:"flex",flexDirection:"column",gap:10}}>
                  {pendingReqs
                    .sort((a,b)=>a.priority==="high"?-1:b.priority==="high"?1:0)
                    .map(req=><RequestCard key={req._id} req={req} onAck={acknowledge} onComplete={completeRequest} completing={completing} justDone={justDone}/>)}
                </div>
              </div>
            )}

            {/* Acknowledged */}
            {ackReqs.length>0&&(
              <div>
                <p style={{fontSize:9,color:C.inkDim,fontFamily:"'DM Mono',monospace",
                  letterSpacing:".18em",textTransform:"uppercase",margin:"0 0 10px"}}>
                  ✓ IN PROGRESS — {ackReqs.length}
                </p>
                <div style={{display:"flex",flexDirection:"column",gap:10}}>
                  {ackReqs.map(req=><RequestCard key={req._id} req={req} onAck={acknowledge} onComplete={completeRequest} completing={completing} justDone={justDone}/>)}
                </div>
              </div>
            )}

            {pendingReqs.length===0&&ackReqs.length===0&&(
              <div style={{textAlign:"center",padding:"60px 20px"}}>
                <div style={{fontSize:52,marginBottom:14}}>✨</div>
                <h3 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,
                  color:C.ink,margin:"0 0 6px"}}>All Clear!</h3>
                <p style={{fontSize:13,color:C.inkDim,margin:0}}>
                  No pending requests right now. Great job!
                </p>
              </div>
            )}
          </>
        )}

        {/* ── READY ORDERS TAB ── */}
        {activeTab==="orders"&&(
          <>
            {readyOrders.length>0&&(
              <div style={{background:C.greenDim,border:`1px solid ${C.greenBd}`,
                borderRadius:14,padding:"12px 16px",marginBottom:14,
                display:"flex",alignItems:"center",gap:10}}>
                <span style={{fontSize:22}}>🍽️</span>
                <div>
                  <p style={{fontSize:13,fontWeight:700,color:C.green,margin:"0 0 2px"}}>
                    {readyOrders.length} Order{readyOrders.length>1?"s":""} Ready to Serve!
                  </p>
                  <p style={{fontSize:11,color:"rgba(74,222,128,0.7)",margin:0,
                    fontFamily:"'DM Mono',monospace"}}>
                    Pick up from kitchen and deliver to table
                  </p>
                </div>
              </div>
            )}

            <div style={{display:"flex",flexDirection:"column",gap:12}}>
              {readyOrders.map(order=>(
                <OrderCard key={order._id} order={order} onDeliver={deliverOrder} completing={completing} justDone={justDone}/>
              ))}
            </div>

            {readyOrders.length===0&&(
              <div style={{textAlign:"center",padding:"60px 20px"}}>
                <div style={{fontSize:52,marginBottom:14}}>👨‍🍳</div>
                <h3 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,
                  color:C.ink,margin:"0 0 6px"}}>Kitchen is busy!</h3>
                <p style={{fontSize:13,color:C.inkDim,margin:0}}>
                  Orders will appear here when ready.
                </p>
              </div>
            )}
          </>
        )}
      </div>

      <style>{`
        @keyframes wPulse  { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(1.3)} }
        @keyframes wShake  { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-4px)} 75%{transform:translateX(4px)} }
        @keyframes wSlideIn{ from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes wDone   { 0%{opacity:1;transform:scale(1)} 100%{opacity:0;transform:scale(0.92)} }
      `}</style>
    </div>
  );
}

// ── Request Card ──
function RequestCard({req,onAck,onComplete,completing,justDone}:{
  req:WaiterRequest;
  onAck:(id:string)=>void;
  onComplete:(id:string)=>void;
  completing:string|null;
  justDone:Set<string>;
}) {
  const cfg     = REQ_CONFIG[req.type]||REQ_CONFIG.other;
  const priCfg  = PRIORITY_CONFIG[req.priority];
  const mins    = elapsedMins(req.createdAt);
  const isUrgent= req.priority==="high";
  const isPending= req.status==="pending";
  const isDone  = justDone.has(req._id);
  const isBusy  = completing===req._id;

  return(
    <div style={{
      background:isUrgent?"rgba(248,113,113,0.06)":C.gl1,
      border:`1.5px solid ${isUrgent?C.redBd:isPending?C.g15:C.glBd}`,
      borderRadius:18,overflow:"hidden",
      animation:isDone?`wDone 0.4s ${EASE} forwards`:`wSlideIn 0.3s ${EASE}`,
      transition:`all 0.2s ease`,
      boxShadow:isUrgent?`0 0 20px rgba(248,113,113,0.1)`:isPending?`0 0 20px ${C.g08}`:"none",
    }}>
      {/* Priority bar */}
      <div style={{height:2,background:isUrgent?C.red:C.gold,
        animation:isUrgent?"wPulse 1.5s ease-in-out infinite":"none"}}/>

      <div style={{padding:"14px 16px"}}>
        {/* Header row */}
        <div style={{display:"flex",alignItems:"flex-start",gap:12,marginBottom:12}}>
          {/* Icon */}
          <div style={{width:44,height:44,borderRadius:13,flexShrink:0,
            background:isUrgent?C.redDim:C.g08,
            border:`1px solid ${isUrgent?C.redBd:C.g15}`,
            display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,
            boxShadow:isUrgent?`0 0 12px rgba(248,113,113,0.2)`:"none"}}>
            {cfg.icon}
          </div>

          <div style={{flex:1,minWidth:0}}>
            <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap",marginBottom:3}}>
              <span style={{fontSize:14,fontWeight:700,color:C.ink}}>{cfg.label}</span>
              {req.subLabel&&(
                <span style={{fontSize:11,color:C.gold,fontFamily:"'DM Mono',monospace",
                  background:C.g08,border:`1px solid ${C.g15}`,borderRadius:6,
                  padding:"1px 7px"}}>
                  {req.subLabel}
                </span>
              )}
              <span style={{fontSize:9,fontWeight:800,letterSpacing:".08em",
                background:priCfg.bg,color:priCfg.color,
                border:`1px solid ${priCfg.bd}`,borderRadius:99,
                padding:"1px 8px",fontFamily:"'DM Mono',monospace"}}>
                {priCfg.label}
              </span>
            </div>

            {/* Table + time */}
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <span style={{fontSize:13,fontWeight:800,color:C.goldL,
                background:C.g08,border:`1px solid ${C.g15}`,
                borderRadius:8,padding:"2px 10px"}}>
                🪑 Table {req.tableNumber}
              </span>
              <span style={{fontSize:11,color:mins>5?C.red:C.inkDim,
                fontFamily:"'DM Mono',monospace",fontWeight:mins>5?700:400}}>
                ⏱ {mins}m ago{mins>5?" — LONG WAIT!":""}
              </span>
            </div>
          </div>
        </div>

        {/* Note */}
        {req.note&&req.note.trim()&&(
          <div style={{background:C.g08,border:`1px solid ${C.g15}`,
            borderRadius:10,padding:"9px 12px",marginBottom:12,
            display:"flex",gap:8,alignItems:"flex-start"}}>
            <span style={{fontSize:14,flexShrink:0}}>📝</span>
            <p style={{fontSize:12,color:C.inkSub,margin:0,lineHeight:1.5,
              fontFamily:"'DM Sans',sans-serif"}}>
              <strong style={{color:C.ink}}>Note:</strong> {req.note}
            </p>
          </div>
        )}

        {/* Acknowledged info */}
        {req.status==="acknowledged"&&req.acknowledgedAt&&(
          <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:12,
            background:C.greenDim,border:`1px solid ${C.greenBd}`,
            borderRadius:8,padding:"6px 10px"}}>
            <div style={{width:5,height:5,borderRadius:"50%",background:C.green,
              animation:"wPulse 1.5s ease-in-out infinite"}}/>
            <span style={{fontSize:11,color:C.green,fontFamily:"'DM Mono',monospace"}}>
              Acknowledged · On the way
            </span>
          </div>
        )}

        {/* Action buttons */}
        <div style={{display:"flex",gap:9}}>
          {isPending&&(
            <button onClick={()=>onAck(req._id)}
              style={{flex:1,padding:"10px 0",borderRadius:10,
                background:C.g08,border:`1px solid ${C.g25}`,
                color:C.goldL,fontWeight:700,fontSize:13,cursor:"pointer",
                fontFamily:"'DM Sans',sans-serif",display:"flex",
                alignItems:"center",justifyContent:"center",gap:6}}>
              👀 On My Way
            </button>
          )}
          <button onClick={()=>onComplete(req._id)} disabled={isBusy}
            style={{flex:2,padding:"10px 0",borderRadius:10,border:"none",
              background:isBusy?"rgba(74,222,128,0.2)":
                isDone?"rgba(74,222,128,0.3)":
                `linear-gradient(135deg,${C.green},#22C55E)`,
              color:C.void,fontWeight:800,fontSize:13,
              cursor:isBusy?"not-allowed":"pointer",
              fontFamily:"'DM Sans',sans-serif",
              display:"flex",alignItems:"center",justifyContent:"center",gap:6,
              boxShadow:isBusy?"none":`0 4px 16px rgba(74,222,128,0.3)`,
              transition:`all 0.2s ${EASE}`}}>
            {isDone?"✓ Done!":isBusy?"...":"✓ Mark Complete"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Order Card ──
function OrderCard({order,onDeliver,completing,justDone}:{
  order:ReadyOrder;
  onDeliver:(id:string)=>void;
  completing:string|null;
  justDone:Set<string>;
}) {
  const mins   = elapsedMins(order.createdAt);
  const isDone = justDone.has(order._id);
  const isBusy = completing===order._id;

  return(
    <div style={{
      background:C.greenDim,
      border:`1.5px solid ${C.greenBd}`,
      borderRadius:18,overflow:"hidden",
      animation:isDone?`wDone 0.4s ease forwards`:`wSlideIn 0.3s ease`,
      boxShadow:`0 0 20px rgba(74,222,128,0.08)`,
    }}>
      <div style={{height:2,background:C.green}}/>
      <div style={{padding:"14px 16px"}}>

        {/* Order header */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:42,height:42,borderRadius:12,
              background:"rgba(74,222,128,0.15)",border:`1px solid ${C.greenBd}`,
              display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>
              🍽️
            </div>
            <div>
              <p style={{fontSize:15,fontWeight:800,color:C.green,margin:"0 0 2px",
                fontFamily:"'Cormorant Garamond',serif"}}>
                Order #{order.orderNumber}
              </p>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <span style={{fontSize:13,fontWeight:800,color:C.goldL,
                  background:C.g08,border:`1px solid ${C.g15}`,
                  borderRadius:8,padding:"2px 10px"}}>
                  🪑 Table {order.tableNumber}
                </span>
                {order.customerName&&(
                  <span style={{fontSize:11,color:C.inkSub}}>
                    {order.customerName}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div style={{textAlign:"right"}}>
            <p style={{fontSize:11,color:mins>10?C.red:C.inkDim,
              fontFamily:"'DM Mono',monospace",margin:"0 0 2px",
              fontWeight:mins>10?700:400}}>
              {mins}m waiting{mins>10?" ⚠️":""}
            </p>
            <p style={{fontSize:13,fontWeight:700,color:C.goldL,margin:0}}>
              ₹{order.totalAmount}
            </p>
          </div>
        </div>

        {/* Items list — CRITICAL for waiter accuracy */}
        <div style={{background:"rgba(0,0,0,0.2)",borderRadius:12,
          padding:"10px 12px",marginBottom:12,
          border:`1px solid rgba(74,222,128,0.15)`}}>
          <p style={{fontSize:9,color:C.green,fontFamily:"'DM Mono',monospace",
            letterSpacing:".15em",textTransform:"uppercase",margin:"0 0 8px"}}>
            ORDER ITEMS — VERIFY BEFORE DELIVERY
          </p>
          {order.items.map((item,i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",
              justifyContent:"space-between",
              padding:"6px 0",
              borderBottom:i<order.items.length-1?`1px solid rgba(255,255,255,0.06)`:"none"}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <span style={{width:22,height:22,borderRadius:6,
                  background:"rgba(74,222,128,0.15)",
                  display:"flex",alignItems:"center",justifyContent:"center",
                  fontSize:10,color:C.green,fontWeight:800,flexShrink:0}}>
                  {item.quantity}
                </span>
                <span style={{fontSize:13,color:C.ink,fontWeight:500}}>
                  {item.name}
                </span>
              </div>
              {item.notes&&(
                <span style={{fontSize:10,color:C.amber,fontFamily:"'DM Mono',monospace",
                  maxWidth:120,textAlign:"right",lineHeight:1.3}}>
                  {item.notes}
                </span>
              )}
            </div>
          ))}
          <div style={{display:"flex",justifyContent:"space-between",
            marginTop:8,paddingTop:8,
            borderTop:`1px solid rgba(74,222,128,0.2)`}}>
            <span style={{fontSize:10,color:C.inkDim,fontFamily:"'DM Mono',monospace"}}>
              {order.items.reduce((s,i)=>s+i.quantity,0)} items total
            </span>
            <span style={{fontSize:10,color:C.green,fontFamily:"'DM Mono',monospace",
              fontWeight:700}}>
              ✓ VERIFY ALL ITEMS
            </span>
          </div>
        </div>

        {/* Deliver button */}
        <button onClick={()=>onDeliver(order._id)} disabled={isBusy}
          style={{width:"100%",padding:"14px",borderRadius:12,border:"none",
            background:isBusy?"rgba(74,222,128,0.2)":
              isDone?"rgba(74,222,128,0.4)":
              `linear-gradient(135deg,${C.green},#22C55E)`,
            color:C.void,fontWeight:800,fontSize:15,
            cursor:isBusy?"not-allowed":"pointer",
            fontFamily:"'DM Sans',sans-serif",
            display:"flex",alignItems:"center",justifyContent:"center",gap:9,
            boxShadow:isBusy?"none":`0 6px 20px rgba(74,222,128,0.35)`,
            transition:`all 0.2s ease`}}>
          {isDone?"✓ Delivered!"
            :isBusy?"Delivering..."
            :<><span>🚀</span> Deliver to Table {order.tableNumber}</>}
        </button>
      </div>
    </div>
  );
}
