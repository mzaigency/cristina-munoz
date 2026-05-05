import { ReactNode, useEffect, useRef } from "react";

interface GuidedStepProps {
  /** Whether this step is the active one. Triggers scroll + highlight. */
  isActive: boolean;
  /** Selector for the CTA inside this step that should be highlighted. */
  ctaSelector?: string;
  children: ReactNode;
}

/**
 * Wraps a step in a guided flow.
 * - When activated, smoothly scrolls itself into view.
 * - Adds a pulsating `guided-halo` class to the element matching `ctaSelector`
 *   inside it (default: `[data-guided-cta="true"]`).
 * - Removes the halo after the user clicks/touches the CTA.
 */
export const GuidedStep = ({
  isActive,
  ctaSelector = '[data-guided-cta="true"]',
  children,
}: GuidedStepProps) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isActive || !ref.current) return;

    // Scroll into view smoothly.
    const t = setTimeout(() => {
      ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);

    // Highlight the CTA.
    const halo = ref.current.querySelector(ctaSelector);
    if (halo) halo.classList.add("guided-halo");

    const remove = () => {
      if (halo) halo.classList.remove("guided-halo");
    };
    halo?.addEventListener("click", remove, { once: true });
    halo?.addEventListener("touchstart", remove, { once: true, passive: true });

    return () => {
      clearTimeout(t);
      remove();
    };
  }, [isActive, ctaSelector]);

  return (
    <div ref={ref} aria-hidden={!isActive}>
      {children}
    </div>
  );
};
