"use client";

import { useState, useEffect } from "react";

// ═══════════════════════════════════════════════════
// HOME TEXTS EDITOR — Admin Panel Component
// File: src/components/HomeTextsEditor.tsx
// Add to: /pos/settings page or as standalone /pos/home-texts
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
  green:"rgba(46,125,82,0.15)",
};
const GG = `linear-gradient(135deg,${T.gold} 0%,${T.goldM} 52%,${T.goldL} 100%)`;
const EA = "cubic-bezier(0.25,0.46,0.45,0.94)";

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&family=DM+Mono:wght@400;500&display=swap');
*{box-sizing:border-box;-webkit-font-smoothing:antialiased;}
.ht-input:focus{border-color:rgba(200,146,42,0.65)!important;box-shadow:0 0 0 3px rgba(200,146,42,0.1)!important;outline:none;}
.ht-btn:hover{filter:brightness(1.1);transform:translateY(-1px);}
.ht-btn:active{transform:scale(0.97)!important;}
@keyframes ht-in{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
@keyframes spin{to{transform:rotate(360deg)}}
`;

// Default texts
const DEFAULTS = {
  // Welcome screen
  welcomeTitle:    "Golden Beans",
  welcomeSubtitle: "Cafe & Bistro",
  welcomeTagline:  "GETTING THINGS READY FOR YOU",
  welcomeIcon1:    "PREMIUM COFFEE",
  welcomeIcon2:    "QUALITY INGREDIENTS",
  welcomeIcon3:    "MADE WITH LOVE",
  // Hero banner
  heroLine1:       "Brewed to",
  heroLine2:       "perfection,",
  heroLine3:       "just for you.",
  heroSubtext:     "Handcrafted with rare single-origin beans.",
  // Section labels
  sectionBestseller: "Made For You",
  sectionBestsellerEyebrow: "✦ Smart Pick",
  sectionQuickPicks: "Continue Your Favorites",
  sectionQuickEyebrow: "✦ Quick Picks",
  // Footer
  footerLine1:     "🌿 100% Pure Vegetarian",
  footerLine2:     "Crafted with passion · Served with love",
  // Cafe info
  cafeName:        "Golden Beans",
  cafeTagline:     "Cafe & Bistro",
  cafeDesc:        "Premium 100% pure vegetarian cafe. Handcrafted coffee & fresh artisanal snacks.",
};

type TextKeys = keyof typeof DEFAULTS;

const SECTIONS = [
  {
    title: "Welcome Screen",
    icon: "🎬",
    fields: [
      {key:"welcomeTitle",      label:"Cafe Name (large)",    hint:"Main title on welcome screen"},
      {key:"welcomeSubtitle",   label:"Tagline (italic)",     hint:"Under main title"},
      {key:"welcomeTagline",    label:"Loading text",         hint:"Text inside countdown ring"},
      {key:"welcomeIcon1",      label:"Bottom icon 1 text",   hint:"Coffee icon label"},
      {key:"welcomeIcon2",      label:"Bottom icon 2 text",   hint:"Leaf icon label"},
      {key:"welcomeIcon3",      label:"Bottom icon 3 text",   hint:"Heart icon label"},
    ]
  },
  {
    title: "Hero Banner Text",
    icon: "🖼️",
    fields: [
      {key:"heroLine1",         label:"Headline line 1",      hint:"e.g. 'Brewed to'"},
      {key:"heroLine2",         label:"Headline line 2 (gold)",hint:"e.g. 'perfection,' — shown in gold italic"},
      {key:"heroLine3",         label:"Headline line 3",      hint:"e.g. 'just for you.'"},
      {key:"heroSubtext",       label:"Hero subtext",         hint:"Small description below headline"},
    ]
  },
  {
    title: "Section Labels",
    icon: "📋",
    fields: [
      {key:"sectionBestsellerEyebrow", label:"Bestseller eyebrow",  hint:"Small text above section title"},
      {key:"sectionBestseller",        label:"Bestseller section title", hint:"e.g. 'Made For You'"},
      {key:"sectionQuickEyebrow",      label:"Quick picks eyebrow", hint:"Small text above quick picks"},
      {key:"sectionQuickPicks",        label:"Quick picks title",   hint:"e.g. 'Continue Your Favorites'"},
    ]
  },
  {
    title: "Footer",
    icon: "🌿",
    fields: [
      {key:"footerLine1",       label:"Footer line 1",        hint:"e.g. '🌿 100% Pure Vegetarian'"},
      {key:"footerLine2",       label:"Footer line 2",        hint:"e.g. 'Crafted with passion · Served with love'"},
    ]
  },
  {
    title: "Cafe Info",
    icon: "☕",
    fields: [
      {key:"cafeName",          label:"Cafe Name",            hint:"Shown in header and profile"},
      {key:"cafeTagline",       label:"Cafe Tagline",         hint:"Shown under cafe name"},
      {key:"cafeDesc",          label:"Cafe Description",     hint:"Shown in profile tab"},
    ]
  },
];

export default function HomeTextsEditor() {
  const [texts,   setTexts  ] = useState<typeof DEFAULTS>({...DEFAULTS});
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving ] = useState(false);
  const [saved,   setSaved  ] = useState(false);
  const [error,   setError  ] = useState("");

  useEffect(()=>{
    fetch(`${API}/settings/home_texts`)
      .then(r=>r.json())
      .then(d=>{ if(d.data) setTexts({...DEFAULTS,...JSON.parse(d.data)}); })
      .catch(()=>{})
      .finally(()=>setLoading(false));
  },[]);

  const handleSave = async()=>{
    setSaving(true); setError(""); setSaved(false);
    try {
      const res = await fetch(`${API}/settings/home_texts`,{
        method:"PUT",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({value: JSON.stringify(texts)}),
      });
      const data = await res.json();
      if(!data.success) throw new Error(data.message||"Save failed");
      setSaved(true);
      setTimeout(()=>setSaved(false),3000);
    } catch(e:any) {
      setError(e.message||"Could not save");
    }
    setSaving(false);
  };

  const handleReset = ()=>{
    if(!confirm("Reset all texts to defaults?")) return;
    setTexts({...DEFAULTS});
  };

  const upd = (key:TextKeys, val:string) =>
    setTexts(prev=>({...prev,[key]:val}));

  return(
    <div style={{display:"flex",flexDirection:"column",height:"100%",
      background:T.bg0,color:T.ink,fontFamily:"'DM Sans',sans-serif",overflow:"hidden"}}>
      <style>{CSS}</style>

      {/* Header */}
      <div style={{padding:"18px 22px 14px",flexShrink:0,
        borderBottom:`1px solid ${T.gl2}`}}>
        <div style={{display:"flex",alignItems:"flex-start",
          justifyContent:"space-between",marginBottom:4}}>
          <div>
            <h1 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:26,
              fontWeight:600,color:T.ink,margin:"0 0 3px"}}>
              Home Page Texts
            </h1>
            <p style={{fontSize:12.5,color:T.inkS,margin:0}}>
              Edit all customer-facing texts without touching code
            </p>
          </div>
          <div style={{display:"flex",gap:9}}>
            <button onClick={handleReset} className="ht-btn"
              style={{padding:"9px 16px",borderRadius:10,
                border:`1px solid ${T.glBd}`,background:T.gl1,
                color:T.inkS,fontSize:12.5,cursor:"pointer",
                fontFamily:"'DM Sans',sans-serif",
                transition:`all 0.2s ${EA}`}}>
              ↺ Reset
            </button>
            <button onClick={handleSave} disabled={saving} className="ht-btn"
              style={{display:"flex",alignItems:"center",gap:7,
                padding:"9px 20px",borderRadius:10,border:"none",
                background:saving?T.gl1:GG,
                color:saving?T.inkS:"#0A0804",
                fontWeight:700,fontSize:13.5,cursor:saving?"not-allowed":"pointer",
                fontFamily:"'DM Sans',sans-serif",
                boxShadow:saving?"none":`0 4px 16px ${T.g40}`,
                transition:`all 0.2s ${EA}`}}>
              {saving
                ?<><div style={{width:14,height:14,borderRadius:"50%",
                    border:`2px solid rgba(0,0,0,0.2)`,borderTopColor:"rgba(0,0,0,0.6)",
                    animation:"spin .75s linear infinite"}}/>Saving...</>
                :<><span>💾</span> Save Changes</>
              }
            </button>
          </div>
        </div>
        {/* Feedback */}
        {saved&&(
          <div style={{marginTop:10,padding:"9px 14px",borderRadius:9,
            background:T.green,border:"1px solid rgba(46,125,82,0.4)",
            display:"flex",alignItems:"center",gap:8}}>
            <span style={{fontSize:14}}>✓</span>
            <span style={{fontSize:12.5,color:"#4ADE80",
              fontFamily:"'DM Sans',sans-serif",fontWeight:600}}>
              Saved! Changes will appear on customer page immediately.
            </span>
          </div>
        )}
        {error&&(
          <div style={{marginTop:10,padding:"9px 14px",borderRadius:9,
            background:"rgba(192,57,43,0.12)",border:"1px solid rgba(192,57,43,0.35)",
            display:"flex",alignItems:"center",gap:8}}>
            <span style={{fontSize:14}}>⚠</span>
            <span style={{fontSize:12.5,color:"#F87171",fontFamily:"'DM Sans',sans-serif"}}>
              {error}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{flex:1,overflowY:"auto",padding:"16px 22px 40px",
        scrollbarWidth:"none"}}>
        {loading ? (
          <div style={{display:"flex",justifyContent:"center",padding:40}}>
            <div style={{width:24,height:24,borderRadius:"50%",
              border:`2.5px solid ${T.glBd}`,borderTopColor:T.gold,
              animation:"spin .75s linear infinite"}}/>
          </div>
        ) : (
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
            {SECTIONS.map((section,si)=>(
              <div key={section.title}
                style={{background:T.bg1,borderRadius:16,
                  border:`1px solid ${T.glBd}`,overflow:"hidden",
                  animation:`ht-in 0.4s ${si*.07}s ease both`}}>
                {/* Section header */}
                <div style={{padding:"13px 16px",borderBottom:`1px solid ${T.gl2}`,
                  background:T.g08,display:"flex",alignItems:"center",gap:10}}>
                  <span style={{fontSize:20}}>{section.icon}</span>
                  <h3 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:16,
                    fontWeight:600,color:T.ink,margin:0}}>
                    {section.title}
                  </h3>
                </div>
                {/* Fields */}
                <div style={{padding:"14px 16px",
                  display:"flex",flexDirection:"column",gap:12}}>
                  {section.fields.map(field=>(
                    <div key={field.key}>
                      <label style={{fontSize:10.5,fontWeight:700,color:T.inkD,
                        letterSpacing:".08em",textTransform:"uppercase",
                        display:"block",marginBottom:5,
                        fontFamily:"'DM Mono',monospace"}}>
                        {field.label}
                      </label>
                      {/* Preview of current value */}
                      {field.key.includes("Line")||field.key==="heroSubtext"||field.key==="cafeDesc" ? (
                        <textarea
                          className="ht-input"
                          value={texts[field.key as TextKeys]}
                          onChange={e=>upd(field.key as TextKeys,e.target.value)}
                          rows={2}
                          style={{width:"100%",padding:"9px 12px",borderRadius:10,
                            border:`1px solid ${T.glBd}`,background:T.gl1,
                            color:T.ink,fontSize:13,resize:"none",
                            fontFamily:"'DM Sans',sans-serif",lineHeight:1.5}}/>
                      ):(
                        <input
                          className="ht-input"
                          type="text"
                          value={texts[field.key as TextKeys]}
                          onChange={e=>upd(field.key as TextKeys,e.target.value)}
                          style={{width:"100%",padding:"9px 12px",borderRadius:10,
                            border:`1px solid ${T.glBd}`,background:T.gl1,
                            color:T.ink,fontSize:13,
                            fontFamily:"'DM Sans',sans-serif"}}/>
                      )}
                      <p style={{fontSize:10,color:T.inkD,
                        fontFamily:"'DM Sans',sans-serif",margin:"4px 0 0"}}>
                        {field.hint}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
