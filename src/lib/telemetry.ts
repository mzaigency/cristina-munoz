/**
 * Lightweight feed telemetry.
 * Captures impressions, clicks and conversions per Discover section
 * to feed back into the recommendation algorithm.
 */
import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

export type FeedEventType = "impression" | "click" | "conversion";
export type FeedSectionId =
  | "favorites"
  | "foryou"
  | "popular"
  | "near"
  | "today"
  | "new";

export interface FeedEventInput {
  event_type: FeedEventType;
  section_id: FeedSectionId | string;
  tenant_id?: string | null;
  position?: number | null;
  score?: number | null;
  metadata?: Record<string, unknown>;
}

const SESSION_KEY = "glow_telemetry_session_id";
const OPT_OUT_KEY = "glow_disable_telemetry";
const LAST_CLICK_KEY = "glow_last_section_click";
const FLUSH_INTERVAL_MS = 5000;
const FLUSH_BATCH_SIZE = 10;

let queue: Array<Record<string, unknown>> = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;

function isOptedOut(): boolean {
  try {
    return localStorage.getItem(OPT_OUT_KEY) === "1";
  } catch {
    return false;
  }
}

export function getSessionId(): string {
  try {
    let id = localStorage.getItem(SESSION_KEY);
    if (!id) {
      id =
        (crypto as any)?.randomUUID?.() ??
        `s_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
      localStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return `s_${Date.now()}`;
  }
}

async function flush(): Promise<void> {
  if (queue.length === 0) return;
  const batch = queue.splice(0, queue.length);
  try {
    await supabase.from("feed_events" as any).insert(batch);
  } catch (err) {
    // best-effort; drop on failure
    if (import.meta.env.DEV) console.warn("telemetry flush failed", err);
  }
}

function scheduleFlush() {
  if (flushTimer) return;
  flushTimer = setTimeout(() => {
    flushTimer = null;
    void flush();
  }, FLUSH_INTERVAL_MS);
}

export async function trackEvent(event: FeedEventInput): Promise<void> {
  if (isOptedOut()) return;
  try {
    const { data: { user } } = await supabase.auth.getUser();
    queue.push({
      event_type: event.event_type,
      section_id: event.section_id,
      tenant_id: event.tenant_id ?? null,
      position: event.position ?? null,
      score: event.score ?? null,
      metadata: event.metadata ?? {},
      session_id: getSessionId(),
      user_id: user?.id ?? null,
    });

    if (queue.length >= FLUSH_BATCH_SIZE) {
      void flush();
    } else {
      scheduleFlush();
    }
  } catch {
    /* noop */
  }
}

/** Persist last section click so we can attribute conversions later. */
export function rememberSectionClick(
  sectionId: string,
  tenantId: string,
  position?: number,
  score?: number,
) {
  try {
    sessionStorage.setItem(
      LAST_CLICK_KEY,
      JSON.stringify({
        sectionId,
        tenantId,
        position: position ?? null,
        score: score ?? null,
        at: Date.now(),
      }),
    );
  } catch {
    /* noop */
  }
}

export function consumeSectionClickFor(tenantId: string): {
  sectionId: string;
  position: number | null;
  score: number | null;
} | null {
  try {
    const raw = sessionStorage.getItem(LAST_CLICK_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // Expire after 30 minutes
    if (!parsed?.at || Date.now() - parsed.at > 30 * 60 * 1000) return null;
    if (parsed.tenantId !== tenantId) return null;
    return {
      sectionId: parsed.sectionId,
      position: parsed.position,
      score: parsed.score,
    };
  } catch {
    return null;
  }
}

/** Hook: fire ONE impression per section when it enters viewport. */
export function useSectionImpression(
  ref: React.RefObject<HTMLElement>,
  sectionId: FeedSectionId,
  itemCount: number,
) {
  const firedRef = useRef(false);
  useEffect(() => {
    if (firedRef.current || !ref.current) return;
    const node = ref.current;
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting && e.intersectionRatio >= 0.4 && !firedRef.current) {
            firedRef.current = true;
            void trackEvent({
              event_type: "impression",
              section_id: sectionId,
              metadata: { item_count: itemCount, kind: "section" },
            });
            obs.disconnect();
          }
        }
      },
      { threshold: [0.4] },
    );
    obs.observe(node);
    return () => obs.disconnect();
  }, [ref, sectionId, itemCount]);
}

// Flush on page hide for last events
if (typeof window !== "undefined") {
  window.addEventListener("pagehide", () => void flush());
  window.addEventListener("beforeunload", () => void flush());
}
