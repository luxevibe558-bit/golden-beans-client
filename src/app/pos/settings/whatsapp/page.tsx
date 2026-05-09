// ═══════════════════════════════════════════════════
// WhatsApp Settings — Add to Admin Settings page
// OR create src/app/pos/settings/whatsapp/page.tsx
// ═══════════════════════════════════════════════════
// This is a SECTION component — embed in existing settings

"use client";
import { useState, useEffect } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "https://golden-beans-server.onrender.com/api";

export default function WhatsAppSettings() {
  const [status,   setStatus  ] = useState<any>(null);
  const [testPhone,setTestPhone] = useState("");
  const [sending,  setSending ] = useState(false);
  const [result,   setResult  ] = useState("");

  useEffect(()=>{
    fetch(`${API}/whatsapp/status`).then(r=>r.json())
      .then(d=>setStatus(d)).catch(()=>{});
  },[]);

  const sendTest = async()=>{
    if(!testPhone.trim()) return;
    setSending(true); setResult("");
    try {
      const r = await fetch(`${API}/whatsapp/send`,{
        method:"POST", headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          phone: testPhone,
          message: "☕ *Golden Beans Test*\n\nYour WhatsApp notifications are working! 🎉\n\n_This is a test message._",
        }),
      }).then(r=>r.json());
      setResult(r.sent ? "✅ Message sent!" : "⚠️ Not sent — check server env vars");
    } catch { setResult("❌ Error sending"); }
    setSending(false);
  };

  const configured = status?.configured;

  return(
    <div style={{background:"#16130E",borderRadius:14,padding:18,border:"1px solid rgba(255,255,255,0.07)"}}>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
        <span style={{fontSize:24}}>💬</span>
        <div>
          <h3 style={{fontFamily:"'DM Sans',sans-serif",fontSize:15,fontWeight:700,color:"#F0E8D8",margin:0}}>
            WhatsApp Notifications
          </h3>
          <p style={{fontSize:11.5,color:"#5C5040",fontFamily:"'DM Sans',sans-serif",margin:0}}>
            Meta Business API — 1000 free messages/month
          </p>
        </div>
        <div style={{marginLeft:"auto",padding:"4px 12px",borderRadius:99,
          background:configured?"rgba(46,125,82,0.2)":"rgba(192,57,43,0.12)",
          border:`1px solid ${configured?"rgba(46,125,82,0.4)":"rgba(192,57,43,0.3)"}`,
          fontSize:11,fontWeight:700,fontFamily:"'DM Mono',monospace",
          color:configured?"#4ADE80":"#F87171"}}>
          {configured?"✓ Connected":"✗ Not configured"}
        </div>
      </div>

      {/* Config instructions */}
      {!configured&&(
        <div style={{background:"rgba(200,146,42,0.06)",border:"1px solid rgba(200,146,42,0.2)",
          borderRadius:11,padding:14,marginBottom:14}}>
          <p style={{fontSize:12.5,fontWeight:700,color:"#E8B84B",fontFamily:"'DM Sans',sans-serif",margin:"0 0 8px"}}>
            Setup Required — Add to server .env:
          </p>
          <code style={{display:"block",background:"rgba(0,0,0,0.4)",borderRadius:8,
            padding:"10px 12px",fontSize:12,color:"#F5EDD8",fontFamily:"'DM Mono',monospace",
            lineHeight:1.7}}>
            WHATSAPP_TOKEN=your_token<br/>
            WHATSAPP_PHONE_ID=your_phone_id
          </code>
          <p style={{fontSize:11,color:"#7A6448",margin:"8px 0 0",fontFamily:"'DM Sans',sans-serif"}}>
            Get credentials at: developers.facebook.com → WhatsApp → API Setup
          </p>
        </div>
      )}

      {/* Notifications sent for: */}
      <div style={{marginBottom:14}}>
        <p style={{fontSize:10.5,fontWeight:700,color:"#5C5040",letterSpacing:".08em",
          textTransform:"uppercase",margin:"0 0 9px",fontFamily:"'DM Mono',monospace"}}>
          Automatic Notifications
        </p>
        {[
          {icon:"✅",label:"Order Confirmed",  desc:"Sent when customer places order"},
          {icon:"🍽️",label:"Order Ready",      desc:"Sent when kitchen marks order ready"},
          {icon:"🫘",label:"Loyalty Points",   desc:"Sent after bill settlement with points earned"},
        ].map((n,i)=>(
          <div key={i} style={{display:"flex",alignItems:"center",gap:10,
            padding:"9px 12px",marginBottom:6,
            background:"rgba(255,255,255,0.025)",borderRadius:10,
            border:"1px solid rgba(255,255,255,0.06)"}}>
            <span style={{fontSize:18,flexShrink:0}}>{n.icon}</span>
            <div>
              <p style={{fontSize:12.5,fontWeight:600,color:"#F0E8D8",
                fontFamily:"'DM Sans',sans-serif",margin:"0 0 1px"}}>{n.label}</p>
              <p style={{fontSize:10.5,color:"#5C5040",fontFamily:"'DM Sans',sans-serif",margin:0}}>{n.desc}</p>
            </div>
            <div style={{marginLeft:"auto",width:8,height:8,borderRadius:"50%",
              background:configured?"#4ADE80":"#5C5040",flexShrink:0}}/>
          </div>
        ))}
      </div>

      {/* Test message */}
      <div>
        <p style={{fontSize:10.5,fontWeight:700,color:"#5C5040",letterSpacing:".08em",
          textTransform:"uppercase",margin:"0 0 9px",fontFamily:"'DM Mono',monospace"}}>
          Send Test Message
        </p>
        <div style={{display:"flex",gap:8}}>
          <input value={testPhone} onChange={e=>setTestPhone(e.target.value.replace(/\D/g,"").slice(0,10))}
            placeholder="Phone number (10 digits)"
            type="tel" inputMode="numeric"
            style={{flex:1,padding:"10px 12px",borderRadius:9,
              border:"1px solid rgba(255,255,255,0.07)",
              background:"rgba(255,255,255,0.03)",color:"#F0E8D8",
              fontSize:13,outline:"none",fontFamily:"'DM Mono',monospace"}}/>
          <button onClick={sendTest} disabled={sending||!testPhone||testPhone.length<10}
            style={{padding:"10px 18px",borderRadius:9,border:"none",
              background:testPhone.length>=10?"linear-gradient(135deg,#C8922A,#F5CC6A)":"rgba(255,255,255,0.04)",
              color:testPhone.length>=10?"#0A0804":"#5C5040",
              fontWeight:700,fontSize:12.5,cursor:testPhone.length>=10?"pointer":"not-allowed",
              fontFamily:"'DM Sans',sans-serif",flexShrink:0}}>
            {sending?"Sending...":"Send Test"}
          </button>
        </div>
        {result&&<p style={{fontSize:12,margin:"8px 0 0",fontFamily:"'DM Sans',sans-serif",
          color:result.includes("✅")?"#4ADE80":result.includes("⚠")?"#E8B84B":"#F87171"}}>
          {result}
        </p>}
      </div>
    </div>
  );
}
