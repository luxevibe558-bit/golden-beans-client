'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://golden-beans-server.onrender.com/api';

// ─── Types ───────────────────────────────────────────────────────────────────
interface WaiterInfo {
  id: string;
  name: string;
  role: string;
}

interface WaiterRequest {
  _id: string;
  tableId: string;
  tableNumber: string;
  type: string;
  status: string;
  note: string;
  assignedWaiterName: string;
  createdAt: string;
  acceptedAt?: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────
const REQUEST_LABELS: Record<string, { emoji: string; label: string }> = {
  water: { emoji: '💧', label: 'Water Bottle' },
  clean_table: { emoji: '🧹', label: 'Clean Table' },
  plate_change: { emoji: '🍽️', label: 'Plate / Spoon' },
  call_waiter: { emoji: '🙋', label: 'Call Waiter' },
  feedback: { emoji: '📝', label: 'Feedback' },
};

const T = {
  emerald: '#0F3D2E',
  mid: '#1A5340',
  gold: '#D4A574',
  goldLight: '#E8C895',
  cream: '#FAF6F0',
  ivory: '#FFFBF5',
};

// ─── Main Component ───────────────────────────────────────────────────────────
export default function WaiterApp() {
  const [screen, setScreen] = useState<'login' | 'app'>('login');
  const [waiter, setWaiter] = useState<WaiterInfo | null>(null);
  const [sessionToken, setSessionToken] = useState('');
  const [activeTab, setActiveTab] = useState<'live' | 'history'>('live');

  // Login state
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Requests state
  const [liveRequests, setLiveRequests] = useState<WaiterRequest[]>([]);
  const [history, setHistory] = useState<WaiterRequest[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const prevCountRef = useRef(0);
  const audioRef = useRef<AudioContext | null>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  // ─── Check saved session ────────────────────────────────────────────────
  useEffect(() => {
    const saved = localStorage.getItem('gb_waiter_session');
    if (saved) {
      const { token, waiterInfo } = JSON.parse(saved);
      setSessionToken(token);
      setWaiter(waiterInfo);
      setScreen('app');
    }
  }, []);

  // ─── Alarm sound ────────────────────────────────────────────────────────
  const audioCtxRef = useRef<AudioContext | null>(null);

  // User interaction પર AudioContext unlock કરો
  const unlockAudio = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContext();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
  }, []);

  const playAlarm = useCallback(() => {
    try {
      const ctx = audioCtxRef.current || new AudioContext();
      audioCtxRef.current = ctx;
      if (ctx.state === 'suspended') ctx.resume();

      const times = [0, 0.2, 0.4, 0.6];
      times.forEach((t) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = 960;
        osc.type = 'triangle';
        gain.gain.setValueAtTime(0.6, ctx.currentTime + t);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.18);
        osc.start(ctx.currentTime + t);
        osc.stop(ctx.currentTime + t + 0.18);
      });

      // Vibration
      if (navigator.vibrate) {
        navigator.vibrate([400, 100, 400, 100, 400]);
      }
    } catch (e) {
      console.log('Audio error:', e);
    }
  }, []);

  // ─── Fetch live requests ────────────────────────────────────────────────
  const fetchLive = useCallback(async (token: string) => {
    try {
      const res = await fetch(`${API_BASE}/waiter/my-requests`, {
        headers: { 'x-waiter-token': token },
      });
      const data = await res.json();
      if (data.requests) {
        const newCount = data.requests.filter((r: WaiterRequest) => r.status === 'pending').length;
        if (newCount > prevCountRef.current) {
          playAlarm();
          if (navigator.vibrate) navigator.vibrate([300, 100, 300]);
        }
        prevCountRef.current = newCount;
        setLiveRequests(data.requests);
      }
    } catch {}
  }, [playAlarm]);

  // ─── Fetch history ──────────────────────────────────────────────────────
  const fetchHistory = useCallback(async (token: string) => {
    try {
      const res = await fetch(`${API_BASE}/waiter/history`, {
        headers: { 'x-waiter-token': token },
      });
      const data = await res.json();
      if (data.requests) setHistory(data.requests);
    } catch {}
  }, []);

  // ─── Polling ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (screen !== 'app' || !sessionToken) return;
    fetchLive(sessionToken);
    fetchHistory(sessionToken);
    pollRef.current = setInterval(async () => {
      await fetchLive(sessionToken);
      // Pending requests હોય તો દર 5 sec એ sound વાગે
      setLiveRequests(prev => {
        const hasPending = prev.some(r => r.status === 'pending');
        if (hasPending) playAlarm();
        return prev;
      });
    }, 5000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [screen, sessionToken, fetchLive, fetchHistory, playAlarm]);

  // ─── Login ──────────────────────────────────────────────────────────────
  
  const handleLogin = async () => {
    unlockAudio();
    if (!username || !pin) return setLoginError('Username અને PIN જરૂરી છે');
    setLoginLoading(true);
    setLoginError('');
    try {
      const res = await fetch(`${API_BASE}/waiter/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, pin, totpCode: totpCode || undefined }),
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem('gb_waiter_session', JSON.stringify({
          token: data.sessionToken,
          waiterInfo: data.waiter,
        }));
        setSessionToken(data.sessionToken);
        setWaiter(data.waiter);
        setScreen('app');
      } else {
        setLoginError(data.error || 'Login failed');
      }
    } catch {
      setLoginError('Server error. Try again.');
    } finally {
      setLoginLoading(false);
    }
  };

  // ─── Accept / Complete ──────────────────────────────────────────────────
  const handleAction = async (id: string, action: 'accept' | 'complete') => {
    setActionLoading(id + action);
    try {
      await fetch(`${API_BASE}/waiter/requests/${id}/${action}`, {
        method: 'PATCH',
        headers: { 'x-waiter-token': sessionToken },
      });
      await fetchLive(sessionToken);
      await fetchHistory(sessionToken);
    } catch {}
    setActionLoading(null);
  };

  // ─── Logout ─────────────────────────────────────────────────────────────
  const handleLogout = async () => {
    await fetch(`${API_BASE}/waiter/logout`, {
      method: 'POST',
      headers: { 'x-waiter-token': sessionToken },
    });
    localStorage.removeItem('gb_waiter_session');
    setScreen('login');
    setWaiter(null);
    setSessionToken('');
    setLiveRequests([]);
  };

  // ─── Time format ────────────────────────────────────────────────────────
  const timeAgo = (date: string) => {
    const diff = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return `${Math.floor(diff / 3600)}h ago`;
  };

  // ════════════════════════════════════════════════════════════════════════
  // LOGIN SCREEN
  // ════════════════════════════════════════════════════════════════════════
  if (screen === 'login') return (
    <div style={{ minHeight: '100vh', background: T.emerald, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', fontFamily: 'DM Sans, sans-serif' }}>
      {/* Logo */}
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <div style={{ fontSize: '48px', marginBottom: '8px' }}>☕</div>
        <p style={{ fontFamily: 'Playfair Display, serif', fontSize: '22px', color: T.goldLight, margin: 0, fontWeight: '700' }}>Golden Beans</p>
        <p style={{ fontSize: '13px', color: 'rgba(232,200,149,0.6)', margin: '4px 0 0' }}>Waiter Portal</p>
      </div>

      {/* Card */}
      <div style={{ background: T.ivory, borderRadius: '24px', padding: '28px 24px', width: '100%', maxWidth: '360px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
        <p style={{ fontFamily: 'Playfair Display, serif', fontSize: '20px', color: T.emerald, margin: '0 0 24px', fontWeight: '700' }}>Sign In</p>

        {/* Username */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ fontSize: '12px', color: '#888', fontWeight: '600', display: 'block', marginBottom: '6px' }}>USERNAME</label>
          <input
            value={username}
            onChange={e => setUsername(e.target.value)}
            placeholder="Enter username"
            style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: '1.5px solid #E8E0D5', fontSize: '15px', fontFamily: 'DM Sans, sans-serif', background: T.cream, outline: 'none', boxSizing: 'border-box' }}
          />
        </div>

        {/* PIN */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ fontSize: '12px', color: '#888', fontWeight: '600', display: 'block', marginBottom: '6px' }}>4-DIGIT PIN</label>
          <input
            value={pin}
            onChange={e => setPin(e.target.value.slice(0, 4))}
            placeholder="••••"
            type="password"
            inputMode="numeric"
            style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: '1.5px solid #E8E0D5', fontSize: '20px', fontFamily: 'DM Sans, sans-serif', background: T.cream, outline: 'none', boxSizing: 'border-box', letterSpacing: '8px' }}
          />
        </div>

        {/* TOTP (optional) */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ fontSize: '12px', color: '#888', fontWeight: '600', display: 'block', marginBottom: '6px' }}>TOTP CODE <span style={{ color: '#bbb', fontWeight: '400' }}>(optional)</span></label>
          <input
            value={totpCode}
            onChange={e => setTotpCode(e.target.value.slice(0, 6))}
            placeholder="6-digit code"
            inputMode="numeric"
            style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: '1.5px solid #E8E0D5', fontSize: '15px', fontFamily: 'DM Sans, sans-serif', background: T.cream, outline: 'none', boxSizing: 'border-box' }}
          />
        </div>

        {loginError && (
          <div style={{ background: '#FFF0EE', border: '1px solid #FFD0C8', borderRadius: '10px', padding: '10px 14px', marginBottom: '16px', fontSize: '13px', color: '#C84B31' }}>
            {loginError}
          </div>
        )}

        <button
          onClick={handleLogin}
          disabled={loginLoading}
          style={{ width: '100%', padding: '14px', background: `linear-gradient(135deg, ${T.emerald}, ${T.mid})`, color: T.goldLight, border: 'none', borderRadius: '14px', fontSize: '15px', fontWeight: '700', fontFamily: 'DM Sans, sans-serif', cursor: 'pointer' }}
        >
          {loginLoading ? 'Signing in...' : 'Sign In →'}
        </button>
      </div>
    </div>
  );

  // ════════════════════════════════════════════════════════════════════════
  // APP SCREEN
  // ════════════════════════════════════════════════════════════════════════
  const pending = liveRequests.filter(r => r.status === 'pending');
  const accepted = liveRequests.filter(r => r.status === 'accepted');

  return (
    <div style={{ minHeight: '100vh', background: T.cream, fontFamily: 'DM Sans, sans-serif', paddingBottom: '80px' }}>

      {/* Header */}
      <div style={{ background: `linear-gradient(135deg, ${T.emerald}, ${T.mid})`, padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <p style={{ fontFamily: 'Playfair Display, serif', fontSize: '18px', color: T.goldLight, margin: 0, fontWeight: '700' }}>
            {waiter?.name}
          </p>
          <p style={{ fontSize: '12px', color: 'rgba(232,200,149,0.6)', margin: '2px 0 0' }}>
            {waiter?.role === 'senior_waiter' ? 'Senior Waiter' : 'Waiter'} · On Shift
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {pending.length > 0 && (
            <div style={{ background: '#C84B31', borderRadius: '50px', padding: '4px 10px', fontSize: '12px', fontWeight: '700', color: '#fff' }}>
              {pending.length} Pending
            </div>
          )}
          <button onClick={handleLogout} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', padding: '6px 12px', color: T.goldLight, fontSize: '12px', cursor: 'pointer' }}>
            Logout
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', background: '#fff', borderBottom: '1px solid #F0EAE0' }}>
        {(['live', 'history'] as const).map(tab => (
          <button key={tab} onClick={() => { setActiveTab(tab); if (tab === 'history') fetchHistory(sessionToken); }}
            style={{ flex: 1, padding: '14px', background: 'transparent', border: 'none', borderBottom: activeTab === tab ? `2px solid ${T.emerald}` : '2px solid transparent', color: activeTab === tab ? T.emerald : '#999', fontSize: '14px', fontWeight: '600', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
            {tab === 'live' ? `🔴 Live ${liveRequests.length > 0 ? `(${liveRequests.length})` : ''}` : '📋 History'}
          </button>
        ))}
      </div>

      {/* Live Tab */}
      {activeTab === 'live' && (
        <div style={{ padding: '16px' }}>
          {liveRequests.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#bbb' }}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>✅</div>
              <p style={{ fontSize: '16px', fontWeight: '600' }}>All clear!</p>
              <p style={{ fontSize: '13px' }}>No pending requests</p>
            </div>
          ) : (
            <>
              {/* Pending */}
              {pending.length > 0 && (
                <div style={{ marginBottom: '20px' }}>
                  <p style={{ fontSize: '12px', fontWeight: '700', color: '#C84B31', margin: '0 0 10px', letterSpacing: '0.5px' }}>PENDING ({pending.length})</p>
                  {pending.map(req => (
                    <RequestCard key={req._id} req={req} actionLoading={actionLoading} onAction={handleAction} timeAgo={timeAgo} type="pending" />
                  ))}
                </div>
              )}
              {/* Accepted */}
              {accepted.length > 0 && (
                <div>
                  <p style={{ fontSize: '12px', fontWeight: '700', color: '#D4A574', margin: '0 0 10px', letterSpacing: '0.5px' }}>IN PROGRESS ({accepted.length})</p>
                  {accepted.map(req => (
                    <RequestCard key={req._id} req={req} actionLoading={actionLoading} onAction={handleAction} timeAgo={timeAgo} type="accepted" />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div style={{ padding: '16px' }}>
          {history.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#bbb' }}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>📋</div>
              <p style={{ fontSize: '16px', fontWeight: '600' }}>No history yet</p>
            </div>
          ) : (
            history.map(req => (
              <div key={req._id} style={{ background: '#fff', borderRadius: '16px', padding: '14px 16px', marginBottom: '10px', border: '1px solid #F0EAE0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '22px' }}>{REQUEST_LABELS[req.type]?.emoji}</span>
                    <div>
                      <p style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: T.emerald }}>{REQUEST_LABELS[req.type]?.label}</p>
                      <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#999' }}>Table {req.tableNumber} · {timeAgo(req.createdAt)}</p>
                    </div>
                  </div>
                  <span style={{ background: '#E8F5E9', color: '#2E7D32', borderRadius: '8px', padding: '4px 10px', fontSize: '11px', fontWeight: '700' }}>Done ✓</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ─── Request Card Component ───────────────────────────────────────────────────
function RequestCard({ req, actionLoading, onAction, timeAgo, type }: {
  req: WaiterRequest;
  actionLoading: string | null;
  onAction: (id: string, action: 'accept' | 'complete') => void;
  timeAgo: (date: string) => string;
  type: 'pending' | 'accepted';
}) {
  const info = REQUEST_LABELS[req.type] || { emoji: '❓', label: req.type };

  return (
    <div style={{
      background: '#fff',
      borderRadius: '18px',
      padding: '16px',
      marginBottom: '12px',
      border: `1.5px solid ${type === 'pending' ? '#FFD0C8' : '#D4A574'}`,
      boxShadow: type === 'pending' ? '0 4px 16px rgba(200,75,49,0.1)' : '0 4px 16px rgba(212,165,116,0.1)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: type === 'pending' ? '#FFF0EE' : '#FFF8EE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>
            {info.emoji}
          </div>
          <div>
            <p style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#1a1a1a' }}>{info.label}</p>
            <p style={{ margin: '3px 0 0', fontSize: '13px', color: '#888' }}>Table <strong style={{ color: '#0F3D2E' }}>{req.tableNumber}</strong> · {timeAgo(req.createdAt)}</p>
          </div>
        </div>
        <span style={{
          background: type === 'pending' ? '#FFF0EE' : '#FFF8EE',
          color: type === 'pending' ? '#C84B31' : '#D4A574',
          borderRadius: '8px', padding: '4px 10px', fontSize: '11px', fontWeight: '700'
        }}>
          {type === 'pending' ? '🔴 NEW' : '🟡 ACTIVE'}
        </span>
      </div>

      {req.note && (
        <p style={{ margin: '0 0 12px', fontSize: '13px', color: '#666', background: '#FAF6F0', borderRadius: '8px', padding: '8px 10px' }}>
          💬 {req.note}
        </p>
      )}

      <button
        onClick={() => onAction(req._id, type === 'pending' ? 'accept' : 'complete')}
        disabled={!!actionLoading}
        style={{
          width: '100%',
          padding: '12px',
          background: type === 'pending'
            ? 'linear-gradient(135deg, #0F3D2E, #1A5340)'
            : 'linear-gradient(135deg, #D4A574, #C8956A)',
          color: type === 'pending' ? '#E8C895' : '#fff',
          border: 'none',
          borderRadius: '12px',
          fontSize: '14px',
          fontWeight: '700',
          cursor: actionLoading ? 'not-allowed' : 'pointer',
          fontFamily: 'DM Sans, sans-serif',
        }}
      >
        {actionLoading === req._id + (type === 'pending' ? 'accept' : 'complete')
          ? 'Processing...'
          : type === 'pending' ? '✓ Accept Request' : '✅ Mark Complete'}
      </button>
    </div>
  );
}