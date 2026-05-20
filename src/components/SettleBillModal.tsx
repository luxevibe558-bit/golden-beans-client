"use client";

import { useState, useEffect, useRef } from "react";
import { orderApi } from "@/lib/api";
import { Icons, Button, Pill } from "@/components/PremiumUI";
import type { Order } from "@/types";

const T = {
  emerald: "#0F3D2E", emeraldMid: "#1A5340", emeraldLight: "#2D7A5F",
  gold: "#D4A574", goldLight: "#E8C895", goldDark: "#B08550",
  cream: "#FAF6F0", creamDark: "#F0E8DA", ivory: "#FFFBF5",
  border: "#E5DCC9", text: "#1A1208", textMuted: "#7A6B54", textDim: "#A89B80",
  success: "#4A8B4A", danger: "#C0392B", info: "#4A7B9B", warning: "#D4A574",
  blue: "#1D4ED8", blueMid: "#3B82F6", blueLight: "#DBEAFE",
};

type PaymentMethod = "cash" | "card" | "upi" | "due";

const PAYMENT_METHODS: { id: PaymentMethod; label: string; icon: string; color: string }[] = [
  { id: "cash", label: "Cash",  icon: "💵", color: T.success },
  { id: "card", label: "Card",  icon: "💳", color: T.info    },
  { id: "upi",  label: "UPI",   icon: "📱", color: T.gold    },
  { id: "due",  label: "Due",   icon: "📒", color: T.danger  },
];

interface SettleBillModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onSettled: () => void;
}

export default function SettleBillModal({ order, isOpen, onClose, onSettled }: SettleBillModalProps) {
  const [paymentMethod,     setPaymentMethod    ] = useState<PaymentMethod>("cash");
  const [cashTendered,      setCashTendered     ] = useState("");
  const [discount,          setDiscount         ] = useState("");
  const [discountType,      setDiscountType     ] = useState<"flat"|"percent">("flat");
  const [dueCustomerName,   setDueCustomerName  ] = useState("");
  const [dueCustomerPhone,  setDueCustomerPhone ] = useState("");
  const [notes,             setNotes            ] = useState("");
  const [settling,          setSettling         ] = useState(false);
  const cashInputRef = useRef<HTMLInputElement>(null);

  // ── Online payment detection ──
  const paidOnline     = !!(order as any)?.paidOnline || !!(order as any)?.razorpayPaymentId;
  const onlinePayId    = (order as any)?.razorpayPaymentId || null;
  const onlineAmount   = (order as any)?.onlinePaymentAmount || order?.totalAmount || 0;

  useEffect(() => {
    if (isOpen && order) {
      // Auto-select UPI if paid online
      setPaymentMethod(paidOnline ? "upi" : "cash");
      setCashTendered("");
      setDiscount(order.discount > 0 ? String(order.discount) : "");
      setDiscountType("flat");
      setDueCustomerName(order.customerName || "");
      setDueCustomerPhone(order.customerPhone || "");
      setNotes("");
      if (!paidOnline) setTimeout(() => cashInputRef.current?.focus(), 300);
    }
  }, [isOpen, order]);

  if (!isOpen || !order) return null;

  // ── Bill Calculations ──
  const subtotal          = order.subtotal || order.items.reduce((s, i) => s + i.price * i.quantity, 0);
  const promoDiscount     = order.discount || 0;
  const manualDiscountRaw = parseFloat(discount) || 0;
  const manualDiscount    = discountType === "percent" ? Math.round((subtotal - promoDiscount) * manualDiscountRaw / 100) : manualDiscountRaw;
  const totalDiscount     = promoDiscount + manualDiscount;
  const discountedSubtotal= Math.max(0, subtotal - totalDiscount);
  const gstAmount         = Math.round(discountedSubtotal * 0.05);
  const grandTotal        = discountedSubtotal + gstAmount;
  const cashTenderedNum   = parseFloat(cashTendered) || 0;
  const changeAmount      = paymentMethod === "cash" ? Math.max(0, cashTenderedNum - grandTotal) : 0;
  const cashShort         = paymentMethod === "cash" && cashTenderedNum > 0 && cashTenderedNum < grandTotal;

  const quickAmounts = [grandTotal, Math.ceil(grandTotal/50)*50, Math.ceil(grandTotal/100)*100, Math.ceil(grandTotal/500)*500]
    .filter((v,i,arr) => arr.indexOf(v) === i).slice(0,4);

  // ── Print Receipt ──
  const handlePrint = () => {
    const win = window.open('', '_blank', 'width=400,height=600');
    if (!win) return;
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' });
    const timeStr = now.toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit', hour12:true });
    const itemsHtml = order.items.map(i => `<tr><td style="padding:4px 0;font-size:13px;">${i.name}</td><td style="padding:4px 0;font-size:13px;text-align:center;">x${i.quantity}</td><td style="padding:4px 0;font-size:13px;text-align:right;">₹${(i.price*i.quantity).toFixed(0)}</td></tr>`).join('');
    win.document.write(`<!DOCTYPE html><html><head><title>Bill - ${order.orderNumber}</title>
    <style>*{margin:0;padding:0;box-sizing:border-box;}body{font-family:'Courier New',monospace;width:300px;margin:0 auto;padding:12px;color:#000;}.center{text-align:center;}.bold{font-weight:bold;}.divider{border-top:1px dashed #000;margin:8px 0;}.divider-solid{border-top:2px solid #000;margin:8px 0;}table{width:100%;border-collapse:collapse;}.total-row td{font-weight:bold;font-size:15px;padding:4px 0;}.paid-badge{background:#1D4ED8;color:white;padding:3px 8px;border-radius:4px;font-size:11px;font-weight:bold;}@media print{button{display:none;}}</style>
    </head><body>
    <div class="center" style="margin-bottom:8px;">
      <div style="font-size:20px;margin-bottom:4px;">☕</div>
      <div class="bold" style="font-size:16px;">GOLDEN BEANS</div>
      <div style="font-size:11px;">Cafe & Bistro</div>
      <div style="font-size:10px;margin-top:2px;">100% Pure Vegetarian</div>
      <div style="font-size:10px;">Pramukh Darshan Society, Dabholi, Surat</div>
    </div>
    <div class="divider-solid"></div>
    <div style="font-size:11px;margin-bottom:6px;">
      <div style="display:flex;justify-content:space-between;"><span>Bill No: <b>${order.orderNumber}</b></span><span>Table: <b>${order.tableNumber}</b></span></div>
      <div style="display:flex;justify-content:space-between;margin-top:2px;"><span>${dateStr}</span><span>${timeStr}</span></div>
      ${order.customerName ? `<div style="margin-top:2px;">Customer: <b>${order.customerName}</b></div>` : ''}
    </div>
    <div class="divider"></div>
    <table><thead><tr><th style="text-align:left;font-size:11px;padding:2px 0;">Item</th><th style="text-align:center;font-size:11px;">Qty</th><th style="text-align:right;font-size:11px;">Amt</th></tr></thead><tbody>${itemsHtml}</tbody></table>
    <div class="divider"></div>
    <table>
      <tr><td style="font-size:12px;padding:2px 0;">Subtotal</td><td style="font-size:12px;text-align:right;">₹${subtotal.toFixed(0)}</td></tr>
      ${totalDiscount > 0 ? `<tr><td style="font-size:12px;padding:2px 0;">Discount</td><td style="font-size:12px;text-align:right;">-₹${totalDiscount.toFixed(0)}</td></tr>` : ''}
      <tr><td style="font-size:12px;padding:2px 0;">GST (5%)</td><td style="font-size:12px;text-align:right;">₹${gstAmount.toFixed(0)}</td></tr>
    </table>
    <div class="divider-solid"></div>
    <table>
      <tr class="total-row"><td>TOTAL</td><td style="text-align:right;">₹${grandTotal.toFixed(0)}</td></tr>
      <tr><td style="font-size:12px;padding:2px 0;">Payment</td><td style="font-size:12px;text-align:right;text-transform:uppercase;">${paidOnline ? 'UPI (Online)' : paymentMethod}</td></tr>
      ${paidOnline && onlinePayId ? `<tr><td style="font-size:11px;padding:2px 0;color:#555;">Razorpay ID</td><td style="font-size:10px;text-align:right;color:#555;">${onlinePayId.slice(-12).toUpperCase()}</td></tr>` : ''}
      ${paymentMethod === 'cash' && cashTenderedNum > 0 ? `<tr><td style="font-size:12px;padding:2px 0;">Cash</td><td style="font-size:12px;text-align:right;">₹${cashTenderedNum.toFixed(0)}</td></tr><tr><td style="font-size:12px;padding:2px 0;">Change</td><td style="font-size:12px;text-align:right;">₹${changeAmount.toFixed(0)}</td></tr>` : ''}
    </table>
    ${paidOnline ? `<div style="margin-top:8px;text-align:center;"><span class="paid-badge">✓ PAID ONLINE</span></div>` : ''}
    <div class="divider"></div>
    <div class="center" style="font-size:11px;margin-top:8px;"><div>Thank you for visiting!</div><div style="margin-top:4px;">Please visit again ☕</div></div>
    <div style="text-align:center;margin-top:16px;"><button onclick="window.print();window.close();" style="padding:10px 24px;background:#0F3D2E;color:#E8C895;border:none;border-radius:8px;font-size:14px;font-weight:bold;cursor:pointer;">🖨️ Print</button></div>
    </body></html>`);
    win.document.close();
  };

  // ── Settle ──
  const handleSettle = async () => {
    if (paymentMethod === "due" && !dueCustomerName.trim()) { alert("Please enter customer name for due payment"); return; }
    if (paymentMethod === "cash" && cashTenderedNum > 0 && cashTenderedNum < grandTotal) {
      if (!confirm(`Cash tendered (₹${cashTenderedNum}) is less than total (₹${grandTotal}). Continue?`)) return;
    }
    setSettling(true);
    try {
      await orderApi.settleOrder(order._id, {
        amountPaid: grandTotal,
        paymentMethod: paidOnline ? "upi" : paymentMethod,
        discount: totalDiscount,
        resolvedBy: "pos",
      } as any);
      if (paymentMethod === "due") {
        const existingDues = JSON.parse(localStorage.getItem("gb_dues") || "[]");
        existingDues.push({ id: Date.now(), orderId: order._id, orderNumber: order.orderNumber, tableNumber: order.tableNumber, customerName: dueCustomerName, customerPhone: dueCustomerPhone, amount: grandTotal, items: order.items, notes, date: new Date().toISOString(), settled: false });
        localStorage.setItem("gb_dues", JSON.stringify(existingDues));
      }
      onSettled();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Settlement failed");
    } finally { setSettling(false); }
  };

  return (
    <div onClick={onClose} style={{ position:"fixed", inset:0, background:"rgba(15,61,46,0.75)", zIndex:100, display:"flex", alignItems:"center", justifyContent:"center", padding:"16px", backdropFilter:"blur(8px)" }}>
      <div onClick={e => e.stopPropagation()} style={{ background:T.ivory, borderRadius:"24px", width:"100%", maxWidth:"520px", maxHeight:"92vh", display:"flex", flexDirection:"column", overflow:"hidden", boxShadow:"0 32px 64px rgba(15,61,46,0.25)", animation:"gb-scaleIn 300ms cubic-bezier(0.34, 1.56, 0.64, 1)" }}>

        <div style={{ height:"3px", background:`linear-gradient(90deg, ${T.goldDark}, ${T.gold}, ${T.goldLight}, ${T.gold}, ${T.goldDark})` }}/>

        {/* Header */}
        <div style={{ padding:"16px 20px", background:`linear-gradient(135deg, ${T.emerald}, ${T.emeraldMid})`, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div>
            <p style={{ fontSize:"10px", color:"rgba(212,165,116,0.7)", fontWeight:800, letterSpacing:"0.08em", textTransform:"uppercase", margin:"0 0 3px" }}>Settle Bill</p>
            <h2 style={{ fontFamily:"'Playfair Display', serif", fontSize:"22px", fontWeight:800, color:T.gold, margin:0 }}>Order #{order.orderNumber}</h2>
            <p style={{ fontSize:"11px", color:"rgba(212,165,116,0.7)", margin:"3px 0 0", fontWeight:600 }}>Table {order.tableNumber}{order.customerName && ` · ${order.customerName}`}</p>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
            {/* Online payment badge in header */}
            {paidOnline && (
              <div style={{ background:"rgba(59,130,246,0.2)", border:"1px solid rgba(59,130,246,0.4)", borderRadius:"10px", padding:"6px 12px", textAlign:"center" }}>
                <p style={{ fontSize:"9px", color:"#93C5FD", fontWeight:800, letterSpacing:"0.08em", textTransform:"uppercase", margin:"0 0 1px" }}>PAID ONLINE</p>
                <p style={{ fontSize:"12px", color:"white", fontWeight:900, margin:0 }}>₹{grandTotal.toFixed(0)}</p>
              </div>
            )}
            <button onClick={onClose} style={{ width:"36px", height:"36px", borderRadius:"50%", background:"rgba(255,255,255,0.1)", border:"1px solid rgba(212,165,116,0.2)", color:T.gold, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <Icons.Close size={16}/>
            </button>
          </div>
        </div>

        {/* Scrollable content */}
        <div style={{ flex:1, overflowY:"auto", padding:"16px 20px" }}>

          {/* ── ONLINE PAYMENT BANNER ── */}
          {paidOnline && (
            <div style={{ background:"linear-gradient(135deg, rgba(29,78,216,0.08), rgba(59,130,246,0.05))", border:"2px solid rgba(59,130,246,0.3)", borderRadius:"16px", padding:"16px", marginBottom:"16px", animation:"gb-fadeInUp 0.3s ease" }}>
              <div style={{ display:"flex", alignItems:"center", gap:"12px", marginBottom:"10px" }}>
                <div style={{ width:"44px", height:"44px", borderRadius:"12px", background:"rgba(59,130,246,0.15)", border:"1px solid rgba(59,130,246,0.3)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"22px", flexShrink:0 }}>💳</div>
                <div>
                  <p style={{ fontSize:"14px", fontWeight:900, color:T.blue, margin:"0 0 2px" }}>Online Payment Received!</p>
                  <p style={{ fontSize:"11px", color:T.blueMid, margin:0, fontWeight:600 }}>Customer paid via UPI/Card before ordering</p>
                </div>
                <div style={{ marginLeft:"auto", background:T.blueLight, borderRadius:"10px", padding:"4px 12px", flexShrink:0 }}>
                  <p style={{ fontSize:"10px", fontWeight:800, color:T.blue, margin:0 }}>✓ VERIFIED</p>
                </div>
              </div>
              <div style={{ background:"rgba(255,255,255,0.6)", borderRadius:"10px", padding:"10px 12px", border:"1px solid rgba(59,130,246,0.15)" }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"5px" }}>
                  <span style={{ fontSize:"11px", color:T.textMuted, fontWeight:700 }}>Amount Paid</span>
                  <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:"15px", fontWeight:900, color:T.blue }}>₹{grandTotal.toFixed(0)}</span>
                </div>
                {onlinePayId && (
                  <div style={{ display:"flex", justifyContent:"space-between" }}>
                    <span style={{ fontSize:"11px", color:T.textMuted, fontWeight:700 }}>Razorpay ID</span>
                    <span style={{ fontFamily:"'DM Mono',monospace", fontSize:"11px", fontWeight:700, color:T.textMuted }}>
                      ...{onlinePayId.slice(-10).toUpperCase()}
                    </span>
                  </div>
                )}
                <div style={{ display:"flex", justifyContent:"space-between", marginTop:"5px", paddingTop:"5px", borderTop:"1px dashed rgba(59,130,246,0.2)" }}>
                  <span style={{ fontSize:"11px", color:T.textMuted, fontWeight:700 }}>Payment Method</span>
                  <span style={{ fontSize:"11px", fontWeight:800, color:T.blue }}>UPI / Razorpay</span>
                </div>
              </div>
              <p style={{ fontSize:"11px", color:T.blueMid, margin:"8px 0 0", fontWeight:600, textAlign:"center" }}>
                💡 No cash collection needed — just close the table
              </p>
            </div>
          )}

          {/* Items */}
          <div style={{ marginBottom:"16px" }}>
            <p style={{ fontSize:"10px", fontWeight:800, color:T.textMuted, letterSpacing:"0.08em", textTransform:"uppercase", margin:"0 0 8px" }}>Items Ordered</p>
            <div style={{ background:T.cream, borderRadius:"12px", overflow:"hidden", border:`1px solid ${T.border}` }}>
              {order.items.map((item, idx) => (
                <div key={idx} style={{ padding:"10px 12px", borderBottom:idx < order.items.length-1 ? `1px solid ${T.creamDark}` : "none", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <div style={{ flex:1 }}>
                    <span style={{ fontWeight:700, fontSize:"13px", color:T.text }}>{item.name}</span>
                    {item.notes && <p style={{ fontSize:"10px", color:T.textMuted, margin:"2px 0 0", fontWeight:600 }}>{item.notes}</p>}
                  </div>
                  <div style={{ display:"flex", alignItems:"center", gap:"12px", flexShrink:0 }}>
                    <span style={{ fontSize:"12px", color:T.textMuted, fontWeight:600 }}>×{item.quantity}</span>
                    <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:"13px", fontWeight:800, color:T.emerald, minWidth:"52px", textAlign:"right" }}>₹{(item.price * item.quantity).toFixed(0)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Discount — hide if paid online (discount already applied) */}
          {!paidOnline && (
            <div style={{ marginBottom:"16px" }}>
              <p style={{ fontSize:"10px", fontWeight:800, color:T.textMuted, letterSpacing:"0.08em", textTransform:"uppercase", margin:"0 0 8px" }}>Additional Discount</p>
              <div style={{ display:"flex", gap:"8px" }}>
                <div style={{ display:"flex", background:T.cream, borderRadius:"10px", border:`1px solid ${T.border}`, overflow:"hidden", flexShrink:0 }}>
                  <button onClick={() => setDiscountType("flat")} style={{ padding:"10px 14px", border:"none", cursor:"pointer", background:discountType==="flat" ? `linear-gradient(135deg, ${T.emerald}, ${T.emeraldMid})` : "transparent", color:discountType==="flat" ? T.gold : T.textMuted, fontWeight:800, fontSize:"12px" }}>₹</button>
                  <button onClick={() => setDiscountType("percent")} style={{ padding:"10px 14px", border:"none", cursor:"pointer", background:discountType==="percent" ? `linear-gradient(135deg, ${T.emerald}, ${T.emeraldMid})` : "transparent", color:discountType==="percent" ? T.gold : T.textMuted, fontWeight:800, fontSize:"12px" }}>%</button>
                </div>
                <input type="number" placeholder={discountType==="flat" ? "₹ Amount" : "% Value"} value={discount} onChange={e => setDiscount(e.target.value)} min="0"
                  style={{ flex:1, padding:"10px 14px", borderRadius:"10px", border:`1.5px solid ${discount ? T.gold : T.border}`, background:T.ivory, color:T.text, fontSize:"16px", fontFamily:"'DM Sans',sans-serif", fontWeight:700, outline:"none", boxSizing:"border-box" }}/>
                {discount && <button onClick={() => setDiscount("")} style={{ width:"40px", height:"40px", borderRadius:"10px", background:T.cream, border:`1px solid ${T.border}`, color:T.textMuted, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}><Icons.Close size={14}/></button>}
              </div>
              {manualDiscount > 0 && <p style={{ fontSize:"11px", color:T.success, margin:"5px 0 0", fontWeight:700 }}>✓ Discount: -₹{manualDiscount}</p>}
            </div>
          )}

          {/* Payment Method — locked if paid online */}
          <div style={{ marginBottom:"16px" }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"8px" }}>
              <p style={{ fontSize:"10px", fontWeight:800, color:T.textMuted, letterSpacing:"0.08em", textTransform:"uppercase", margin:0 }}>Payment Method</p>
              {paidOnline && <span style={{ fontSize:"10px", fontWeight:700, color:T.blueMid, background:T.blueLight, borderRadius:"6px", padding:"2px 8px" }}>🔒 Locked — Online</span>}
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:"8px" }}>
              {PAYMENT_METHODS.map(method => {
                const isSelected = paidOnline ? method.id === "upi" : paymentMethod === method.id;
                const isLocked   = paidOnline && method.id !== "upi";
                return (
                  <button key={method.id} onClick={() => !paidOnline && setPaymentMethod(method.id)}
                    style={{ padding:"12px 6px", borderRadius:"12px", background:isLocked ? T.creamDark : isSelected ? `linear-gradient(135deg, ${method.color}, ${method.color}dd)` : T.cream, color:isLocked ? T.textDim : isSelected ? "white" : T.textMuted, border:`2px solid ${isLocked ? T.border : isSelected ? method.color : T.border}`, cursor:isLocked ? "not-allowed" : "pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:"5px", opacity:isLocked ? 0.4 : 1, boxShadow:isSelected && !isLocked ? `0 4px 12px ${method.color}40` : "none" }}>
                    <span style={{ fontSize:"20px" }}>{method.icon}</span>
                    <span style={{ fontWeight:800, fontSize:"11px" }}>{method.label}</span>
                    {paidOnline && method.id === "upi" && <span style={{ fontSize:"8px", fontWeight:800, color:"white" }}>ONLINE</span>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Cash tendered — only if not paid online */}
          {paymentMethod === "cash" && !paidOnline && (
            <div style={{ marginBottom:"16px", animation:"gb-fadeInUp 0.2s ease both" }}>
              <p style={{ fontSize:"10px", fontWeight:800, color:T.textMuted, letterSpacing:"0.08em", textTransform:"uppercase", margin:"0 0 8px" }}>Cash Tendered</p>
              <div style={{ display:"flex", gap:"6px", marginBottom:"8px", flexWrap:"wrap" }}>
                {quickAmounts.map(amount => (
                  <button key={amount} onClick={() => setCashTendered(String(amount))} style={{ padding:"8px 14px", borderRadius:"8px", background:cashTenderedNum===amount ? `linear-gradient(135deg, ${T.emerald}, ${T.emeraldMid})` : T.cream, color:cashTenderedNum===amount ? T.gold : T.textMuted, border:`1.5px solid ${cashTenderedNum===amount ? T.emerald : T.border}`, fontWeight:800, fontSize:"12px", cursor:"pointer" }}>
                    {amount === grandTotal ? "Exact" : `₹${amount}`}
                  </button>
                ))}
              </div>
              <input ref={cashInputRef} type="number" placeholder={`₹${grandTotal} or more`} value={cashTendered} onChange={e => setCashTendered(e.target.value)}
                style={{ width:"100%", padding:"12px 14px", borderRadius:"10px", border:`2px solid ${cashShort ? T.danger : cashTenderedNum >= grandTotal ? T.success : T.border}`, background:T.ivory, color:T.text, fontSize:"20px", fontFamily:"'DM Sans',sans-serif", fontWeight:800, outline:"none", boxSizing:"border-box" }}/>
              {cashTenderedNum >= grandTotal && (
                <div style={{ marginTop:"10px", background:`linear-gradient(135deg, ${T.success}, #2d6a2d)`, borderRadius:"12px", padding:"12px 16px", display:"flex", justifyContent:"space-between", alignItems:"center", boxShadow:"0 4px 12px rgba(74,139,74,0.25)" }}>
                  <div>
                    <p style={{ fontSize:"11px", color:"rgba(255,255,255,0.8)", margin:0, fontWeight:700 }}>Change to Return</p>
                    <p style={{ fontSize:"10px", color:"rgba(255,255,255,0.6)", margin:"2px 0 0", fontWeight:600 }}>₹{cashTenderedNum} - ₹{grandTotal}</p>
                  </div>
                  <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:"28px", fontWeight:900, color:"white", margin:0 }}>₹{changeAmount}</p>
                </div>
              )}
              {cashShort && <p style={{ fontSize:"11px", color:T.danger, margin:"6px 0 0", fontWeight:700 }}>⚠ Short by ₹{(grandTotal - cashTenderedNum).toFixed(0)}</p>}
            </div>
          )}

          {/* Due Info */}
          {paymentMethod === "due" && !paidOnline && (
            <div style={{ marginBottom:"16px", animation:"gb-fadeInUp 0.2s ease both" }}>
              <div style={{ background:"rgba(192,57,43,0.08)", border:`1.5px solid rgba(192,57,43,0.25)`, borderRadius:"12px", padding:"12px 14px", marginBottom:"12px" }}>
                <p style={{ fontSize:"12px", color:T.danger, fontWeight:700, margin:0 }}>📒 This amount will be added to the Due Ledger.</p>
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
                <div>
                  <label style={{ display:"block", fontSize:"10px", fontWeight:800, color:T.textMuted, marginBottom:"5px", textTransform:"uppercase" }}>Customer Name *</label>
                  <input type="text" placeholder="Full name required" value={dueCustomerName} onChange={e => setDueCustomerName(e.target.value)} style={{ width:"100%", padding:"11px 14px", borderRadius:"10px", border:`2px solid ${dueCustomerName ? T.gold : T.border}`, background:T.ivory, color:T.text, fontSize:"16px", outline:"none", boxSizing:"border-box" }}/>
                </div>
                <div>
                  <label style={{ display:"block", fontSize:"10px", fontWeight:800, color:T.textMuted, marginBottom:"5px", textTransform:"uppercase" }}>Phone (Optional)</label>
                  <input type="tel" placeholder="10-digit phone" value={dueCustomerPhone} onChange={e => setDueCustomerPhone(e.target.value.replace(/\D/g,"").slice(0,10))} style={{ width:"100%", padding:"11px 14px", borderRadius:"10px", border:`2px solid ${dueCustomerPhone.length===10 ? T.gold : T.border}`, background:T.ivory, color:T.text, fontSize:"16px", outline:"none", boxSizing:"border-box" }}/>
                </div>
                <div>
                  <label style={{ display:"block", fontSize:"10px", fontWeight:800, color:T.textMuted, marginBottom:"5px", textTransform:"uppercase" }}>Notes</label>
                  <input type="text" placeholder="e.g. Regular customer" value={notes} onChange={e => setNotes(e.target.value)} style={{ width:"100%", padding:"11px 14px", borderRadius:"10px", border:`1.5px solid ${T.border}`, background:T.ivory, color:T.text, fontSize:"14px", outline:"none", boxSizing:"border-box" }}/>
                </div>
              </div>
            </div>
          )}

          {/* CRM info */}
          {order.customerName && (
            <div style={{ background:T.cream, borderRadius:"12px", padding:"12px 14px", marginBottom:"16px", border:`1px solid ${T.border}`, display:"flex", alignItems:"center", gap:"10px" }}>
              <div style={{ width:"36px", height:"36px", borderRadius:"50%", background:`linear-gradient(135deg, ${T.emerald}, ${T.emeraldMid})`, display:"flex", alignItems:"center", justifyContent:"center", color:T.gold, fontWeight:800, fontSize:"14px", flexShrink:0 }}>{order.customerName.charAt(0).toUpperCase()}</div>
              <div>
                <p style={{ fontWeight:800, fontSize:"13px", color:T.emerald, margin:0 }}>{order.customerName}</p>
                {order.customerPhone && <p style={{ fontSize:"11px", color:T.textMuted, margin:"2px 0 0", fontWeight:600 }}>📞 {order.customerPhone}</p>}
              </div>
              <Pill variant="gold" size="sm" style={{ marginLeft:"auto" }}>{paidOnline ? "💳 Online Order" : "QR Customer"}</Pill>
            </div>
          )}
        </div>

        {/* Footer — Bill Summary + Buttons */}
        <div style={{ padding:"14px 20px 20px", borderTop:`1px solid ${T.border}`, background:T.cream }}>
          <div style={{ marginBottom:"12px" }}>
            <div style={{ display:"flex", justifyContent:"space-between", fontSize:"12px", color:T.textMuted, marginBottom:"4px" }}><span>Subtotal</span><span style={{ fontFamily:"'DM Sans',sans-serif", fontWeight:700, color:T.text }}>₹{subtotal.toFixed(0)}</span></div>
            {promoDiscount > 0 && <div style={{ display:"flex", justifyContent:"space-between", fontSize:"12px", color:T.success, marginBottom:"4px", fontWeight:700 }}><span>🎉 Promo Discount</span><span>-₹{promoDiscount.toFixed(0)}</span></div>}
            {manualDiscount > 0 && <div style={{ display:"flex", justifyContent:"space-between", fontSize:"12px", color:T.success, marginBottom:"4px", fontWeight:700 }}><span>✂️ Manual Discount</span><span>-₹{manualDiscount.toFixed(0)}</span></div>}
            <div style={{ display:"flex", justifyContent:"space-between", fontSize:"12px", color:T.textMuted, marginBottom:"4px" }}><span>GST (5%)</span><span style={{ fontFamily:"'DM Sans',sans-serif", fontWeight:700, color:T.text }}>₹{gstAmount.toFixed(0)}</span></div>
            <div style={{ display:"flex", justifyContent:"space-between", fontWeight:800, fontSize:"20px", color:T.emerald, padding:"8px 0", borderTop:`1px dashed ${T.border}`, marginTop:"6px" }}>
              <span style={{ fontFamily:"'Playfair Display',serif" }}>Grand Total</span>
              <span style={{ fontFamily:"'DM Sans',sans-serif" }}>₹{grandTotal.toFixed(0)}</span>
            </div>
            {paidOnline && <p style={{ fontSize:"11px", color:T.blue, textAlign:"right", margin:"2px 0 0", fontWeight:800 }}>✓ This amount already received online</p>}
          </div>

          <button onClick={handlePrint} style={{ width:"100%", padding:"11px", marginBottom:"10px", borderRadius:"12px", border:`1px solid ${T.border}`, background:T.ivory, color:T.emerald, fontSize:"13px", fontWeight:800, cursor:"pointer", fontFamily:"inherit", display:"flex", alignItems:"center", justifyContent:"center", gap:"8px" }}>
            🖨️ Print Receipt
          </button>

          {/* Smart settle button */}
          <button onClick={handleSettle} disabled={settling || (paymentMethod === "due" && !dueCustomerName.trim())}
            style={{ width:"100%", padding:"16px",
              background: settling ? T.textDim
                : paidOnline ? `linear-gradient(135deg, ${T.blue}, ${T.blueMid})`
                : paymentMethod === "due" ? `linear-gradient(135deg, ${T.danger}, #a93226)`
                : `linear-gradient(135deg, ${T.emerald}, ${T.emeraldMid})`,
              color: paidOnline ? "white" : paymentMethod === "due" ? "white" : T.gold,
              border:"none", borderRadius:"14px", fontWeight:800, fontSize:"16px",
              cursor:settling ? "wait" : "pointer",
              boxShadow: settling ? "none" : paidOnline ? "0 8px 24px rgba(59,130,246,0.4)" : "0 8px 24px rgba(15,61,46,0.3)",
              display:"flex", alignItems:"center", justifyContent:"space-between",
              fontFamily:"inherit",
            }}>
            <span>
              {settling ? "Processing..." :
               paidOnline ? "🔒 Close Table — Already Paid" :
               paymentMethod === "due" ? "📒 Add to Due Ledger" :
               "✓ Settle & Close"}
            </span>
            <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:"18px" }}>₹{grandTotal.toFixed(0)}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
