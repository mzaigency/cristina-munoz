import React from "react";
import { COLORS } from "../theme";

export const GlassPill: React.FC<{
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ children, style }) => (
  <div
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 14,
      padding: "16px 28px",
      borderRadius: 999,
      background: "rgba(255,255,255,0.7)",
      border: `1.5px solid ${COLORS.glassBorder}`,
      boxShadow:
        "0 20px 50px -20px rgba(34,64,139,0.35), inset 0 1px 0 rgba(255,255,255,0.9)",
      fontFamily: "Plus Jakarta Sans, sans-serif",
      fontWeight: 600,
      fontSize: 30,
      color: COLORS.navy,
      ...style,
    }}
  >
    {children}
  </div>
);

export const Dot: React.FC<{ color?: string }> = ({ color = COLORS.purple }) => (
  <span
    style={{
      width: 12,
      height: 12,
      borderRadius: "50%",
      background: color,
      display: "inline-block",
      boxShadow: `0 0 16px ${color}`,
    }}
  />
);
