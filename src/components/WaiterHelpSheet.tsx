'use client';

import { useState } from 'react';
import { waiterApi } from '@/lib/api';

interface Props {
  tableId: string;
  tableNumber: string;
}

const HELP_OPTIONS = [
  { type: 'water', emoji: '💧', label: 'Water Bottle' },
  { type: 'clean_table', emoji: '🧹', label: 'Clean Table' },
  { type: 'plate_change', emoji: '🍽️', label: 'Plate / Spoon' },
  { type: 'call_waiter', emoji: '🙋', label: 'Call Waiter' },
];

export default function WaiterHelpSheet({ tableId, tableNumber }: Props) {
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState<string | null>(null);
  const [loading, setLoading] = useState<string | null>(null);

  const handleRequest = async (type: string, label: string) => {
    if (loading) return;
    setLoading(type);
    try {
      const res = await waiterApi.createRequest({ tableId, tableNumber, type });
      if (res.success) {
        setSent(label);
        setTimeout(() => { setSent(null); setOpen(false); }, 2000);
      } else if (res.error?.includes('wait 2 minutes')) {
        setSent('Already sent! Wait 2 min ⏳');
        setTimeout(() => setSent(null), 2000);
      }
    } catch {
      setSent('Error. Try again.');
      setTimeout(() => setSent(null), 1500);
    } finally {
      setLoading(null);
    }
  };

  return (
    <>
      <style>{`
        @keyframes helpPulse {
          0%, 100% { box-shadow: 0 4px 16px rgba(200,75,49,0.45), 0 0 0 0 rgba(200,75,49,0.4); transform: scale(1); }
          50% { box-shadow: 0 4px 24px rgba(200,75,49,0.7), 0 0 0 8px rgba(200,75,49,0); transform: scale(1.06); }
        }
        @keyframes helpSlideUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes helpSuccessPop {
          0% { transform: scale(0.9); opacity: 0; }
          60% { transform: scale(1.04); }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>

      {/* Floating Help Button */}
      <button
        onClick={() => setOpen(true)}
        style={{
          position: 'fixed',
          bottom: '14px',
          right: '16px',
          zIndex: 999,
          background: 'linear-gradient(135deg, #C84B31, #E85D3A)',
          color: '#FFFFFF',
          border: '2px solid rgba(255,122,92,0.6)',
          borderRadius: '50%',
          width: '62px',
          height: '62px',
          padding: '0',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '3px',
          cursor: 'pointer',
          animation: 'helpPulse 2.5s ease-in-out infinite',
          letterSpacing: '0.3px',
        }}
      >
        <span style={{ fontSize: '22px' }}>🙋</span>
        <span style={{ fontSize: '10px', lineHeight: '1', fontWeight: '700', fontFamily: 'DM Sans, sans-serif' }}>Help</span>
      </button>

      {/* Backdrop */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 1000,
            backdropFilter: 'blur(3px)',
            animation: 'fadeIn 0.2s ease',
          }}
        />
      )}

      {/* Bottom Sheet */}
      <div style={{
        position: 'fixed',
        bottom: 0, left: 0, right: 0,
        zIndex: 1001,
        background: '#FFFBF5',
        borderRadius: '24px 24px 0 0',
        padding: '0 0 36px 0',
        transform: open ? 'translateY(0)' : 'translateY(100%)',
        transition: 'transform 0.38s cubic-bezier(0.32, 0.72, 0, 1)',
        boxShadow: '0 -12px 48px rgba(15,61,46,0.18)',
      }}>

        {/* Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '14px 0 6px' }}>
          <div style={{ width: '40px', height: '4px', borderRadius: '2px', background: '#D4A574', opacity: 0.4 }} />
        </div>

        {/* Header */}
        <div style={{ padding: '10px 24px 16px', borderBottom: '1px solid #F0EAE0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontFamily: 'Playfair Display, serif', fontSize: '20px', fontWeight: '700', color: '#0F3D2E', margin: 0 }}>
                How can we help?
              </p>
              <p style={{ fontSize: '12px', color: '#aaa', margin: '3px 0 0', fontFamily: 'DM Sans, sans-serif' }}>
                Tap to send instant request to waiter
              </p>
            </div>
            <button onClick={() => setOpen(false)}
              style={{ width: '32px', height: '32px', borderRadius: '50%', border: '1px solid #EDE8E0', background: '#FAF6F0', cursor: 'pointer', fontSize: '14px', color: '#aaa', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              ✕
            </button>
          </div>
        </div>

        {/* Success Toast */}
        {sent && (
          <div style={{
            margin: '14px 20px 0',
            background: 'linear-gradient(135deg, #0F3D2E, #1A5340)',
            borderRadius: '14px',
            padding: '14px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            animation: 'helpSuccessPop 0.3s ease both',
            boxShadow: '0 6px 20px rgba(15,61,46,0.25)',
          }}>
            <span style={{ fontSize: '22px' }}>✅</span>
            <div>
              <p style={{ color: '#E8C895', fontFamily: 'DM Sans, sans-serif', fontSize: '14px', fontWeight: '700', margin: 0 }}>
                {sent} — Request Sent!
              </p>
              <p style={{ color: 'rgba(232,200,149,0.6)', fontFamily: 'DM Sans, sans-serif', fontSize: '11px', margin: '2px 0 0' }}>
                Your waiter is on the way 🙋
              </p>
            </div>
          </div>
        )}

        {/* Options Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '12px',
          padding: '16px 20px 0',
        }}>
          {HELP_OPTIONS.map((opt) => (
            <button
              key={opt.type}
              onClick={() => handleRequest(opt.type, opt.label)}
              disabled={!!loading}
              style={{
                background: loading === opt.type
                  ? 'linear-gradient(135deg, #0F3D2E, #1A5340)'
                  : sent && !loading ? '#F0FDF4' : '#FAF6F0',
                border: '1.5px solid',
                borderColor: loading === opt.type ? '#D4A574' : '#E8E0D5',
                borderRadius: '18px',
                padding: '18px 12px',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s ease',
                opacity: loading && loading !== opt.type ? 0.5 : 1,
                transform: loading === opt.type ? 'scale(0.97)' : 'scale(1)',
                boxShadow: loading === opt.type ? '0 4px 16px rgba(15,61,46,0.2)' : '0 2px 8px rgba(0,0,0,0.04)',
              }}
            >
              <span style={{ fontSize: '30px' }}>{opt.emoji}</span>
              <span style={{
                fontSize: '13px',
                fontWeight: '700',
                color: loading === opt.type ? '#E8C895' : '#0F3D2E',
                fontFamily: 'DM Sans, sans-serif',
              }}>
                {loading === opt.type ? 'Sending...' : opt.label}
              </span>
            </button>
          ))}
        </div>

        {/* Cancel */}
        <button
          onClick={() => setOpen(false)}
          style={{
            display: 'block',
            width: 'calc(100% - 40px)',
            margin: '16px 20px 0',
            padding: '14px',
            background: 'transparent',
            border: '1.5px solid #E8E0D5',
            borderRadius: '14px',
            color: '#aaa',
            fontSize: '14px',
            fontFamily: 'DM Sans, sans-serif',
            cursor: 'pointer',
            fontWeight: '600',
          }}
        >
          Cancel
        </button>
      </div>
    </>
  );
}