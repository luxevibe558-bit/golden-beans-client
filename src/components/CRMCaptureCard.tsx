'use client';

import { useState, useEffect } from 'react';
import { crmCaptureApi } from '@/lib/api';

interface Props {
  tableId: string;
}

interface CaptureMessage {
  text: string;
  subtext: string;
  offer: string;
}

export default function CRMCaptureCard({ tableId }: Props) {
  const [mounted, setMounted] = useState(false);
  const [show, setShow] = useState(false);
  const [message, setMessage] = useState<CaptureMessage | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Mount check — SSR safe
  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!mounted) return;
    
    // Already claimed this session?
    try {
      const claimed = sessionStorage.getItem('gb_crm_claimed');
      if (claimed) return;
    } catch {}

    const fetchMessage = async () => {
      try {
        const res = await crmCaptureApi.getMessage();
        if (res.message) {
          setMessage(res.message);
          setTimeout(() => setShow(true), 15000);
        }
      } catch {}
    };
    fetchMessage();
  }, [mounted]);

  const handleSubmit = async () => {
    if (!name.trim()) return setError('નામ લખો');
    if (!phone.trim() || phone.length < 10) return setError('સાચો phone number લખો');
    setLoading(true); setError('');
    try {
      const res = await crmCaptureApi.submit({
        name, phone, tableId, offer: message?.offer || ''
      });
      if (res.success) {
        setSuccess(true);
        try {
          sessionStorage.setItem('gb_crm_claimed', 'true');
          localStorage.setItem('gb_customer', JSON.stringify({ name, phone }));
        } catch {}
        setTimeout(() => setShow(false), 3000);
      } else {
        setError(res.error || 'Error. Try again.');
      }
    } catch {
      setError('Server error. Try again.');
    }
    setLoading(false);
  };

  // SSR safe — nothing renders on server
  if (!mounted || !show || !message) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={() => setShow(false)}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.5)',
          zIndex: 1000,
          backdropFilter: 'blur(3px)',
        }}
      />

      {/* Card */}
      <div style={{
        position: 'fixed',
        bottom: 0, left: 0, right: 0,
        zIndex: 1001,
        background: '#FFFBF5',
        borderRadius: '28px 28px 0 0',
        padding: '0 0 40px',
        boxShadow: '0 -12px 48px rgba(15,61,46,0.2)',
        animation: 'crmSlideUp 0.4s cubic-bezier(0.32,0.72,0,1) both',
      }}>
        <style>{`
          @keyframes crmSlideUp {
            from { transform: translateY(100%); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }
        `}</style>

        {/* Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 0' }}>
          <div style={{ width: '36px', height: '4px', borderRadius: '2px', background: '#D4A574', opacity: 0.4 }} />
        </div>

        {success ? (
          <div style={{ padding: '32px 24px', textAlign: 'center' }}>
            <div style={{ fontSize: '56px', marginBottom: '12px' }}>🎉</div>
            <p style={{ fontFamily: 'Playfair Display, serif', fontSize: '22px', fontWeight: '700', color: '#0F3D2E', margin: '0 0 8px' }}>
              Welcome to the Family!
            </p>
            <p style={{ fontSize: '14px', color: '#888', margin: 0, fontFamily: 'DM Sans, sans-serif' }}>
              {message.offer} offer claimed successfully!
            </p>
          </div>
        ) : (
          <div style={{ padding: '20px 24px 0' }}>
            {/* Header */}
            <div style={{
              background: 'linear-gradient(135deg, #0F3D2E, #1A5340)',
              borderRadius: '20px', padding: '20px', marginBottom: '20px',
              position: 'relative', overflow: 'hidden',
            }}>
              <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '100px', height: '100px', borderRadius: '50%', background: 'rgba(212,165,116,0.1)' }} />
              <p style={{ fontSize: '28px', margin: '0 0 8px' }}>☕</p>
              <p style={{ fontFamily: 'Playfair Display, serif', fontSize: '20px', fontWeight: '700', color: '#E8C895', margin: '0 0 4px' }}>
                {message.text}
              </p>
              <p style={{ fontSize: '13px', color: 'rgba(232,200,149,0.7)', margin: '0 0 12px', fontFamily: 'DM Sans, sans-serif' }}>
                {message.subtext}
              </p>
              {message.offer && (
                <div style={{ display: 'inline-block', background: '#D4A574', borderRadius: '50px', padding: '6px 16px' }}>
                  <span style={{ fontSize: '13px', fontWeight: '700', color: '#0F3D2E', fontFamily: 'DM Sans, sans-serif' }}>
                    🎁 {message.offer} your next visit
                  </span>
                </div>
              )}
            </div>

            {/* Name */}
            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '11px', color: '#888', fontWeight: '700', display: 'block', marginBottom: '7px', letterSpacing: '0.8px', textTransform: 'uppercase', fontFamily: 'DM Sans, sans-serif' }}>Your Name</label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder='Nirav Patel'
                style={{ width: '100%', padding: '13px 15px', borderRadius: '14px', border: '1.5px solid #EDE8E0', background: '#FAF6F0', fontSize: '15px', fontFamily: 'DM Sans, sans-serif', outline: 'none', boxSizing: 'border-box', color: '#1a1a1a' }} />
            </div>

            {/* Phone */}
            <div style={{ marginBottom: '6px' }}>
              <label style={{ fontSize: '11px', color: '#888', fontWeight: '700', display: 'block', marginBottom: '7px', letterSpacing: '0.8px', textTransform: 'uppercase', fontFamily: 'DM Sans, sans-serif' }}>Phone Number</label>
              <input value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))} placeholder='98765 43210' inputMode='numeric'
                style={{ width: '100%', padding: '13px 15px', borderRadius: '14px', border: '1.5px solid #EDE8E0', background: '#FAF6F0', fontSize: '15px', fontFamily: 'DM Sans, sans-serif', outline: 'none', boxSizing: 'border-box', color: '#1a1a1a' }} />
            </div>

            {error && (
              <p style={{ fontSize: '12px', color: '#C84B31', margin: '8px 0', fontFamily: 'DM Sans, sans-serif', fontWeight: '600' }}>⚠️ {error}</p>
            )}

            {/* Buttons */}
            <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
              <button onClick={() => setShow(false)}
                style={{ flex: 1, padding: '13px', borderRadius: '14px', border: '1.5px solid #EDE8E0', background: 'transparent', color: '#aaa', fontSize: '14px', fontFamily: 'DM Sans, sans-serif', cursor: 'pointer' }}>
                Maybe Later
              </button>
              <button onClick={handleSubmit} disabled={loading}
                style={{ flex: 2, padding: '13px', borderRadius: '14px', border: 'none', background: 'linear-gradient(135deg, #0F3D2E, #1A5340)', color: '#E8C895', fontSize: '14px', fontWeight: '700', fontFamily: 'DM Sans, sans-serif', cursor: loading ? 'not-allowed' : 'pointer', boxShadow: '0 6px 20px rgba(15,61,46,0.25)' }}>
                {loading ? 'Claiming...' : `🎁 Claim ${message.offer}`}
              </button>
            </div>

            <p style={{ textAlign: 'center', fontSize: '11px', color: '#ccc', margin: '12px 0 0', fontFamily: 'DM Sans, sans-serif' }}>
              No spam. Only special offers for you. 🌿
            </p>
          </div>
        )}
      </div>
    </>
  );
}