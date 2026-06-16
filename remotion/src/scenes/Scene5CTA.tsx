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

export const Scene5CTA: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoEnter = spring({ frame, fps, config: { damping: 16, stiffness: 90 } });
  const logoScale = interpolate(logoEnter, [0, 1], [0.4, 1]);

  const headlineOpacity = interpolate(frame, [20, 35], [0, 1], {
    extrapolateRight: "clamp",
  });
  const headlineY = interpolate(frame, [20, 35], [40, 0], {
    extrapolateRight: "clamp",
  });

  const ctaEnter = spring({
    frame: frame - 45,
    fps,
    config: { damping: 14, stiffness: 130 },
  });
  const ctaScale = interpolate(ctaEnter, [0, 1], [0.7, 1]);

  const urlOpacity = interpolate(frame, [60, 75], [0, 1], {
    extrapolateRight: "clamp",
  });

  // Pulsing ring around logo
  const pulse = (frame % 60) / 60;
  const ringScale = interpolate(pulse, [0, 1], [1, 1.6]);
  const ringOpacity = interpolate(pulse, [0, 1], [0.5, 0]);

  return (
    <AbsoluteFill
      style={{
        fontFamily: FONT_DISPLAY,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 80,
        textAlign: "center",
      }}
    >
      {/* Logo with pulse */}
      <div
        style={{
          position: "relative",
          width: 280,
          height: 280,
          marginBottom: 60,
          transform: `scale(${logoScale})`,
          opacity: logoEnter,
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: 64,
            border: `4px solid ${COLORS.purple}`,
            transform: `scale(${ringScale})`,
            opacity: ringOpacity,
          }}
        />
        <Img
          src={staticFile("images/glowapp-logo.png")}
          style={{
            width: 280,
            height: 280,
            borderRadius: 64,
            boxShadow: `0 30px 80px ${COLORS.navy}66`,
          }}
        />
      </div>

      <Sequence from={10}>
        <div
          style={{
            opacity: headlineOpacity,
            transform: `translateY(${headlineY}px)`,
          }}
        >
          <h2
            style={{
              fontSize: 120,
              lineHeight: 1,
              fontWeight: 800,
              color: COLORS.ink,
              letterSpacing: -3,
              margin: 0,
            }}
          >
            Empieza
            <br />
            <span
              style={{
                background: `linear-gradient(90deg, ${COLORS.navy}, ${COLORS.purple})`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                fontStyle: "italic",
              }}
            >
              gratis hoy.
            </span>
          </h2>
        </div>
      </Sequence>

      <Sequence from={45}>
        <div
          style={{
            marginTop: 70,
            transform: `scale(${ctaScale})`,
            opacity: ctaEnter,
            padding: "32px 56px",
            borderRadius: 999,
            background: `linear-gradient(135deg, ${COLORS.navy}, ${COLORS.purple})`,
            boxShadow: `0 30px 80px ${COLORS.purple}77`,
            color: "#fff",
            fontSize: 44,
            fontWeight: 800,
            letterSpacing: -0.5,
          }}
        >
          30 días gratis · sin tarjeta
        </div>
      </Sequence>

      <Sequence from={60}>
        <div
          style={{
            marginTop: 50,
            opacity: urlOpacity,
            fontSize: 48,
            fontWeight: 700,
            color: COLORS.navy,
            letterSpacing: -1,
          }}
        >
          glowapp.app
        </div>
      </Sequence>
    </AbsoluteFill>
  );
};
