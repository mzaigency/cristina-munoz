import { ReactNode, useEffect, useRef, useState } from "react";

interface DemoShellProps {
  children: ReactNode;
  /** Width that the inner content was designed for (e.g. 390 for mobile-first admin) */
  designWidth?: number;
  className?: string;
}

/**
 * Wrapper that scales admin-panel JSX (designed for ~390px) into the small
 * iPhone mockup used on the business landing. Measures the actual container
 * width so it works in both mobile (220px) and desktop (280px) frames.
 * Blocks pointer events to keep the demos purely visual.
 */
export const DemoShell = ({
  children,
  designWidth = 390,
  className = "",
}: DemoShellProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(220 / designWidth);

  useEffect(() => {
    if (!containerRef.current) return;
    const el = containerRef.current;

    const update = () => {
      const w = el.clientWidth;
      if (w > 0) setScale(w / designWidth);
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [designWidth]);

  const widthPct = (1 / scale) * 100;

  return (
    <div
      ref={containerRef}
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
