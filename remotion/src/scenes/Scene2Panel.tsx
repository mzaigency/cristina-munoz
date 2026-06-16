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
import { GlassPill, Dot } from "../components/Glass";

const PanelCard: React.FC<{
  src: string;
  delay: number;
  x: number;
  y: number;
  rotate: number;
  width: number;
  z: number;
}> = ({ src, delay, x, y, rotate, width, z }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({
    frame: frame - delay,
    fps,
    config: { damping: 18, stiffness: 90 },
  });
  const ty = interpolate(enter, [0, 1], [120, 0]);
  const opacity = interpolate(enter, [0, 1], [0, 1]);

  // Subtle floating
  const float = Math.sin((frame - delay) / 30) * 6;

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y + ty + float,
        opacity,
        transform: `rotate(${rotate}deg)`,
        width,
        zIndex: z,
        filter: `drop-shadow(0 30px 60px rgba(34,64,139,0.35))`,
        borderRadius: 28,
        overflow: "hidden",
        border: "2px solid rgba(255,255,255,0.9)",
      }}
    >
      <Img src={staticFile(src)} style={{ width: "100%", display: "block" }} />
    </div>
  );
};

const StatChip: React.FC<{
  label: string;
  value: string;
  delay: number;
  x: number;
  y: number;
}> = ({ label, value, delay, x, y }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({
    frame: frame - delay,
    fps,
    config: { damping: 14, stiffness: 140 },
  });
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        opacity: enter,
        transform: `scale(${0.6 + enter * 0.4})`,
        padding: "16px 22px",
        borderRadius: 24,
        background: "rgba(255,255,255,0.85)",
        backdropFilter: "blur(20px)",
        border: "1.5px solid rgba(255,255,255,0.9)",
        boxShadow: "0 20px 40px -10px rgba(34,64,139,0.4)",
        fontFamily: FONT_DISPLAY,
        zIndex: 10,
      }}
    >
      <div
        style={{
          fontSize: 18,
          color: COLORS.navy,
          opacity: 0.7,
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: 1,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 36,
          fontWeight: 800,
          color: COLORS.ink,
          lineHeight: 1,
          marginTop: 4,
        }}
      >
        {value}
      </div>
    </div>
  );
};

export const Scene2Panel: React.FC = () => {
  const frame = useCurrentFrame();

  const titleOpacity = interpolate(frame, [0, 18], [0, 1], {
    extrapolateRight: "clamp",
  });
  const titleY = interpolate(frame, [0, 18], [-30, 0], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ fontFamily: FONT_DISPLAY }}>
      <div
        style={{
          padding: "120px 70px 0",
          opacity: titleOpacity,
          transform: `translateY(${titleY}px)`,
        }}
      >
        <GlassPill style={{ fontSize: 26, padding: "12px 22px" }}>
          <Dot color={COLORS.navy} />
          El panel
        </GlassPill>
        <h2
          style={{
            marginTop: 24,
            fontSize: 96,
            lineHeight: 1.05,
            fontWeight: 800,
            color: COLORS.ink,
            letterSpacing: -2,
          }}
        >
          Todo tu salón.
          <br />
          <span
            style={{
              background: `linear-gradient(90deg, ${COLORS.navy}, ${COLORS.purple})`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Una sola app.
          </span>
        </h2>
      </div>

      {/* Stacked panel screenshots */}
      <PanelCard
        src="images/panel-inicio.png"
        delay={10}
        x={60}
        y={760}
        rotate={-4}
        width={780}
        z={1}
      />
      <Sequence from={20}>
        <PanelCard
          src="images/panel-agenda.png"
          delay={0}
          x={220}
          y={920}
          rotate={2}
          width={780}
          z={2}
        />
      </Sequence>
      <Sequence from={40}>
        <PanelCard
          src="images/panel-caja.png"
          delay={0}
          x={140}
          y={1100}
          rotate={-2}
          width={820}
          z={3}
        />
      </Sequence>

      {/* Floating stat chips */}
      <Sequence from={55}>
        <StatChip label="Hoy" value="14 citas" delay={0} x={70} y={1380} />
      </Sequence>
      <Sequence from={68}>
        <StatChip label="Caja" value="+820€" delay={0} x={720} y={1430} />
      </Sequence>
      <Sequence from={80}>
        <StatChip label="Recordatorios" value="WhatsApp ✓" delay={0} x={200} y={1620} />
      </Sequence>
    </AbsoluteFill>
  );
};
