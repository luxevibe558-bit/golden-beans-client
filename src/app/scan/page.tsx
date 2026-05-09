"use client";

// ═══════════════════════════════════════════════════
// SCAN STATION — Chef Kitchen Scanner Page
// File: src/app/scan/page.tsx
// 
// USAGE: Kitchen PC par browser ma open rakho
// USB scanner gun connect karo
// KOT barcode scan karo → Order auto "ready" thay
// ═══════════════════════════════════════════════════

import { useState, useEffect, useRef, useCallback } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "https://golden-beans-server.onrender.com/api";

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=DM+Sans:opsz,wght@9..40,400;9..40,600;9..40,700&family=DM+Mono:wght@400;500&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #030201; }
  @keyframes popIn   { 0%{transform:scale(0.8);opacity:0} 60%{transform:scale(1.05)} 100%{transform:scale(1);opacity:1} }
  @keyframes fadeIn  { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
  @keyframes pulse   { 0%,100%{box-shadow:0 0 0 0 rgba(200,146,42,0.4)} 50%{box-shadow:0 0 0 18px rgba(200,146,42,0)} }
  @keyframes success { 0%{box-shadow:0 0 0 0 rgba(46,125,82,0.6)} 100%{box-shadow:0 0 0 30px rgba(46,125,82,0)} }
  @keyframes shake   { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-8px)} 75%{transform:translateX(8px)} }
  @keyframes spin    { to{transform:rotate(360deg)} }
  @keyframes scanLine { 0%{top:0%} 100%{top:100%} }
`;

interface ScanResult {
  success:  boolean;
  order?:   { _id:string; orderNumber?:string; tableNumber?:string; items?:any[]; status:string };
  message?: string;
}

interface LogEntry {
  id:        string;
  time:      string;
  barcode:   string;
  status:    "success"|"error"|"duplicate";
  orderNum?: string;
  table?:    string;
}

export default function ScanStationPage() {
  const [buffer,   setBuffer  ] = useState("");
  const [scanning, setScanning] = useState(false);
  const [result,   setResult  ] = useState<ScanResult|null>(null);
  const [log,      setLog     ] = useState<LogEntry[]>([]);
  const [ready,    setReady   ] = useState(false);
  const inputRef  = useRef<HTMLInputElement>(null);

  // Keep hidden input always focused
  useEffect(()=>{
    const keepFocus = () => {
      if(inputRef.current && document.activeElement !== inputRef.current) {
        inputRef.current.focus();
      }
    };
    keepFocus();
    const iv = setInterval(keepFocus, 500);
    window.addEventListener("click", keepFocus);
    return()=>{ clearInterval(iv); window.removeEventListener("click", keepFocus); };
  },[]);
  const timerRef  = useRef<NodeJS.Timeout|null>(null);
  const lastScan  = useRef<string>("");
  const lastTime  = useRef<number>(0);

  // ── Process barcode after scan completes ──
  const processScan = useCallback(async(barcode: string) => {
    const clean = barcode.trim();
    if(!clean || clean.length < 5) return;

    // Debounce — prevent double scan within 2s
    const now = Date.now();
    if(clean === lastScan.current && now - lastTime.current < 2000) return;
    lastScan.current = clean;
    lastTime.current = now;

    setScanning(true);
    setResult(null);

    try {
      // Call server — mark order as ready
      const res = await fetch(`${API}/orders/scan/${clean}`, {
        method: "PATCH",
        headers: { "Content-Type":"application/json" },
        body: JSON.stringify({ status:"ready" }),
      });
      const data = await res.json();

      const entry: LogEntry = {
        id:       Date.now().toString(),
        time:     new Date().toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit",second:"2-digit"}),
        barcode:  clean,
        status:   data.success ? "success" : data.alreadyReady ? "duplicate" : "error",
        orderNum: data.order?.orderNumber || clean.slice(-6).toUpperCase(),
        table:    data.order?.tableNumber,
      };
      setLog(prev=>[entry,...prev.slice(0,19)]);
      setResult(data);

      // Play sound
      try {
        const ctx  = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc  = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.frequency.value = data.success ? 880 : 220;
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
        osc.start(); osc.stop(ctx.currentTime + 0.4);
      } catch {}

    } catch(e) {
      setResult({ success:false, message:"Network error" });
    }
    setScanning(false);
  },[]);

  // ── Keyboard input listener (USB scanner acts as keyboard) ──
  useEffect(()=>{
    setReady(true);

    // Focus page so keyboard events are captured
    window.focus();
    document.body.focus();

    const handleKey = (e: KeyboardEvent) => {
      // Scanner sends Enter after QR data
      if(e.key === "Enter") {
        const barcode = bufferRef.current.trim();
        bufferRef.current = "";
        setBuffer("");
        if(barcode.length > 4) processScan(barcode);
        return;
      }

      // Accept all printable characters (QR can contain any char)
      if(e.key.length === 1 || e.key === "Shift") {
        if(e.key !== "Shift") {
          bufferRef.current += e.key;
          setBuffer(bufferRef.current);
        }

        // Clear timer — scanner sends chars very fast (<50ms apart)
        if(timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(()=>{
          // Auto-process after 200ms silence (scanner done)
          const val = bufferRef.current.trim();
          if(val.length > 8) {
            processScan(val);
          }
          bufferRef.current = "";
          setBuffer("");
        }, 200);
      }
    };

    // Also handle paste (some scanners paste as clipboard)
    const handlePaste = (e: ClipboardEvent) => {
      const text = e.clipboardData?.getData("text")?.trim();
      if(text && text.length > 4) {
        processScan(text);
      }
    };

    window.addEventListener("keydown", handleKey);
    window.addEventListener("paste", handlePaste);
    return()=>{
      window.removeEventListener("keydown", handleKey);
      window.removeEventListener("paste", handlePaste);
    };
  },[processScan]);

  const isSuccess = result?.success;
  const isError   = result && !result.success;

  return(
    <div style={{minHeight:"100dvh",background:"#030201",
      display:"flex",flexDirection:"column",
      fontFamily:"'DM Sans',sans-serif",color:"#F0E8D8"}}
      onClick={()=>inputRef.current?.focus()}>
      <style>{CSS}</style>

      {/* ── HIDDEN INPUT — Always focused, captures scanner ── */}
      <input
        ref={inputRef}
        value={buffer}
        onChange={e=>{
          const val = e.target.value;
          setBuffer(val);
          bufferRef.current = val;
          // Clear debounce timer
          if(timerRef.current) clearTimeout(timerRef.current);
          timerRef.current = setTimeout(()=>{
            const scan = bufferRef.current.trim();
            if(scan.length > 8) processScan(scan);
            bufferRef.current = "";
            setBuffer("");
            if(inputRef.current) inputRef.current.value = "";
          }, 200);
        }}
        onKeyDown={e=>{
          if(e.key === "Enter") {
            const val = bufferRef.current.trim();
            bufferRef.current = "";
            setBuffer("");
            if(inputRef.current) inputRef.current.value = "";
            if(val.length > 4) processScan(val);
          }
        }}
        style={{
          position:"fixed", top:0, left:0,
          width:1, height:1, opacity:0,
          border:"none", outline:"none",
          background:"transparent", color:"transparent",
          fontSize:1, zIndex:999,
        }}
        autoFocus
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
      />

      {/* Header */}
      <div style={{padding:"16px 24px",borderBottom:"1px solid rgba(255,255,255,0.06)",
        display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <div style={{width:36,height:36,borderRadius:10,
            background:"linear-gradient(135deg,#C8922A,#F5CC6A)",
            display:"flex",alignItems:"center",justifyContent:"center",
            fontSize:18}}>☕</div>
          <div>
            <h1 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:20,
              fontWeight:600,color:"#F0E8D8",margin:0}}>Scan Station</h1>
            <p style={{fontSize:11,color:"#5C5040",margin:0,fontFamily:"'DM Mono',monospace"}}>
              Golden Beans Kitchen
            </p>
          </div>
        </div>
        {/* Status indicator */}
        <div style={{display:"flex",alignItems:"center",gap:8,
          padding:"6px 14px",borderRadius:99,
          background:ready?"rgba(46,125,82,0.15)":"rgba(92,80,64,0.2)",
          border:`1px solid ${ready?"rgba(46,125,82,0.4)":"rgba(92,80,64,0.3)"}`}}>
          <div style={{width:8,height:8,borderRadius:"50%",
            background:ready?"#4ADE80":"#5C5040",
            animation:ready?"pulse 2s ease-in-out infinite":"none"}}/>
          <span style={{fontSize:12,fontWeight:600,color:ready?"#4ADE80":"#5C5040",
            fontFamily:"'DM Mono',monospace"}}>
            {ready?"READY TO SCAN":"INITIALIZING"}
          </span>
        </div>
      </div>

      <div style={{flex:1,display:"flex",gap:0,overflow:"hidden"}}>

        {/* ── Scanner area ── */}
        <div style={{flex:1,display:"flex",flexDirection:"column",
          alignItems:"center",justifyContent:"center",padding:32}}
          onClick={()=>{ window.focus(); document.body.focus(); }}
          tabIndex={0}>

          {/* Main scan visual */}
          <div style={{
            width:280,height:280,borderRadius:28,
            background: scanning  ? "rgba(200,146,42,0.08)"
                       : isSuccess ? "rgba(46,125,82,0.1)"
                       : isError   ? "rgba(192,57,43,0.1)"
                       : "rgba(255,255,255,0.02)",
            border: `3px solid ${
              scanning  ? "rgba(200,146,42,0.6)"
              : isSuccess ? "rgba(46,125,82,0.7)"
              : isError   ? "rgba(192,57,43,0.6)"
              : "rgba(255,255,255,0.08)"
            }`,
            display:"flex",flexDirection:"column",
            alignItems:"center",justifyContent:"center",
            position:"relative",overflow:"hidden",
            marginBottom:28,
            animation: scanning  ? "pulse 1s ease-in-out infinite"
                      : isSuccess ? "success 0.6s ease-out"
                      : isError   ? "shake 0.4s ease"
                      : "none",
            transition:"all 0.3s ease",
          }}>
            {/* Scan line animation */}
            {ready && !scanning && !result && (
              <div style={{position:"absolute",left:16,right:16,height:2,
                background:"linear-gradient(90deg,transparent,rgba(200,146,42,0.8),transparent)",
                animation:"scanLine 2s ease-in-out infinite",top:0}}/>
            )}

            {/* Icon */}
            <div style={{fontSize:72,marginBottom:12,
              animation:scanning?"spin 1s linear infinite":result?"popIn 0.4s ease":"none"}}>
              {scanning    ? "⏳"
               : isSuccess ? "✅"
               : isError   ? "❌"
               : "📦"}
            </div>

            {/* Status text */}
            <p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,
              fontWeight:600,textAlign:"center",
              color:scanning?"#E8B84B":isSuccess?"#4ADE80":isError?"#F87171":"#A89878",
              margin:"0 0 6px",padding:"0 16px"}}>
              {scanning    ? "Processing..."
               : isSuccess ? `Order Ready!`
               : isError   ? (result?.message||"Error")
               : "Scan KOT Barcode"}
            </p>

            {isSuccess && result?.order && (
              <div style={{textAlign:"center",animation:"fadeIn 0.4s ease"}}>
                <p style={{fontSize:14,color:"#4ADE80",fontFamily:"'DM Mono',monospace",
                  margin:"0 0 3px"}}>
                  Order #{result.order.orderNumber||"—"}
                </p>
                {result.order.tableNumber&&(
                  <p style={{fontSize:13,color:"rgba(74,222,128,0.7)",
                    fontFamily:"'DM Sans',sans-serif",margin:0}}>
                    Table {result.order.tableNumber} · Waiter notified
                  </p>
                )}
              </div>
            )}

            {/* Buffer display — shows what scanner is sending */}
            {buffer&&(
              <div style={{position:"absolute",bottom:12,left:12,right:12,
                background:"rgba(0,0,0,0.8)",borderRadius:8,
                padding:"8px 12px",fontSize:11,
                color:"rgba(200,146,42,0.9)",fontFamily:"'DM Mono',monospace",
                textAlign:"center",wordBreak:"break-all"}}>
                📡 Receiving: {buffer}
              </div>
            )}
          </div>

          {/* Instructions */}
          <div style={{textAlign:"center",maxWidth:320}}>
            <p style={{fontSize:13,color:"#5C5040",lineHeight:1.7,
              fontFamily:"'DM Sans',sans-serif"}}>
              Point scanner at KOT QR code.<br/>
              <strong style={{color:"#C8922A"}}>Click this area first</strong> to focus,<br/>
              then scan the QR code.
            </p>
            <p style={{fontSize:11,color:"#3A3028",marginTop:8,
              fontFamily:"'DM Mono',monospace"}}>
              📡 Scanner output will appear above
            </p>
          </div>

          {/* Manual input fallback */}
          <div style={{marginTop:20,display:"flex",gap:9,alignItems:"center"}}>
            <input id="manual-input"
              placeholder="Or type order ID manually..."
              onKeyDown={e=>{ if(e.key==="Enter"){ processScan((e.target as HTMLInputElement).value); (e.target as HTMLInputElement).value=""; } }}
              style={{padding:"10px 14px",borderRadius:11,width:220,
                border:"1px solid rgba(255,255,255,0.08)",
                background:"rgba(255,255,255,0.03)",
                color:"#F0E8D8",fontSize:13,outline:"none",
                fontFamily:"'DM Mono',monospace"}}/>
            <button onClick={()=>{
              const inp = document.getElementById("manual-input") as HTMLInputElement;
              if(inp?.value){ processScan(inp.value); inp.value=""; }
            }} style={{padding:"10px 16px",borderRadius:11,border:"none",
              background:"linear-gradient(135deg,#C8922A,#F5CC6A)",
              color:"#0A0804",fontWeight:700,fontSize:12.5,cursor:"pointer",
              fontFamily:"'DM Sans',sans-serif"}}>
              ✓ Mark Ready
            </button>
          </div>
        </div>

        {/* RIGHT — Scan log */}
        <div style={{width:320,borderLeft:"1px solid rgba(255,255,255,0.06)",
          display:"flex",flexDirection:"column",background:"#0A0804"}}>
          <div style={{padding:"14px 16px",borderBottom:"1px solid rgba(255,255,255,0.06)",
            display:"flex",justifyContent:"space-between",alignItems:"center",flexShrink:0}}>
            <p style={{fontSize:11,color:"#C8922A",fontFamily:"'DM Mono',monospace",
              letterSpacing:".14em",textTransform:"uppercase",margin:0}}>
              ✦ Scan Log
            </p>
            <p style={{fontSize:10.5,color:"#5C5040",fontFamily:"'DM Mono',monospace",margin:0}}>
              {log.length} scans
            </p>
          </div>

          <div style={{flex:1,overflowY:"auto",padding:"8px 0",scrollbarWidth:"none"}}>
            {log.length===0 ? (
              <div style={{textAlign:"center",padding:"40px 16px"}}>
                <div style={{fontSize:32,opacity:.2,marginBottom:8}}>📋</div>
                <p style={{fontSize:13,color:"#5C5040",fontFamily:"'DM Sans',sans-serif"}}>
                  No scans yet
                </p>
              </div>
            ) : (
              log.map((entry,i)=>(
                <div key={entry.id}
                  style={{padding:"10px 16px",
                    borderBottom:"1px solid rgba(255,255,255,0.04)",
                    display:"flex",gap:10,alignItems:"flex-start",
                    background:i===0?"rgba(255,255,255,0.02)":"transparent",
                    animation:i===0?"fadeIn 0.3s ease":"none"}}>
                  <div style={{width:32,height:32,borderRadius:9,flexShrink:0,
                    background:entry.status==="success"?"rgba(46,125,82,0.15)"
                              :entry.status==="duplicate"?"rgba(200,146,42,0.1)"
                              :"rgba(192,57,43,0.1)",
                    border:`1px solid ${entry.status==="success"?"rgba(46,125,82,0.3)"
                            :entry.status==="duplicate"?"rgba(200,146,42,0.25)"
                            :"rgba(192,57,43,0.25)"}`,
                    display:"flex",alignItems:"center",justifyContent:"center",
                    fontSize:15}}>
                    {entry.status==="success"?"✅":entry.status==="duplicate"?"🔄":"❌"}
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <p style={{fontSize:12.5,fontWeight:600,
                      color:entry.status==="success"?"#4ADE80"
                           :entry.status==="duplicate"?"#E8B84B":"#F87171",
                      fontFamily:"'DM Sans',sans-serif",margin:"0 0 1px"}}>
                      {entry.status==="success" ? `Order #${entry.orderNum} Ready`
                       :entry.status==="duplicate"? "Already Ready"
                       : "Not Found"}
                    </p>
                    <p style={{fontSize:10.5,color:"#5C5040",
                      fontFamily:"'DM Mono',monospace",margin:0}}>
                      {entry.time}
                      {entry.table&&` · Table ${entry.table}`}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Clear log */}
          {log.length>0&&(
            <button onClick={()=>setLog([])}
              style={{margin:12,padding:"9px",borderRadius:10,
                border:"1px solid rgba(255,255,255,0.07)",
                background:"rgba(255,255,255,0.02)",
                color:"#5C5040",fontSize:12,cursor:"pointer",
                fontFamily:"'DM Sans',sans-serif"}}>
              Clear Log
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
