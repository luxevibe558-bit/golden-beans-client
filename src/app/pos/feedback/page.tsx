'use client';

import { useState, useEffect, useCallback } from 'react';
import POSSidebar from '@/components/POSSidebar';
import { feedbackApi } from '@/lib/api';

interface Feedback {
  _id: string;
  tableNumber: string;
  rating: number;
  categories: { food: number; service: number; ambiance: number; value: number };
  comment: string;
  customerName: string;
  totalAmount: number;
  createdAt: string;
}

interface Analytics {
  total: number;
  avgRating: number;
  distribution: Record<number, number>;
  recentAvg: number;
  recent: number;
}

const T = {
  emerald: '#0F3D2E', emeraldMid: '#1A5340',
  gold: '#D4A574', goldLight: '#E8C895', goldDark: '#B08550',
  cream: '#FAF6F0', creamDark: '#F0E8DA', ivory: '#FFFBF5',
  text: '#2C2418', textMuted: '#7A6B54', textDim: '#A89B80',
  border: '#E5DCC9', success: '#4A8B4A', danger: '#C0392B',
};

function StarDisplay({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <span>
      {[1, 2, 3, 4, 5].map(s => (
        <span key={s} style={{ fontSize: `${size}px`, filter: rating >= s ? 'none' : 'grayscale(1) opacity(0.3)' }}>⭐</span>
      ))}
    </span>
  );
}

export default function FeedbackPage() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeTab, setActiveTab] = useState<'overview' | 'list'>('overview');

  useEffect(() => {
    const iv = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(iv);
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const [allRes, analyticsRes] = await Promise.all([
        feedbackApi.getAll(),
        feedbackApi.getAnalytics(),
      ]);
      if (allRes.feedbacks) setFeedbacks(allRes.feedbacks);
      if (analyticsRes) setAnalytics(analyticsRes);
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const timeAgo = (date: string) => {
    const diff = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  const ratingColor = (r: number) => {
    if (r >= 4.5) return T.success;
    if (r >= 3.5) return T.gold;
    return T.danger;
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: T.cream, fontFamily: "'Nunito', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=Nunito:wght@400;600;700;800;900&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${T.creamDark}; border-radius: 6px; }
      `}</style>

      <POSSidebar />

      <div style={{ flex: 1, marginLeft: '64px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Header */}
        <header style={{ background: T.ivory, borderBottom: `1px solid ${T.border}`, padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 2px 8px rgba(15,61,46,0.05)' }}>
          <div>
            <h1 style={{ fontWeight: 800, fontSize: '22px', color: T.emerald, margin: 0, fontFamily: "'Playfair Display', serif" }}>Customer Feedback</h1>
            <p style={{ fontSize: '11px', color: T.textMuted, margin: '2px 0 0', fontWeight: 600 }}>
              {currentTime.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })} • {currentTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
            </p>
          </div>

          {/* Top Stats */}
          <div style={{ display: 'flex', gap: '10px' }}>
            {[
              { label: 'Total Reviews', count: analytics?.total || 0, color: T.emerald },
              { label: 'Avg Rating', count: analytics?.avgRating ? analytics.avgRating.toFixed(1) : '—', color: ratingColor(analytics?.avgRating || 0) },
              { label: 'This Week', count: analytics?.recent || 0, color: T.gold },
            ].map(({ label, count, color }) => (
              <div key={label} style={{ background: T.cream, borderRadius: '12px', padding: '8px 14px', textAlign: 'center', border: `1px solid ${T.creamDark}`, minWidth: '90px' }}>
                <p style={{ fontWeight: 900, fontSize: '20px', color, margin: 0 }}>{count}</p>
                <p style={{ fontSize: '9px', color: T.textMuted, margin: 0, fontWeight: 800, letterSpacing: '0.5px', textTransform: 'uppercase' }}>{label}</p>
              </div>
            ))}
          </div>
        </header>

        {/* Tabs */}
        <div style={{ display: 'flex', background: T.ivory, borderBottom: `1px solid ${T.border}`, padding: '0 20px' }}>
          {(['overview', 'list'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              style={{ padding: '14px 20px', background: 'transparent', border: 'none', borderBottom: activeTab === tab ? `2.5px solid ${T.emerald}` : '2.5px solid transparent', color: activeTab === tab ? T.emerald : T.textMuted, fontSize: '13px', fontWeight: 700, cursor: 'pointer', fontFamily: "'Nunito', sans-serif", textTransform: 'capitalize' }}>
              {tab === 'overview' ? '📊 Overview' : '📋 All Reviews'}
            </button>
          ))}
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
          {loading ? (
            <p style={{ textAlign: 'center', color: T.textMuted, padding: '60px', fontWeight: 700 }}>Loading...</p>
          ) : analytics?.total === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px' }}>
              <p style={{ fontSize: '48px', margin: '0 0 12px' }}>⭐</p>
              <p style={{ fontSize: '18px', fontWeight: 800, color: T.emerald, fontFamily: "'Playfair Display', serif" }}>No Feedback Yet</p>
              <p style={{ fontSize: '13px', color: T.textMuted, fontWeight: 600 }}>Customer feedback will appear here after bill settlement</p>
            </div>
          ) : (
            <>
              {/* Overview Tab */}
              {activeTab === 'overview' && analytics && (
                <div style={{ maxWidth: '800px' }}>

                  {/* Big Rating */}
                  <div style={{ background: `linear-gradient(135deg, ${T.emerald}, ${T.emeraldMid})`, borderRadius: '20px', padding: '28px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '28px', boxShadow: `0 8px 24px rgba(15,61,46,0.2)` }}>
                    <div style={{ textAlign: 'center' }}>
                      <p style={{ fontWeight: 900, fontSize: '56px', color: T.goldLight, margin: 0, lineHeight: 1, fontFamily: "'Nunito', sans-serif" }}>
                        {analytics.avgRating.toFixed(1)}
                      </p>
                      <StarDisplay rating={Math.round(analytics.avgRating)} size={18} />
                      <p style={{ fontSize: '12px', color: 'rgba(232,200,149,0.6)', margin: '6px 0 0', fontWeight: 600 }}>
                        Based on {analytics.total} reviews
                      </p>
                    </div>
                    <div style={{ flex: 1 }}>
                      {[5, 4, 3, 2, 1].map(star => {
                        const count = analytics.distribution[star] || 0;
                        const pct = analytics.total > 0 ? (count / analytics.total) * 100 : 0;
                        return (
                          <div key={star} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                            <span style={{ fontSize: '12px', color: T.goldLight, fontWeight: 700, minWidth: '16px' }}>{star}⭐</span>
                            <div style={{ flex: 1, height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                              <div style={{ width: `${pct}%`, height: '100%', background: T.gold, borderRadius: '4px', transition: 'width 0.8s ease' }} />
                            </div>
                            <span style={{ fontSize: '11px', color: 'rgba(232,200,149,0.6)', fontWeight: 700, minWidth: '24px' }}>{count}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Category Averages */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
                    {[
                      { key: 'food', emoji: '🍽️', label: 'Food' },
                      { key: 'service', emoji: '🙋', label: 'Service' },
                      { key: 'ambiance', emoji: '✨', label: 'Ambiance' },
                      { key: 'value', emoji: '💰', label: 'Value' },
                    ].map(cat => {
                      const avg = feedbacks.filter(f => f.categories[cat.key as keyof typeof f.categories] > 0).length > 0
                        ? feedbacks.reduce((s, f) => s + (f.categories[cat.key as keyof typeof f.categories] || 0), 0) / feedbacks.filter(f => f.categories[cat.key as keyof typeof f.categories] > 0).length
                        : 0;
                      return (
                        <div key={cat.key} style={{ background: T.ivory, borderRadius: '16px', padding: '16px', border: `1px solid ${T.border}`, textAlign: 'center' }}>
                          <p style={{ fontSize: '24px', margin: '0 0 6px' }}>{cat.emoji}</p>
                          <p style={{ fontSize: '22px', fontWeight: 900, color: ratingColor(avg), margin: '0 0 4px' }}>{avg > 0 ? avg.toFixed(1) : '—'}</p>
                          <p style={{ fontSize: '11px', color: T.textMuted, margin: 0, fontWeight: 700 }}>{cat.label}</p>
                        </div>
                      );
                    })}
                  </div>

                  {/* Recent Comments */}
                  <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '18px', fontWeight: 800, color: T.emerald, margin: '0 0 14px' }}>Recent Comments</h3>
                  {feedbacks.filter(f => f.comment).slice(0, 5).map(f => (
                    <div key={f._id} style={{ background: T.ivory, borderRadius: '14px', padding: '14px 16px', marginBottom: '10px', border: `1px solid ${T.border}` }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <StarDisplay rating={f.rating} size={13} />
                          <span style={{ fontSize: '11px', color: T.textMuted, fontWeight: 600 }}>Table {f.tableNumber}</span>
                        </div>
                        <span style={{ fontSize: '11px', color: T.textDim, fontWeight: 600 }}>{timeAgo(f.createdAt)}</span>
                      </div>
                      <p style={{ margin: 0, fontSize: '13px', color: T.text, fontWeight: 600, lineHeight: 1.5 }}>"{f.comment}"</p>
                    </div>
                  ))}
                </div>
              )}

              {/* List Tab */}
              {activeTab === 'list' && (
                <div style={{ maxWidth: '800px' }}>
                  {feedbacks.map(f => (
                    <div key={f._id} style={{ background: T.ivory, borderRadius: '16px', padding: '16px', marginBottom: '12px', border: `1px solid ${T.border}`, boxShadow: '0 2px 8px rgba(15,61,46,0.04)' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '10px' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                            <StarDisplay rating={f.rating} size={15} />
                            <span style={{ background: T.emerald, borderRadius: '6px', padding: '2px 8px', fontSize: '10px', fontWeight: 800, color: T.gold }}>
                              Table {f.tableNumber}
                            </span>
                          </div>
                          <p style={{ margin: 0, fontSize: '11px', color: T.textDim, fontWeight: 600 }}>{timeAgo(f.createdAt)}</p>
                        </div>
                        <span style={{ fontSize: '18px', fontWeight: 900, color: ratingColor(f.rating) }}>{f.rating}.0</span>
                      </div>

                      {/* Category mini badges */}
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: f.comment ? '10px' : 0 }}>
                        {[
                          { key: 'food', emoji: '🍽️' },
                          { key: 'service', emoji: '🙋' },
                          { key: 'ambiance', emoji: '✨' },
                          { key: 'value', emoji: '💰' },
                        ].filter(c => f.categories[c.key as keyof typeof f.categories] > 0).map(c => (
                          <span key={c.key} style={{ background: T.cream, border: `1px solid ${T.creamDark}`, borderRadius: '6px', padding: '2px 8px', fontSize: '11px', fontWeight: 700, color: T.textMuted }}>
                            {c.emoji} {f.categories[c.key as keyof typeof f.categories]}⭐
                          </span>
                        ))}
                      </div>

                      {f.comment && (
                        <div style={{ background: T.cream, borderRadius: '10px', padding: '10px 12px', border: `1px solid ${T.creamDark}` }}>
                          <p style={{ margin: 0, fontSize: '13px', color: T.text, fontWeight: 600, lineHeight: 1.5 }}>💬 "{f.comment}"</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}