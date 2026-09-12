import React, { useState, useEffect, useCallback } from "react";
import { useLocation, Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  Rocket,
  Sparkles,
  Gift,
  AlertTriangle,
  X,
  ArrowRight,
  ExternalLink,
} from "lucide-react";

export interface GlobalAnnouncementConfig {
  id?: string;
  active: boolean;
  title?: string;
  text: string;
  type: "update" | "promo" | "alert" | "info";
  target_audience: "all" | "salons" | "clients";
  image_url?: string;
  action_label?: string;
  action_url?: string;
  updated_at?: string;
}

export const GlobalAnnouncementPill: React.FC = () => {
  const location = useLocation();
  const { user, loading: authLoading } = useAuth();
  const [announcement, setAnnouncement] = useState<GlobalAnnouncementConfig | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  // 1. Cargar anuncio inicial y suscribirse a cambios en tiempo real
  useEffect(() => {
    fetchAnnouncement();

    const channel = supabase
      .channel("global_announcement_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "app_config",
          filter: "key=eq.global_announcement",
        },
        (payload) => {
          if (payload.new && (payload.new as any).value) {
            parseAndSetAnnouncement((payload.new as any).value);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchAnnouncement = async () => {
    try {
      const { data, error } = await supabase
        .from("app_config")
        .select("value")
        .eq("key", "global_announcement")
        .maybeSingle();

      if (!error && data?.value) {
        parseAndSetAnnouncement(data.value);
      }
    } catch (e) {
      console.warn("Could not fetch global announcement:", e);
    }
  };

  const parseAndSetAnnouncement = (rawVal: string) => {
    try {
      let parsed: GlobalAnnouncementConfig;
      if (typeof rawVal === "string" && (rawVal.startsWith("{") || rawVal.startsWith("["))) {
        parsed = JSON.parse(rawVal);
      } else {
        parsed = {
          active: Boolean(rawVal),
          text: rawVal,
          type: "info",
          target_audience: "all",
          updated_at: "default",
        };
      }
      setAnnouncement(parsed);
    } catch {
      setAnnouncement(null);
    }
  };

  // Helper para construir la clave única del anuncio
  const getAnnouncementKey = useCallback((ann: GlobalAnnouncementConfig) => {
    return ann.id || ann.updated_at || ann.text.slice(0, 32);
  }, []);

  // Función para cerrar y registrar el descarte permanente en este perfil / dispositivo
  const handleDismiss = useCallback(() => {
    if (!announcement) return;
    const annKey = getAnnouncementKey(announcement);

    try {
      // 1. Guardar a nivel de dispositivo / navegador
      localStorage.setItem(`glow_ann_dismissed_device_${annKey}`, "1");
      localStorage.setItem(`glow_announcement_dismissed_guest_${annKey}`, "true");
      localStorage.setItem(`glow_announcement_dismissed_${annKey}`, "true");

      // 2. Si el usuario tiene perfil autenticado, guardar específicamente para su ID
      if (user?.id) {
        localStorage.setItem(`glow_ann_dismissed_user_${user.id}_${annKey}`, "1");
        localStorage.setItem(`glow_announcement_dismissed_u_${user.id}_${annKey}`, "true");

        // 3. Sincronizar en segundo plano con metadatos del usuario de Supabase para persistencia entre dispositivos
        supabase.auth.updateUser({
          data: { last_dismissed_announcement: annKey },
        }).catch(() => {
          // Fallback silencioso si falla red
        });
      }
    } catch (e) {
      console.warn("Could not save announcement dismissal:", e);
    }

    setIsVisible(false);
  }, [announcement, user, getAnnouncementKey]);

  // Evaluar visibilidad según audiencia, estado de autenticación y si ya fue descartado
  useEffect(() => {
    // Si aún está resolviendo sesión de auth o no hay anuncio activo, no mostrar
    if (authLoading) return;
    if (!announcement || !announcement.active || !announcement.text?.trim()) {
      setIsVisible(false);
      return;
    }

    // No mostrar en la pantalla de superadmin para evitar estorbar al administrador
    if (location.pathname.startsWith("/superadmin")) {
      setIsVisible(false);
      return;
    }

    const isSalonRoute = location.pathname.startsWith("/admin");
    const target = announcement.target_audience || "all";

    // Validar segmentación de audiencia
    if (target === "salons" && !isSalonRoute) {
      setIsVisible(false);
      return;
    }
    if (target === "clients" && isSalonRoute) {
      setIsVisible(false);
      return;
    }

    // Comprobar si ya fue cerrado/descartado previamente en este perfil o dispositivo
    const annKey = getAnnouncementKey(announcement);

    const isDismissedOnDevice =
      localStorage.getItem(`glow_ann_dismissed_device_${annKey}`) === "1" ||
      localStorage.getItem(`glow_announcement_dismissed_${annKey}`) === "true";

    const isDismissedByUser =
      user?.id &&
      (localStorage.getItem(`glow_ann_dismissed_user_${user.id}_${annKey}`) === "1" ||
        localStorage.getItem(`glow_announcement_dismissed_u_${user.id}_${annKey}`) === "true" ||
        user.user_metadata?.last_dismissed_announcement === annKey);

    const isDismissedAsGuest =
      !user && localStorage.getItem(`glow_announcement_dismissed_guest_${annKey}`) === "true";

    if (isDismissedOnDevice || isDismissedByUser || isDismissedAsGuest) {
      setIsVisible(false);
      return;
    }

    setIsVisible(true);
  }, [announcement, location.pathname, user, authLoading, getAnnouncementKey]);

  if (!isVisible || !announcement) return null;

  const getTypeStyle = () => {
    switch (announcement.type) {
      case "update":
        return {
          icon: <Rocket className="h-3.5 w-3.5 text-purple-400" />,
          badgeText: "Actualización",
          badgeClass: "bg-purple-500/15 text-purple-600 dark:text-purple-300 border-purple-500/30",
          glowBorder: "border-purple-500/30",
        };
      case "promo":
        return {
          icon: <Gift className="h-3.5 w-3.5 text-pink-500" />,
          badgeText: "Promoción",
          badgeClass: "bg-pink-500/15 text-pink-600 dark:text-pink-300 border-pink-500/30",
          glowBorder: "border-pink-500/30",
        };
      case "alert":
        return {
          icon: <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />,
          badgeText: "Aviso importante",
          badgeClass: "bg-amber-500/15 text-amber-600 dark:text-amber-300 border-amber-500/30",
          glowBorder: "border-amber-500/30",
        };
      case "info":
      default:
        return {
          icon: <Sparkles className="h-3.5 w-3.5 text-[var(--glow-brand)]" />,
          badgeText: "Novedad",
          badgeClass: "bg-[var(--glow-brand-soft)] text-[var(--glow-brand)] border-[var(--glow-brand-softer)]",
          glowBorder: "border-[var(--glow-brand)]/30",
        };
    }
  };

  const style = getTypeStyle();
  const isExternalUrl = announcement.action_url?.startsWith("http");

  return (
    <AnimatePresence>
      <motion.aside
        aria-label="Anuncio general"
        initial={{ y: -60, opacity: 0, scale: 0.95 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: -40, opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0.7, bottom: 0.1 }}
        onDragEnd={(_e, info) => {
          // Deslizar hacia arriba descarta la píldora inmediatamente
          if (info.offset.y < -25 || info.velocity.y < -200) {
            handleDismiss();
          }
        }}
        className="fixed left-1/2 -translate-x-1/2 z-50 w-[94vw] max-w-lg pointer-events-none"
        style={{ top: "calc(env(safe-area-inset-top, 0px) + 12px)" }}
      >
        <div
          className={`pointer-events-auto flex items-center justify-between gap-2.5 p-2 sm:p-2.5 pl-3 rounded-2xl sm:rounded-full bg-background/90 backdrop-blur-xl border ${style.glowBorder} shadow-xl shadow-black/10 transition-all hover:shadow-2xl`}
        >
          {/* Lado izquierdo: Imagen/Foto o Icono + Textos */}
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            {announcement.image_url ? (
              <img
                src={announcement.image_url}
                alt=""
                aria-hidden="true"
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-full object-cover shrink-0 border border-white/20 shadow-xs"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = "none";
                }}
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                {style.icon}
              </div>
            )}

            <div className="flex flex-col min-w-0 pr-1">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span
                  className={`text-[9.5px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full border ${style.badgeClass}`}
                >
                  {style.badgeText}
                </span>
                {announcement.title && (
                  <span className="text-xs font-bold text-foreground truncate max-w-[170px] sm:max-w-[220px]">
                    {announcement.title}
                  </span>
                )}
              </div>
              <p className="text-[11.5px] text-muted-foreground truncate leading-tight">
                {announcement.text}
              </p>
            </div>
          </div>

          {/* Lado derecho: Botón de Acción y Botón de Descarte */}
          <div className="flex items-center gap-1.5 shrink-0">
            {announcement.action_url && announcement.action_label && (
              <>
                {isExternalUrl ? (
                  <a
                    href={announcement.action_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={handleDismiss}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-[var(--glow-brand)] text-white text-[11px] font-bold hover:brightness-105 transition-transform active:scale-95 shadow-xs"
                  >
                    <span>{announcement.action_label}</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                ) : (
                  <Link
                    to={announcement.action_url}
                    onClick={handleDismiss}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-[var(--glow-brand)] text-white text-[11px] font-bold hover:brightness-105 transition-transform active:scale-95 shadow-xs"
                  >
                    <span>{announcement.action_label}</span>
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                )}
              </>
            )}

            {/* Botón de cierre para descarte permanente */}
            <button
              type="button"
              onClick={handleDismiss}
              aria-label="Cerrar y no volver a mostrar este aviso"
              className="h-7 w-7 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
              title="Cerrar y no volver a mostrar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </motion.aside>
    </AnimatePresence>
  );
};
