import { ReactNode } from "react";

interface DemoShellProps {
  children: ReactNode;
  /** Width that the inner content was designed for (e.g. 390 for mobile-first admin) */
  designWidth?: number;
  /** Frame width on mobile mockup */
  mobileFrameWidth?: number;
  /** Frame width on desktop mockup */
  desktopFrameWidth?: number;
  className?: string;
}

/**
 * Wrapper that scales admin-panel JSX (designed for ~390px) into the small
 * iPhone mockup used on the business landing. Blocks pointer events to keep
 * the demos purely visual.
 */
export const DemoShell = ({
  children,
  designWidth = 390,
  mobileFrameWidth = 220,
  desktopFrameWidth = 280,
  className = "",
}: DemoShellProps) => {
  // We use the smaller (mobile) frame as the base scale. The mockup itself
  // already scales the visible frame in CSS, so a single scale value works.
  const scale = mobileFrameWidth / designWidth; // ≈ 0.564
  const widthPct = (1 / scale) * 100; // ≈ 177%

  return (
    <div
      className={`relative w-full h-full overflow-hidden bg-background ${className}`}
      style={{ pointerEvents: "none" }}
    >
      <div
        style={{
          width: `${widthPct}%`,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
        }}
      >
        {children}
      </div>
    </div>
  );
};
