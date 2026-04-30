'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import POSSidebar from '@/components/POSSidebar';
import { waiterApi } from '@/lib/api';

interface WaiterRequest {
  _id: string; tableNumber: string; type: string;
  status: string; note: string; assignedWaiterName: string;
  createdAt: string; acceptedAt?: string; completedAt?: string;
}

const REQUEST_LABELS: Record<string, { emoji: string; label: string }> = {
  water:        { emoji: '💧', label: 'Water Bottle'  },
  clean_table:  { emoji: '🧹', label: 'Clean Table'   },
  plate_change: { emoji: '🍽️', label: 'Plate / Spoon' },
  call_waiter:  { emoji: '🙋', label: 'Call Waiter'   },
  feedback:     { emoji: '📝', label: 'Feedback'      },
};

const T = {
  emerald: '#0F3D2E', emeraldMid: '#1A5340', emeraldLight: '#2D7A5F',
  emeraldDeep: '#0A2C20', sage: '#7A9E7E',
  gold: '#D4A574', goldLight: '#E8C895', goldDark: '#B08550',
  cream: '#FAF6F0', creamDark: '#F0E8DA', ivory: '#FFFBF5',
  text: '#2C2418', textMuted: '#7A6B54', textDim: '#A89B80',
  border: '#E5DCC9', success: '#4A8B4A', danger: '#C0392B', warning: '#D4A574',
};

const STATUS_CONFIG = {
  pending:   { label: 'Pending',     color: T.danger,  bg: '#FEF2F2', border: '#FECACA', dot: T.danger  },
  accepted:  { label: 'In Progress', color: T.gold,    bg: '#FFFBF0', border: '#F0E0C0', dot: T.gold    },
  completed: { label: 'Completed',   color: T.success, bg: '#F0FDF4', border: '#BBF7D0', dot: T.success },
  cancelled: { label: 'Cancelled',   color: T.textDim, bg: '#F5F5F5', border: '#E0E0E0', dot: T.textDim },
};

export default function WaiterRequestsPage() {
  const [requests, setRequests] = useState<WaiterRequest[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'accepted' | 'completed'>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const prevPendingRef = useRef(0);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const iv = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(iv);
  }, []);

  const playAlarm = useCallback(() => {
    try {
      const ctx = audioCtxRef.current || new AudioContext();
      audioCtxRef.current = ctx;
      if (ctx.state === 'suspended') ctx.resume();
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(2.0, ctx.currentTime);
      masterGain.connect(ctx.destination);
      [0, 0.25, 0.5].forEach((t) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain); gain.connect(masterGain);
        osc.frequency.value = 1100; osc.type = 'square';
        gain.gain.setValueAtTime(1.0, ctx.currentTime + t);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.2);
        osc.start(ctx.currentTime + t); osc.stop(ctx.currentTime + t + 0.2);
      });
    } catch {}
  }, []);

  const fetchRequests = useCallback(async () => {
    try {
      const res = await waiterApi.getAllRequests();
      if (res.requests) {
        const pendingCount = res.requests.filter((r: WaiterRequest) => r.status === 'pending').length;
        if (pendingCount > prevPendingRef.current) playAlarm();
        prevPendingRef.current = pendingCount;
        setRequests(res.requests);
      }
    } catch {}
    finally { setLoading(false); }
  }, [playAlarm]);

  useEffect(() => {
    const unlock = () => {
      if (!audioCtxRef.current) audioCtxRef.current = new AudioContext();
      if (audioCtxRef.current.state === 'suspended') audioCtxRef.current.resume();
    };
    window.addEventListener('click', unlock, { once: true });
    fetchRequests();
    pollRef.current = setInterval(fetchRequests, 5000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      window.removeEventListener('click', unlock);
    };
  }, [fetchRequests]);

  const filtered = requests.filter(r => {
    const statusMatch = filter === 'all' || r.status === filter;
    const typeMatch = typeFilter === 'all' || r.type === typeFilter;
    return statusMatch && typeMatch;
  });

  const pending   = requests.filter(r => r.status === 'pending').length;
  const accepted  = requests.filter(r => r.status === 'accepted').length;
  const completed = requests.filter(r => r.status === 'completed').length;

  const timeAgo = (date: string) => {
    const diff = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return `${Math.floor(diff / 3600)}h ago`;
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: T.cream, fontFamily: "'Nunito', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=Nunito:wght@400;600;700;800;900&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${T.creamDark}; border-radius: 6px; }
        button, input { font-family: 'Nunito', sans-serif; }
      `}</style>

      <POSSidebar />

      <div style={{ flex: 1, marginLeft: '64px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Header */}
        <header style={{ background: T.ivory, borderBottom: `1px solid ${T.border}`, padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 2px 8px rgba(15,61,46,0.05)' }}>
          <div>
            <h1 style={{ fontWeight: 800, fontSize: '22px', color: T.emerald, margin: 0, fontFamily: "'Playfair Display', serif" }}>Waiter Requests</h1>
            <p style={{ fontSize: '11px', color: T.textMuted, margin: '2px 0 0', fontWeight: 600 }}>
              {currentTime.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })} • {currentTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })} • Auto-refresh every 5s
            </p>
          </div>

          {/* Stats */}
          <div style={{ display: 'flex', gap: '10px' }}>
            {[
              { label: 'Pending',     count: pending,   color: T.danger  },
              { label: 'In Progress', count: accepted,  color: T.gold    },
              { label: 'Completed',   count: completed, color: T.success },
            ].map(({ label, count, color }) => (
              <div key={label} style={{ background: T.cream, borderRadius: '12px', padding: '8px 14px', textAlign: 'center', border: `1px solid ${T.creamDark}`, minWidth: '90px' }}>
                <p style={{ fontWeight: 900, fontSize: '20px', color, margin: 0 }}>{count}</p>
                <p style={{ fontSize: '9px', color: T.textMuted, margin: 0, fontWeight: 800, letterSpacing: '0.5px', textTransform: 'uppercase' }}>{label}</p>
              </div>
            ))}
          </div>
        </header>

        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>

          {/* Filters */}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>

            {/* Status filter */}
            <div style={{ display: 'flex', background: T.ivory, borderRadius: '12px', padding: '4px', border: `1px solid ${T.border}`, gap: '2px' }}>
              {(['all', 'pending', 'accepted', 'completed'] as const).map(s => (
                <button key={s} onClick={() => setFilter(s)} style={{
                  padding: '6px 14px', borderRadius: '9px', border: 'none',
                  background: filter === s ? `linear-gradient(135deg, ${T.emerald}, ${T.emeraldMid})` : 'transparent',
                  color: filter === s ? T.gold : T.textMuted,
                  fontSize: '12px', fontWeight: 800, cursor: 'pointer',
                  transition: 'all 0.2s', textTransform: 'capitalize',
                  boxShadow: filter === s ? '0 2px 8px rgba(15,61,46,0.2)' : 'none',
                }}>
                  {s === 'all' ? 'All' : s === 'accepted' ? 'In Progress' : s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>

            {/* Type filter */}
            <div style={{ display: 'flex', background: T.ivory, borderRadius: '12px', padding: '4px', border: `1px solid ${T.border}`, gap: '2px' }}>
              <button onClick={() => setTypeFilter('all')} style={{
                padding: '6px 14px', borderRadius: '9px', border: 'none',
                background: typeFilter === 'all' ? `linear-gradient(135deg, ${T.emerald}, ${T.emeraldMid})` : 'transparent',
                color: typeFilter === 'all' ? T.gold : T.textMuted,
                fontSize: '12px', fontWeight: 800, cursor: 'pointer',
              }}>All Types</button>
              {Object.entries(REQUEST_LABELS).map(([key, val]) => (
                <button key={key} onClick={() => setTypeFilter(key)} style={{
                  padding: '6px 12px', borderRadius: '9px', border: 'none',
                  background: typeFilter === key ? `linear-gradient(135deg, ${T.emerald}, ${T.emeraldMid})` : 'transparent',
                  color: typeFilter === key ? T.gold : T.textMuted,
                  fontSize: '14px', cursor: 'pointer',
                  boxShadow: typeFilter === key ? '0 2px 8px rgba(15,61,46,0.2)' : 'none',
                }}>{val.emoji}</button>
              ))}
            </div>
          </div>

          {/* Content */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '80px', color: T.textMuted }}>
              <p style={{ fontSize: '14px', fontWeight: 700 }}>Loading requests...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 20px' }}>
              <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: T.creamDark, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: '32px' }}>✅</div>
              <p style={{ fontSize: '18px', fontWeight: 800, color: T.emerald, margin: '0 0 6px', fontFamily: "'Playfair Display', serif" }}>All Clear!</p>
              <p style={{ fontSize: '13px', color: T.textMuted, margin: 0, fontWeight: 600 }}>No requests for selected filter</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '14px' }}>
              {filtered.map(req => {
                const info = REQUEST_LABELS[req.type] || { emoji: '❓', label: req.type };
                const statusCfg = STATUS_CONFIG[req.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.pending;
                return (
                  <div key={req._id} style={{ background: T.ivory, borderRadius: '16px', padding: '16px', border: `1px solid ${statusCfg.border}`, boxShadow: '0 2px 8px rgba(15,61,46,0.06)', transition: 'all 0.2s' }}>

                    {/* Top row */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: T.cream, border: `1px solid ${T.creamDark}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
                          {info.emoji}
                        </div>
                        <div>
                          <p style={{ margin: 0, fontSize: '14px', fontWeight: 900, color: T.text }}>{info.label}</p>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px' }}>
                            <span style={{ background: T.emerald, borderRadius: '6px', padding: '1px 7px', fontSize: '10px', fontWeight: 800, color: T.gold }}>
                              Table {req.tableNumber}
                            </span>
                            <span style={{ fontSize: '10px', color: T.textDim, fontWeight: 600 }}>{timeAgo(req.createdAt)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Status badge */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', background: statusCfg.bg, border: `1px solid ${statusCfg.border}`, borderRadius: '8px', padding: '4px 10px' }}>
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: statusCfg.dot }} />
                        <span style={{ fontSize: '10px', fontWeight: 800, color: statusCfg.color }}>{statusCfg.label}</span>
                      </div>
                    </div>

                    {/* Waiter */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', background: T.cream, borderRadius: '9px', border: `1px solid ${T.creamDark}` }}>
                      <span style={{ fontSize: '10px', color: T.textMuted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Assigned to</span>
                      <span style={{ fontSize: '12px', fontWeight: 900, color: T.emerald }}>{req.assignedWaiterName || 'Unassigned'}</span>
                    </div>

                    {req.note && (
                      <div style={{ marginTop: '8px', padding: '8px 10px', background: '#FEFCE8', borderRadius: '9px', border: `1px solid #FEF08A` }}>
                        <p style={{ margin: 0, fontSize: '11px', color: T.textMuted, fontWeight: 600 }}>💬 {req.note}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}