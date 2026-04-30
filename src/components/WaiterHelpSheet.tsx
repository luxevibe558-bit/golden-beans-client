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
  { type: 'feedback', emoji: '📝', label: 'Feedback' },
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
        setTimeout(() => {
          setSent(null);
          setOpen(false);
        }, 2000);
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
      {/* Floating Help Button */}
      <button
        onClick={() => setOpen(true)}
        style={{
          position: 'fixed',
          bottom: '160px',
          left: '16px',
          right: 'auto',
          zIndex: 999,
          background: 'linear-gradient(135deg, #0F3D2E, #1A5340)',
          color: '#E8C895',
          border: '1.5px solid #D4A574',
          borderRadius: '50px',
          padding: '10px 18px',
          fontSize: '13px',
          fontWeight: '600',
          fontFamily: 'DM Sans, sans-serif',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          boxShadow: '0 4px 20px rgba(15,61,46,0.35)',
          cursor: 'pointer',
          letterSpacing: '0.3px',
        }}
      >
        <span style={{ fontSize: '16px' }}>🙋</span> Help
      </button>

      {/* Backdrop */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.45)',
            zIndex: 1000,
            backdropFilter: 'blur(2px)',
          }}
        />
      )}

      {/* Bottom Sheet */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 1001,
          background: '#FFFBF5',
          borderRadius: '24px 24px 0 0',
          padding: '0 0 32px 0',
          transform: open ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 0.35s cubic-bezier(0.32, 0.72, 0, 1)',
          boxShadow: '0 -8px 40px rgba(15,61,46,0.18)',
        }}
      >
        {/* Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }}>
          <div style={{ width: '36px', height: '4px', borderRadius: '2px', background: '#D4A574', opacity: 0.5 }} />
        </div>

        {/* Header */}
        <div style={{ padding: '12px 24px 16px', borderBottom: '1px solid #F0EAE0' }}>
          <p style={{
            fontFamily: 'Playfair Display, serif',
            fontSize: '18px',
            fontWeight: '700',
            color: '#0F3D2E',
            margin: 0,
          }}>
            How can we help?
          </p>
          <p style={{ fontSize: '12px', color: '#888', margin: '2px 0 0', fontFamily: 'DM Sans, sans-serif' }}>
            Tap to send instant request
          </p>
        </div>

        {/* Success Toast */}
        {sent && (
          <div style={{
            margin: '12px 20px 0',
            background: 'linear-gradient(135deg, #0F3D2E, #1A5340)',
            borderRadius: '12px',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <span style={{ fontSize: '20px' }}>✅</span>
            <span style={{ color: '#E8C895', fontFamily: 'DM Sans, sans-serif', fontSize: '14px', fontWeight: '600' }}>
              {sent} — Request Sent!
            </span>
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
                  : '#FAF6F0',
                border: '1.5px solid',
                borderColor: loading === opt.type ? '#D4A574' : '#E8E0D5',
                borderRadius: '16px',
                padding: '16px 12px',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s ease',
                opacity: loading && loading !== opt.type ? 0.6 : 1,
              }}
            >
              <span style={{ fontSize: '28px' }}>{opt.emoji}</span>
              <span style={{
                fontSize: '13px',
                fontWeight: '600',
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
            color: '#888',
            fontSize: '14px',
            fontFamily: 'DM Sans, sans-serif',
            cursor: 'pointer',
          }}
        >
          Cancel
        </button>
      </div>
    </>
  );
}