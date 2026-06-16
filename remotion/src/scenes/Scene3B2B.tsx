import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  staticFile,
  Img,
  Sequence,
} from "remotion";
import { COLORS, FONT_DISPLAY } from "../theme";

const Feature: React.FC<{ text: string; delay: number; check?: boolean }> = ({
  text,
  delay,
  check = true,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({
    frame: frame - delay,
    fps,
    config: { damping: 18, stiffness: 140 },
  });
  const x = interpolate(enter, [0, 1], [60, 0]);
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 18,
        padding: "20px 28px",
        borderRadius: 22,
        background: "rgba(255,255,255,0.8)",
        border: "1.5px solid rgba(255,255,255,0.9)",
        boxShadow: "0 16px 40px -16px rgba(34,64,139,0.35)",
        opacity: enter,
        transform: `translateX(${x}px)`,
        marginBottom: 18,
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 14,
          background: check
            ? `linear-gradient(135deg, ${COLORS.navy}, ${COLORS.purple})`
            : "rgba(34,64,139,0.1)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#fff",
          fontSize: 24,
          fontWeight: 800,
          boxShadow: `0 8px 20px ${COLORS.purple}55`,
        }}
      >
        ✓
      </div>
      <div
        style={{
          fontSize: 32,
          fontWeight: 600,
          color: COLORS.ink,
          fontFamily: FONT_DISPLAY,
        }}
      >
        {text}
      </div>
    </div>
  );
};

export const Scene3B2B: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleEnter = spring({ frame, fps, config: { damping: 18 } });
  const titleY = interpolate(titleEnter, [0, 1], [-40, 0]);

  const phoneEnter = spring({
    frame: frame - 10,
    fps,
    config: { damping: 16, stiffness: 80 },
  });
  const phoneX = interpolate(phoneEnter, [0, 1], [-400, 0]);

  return (
    <AbsoluteFill
      style={{
        padding: "140px 60px",
        fontFamily: FONT_DISPLAY,
      }}
    >
      <div
        style={{
          opacity: titleEnter,
          transform: `translateY(${titleY}px)`,
          textAlign: "center",
        }}
      >
        <div
          style={{
            display: "inline-block",
            padding: "10px 24px",
            borderRadius: 999,
            background: `${COLORS.purple}22`,
            border: `1.5px solid ${COLORS.purple}55`,
            color: COLORS.purple,
            fontSize: 26,
            fontWeight: 700,
            letterSpacing: 1,
            textTransform: "uppercase",
            marginBottom: 24,
          }}
        >
          glowapp.app/negocios
        </div>
        <h2
          style={{
            fontSize: 110,
            lineHeight: 0.95,
            fontWeight: 800,
            color: COLORS.ink,
            letterSpacing: -3,
            margin: 0,
          }}
        >
          Tu web.
          <br />
          <span
            style={{
              background: `linear-gradient(90deg, ${COLORS.navy}, ${COLORS.purple})`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              fontStyle: "italic",
            }}
          >
            Tus clientas.
          </span>
        </h2>
      </div>

      {/* Phone showing B2B landing */}
      <div
        style={{
          position: "absolute",
          left: -50 + phoneX,
          top: 720,
          width: 580,
          transform: "rotate(-4deg)",
          opacity: phoneEnter,
          filter: "drop-shadow(0 60px 80px rgba(34,64,139,0.4))",
        }}
      >
        <Img
          src={staticFile("images/mobile-negocio.png")}
          style={{ width: "100%", borderRadius: 60 }}
        />
      </div>

      {/* Feature stack */}
      <div
        style={{
          position: "absolute",
          right: 50,
          top: 820,
          width: 520,
        }}
      >
        <Sequence from={25}>
          <Feature text="0 comisiones" delay={0} />
        </Sequence>
        <Sequence from={38}>
          <Feature text="Dominio propio" delay={0} />
        </Sequence>
        <Sequence from={51}>
          <Feature text="Reservas 24/7" delay={0} />
        </Sequence>
        <Sequence from={64}>
          <Feature text="WhatsApp incluido" delay={0} />
        </Sequence>
        <Sequence from={77}>
          <Feature text="30 días gratis" delay={0} />
        </Sequence>
      </div>
    </AbsoluteFill>
  );
};
