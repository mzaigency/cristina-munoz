import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  staticFile,
  Img,
} from "remotion";
import { COLORS, FONT_DISPLAY } from "../theme";
import { GlassPill, Dot } from "../components/Glass";

export const Scene1Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const pillEnter = spring({ frame, fps, config: { damping: 18, stiffness: 120 } });
  const pillY = interpolate(pillEnter, [0, 1], [-40, 0]);

  const line1Char = (i: number) =>
    interpolate(frame - 10 - i * 2, [0, 12], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
  const line2Char = (i: number) =>
    interpolate(frame - 40 - i * 2, [0, 12], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });

  const line1 = "Tu salón merece";
  const line2 = "algo mejor.";

  const mockEnter = spring({
    frame: frame - 35,
    fps,
    config: { damping: 16, stiffness: 90 },
  });
  const mockY = interpolate(mockEnter, [0, 1], [200, 0]);
  const mockOpacity = interpolate(mockEnter, [0, 1], [0, 1]);

  return (
    <AbsoluteFill
      style={{
        padding: "120px 70px",
        fontFamily: FONT_DISPLAY,
      }}
    >
      <div
        style={{
          transform: `translateY(${pillY}px)`,
          opacity: pillEnter,
        }}
      >
        <GlassPill>
          <Dot />
          Glowapp · para salones
        </GlassPill>
      </div>

      <h1
        style={{
          marginTop: 60,
          fontSize: 130,
          lineHeight: 1.02,
          letterSpacing: -3,
          fontWeight: 800,
          color: COLORS.ink,
        }}
      >
        <div>
          {line1.split("").map((c, i) => (
            <span
              key={i}
              style={{
                display: "inline-block",
                opacity: line1Char(i),
                transform: `translateY(${(1 - line1Char(i)) * 30}px)`,
              }}
            >
              {c === " " ? "\u00A0" : c}
            </span>
          ))}
        </div>
        <div
          style={{
            color: COLORS.navy,
            background: `linear-gradient(90deg, ${COLORS.navy} 0%, ${COLORS.purple} 100%)`,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            fontStyle: "italic",
            fontWeight: 800,
          }}
        >
          {line2.split("").map((c, i) => (
            <span
              key={i}
              style={{
                display: "inline-block",
                opacity: line2Char(i),
                transform: `translateY(${(1 - line2Char(i)) * 30}px)`,
              }}
            >
              {c === " " ? "\u00A0" : c}
            </span>
          ))}
        </div>
      </h1>

      {/* Floating mobile mock */}
      <div
        style={{
          position: "absolute",
          bottom: -120,
          left: "50%",
          transform: `translateX(-50%) translateY(${mockY}px) rotate(-6deg)`,
          opacity: mockOpacity,
          width: 520,
          filter: "drop-shadow(0 60px 80px rgba(34,64,139,0.35))",
        }}
      >
        <Img
          src={staticFile("images/mobile-landing.png")}
          style={{ width: "100%", height: "auto", borderRadius: 56 }}
        />
      </div>
    </AbsoluteFill>
  );
};
