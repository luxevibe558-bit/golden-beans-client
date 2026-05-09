"use client";
import { useState, useEffect } from "react";

// ═══════════════════════════════════════════════════
// LOYALTY SETTINGS PAGE
// File: src/app/pos/loyalty-settings/page.tsx
// ═══════════════════════════════════════════════════

const API = process.env.NEXT_PUBLIC_API_URL || "https://golden-beans-server.onrender.com/api";

const T = {
  bg0:"#0A0804",bg1:"#0F0D09",bg2:"#16130E",bg3:"#1E1A13",
  gold:"#C8922A",goldM:"#E8B84B",goldL:"#F5CC6A",
  ink:"#F0E8D8",inkS:"#A89878",inkD:"#5C5040",
  gl1:"rgba(255,255,255,0.025)",gl2:"rgba(255,255,255,0.05)",
  glBd:"rgba(255,255,255,0.07)",
  g08:"rgba(200,146,42,0.08)",g15:"rgba(200,146,42,0.15)",
  g40:"rgba(200,146,42,0.40)",
  greenL:"rgba(46,125,82,0.15)",
};
const GG = `linear-gradient(135deg,${T.gold},${T.goldM},${T.goldL})`;
const EA = "cubic-bezier(0.25,0.46,0.45,0.94)";

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&family=DM+Mono:wght@400;500&display=swap');
*{box-sizing:border-box;-webkit-font-smoothing:antialiased;}
.ls-input:focus{border-color:rgba(200,146,42,0.65)!important;box-shadow:0 0 0 3px rgba(200,146,42,0.1)!important;outline:none;}
.ls-btn:hover{filter:brightness(1.1);}
@keyframes ls-in{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
@keyframes spin{to{transform:rotate(360deg)}}
`;

const TIER_CONFIG = {
  bronze:   { icon:"🥉", color:"#CD7F32" },
  silver:   { icon:"🥈", color:"#C0C0C0" },
  gold:     { icon:"🥇", color:"#C8922A" },
  platinum: { icon:"💎", color:"#E5E4E2" },
};

interface LoyaltyConfig {
  pointsPerRupee:  number;
  rupeesPerPoint:  number;
  welcomeBonus:    number;
  minRedeemPoints: number;
  maxRedeemPct:    number;
  tierThresholds:  { silver:number; gold:number; platinum:number };
}

const DEFAULTS: LoyaltyConfig = {
  pointsPerRupee: 0.1, rupeesPerPoint: 0.1,
  welcomeBonus: 50, minRedeemPoints: 100, maxRedeemPct: 50,
  tierThresholds: { silver:500, gold:1000, platinum:2000 },
};

export default function LoyaltySettingsPage() {
  const [cfg,     setCfg    ] = useState<LoyaltyConfig>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving ] = useState(false);
  const [saved,   setSaved  ] = useState(false);
  const [error,   setError  ] = useState("");

  useEffect(()=>{
    fetch(`${API}/customers/loyalty-config`)
      .then(r=>r.json())
      .then(d=>{ if(d.success) setCfg({...DEFAULTS,...d.data}); })
      .catch(()=>{})
      .finally(()=>setLoading(false));
  },[]);

  const save = async()=>{
    setSaving(true); setError(""); setSaved(false);
    try {
      const res = await fetch(`${API}/customers/loyalty-config`,{
        method:"PUT", headers:{"Content-Type":"application/json"},
        body: JSON.stringify(cfg),
      });
      const d = await res.json();
      if(!d.success) throw new Error(d.message||"Save failed");
      setSaved(true); setTimeout(()=>setSaved(false),3000);
    } catch(e:any) { setError(e.message); }
    setSaving(false);
  };

  const reset = ()=>{ if(confirm("Reset to defaults?")) setCfg(DEFAULTS); };

  // Computed preview
  const eg100  = Math.floor(100  * cfg.pointsPerRupee);
  const eg500  = Math.floor(500  * cfg.pointsPerRupee);
  const eg1000 = Math.floor(1000 * cfg.pointsPerRupee);
  const pts100val = Math.floor(100 * cfg.rupeesPerPoint);

  return(
    <div style={{display:"flex",flexDirection:"column",height:"100%",
      background:T.bg0,color:T.ink,fontFamily:"'DM Sans',sans-serif",overflow:"hidden"}}>
      <style>{CSS}</style>

      {/* Header */}
      <div style={{padding:"18px 22px 14px",flexShrink:0,
        borderBottom:`1px solid ${T.gl2}`}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
          <div>
            <h1 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:26,
              fontWeight:600,color:T.ink,margin:"0 0 3px"}}>
              Loyalty Settings
            </h1>
            <p style={{fontSize:12.5,color:T.inkS,margin:0}}>
              Configure points, tiers &amp; redemption rules
            </p>
          </div>
          <div style={{display:"flex",gap:9}}>
            <button onClick={reset} className="ls-btn"
              style={{padding:"9px 16px",borderRadius:10,border:`1px solid ${T.glBd}`,
                background:T.gl1,color:T.inkS,fontSize:12.5,cursor:"pointer",
                fontFamily:"'DM Sans',sans-serif"}}>
              ↺ Reset
            </button>
            <button onClick={save} disabled={saving} className="ls-btn"
              style={{display:"flex",alignItems:"center",gap:7,padding:"9px 20px",
                borderRadius:10,border:"none",background:saving?T.gl1:GG,
                color:saving?T.inkS:"#0A0804",fontWeight:700,fontSize:13.5,
                cursor:"pointer",fontFamily:"'DM Sans',sans-serif",
                boxShadow:saving?"none":`0 4px 16px ${T.g40}`}}>
              {saving
                ?<><div style={{width:14,height:14,borderRadius:"50%",
                    border:`2px solid rgba(0,0,0,.2)`,borderTopColor:"rgba(0,0,0,.6)",
                    animation:"spin .75s linear infinite"}}/>Saving...</>
                :<><span>💾</span> Save Settings</>}
            </button>
          </div>
        </div>
        {saved&&<div style={{marginTop:10,padding:"9px 14px",borderRadius:9,
          background:T.greenL,border:"1px solid rgba(46,125,82,0.4)",
          fontSize:12.5,color:"#4ADE80",fontFamily:"'DM Sans',sans-serif",fontWeight:600}}>
          ✓ Settings saved! New orders will use updated rules.
        </div>}
        {error&&<div style={{marginTop:10,padding:"9px 14px",borderRadius:9,
          background:"rgba(192,57,43,0.12)",border:"1px solid rgba(192,57,43,0.3)",
          fontSize:12.5,color:"#F87171",fontFamily:"'DM Sans',sans-serif"}}>
          ⚠ {error}
        </div>}
      </div>

      {/* Content */}
      <div style={{flex:1,overflowY:"auto",padding:"16px 22px 40px",
        display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,
        alignContent:"start",scrollbarWidth:"none"}}>

        {/* ── POINTS EARNING ── */}
        <div style={{background:T.bg1,borderRadius:16,
          border:`1px solid ${T.glBd}`,overflow:"hidden",
          animation:"ls-in 0.4s ease"}}>
          <div style={{padding:"13px 16px",borderBottom:`1px solid ${T.gl2}`,
            background:T.g08,display:"flex",alignItems:"center",gap:10}}>
            <span style={{fontSize:20}}>🫘</span>
            <h3 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:16,
              fontWeight:600,color:T.ink,margin:0}}>Points Earning</h3>
          </div>
          <div style={{padding:"16px"}}>
            {/* Points per rupee */}
            <div style={{marginBottom:16}}>
              <label style={{fontSize:10,fontWeight:700,color:T.inkD,
                letterSpacing:".08em",textTransform:"uppercase",
                display:"block",marginBottom:6,fontFamily:"'DM Mono',monospace"}}>
                Points per ₹1 spent
              </label>
              <div style={{display:"flex",gap:8,alignItems:"center"}}>
                <input className="ls-input" type="number" step="0.01" min="0.01" max="1"
                  value={cfg.pointsPerRupee}
                  onChange={e=>setCfg(p=>({...p,pointsPerRupee:Number(e.target.value)}))}
                  style={{flex:1,padding:"10px 12px",borderRadius:10,
                    border:`1px solid ${T.glBd}`,background:T.gl1,
                    color:T.ink,fontSize:14,fontFamily:"'DM Mono',monospace"}}/>
                <div style={{flexShrink:0,textAlign:"right"}}>
                  <p style={{fontSize:11,color:T.inkD,margin:0,fontFamily:"'DM Sans',sans-serif"}}>
                    = {Math.round(1/cfg.pointsPerRupee)} ₹ per point
                  </p>
                </div>
              </div>
              {/* Quick presets */}
              <div style={{display:"flex",gap:6,marginTop:8}}>
                {[{l:"1pt/₹10",v:0.1},{l:"1pt/₹5",v:0.2},{l:"2pts/₹10",v:0.2},{l:"1pt/₹1",v:1}].map(p=>(
                  <button key={p.l} onClick={()=>setCfg(c=>({...c,pointsPerRupee:p.v}))}
                    className="ls-btn"
                    style={{flex:1,padding:"5px 0",borderRadius:7,fontSize:10,
                      border:`1px solid ${cfg.pointsPerRupee===p.v?"rgba(200,146,42,0.5)":T.glBd}`,
                      background:cfg.pointsPerRupee===p.v?T.g15:T.gl1,
                      color:cfg.pointsPerRupee===p.v?T.goldL:T.inkS,
                      cursor:"pointer",fontFamily:"'DM Mono',monospace"}}>
                    {p.l}
                  </button>
                ))}
              </div>
            </div>

            {/* Welcome bonus */}
            <div style={{marginBottom:16}}>
              <label style={{fontSize:10,fontWeight:700,color:T.inkD,
                letterSpacing:".08em",textTransform:"uppercase",
                display:"block",marginBottom:6,fontFamily:"'DM Mono',monospace"}}>
                Welcome Bonus Points (new customers)
              </label>
              <input className="ls-input" type="number" min="0" max="500"
                value={cfg.welcomeBonus}
                onChange={e=>setCfg(p=>({...p,welcomeBonus:Number(e.target.value)}))}
                style={{width:"100%",padding:"10px 12px",borderRadius:10,
                  border:`1px solid ${T.glBd}`,background:T.gl1,
                  color:T.ink,fontSize:14,fontFamily:"'DM Mono',monospace"}}/>
              <p style={{fontSize:10.5,color:T.inkD,margin:"5px 0 0",
                fontFamily:"'DM Sans',sans-serif"}}>
                Gifted to new customers on first registration
              </p>
            </div>

            {/* Live preview */}
            <div style={{background:T.g08,border:`1px solid rgba(200,146,42,0.2)`,
              borderRadius:11,padding:"11px 13px"}}>
              <p style={{fontSize:10,color:T.gold,fontFamily:"'DM Mono',monospace",
                letterSpacing:".1em",textTransform:"uppercase",margin:"0 0 7px"}}>
                Preview
              </p>
              {[
                {order:"₹100 order", pts:`+${eg100} pts`},
                {order:"₹500 order", pts:`+${eg500} pts`},
                {order:"₹1000 order",pts:`+${eg1000} pts`},
              ].map(r=>(
                <div key={r.order} style={{display:"flex",justifyContent:"space-between",
                  padding:"4px 0",borderBottom:`1px solid rgba(255,255,255,0.04)`}}>
                  <span style={{fontSize:12,color:T.inkS,fontFamily:"'DM Sans',sans-serif"}}>
                    {r.order}
                  </span>
                  <span style={{fontSize:12,color:T.goldM,fontFamily:"'DM Mono',monospace",
                    fontWeight:600}}>{r.pts}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── POINTS REDEMPTION ── */}
        <div style={{background:T.bg1,borderRadius:16,
          border:`1px solid ${T.glBd}`,overflow:"hidden",
          animation:"ls-in 0.4s 0.07s ease both"}}>
          <div style={{padding:"13px 16px",borderBottom:`1px solid ${T.gl2}`,
            background:T.g08,display:"flex",alignItems:"center",gap:10}}>
            <span style={{fontSize:20}}>🔓</span>
            <h3 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:16,
              fontWeight:600,color:T.ink,margin:0}}>Points Redemption</h3>
          </div>
          <div style={{padding:"16px"}}>
            {/* Rupees per point */}
            <div style={{marginBottom:16}}>
              <label style={{fontSize:10,fontWeight:700,color:T.inkD,
                letterSpacing:".08em",textTransform:"uppercase",
                display:"block",marginBottom:6,fontFamily:"'DM Mono',monospace"}}>
                ₹ value per point
              </label>
              <div style={{display:"flex",gap:8,alignItems:"center"}}>
                <input className="ls-input" type="number" step="0.01" min="0.01" max="1"
                  value={cfg.rupeesPerPoint}
                  onChange={e=>setCfg(p=>({...p,rupeesPerPoint:Number(e.target.value)}))}
                  style={{flex:1,padding:"10px 12px",borderRadius:10,
                    border:`1px solid ${T.glBd}`,background:T.gl1,
                    color:T.ink,fontSize:14,fontFamily:"'DM Mono',monospace"}}/>
                <p style={{fontSize:11,color:T.inkD,flexShrink:0,
                  fontFamily:"'DM Sans',sans-serif"}}>
                  100pts = ₹{pts100val}
                </p>
              </div>
              <div style={{display:"flex",gap:6,marginTop:8}}>
                {[{l:"₹10/100pts",v:0.1},{l:"₹5/100pts",v:0.05},{l:"₹20/100pts",v:0.2}].map(p=>(
                  <button key={p.l} onClick={()=>setCfg(c=>({...c,rupeesPerPoint:p.v}))}
                    className="ls-btn"
                    style={{flex:1,padding:"5px 0",borderRadius:7,fontSize:10,
                      border:`1px solid ${cfg.rupeesPerPoint===p.v?"rgba(200,146,42,0.5)":T.glBd}`,
                      background:cfg.rupeesPerPoint===p.v?T.g15:T.gl1,
                      color:cfg.rupeesPerPoint===p.v?T.goldL:T.inkS,
                      cursor:"pointer",fontFamily:"'DM Mono',monospace"}}>
                    {p.l}
                  </button>
                ))}
              </div>
            </div>

            {/* Min redeem */}
            <div style={{marginBottom:16}}>
              <label style={{fontSize:10,fontWeight:700,color:T.inkD,
                letterSpacing:".08em",textTransform:"uppercase",
                display:"block",marginBottom:6,fontFamily:"'DM Mono',monospace"}}>
                Minimum points to redeem
              </label>
              <input className="ls-input" type="number" min="10" max="1000" step="10"
                value={cfg.minRedeemPoints}
                onChange={e=>setCfg(p=>({...p,minRedeemPoints:Number(e.target.value)}))}
                style={{width:"100%",padding:"10px 12px",borderRadius:10,
                  border:`1px solid ${T.glBd}`,background:T.gl1,
                  color:T.ink,fontSize:14,fontFamily:"'DM Mono',monospace"}}/>
              <p style={{fontSize:10.5,color:T.inkD,margin:"5px 0 0",
                fontFamily:"'DM Sans',sans-serif"}}>
                Customer must have at least this many points to redeem
              </p>
            </div>

            {/* Max redeem % */}
            <div style={{marginBottom:16}}>
              <label style={{fontSize:10,fontWeight:700,color:T.inkD,
                letterSpacing:".08em",textTransform:"uppercase",
                display:"block",marginBottom:6,fontFamily:"'DM Mono',monospace"}}>
                Max redeemable (% of order)
              </label>
              <div style={{display:"flex",gap:8,alignItems:"center"}}>
                <input className="ls-input" type="number" min="10" max="100" step="5"
                  value={cfg.maxRedeemPct}
                  onChange={e=>setCfg(p=>({...p,maxRedeemPct:Number(e.target.value)}))}
                  style={{flex:1,padding:"10px 12px",borderRadius:10,
                    border:`1px solid ${T.glBd}`,background:T.gl1,
                    color:T.ink,fontSize:14,fontFamily:"'DM Mono',monospace"}}/>
                <span style={{fontSize:16,color:T.inkS}}>%</span>
              </div>
              <p style={{fontSize:10.5,color:T.inkD,margin:"5px 0 0",
                fontFamily:"'DM Sans',sans-serif"}}>
                Max discount from points on any order
              </p>
            </div>
          </div>
        </div>

        {/* ── TIER THRESHOLDS ── */}
        <div style={{gridColumn:"1/-1",background:T.bg1,borderRadius:16,
          border:`1px solid ${T.glBd}`,overflow:"hidden",
          animation:"ls-in 0.4s 0.14s ease both"}}>
          <div style={{padding:"13px 16px",borderBottom:`1px solid ${T.gl2}`,
            background:T.g08,display:"flex",alignItems:"center",gap:10}}>
            <span style={{fontSize:20}}>🏆</span>
            <h3 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:16,
              fontWeight:600,color:T.ink,margin:0}}>Tier Thresholds</h3>
          </div>
          <div style={{padding:"16px",display:"grid",
            gridTemplateColumns:"repeat(4,1fr)",gap:12}}>
            {/* Bronze — always 0 */}
            <div style={{background:T.gl1,borderRadius:12,padding:"14px 13px",
              border:"2px solid rgba(205,127,50,0.35)"}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
                <span style={{fontSize:22}}>🥉</span>
                <div>
                  <p style={{fontSize:13,fontWeight:700,color:"#CD7F32",
                    fontFamily:"'DM Sans',sans-serif",margin:0}}>Bronze</p>
                  <p style={{fontSize:10,color:T.inkD,margin:0,
                    fontFamily:"'DM Mono',monospace"}}>Starting tier</p>
                </div>
              </div>
              <div style={{padding:"10px 12px",borderRadius:9,
                background:"rgba(205,127,50,0.08)",border:"1px solid rgba(205,127,50,0.2)",
                textAlign:"center"}}>
                <p style={{fontFamily:"'DM Mono',monospace",fontSize:18,
                  fontWeight:600,color:"#CD7F32",margin:0}}>0 pts</p>
                <p style={{fontSize:9.5,color:T.inkD,margin:"2px 0 0",
                  fontFamily:"'DM Sans',sans-serif"}}>Always active</p>
              </div>
            </div>

            {/* Silver */}
            {(["silver","gold","platinum"] as const).map((tier,i)=>{
              const tc = TIER_CONFIG[tier];
              const key = tier as "silver"|"gold"|"platinum";
              return(
                <div key={tier} style={{background:T.gl1,borderRadius:12,padding:"14px 13px",
                  border:`2px solid ${tc.color}35`,
                  animation:`ls-in 0.4s ${(i+1)*.07}s ease both`}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
                    <span style={{fontSize:22}}>{tc.icon}</span>
                    <div>
                      <p style={{fontSize:13,fontWeight:700,color:tc.color,
                        fontFamily:"'DM Sans',sans-serif",margin:0,
                        textTransform:"capitalize"}}>{tier}</p>
                      <p style={{fontSize:10,color:T.inkD,margin:0,
                        fontFamily:"'DM Mono',monospace"}}>Points needed</p>
                    </div>
                  </div>
                  <input className="ls-input" type="number" min="100" max="10000" step="100"
                    value={cfg.tierThresholds[key]}
                    onChange={e=>setCfg(p=>({...p,
                      tierThresholds:{...p.tierThresholds,[key]:Number(e.target.value)}
                    }))}
                    style={{width:"100%",padding:"10px 12px",borderRadius:9,
                      border:`1px solid ${tc.color}50`,
                      background:`${tc.color}08`,
                      color:tc.color,fontSize:18,fontFamily:"'DM Mono',monospace",
                      fontWeight:600,textAlign:"center"}}/>
                  <p style={{fontSize:10,color:T.inkD,margin:"5px 0 0",textAlign:"center",
                    fontFamily:"'DM Sans',sans-serif"}}>
                    ≥ {cfg.tierThresholds[key]} points
                  </p>
                </div>
              );
            })}
          </div>

          {/* Tier progress preview */}
          <div style={{padding:"0 16px 16px"}}>
            <div style={{background:T.g08,borderRadius:11,padding:"12px 14px",
              border:"1px solid rgba(200,146,42,0.15)"}}>
              <p style={{fontSize:10,color:T.gold,fontFamily:"'DM Mono',monospace",
                letterSpacing:".1em",textTransform:"uppercase",margin:"0 0 9px"}}>
                Tier Journey Preview
              </p>
              <div style={{display:"flex",alignItems:"center",gap:4}}>
                {[
                  {icon:"🥉",label:"Bronze",pts:0,color:"#CD7F32"},
                  {icon:"→",label:"",pts:0,color:T.inkD},
                  {icon:"🥈",label:"Silver",pts:cfg.tierThresholds.silver,color:"#C0C0C0"},
                  {icon:"→",label:"",pts:0,color:T.inkD},
                  {icon:"🥇",label:"Gold",pts:cfg.tierThresholds.gold,color:"#C8922A"},
                  {icon:"→",label:"",pts:0,color:T.inkD},
                  {icon:"💎",label:"Platinum",pts:cfg.tierThresholds.platinum,color:"#E5E4E2"},
                ].map((s,i)=>(
                  <div key={i} style={{flex:s.label?1:0,textAlign:"center"}}>
                    <div style={{fontSize:s.label?18:12,color:s.color}}>{s.icon}</div>
                    {s.label&&<p style={{fontSize:9,color:s.color,margin:"2px 0 0",
                      fontFamily:"'DM Mono',monospace"}}>{s.pts>0?`${s.pts}pts`:""}</p>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
