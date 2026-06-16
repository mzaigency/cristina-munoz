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

const Notification: React.FC<{ delay: number; y: number; text: string; sub: string }> = ({
  delay,
  y,
  text,
  sub,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({
    frame: frame - delay,
    fps,
    config: { damping: 16, stiffness: 120 },
  });
  const x = interpolate(enter, [0, 1], [500, 0]);
  return (
    <div
      style={{
        position: "absolute",
        right: 50 + x,
        top: y,
        width: 480,
        padding: "22px 26px",
        borderRadius: 26,
        background: "rgba(255,255,255,0.92)",
        backdropFilter: "blur(20px)",
        border: "1.5px solid rgba(255,255,255,0.9)",
        boxShadow: "0 30px 60px -20px rgba(34,64,139,0.45)",
        opacity: enter,
        fontFamily: FONT_DISPLAY,
        display: "flex",
        gap: 18,
        alignItems: "center",
      }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: 16,
          background: `linear-gradient(135deg, ${COLORS.navy}, ${COLORS.purple})`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 28,
          color: "#fff",
          fontWeight: 800,
        }}
      >
        ✓
      </div>
      <div>
        <div style={{ fontSize: 26, fontWeight: 800, color: COLORS.ink }}>{text}</div>
        <div style={{ fontSize: 20, color: COLORS.navy, opacity: 0.75, marginTop: 2 }}>
          {sub}
        </div>
      </div>
    </div>
  );
};

const Cursor: React.FC = () => {
  const frame = useCurrentFrame();
  // path: start top, move to middle, then to button
  const t1 = interpolate(frame, [0, 30], [0, 1], { extrapolateRight: "clamp" });
  const t2 = interpolate(frame, [30, 55], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const x = interpolate(t1, [0, 1], [600, 350]);
  const y = interpolate(t1, [0, 1], [600, 1050]);
  const x2 = interpolate(t2, [0, 1], [350, 400]);
  const y2 = interpolate(t2, [0, 1], [1050, 1350]);
  const finalX = t2 > 0 ? x2 : x;
  const finalY = t2 > 0 ? y2 : y;

  const clickPulse = interpolate(frame, [55, 65, 80], [0, 1, 0], {
    extrapolateRight: "clamp",
  });

  return (
    <>
      <div
        style={{
          position: "absolute",
          left: finalX,
          top: finalY,
          width: 38,
          height: 38,
          zIndex: 50,
        }}
      >
        <svg viewBox="0 0 24 24" width="38" height="38" fill={COLORS.ink}>
          <path d="M3 2l7 18 2-8 8-2L3 2z" stroke="#fff" strokeWidth="1.5" />
        </svg>
      </div>
      <div
        style={{
          position: "absolute",
          left: finalX - 30,
          top: finalY - 30,
          width: 80,
          height: 80,
          borderRadius: "50%",
          border: `3px solid ${COLORS.purple}`,
          opacity: clickPulse,
          transform: `scale(${1 + clickPulse * 1.2})`,
          zIndex: 49,
        }}
      />
    </>
  );
};

export const Scene4Booking: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const phoneEnter = spring({ frame, fps, config: { damping: 18, stiffness: 80 } });
  const phoneY = interpolate(phoneEnter, [0, 1], [200, 0]);

  const titleOpacity = interpolate(frame, [0, 16], [0, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ fontFamily: FONT_DISPLAY, padding: "140px 60px 0" }}>
      <div style={{ opacity: titleOpacity, textAlign: "center" }}>
        <h2
          style={{
            fontSize: 100,
            lineHeight: 1,
            fontWeight: 800,
            color: COLORS.ink,
            letterSpacing: -3,
            margin: 0,
          }}
        >
          Reservan
          <br />
          <span
            style={{
              background: `linear-gradient(90deg, ${COLORS.navy}, ${COLORS.purple})`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              fontStyle: "italic",
            }}
          >
            mientras duermes.
          </span>
        </h2>
      </div>

      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 600,
          transform: `translateX(-50%) translateY(${phoneY}px)`,
          opacity: phoneEnter,
          width: 540,
          filter: "drop-shadow(0 60px 80px rgba(34,64,139,0.4))",
        }}
      >
        <Img
          src={staticFile("images/mobile-inicio.png")}
          style={{ width: "100%", borderRadius: 60 }}
        />
      </div>

      <Sequence from={20}>
        <Cursor />
      </Sequence>

      <Sequence from={70}>
        <Notification delay={0} y={1500} text="Nueva reserva" sub="María · Corte y color · 17:00" />
      </Sequence>
      <Sequence from={95}>
        <Notification delay={0} y={1650} text="Nueva reserva" sub="Lucía · Manicura · mañana 11:00" />
      </Sequence>
      <Sequence from={120}>
        <Notification delay={0} y={1800} text="Señal cobrada" sub="+15€ · Stripe" />
      </Sequence>
    </AbsoluteFill>
  );
};
