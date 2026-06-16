import { AbsoluteFill } from "remotion";
import {
  TransitionSeries,
  linearTiming,
  springTiming,
} from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import { wipe } from "@remotion/transitions/wipe";
import { loadFont } from "@remotion/google-fonts/PlusJakartaSans";

import { PersistentBackground } from "./components/PersistentBackground";
import { Scene1Hook } from "./scenes/Scene1Hook";
import { Scene2Panel } from "./scenes/Scene2Panel";
import { Scene3B2B } from "./scenes/Scene3B2B";
import { Scene4Booking } from "./scenes/Scene4Booking";
import { Scene5CTA } from "./scenes/Scene5CTA";

loadFont("normal", { weights: ["400", "600", "700", "800"], subsets: ["latin"] });

// Scene durations (30fps)
const S1 = 90;   // 3.0s hook
const S2 = 150;  // 5.0s panel
const S3 = 150;  // 5.0s B2B
const S4 = 165;  // 5.5s booking
const S5 = 135;  // 4.5s CTA
const T = 18;    // transition overlap

// Total = S1+S2+S3+S4+S5 - 4*T = 90+150+150+165+135 - 72 = 618
export const TOTAL_FRAMES = S1 + S2 + S3 + S4 + S5 - 4 * T;

export const MainVideo: React.FC = () => {
  return (
    <AbsoluteFill>
      <PersistentBackground />
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={S1}>
          <Scene1Hook />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={slide({ direction: "from-bottom" })}
          timing={springTiming({ config: { damping: 200 }, durationInFrames: T })}
        />
        <TransitionSeries.Sequence durationInFrames={S2}>
          <Scene2Panel />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={wipe({ direction: "from-right" })}
          timing={linearTiming({ durationInFrames: T })}
        />
        <TransitionSeries.Sequence durationInFrames={S3}>
          <Scene3B2B />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: T })}
        />
        <TransitionSeries.Sequence durationInFrames={S4}>
          <Scene4Booking />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={slide({ direction: "from-right" })}
          timing={springTiming({ config: { damping: 200 }, durationInFrames: T })}
        />
        <TransitionSeries.Sequence durationInFrames={S5}>
          <Scene5CTA />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
