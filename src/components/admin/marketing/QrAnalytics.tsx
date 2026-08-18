import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { QrCode, Users, CalendarCheck, TrendingUp, Loader2, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface QrAnalyticsProps {
  tenantId: string;
  tenantSlug?: string;
}

interface Stats {
  scans7d: number;
  scans30d: number;
  bookingsFromQr: number;
  conversion: number;
}

export function QrAnalytics({ tenantId, tenantSlug: initialSlug }: QrAnalyticsProps) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [tenantSlug, setTenantSlug] = useState<string>(initialSlug ?? "");
  const { toast } = useToast();

  const qrUrl = tenantSlug
    ? `https://glowapp.app/${tenantSlug}?src=qr&utm_source=qr&utm_medium=salon`
    : "";
  const qrImage = qrUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=600x600&format=png&margin=10&data=${encodeURIComponent(qrUrl)}`
    : "";

  useEffect(() => {
    const load = async () => {
      if (!tenantSlug) {
        const { data } = await supabase.from("tenants").select("slug").eq("id", tenantId).maybeSingle();
        if (data?.slug) setTenantSlug(data.slug);
      }
      const now = new Date();
      const d7 = new Date(now.getTime() - 7 * 86400_000).toISOString();
      const d30 = new Date(now.getTime() - 30 * 86400_000).toISOString();
      try {
        const [scans7Res, scans30Res, bookingsRes] = await Promise.all([
          supabase
            .from("feed_events")
            .select("id", { count: "exact", head: true })
            .eq("tenant_id", tenantId)
            .eq("event_type", "qr_scan")
            .gte("created_at", d7),
          supabase
            .from("feed_events")
            .select("id", { count: "exact", head: true })
            .eq("tenant_id", tenantId)
            .eq("event_type", "qr_scan")
            .gte("created_at", d30),
          supabase
            .from("bookings")
            .select("id", { count: "exact", head: true })
            .eq("tenant_id", tenantId)
            .eq("source", "qr")
            .gte("created_at", d30),
        ]);
        const scans30 = scans30Res.count ?? 0;
        const bookings = bookingsRes.count ?? 0;
        setStats({
          scans7d: scans7Res.count ?? 0,
          scans30d: scans30,
          bookingsFromQr: bookings,
          conversion: scans30 > 0 ? (bookings / scans30) * 100 : 0,
        });
      } catch (err) {
        console.error("QR analytics load error", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [tenantId]);

  const copyLink = async () => {
    await navigator.clipboard.writeText(qrUrl);
    setCopied(true);
    toast({ title: "Enlace copiado" });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white rounded-2xl border border-[var(--gp-line)] p-6 space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
          <QrCode className="h-5 w-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-[var(--gp-ink)]">Código QR del salón</h3>
          <p className="text-sm text-[var(--gp-ink2)]">Escaneos y reservas generadas desde el QR</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-6"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard icon={Users} label="Escaneos 7 días" value={stats?.scans7d ?? 0} />
          <StatCard icon={Users} label="Escaneos 30 días" value={stats?.scans30d ?? 0} />
          <StatCard icon={CalendarCheck} label="Reservas por QR" value={stats?.bookingsFromQr ?? 0} />
          <StatCard icon={TrendingUp} label="Conversión" value={`${(stats?.conversion ?? 0).toFixed(1)}%`} />
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-[160px_1fr] items-center bg-[var(--gp-chip)] rounded-xl p-4">
        <img src={qrImage} alt="QR del salón" className="w-40 h-40 rounded-lg bg-white p-2 mx-auto sm:mx-0" />
        <div className="space-y-3">
          <div>
            <p className="text-xs font-semibold text-[var(--gp-ink2)] uppercase tracking-wide">Enlace del QR</p>
            <p className="text-sm text-[var(--gp-ink)] break-all mt-1">{qrUrl}</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={copyLink} variant="outline" size="sm" className="gap-2">
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? "Copiado" : "Copiar enlace"}
            </Button>
            <a href={qrImage} download={`qr-${tenantSlug}.png`}>
              <Button variant="outline" size="sm">Descargar QR</Button>
            </a>
          </div>
          <p className="text-xs text-[var(--gp-ink2)]">
            Coloca este QR en tu recepción, tarjetas o escaparate. Los clientes escanearán y reservarán sin cuenta.
          </p>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: any; label: string; value: number | string }) {
  return (
    <div className="bg-[var(--gp-chip)] rounded-xl p-3">
      <div className="flex items-center gap-2 text-[var(--gp-ink2)] text-xs font-medium">
        <Icon className="h-4 w-4" />
        {label}
      </div>
      <div className="text-2xl font-bold text-[var(--gp-ink)] mt-1">{value}</div>
    </div>
  );
}
