import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { COLORS } from "../theme";

export const PersistentBackground: React.FC = () => {
  const frame = useCurrentFrame();
  const drift = Math.sin(frame / 60) * 40;
  const drift2 = Math.cos(frame / 80) * 60;
  const hueShift = interpolate(frame, [0, 600], [0, 20]);

  return (
    <AbsoluteFill style={{ background: COLORS.cream, overflow: "hidden" }}>
      {/* Soft cream base */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse at 50% 0%, #ffffff 0%, #fff8f2 40%, #f4ecf7 100%)",
        }}
      />
      {/* Navy blob top-left */}
      <div
        style={{
          position: "absolute",
          top: -200 + drift,
          left: -200 + drift2,
          width: 900,
          height: 900,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${COLORS.navy}55 0%, ${COLORS.navy}00 70%)`,
          filter: "blur(60px)",
          transform: `rotate(${hueShift}deg)`,
        }}
      />
      {/* Purple blob bottom-right */}
      <div
        style={{
          position: "absolute",
          bottom: -300 - drift,
          right: -250 - drift2,
          width: 1000,
          height: 1000,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${COLORS.purple}55 0%, ${COLORS.purple}00 70%)`,
          filter: "blur(70px)",
        }}
      />
      {/* Mid accent */}
      <div
        style={{
          position: "absolute",
          top: "40%",
          left: "30%",
          width: 600,
          height: 600,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${COLORS.purpleSoft}33 0%, transparent 70%)`,
          filter: "blur(40px)",
          transform: `translate(${drift2}px, ${drift}px)`,
        }}
      />
      {/* Subtle grid */}
      <AbsoluteFill
        style={{
          backgroundImage:
            "linear-gradient(rgba(34,64,139,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(34,64,139,0.04) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
          opacity: 0.6,
        }}
      />
    </AbsoluteFill>
  );
};
