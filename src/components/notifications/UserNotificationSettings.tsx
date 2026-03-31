import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { motion } from "motion/react";
import {
  Bell,
  Calendar,
  MessageCircle,
  Star,
  Clock,
  Loader2,
  Save,
  BellOff,
  BellRing,
  Tag,
} from "lucide-react";

interface UserNotificationPreferences {
  reminder_24h: boolean;
  reminder_2h: boolean;
  review_request: boolean;
  booking_confirmed: boolean;
  booking_cancelled: boolean;
  messages: boolean;
  promotions: boolean;
}

const defaultPrefs: UserNotificationPreferences = {
  reminder_24h: true,
  reminder_2h: true,
  review_request: true,
  booking_confirmed: true,
  booking_cancelled: true,
  messages: true,
  promotions: true,
};

export function UserNotificationSettings() {
  const [prefs, setPrefs] = useState<UserNotificationPreferences>(defaultPrefs);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const { toast } = useToast();
  const {
    permission,
    isSupported,
    isEnabled,
    requestPermission,
    disablePush,
    loading: pushLoading,
  } = usePushNotifications();

  useEffect(() => {
    fetchPrefs();
  }, []);

  const fetchPrefs = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("user_notification_preferences")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (data) {
        setPrefs({
          reminder_24h: data.reminder_24h ?? true,
          reminder_2h: data.reminder_2h ?? true,
          review_request: data.review_request ?? true,
          booking_confirmed: data.booking_confirmed ?? true,
          booking_cancelled: data.booking_cancelled ?? true,
          messages: data.messages ?? true,
          promotions: data.promotions ?? true,
        });
      }
    } catch (error) {
      console.error("Error fetching notification prefs:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (key: keyof UserNotificationPreferences) => {
    setPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("user_notification_preferences")
        .upsert(
          { user_id: user.id, ...prefs, updated_at: new Date().toISOString() },
          { onConflict: "user_id" }
        );

      if (error) throw error;

      toast({ title: "Preferencias guardadas" });
      setHasChanges(false);
    } catch (error) {
      console.error("Error saving prefs:", error);
      toast({
        title: "Error",
        description: "No se pudieron guardar las preferencias",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handlePushToggle = async () => {
    if (isEnabled) {
      await disablePush();
    } else {
      await requestPermission();
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 p-4">
        <Skeleton className="h-8 w-48" />
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    );
  }

  const sections = [
    {
      title: "Citas",
      icon: Calendar,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
      items: [
        {
          key: "booking_confirmed" as const,
          label: "Reserva confirmada",
          description: "Cuando confirmas una nueva cita",
        },
        {
          key: "booking_cancelled" as const,
          label: "Cita cancelada",
          description: "Cuando se cancela una cita tuya",
        },
        {
          key: "reminder_24h" as const,
          label: "Recordatorio 24h",
          description: "Un día antes de tu cita",
        },
        {
          key: "reminder_2h" as const,
          label: "Recordatorio 2h",
          description: "Dos horas antes de tu cita",
        },
      ],
    },
    {
      title: "Mensajes",
      icon: MessageCircle,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
      items: [
        {
          key: "messages" as const,
          label: "Mensajes del salón",
          description: "Cuando el salón te responde por chat",
        },
      ],
    },
    {
      title: "Reseñas",
      icon: Star,
      color: "text-amber-500",
      bgColor: "bg-amber-500/10",
      items: [
        {
          key: "review_request" as const,
          label: "Solicitud de reseña",
          description: "Después de tu cita para valorar el servicio",
        },
      ],
    },
    {
      title: "Promociones",
      icon: Tag,
      color: "text-pink-500",
      bgColor: "bg-pink-500/10",
      items: [
        {
          key: "promotions" as const,
          label: "Ofertas y descuentos",
          description: "Promociones de tus salones favoritos",
        },
      ],
    },
  ];

  return (
    <div className="space-y-5 pb-safe">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            Notificaciones
          </h2>
          <p className="text-sm text-muted-foreground">
            Elige qué alertas quieres recibir
          </p>
        </div>
        {hasChanges && (
          <Button onClick={handleSave} disabled={saving} size="sm">
            {saving ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-1" />
            )}
            Guardar
          </Button>
        )}
      </div>

      {/* Push master toggle */}
      {isSupported && (
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`h-10 w-10 rounded-xl flex items-center justify-center ${
                  isEnabled ? "bg-primary/10" : "bg-muted"
                }`}
              >
                {isEnabled ? (
                  <BellRing className="h-5 w-5 text-primary" />
                ) : (
                  <BellOff className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
              <div>
                <Label className="font-semibold text-sm">
                  Notificaciones
                </Label>
                <p className="text-xs text-muted-foreground">
                  {permission === "denied"
                    ? "Bloqueadas en ajustes del navegador"
                    : isEnabled
                    ? "Recibirás alertas en tu dispositivo"
                    : "Activa para recibir alertas"}
                </p>
              </div>
            </div>
            <Switch
              checked={isEnabled}
              onCheckedChange={handlePushToggle}
              disabled={pushLoading || permission === "denied"}
            />
          </div>
          {permission === "denied" && (
            <div className="mt-3 p-3 rounded-lg bg-destructive/5 border border-destructive/20">
              <p className="text-xs text-destructive mb-2">
                Has bloqueado las notificaciones. Actívalas desde los ajustes de tu dispositivo.
              </p>
              <button
                onClick={() => {
                  const ua = navigator.userAgent.toLowerCase();
                  if (/iphone|ipad|ipod/.test(ua)) {
                    // iOS: no direct link, guide user
                    window.open("App-prefs:NOTIFICATIONS_ID", "_self");
                  } else if (/android/.test(ua)) {
                    // Android Chrome: direct to site notification settings
                    window.open(`intent://settings/notifications#Intent;scheme=android-app;end`, "_self");
                  }
                  // Fallback: Chrome desktop & others
                  if (window.chrome) {
                    window.open("chrome://settings/content/notifications", "_blank");
                  }
                }}
                className="text-xs font-semibold text-primary underline underline-offset-2"
              >
                Abrir ajustes de notificaciones →
              </button>
            </div>
          )}
        </Card>
      )}

      {/* Notification categories */}
      {sections.map((section, idx) => (
        <motion.div
          key={section.title}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.05 }}
        >
          <Card className="p-4">
            <h3 className="font-medium mb-3 flex items-center gap-2">
              <div
                className={`h-6 w-6 rounded-md ${section.bgColor} flex items-center justify-center`}
              >
                <section.icon className={`h-3.5 w-3.5 ${section.color}`} />
              </div>
              {section.title}
            </h3>
            <div className="space-y-3">
              {section.items.map((item) => (
                <div
                  key={item.key}
                  className="flex items-center justify-between py-2 border-b border-border/50 last:border-0"
                >
                  <div>
                    <Label className="font-medium text-sm">{item.label}</Label>
                    <p className="text-xs text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                  <Switch
                    checked={prefs[item.key]}
                    onCheckedChange={() => handleToggle(item.key)}
                  />
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
