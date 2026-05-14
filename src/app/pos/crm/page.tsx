"use client";

import { useState, useEffect, useCallback } from "react";
import POSSidebar from "@/components/POSSidebar";

// ═══════════════════════════════════════════════════
// GOLDEN BEANS — CRM & LOYALTY DASHBOARD
// File: src/app/pos/crm/page.tsx
// ═══════════════════════════════════════════════════

const API = process.env.NEXT_PUBLIC_API_URL || "https://golden-beans-server.onrender.com/api";

const T = {
  bg0:"#0A0804",bg1:"#0F0D09",bg2:"#16130E",bg3:"#1E1A13",bg4:"#26221A",
  gold:"#C8922A",goldM:"#E8B84B",goldL:"#F5CC6A",
  ink:"#F0E8D8",inkS:"#A89878",inkD:"#5C5040",inkG:"#2E2820",
  gl1:"rgba(255,255,255,0.025)",gl2:"rgba(255,255,255,0.05)",
  gl3:"rgba(255,255,255,0.08)",glBd:"rgba(255,255,255,0.07)",
  g08:"rgba(200,146,42,0.08)",g15:"rgba(200,146,42,0.15)",
  g25:"rgba(200,146,42,0.25)",g40:"rgba(200,146,42,0.40)",
  green:"#2E7D52",greenL:"rgba(46,125,82,0.15)",
  red:"#C0392B",redL:"rgba(192,57,43,0.12)",
  blue:"#2563EB",blueL:"rgba(37,99,235,0.12)",
};
const GG = `linear-gradient(135deg,${T.gold} 0%,${T.goldM} 52%,${T.goldL} 100%)`;
const EA = "cubic-bezier(0.25,0.46,0.45,0.94)";

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&family=DM+Mono:wght@400;500&display=swap');
*{box-sizing:border-box;-webkit-font-smoothing:antialiased;}
.hs{scrollbar-width:none;-ms-overflow-style:none;}
.hs::-webkit-scrollbar{display:none;}
.crm-row:hover{background:rgba(255,255,255,0.03)!important;cursor:pointer;}
.crm-btn:hover{filter:brightness(1.1);transform:translateY(-1px);}
.crm-btn:active{transform:scale(0.97)!important;}
.crm-input:focus{border-color:rgba(200,146,42,0.65)!important;box-shadow:0 0 0 3px rgba(200,146,42,0.1)!important;outline:none;}
@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
@keyframes spin{to{transform:rotate(360deg)}}
`;

const TIER_CFG: Record<string,{label:string;color:string;icon:string;min:number}> = {
  bronze:   {label:"Bronze",  color:"#CD7F32",icon:"🥉",min:0},
  silver:   {label:"Silver",  color:"#C0C0C0",icon:"🥈",min:500},
  gold:     {label:"Gold",    color:"#C8922A",icon:"🥇",min:1000},
  platinum: {label:"Platinum",color:"#E5E4E2",icon:"💎",min:2000},
};

interface Customer {
  _id:string; name:string; phone:string;
  totalPoints:number; totalOrders:number; totalSpent:number;
  tier:"bronze"|"silver"|"gold"|"platinum";
  visits:number; firstVisit:string; lastVisit:string;
  isActive:boolean;
}

interface LoyaltyTx {
  _id:string; type:string; points:number; balance:number;
  description:string; orderAmount?:number; createdAt:string;
}

export default function CRMPage() {
  const [customers,  setCustomers ] = useState<Customer[]>([]);
  const [loading,    setLoading   ] = useState(true);
  const [search,     setSearch    ] = useState("");
  const [tierFilter, setTierFilter] = useState("all");
  const [selected,   setSelected  ] = useState<Customer|null>(null);
  const [txHistory,  setTxHistory ] = useState<LoyaltyTx[]>([]);
  const [txLoading,  setTxLoading ] = useState(false);
  const [addPoints,  setAddPoints ] = useState("");
  const [addNote,    setAddNote   ] = useState("");
  const [addingPts,  setAddingPts ] = useState(false);
  const [stats,      setStats     ] = useState({total:0,active:0,totalPts:0,avgSpent:0});

  const load = useCallback(async()=>{
    setLoading(true);
    try {
      const r = await fetch(`${API}/customers/all`).then(r=>r.json());
      if(r.success) {
        setCustomers(r.data||[]);
        const data:Customer[] = r.data||[];
        setStats({
          total:   data.length,
          active:  data.filter(c=>c.isActive).length,
          totalPts:data.reduce((s,c)=>s+c.totalPoints,0),
          avgSpent:data.length ? Math.round(data.reduce((s,c)=>s+c.totalSpent,0)/data.length) : 0,
        });
      }
    } catch { /* server route may not exist yet */ }
    setLoading(false);
  },[]);

  useEffect(()=>{ load(); },[load]);

  const loadHistory = async(id:string)=>{
    setTxLoading(true);
    try {
      const r = await fetch(`${API}/customers/${id}/history`).then(r=>r.json());
      if(r.success) setTxHistory(r.data||[]);
    } catch { setTxHistory([]); }
    setTxLoading(false);
  };

  const handleSelect = (c:Customer)=>{
    setSelected(c); setTxHistory([]); setAddPoints(""); setAddNote("");
    loadHistory(c._id);
  };

  const handleAddPoints = async()=>{
    if(!selected||!addPoints) return;
    setAddingPts(true);
    try {
      const pts = Number(addPoints);
      const r = await fetch(`${API}/customers/${selected._id}/earn`,{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({orderAmount: pts*10, orderId:null}), // pts*10 so calcPoints gives pts
      }).then(r=>r.json());
      if(r.success){
        setSelected(prev=>prev?{...prev,totalPoints:r.newBalance,tier:r.newTier}:prev);
        setCustomers(cs=>cs.map(c=>c._id===selected._id?{...c,totalPoints:r.newBalance}:c));
        loadHistory(selected._id);
        setAddPoints(""); setAddNote("");
      }
    } catch {}
    setAddingPts(false);
  };

  // Filter
  const filtered = customers.filter(c=>{
    const matchSearch = !search || c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search);
    const matchTier = tierFilter==="all" || c.tier===tierFilter;
    return matchSearch && matchTier;
  });

  return(
    <div style={{display:"flex",minHeight:"100vh",background:T.bg0}}>
      <POSSidebar/>
      <div style={{flex:1,marginLeft:"64px",display:"flex",flexDirection:"column",
        height:"100vh",overflow:"hidden",color:T.ink,fontFamily:"'DM Sans',sans-serif"}}>
      <style>{CSS}</style>

      {/* ── HEADER ── */}
      <div style={{padding:"18px 22px 14px",flexShrink:0,borderBottom:`1px solid ${T.gl2}`}}>
        <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between"}}>
          <div>
            <h1 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:26,fontWeight:600,
              color:T.ink,margin:"0 0 3px"}}>
              CRM &amp; Loyalty
            </h1>
            <p style={{fontSize:12.5,color:T.inkS,margin:0}}>
              Manage customers, points &amp; loyalty tiers
            </p>
          </div>
          <button onClick={load} className="crm-btn"
            style={{display:"flex",alignItems:"center",gap:7,padding:"9px 16px",
              borderRadius:10,border:`1px solid ${T.glBd}`,
              background:T.gl1,color:T.inkS,fontSize:12.5,cursor:"pointer",
              fontFamily:"'DM Sans',sans-serif",transition:`all 0.2s ${EA}`}}>
            🔄 Refresh
          </button>
        </div>

        {/* Stats row */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:9,marginTop:14}}>
          {[
            {l:"Total Customers",v:String(stats.total),   icon:"👥",color:T.gold},
            {l:"Active Members", v:String(stats.active),  icon:"✅",color:T.green},
            {l:"Total Points",   v:String(stats.totalPts),icon:"🫘",color:T.goldM},
            {l:"Avg. Spend",     v:`₹${stats.avgSpent}`, icon:"💰",color:"#4FC3F7"},
          ].map(s=>(
            <div key={s.l} style={{background:T.bg2,borderRadius:11,padding:"11px 13px",
              border:`1px solid ${T.glBd}`}}>
              <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}>
                <span style={{fontSize:15}}>{s.icon}</span>
              </div>
              <p style={{fontFamily:"'DM Mono',monospace",fontSize:20,fontWeight:500,
                color:s.color,margin:"0 0 1px",lineHeight:1}}>{s.v}</p>
              <p style={{fontSize:10.5,color:T.inkD,margin:0}}>{s.l}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div style={{flex:1,display:"flex",gap:0,overflow:"hidden"}}>

        {/* LEFT — Customer List */}
        <div style={{width:420,display:"flex",flexDirection:"column",
          borderRight:`1px solid ${T.gl2}`,flexShrink:0}}>

          {/* Search + Filter */}
          <div style={{padding:"12px 14px",borderBottom:`1px solid ${T.gl2}`,flexShrink:0}}>
            <div style={{position:"relative",marginBottom:9}}>
              <span style={{position:"absolute",left:11,top:"50%",
                transform:"translateY(-50%)",fontSize:14,color:T.inkD,pointerEvents:"none"}}>🔍</span>
              <input className="crm-input" value={search}
                onChange={e=>setSearch(e.target.value)}
                placeholder="Search by name or phone..."
                style={{width:"100%",padding:"9px 12px 9px 34px",borderRadius:10,
                  border:`1px solid ${T.glBd}`,background:T.gl1,color:T.ink,
                  fontSize:13,fontFamily:"'DM Sans',sans-serif"}}/>
            </div>
            {/* Tier filter pills */}
            <div style={{display:"flex",gap:6}}>
              {["all","bronze","silver","gold","platinum"].map(t=>(
                <button key={t} onClick={()=>setTierFilter(t)} className="crm-btn"
                  style={{padding:"4px 11px",borderRadius:99,
                    border:`1px solid ${tierFilter===t?"rgba(200,146,42,0.5)":T.glBd}`,
                    background:tierFilter===t?T.g15:T.gl1,
                    color:tierFilter===t?T.goldL:T.inkS,
                    fontSize:11,cursor:"pointer",fontFamily:"'DM Mono',monospace",
                    fontWeight:tierFilter===t?700:400,
                    transition:`all 0.2s ${EA}`,
                    textTransform:"capitalize"}}>
                  {t==="all"?"All":TIER_CFG[t]?.icon+" "+t.charAt(0).toUpperCase()+t.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Customer rows */}
          <div className="hs" style={{flex:1,overflowY:"auto"}}>
            {loading ? (
              <div style={{display:"flex",flexDirection:"column",gap:6,padding:12}}>
                {[1,2,3,4,5,6].map(i=>(
                  <div key={i} style={{height:64,borderRadius:11,
                    background:T.bg2,animation:"fadeIn 0.3s ease"}}/>
                ))}
              </div>
            ) : filtered.length===0 ? (
              <div style={{textAlign:"center",padding:"44px 20px"}}>
                <div style={{fontSize:40,marginBottom:10,opacity:.3}}>👥</div>
                <p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:18,
                  color:T.inkS,margin:"0 0 5px"}}>
                  {search ? `No results for "${search}"` : "No customers yet"}
                </p>
                <p style={{fontSize:12,color:T.inkD}}>
                  {search ? "Try a different search" : "Customers appear after first registration"}
                </p>
              </div>
            ) : (
              filtered.map((c,i)=>{
                const tier = TIER_CFG[c.tier];
                const isSelected = selected?._id===c._id;
                return(
                  <div key={c._id} onClick={()=>handleSelect(c)}
                    className="crm-row"
                    style={{
                      display:"flex",alignItems:"center",gap:11,
                      padding:"11px 14px",
                      background:isSelected?T.g08:"transparent",
                      borderLeft:`3px solid ${isSelected?T.gold:"transparent"}`,
                      borderBottom:`1px solid ${T.gl1}`,
                      transition:`all 0.18s ${EA}`,
                      animation:`fadeIn 0.3s ${i*.03}s ease both`,
                    }}>
                    {/* Avatar */}
                    <div style={{width:40,height:40,borderRadius:12,flexShrink:0,
                      background:`linear-gradient(135deg,${tier.color}30,${tier.color}10)`,
                      border:`1.5px solid ${tier.color}50`,
                      display:"flex",alignItems:"center",justifyContent:"center",
                      fontSize:18}}>
                      {tier.icon}
                    </div>
                    {/* Info */}
                    <div style={{flex:1,minWidth:0}}>
                      <p style={{fontSize:13.5,fontWeight:600,color:T.ink,
                        margin:"0 0 2px",whiteSpace:"nowrap",
                        overflow:"hidden",textOverflow:"ellipsis"}}>
                        {c.name}
                      </p>
                      <p style={{fontSize:10.5,color:T.inkD,
                        fontFamily:"'DM Mono',monospace",margin:0}}>
                        {c.phone} · {c.visits} visits
                      </p>
                    </div>
                    {/* Points */}
                    <div style={{textAlign:"right",flexShrink:0}}>
                      <p style={{fontFamily:"'DM Mono',monospace",fontSize:14,
                        fontWeight:600,color:T.gold,margin:"0 0 1px",lineHeight:1}}>
                        {c.totalPoints}
                      </p>
                      <p style={{fontSize:9.5,color:T.inkD,margin:0}}>pts</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Count */}
          <div style={{padding:"8px 14px",borderTop:`1px solid ${T.gl2}`,flexShrink:0}}>
            <p style={{fontSize:11,color:T.inkD,fontFamily:"'DM Mono',monospace",margin:0}}>
              {filtered.length} of {customers.length} customers
            </p>
          </div>
        </div>

        {/* RIGHT — Customer Detail */}
        {!selected ? (
          <div style={{flex:1,display:"flex",flexDirection:"column",
            alignItems:"center",justifyContent:"center",padding:28,textAlign:"center"}}>
            <div style={{fontSize:48,marginBottom:14,opacity:.3}}>👤</div>
            <p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:20,
              color:T.inkS,margin:"0 0 6px"}}>Select a customer</p>
            <p style={{fontSize:12.5,color:T.inkD}}>
              Click any customer to view details &amp; manage points
            </p>
          </div>
        ) : (
          <div className="hs" style={{flex:1,overflowY:"auto",display:"flex",
            flexDirection:"column",gap:0}}>

            {/* Profile header */}
            <div style={{padding:"18px 20px 14px",borderBottom:`1px solid ${T.gl2}`,
              background:`radial-gradient(ellipse 120% 100% at 80% 0%,rgba(60,30,8,0.6),transparent)`,
              flexShrink:0}}>
              <div style={{display:"flex",alignItems:"flex-start",gap:14,marginBottom:14}}>
                {/* Avatar */}
                <div style={{width:56,height:56,borderRadius:16,flexShrink:0,
                  background:`linear-gradient(135deg,${TIER_CFG[selected.tier].color}30,${TIER_CFG[selected.tier].color}10)`,
                  border:`2px solid ${TIER_CFG[selected.tier].color}60`,
                  display:"flex",alignItems:"center",justifyContent:"center",fontSize:24}}>
                  {TIER_CFG[selected.tier].icon}
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,
                    fontWeight:600,color:T.ink,margin:"0 0 3px"}}>{selected.name}</h2>
                  <p style={{fontSize:12,color:T.inkS,fontFamily:"'DM Mono',monospace",
                    margin:"0 0 5px",letterSpacing:".04em"}}>{selected.phone}</p>
                  <span style={{fontSize:10,padding:"2px 10px",borderRadius:99,
                    background:`${TIER_CFG[selected.tier].color}20`,
                    color:TIER_CFG[selected.tier].color,
                    border:`1px solid ${TIER_CFG[selected.tier].color}40`,
                    fontFamily:"'DM Mono',monospace",fontWeight:700}}>
                    {TIER_CFG[selected.tier].icon} {TIER_CFG[selected.tier].label} Member
                  </span>
                </div>
              </div>

              {/* Stats */}
              <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8}}>
                {[
                  {l:"Points",  v:String(selected.totalPoints),gold:true},
                  {l:"Orders",  v:String(selected.totalOrders)},
                  {l:"Spent",   v:`₹${selected.totalSpent}`},
                  {l:"Visits",  v:String(selected.visits)},
                ].map(s=>(
                  <div key={s.l} style={{background:T.gl1,borderRadius:10,
                    padding:"9px 10px",textAlign:"center",
                    border:`1px solid ${(s as any).gold?"rgba(200,146,42,0.3)":T.glBd}`}}>
                    <p style={{fontFamily:"'DM Mono',monospace",fontSize:17,fontWeight:500,
                      color:(s as any).gold?T.goldL:T.ink,margin:"0 0 1px",lineHeight:1}}>
                      {s.v}
                    </p>
                    <p style={{fontSize:9.5,color:T.inkD,margin:0}}>{s.l}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Admin Actions */}
            <div style={{padding:"14px 20px",borderBottom:`1px solid ${T.gl2}`,flexShrink:0}}>
              <p style={{fontSize:10,color:T.gold,fontFamily:"'DM Mono',monospace",
                letterSpacing:".14em",textTransform:"uppercase",margin:"0 0 10px"}}>
                ✦ Admin Actions
              </p>

              {/* Add/Deduct Points */}
              <div style={{background:T.bg2,borderRadius:13,padding:"13px 14px",
                border:`1px solid ${T.glBd}`,marginBottom:10}}>
                <p style={{fontSize:11.5,fontWeight:700,color:T.inkS,
                  margin:"0 0 10px",fontFamily:"'DM Sans',sans-serif"}}>
                  Manually Adjust Points
                </p>
                <div style={{display:"flex",gap:8,marginBottom:7}}>
                  <input className="crm-input" type="number" value={addPoints}
                    onChange={e=>setAddPoints(e.target.value)}
                    placeholder="Points amount"
                    style={{flex:1,padding:"9px 12px",borderRadius:9,
                      border:`1px solid ${T.glBd}`,background:T.gl1,
                      color:T.ink,fontSize:13,fontFamily:"'DM Mono',monospace"}}/>
                  <input className="crm-input" value={addNote}
                    onChange={e=>setAddNote(e.target.value)}
                    placeholder="Reason (optional)"
                    style={{flex:2,padding:"9px 12px",borderRadius:9,
                      border:`1px solid ${T.glBd}`,background:T.gl1,
                      color:T.ink,fontSize:13,fontFamily:"'DM Sans',sans-serif"}}/>
                </div>
                <div style={{display:"flex",gap:8}}>
                  <button onClick={handleAddPoints} disabled={!addPoints||addingPts}
                    className="crm-btn"
                    style={{flex:1,padding:"8px 0",borderRadius:9,border:"none",
                      background:addPoints?GG:T.gl1,
                      color:addPoints?T.bg0:T.inkD,fontWeight:700,fontSize:12.5,
                      cursor:addPoints?"pointer":"not-allowed",
                      fontFamily:"'DM Sans',sans-serif",
                      boxShadow:addPoints?`0 4px 14px ${T.g40}`:"none",
                      display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
                    {addingPts
                      ?<><div style={{width:13,height:13,borderRadius:"50%",
                          border:`2px solid rgba(0,0,0,0.2)`,borderTopColor:"rgba(0,0,0,0.6)",
                          animation:"spin .75s linear infinite"}}/>Adding...</>
                      :<>🫘 Add Points</>}
                  </button>
                  <button onClick={async()=>{
                    if(!addPoints||!selected) return;
                    // Deduct via redeem
                    setAddingPts(true);
                    try {
                      await fetch(`${API}/customers/${selected._id}/redeem`,{
                        method:"POST",headers:{"Content-Type":"application/json"},
                        body:JSON.stringify({pointsToRedeem:Number(addPoints)}),
                      }).then(r=>r.json());
                      loadHistory(selected._id);
                      setAddPoints("");
                      load();
                    } catch {}
                    setAddingPts(false);
                  }} disabled={!addPoints||addingPts}
                    className="crm-btn"
                    style={{flex:1,padding:"8px 0",borderRadius:9,
                      border:`1px solid ${addPoints?"rgba(192,57,43,0.4)":T.glBd}`,
                      background:addPoints?"rgba(192,57,43,0.08)":"transparent",
                      color:addPoints?"#F87171":T.inkD,fontWeight:700,fontSize:12.5,
                      cursor:addPoints?"pointer":"not-allowed",
                      fontFamily:"'DM Sans',sans-serif"}}>
                    Deduct
                  </button>
                </div>
              </div>

              {/* Quick info */}
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                <div style={{background:T.bg2,borderRadius:11,padding:"10px 12px",
                  border:`1px solid ${T.glBd}`}}>
                  <p style={{fontSize:10,color:T.inkD,fontFamily:"'DM Mono',monospace",
                    letterSpacing:".08em",textTransform:"uppercase",margin:"0 0 3px"}}>
                    First Visit
                  </p>
                  <p style={{fontSize:12.5,color:T.ink,fontFamily:"'DM Sans',sans-serif",margin:0}}>
                    {new Date(selected.firstVisit).toLocaleDateString("en-IN",
                      {day:"numeric",month:"short",year:"numeric"})}
                  </p>
                </div>
                <div style={{background:T.bg2,borderRadius:11,padding:"10px 12px",
                  border:`1px solid ${T.glBd}`}}>
                  <p style={{fontSize:10,color:T.inkD,fontFamily:"'DM Mono',monospace",
                    letterSpacing:".08em",textTransform:"uppercase",margin:"0 0 3px"}}>
                    Last Visit
                  </p>
                  <p style={{fontSize:12.5,color:T.ink,fontFamily:"'DM Sans',sans-serif",margin:0}}>
                    {new Date(selected.lastVisit).toLocaleDateString("en-IN",
                      {day:"numeric",month:"short",year:"numeric"})}
                  </p>
                </div>
              </div>
            </div>

            {/* Transaction History */}
            <div style={{padding:"14px 20px",flex:1}}>
              <p style={{fontSize:10,color:T.gold,fontFamily:"'DM Mono',monospace",
                letterSpacing:".14em",textTransform:"uppercase",margin:"0 0 12px"}}>
                ✦ Points History
              </p>

              {txLoading ? (
                <div style={{display:"flex",justifyContent:"center",padding:24}}>
                  <div style={{width:22,height:22,borderRadius:"50%",
                    border:`2.5px solid ${T.glBd}`,borderTopColor:T.gold,
                    animation:"spin .75s linear infinite"}}/>
                </div>
              ) : txHistory.length===0 ? (
                <div style={{textAlign:"center",padding:"24px 0"}}>
                  <p style={{fontSize:13,color:T.inkD}}>No transactions yet</p>
                </div>
              ) : (
                <div style={{display:"flex",flexDirection:"column",gap:7}}>
                  {txHistory.map((tx,i)=>{
                    const isEarn = tx.points > 0;
                    return(
                      <div key={tx._id||i}
                        style={{background:T.bg2,borderRadius:11,padding:"10px 12px",
                          border:`1px solid ${T.glBd}`,
                          display:"flex",alignItems:"center",gap:10,
                          animation:`fadeIn 0.3s ${i*.04}s ease both`}}>
                        <div style={{width:34,height:34,borderRadius:9,flexShrink:0,
                          background:isEarn?T.greenL:T.redL,
                          border:`1px solid ${isEarn?"rgba(46,125,82,0.3)":"rgba(192,57,43,0.25)"}`,
                          display:"flex",alignItems:"center",justifyContent:"center",
                          fontSize:16}}>
                          {tx.type==="bonus"?"🎉":isEarn?"🫘":"🔓"}
                        </div>
                        <div style={{flex:1,minWidth:0}}>
                          <p style={{fontSize:12.5,fontWeight:600,color:T.ink,
                            fontFamily:"'DM Sans',sans-serif",margin:"0 0 1px",
                            whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>
                            {tx.description}
                          </p>
                          <p style={{fontSize:10,color:T.inkD,
                            fontFamily:"'DM Mono',monospace",margin:0}}>
                            {new Date(tx.createdAt).toLocaleDateString("en-IN",
                              {day:"numeric",month:"short"})}
                            {" · "}Bal: {tx.balance}
                          </p>
                        </div>
                        <div style={{textAlign:"right",flexShrink:0}}>
                          <p style={{fontFamily:"'DM Mono',monospace",fontSize:15,
                            fontWeight:700,color:isEarn?"#4ADE80":"#F87171",margin:0}}>
                            {isEarn?"+":""}{tx.points}
                          </p>
                          <p style={{fontSize:9,color:T.inkD,margin:0,
                            fontFamily:"'DM Mono',monospace"}}>pts</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
