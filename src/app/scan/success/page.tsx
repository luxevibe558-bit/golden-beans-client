"use client";
// File: src/app/scan/success/page.tsx
// Opens when chef scans QR code from phone/tablet

import { useEffect, useState } from "react";

export default function ScanSuccessPage() {
  const [order,   setOrder  ] = useState("");
  const [table,   setTable  ] = useState("");
  const [error,   setError  ] = useState("");

  useEffect(()=>{
    const p = new URLSearchParams(window.location.search);
    const o = p.get("order") || "";
    const t = p.get("table") || "";
    const e = p.get("error") || "";
    setOrder(o); setTable(t); setError(e);
    // Auto-close after 4 seconds if opened in new tab
    if(o) setTimeout(()=>{ try{ window.close(); }catch{} }, 4000);
  },[]);

  const ok = order && !error;

  return(
    <div style={{minHeight:"100dvh",background:ok?"#052e16":"#1a0a0a",
      display:"flex",flexDirection:"column",alignItems:"center",
      justifyContent:"center",fontFamily:"'DM Sans',sans-serif",
      padding:24,textAlign:"center"}}>

      <div style={{fontSize:80,marginBottom:16,
        animation:"pop 0.4s cubic-bezier(0.34,1.56,0.64,1)"}}>
        {ok ? "✅" : "❌"}
      </div>

      <h1 style={{fontSize:28,fontWeight:700,
        color:ok?"#4ADE80":"#F87171",margin:"0 0 8px"}}>
        {ok ? "Order Ready!" : "Error"}
      </h1>

      {ok && (
        <>
          <p style={{fontSize:18,color:"rgba(255,255,255,0.8)",margin:"0 0 6px"}}>
            Order #{order}
          </p>
          <p style={{fontSize:15,color:"rgba(255,255,255,0.5)",margin:0}}>
            Table {table} · Waiter notified
          </p>
          <p style={{fontSize:12,color:"rgba(255,255,255,0.3)",marginTop:24}}>
            This window will close automatically...
          </p>
        </>
      )}

      {error && (
        <p style={{fontSize:15,color:"rgba(248,113,113,0.7)",margin:"8px 0 0"}}>
          {decodeURIComponent(error)}
        </p>
      )}

      <style>{`
        @keyframes pop {
          0%{transform:scale(0);opacity:0}
          100%{transform:scale(1);opacity:1}
        }
      `}</style>
    </div>
  );
}
