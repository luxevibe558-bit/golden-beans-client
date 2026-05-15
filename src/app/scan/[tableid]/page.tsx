"use client";
// ═══════════════════════════════════════════════════════════════
// GOLDEN BEANS — Ultra Premium QR Scan Landing Page
// File: src/app/order/[tableId]/qr-welcome/page.tsx
// OR replace: src/app/order/[tableId]/page.tsx initial screen
// ═══════════════════════════════════════════════════════════════

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400;1,600&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&family=DM+Mono:wght@300;400;500&display=swap');
*{box-sizing:border-box;margin:0;padding:0;-webkit-font-smoothing:antialiased;}

:root{
  --void:#020100;
  --deep:#07060400;
  --gold:#C8922A;
  --goldM:#E8B84B;
  --goldL:#F5CC6A;
  --ink:#F5EDD8;
  --inkS:#C4AA80;
  --inkD:#7A6448;
}

@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes slideUp{from{opacity:0;transform:translateY(30px)}to{opacity:1;transform:translateY(0)}}
@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
@keyframes pulse{0%,100%{opacity:0.4;transform:scale(1)}50%{opacity:0.8;transform:scale(1.05)}}
@keyframes rotate{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
@keyframes shimmer{0%{background-position:200% center}100%{background-position:-200% center}}
@keyframes breathe{0%,100%{opacity:0.3;transform:scale(0.98)}50%{opacity:0.6;transform:scale(1.02)}}
@keyframes scanLine{0%{transform:translateY(-100%);opacity:0}10%{opacity:1}90%{opacity:1}100%{transform:translateY(400%);opacity:0}}
@keyframes ripple{0%{transform:scale(0.8);opacity:0.8}100%{transform:scale(2.5);opacity:0}}
@keyframes countUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}

.gb-page{
  min-height:100dvh;
  background:var(--void);
  display:flex;flex-direction:column;
  align-items:center;justify-content:center;
  padding:32px 24px;
  font-family:'DM Sans',sans-serif;
  overflow:hidden;
  position:relative;
}

/* Ambient background layers */
.gb-ambient{
  position:fixed;inset:0;pointer-events:none;z-index:0;
  background:
    radial-gradient(ellipse 80% 60% at 50% 0%,rgba(200,146,42,0.06) 0%,transparent 60%),
    radial-gradient(ellipse 60% 40% at 80% 80%,rgba(200,146,42,0.04) 0%,transparent 50%),
    radial-gradient(ellipse 40% 30% at 20% 60%,rgba(200,146,42,0.03) 0%,transparent 40%);
}

/* Grid lines */
.gb-grid{
  position:fixed;inset:0;pointer-events:none;z-index:0;
  background-image:
    linear-gradient(rgba(200,146,42,0.03) 1px,transparent 1px),
    linear-gradient(90deg,rgba(200,146,42,0.03) 1px,transparent 1px);
  background-size:60px 60px;
  mask-image:radial-gradient(ellipse 80% 80% at 50% 50%,black 0%,transparent 100%);
}

.gb-content{
  position:relative;z-index:10;
  width:100%;max-width:380px;
  display:flex;flex-direction:column;
  align-items:center;
  animation:slideUp 0.8s cubic-bezier(0.16,1,0.3,1) both;
}

/* Logo area */
.gb-logo{
  position:relative;
  width:100px;height:100px;
  margin-bottom:28px;
  animation:float 4s ease-in-out infinite;
}
.gb-logo-ring{
  position:absolute;inset:-12px;border-radius:50%;
  border:1px solid rgba(200,146,42,0.15);
  animation:rotate 20s linear infinite;
}
.gb-logo-ring::after{
  content:'';position:absolute;top:0;left:50%;
  transform:translateX(-50%);
  width:6px;height:6px;border-radius:50%;
  background:var(--goldL);
  box-shadow:0 0 8px var(--gold);
}
.gb-logo-img{
  width:100%;height:100%;border-radius:50%;
  border:1.5px solid rgba(200,146,42,0.25);
  overflow:hidden;
  background:radial-gradient(circle at 40% 35%,#3D1F08,#1A0C04);
  display:flex;align-items:center;justify-content:center;
  font-size:46px;
  box-shadow:
    0 0 0 8px rgba(200,146,42,0.05),
    0 0 40px rgba(200,146,42,0.15),
    0 20px 40px rgba(0,0,0,0.5);
}

/* Ripple effect */
.gb-ripple{
  position:absolute;inset:-20px;border-radius:50%;
  border:1px solid rgba(200,146,42,0.2);
  animation:ripple 2.5s ease-out infinite;
}
.gb-ripple:nth-child(2){animation-delay:0.8s;}
.gb-ripple:nth-child(3){animation-delay:1.6s;}

/* Table badge */
.gb-table-badge{
  display:inline-flex;align-items:center;gap:8px;
  background:rgba(200,146,42,0.08);
  border:1px solid rgba(200,146,42,0.2);
  border-radius:99px;
  padding:6px 16px;
  margin-bottom:20px;
}

/* Scan indicator */
.gb-scan-box{
  position:relative;
  width:64px;height:64px;
  margin-bottom:28px;
}
.gb-scan-corner{
  position:absolute;width:14px;height:14px;
  border-color:var(--gold);border-style:solid;
}
.gb-scan-corner:nth-child(1){top:0;left:0;border-width:2px 0 0 2px;}
.gb-scan-corner:nth-child(2){top:0;right:0;border-width:2px 2px 0 0;}
.gb-scan-corner:nth-child(3){bottom:0;left:0;border-width:0 0 2px 2px;}
.gb-scan-corner:nth-child(4){bottom:0;right:0;border-width:0 2px 2px 0;}
.gb-scan-line{
  position:absolute;left:4px;right:4px;height:1px;
  background:linear-gradient(90deg,transparent,var(--goldL),transparent);
  animation:scanLine 2s ease-in-out infinite;
  box-shadow:0 0 8px var(--gold);
}

/* CTA Button */
.gb-btn{
  width:100%;padding:16px;
  border-radius:14px;border:none;
  background:linear-gradient(135deg,var(--gold),var(--goldM) 52%,var(--goldL));
  color:#050301;font-weight:700;font-size:16px;
  font-family:'DM Sans',sans-serif;
  cursor:pointer;
  box-shadow:0 8px 32px rgba(200,146,42,0.35),0 2px 8px rgba(0,0,0,0.3);
  transition:all 0.2s cubic-bezier(0.16,1,0.3,1);
  letter-spacing:0.02em;
  position:relative;overflow:hidden;
}
.gb-btn::before{
  content:'';position:absolute;inset:0;
  background:linear-gradient(135deg,transparent 0%,rgba(255,255,255,0.15) 50%,transparent 100%);
  background-size:200% 100%;
  animation:shimmer 3s ease infinite;
}
.gb-btn:hover{transform:translateY(-2px);box-shadow:0 12px 40px rgba(200,146,42,0.45);}
.gb-btn:active{transform:scale(0.98);}

/* Stats row */
.gb-stats{
  display:grid;grid-template-columns:repeat(3,1fr);
  gap:10px;width:100%;margin-top:24px;
}
.gb-stat{
  background:rgba(255,255,255,0.03);
  border:1px solid rgba(255,255,255,0.06);
  border-radius:12px;padding:12px 8px;text-align:center;
  animation:countUp 0.5s ease both;
}
`;

export default function QRWelcomePage() {
  const params  = useParams();
  const router  = useRouter();
  const tableId = params?.tableId as string || "";
  const [tableNum, setTableNum] = useState("");
  const [loading,  setLoading ] = useState(false);
  const [dots,     setDots    ] = useState(".");

  useEffect(()=>{
    // Fetch table number
    const API = process.env.NEXT_PUBLIC_API_URL || "https://golden-beans-server.onrender.com/api";
    fetch(`${API}/tables/${tableId}`)
      .then(r=>r.json())
      .then(d=>{ if(d.data?.tableNumber) setTableNum(d.data.tableNumber); })
      .catch(()=>{});

    // Animated dots
    const iv = setInterval(()=>setDots(d=>d.length>=3?".":"..".slice(0,d.length+1)), 500);
    return()=>clearInterval(iv);
  },[tableId]);

  const handleEnter = ()=>{
    setLoading(true);
    // Navigate to order page
    router.push(`/order/${tableId}`);
  };

  return(
    <>
      <style>{CSS}</style>
      <div className="gb-page">
        <div className="gb-ambient"/>
        <div className="gb-grid"/>

        <div className="gb-content">

          {/* Logo */}
          <div className="gb-logo">
            <div className="gb-ripple"/>
            <div className="gb-ripple"/>
            <div className="gb-ripple"/>
            <div className="gb-logo-ring"/>
            <div className="gb-logo-img">☕</div>
          </div>

          {/* Brand */}
          <div style={{textAlign:"center",marginBottom:6,
            animation:"slideUp 0.6s 0.1s cubic-bezier(0.16,1,0.3,1) both"}}>
            <h1 style={{
              fontFamily:"'Cormorant Garamond',serif",
              fontSize:34,fontWeight:300,
              color:"var(--ink)",letterSpacing:"-0.01em",
              lineHeight:1.1,marginBottom:4,
            }}>
              Golden <em style={{fontStyle:"italic",fontWeight:600,color:"var(--goldL)"}}>Beans</em>
            </h1>
            <p style={{
              fontFamily:"'DM Mono',monospace",
              fontSize:10,color:"var(--inkD)",
              letterSpacing:"0.25em",textTransform:"uppercase",
            }}>
              Café & Bistro
            </p>
          </div>

          {/* Divider */}
          <div style={{
            width:60,height:1,margin:"16px auto 20px",
            background:"linear-gradient(90deg,transparent,var(--gold),transparent)",
            animation:"slideUp 0.6s 0.15s ease both",
          }}/>

          {/* Table badge */}
          {tableNum && (
            <div className="gb-table-badge"
              style={{animation:"slideUp 0.6s 0.2s ease both"}}>
              <span style={{fontSize:12,color:"var(--goldL)",
                fontFamily:"'DM Mono',monospace",letterSpacing:"0.08em"}}>
                TABLE
              </span>
              <span style={{
                fontFamily:"'Cormorant Garamond',serif",
                fontSize:20,fontWeight:600,color:"var(--ink)",
              }}>{tableNum}</span>
            </div>
          )}

          {/* Scan indicator */}
          <div className="gb-scan-box"
            style={{animation:"slideUp 0.6s 0.25s ease both"}}>
            <div className="gb-scan-corner"/>
            <div className="gb-scan-corner"/>
            <div className="gb-scan-corner"/>
            <div className="gb-scan-corner"/>
            <div className="gb-scan-line"/>
          </div>

          {/* Welcome text */}
          <div style={{textAlign:"center",marginBottom:28,
            animation:"slideUp 0.6s 0.3s ease both"}}>
            <p style={{
              fontFamily:"'Cormorant Garamond',serif",
              fontSize:20,fontWeight:400,
              color:"var(--inkS)",lineHeight:1.5,
              marginBottom:8,
            }}>
              Welcome to your table
            </p>
            <p style={{
              fontSize:13,color:"var(--inkD)",
              fontFamily:"'DM Sans',sans-serif",lineHeight:1.6,
            }}>
              Scan verified · Tap below to explore<br/>
              our menu and place your order
            </p>
          </div>

          {/* CTA Button */}
          <button className="gb-btn"
            onClick={handleEnter}
            disabled={loading}
            style={{animation:"slideUp 0.6s 0.35s ease both"}}>
            {loading
              ? `Opening Menu${dots}`
              : "View Menu & Order →"}
          </button>

          {/* Stats */}
          <div className="gb-stats">
            {[
              {icon:"🍽️", label:"Menu Items", value:"50+"},
              {icon:"⚡", label:"Fast Service", value:"Live"},
              {icon:"🫘", label:"Earn Points", value:"Free"},
            ].map((s,i)=>(
              <div className="gb-stat" key={i}
                style={{animationDelay:`${0.4+i*0.08}s`}}>
                <div style={{fontSize:20,marginBottom:4}}>{s.icon}</div>
                <div style={{
                  fontFamily:"'DM Mono',monospace",
                  fontSize:13,fontWeight:500,color:"var(--goldL)",
                  marginBottom:2,
                }}>{s.value}</div>
                <div style={{fontSize:9,color:"var(--inkD)",
                  textTransform:"uppercase",letterSpacing:"0.08em"}}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <p style={{
            fontSize:11,color:"rgba(122,100,72,0.4)",
            marginTop:24,fontFamily:"'DM Mono',monospace",
            letterSpacing:"0.05em",textAlign:"center",
            animation:"slideUp 0.6s 0.6s ease both",
          }}>
            Pramukh Darshan Society · Dabholi · Surat
          </p>
        </div>
      </div>
    </>
  );
}
