"use client";

import { useState, useEffect, useCallback } from "react";
import POSSidebar from "@/components/POSSidebar";

// ═══════════════════════════════════════════════════
// GOLDEN BEANS — PREMIUM ANALYTICS DASHBOARD
// File: src/app/pos/analytics/page.tsx
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
  purple:"#7C3AED",purpleL:"rgba(124,58,237,0.12)",
};
const GG = `linear-gradient(135deg,${T.gold} 0%,${T.goldM} 52%,${T.goldL} 100%)`;
const EA = "cubic-bezier(0.25,0.46,0.45,0.94)";

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&family=DM+Mono:wght@400;500&display=swap');
*{box-sizing:border-box;-webkit-font-smoothing:antialiased;}
.hs{scrollbar-width:none;-ms-overflow-style:none;}
.hs::-webkit-scrollbar{display:none;}
.an-btn:hover{filter:brightness(1.1);transform:translateY(-1px);}
.an-btn:active{transform:scale(0.97)!important;}
@keyframes an-in{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes bar-grow{from{height:0;opacity:0}to{opacity:1}}
`;

// ── Mini bar chart component ──
function BarChart({ data, color="#C8922A", height=120, showLabels=true }: {
  data:{label:string;value:number}[];
  color?:string;height?:number;showLabels?:boolean;
}) {
  const max = Math.max(...data.map(d=>d.value), 1);
  return(
    <div style={{display:"flex",alignItems:"flex-end",gap:4,height,padding:"0 2px"}}>
      {data.map((d,i)=>(
        <div key={i} style={{flex:1,display:"flex",flexDirection:"column",
          alignItems:"center",gap:3,height:"100%",justifyContent:"flex-end"}}>
          <div style={{width:"100%",borderRadius:"4px 4px 0 0",
            background:`linear-gradient(to top,${color}90,${color})`,
            height:`${(d.value/max)*85}%`,minHeight:d.value>0?3:0,
            transition:`height 0.8s ${i*.05}s ${EA}`,
            boxShadow:`0 0 8px ${color}40`}}/>
          {showLabels&&<span style={{fontSize:8.5,color:T.inkD,
            fontFamily:"'DM Mono',monospace",textAlign:"center",
            whiteSpace:"nowrap",overflow:"hidden",width:"100%",
            textOverflow:"ellipsis"}}>{d.label}</span>}
        </div>
      ))}
    </div>
  );
}

// ── Donut chart component ──
function DonutChart({ data, size=120 }: {
  data:{label:string;value:number;color:string}[];
  size?:number;
}) {
  const total = data.reduce((s,d)=>s+d.value,0)||1;
  const r = size/2 - 8;
  const circ = 2*Math.PI*r;
  let offset = 0;
  const segments = data.map(d=>{
    const pct = d.value/total;
    const seg = {
      dasharray: `${pct*circ} ${circ}`,
      dashoffset: -(offset*circ),
      color: d.color,
      label: d.label,
      value: d.value,
      pct: Math.round(pct*100),
    };
    offset += pct;
    return seg;
  });

  return(
    <div style={{display:"flex",alignItems:"center",gap:16}}>
      <svg width={size} height={size} style={{flexShrink:0}}>
        <circle cx={size/2} cy={size/2} r={r}
          fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={14}/>
        {segments.map((s,i)=>(
          <circle key={i} cx={size/2} cy={size/2} r={r}
            fill="none" stroke={s.color} strokeWidth={14}
            strokeDasharray={s.dasharray}
            strokeDashoffset={s.dashoffset}
            style={{transform:"rotate(-90deg)",transformOrigin:"center",
              transition:`stroke-dasharray 0.8s ${i*.1}s ease`}}/>
        ))}
        <text x={size/2} y={size/2-4} textAnchor="middle"
          fill={T.gold} fontSize={18} fontWeight={600}
          fontFamily="'DM Mono',monospace">
          {total}
        </text>
        <text x={size/2} y={size/2+12} textAnchor="middle"
          fill={T.inkD} fontSize={9} fontFamily="'DM Sans',sans-serif">
          orders
        </text>
      </svg>
      <div style={{display:"flex",flexDirection:"column",gap:6,flex:1}}>
        {segments.map((s,i)=>(
          <div key={i} style={{display:"flex",alignItems:"center",gap:7}}>
            <div style={{width:8,height:8,borderRadius:2,
              background:s.color,flexShrink:0}}/>
            <span style={{fontSize:11,color:T.inkS,
              fontFamily:"'DM Sans',sans-serif",flex:1,
              whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>
              {s.label}
            </span>
            <span style={{fontSize:11,color:T.ink,
              fontFamily:"'DM Mono',monospace",fontWeight:500}}>
              {s.pct}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Trend indicator ──
function Trend({ value, suffix="%" }:{value:number;suffix?:string}) {
  const up = value >= 0;
  return(
    <span style={{fontSize:11,fontWeight:600,
      color:up?"#4ADE80":"#F87171",
      background:up?"rgba(74,222,128,0.1)":"rgba(248,113,113,0.1)",
      padding:"1px 7px",borderRadius:99,
      fontFamily:"'DM Mono',monospace"}}>
      {up?"↑":"↓"}{Math.abs(value)}{suffix}
    </span>
  );
}

type Period = "today"|"week"|"month"|"year";

export default function AnalyticsPage() {
  const [period,   setPeriod  ] = useState<Period>("today");
  const [data,     setData    ] = useState<any>(null);
  const [loading,  setLoading ] = useState(true);
  const [lastLoad, setLastLoad] = useState<Date|null>(null);

  const load = useCallback(async()=>{
    setLoading(true);
    try {
      const [summaryR, hourlyR, itemsR, paymentR, tableR] = await Promise.all([
        fetch(`${API}/analytics/summary?period=${period}`).then(r=>r.json()),
        fetch(`${API}/analytics/hourly?period=${period}`).then(r=>r.json()),
        fetch(`${API}/analytics/top-items?period=${period}&limit=8`).then(r=>r.json()),
        fetch(`${API}/analytics/payment-breakdown?period=${period}`).then(r=>r.json()),
        fetch(`${API}/analytics/table-performance?period=${period}`).then(r=>r.json()),
      ]);
      setData({
        summary: summaryR.data || summaryR,
        hourly:  hourlyR.data  || hourlyR,
        items:   itemsR.data   || itemsR,
        payment: paymentR.data || paymentR,
        tables:  tableR.data   || tableR,
      });
      setLastLoad(new Date());
    } catch(e) {
      console.error(e);
    }
    setLoading(false);
  },[period]);

  useEffect(()=>{ load(); },[load]);

  // Build chart data from API response
  const hourlyData = Array.from({length:24},(_,h)=>{
    const found = data?.hourly?.find?.((x:any)=>x.hour===h||x._id===h);
    return { label:h%3===0?`${h}h`:"", value:found?.revenue||found?.total||0 };
  });

  const topItems = (data?.items||[]).slice(0,6).map((i:any)=>({
    label: i.name||(i._id?.name)||"Item",
    value: i.count||i.quantity||i.totalSold||0,
  }));

  const paymentData = [
    {label:"UPI",   value:data?.payment?.upi   ||data?.summary?.upiRevenue   ||0, color:T.gold},
    {label:"Cash",  value:data?.payment?.cash  ||data?.summary?.cashRevenue  ||0, color:T.green},
    {label:"Card",  value:data?.payment?.card  ||data?.summary?.cardRevenue  ||0, color:T.blue},
    {label:"Other", value:data?.payment?.other ||0, color:T.purple},
  ].filter(p=>p.value>0);

  const s = data?.summary || {};
  const revenue    = s.totalRevenue    || s.revenue    || 0;
  const orders     = s.totalOrders     || s.orders     || 0;
  const avgOrder   = s.avgOrderValue   || s.avgOrder   || (orders>0?Math.round(revenue/orders):0);
  const customers  = s.uniqueCustomers || s.customers  || 0;

  const PERIODS: {id:Period;label:string}[] = [
    {id:"today",label:"Today"},
    {id:"week", label:"This Week"},
    {id:"month",label:"This Month"},
    {id:"year", label:"This Year"},
  ];

  return(
    <div style={{display:"flex",minHeight:"100vh",background:T.bg0}}>
      <POSSidebar/>
      <div style={{flex:1,marginLeft:"64px",display:"flex",flexDirection:"column",
        height:"100vh",overflow:"hidden",color:T.ink,fontFamily:"'DM Sans',sans-serif"}}>
      <style>{CSS}</style>

      {/* ── HEADER ── */}
      <div style={{padding:"18px 22px 14px",flexShrink:0,
        borderBottom:`1px solid ${T.gl2}`}}>
        <div style={{display:"flex",alignItems:"center",
          justifyContent:"space-between",marginBottom:14}}>
          <div>
            <h1 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:26,
              fontWeight:600,color:T.ink,margin:"0 0 3px"}}>Analytics</h1>
            <p style={{fontSize:12.5,color:T.inkS,margin:0}}>
              {lastLoad ? `Last updated ${lastLoad.toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"})}` : "Loading..."}
            </p>
          </div>
          <div style={{display:"flex",gap:9,alignItems:"center"}}>
            {/* Period selector */}
            <div style={{display:"flex",gap:4,background:T.bg2,
              borderRadius:10,padding:3,border:`1px solid ${T.glBd}`}}>
              {PERIODS.map(p=>(
                <button key={p.id} onClick={()=>setPeriod(p.id)}
                  className="an-btn"
                  style={{padding:"6px 14px",borderRadius:8,border:"none",
                    background:period===p.id?GG:"transparent",
                    color:period===p.id?T.bg0:T.inkS,
                    fontWeight:period===p.id?700:500,
                    fontSize:12,cursor:"pointer",
                    fontFamily:"'DM Sans',sans-serif",
                    transition:`all 0.2s ${EA}`}}>
                  {p.label}
                </button>
              ))}
            </div>
            <button onClick={load} disabled={loading} className="an-btn"
              style={{width:36,height:36,borderRadius:9,
                border:`1px solid ${T.glBd}`,background:T.gl1,
                color:T.inkS,cursor:"pointer",fontSize:15,
                display:"flex",alignItems:"center",justifyContent:"center"}}>
              {loading
                ?<div style={{width:14,height:14,borderRadius:"50%",
                    border:`2px solid ${T.glBd}`,borderTopColor:T.gold,
                    animation:"spin .75s linear infinite"}}/>
                :"🔄"}
            </button>
          </div>
        </div>

        {/* ── KPI CARDS ── */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10}}>
          {[
            {label:"Revenue",    value:`₹${revenue>=1000?`${(revenue/1000).toFixed(1)}K`:revenue}`,
             icon:"💰",color:T.gold,  trend:s.revenueTrend||12},
            {label:"Orders",     value:String(orders),
             icon:"📋",color:T.blue,  trend:s.ordersTrend||8},
            {label:"Avg. Order", value:`₹${avgOrder}`,
             icon:"📊",color:T.green, trend:s.avgTrend||5},
            {label:"Customers",  value:String(customers),
             icon:"👥",color:T.purple,trend:s.customerTrend||15},
          ].map((kpi,i)=>(
            <div key={i} style={{background:T.bg2,borderRadius:13,
              padding:"13px 14px",border:`1px solid ${T.glBd}`,
              animation:`an-in 0.4s ${i*.06}s ease both`}}>
              <div style={{display:"flex",justifyContent:"space-between",
                alignItems:"flex-start",marginBottom:8}}>
                <span style={{fontSize:20}}>{kpi.icon}</span>
                <Trend value={kpi.trend}/>
              </div>
              <p style={{fontFamily:"'DM Mono',monospace",fontSize:22,
                fontWeight:500,color:kpi.color,margin:"0 0 2px",lineHeight:1}}>
                {kpi.value}
              </p>
              <p style={{fontSize:11,color:T.inkD,margin:0}}>{kpi.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── CHARTS AREA ── */}
      <div className="hs" style={{flex:1,overflowY:"auto",
        padding:"14px 22px 24px",
        display:"grid",gridTemplateColumns:"1fr 1fr",
        gap:12,alignContent:"start"}}>

        {/* Revenue by Hour */}
        <div style={{gridColumn:"1/-1",background:T.bg1,borderRadius:16,
          padding:"14px 16px",border:`1px solid ${T.glBd}`,
          animation:`an-in 0.4s 0.1s ease both`}}>
          <div style={{display:"flex",justifyContent:"space-between",
            alignItems:"center",marginBottom:14}}>
            <div>
              <p style={{fontSize:10,color:T.gold,fontFamily:"'DM Mono',monospace",
                letterSpacing:".14em",textTransform:"uppercase",margin:"0 0 2px"}}>
                ✦ Revenue Timeline
              </p>
              <h3 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:17,
                fontWeight:600,color:T.ink,margin:0}}>
                {period==="today"?"Hourly Revenue":period==="week"?"Daily Revenue":"Revenue Trend"}
              </h3>
            </div>
            <div style={{textAlign:"right"}}>
              <p style={{fontFamily:"'DM Mono',monospace",fontSize:20,
                fontWeight:500,color:T.goldL,margin:0}}>₹{revenue}</p>
              <p style={{fontSize:10.5,color:T.inkD,margin:0}}>total</p>
            </div>
          </div>
          {loading
            ? <div style={{height:140,background:T.bg2,borderRadius:9,
                animation:"an-in 0.3s ease"}}/>
            : <BarChart data={hourlyData} height={140}/>
          }
        </div>

        {/* Top Items */}
        <div style={{background:T.bg1,borderRadius:16,
          padding:"14px 16px",border:`1px solid ${T.glBd}`,
          animation:`an-in 0.4s 0.15s ease both`}}>
          <p style={{fontSize:10,color:T.gold,fontFamily:"'DM Mono',monospace",
            letterSpacing:".14em",textTransform:"uppercase",margin:"0 0 2px"}}>
            ✦ Top Items
          </p>
          <h3 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:17,
            fontWeight:600,color:T.ink,margin:"0 0 14px"}}>Best Sellers</h3>
          {loading
            ? <div style={{height:130,background:T.bg2,borderRadius:9}}/>
            : topItems.length > 0
              ? <BarChart data={topItems} color={T.goldM} height={130} showLabels={true}/>
              : <div style={{height:100,display:"flex",alignItems:"center",
                  justifyContent:"center"}}>
                  <p style={{fontSize:13,color:T.inkD}}>No data for this period</p>
                </div>
          }
          {/* Top items list */}
          {!loading&&topItems.length>0&&(
            <div style={{marginTop:10,display:"flex",flexDirection:"column",gap:6}}>
              {(data?.items||[]).slice(0,5).map((item:any,i:number)=>(
                <div key={i} style={{display:"flex",alignItems:"center",
                  gap:10,padding:"7px 10px",
                  background:T.gl1,borderRadius:9,
                  border:`1px solid ${T.glBd}`}}>
                  <span style={{fontFamily:"'DM Mono',monospace",fontSize:11,
                    color:T.inkD,width:16,textAlign:"center"}}>{i+1}</span>
                  <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:12.5,
                    fontWeight:600,color:T.ink,flex:1,margin:0,
                    whiteSpace:"nowrap",overflow:"hidden",
                    textOverflow:"ellipsis"}}>
                    {item.name||(item._id?.name)||"Item"}
                  </p>
                  <span style={{fontSize:11,color:T.gold,
                    fontFamily:"'DM Mono',monospace"}}>
                    {item.count||item.quantity||0}x
                  </span>
                  <span style={{fontSize:11,color:T.inkS,
                    fontFamily:"'DM Mono',monospace"}}>
                    ₹{item.revenue||item.totalRevenue||0}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Payment Breakdown */}
        <div style={{background:T.bg1,borderRadius:16,
          padding:"14px 16px",border:`1px solid ${T.glBd}`,
          animation:`an-in 0.4s 0.2s ease both`}}>
          <p style={{fontSize:10,color:T.gold,fontFamily:"'DM Mono',monospace",
            letterSpacing:".14em",textTransform:"uppercase",margin:"0 0 2px"}}>
            ✦ Payment Methods
          </p>
          <h3 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:17,
            fontWeight:600,color:T.ink,margin:"0 0 14px"}}>Payment Breakdown</h3>
          {loading
            ? <div style={{height:120,background:T.bg2,borderRadius:9}}/>
            : paymentData.length > 0
              ? <DonutChart data={paymentData} size={110}/>
              : <div style={{display:"flex",alignItems:"center",
                  justifyContent:"center",height:80}}>
                  <p style={{fontSize:13,color:T.inkD}}>No payment data</p>
                </div>
          }
          {/* Payment totals */}
          {!loading&&(
            <div style={{marginTop:12,display:"grid",
              gridTemplateColumns:"1fr 1fr",gap:6}}>
              {[
                {l:"UPI",    v:s.upiRevenue   ||0, c:T.gold},
                {l:"Cash",   v:s.cashRevenue  ||0, c:T.green},
                {l:"Card",   v:s.cardRevenue  ||0, c:T.blue},
                {l:"Tip",    v:s.tipTotal     ||0, c:T.purple},
              ].map(p=>(
                <div key={p.l} style={{background:T.gl1,borderRadius:9,
                  padding:"8px 10px",border:`1px solid ${T.glBd}`}}>
                  <div style={{display:"flex",alignItems:"center",gap:5,marginBottom:3}}>
                    <div style={{width:7,height:7,borderRadius:2,background:p.c}}/>
                    <span style={{fontSize:10,color:T.inkD,
                      fontFamily:"'DM Mono',monospace"}}>{p.l}</span>
                  </div>
                  <p style={{fontFamily:"'DM Mono',monospace",fontSize:14,
                    fontWeight:500,color:p.c,margin:0}}>₹{p.v}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Table Performance */}
        <div style={{background:T.bg1,borderRadius:16,
          padding:"14px 16px",border:`1px solid ${T.glBd}`,
          animation:`an-in 0.4s 0.25s ease both`}}>
          <p style={{fontSize:10,color:T.gold,fontFamily:"'DM Mono',monospace",
            letterSpacing:".14em",textTransform:"uppercase",margin:"0 0 2px"}}>
            ✦ Tables
          </p>
          <h3 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:17,
            fontWeight:600,color:T.ink,margin:"0 0 12px"}}>Table Performance</h3>
          {loading
            ? <div style={{height:140,background:T.bg2,borderRadius:9}}/>
            : (data?.tables||[]).length > 0
              ? <div style={{display:"flex",flexDirection:"column",gap:6,maxHeight:200,overflowY:"auto"}} className="hs">
                  {(data.tables||[]).slice(0,8).map((t:any,i:number)=>{
                    const rev = t.revenue||t.totalRevenue||0;
                    const maxRev = Math.max(...(data.tables||[]).map((x:any)=>x.revenue||x.totalRevenue||0),1);
                    return(
                      <div key={i} style={{display:"flex",alignItems:"center",
                        gap:10,padding:"6px 0"}}>
                        <span style={{fontSize:11,color:T.inkD,
                          fontFamily:"'DM Mono',monospace",width:40,flexShrink:0}}>
                          T{t.tableNumber||t._id?.tableNumber||i+1}
                        </span>
                        <div style={{flex:1,height:6,borderRadius:3,
                          background:"rgba(255,255,255,0.06)"}}>
                          <div style={{height:"100%",borderRadius:3,
                            background:GG,width:`${(rev/maxRev)*100}%`,
                            transition:`width 0.8s ${i*.05}s ${EA}`}}/>
                        </div>
                        <span style={{fontSize:11,color:T.gold,
                          fontFamily:"'DM Mono',monospace",width:50,
                          textAlign:"right",flexShrink:0}}>
                          ₹{rev}
                        </span>
                      </div>
                    );
                  })}
                </div>
              : <div style={{display:"flex",alignItems:"center",
                  justifyContent:"center",height:80}}>
                  <p style={{fontSize:13,color:T.inkD}}>No table data</p>
                </div>
          }
        </div>

        {/* Order Status Breakdown */}
        <div style={{background:T.bg1,borderRadius:16,
          padding:"14px 16px",border:`1px solid ${T.glBd}`,
          animation:`an-in 0.4s 0.3s ease both`}}>
          <p style={{fontSize:10,color:T.gold,fontFamily:"'DM Mono',monospace",
            letterSpacing:".14em",textTransform:"uppercase",margin:"0 0 2px"}}>
            ✦ Overview
          </p>
          <h3 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:17,
            fontWeight:600,color:T.ink,margin:"0 0 12px"}}>Order Stats</h3>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:9}}>
            {[
              {l:"Total Orders",   v:orders,         icon:"📋", c:T.gold},
              {l:"Avg Order Val",  v:`₹${avgOrder}`, icon:"💰", c:T.green},
              {l:"Unique Customers",v:customers,     icon:"👥", c:T.blue},
              {l:"Items Sold",     v:s.itemsSold||s.totalItems||0, icon:"🍽️", c:T.purple},
              {l:"Discounts Given",v:`₹${s.totalDiscounts||s.discounts||0}`, icon:"🏷️", c:"#F59E0B"},
              {l:"Tips Collected", v:`₹${s.tipTotal||s.tips||0}`,  icon:"🙌", c:T.goldM},
            ].map((stat,i)=>(
              <div key={i} style={{background:T.gl1,borderRadius:10,
                padding:"10px 11px",border:`1px solid ${T.glBd}`,
                animation:`an-in 0.35s ${i*.05}s ease both`}}>
                <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}>
                  <span style={{fontSize:14}}>{stat.icon}</span>
                </div>
                <p style={{fontFamily:"'DM Mono',monospace",fontSize:16,
                  fontWeight:500,color:stat.c,margin:"0 0 2px",lineHeight:1}}>
                  {stat.v}
                </p>
                <p style={{fontSize:10,color:T.inkD,margin:0,
                  fontFamily:"'DM Sans',sans-serif"}}>{stat.l}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
      </div>
    </div>
  );
}
