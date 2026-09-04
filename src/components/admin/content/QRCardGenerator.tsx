import { useState, useRef, useEffect } from "react";
import QRCode from "qrcode";
import {
  Download,
  Share2,
  Printer,
  Copy,
  Check,
  Sparkles,
  Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

interface QRCardGeneratorProps {
  tenantId: string;
  tenantSlug: string;
}

type CardFormat = "counter" | "poster" | "mirror";

interface CardTheme {
  id: string;
  name: string;
  description: string;
  bgClass: string;
  textClass: string;
  subClass: string;
  borderClass: string;
  qrBgClass: string;
  accentColor: string;
  /** CSS color for labels rendered ON TOP of the card bg (URL chip, "Escanea aquí") */
  onCardLabel: string;
  /** CSS color for accent icons (Sparkles) rendered on the card */
  onCardIcon: string;
}

const TAGLINE_PRESETS = [
  "Reserva tu cita online en 1 minuto",
  "Pide cita con tu estilista favorito",
  "Descubre nuestros servicios y reserva aquí",
  "¿Te gusta tu look? Vuelve a reservar",
];

function isLightHex(hex: string): boolean {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 145;
}

export function QRCardGenerator({ tenantId, tenantSlug }: QRCardGeneratorProps) {
  const { toast } = useToast();
  const [format, setFormat] = useState<CardFormat>("counter");
  const [themeId, setThemeId] = useState<string>("salon");
  const [tagline, setTagline] = useState<string>("Reserva tu cita online en 1 minuto");
  const [showLogo, setShowLogo] = useState<boolean>(true);
  const [showUrl, setShowUrl] = useState<boolean>(true);
  const [showPerks, setShowPerks] = useState<boolean>(true);

  const [copied, setCopied] = useState<boolean>(false);
  const [downloading, setDownloading] = useState<boolean>(false);

  const [salonName, setSalonName] = useState<string>("Salón de Belleza");
  const [salonLogo, setSalonLogo] = useState<string | null>(null);
  const [primaryColor, setPrimaryColor] = useState<string>("#7c3aed");
  const [secondaryColor, setSecondaryColor] = useState<string>("#ec4899");

  // QR data URL (from qrcode lib – works in canvas for download)
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");

  const cardRef = useRef<HTMLDivElement>(null);

  /** Public booking page link (display) */
  const bookingUrl = `https://glowapp.app/${tenantSlug}`;

  /** QR encodes the tracking URL so scans are logged + QrWelcomeBanner activates */
  const qrTrackingUrl = `https://glowapp.app/${tenantSlug}?src=qr&utm_source=qr&utm_medium=salon`;

  // Load tenant branding
  useEffect(() => {
    let cancelled = false;
    supabase
      .from("tenants")
      .select("name, logo_url, primary_color, secondary_color")
      .eq("id", tenantId)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled && data) {
          if (data.name) setSalonName(data.name);
          if (data.logo_url) setSalonLogo(data.logo_url);
          if (data.primary_color) setPrimaryColor(data.primary_color);
          if (data.secondary_color) setSecondaryColor(data.secondary_color);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [tenantId]);

  // Generate QR from tracking URL (errorCorrectionLevel H = allows 30% damage)
  useEffect(() => {
    QRCode.toDataURL(qrTrackingUrl, {
      width: 800,
      margin: 1,
      color: { dark: "#000000", light: "#ffffff" },
      errorCorrectionLevel: "H",
    })
      .then((url) => setQrCodeDataUrl(url))
      .catch((err) => console.error("Error generating QR:", err));
  }, [qrTrackingUrl]);

  // Determine readable ink for "salon" theme (adapts to primary color)
  const salonInk = isLightHex(primaryColor) ? "#111827" : "#ffffff";
  const salonSubInk = isLightHex(primaryColor) ? "rgba(0,0,0,0.55)" : "rgba(255,255,255,0.65)";
  const salonLabelInk = isLightHex(primaryColor)
    ? "rgba(0,0,0,0.70)"
    : "rgba(255,255,255,0.80)";

  // ── Themes ──
  const themes: Record<string, CardTheme> = {
    salon: {
      id: "salon",
      name: "Marca del Salón",
      description: "Colores corporativos personalizados",
      bgClass: "", // set inline via style
      textClass: "",
      subClass: "",
      borderClass: "border-black/10",
      qrBgClass: "bg-white",
      accentColor: primaryColor,
      onCardLabel: salonLabelInk,
      onCardIcon: isLightHex(primaryColor) ? primaryColor : secondaryColor,
    },
    glow: {
      id: "glow",
      name: "Glow Signature",
      description: "Azul zafiro y púrpura Glowapp",
      bgClass: "bg-gradient-to-br from-[#22408C] via-[#4d2080] to-[#98329A]",
      textClass: "text-white",
      subClass: "text-white/70",
      borderClass: "border-purple-400/25",
      qrBgClass: "bg-white",
      accentColor: "#c084fc",
      onCardLabel: "rgba(255,255,255,0.85)",
      onCardIcon: "#e0c8f0",
    },
    dark: {
      id: "dark",
      name: "Luxe Noir & Gold",
      description: "Negro obsidiana con dorado cálido",
      bgClass: "bg-gradient-to-br from-[#0a0a0c] via-[#12120f] to-[#1a1810]",
      textClass: "text-[#fef3c7]",
      subClass: "text-[#fde68a]/75",
      borderClass: "border-amber-500/35",
      qrBgClass: "bg-[#fefce8]",
      accentColor: "#f59e0b",
      onCardLabel: "rgba(253,230,138,0.90)",
      onCardIcon: "#fbbf24",
    },
    minimal: {
      id: "minimal",
      name: "Editorial Minimal",
      description: "Blanco suizo, contraste máximo",
      bgClass: "bg-white",
      textClass: "text-zinc-950",
      subClass: "text-zinc-500",
      borderClass: "border-zinc-200 shadow-md",
      qrBgClass: "bg-zinc-50 border border-zinc-100",
      accentColor: "#18181b",
      onCardLabel: "#52525b",
      onCardIcon: "#18181b",
    },
    warm: {
      id: "warm",
      name: "Warm Velvet",
      description: "Terracota, arena y oro rosa",
      bgClass: "bg-gradient-to-br from-[#fdf8f4] via-[#f7ece0] to-[#e8d5c0]",
      textClass: "text-[#2e1d19]",
      subClass: "text-[#6b3a2a]/80",
      borderClass: "border-[#c8a882]/60 shadow-md",
      qrBgClass: "bg-white",
      accentColor: "#b05a3e",
      onCardLabel: "rgba(62,39,35,0.75)",
      onCardIcon: "#b05a3e",
    },
  };

  const currentTheme = themes[themeId] || themes.salon;

  // Inline bg style for "salon" theme (uses primary color gradient)
  const salonBgStyle =
    themeId === "salon"
      ? {
          background: `linear-gradient(135deg, ${primaryColor}cc 0%, ${primaryColor} 55%, ${secondaryColor}99 100%)`,
          color: salonInk,
        }
      : {};

  // Copy link
  const handleCopy = () => {
    navigator.clipboard.writeText(bookingUrl);
    setCopied(true);
    toast({ title: "Enlace copiado", description: bookingUrl });
    setTimeout(() => setCopied(false), 2000);
  };

  // WhatsApp share
  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      `¡Hola! Ya puedes reservar tu cita online directamente en ${salonName} desde aquí: ${bookingUrl}`
    );
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  // Direct Print
  const handlePrint = () => {
    window.print();
  };

  // High-Res Download (Canvas export)
  const handleDownload = async () => {
    setDownloading(true);
    try {
      const scale = 3;
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const isPoster = format === "poster";
      const isMirror = format === "mirror";

      const width = isPoster ? 840 * scale : isMirror ? 800 * scale : 1200 * scale;
      const height = isPoster ? 1188 * scale : isMirror ? 800 * scale : 750 * scale;

      canvas.width = width;
      canvas.height = height;

      // Background
      if (themeId === "salon") {
        const grad = ctx.createLinearGradient(0, 0, width, height);
        grad.addColorStop(0, primaryColor + "cc");
        grad.addColorStop(0.55, primaryColor);
        grad.addColorStop(1, secondaryColor + "99");
        ctx.fillStyle = grad;
      } else if (themeId === "dark") {
        const grad = ctx.createLinearGradient(0, 0, width, height);
        grad.addColorStop(0, "#0a0a0c");
        grad.addColorStop(0.5, "#12120f");
        grad.addColorStop(1, "#1a1810");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);
        // Gold bars
        const barGrad = ctx.createLinearGradient(80, 0, width - 80, 0);
        barGrad.addColorStop(0, "rgba(251,191,36,0)");
        barGrad.addColorStop(0.5, "rgba(251,191,36,0.7)");
        barGrad.addColorStop(1, "rgba(251,191,36,0)");
        ctx.fillStyle = barGrad;
        ctx.fillRect(80, 28, width - 160, 2);
        ctx.fillRect(80, height - 30, width - 160, 2);
      } else if (themeId === "glow") {
        const grad = ctx.createLinearGradient(0, 0, width, height);
        grad.addColorStop(0, "#22408C");
        grad.addColorStop(0.5, "#4d2080");
        grad.addColorStop(1, "#98329A");
        ctx.fillStyle = grad;
      } else if (themeId === "minimal") {
        ctx.fillStyle = "#ffffff";
      } else if (themeId === "warm") {
        const grad = ctx.createLinearGradient(0, 0, width, height);
        grad.addColorStop(0, "#fdf8f4");
        grad.addColorStop(0.5, "#f7ece0");
        grad.addColorStop(1, "#e8d5c0");
        ctx.fillStyle = grad;
      }
      ctx.fillRect(0, 0, width, height);

      // Border
      ctx.strokeStyle =
        themeId === "dark"
          ? "#d97706"
          : themeId === "glow"
          ? "rgba(192,132,252,0.5)"
          : themeId === "warm"
          ? "#c8a882"
          : "#e2e8f0";
      ctx.lineWidth = 4 * scale;
      ctx.strokeRect(20 * scale, 20 * scale, width - 40 * scale, height - 40 * scale);

      // Text colors
      const isSalonDark = themeId === "salon" && !isLightHex(primaryColor);
      const textColor =
        themeId === "salon"
          ? salonInk
          : themeId === "dark"
          ? "#fef3c7"
          : themeId === "glow"
          ? "#ffffff"
          : themeId === "warm"
          ? "#2e1d19"
          : "#0f172a";
      const subColor =
        themeId === "salon"
          ? salonSubInk
          : themeId === "dark" || themeId === "glow"
          ? "rgba(255,255,255,0.70)"
          : themeId === "warm"
          ? "rgba(107,58,42,0.85)"
          : "#64748b";
      const accentFill =
        themeId === "dark"
          ? "#fbbf24"
          : themeId === "glow"
          ? "#c084fc"
          : themeId === "warm"
          ? "#b05a3e"
          : isSalonDark
          ? secondaryColor
          : primaryColor;

      // QR Image
      const qrImg = new Image();
      qrImg.src = qrCodeDataUrl;
      await new Promise<void>((resolve) => {
        qrImg.onload = () => resolve();
        qrImg.onerror = () => resolve();
      });

      if (isPoster) {
        ctx.fillStyle = textColor;
        ctx.font = `bold ${48 * scale}px system-ui, -apple-system, sans-serif`;
        ctx.textAlign = "center";
        ctx.fillText(salonName, width / 2, 120 * scale);

        ctx.fillStyle = subColor;
        ctx.font = `500 ${22 * scale}px system-ui, -apple-system, sans-serif`;
        ctx.fillText(tagline, width / 2, 165 * scale);

        const qrSize = 360 * scale;
        const qrX = (width - qrSize) / 2;
        const qrY = 240 * scale;

        ctx.fillStyle = "#ffffff";
        ctx.shadowColor = "rgba(0,0,0,0.12)";
        ctx.shadowBlur = 24 * scale;
        ctx.beginPath();
        ctx.roundRect(qrX - 16 * scale, qrY - 16 * scale, qrSize + 32 * scale, qrSize + 32 * scale, 24 * scale);
        ctx.fill();
        ctx.shadowBlur = 0;
        if (qrImg.width) ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

        ctx.fillStyle = textColor;
        ctx.font = `600 ${20 * scale}px system-ui, -apple-system, sans-serif`;
        ctx.fillText("✦  Reserva 24/7 sin esperas  ✦", width / 2, 710 * scale);

        ctx.fillStyle = accentFill;
        ctx.font = `bold ${22 * scale}px system-ui, -apple-system, sans-serif`;
        ctx.fillText(`glowapp.app/${tenantSlug}`, width / 2, 860 * scale);
      } else if (isMirror) {
        ctx.fillStyle = textColor;
        ctx.font = `bold ${40 * scale}px system-ui, -apple-system, sans-serif`;
        ctx.textAlign = "center";
        ctx.fillText(salonName, width / 2, 90 * scale);

        ctx.fillStyle = subColor;
        ctx.font = `500 ${18 * scale}px system-ui, -apple-system, sans-serif`;
        ctx.fillText(tagline, width / 2, 130 * scale);

        const qrSize = 320 * scale;
        const qrX = (width - qrSize) / 2;
        const qrY = 170 * scale;

        ctx.fillStyle = "#ffffff";
        ctx.shadowColor = "rgba(0,0,0,0.1)";
        ctx.shadowBlur = 18 * scale;
        ctx.beginPath();
        ctx.roundRect(qrX - 12 * scale, qrY - 12 * scale, qrSize + 24 * scale, qrSize + 24 * scale, 18 * scale);
        ctx.fill();
        ctx.shadowBlur = 0;
        if (qrImg.width) ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

        ctx.fillStyle = accentFill;
        ctx.font = `bold ${20 * scale}px system-ui, -apple-system, sans-serif`;
        ctx.fillText(`glowapp.app/${tenantSlug}`, width / 2, 560 * scale);
      } else {
        ctx.textAlign = "left";
        ctx.fillStyle = textColor;
        ctx.font = `bold ${42 * scale}px system-ui, -apple-system, sans-serif`;
        ctx.fillText(salonName, 60 * scale, 110 * scale);

        ctx.fillStyle = subColor;
        ctx.font = `500 ${20 * scale}px system-ui, -apple-system, sans-serif`;
        ctx.fillText(tagline, 60 * scale, 155 * scale);

        ctx.fillStyle = accentFill;
        ctx.font = `600 ${17 * scale}px system-ui, -apple-system, sans-serif`;
        ctx.fillText("✓  Citas en tiempo real", 60 * scale, 230 * scale);
        ctx.fillText("✓  Precios y servicios actualizados", 60 * scale, 265 * scale);
        ctx.fillText("✓  Recordatorio automático por WhatsApp", 60 * scale, 300 * scale);

        ctx.font = `bold ${20 * scale}px system-ui, -apple-system, sans-serif`;
        ctx.fillText(`glowapp.app/${tenantSlug}`, 60 * scale, 380 * scale);

        const qrSize = 300 * scale;
        const qrX = width - qrSize - 60 * scale;
        const qrY = (height - qrSize) / 2;

        ctx.fillStyle = "#ffffff";
        ctx.shadowColor = "rgba(0,0,0,0.12)";
        ctx.shadowBlur = 20 * scale;
        ctx.beginPath();
        ctx.roundRect(qrX - 14 * scale, qrY - 14 * scale, qrSize + 28 * scale, qrSize + 28 * scale, 20 * scale);
        ctx.fill();
        ctx.shadowBlur = 0;
        if (qrImg.width) ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);
      }

      const link = document.createElement("a");
      link.download = `QR-${salonName.replace(/\s+/g, "_")}-${format}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      toast({ title: "Tarjeta descargada en alta resolución ✓" });
    } catch (e) {
      console.error(e);
      toast({ title: "Error al generar la imagen", variant: "destructive" });
    } finally {
      setDownloading(false);
    }
  };

  // URL chip + "Escanea aquí" label: always readable on any theme card bg
  const urlChipStyle =
    themeId === "salon"
      ? {
          background: isLightHex(primaryColor)
            ? "rgba(0,0,0,0.12)"
            : "rgba(255,255,255,0.18)",
          color: salonInk,
        }
      : themeId === "dark"
      ? { background: "rgba(251,191,36,0.15)", color: "#fde68a" }
      : themeId === "glow"
      ? { background: "rgba(255,255,255,0.14)", color: "#e0c8f0" }
      : themeId === "warm"
      ? { background: "rgba(62,39,35,0.12)", color: "#3e2723" }
      : { background: "rgba(0,0,0,0.07)", color: "#18181b" };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-16">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-card border border-border/70 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold tracking-tight text-foreground m-0">
              Tarjetas y Cartelería QR
            </h2>
            <Badge variant="secondary" className="text-[11px] font-semibold bg-primary/10 text-primary border-none">
              Impresión Pro
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Genera tarjetas de mostrador, escaparates y stickers con tu código de reserva directa
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopy}
            className="glow-btn glow-btn--sm glow-btn--ghost"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? "Copiado" : "Copiar Enlace"}</span>
          </button>
          <button
            type="button"
            onClick={handleShareWhatsApp}
            className="glow-btn glow-btn--sm glow-btn--outline text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/10"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>WhatsApp</span>
          </button>
        </div>
      </div>

      {/* ── Studio ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Col: Controls */}
        <div className="lg:col-span-5 space-y-5">
          {/* Format */}
          <div className="p-4 rounded-2xl bg-card border border-border/80 shadow-xs space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
              1. Formato de Cartel
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  { id: "counter", label: "Mostrador", desc: "Horizontal" },
                  { id: "poster", label: "Escaparate", desc: "Cartel A4" },
                  { id: "mirror", label: "Sticker", desc: "Espejo 1:1" },
                ] as const
              ).map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFormat(f.id)}
                  className={cn(
                    "p-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center",
                    format === f.id
                      ? "bg-primary/10 border-primary font-bold text-primary shadow-xs"
                      : "bg-muted/30 border-border/60 hover:bg-muted/60 text-foreground"
                  )}
                >
                  <span className="text-xs font-bold leading-tight">{f.label}</span>
                  <span className="text-[10px] text-muted-foreground mt-0.5">{f.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Theme */}
          <div className="p-4 rounded-2xl bg-card border border-border/80 shadow-xs space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
              2. Estilo y Paleta
            </label>
            <div className="space-y-2">
              {Object.values(themes).map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setThemeId(t.id)}
                  className={cn(
                    "w-full flex items-center justify-between p-2.5 rounded-xl border transition-all text-left cursor-pointer",
                    themeId === t.id
                      ? "bg-primary/10 border-primary shadow-xs"
                      : "bg-muted/20 border-border/50 hover:bg-muted/50"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="w-4 h-4 rounded-full border border-black/10 shrink-0 shadow-xs"
                      style={{ backgroundColor: t.accentColor }}
                    />
                    <div>
                      <div className="text-xs font-bold text-foreground">{t.name}</div>
                      <div className="text-[11px] text-muted-foreground">{t.description}</div>
                    </div>
                  </div>
                  {themeId === t.id && (
                    <span className="text-xs font-bold text-primary mr-1">✓</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Tagline & Options */}
          <div className="p-4 rounded-2xl bg-card border border-border/80 shadow-xs space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
              3. Mensaje y Opciones
            </label>
            <div className="space-y-2">
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="Eslogan de la tarjeta"
                className="w-full px-3 py-2 rounded-xl bg-background border border-border text-xs text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/40"
              />
              <div className="flex flex-wrap gap-1.5 pt-1">
                {TAGLINE_PRESETS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setTagline(p)}
                    className="text-[10px] px-2 py-1 rounded-lg bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-border/40 space-y-2">
              <label className="flex items-center justify-between text-xs cursor-pointer">
                <span className="text-foreground font-medium">Mostrar logo</span>
                <input
                  type="checkbox"
                  checked={showLogo}
                  onChange={(e) => setShowLogo(e.target.checked)}
                  className="rounded border-border text-primary h-4 w-4"
                />
              </label>
              <label className="flex items-center justify-between text-xs cursor-pointer">
                <span className="text-foreground font-medium">Mostrar enlace web</span>
                <input
                  type="checkbox"
                  checked={showUrl}
                  onChange={(e) => setShowUrl(e.target.checked)}
                  className="rounded border-border text-primary h-4 w-4"
                />
              </label>
            </div>
          </div>

          <p className="text-[11px] text-muted-foreground px-1">
            <span className="font-semibold text-primary">✓ QR con tracking activo</span>
            {" "}— el código registra escaneos y activa el banner de bienvenida en la web del salón.
          </p>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={handleDownload}
              disabled={downloading}
              className="glow-btn glow-btn--primary w-full justify-center py-2.5 shadow-md cursor-pointer disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{downloading ? "Generando..." : "Descargar PNG"}</span>
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="glow-btn glow-btn--outline w-full justify-center py-2.5 cursor-pointer hover:bg-muted"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir</span>
            </button>
          </div>
        </div>

        {/* Right Col: Live Preview */}
        <div className="lg:col-span-7 flex flex-col items-center">
          <div className="w-full text-center mb-3">
            <span className="text-xs font-semibold text-muted-foreground flex items-center justify-center gap-1.5">
              <Eye className="w-3.5 h-3.5" />
              Previsualización en tiempo real
            </span>
          </div>

          <div className="w-full max-w-lg p-6 sm:p-8 rounded-3xl bg-muted/20 border border-border/50 flex items-center justify-center">
            <div
              ref={cardRef}
              className={cn(
                "relative transition-all duration-300 rounded-3xl p-6 sm:p-8 border shadow-[0_24px_50px_-12px_rgba(0,0,0,0.28)] flex flex-col justify-between overflow-hidden",
                themeId !== "salon" && currentTheme.bgClass,
                currentTheme.borderClass,
                format === "counter" && "w-full aspect-[16/10]",
                format === "poster" && "w-[85%] aspect-[1/1.414]",
                format === "mirror" && "w-[90%] aspect-square"
              )}
              style={salonBgStyle}
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/10 pointer-events-none" />

              {format === "counter" && (
                <div className="relative z-10 h-full flex items-center justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-2.5">
                      {showLogo && salonLogo ? (
                        <img
                          src={salonLogo}
                          alt={salonName}
                          className="w-11 h-11 rounded-xl object-cover border border-white/20 shadow-xs shrink-0"
                        />
                      ) : (
                        <div
                          className="w-11 h-11 rounded-xl flex items-center justify-center font-bold text-white text-base shadow-xs shrink-0"
                          style={{
                            backgroundColor:
                              themeId === "salon" ? secondaryColor : currentTheme.accentColor,
                          }}
                        >
                          {salonName.charAt(0)}
                        </div>
                      )}
                      <div>
                        <h4
                          className={cn(
                            "text-base font-black tracking-tight leading-tight m-0",
                            themeId !== "salon" && currentTheme.textClass
                          )}
                          style={themeId === "salon" ? { color: salonInk } : undefined}
                        >
                          {salonName}
                        </h4>
                        <p
                          className={cn(
                            "text-xs leading-snug m-0",
                            themeId !== "salon" && currentTheme.subClass
                          )}
                          style={themeId === "salon" ? { color: salonSubInk } : undefined}
                        >
                          {tagline}
                        </p>
                      </div>
                    </div>

                    <div
                      className={cn(
                        "text-[11px] space-y-1 pt-1",
                        themeId !== "salon" && currentTheme.subClass
                      )}
                      style={themeId === "salon" ? { color: salonSubInk } : undefined}
                    >
                      <div className="flex items-center gap-1.5 font-semibold">
                        <Sparkles
                          className="w-3 h-3 shrink-0"
                          style={{ color: currentTheme.onCardIcon }}
                        />
                        <span>Reserva tu cita 24/7 sin llamadas</span>
                      </div>
                      <div className="flex items-center gap-1.5 font-semibold">
                        <Sparkles
                          className="w-3 h-3 shrink-0"
                          style={{ color: currentTheme.onCardIcon }}
                        />
                        <span>Confirmación instantánea</span>
                      </div>
                    </div>

                    {showUrl && (
                      <div className="pt-2">
                        <span
                          className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg inline-block"
                          style={urlChipStyle}
                        >
                          glowapp.app/{tenantSlug}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="shrink-0 flex flex-col items-center">
                    <div className={cn("p-3 rounded-2xl shadow-md border border-black/5", currentTheme.qrBgClass)}>
                      {qrCodeDataUrl ? (
                        <img src={qrCodeDataUrl} alt="QR de Reserva" className="w-28 h-28 object-contain" />
                      ) : (
                        <div className="w-28 h-28 bg-muted animate-pulse rounded-xl" />
                      )}
                    </div>
                    <span
                      className="text-[10px] font-bold text-center mt-1.5 tracking-wider uppercase"
                      style={{ color: currentTheme.onCardLabel }}
                    >
                      Escanea aquí
                    </span>
                  </div>
                </div>
              )}

              {format === "poster" && (
                <div className="relative z-10 h-full flex flex-col justify-between items-center text-center p-2">
                  <div className="space-y-2">
                    {showLogo && salonLogo && (
                      <img
                        src={salonLogo}
                        alt={salonName}
                        className="w-14 h-14 rounded-2xl object-cover border border-white/20 shadow-xs mx-auto"
                      />
                    )}
                    <h3
                      className={cn(
                        "text-xl font-black tracking-tight leading-tight m-0",
                        themeId !== "salon" && currentTheme.textClass
                      )}
                      style={themeId === "salon" ? { color: salonInk } : undefined}
                    >
                      {salonName}
                    </h3>
                    <p
                      className={cn(
                        "text-xs font-medium max-w-xs mx-auto leading-snug m-0",
                        themeId !== "salon" && currentTheme.subClass
                      )}
                      style={themeId === "salon" ? { color: salonSubInk } : undefined}
                    >
                      {tagline}
                    </p>
                  </div>

                  <div className="my-auto py-2">
                    <div className={cn("p-4 rounded-3xl shadow-xl border border-black/5 inline-block mx-auto", currentTheme.qrBgClass)}>
                      {qrCodeDataUrl ? (
                        <img src={qrCodeDataUrl} alt="QR de Reserva" className="w-40 h-40 object-contain" />
                      ) : (
                        <div className="w-40 h-40 bg-muted animate-pulse rounded-2xl" />
                      )}
                    </div>
                    <div
                      className="mt-2 text-xs font-black tracking-wider uppercase"
                      style={{ color: currentTheme.onCardLabel }}
                    >
                      Escanea con tu cámara móvil
                    </div>
                  </div>

                  <div className="space-y-2 w-full">
                    {showPerks && (
                      <p
                        className={cn(
                          "text-[11px] font-semibold m-0 leading-tight",
                          themeId !== "salon" && currentTheme.subClass
                        )}
                        style={themeId === "salon" ? { color: salonSubInk } : undefined}
                      >
                        ✦ Sin esperas · Horarios en directo · Tu estilista favorito ✦
                      </p>
                    )}
                    {showUrl && (
                      <div>
                        <span
                          className="font-mono text-xs font-black tracking-wider px-2 py-0.5 rounded-md inline-block"
                          style={urlChipStyle}
                        >
                          glowapp.app/{tenantSlug}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {format === "mirror" && (
                <div className="relative z-10 h-full flex flex-col justify-between items-center text-center p-2">
                  <div className="space-y-1">
                    <h4
                      className={cn(
                        "text-base font-black tracking-tight leading-tight m-0",
                        themeId !== "salon" && currentTheme.textClass
                      )}
                      style={themeId === "salon" ? { color: salonInk } : undefined}
                    >
                      {salonName}
                    </h4>
                    <p
                      className={cn(
                        "text-xs font-medium leading-snug m-0",
                        themeId !== "salon" && currentTheme.subClass
                      )}
                      style={themeId === "salon" ? { color: salonSubInk } : undefined}
                    >
                      {tagline}
                    </p>
                  </div>

                  <div className="my-auto">
                    <div className={cn("p-3 rounded-2xl shadow-lg border border-black/5 inline-block", currentTheme.qrBgClass)}>
                      {qrCodeDataUrl ? (
                        <img src={qrCodeDataUrl} alt="QR de Reserva" className="w-36 h-36 object-contain" />
                      ) : (
                        <div className="w-36 h-36 bg-muted animate-pulse rounded-xl" />
                      )}
                    </div>
                  </div>

                  <div>
                    <span
                      className="font-mono text-[11px] font-bold px-2 py-0.5 rounded-lg inline-block"
                      style={urlChipStyle}
                    >
                      glowapp.app/{tenantSlug}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
