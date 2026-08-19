import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { motion } from "motion/react";
import { Bell, Calendar, MessageCircle, Star, Clock, Mail, Smartphone, Loader2, Save, Sun, BellRing, BellOff } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
interface NotificationPreferences {
  id?: string;
  new_booking: boolean;
  booking_cancelled: boolean;
  booking_reminder_1h: boolean;
  booking_reminder_24h: boolean;
  new_message: boolean;
  new_review: boolean;
  daily_summary: boolean;
  daily_summary_time: string;
  push_enabled: boolean;
  email_enabled: boolean;
}
interface NotificationSettingsProps {
  tenantId: string;
}
const defaultPreferences: NotificationPreferences = {
  new_booking: true,
  booking_cancelled: true,
  booking_reminder_1h: true,
  booking_reminder_24h: false,
  new_message: true,
  new_review: true,
  daily_summary: false,
  daily_summary_time: "08:00",
  push_enabled: true,
  email_enabled: false
};
export function NotificationSettings({
  tenantId
}: NotificationSettingsProps) {
  const [preferences, setPreferences] = useState<NotificationPreferences>(defaultPreferences);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const { toast } = useToast();
  const { permission, isSupported, isEnabled, requestPermission, disablePush, loading: pushLoading } = usePushNotifications();
  const { user: authUser } = useAuth();
  const userId = authUser?.id ?? null;
  useEffect(() => {
    if (userId) fetchPreferences();
  }, [tenantId, userId]);
  const fetchPreferences = async () => {
    try {
      if (!userId) return;
      const {
        data,
        error
      } = await supabase.from("notification_preferences" as any).select("*").eq("user_id", userId).eq("tenant_id", tenantId).maybeSingle();
      if (error) throw error;
      if (data) {
        setPreferences(data as unknown as NotificationPreferences);
      }
    } catch (error) {
      console.error("Error fetching preferences:", error);
    } finally {
      setLoading(false);
    }
  };
  const handleToggle = (key: keyof NotificationPreferences) => {
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
    setHasChanges(true);
  };
  const handleSave = async () => {
    if (!userId) return;
    setSaving(true);
    try {
      const {
        id,
        ...prefsWithoutId
      } = preferences;
      if (id) {
        // Update existing
        const {
          error
        } = await supabase.from("notification_preferences" as any).update(prefsWithoutId).eq("id", id);
        if (error) throw error;
      } else {
        // Insert new
        const {
          error
        } = await supabase.from("notification_preferences" as any).insert({
          ...prefsWithoutId,
          user_id: userId,
          tenant_id: tenantId
        });
        if (error) throw error;
      }
      toast({
        title: "Preferencias guardadas"
      });
      setHasChanges(false);
      fetchPreferences();
    } catch (error) {
      console.error("Error saving preferences:", error);
      toast({
        title: "Error",
        description: "No se pudieron guardar las preferencias",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };
  if (loading) {
    return <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full" />)}
      </div>;
  }
  const sections = [{
    title: "Citas",
    icon: Calendar,
    color: "text-glow-brand-ink",
    bgColor: "bg-glow-brand/10",
    items: [{
      key: "new_booking" as const,
      label: "Nueva reserva",
      description: "Cuando un cliente hace una reserva"
    }, {
      key: "booking_cancelled" as const,
      label: "Cita cancelada",
      description: "Cuando se cancela una cita"
    }, {
      key: "booking_reminder_1h" as const,
      label: "Recordatorio 1h antes",
      description: "Una hora antes de cada cita"
    }, {
      key: "booking_reminder_24h" as const,
      label: "Recordatorio 24h antes",
      description: "Un día antes de cada cita"
    }]
  }, {
    title: "Mensajes",
    icon: MessageCircle,
    color: "text-glow-ok-ink",
    bgColor: "bg-glow-ok/10",
    items: [{
      key: "new_message" as const,
      label: "Nuevo mensaje",
      description: "Cuando recibes un mensaje de un cliente"
    }]
  }, {
    title: "Reseñas",
    icon: Star,
    color: "text-glow-warn-ink",
    bgColor: "bg-glow-warn/10",
    items: [{
      key: "new_review" as const,
      label: "Nueva reseña",
      description: "Cuando un cliente deja una reseña"
    }]
  }, {
    title: "Resumen diario",
    icon: Sun,
    color: "text-glow-warn-ink",
    bgColor: "bg-glow-warn/10",
    items: [{
      key: "daily_summary" as const,
      label: "Resumen matutino",
      description: "Recibe un resumen de las citas del día"
    }]
  }];
  return <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            Notificaciones
          </h2>
          <p className="text-sm text-outline">Configura qué alertas quieres recibir</p>
        </div>
        {hasChanges && <button className="glow-btn glow-btn--primary glow-btn--sm" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="glow-spinner-sm" /> : <Save className="h-4 w-4 mr-1" />}
            Guardar
          </button>}
      </div>

      {/* Push master toggle */}
      {isSupported && (
        <div className="glow-card p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${isEnabled ? 'bg-primary/10' : 'bg-muted'}`}>
                {isEnabled ? <BellRing className="h-5 w-5 text-primary" /> : <BellOff className="h-5 w-5 text-outline" />}
              </div>
              <div>
                <label className="font-semibold text-sm">Notificaciones</label>
                <p className="text-xs text-outline">
                  {permission === 'denied' ? 'Bloqueadas en ajustes del navegador' : isEnabled ? 'Recibirás alertas en tu dispositivo' : 'Activa para recibir alertas en el móvil'}
                </p>
              </div>
            </div>
            <Switch
              checked={isEnabled}
              onCheckedChange={async () => {
                if (isEnabled) await disablePush();
                else await requestPermission();
              }}
              disabled={pushLoading || permission === 'denied'}
            />
          </div>
          {permission === 'denied' && (
            <div className="mt-3 p-3 rounded-lg bg-destructive/5 border border-destructive/20">
              <p className="text-xs text-destructive mb-2">
                Has bloqueado las notificaciones. Actívalas desde los ajustes de tu dispositivo.
              </p>
              <button
                type="button"
                onClick={() => {
                  const ua = navigator.userAgent.toLowerCase();
                  if (/iphone|ipad|ipod/.test(ua)) {
                    window.open("App-prefs:NOTIFICATIONS_ID", "_self");
                  } else if (/android/.test(ua)) {
                    window.open("intent://settings/notifications#Intent;scheme=android-app;end", "_self");
                  } else if ((window as any).chrome) {
                    window.open("chrome://settings/content/notifications", "_blank");
                  } else {
                    window.open("about:preferences#privacy", "_blank");
                  }
                }}
                className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
              >
                Abrir ajustes de notificaciones →
              </button>
            </div>
          )}
        </div>
      )}

      {/* Notification categories */}
      {sections.map((section, sectionIndex) => <motion.div key={section.title} initial={{
      opacity: 0,
      y: 10
    }} animate={{
      opacity: 1,
      y: 0
    }} transition={{
      delay: sectionIndex * 0.05
    }}>
          <div className="glow-card p-4">
            <h3 className="font-medium mb-3 flex items-center gap-2">
              <div className={`h-6 w-6 rounded-md ${section.bgColor} flex items-center justify-center`}>
                <section.icon className={`h-3.5 w-3.5 ${section.color}`} />
              </div>
              {section.title}
            </h3>
            <div className="space-y-3">
              {section.items.map(item => <div key={item.key} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                  <div>
                    <label className="font-medium text-sm">{item.label}</label>
                    <p className="text-xs text-outline">{item.description}</p>
                  </div>
                  <Switch checked={preferences[item.key] as boolean} onCheckedChange={() => handleToggle(item.key)} />
                </div>)}
            </div>
          </div>
        </motion.div>)}
    </div>;
}