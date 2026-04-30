'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://golden-beans-server.onrender.com/api';

interface WaiterInfo { id: string; name: string; role: string; }
interface WaiterRequest {
  _id: string; tableId: string; tableNumber: string;
  type: string; status: string; note: string;
  assignedWaiterName: string; createdAt: string; acceptedAt?: string;
}

const REQUEST_LABELS: Record<string, { emoji: string; label: string; color: string }> = {
  water:        { emoji: '💧', label: 'Water Bottle',   color: '#3B82F6' },
  clean_table:  { emoji: '🧹', label: 'Clean Table',    color: '#8B5CF6' },
  plate_change: { emoji: '🍽️', label: 'Plate / Spoon', color: '#F59E0B' },
  call_waiter:  { emoji: '🙋', label: 'Call Waiter',    color: '#EF4444' },
  feedback:     { emoji: '📝', label: 'Feedback',       color: '#10B981' },
};

const T = {
  emerald: '#0F3D2E', mid: '#1A5340', gold: '#D4A574',
  goldLight: '#E8C895', cream: '#FAF6F0', ivory: '#FFFBF5',
};

export default function WaiterApp() {
  const [screen, setScreen] = useState<'login' | 'app'>('login');
  const [waiter, setWaiter] = useState<WaiterInfo | null>(null);
  const [sessionToken, setSessionToken] = useState('');
  const [activeTab, setActiveTab] = useState<'live' | 'history'>('live');
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [liveRequests, setLiveRequests] = useState<WaiterRequest[]>([]);
  const [history, setHistory] = useState<WaiterRequest[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const prevCountRef = useRef(0);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('gb_waiter_session');
    if (saved) {
      const { token, waiterInfo } = JSON.parse(saved);
      setSessionToken(token); setWaiter(waiterInfo); setScreen('app');
    }
  }, []);

  const unlockAudio = useCallback(() => {
    if (!audioCtxRef.current) audioCtxRef.current = new AudioContext();
    if (audioCtxRef.current.state === 'suspended') audioCtxRef.current.resume();
  }, []);

  const playAlarm = useCallback(() => {
    try {
      const ctx = audioCtxRef.current || new AudioContext();
      audioCtxRef.current = ctx;
      if (ctx.state === 'suspended') ctx.resume();

      // GainNode ને MAX volume પર set કરો
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(3.0, ctx.currentTime); // 3x amplify
      masterGain.connect(ctx.destination);

      // 4 beeps
      [0, 0.25, 0.5, 0.75].forEach((t) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(masterGain);
        osc.frequency.value = 1040;
        osc.type = 'square'; // square wave = વધુ loud
        gain.gain.setValueAtTime(1.0, ctx.currentTime + t);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.2);
        osc.start(ctx.currentTime + t);
        osc.stop(ctx.currentTime + t + 0.2);
      });

      if (navigator.vibrate) navigator.vibrate([400, 100, 400, 100, 400]);
    } catch {}
  }, []);

  const fetchLive = useCallback(async (token: string) => {
    try {
      const res = await fetch(`${API_BASE}/waiter/my-requests`, { headers: { 'x-waiter-token': token } });
      const data = await res.json();
      if (data.requests) {
        const newCount = data.requests.filter((r: WaiterRequest) => r.status === 'pending').length;
        if (newCount > prevCountRef.current) playAlarm();
        prevCountRef.current = newCount;
        setLiveRequests(data.requests);
      }
    } catch {}
  }, [playAlarm]);

  const fetchHistory = useCallback(async (token: string) => {
    try {
      const res = await fetch(`${API_BASE}/waiter/history`, { headers: { 'x-waiter-token': token } });
      const data = await res.json();
      if (data.requests) setHistory(data.requests);
    } catch {}
  }, []);

  useEffect(() => {
    if (screen !== 'app' || !sessionToken) return;
    fetchLive(sessionToken); fetchHistory(sessionToken);
    pollRef.current = setInterval(async () => {
      await fetchLive(sessionToken);
      setLiveRequests(prev => {
        const hasPending = prev.some(r => r.status === 'pending');
        if (hasPending) playAlarm();
        return prev;
      });
    }, 5000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [screen, sessionToken, fetchLive, fetchHistory, playAlarm]);

  const handleLogin = async () => {
    unlockAudio();
    if (!username || !pin) return setLoginError('Username અને PIN જરૂરી છે');
    setLoginLoading(true); setLoginError('');
    try {
      const res = await fetch(`${API_BASE}/waiter/login`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, pin, totpCode: totpCode || undefined }),
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem('gb_waiter_session', JSON.stringify({ token: data.sessionToken, waiterInfo: data.waiter }));
        setSessionToken(data.sessionToken); setWaiter(data.waiter); setScreen('app');
      } else { setLoginError(data.error || 'Login failed'); }
    } catch { setLoginError('Server error. Try again.'); }
    finally { setLoginLoading(false); }
  };

  const handleAction = async (id: string, action: 'accept' | 'complete') => {
    setActionLoading(id + action);
    try {
      await fetch(`${API_BASE}/waiter/requests/${id}/${action}`, {
        method: 'PATCH', headers: { 'x-waiter-token': sessionToken },
      });
      await fetchLive(sessionToken); await fetchHistory(sessionToken);
    } catch {}
    setActionLoading(null);
  };

  const handleLogout = async () => {
    await fetch(`${API_BASE}/waiter/logout`, { method: 'POST', headers: { 'x-waiter-token': sessionToken } });
    localStorage.removeItem('gb_waiter_session');
    setScreen('login'); setWaiter(null); setSessionToken(''); setLiveRequests([]);
  };

  const timeAgo = (date: string) => {
    const diff = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return `${Math.floor(diff / 3600)}h ago`;
  };

  // ── LOGIN SCREEN ──────────────────────────────────────────────────────────
  if (screen === 'login') return (
    <div style={{ minHeight: '100vh', background: `linear-gradient(160deg, ${T.emerald} 0%, #071f17 100%)`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', fontFamily: 'DM Sans, sans-serif' }}>
      {/* Decorative circles */}
      <div style={{ position: 'fixed', top: '-80px', right: '-80px', width: '280px', height: '280px', borderRadius: '50%', background: 'rgba(212,165,116,0.08)', pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', bottom: '-60px', left: '-60px', width: '220px', height: '220px', borderRadius: '50%', background: 'rgba(212,165,116,0.06)', pointerEvents: 'none' }} />

      {/* Logo */}
      <div style={{ textAlign: 'center', marginBottom: '36px' }}>
        <div style={{ width: '72px', height: '72px', borderRadius: '24px', background: 'rgba(212,165,116,0.12)', border: '1.5px solid rgba(212,165,116,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: '32px' }}>☕</div>
        <p style={{ fontFamily: 'Playfair Display, serif', fontSize: '24px', color: T.goldLight, margin: 0, fontWeight: '700' }}>Golden Beans</p>
        <p style={{ fontSize: '13px', color: 'rgba(232,200,149,0.5)', margin: '4px 0 0', letterSpacing: '1.5px', textTransform: 'uppercase' }}>Waiter Portal</p>
      </div>

      {/* Card */}
      <div style={{ background: T.ivory, borderRadius: '28px', padding: '32px 24px', width: '100%', maxWidth: '380px', boxShadow: '0 24px 64px rgba(0,0,0,0.4)' }}>
        <p style={{ fontFamily: 'Playfair Display, serif', fontSize: '22px', color: T.emerald, margin: '0 0 6px', fontWeight: '700' }}>Welcome back</p>
        <p style={{ fontSize: '13px', color: '#999', margin: '0 0 28px', fontFamily: 'DM Sans, sans-serif' }}>Sign in to start your shift</p>

        {/* Username */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ fontSize: '11px', color: '#888', fontWeight: '700', display: 'block', marginBottom: '8px', letterSpacing: '0.8px', textTransform: 'uppercase' }}>Username</label>
          <input value={username} onChange={e => setUsername(e.target.value)}
            placeholder="Enter your username"
            style={{ width: '100%', padding: '14px 16px', borderRadius: '14px', border: '1.5px solid #EDE8E0', fontSize: '15px', fontFamily: 'DM Sans, sans-serif', background: T.cream, outline: 'none', boxSizing: 'border-box', color: '#1a1a1a' }} />
        </div>

        {/* PIN */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ fontSize: '11px', color: '#888', fontWeight: '700', display: 'block', marginBottom: '8px', letterSpacing: '0.8px', textTransform: 'uppercase' }}>4-Digit PIN</label>
          <input value={pin} onChange={e => setPin(e.target.value.slice(0, 4))}
            placeholder="••••" type="password" inputMode="numeric"
            style={{ width: '100%', padding: '14px 16px', borderRadius: '14px', border: '1.5px solid #EDE8E0', fontSize: '24px', fontFamily: 'DM Sans, sans-serif', background: T.cream, outline: 'none', boxSizing: 'border-box', letterSpacing: '10px', color: T.emerald }} />
        </div>

        {/* TOTP */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{ fontSize: '11px', color: '#888', fontWeight: '700', display: 'block', marginBottom: '8px', letterSpacing: '0.8px', textTransform: 'uppercase' }}>TOTP Code <span style={{ color: '#ccc', fontWeight: '400', textTransform: 'none' }}>(optional)</span></label>
          <input value={totpCode} onChange={e => setTotpCode(e.target.value.slice(0, 6))}
            placeholder="6-digit code" inputMode="numeric"
            style={{ width: '100%', padding: '14px 16px', borderRadius: '14px', border: '1.5px solid #EDE8E0', fontSize: '15px', fontFamily: 'DM Sans, sans-serif', background: T.cream, outline: 'none', boxSizing: 'border-box' }} />
        </div>

        {loginError && (
          <div style={{ background: '#FFF0EE', border: '1px solid #FFCDC8', borderRadius: '12px', padding: '12px 16px', marginBottom: '20px', fontSize: '13px', color: '#C84B31', display: 'flex', alignItems: 'center', gap: '8px' }}>
            ⚠️ {loginError}
          </div>
        )}

        <button onClick={handleLogin} disabled={loginLoading}
          style={{ width: '100%', padding: '16px', background: `linear-gradient(135deg, ${T.emerald}, ${T.mid})`, color: T.goldLight, border: 'none', borderRadius: '16px', fontSize: '16px', fontWeight: '700', fontFamily: 'DM Sans, sans-serif', cursor: loginLoading ? 'not-allowed' : 'pointer', letterSpacing: '0.3px', boxShadow: `0 8px 24px rgba(15,61,46,0.3)` }}>
          {loginLoading ? 'Signing in...' : 'Start Shift →'}
        </button>
      </div>
    </div>
  );

  // ── APP SCREEN ────────────────────────────────────────────────────────────
  const pending = liveRequests.filter(r => r.status === 'pending');
  const accepted = liveRequests.filter(r => r.status === 'accepted');

  return (
    <div style={{ minHeight: '100vh', background: T.cream, fontFamily: 'DM Sans, sans-serif', paddingBottom: '90px' }}>

      {/* Header */}
      <div style={{ background: `linear-gradient(135deg, ${T.emerald} 0%, #071f17 100%)`, padding: '20px 20px 24px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '160px', height: '160px', borderRadius: '50%', background: 'rgba(212,165,116,0.07)', pointerEvents: 'none' }} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
          <div>
            <p style={{ fontSize: '12px', color: 'rgba(232,200,149,0.5)', margin: '0 0 4px', letterSpacing: '1px', textTransform: 'uppercase' }}>On Shift</p>
            <p style={{ fontFamily: 'Playfair Display, serif', fontSize: '22px', color: T.goldLight, margin: 0, fontWeight: '700' }}>{waiter?.name}</p>
            <p style={{ fontSize: '12px', color: 'rgba(232,200,149,0.6)', margin: '3px 0 0' }}>{waiter?.role === 'senior_waiter' ? '⭐ Senior Waiter' : '🧑‍🍳 Waiter'}</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {pending.length > 0 && (
              <div style={{ background: '#C84B31', borderRadius: '50px', padding: '6px 14px', fontSize: '13px', fontWeight: '700', color: '#fff', boxShadow: '0 4px 12px rgba(200,75,49,0.4)', animation: 'pulse 1.5s infinite' }}>
                🔴 {pending.length} New
              </div>
            )}
            <button onClick={handleLogout} style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '10px', padding: '8px 14px', color: 'rgba(232,200,149,0.7)', fontSize: '12px', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
              End Shift
            </button>
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display: 'flex', gap: '10px', marginTop: '20px', position: 'relative' }}>
          {[
            { label: 'Pending', value: pending.length, color: '#EF4444' },
            { label: 'In Progress', value: accepted.length, color: T.gold },
            { label: "Today's Done", value: history.length, color: '#10B981' },
          ].map(stat => (
            <div key={stat.label} style={{ flex: 1, background: 'rgba(255,255,255,0.07)', borderRadius: '14px', padding: '12px 10px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.08)' }}>
              <p style={{ margin: 0, fontSize: '22px', fontWeight: '800', color: stat.color, fontFamily: 'DM Sans, sans-serif' }}>{stat.value}</p>
              <p style={{ margin: '3px 0 0', fontSize: '10px', color: 'rgba(232,200,149,0.5)', letterSpacing: '0.3px' }}>{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', background: T.ivory, borderBottom: '1px solid #EDE8E0', padding: '0 20px' }}>
        {(['live', 'history'] as const).map(tab => (
          <button key={tab} onClick={() => { setActiveTab(tab); if (tab === 'history') fetchHistory(sessionToken); }}
            style={{ flex: 1, padding: '16px 0', background: 'transparent', border: 'none', borderBottom: activeTab === tab ? `2.5px solid ${T.emerald}` : '2.5px solid transparent', color: activeTab === tab ? T.emerald : '#aaa', fontSize: '14px', fontWeight: '700', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', letterSpacing: '0.3px', transition: 'all 0.2s' }}>
            {tab === 'live' ? `🔴 Live Requests${liveRequests.length > 0 ? ` (${liveRequests.length})` : ''}` : '📋 History'}
          </button>
        ))}
      </div>

      {/* Live Tab */}
      {activeTab === 'live' && (
        <div style={{ padding: '20px 16px' }}>
          {liveRequests.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 20px' }}>
              <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: `rgba(15,61,46,0.08)`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: '36px' }}>✅</div>
              <p style={{ fontSize: '18px', fontWeight: '700', color: T.emerald, margin: '0 0 6px', fontFamily: 'Playfair Display, serif' }}>All Clear!</p>
              <p style={{ fontSize: '14px', color: '#aaa', margin: 0 }}>No pending requests right now</p>
            </div>
          ) : (
            <>
              {pending.length > 0 && (
                <div style={{ marginBottom: '24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#EF4444' }} />
                    <p style={{ fontSize: '11px', fontWeight: '800', color: '#EF4444', margin: 0, letterSpacing: '1px', textTransform: 'uppercase' }}>Pending • {pending.length}</p>
                  </div>
                  {pending.map(req => <RequestCard key={req._id} req={req} actionLoading={actionLoading} onAction={handleAction} timeAgo={timeAgo} type="pending" />)}
                </div>
              )}
              {accepted.length > 0 && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: T.gold }} />
                    <p style={{ fontSize: '11px', fontWeight: '800', color: T.gold, margin: 0, letterSpacing: '1px', textTransform: 'uppercase' }}>In Progress • {accepted.length}</p>
                  </div>
                  {accepted.map(req => <RequestCard key={req._id} req={req} actionLoading={actionLoading} onAction={handleAction} timeAgo={timeAgo} type="accepted" />)}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div style={{ padding: '20px 16px' }}>
          {history.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 20px' }}>
              <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: `rgba(15,61,46,0.08)`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: '36px' }}>📋</div>
              <p style={{ fontSize: '18px', fontWeight: '700', color: T.emerald, margin: '0 0 6px', fontFamily: 'Playfair Display, serif' }}>No History Yet</p>
              <p style={{ fontSize: '14px', color: '#aaa', margin: 0 }}>Completed requests will appear here</p>
            </div>
          ) : (
            history.map(req => {
              const info = REQUEST_LABELS[req.type] || { emoji: '❓', label: req.type, color: '#999' };
              return (
                <div key={req._id} style={{ background: T.ivory, borderRadius: '18px', padding: '16px', marginBottom: '10px', border: '1px solid #EDE8E0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '44px', height: '44px', borderRadius: '14px', background: `${info.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>{info.emoji}</div>
                    <div>
                      <p style={{ margin: 0, fontSize: '14px', fontWeight: '700', color: '#1a1a1a' }}>{info.label}</p>
                      <p style={{ margin: '3px 0 0', fontSize: '12px', color: '#aaa' }}>Table {req.tableNumber} · {timeAgo(req.createdAt)}</p>
                    </div>
                  </div>
                  <div style={{ background: '#E8F5E9', borderRadius: '10px', padding: '5px 12px' }}>
                    <p style={{ margin: 0, fontSize: '11px', fontWeight: '800', color: '#2E7D32' }}>✓ Done</p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

// ── Request Card ──────────────────────────────────────────────────────────────
function RequestCard({ req, actionLoading, onAction, timeAgo, type }: {
  req: WaiterRequest; actionLoading: string | null;
  onAction: (id: string, action: 'accept' | 'complete') => void;
  timeAgo: (date: string) => string; type: 'pending' | 'accepted';
}) {
  const info = REQUEST_LABELS[req.type] || { emoji: '❓', label: req.type, color: '#999' };
  const isPending = type === 'pending';

  return (
    <div style={{ background: T.ivory, borderRadius: '20px', padding: '18px', marginBottom: '12px', border: `1.5px solid ${isPending ? '#FFCDC8' : '#EDE8E0'}`, boxShadow: isPending ? '0 4px 20px rgba(200,75,49,0.08)' : '0 4px 20px rgba(0,0,0,0.04)' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '52px', height: '52px', borderRadius: '16px', background: `${info.color}15`, border: `1.5px solid ${info.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px' }}>
            {info.emoji}
          </div>
          <div>
            <p style={{ margin: 0, fontSize: '17px', fontWeight: '800', color: '#1a1a1a', fontFamily: 'DM Sans, sans-serif' }}>{info.label}</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
              <span style={{ background: `${T.emerald}15`, borderRadius: '6px', padding: '2px 8px', fontSize: '12px', fontWeight: '700', color: T.emerald }}>Table {req.tableNumber}</span>
              <span style={{ fontSize: '12px', color: '#bbb' }}>{timeAgo(req.createdAt)}</span>
            </div>
          </div>
        </div>
        <span style={{ background: isPending ? '#FFF0EE' : '#FFFBF0', border: `1px solid ${isPending ? '#FFCDC8' : '#F0E0C0'}`, borderRadius: '10px', padding: '5px 10px', fontSize: '11px', fontWeight: '800', color: isPending ? '#C84B31' : '#C8956A', whiteSpace: 'nowrap' }}>
          {isPending ? '🔴 NEW' : '🟡 ACTIVE'}
        </span>
      </div>

      {req.note && (
        <div style={{ background: T.cream, borderRadius: '10px', padding: '10px 12px', marginBottom: '14px', border: '1px solid #EDE8E0' }}>
          <p style={{ margin: 0, fontSize: '13px', color: '#666' }}>💬 {req.note}</p>
        </div>
      )}

      <button onClick={() => onAction(req._id, isPending ? 'accept' : 'complete')} disabled={!!actionLoading}
        style={{ width: '100%', padding: '14px', background: isPending ? `linear-gradient(135deg, ${T.emerald}, ${T.mid})` : `linear-gradient(135deg, #D4A574, #C8956A)`, color: isPending ? T.goldLight : '#fff', border: 'none', borderRadius: '14px', fontSize: '15px', fontWeight: '700', cursor: actionLoading ? 'not-allowed' : 'pointer', fontFamily: 'DM Sans, sans-serif', boxShadow: isPending ? `0 6px 20px rgba(15,61,46,0.25)` : `0 6px 20px rgba(212,165,116,0.3)`, letterSpacing: '0.3px' }}>
        {actionLoading === req._id + (isPending ? 'accept' : 'complete') ? '⏳ Processing...' : isPending ? '✓  Accept Request' : '✅  Mark Complete'}
      </button>
    </div>
  );
}