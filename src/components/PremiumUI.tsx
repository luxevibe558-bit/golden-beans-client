"use client";

import { ReactNode, ButtonHTMLAttributes, InputHTMLAttributes, forwardRef } from "react";

/* ════════════════════════════════════════════════════════
   GOLDEN BEANS — PREMIUM UI COMPONENTS LIBRARY
   Reusable, animated, CRED-style components
   ════════════════════════════════════════════════════════ */

// ──────── BUTTON ────────
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "gold" | "secondary" | "danger" | "ghost" | "success";
  size?: "sm" | "md" | "lg" | "xl";
  loading?: boolean;
  icon?: ReactNode;
  iconPosition?: "left" | "right";
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", loading, icon, iconPosition = "left", fullWidth, children, disabled, style, ...props }, ref) => {
    const variants = {
      primary: { bg: "linear-gradient(135deg, #0F3D2E, #1A5340)", color: "#D4A574", shadow: "0 8px 24px rgba(15,61,46,0.35)" },
      gold: { bg: "linear-gradient(135deg, #B08550, #D4A574, #E8C895)", color: "#0F3D2E", shadow: "0 8px 24px rgba(212,165,116,0.4)" },
      secondary: { bg: "#FFFBF5", color: "#0F3D2E", shadow: "0 1px 2px rgba(15,61,46,0.04)", border: "1.5px solid #E5DCC9" },
      danger: { bg: "linear-gradient(135deg, #C0392B, #d63b2a)", color: "white", shadow: "0 8px 24px rgba(192,57,43,0.3)" },
      ghost: { bg: "transparent", color: "#0F3D2E", shadow: "none" },
      success: { bg: "linear-gradient(135deg, #2d6a2d, #4A8B4A)", color: "white", shadow: "0 8px 24px rgba(74,139,74,0.3)" },
    };

    const sizes = {
      sm: { padding: "8px 14px", fontSize: "12px", borderRadius: "8px" },
      md: { padding: "12px 18px", fontSize: "13px", borderRadius: "10px" },
      lg: { padding: "14px 22px", fontSize: "14px", borderRadius: "12px" },
      xl: { padding: "18px 28px", fontSize: "16px", borderRadius: "16px" },
    };

    const v = variants[variant];
    const s = sizes[size];

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        style={{
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          gap: "8px",
          fontFamily: "'Inter', sans-serif", fontWeight: 700,
          letterSpacing: "-0.01em",
          background: disabled || loading ? "#E5DCC9" : v.bg,
          color: disabled || loading ? "#A89B80" : v.color,
          boxShadow: disabled || loading ? "none" : v.shadow,
          border: (v as { border?: string }).border || "none",
          width: fullWidth ? "100%" : "auto",
          cursor: disabled || loading ? "not-allowed" : "pointer",
          transition: "all 150ms cubic-bezier(0.16, 1, 0.3, 1)",
          whiteSpace: "nowrap",
          userSelect: "none",
          position: "relative",
          overflow: "hidden",
          ...s,
          ...style,
        }}
        onMouseEnter={e => { if (!disabled && !loading) e.currentTarget.style.transform = "translateY(-1px)"; }}
        onMouseLeave={e => { e.currentTarget.style.transform = ""; }}
        onMouseDown={e => { if (!disabled && !loading) e.currentTarget.style.transform = "scale(0.97)"; }}
        onMouseUp={e => { if (!disabled && !loading) e.currentTarget.style.transform = "translateY(-1px)"; }}
        {...props}
      >
        {loading ? (
          <span style={{ width: "14px", height: "14px", borderRadius: "50%", border: "2px solid currentColor", borderTopColor: "transparent", animation: "gb-spin 0.6s linear infinite" }} />
        ) : (
          <>
            {icon && iconPosition === "left" && <span>{icon}</span>}
            {children}
            {icon && iconPosition === "right" && <span>{icon}</span>}
          </>
        )}
      </button>
    );
  }
);
Button.displayName = "Button";

// ──────── CARD ────────
interface CardProps {
  children: ReactNode;
  hover?: boolean;
  active?: boolean;
  glass?: boolean;
  variant?: "default" | "emerald" | "gold";
  onClick?: () => void;
  style?: React.CSSProperties;
  className?: string;
  padding?: "none" | "sm" | "md" | "lg";
}

export function Card({ children, hover, active, glass, variant = "default", onClick, style, className, padding = "md" }: CardProps) {
  const paddings = { none: 0, sm: "12px", md: "16px", lg: "20px" };
  const variants = {
    default: { background: "#FFFBF5", border: "1px solid #F0E8DA", color: "#1A1208" },
    emerald: { background: "linear-gradient(145deg, #0F3D2E, #1A5340)", border: "1px solid rgba(212,165,116,0.18)", color: "#D4A574" },
    gold: { background: "linear-gradient(135deg, #FAF3E8, #F2DFC0)", border: "1px solid #E8C895", color: "#0F3D2E" },
  };

  const v = variants[variant];

  return (
    <div
      onClick={onClick}
      className={className}
      style={{
        ...v,
        borderRadius: "16px",
        padding: paddings[padding],
        boxShadow: glass ? "0 16px 40px rgba(15,61,46,0.15)" : "0 4px 8px rgba(15,61,46,0.06), 0 2px 4px rgba(15,61,46,0.05)",
        backdropFilter: glass ? "blur(16px) saturate(160%)" : undefined,
        WebkitBackdropFilter: glass ? "blur(16px) saturate(160%)" : undefined,
        cursor: onClick ? "pointer" : "default",
        transition: "all 250ms cubic-bezier(0.16, 1, 0.3, 1)",
        ...style,
      }}
      onMouseEnter={e => {
        if (hover) {
          e.currentTarget.style.transform = "translateY(-2px)";
          e.currentTarget.style.boxShadow = "0 12px 24px rgba(15,61,46,0.08), 0 4px 8px rgba(15,61,46,0.04)";
        }
      }}
      onMouseLeave={e => {
        if (hover) {
          e.currentTarget.style.transform = "";
          e.currentTarget.style.boxShadow = "0 4px 8px rgba(15,61,46,0.06), 0 2px 4px rgba(15,61,46,0.05)";
        }
      }}
      onMouseDown={e => { if (active || onClick) e.currentTarget.style.transform = "scale(0.99)"; }}
      onMouseUp={e => { if (active || onClick) e.currentTarget.style.transform = ""; }}
    >
      {children}
    </div>
  );
}

// ──────── INPUT ────────
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: ReactNode;
  error?: string;
  fullWidth?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, icon, error, fullWidth = true, style, ...props }, ref) => {
    return (
      <div style={{ width: fullWidth ? "100%" : "auto" }}>
        {label && (
          <label style={{
            display: "block", fontSize: "10px", fontWeight: 800,
            color: "#7A6B54", marginBottom: "6px", letterSpacing: "0.5px",
            textTransform: "uppercase",
          }}>{label}</label>
        )}
        <div style={{ position: "relative" }}>
          {icon && (
            <div style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#A89B80", pointerEvents: "none", display: "flex" }}>
              {icon}
            </div>
          )}
          <input
            ref={ref}
            style={{
              width: "100%",
              padding: icon ? "11px 14px 11px 38px" : "11px 14px",
              borderRadius: "10px",
              border: `1.5px solid ${error ? "#C0392B" : "#E5DCC9"}`,
              background: "#FFFBF5",
              color: "#1A1208",
              fontFamily: "'Inter', sans-serif",
              fontSize: "14px",
              fontWeight: 500,
              outline: "none",
              transition: "all 150ms cubic-bezier(0.16, 1, 0.3, 1)",
              boxShadow: "inset 0 1px 2px rgba(15,61,46,0.06)",
              boxSizing: "border-box",
              ...style,
            }}
            onFocus={e => {
              if (!error) {
                e.currentTarget.style.borderColor = "#D4A574";
                e.currentTarget.style.background = "white";
                e.currentTarget.style.boxShadow = "0 0 0 4px rgba(212,165,116,0.1), inset 0 1px 2px rgba(15,61,46,0.06)";
              }
              props.onFocus?.(e);
            }}
            onBlur={e => {
              e.currentTarget.style.borderColor = error ? "#C0392B" : "#E5DCC9";
              e.currentTarget.style.background = "#FFFBF5";
              e.currentTarget.style.boxShadow = "inset 0 1px 2px rgba(15,61,46,0.06)";
              props.onBlur?.(e);
            }}
            {...props}
          />
        </div>
        {error && (
          <p style={{ fontSize: "11px", color: "#C0392B", margin: "4px 0 0", fontWeight: 600 }}>{error}</p>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";

// ──────── PILL / BADGE ────────
interface PillProps {
  children: ReactNode;
  variant?: "default" | "emerald" | "gold" | "success" | "danger" | "info" | "warning";
  size?: "sm" | "md";
  icon?: ReactNode;
  pulse?: boolean;
  style?: React.CSSProperties;
}

export function Pill({ children, variant = "default", size = "sm", icon, pulse, style }: PillProps) {
  const variants = {
    default: { bg: "#FAF6F0", color: "#7A6B54", border: "#F0E8DA" },
    emerald: { bg: "#E8F4ED", color: "#0F3D2E", border: "#C5E0CD" },
    gold: { bg: "#FAF3E8", color: "#8B6740", border: "#F2DFC0" },
    success: { bg: "#E8F4ED", color: "#4A8B4A", border: "rgba(74,139,74,0.2)" },
    danger: { bg: "#FCE8E6", color: "#C0392B", border: "rgba(192,57,43,0.2)" },
    info: { bg: "#E8F1F7", color: "#4A7B9B", border: "rgba(74,123,155,0.2)" },
    warning: { bg: "#FAF3E8", color: "#B08550", border: "#E8C895" },
  };

  const sizes = {
    sm: { padding: "3px 9px", fontSize: "11px", gap: "4px" },
    md: { padding: "5px 12px", fontSize: "12px", gap: "5px" },
  };

  const v = variants[variant];
  const s = sizes[size];

  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: s.gap,
      padding: s.padding, fontSize: s.fontSize,
      fontWeight: 700, letterSpacing: "0.02em",
      background: v.bg, color: v.color,
      border: `1px solid ${v.border}`,
      borderRadius: "9999px",
      animation: pulse ? "gb-pulse 2s ease-in-out infinite" : undefined,
      ...style,
    }}>
      {icon && <span style={{ display: "inline-flex" }}>{icon}</span>}
      {children}
    </span>
  );
}

// ──────── STAT CARD ────────
interface StatCardProps {
  label: string;
  value: string | number;
  icon?: ReactNode;
  variant?: "default" | "success" | "danger" | "gold" | "info";
  subtitle?: string;
  trend?: { direction: "up" | "down"; value: string };
}

export function StatCard({ label, value, icon, variant = "default", subtitle, trend }: StatCardProps) {
  const variants = {
    default: { bg: "linear-gradient(135deg, #FFFBF5, #FAF6F0)", color: "#0F3D2E", border: "#F0E8DA", iconBg: "#FAF6F0" },
    success: { bg: "linear-gradient(135deg, #FFFBF5, #E8F4ED)", color: "#4A8B4A", border: "#C5E0CD", iconBg: "#E8F4ED" },
    danger: { bg: "linear-gradient(135deg, #FFFBF5, #FCE8E6)", color: "#C0392B", border: "rgba(192,57,43,0.15)", iconBg: "#FCE8E6" },
    gold: { bg: "linear-gradient(135deg, #FFFBF5, #FAF3E8)", color: "#8B6740", border: "#F2DFC0", iconBg: "#FAF3E8" },
    info: { bg: "linear-gradient(135deg, #FFFBF5, #E8F1F7)", color: "#4A7B9B", border: "rgba(74,123,155,0.15)", iconBg: "#E8F1F7" },
  };

  const v = variants[variant];

  return (
    <div style={{
      background: v.bg,
      border: `1px solid ${v.border}`,
      borderRadius: "16px",
      padding: "14px 16px",
      boxShadow: "0 2px 4px rgba(15,61,46,0.06), 0 1px 2px rgba(15,61,46,0.04)",
      transition: "all 250ms cubic-bezier(0.16, 1, 0.3, 1)",
      cursor: "default",
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "10px" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: "10px", fontWeight: 800, color: "#7A6B54", margin: "0 0 6px", letterSpacing: "0.08em", textTransform: "uppercase" }}>
            {label}
          </p>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontVariantNumeric: "tabular-nums", fontSize: "26px", fontWeight: 800, color: v.color, margin: 0, letterSpacing: "-0.02em", lineHeight: 1 }}>
            {value}
          </p>
          {subtitle && (
            <p style={{ fontSize: "11px", color: "#A89B80", margin: "6px 0 0", fontWeight: 600 }}>{subtitle}</p>
          )}
          {trend && (
            <div style={{ display: "flex", alignItems: "center", gap: "3px", marginTop: "6px" }}>
              <span style={{ fontSize: "10px", color: trend.direction === "up" ? "#4A8B4A" : "#C0392B", fontWeight: 800 }}>
                {trend.direction === "up" ? "↑" : "↓"} {trend.value}
              </span>
            </div>
          )}
        </div>
        {icon && (
          <div style={{
            width: "38px", height: "38px",
            background: v.iconBg, borderRadius: "10px",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: v.color, flexShrink: 0,
            fontSize: "18px",
          }}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}

// ──────── EMPTY STATE ────────
interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div style={{ textAlign: "center", padding: "56px 24px", animation: "gb-fadeInUp 400ms cubic-bezier(0.16, 1, 0.3, 1)" }}>
      {icon && (
        <div style={{
          width: "72px", height: "72px",
          background: "linear-gradient(135deg, #FAF6F0, #F0E8DA)",
          borderRadius: "20px",
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          marginBottom: "16px", fontSize: "36px",
          boxShadow: "0 8px 16px rgba(15,61,46,0.06)",
        }}>
          {icon}
        </div>
      )}
      <h3 style={{
        fontFamily: "'Playfair Display', serif",
        fontSize: "22px", fontWeight: 700, color: "#1A1208",
        margin: "0 0 6px", letterSpacing: "-0.02em",
      }}>{title}</h3>
      {description && (
        <p style={{ fontSize: "13px", color: "#7A6B54", margin: "0 0 16px", maxWidth: "320px", marginLeft: "auto", marginRight: "auto", lineHeight: 1.6 }}>
          {description}
        </p>
      )}
      {action && <div>{action}</div>}
    </div>
  );
}

// ──────── SKELETON ────────
export function Skeleton({ width = "100%", height = "16px", style }: { width?: string | number; height?: string | number; style?: React.CSSProperties }) {
  return (
    <div style={{
      width, height,
      background: "linear-gradient(90deg, #F0E8DA 0%, #FAF6F0 50%, #F0E8DA 100%)",
      backgroundSize: "200% 100%",
      animation: "gb-skeleton 1.4s ease-in-out infinite",
      borderRadius: "8px",
      ...style,
    }} />
  );
}

// ──────── DIVIDER ────────
export function Divider({ dashed = false, style }: { dashed?: boolean; style?: React.CSSProperties }) {
  return (
    <hr style={{
      height: 0, border: "none",
      borderTop: `1px ${dashed ? "dashed" : "solid"} #F0E8DA`,
      margin: "16px 0",
      ...style,
    }} />
  );
}

// ──────── MODAL ────────
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  maxWidth?: number;
}

export function Modal({ isOpen, onClose, children, title, maxWidth = 440 }: ModalProps) {
  if (!isOpen) return null;
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(15,61,46,0.7)",
        zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center",
        padding: "20px", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
        animation: "gb-fadeIn 200ms ease-out",
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: "#FFFBF5",
          borderRadius: "20px",
          padding: 0,
          maxWidth: `${maxWidth}px`, width: "100%",
          maxHeight: "90vh",
          overflow: "hidden", display: "flex", flexDirection: "column",
          boxShadow: "0 32px 64px rgba(15,61,46,0.16), 0 16px 32px rgba(15,61,46,0.08)",
          animation: "gb-scaleIn 300ms cubic-bezier(0.34, 1.56, 0.64, 1)",
        }}
      >
        <div style={{ height: "3px", background: "linear-gradient(90deg, #B08550, #D4A574, #E8C895, #D4A574, #B08550)" }} />
        {title && (
          <div style={{ padding: "20px 22px 0" }}>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "22px", fontWeight: 700, color: "#1A1208", margin: 0, letterSpacing: "-0.02em" }}>
              {title}
            </h2>
          </div>
        )}
        <div style={{ padding: "16px 22px 22px", overflowY: "auto" }}>
          {children}
        </div>
      </div>
    </div>
  );
}

// ──────── ICON COMPONENTS (Custom SVGs replacing emojis) ────────
export const Icons = {
  Coffee: ({ size = 16, color = "currentColor" }: { size?: number; color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 8h1a4 4 0 1 1 0 8h-1" />
      <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" />
      <line x1="6" y1="2" x2="6" y2="4" />
      <line x1="10" y1="2" x2="10" y2="4" />
      <line x1="14" y1="2" x2="14" y2="4" />
    </svg>
  ),
  Search: ({ size = 16, color = "currentColor" }: { size?: number; color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  Cart: ({ size = 16, color = "currentColor" }: { size?: number; color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="21" r="1" />
      <circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </svg>
  ),
  Plus: ({ size = 16, color = "currentColor" }: { size?: number; color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
  Minus: ({ size = 16, color = "currentColor" }: { size?: number; color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
  Check: ({ size = 16, color = "currentColor" }: { size?: number; color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  Close: ({ size = 16, color = "currentColor" }: { size?: number; color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  Bell: ({ size = 16, color = "currentColor" }: { size?: number; color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  ),
  Clock: ({ size = 16, color = "currentColor" }: { size?: number; color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  Home: ({ size = 16, color = "currentColor" }: { size?: number; color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9 12 2l9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  ),
  Menu: ({ size = 16, color = "currentColor" }: { size?: number; color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  ),
  Receipt: ({ size = 16, color = "currentColor" }: { size?: number; color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z" />
      <line x1="8" y1="7" x2="16" y2="7" />
      <line x1="8" y1="11" x2="16" y2="11" />
      <line x1="8" y1="15" x2="13" y2="15" />
    </svg>
  ),
  Box: ({ size = 16, color = "currentColor" }: { size?: number; color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  ),
  Chart: ({ size = 16, color = "currentColor" }: { size?: number; color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  ),
  Chef: ({ size = 16, color = "currentColor" }: { size?: number; color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 13.87A4 4 0 0 1 7.41 6a5.11 5.11 0 0 1 1.05-1.54 5 5 0 0 1 7.08 0A5.11 5.11 0 0 1 16.59 6 4 4 0 0 1 18 13.87V21H6Z" />
      <line x1="6" y1="17" x2="18" y2="17" />
    </svg>
  ),
  Users: ({ size = 16, color = "currentColor" }: { size?: number; color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  Camera: ({ size = 16, color = "currentColor" }: { size?: number; color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  ),
  Edit: ({ size = 16, color = "currentColor" }: { size?: number; color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  ),
  Trash: ({ size = 16, color = "currentColor" }: { size?: number; color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  ),
  Phone: ({ size = 16, color = "currentColor" }: { size?: number; color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  ),
  Location: ({ size = 16, color = "currentColor" }: { size?: number; color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  ),
  Wifi: ({ size = 16, color = "currentColor" }: { size?: number; color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12.55a11 11 0 0 1 14.08 0" />
      <path d="M1.42 9a16 16 0 0 1 21.16 0" />
      <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
      <line x1="12" y1="20" x2="12.01" y2="20" />
    </svg>
  ),
  ArrowLeft: ({ size = 16, color = "currentColor" }: { size?: number; color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  ),
  ArrowRight: ({ size = 16, color = "currentColor" }: { size?: number; color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  ),
  Send: ({ size = 16, color = "currentColor" }: { size?: number; color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  ),
  Money: ({ size = 16, color = "currentColor" }: { size?: number; color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  ),
  Sparkle: ({ size = 16, color = "currentColor" }: { size?: number; color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} stroke="none">
      <path d="M12 2L13.5 8.5 20 10 13.5 11.5 12 18 10.5 11.5 4 10 10.5 8.5z" />
    </svg>
  ),
  Leaf: ({ size = 16, color = "currentColor" }: { size?: number; color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19.2 2.96a1 1 0 0 1 1.8.5c0 1.04-.04 2-.07 2.97" />
      <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
    </svg>
  ),
  ChairFill: ({ size = 16, color = "currentColor" }: { size?: number; color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} stroke="none">
      <path d="M19 9V5a3 3 0 0 0-3-3H8a3 3 0 0 0-3 3v4a2 2 0 0 0-2 2v3a2 2 0 0 0 2 2v6h2v-2h12v2h2v-6a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2zm-2 6H7v-2h10v2z" />
    </svg>
  ),
};
