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

    const halo = ref.current.querySelector<HTMLElement>(ctaSelector);

    // Scroll: prefer the CTA itself (centered) so user sees what to press.
    // Fallback to step container start.
    const t = setTimeout(() => {
      const target = halo ?? ref.current;
      target?.scrollIntoView({ behavior: "smooth", block: halo ? "center" : "start" });
    }, 500);

    if (halo) halo.classList.add("guided-halo");

    const remove = () => {
      if (halo) halo.classList.remove("guided-halo");
    };
    halo?.addEventListener("click", remove, { once: true });
    halo?.addEventListener("touchstart", remove, { once: true, passive: true });

    // Re-scroll to CTA when it transitions from disabled → enabled
    // (e.g. after the user selects a service or fills required data).
    let observer: MutationObserver | null = null;
    let wasDisabled = halo?.hasAttribute("disabled") ?? false;
    if (halo) {
      observer = new MutationObserver(() => {
        const isDisabled = halo.hasAttribute("disabled");
        if (wasDisabled && !isDisabled) {
          halo.scrollIntoView({ behavior: "smooth", block: "center" });
        }
        wasDisabled = isDisabled;
      });
      observer.observe(halo, { attributes: true, attributeFilter: ["disabled"] });
    }

    return () => {
      clearTimeout(t);
      observer?.disconnect();
      remove();
    };
  }, [isActive, ctaSelector]);

  return (
    <div ref={ref} aria-hidden={!isActive}>
      {children}
    </div>
  );
};
