"use client";

// ═══════════════════════════════════════════════════
// KOT PRINT PREVIEW PAGE
// File: src/app/kot/[orderId]/page.tsx
//
// Usage: /kot/{orderId} → browser print preview
// Testing: Open in browser → Ctrl+P → Print
// Production: Same URL → thermal printer prints
// ═══════════════════════════════════════════════════

import { useState, useEffect } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "https://golden-beans-server.onrender.com/api";

const CSS = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #f5f5f5; font-family: 'Courier New', monospace; }

  .kot-wrapper {
    background: white;
    width: 80mm;
    min-height: 100mm;
    margin: 20px auto;
    padding: 6mm;
    box-shadow: 0 2px 12px rgba(0,0,0,0.15);
  }

  /* Print styles */
  @media print {
    * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    body { background: white; margin: 0; }
    .no-print { display: none !important; }
    .kot-wrapper {
      box-shadow: none;
      margin: 0;
      padding: 4mm;
      width: 100%;
    }
  }

  .kot-header { text-align: center; margin-bottom: 4mm; border-bottom: 2px dashed #000; padding-bottom: 3mm; }
  .cafe-name { font-size: 18px; font-weight: bold; letter-spacing: 1px; }
  .cafe-sub { font-size: 10px; letter-spacing: 2px; margin-top: 2px; }
  .kot-title { font-size: 14px; font-weight: bold; margin: 3mm 0 1mm; letter-spacing: 3px; }
  .order-info { display: flex; justify-content: space-between; font-size: 11px; margin: 1.5mm 0; }
  .order-info strong { font-size: 12px; }
  .divider { border: none; border-top: 1px dashed #000; margin: 3mm 0; }
  .items-table { width: 100%; border-collapse: collapse; margin: 2mm 0; }
  .items-table th { font-size: 10px; text-align: left; border-bottom: 1px solid #000; padding: 1.5mm 0; letter-spacing: 1px; }
  .items-table td { font-size: 12px; padding: 1.5mm 0; vertical-align: top; }
  .items-table td:last-child { text-align: right; font-weight: bold; }
  .item-name { font-weight: bold; }
  .item-notes { font-size: 9px; color: #555; margin-top: 1px; }
  .item-variants { font-size: 9px; font-style: italic; margin-top: 1px; }
  .total-row { border-top: 2px solid #000; margin-top: 2mm; padding-top: 2mm; display: flex; justify-content: space-between; font-size: 13px; font-weight: bold; }
  .barcode-section { text-align: center; margin-top: 4mm; padding-top: 3mm; border-top: 2px dashed #000; }
  .barcode-img { height: 50px; max-width: 100%; }
  .barcode-id { font-size: 7px; letter-spacing: 0.5px; margin-top: 2px; color: #333; }
  .scan-text { font-size: 9px; font-weight: bold; letter-spacing: 1.5px; margin-top: 2px; }
  .footer { text-align: center; margin-top: 4mm; padding-top: 2mm; border-top: 1px dashed #000; font-size: 9px; color: #666; }

  /* Screen-only styles */
  .print-btn {
    display: block;
    width: 80mm;
    margin: 12px auto;
    padding: 12px;
    background: #1a1208;
    color: #F5CC6A;
    border: none;
    border-radius: 8px;
    font-size: 14px;
    font-weight: bold;
    cursor: pointer;
    text-align: center;
    font-family: 'Courier New', monospace;
    letter-spacing: 1px;
  }
  .print-btn:hover { background: #2a1e0c; }

  .back-btn {
    display: block;
    width: 80mm;
    margin: 4px auto 20px;
    padding: 10px;
    background: white;
    color: #555;
    border: 1px solid #ccc;
    border-radius: 8px;
    font-size: 12px;
    cursor: pointer;
    text-align: center;
    font-family: 'Courier New', monospace;
  }
`;

interface OrderItem {
  _id: string;
  name: string;
  quantity: number;
  price: number;
  notes?: string;
  status: string;
}

interface Order {
  _id: string;
  orderNumber: string;
  tableNumber: string;
  customerName?: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  totalAmount: number;
  discount?: number;
  createdAt: string;
  createdBy: string;
}

export default function KOTPrintPage({ params }: { params: Promise<{ orderId: string }> }) {
  const [orderId, setOrderId] = useState<string>("");
  const [order,   setOrder  ] = useState<Order|null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError  ] = useState("");

  useEffect(()=>{
    // Read orderId from URL directly — most reliable across Next.js versions
    const path = window.location.pathname; // e.g. /kot/69fed8501f1ecc8ba52873fa
    const parts = path.split("/");
    const id = parts[parts.length - 1];
    if(id && id.length > 10) {
      setOrderId(id);
    } else {
      // Fallback: try params
      Promise.resolve(params).then(p => {
        if(p?.orderId) setOrderId(p.orderId);
        else { setError("Invalid order ID"); setLoading(false); }
      });
    }
  },[params]);

  useEffect(()=>{
    if(!orderId) return;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://golden-beans-server.onrender.com/api";
    fetch(`${apiUrl}/orders/${orderId}`)
      .then(r=>r.json())
      .then(d=>{
        if(d.success) setOrder(d.data);
        else setError(`${d.message||"Order not found"}`);
      })
      .catch(()=>setError("Failed to load order"))
      .finally(()=>setLoading(false));
  },[orderId]);

  const handlePrint = ()=> window.print();

  if(loading) return(
    <div style={{textAlign:"center",padding:40,fontFamily:"monospace"}}>
      Loading KOT...
    </div>
  );

  if(error||!order) return(
    <div style={{textAlign:"center",padding:40,fontFamily:"monospace",color:"red"}}>
      {error||"Order not found"}
    </div>
  );

  const time = new Date(order.createdAt).toLocaleTimeString("en-IN",{
    hour:"2-digit", minute:"2-digit", hour12:true
  });
  const date = new Date(order.createdAt).toLocaleDateString("en-IN",{
    day:"2-digit", month:"short", year:"numeric"
  });
  const barcodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(order._id)}&bgcolor=ffffff&color=000000&margin=4`;
  const isQR = order.createdBy === "customer";

  return(
    <>
      <style>{CSS}</style>

      {/* Print button — hidden when printing */}
      <div className="no-print">
        <button className="print-btn" onClick={handlePrint}>
          🖨️ PRINT KOT
        </button>
        <button className="back-btn" onClick={()=>window.close()}>
          ← Close
        </button>
      </div>

      {/* KOT CONTENT */}
      <div className="kot-wrapper">

        {/* Header */}
        <div className="kot-header">
          <div className="cafe-name">GOLDEN BEANS</div>
          <div className="cafe-sub">CAFE &amp; BISTRO</div>
          <div className="kot-title">--- KOT ---</div>
        </div>

        {/* Order Info */}
        <div className="order-info">
          <span>Table:</span>
          <strong>{order.tableNumber}</strong>
        </div>
        <div className="order-info">
          <span>Order #:</span>
          <strong>{order.orderNumber}</strong>
        </div>
        <div className="order-info">
          <span>Time:</span>
          <span>{time}</span>
        </div>
        <div className="order-info">
          <span>Date:</span>
          <span>{date}</span>
        </div>
        {order.customerName&&(
          <div className="order-info">
            <span>Customer:</span>
            <span>{order.customerName}</span>
          </div>
        )}
        <div className="order-info">
          <span>Type:</span>
          <span>{isQR?"📱 QR Order":"🖥️ Counter"}</span>
        </div>

        <hr className="divider"/>

        {/* Items */}
        <table className="items-table">
          <thead>
            <tr>
              <th>ITEM</th>
              <th style={{textAlign:"center",width:"8mm"}}>QTY</th>
              <th style={{textAlign:"right",width:"14mm"}}>AMT</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item,i)=>(
              <tr key={item._id||i}>
                <td>
                  <div className="item-name">{item.name}</div>
                  {item.notes&&(
                    <div className="item-notes">📝 {item.notes}</div>
                  )}
                </td>
                <td style={{textAlign:"center",fontWeight:"bold"}}>
                  x{item.quantity}
                </td>
                <td>₹{item.price * item.quantity}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <hr className="divider"/>

        {/* Totals */}
        <div className="order-info">
          <span>Subtotal:</span>
          <span>₹{order.subtotal}</span>
        </div>
        {(order.discount||0)>0&&(
          <div className="order-info">
            <span>Discount:</span>
            <span>-₹{order.discount}</span>
          </div>
        )}
        <div className="order-info">
          <span>GST (5%):</span>
          <span>₹{order.tax}</span>
        </div>
        <div className="total-row">
          <span>TOTAL</span>
          <span>₹{order.totalAmount}</span>
        </div>

        {/* Barcode — for scanner gun */}
        <div className="barcode-section">
          <img
            className="barcode-img"
            src={barcodeUrl}
            alt={order._id}
            style={{height:100, width:100}}
            onError={e=>{(e.target as HTMLImageElement).style.display="none";}}
          />
          <div className="barcode-id">{order._id}</div>
          <div className="scan-text">▲ SCAN TO MARK READY ▲</div>
        </div>

        {/* Footer */}
        <div className="footer">
          <div>Thank you! Please visit again.</div>
          <div style={{marginTop:2}}>Golden Beans Cafe &amp; Bistro</div>
        </div>

      </div>
    </>
  );
}
