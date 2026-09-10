import { useState, useRef, useEffect } from "react";
import QRCode from "qrcode";
import { toPng } from "html-to-image";
import {
  Download,
  Share2,
  Printer,
  Copy,
  Check,
  Sparkles,
  Eye,
  Scissors,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

interface QRCardGeneratorProps {
  tenantId: string;
  tenantSlug: string;
}

export type CardFormat = "counter" | "poster" | "mirror" | "qr_only";
export type PaperMode = "a4_marks" | "exact";

export interface FormatMeta {
  id: CardFormat;
  label: string;
  sublabel: string;
  dimensions: string;
  description: string;
  widthMm: number;
  heightMm: number;
  aspectClass: string;
}

export const FORMAT_CONFIG: Record<CardFormat, FormatMeta> = {
  counter: {
    id: "counter",
    label: "Tarjeta",
    sublabel: "Mostrador",
    dimensions: "15 × 10 cm",
    description: "Tarjeta horizontal para mostrador o recepción",
    widthMm: 150,
    heightMm: 100,
    aspectClass: "w-full aspect-[15/10]",
  },
  poster: {
    id: "poster",
    label: "Folleto",
    sublabel: "Cartel A4",
    dimensions: "21 × 29,7 cm",
    description: "Cartel / folleto vertical DIN A4 para escaparate o pared",
    widthMm: 210,
    heightMm: 297,
    aspectClass: "w-[85%] aspect-[1/1.414]",
  },
  mirror: {
    id: "mirror",
    label: "Sticker QR",
    sublabel: "Espejo / Mesa",
    dimensions: "12 × 12 cm",
    description: "Adhesivo cuadrado para espejos, tocadores o mesas",
    widthMm: 120,
    heightMm: 120,
    aspectClass: "w-[90%] aspect-square",
  },
  qr_only: {
    id: "qr_only",
    label: "Solo QR",
    sublabel: "Pegatina",
    dimensions: "8 × 8 cm",
    description: "Pegatina compacta con QR, logo y enlace de reserva",
    widthMm: 80,
    heightMm: 80,
    aspectClass: "w-[80%] aspect-square",
  },
};

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
  onCardLabel: string;
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

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function QRCardGenerator({ tenantId, tenantSlug }: QRCardGeneratorProps) {
  const { toast } = useToast();
  const [format, setFormat] = useState<CardFormat>("counter");
  const [paperMode, setPaperMode] = useState<PaperMode>("a4_marks");
  const [themeId, setThemeId] = useState<string>("salon");
  const [tagline, setTagline] = useState<string>("Reserva tu cita online en 1 minuto");
  const [showLogo, setShowLogo] = useState<boolean>(true);
  const [showUrl, setShowUrl] = useState<boolean>(true);
  const [showPerks, setShowPerks] = useState<boolean>(true);

  const [copied, setCopied] = useState<boolean>(false);
  const [downloading, setDownloading] = useState<boolean>(false);
  const [isPrinting, setIsPrinting] = useState<boolean>(false);

  const [salonName, setSalonName] = useState<string>("Salón de Belleza");
  const [salonLogo, setSalonLogo] = useState<string | null>(null);
  const [primaryColor, setPrimaryColor] = useState<string>("#7c3aed");
  const [secondaryColor, setSecondaryColor] = useState<string>("#ec4899");

  // QR data URL
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

  // Generate QR from tracking URL at high resolution (1000px)
  useEffect(() => {
    QRCode.toDataURL(qrTrackingUrl, {
      width: 1000,
      margin: 1,
      color: { dark: "#000000", light: "#ffffff" },
      errorCorrectionLevel: "H",
    })
      .then((url) => setQrCodeDataUrl(url))
      .catch((err) => console.error("Error generating QR:", err));
  }, [qrTrackingUrl]);

  // Determine readable ink for "salon" theme
  const salonInk = isLightHex(primaryColor) ? "#111827" : "#ffffff";
  const salonSubInk = isLightHex(primaryColor) ? "rgba(0,0,0,0.60)" : "rgba(255,255,255,0.75)";
  const salonLabelInk = isLightHex(primaryColor)
    ? "rgba(0,0,0,0.75)"
    : "rgba(255,255,255,0.85)";

  // Themes
  const themes: Record<string, CardTheme> = {
    salon: {
      id: "salon",
      name: "Marca del Salón",
      description: "Colores corporativos personalizados",
      bgClass: "",
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
      subClass: "text-white/75",
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
  const currentFormat = FORMAT_CONFIG[format];

  // Inline bg style for "salon" theme
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

  // Build isolated HTML document for printing ONLY the selected format with exact mm dimensions
  const buildPrintHTML = (): string => {
    const isPoster = format === "poster";
    const useA4Sheet = isPoster || paperMode === "a4_marks";
    const widthMm = currentFormat.widthMm;
    const heightMm = currentFormat.heightMm;

    // Theme color resolution
    let cardBgCss = "";
    let textColor = "#111827";
    let subColor = "rgba(0,0,0,0.65)";
    let borderCss = "1px solid rgba(0,0,0,0.08)";
    let qrBgColor = "#ffffff";
    let chipBg = "rgba(0,0,0,0.08)";
    let chipColor = "#111827";
    let labelColor = "rgba(0,0,0,0.75)";
    let avatarBg = primaryColor;

    if (themeId === "salon") {
      cardBgCss = `background: linear-gradient(135deg, ${primaryColor}cc 0%, ${primaryColor} 55%, ${secondaryColor}99 100%);`;
      textColor = salonInk;
      subColor = salonSubInk;
      borderCss = `1px solid ${isLightHex(primaryColor) ? "rgba(0,0,0,0.12)" : "rgba(255,255,255,0.18)"}`;
      qrBgColor = "#ffffff";
      chipBg = isLightHex(primaryColor) ? "rgba(0,0,0,0.12)" : "rgba(255,255,255,0.22)";
      chipColor = salonInk;
      labelColor = salonLabelInk;
      avatarBg = secondaryColor;
    } else if (themeId === "glow") {
      cardBgCss = "background: linear-gradient(135deg, #22408C 0%, #4d2080 50%, #98329A 100%);";
      textColor = "#ffffff";
      subColor = "rgba(255,255,255,0.80)";
      borderCss = "1px solid rgba(192,132,252,0.35);";
      qrBgColor = "#ffffff";
      chipBg = "rgba(255,255,255,0.18)";
      chipColor = "#f3e8ff";
      labelColor = "rgba(255,255,255,0.90)";
      avatarBg = "#c084fc";
    } else if (themeId === "dark") {
      cardBgCss = "background: linear-gradient(135deg, #0a0a0c 0%, #12120f 50%, #1a1810 100%);";
      textColor = "#fef3c7";
      subColor = "rgba(253,230,138,0.80)";
      borderCss = "2.5px solid rgba(245,158,11,0.55);";
      qrBgColor = "#fefce8";
      chipBg = "rgba(251,191,36,0.18)";
      chipColor = "#fde68a";
      labelColor = "rgba(253,230,138,0.95)";
      avatarBg = "#fbbf24";
    } else if (themeId === "minimal") {
      cardBgCss = "background: #ffffff;";
      textColor = "#09090b";
      subColor = "#71717a";
      borderCss = "1.5px solid #e4e4e7;";
      qrBgColor = "#fafafa";
      chipBg = "#f4f4f5";
      chipColor = "#18181b";
      labelColor = "#52525b";
      avatarBg = "#18181b";
    } else if (themeId === "warm") {
      cardBgCss = "background: linear-gradient(135deg, #fdf8f4 0%, #f7ece0 50%, #e8d5c0 100%);";
      textColor = "#2e1d19";
      subColor = "rgba(107,58,42,0.85)";
      borderCss = "1.8px solid #c8a882;";
      qrBgColor = "#ffffff";
      chipBg = "rgba(62,39,35,0.12)";
      chipColor = "#3e2723";
      labelColor = "rgba(62,39,35,0.80)";
      avatarBg = "#b05a3e";
    }

    // Individual format inner HTML
    let cardContentHtml = "";

    if (format === "counter") {
      // 150mm x 100mm horizontal card
      cardContentHtml = `
        <div class="card-inner card-inner-counter">
          <div class="col-left">
            <div class="brand-row">
              ${
                showLogo && salonLogo
                  ? `<img src="${escapeHtml(salonLogo)}" class="brand-logo" alt="${escapeHtml(salonName)}">`
                  : `<div class="brand-avatar" style="background:${avatarBg}; color:#fff;">${escapeHtml(salonName.charAt(0))}</div>`
              }
              <div class="brand-text">
                <div class="brand-title">${escapeHtml(salonName)}</div>
                <div class="brand-tagline">${escapeHtml(tagline)}</div>
              </div>
            </div>

            ${
              showPerks
                ? `
              <div class="perks-block">
                <div class="perk-row"><span class="perk-star">✦</span> Reserva tu cita 24/7 sin llamadas</div>
                <div class="perk-row"><span class="perk-star">✦</span> Confirmación instantánea en tu móvil</div>
              </div>
            `
                : ""
            }

            ${
              showUrl
                ? `
              <div class="url-chip">
                glowapp.app/${escapeHtml(tenantSlug)}
              </div>
            `
                : ""
            }
          </div>

          <div class="col-right">
            <div class="qr-box" style="background:${qrBgColor};">
              ${
                qrCodeDataUrl
                  ? `<img src="${qrCodeDataUrl}" class="qr-img" alt="QR Reserva">`
                  : ""
              }
            </div>
            <div class="qr-caption" style="color:${labelColor};">Escanea para reservar</div>
          </div>
        </div>
      `;
    } else if (format === "poster") {
      // 210mm x 297mm vertical A4 poster
      cardContentHtml = `
        <div class="card-inner card-inner-poster">
          <div class="poster-top">
            ${
              showLogo && salonLogo
                ? `<img src="${escapeHtml(salonLogo)}" class="poster-logo" alt="${escapeHtml(salonName)}">`
                : `<div class="poster-avatar" style="background:${avatarBg}; color:#fff;">${escapeHtml(salonName.charAt(0))}</div>`
            }
            <div class="poster-title">${escapeHtml(salonName)}</div>
            <div class="poster-tagline">${escapeHtml(tagline)}</div>
          </div>

          <div class="poster-center">
            <div class="poster-qr-box" style="background:${qrBgColor};">
              ${
                qrCodeDataUrl
                  ? `<img src="${qrCodeDataUrl}" class="poster-qr-img" alt="QR Reserva">`
                  : ""
              }
            </div>
            <div class="poster-qr-caption" style="color:${labelColor};">
              ✦ Escanea con la cámara de tu móvil ✦
            </div>
          </div>

          <div class="poster-bottom">
            ${
              showPerks
                ? `
              <div class="poster-perks">
                Sin esperas · Horarios en directo · Tu estilista favorito
              </div>
            `
                : ""
            }
            ${
              showUrl
                ? `
              <div class="poster-url-chip">
                glowapp.app/${escapeHtml(tenantSlug)}
              </div>
            `
                : ""
            }
            <div class="poster-footer-note">
              Reserva online oficial · Sistema powered by GlowApp
            </div>
          </div>
        </div>
      `;
    } else if (format === "mirror") {
      // 120mm x 120mm square sticker
      cardContentHtml = `
        <div class="card-inner card-inner-mirror">
          <div class="mirror-top">
            <div class="mirror-title">${escapeHtml(salonName)}</div>
            <div class="mirror-tagline">${escapeHtml(tagline)}</div>
          </div>

          <div class="mirror-center">
            <div class="mirror-qr-box" style="background:${qrBgColor};">
              ${
                qrCodeDataUrl
                  ? `<img src="${qrCodeDataUrl}" class="mirror-qr-img" alt="QR Reserva">`
                  : ""
              }
            </div>
            <div class="mirror-qr-caption" style="color:${labelColor};">Escanea aquí</div>
          </div>

          <div class="mirror-bottom">
            ${
              showUrl
                ? `
              <div class="mirror-url-chip">
                glowapp.app/${escapeHtml(tenantSlug)}
              </div>
            `
                : ""
            }
          </div>
        </div>
      `;
    } else {
      // 80mm x 80mm compact QR sticker
      cardContentHtml = `
        <div class="card-inner card-inner-qr-only">
          <div class="qr-only-top">
            <div class="qr-only-title">${escapeHtml(salonName)}</div>
          </div>

          <div class="qr-only-center">
            <div class="qr-only-box" style="background:${qrBgColor};">
              ${
                qrCodeDataUrl
                  ? `<img src="${qrCodeDataUrl}" class="qr-only-img" alt="QR Reserva">`
                  : ""
              }
            </div>
          </div>

          <div class="qr-only-bottom">
            <div class="qr-only-url-chip">
              glowapp.app/${escapeHtml(tenantSlug)}
            </div>
          </div>
        </div>
      `;
    }

    const cardOuterStyle = `
      width: ${widthMm}mm;
      height: ${heightMm}mm;
      ${cardBgCss}
      color: ${textColor};
      border: ${borderCss};
      border-radius: ${isPoster ? "0mm" : format === "counter" ? "5mm" : "4mm"};
      box-sizing: border-box;
      position: relative;
      overflow: hidden;
    `;

    // Page sizing and crop marks
    const pageSizeRule = useA4Sheet
      ? "size: A4 portrait; margin: 0;"
      : `size: ${widthMm}mm ${heightMm}mm ${widthMm > heightMm ? "landscape" : "portrait"}; margin: 0;`;

    let bodyContent = "";

    if (useA4Sheet && !isPoster) {
      bodyContent = `
        <div class="a4-container">
          <div class="crop-frame" style="width: ${widthMm}mm; height: ${heightMm}mm;">
            <div class="crop-mark crop-tl"></div>
            <div class="crop-mark crop-tr"></div>
            <div class="crop-mark crop-bl"></div>
            <div class="crop-mark crop-br"></div>
            
            <div style="${cardOuterStyle}">
              ${cardContentHtml}
            </div>

            <div class="crop-legend">
              ✂ Líneas de corte · ${escapeHtml(currentFormat.label)} (${escapeHtml(currentFormat.dimensions)}) · Tamaño real 1:1 · GlowApp
            </div>
          </div>
        </div>
      `;
    } else {
      bodyContent = `
        <div class="direct-container" style="width:${widthMm}mm; height:${heightMm}mm;">
          <div style="${cardOuterStyle}">
            ${cardContentHtml}
          </div>
        </div>
      `;
    }

    return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(salonName)} - ${escapeHtml(currentFormat.label)} QR</title>
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      color-adjust: exact !important;
    }
    @page {
      ${pageSizeRule}
    }
    html, body {
      margin: 0;
      padding: 0;
      background: #ffffff;
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      -webkit-font-smoothing: antialiased;
    }
    .a4-container {
      width: 210mm;
      height: 297mm;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      position: relative;
      background: #ffffff;
    }
    .crop-frame {
      position: relative;
    }
    .crop-mark {
      position: absolute;
      width: 8mm;
      height: 8mm;
      border-color: #64748b;
      border-style: solid;
      pointer-events: none;
    }
    .crop-tl { top: -4mm; left: -4mm; border-width: 0.35mm 0 0 0.35mm; }
    .crop-tr { top: -4mm; right: -4mm; border-width: 0.35mm 0.35mm 0 0; }
    .crop-bl { bottom: -4mm; left: -4mm; border-width: 0 0 0.35mm 0.35mm; }
    .crop-br { bottom: -4mm; right: -4mm; border-width: 0 0.35mm 0.35mm; }
    .crop-legend {
      position: absolute;
      bottom: -7mm;
      left: 0;
      width: 100%;
      text-align: center;
      font-size: 7.5pt;
      color: #64748b;
      font-weight: 600;
      letter-spacing: 0.2px;
    }
    .direct-container {
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0;
      padding: 0;
    }

    /* Common Card Inner Layouts */
    .card-inner {
      width: 100%;
      height: 100%;
      box-sizing: border-box;
      position: relative;
    }

    /* Counter: 150x100mm */
    .card-inner-counter {
      padding: 7mm 8mm;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 5mm;
    }
    .card-inner-counter .col-left {
      flex: 1;
      height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .brand-row {
      display: flex;
      align-items: center;
      gap: 3mm;
    }
    .brand-logo {
      width: 12mm;
      height: 12mm;
      border-radius: 3mm;
      object-fit: cover;
      box-shadow: 0 0.5mm 1.5mm rgba(0,0,0,0.15);
      border: 0.3mm solid rgba(255,255,255,0.4);
    }
    .brand-avatar {
      width: 12mm;
      height: 12mm;
      border-radius: 3mm;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      font-size: 14pt;
    }
    .brand-title {
      font-size: 15pt;
      font-weight: 900;
      letter-spacing: -0.3px;
      line-height: 1.15;
    }
    .brand-tagline {
      font-size: 8.5pt;
      font-weight: 500;
      line-height: 1.25;
      color: ${subColor};
      margin-top: 0.8mm;
    }
    .perks-block {
      font-size: 8pt;
      line-height: 1.45;
      font-weight: 600;
      color: ${subColor};
      margin: 2mm 0;
    }
    .perk-star {
      font-size: 7pt;
      margin-right: 1mm;
      color: ${textColor};
    }
    .url-chip {
      display: inline-block;
      font-size: 8.5pt;
      font-family: monospace;
      font-weight: 800;
      padding: 1.5mm 3.5mm;
      border-radius: 2mm;
      background: ${chipBg};
      color: ${chipColor};
      letter-spacing: 0.3px;
    }
    .card-inner-counter .col-right {
      width: 44mm;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
    }
    .qr-box {
      padding: 2.5mm;
      border-radius: 3.5mm;
      box-shadow: 0 1.5mm 4mm rgba(0,0,0,0.16);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .qr-img {
      width: 38mm;
      height: 38mm;
      display: block;
      image-rendering: -webkit-optimize-contrast;
    }
    .qr-caption {
      font-size: 7pt;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.6px;
      margin-top: 2mm;
    }

    /* Poster: 210x297mm A4 */
    .card-inner-poster {
      padding: 16mm 14mm;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      align-items: center;
      text-align: center;
    }
    .poster-logo {
      width: 24mm;
      height: 24mm;
      border-radius: 5.5mm;
      object-fit: cover;
      margin: 0 auto 3.5mm;
      border: 0.4mm solid rgba(255,255,255,0.4);
      box-shadow: 0 1.5mm 3mm rgba(0,0,0,0.15);
    }
    .poster-avatar {
      width: 24mm;
      height: 24mm;
      border-radius: 5.5mm;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 26pt;
      font-weight: 900;
      margin: 0 auto 3.5mm;
    }
    .poster-title {
      font-size: 27pt;
      font-weight: 900;
      letter-spacing: -0.6px;
      line-height: 1.1;
    }
    .poster-tagline {
      font-size: 12.5pt;
      font-weight: 500;
      color: ${subColor};
      margin-top: 2.5mm;
      max-width: 140mm;
      margin-left: auto;
      margin-right: auto;
      line-height: 1.35;
    }
    .poster-qr-box {
      padding: 5.5mm;
      border-radius: 6mm;
      box-shadow: 0 3mm 8mm rgba(0,0,0,0.18);
      display: inline-block;
      margin: auto 0;
    }
    .poster-qr-img {
      width: 86mm;
      height: 86mm;
      display: block;
      image-rendering: -webkit-optimize-contrast;
    }
    .poster-qr-caption {
      font-size: 10.5pt;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      margin-top: 3.5mm;
    }
    .poster-perks {
      font-size: 11pt;
      font-weight: 600;
      color: ${subColor};
      margin-bottom: 3.5mm;
      letter-spacing: 0.2px;
    }
    .poster-url-chip {
      display: inline-block;
      font-size: 12.5pt;
      font-family: monospace;
      font-weight: 800;
      padding: 2.5mm 6mm;
      border-radius: 3mm;
      background: ${chipBg};
      color: ${chipColor};
      letter-spacing: 0.5px;
    }
    .poster-footer-note {
      font-size: 8pt;
      color: ${subColor};
      margin-top: 3.5mm;
      letter-spacing: 0.3px;
    }

    /* Mirror: 120x120mm */
    .card-inner-mirror {
      padding: 7mm;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      align-items: center;
      text-align: center;
    }
    .mirror-title {
      font-size: 15pt;
      font-weight: 900;
      letter-spacing: -0.3px;
      line-height: 1.15;
    }
    .mirror-tagline {
      font-size: 8pt;
      font-weight: 500;
      color: ${subColor};
      margin-top: 1mm;
    }
    .mirror-qr-box {
      padding: 3mm;
      border-radius: 4mm;
      box-shadow: 0 1.5mm 4mm rgba(0,0,0,0.15);
      display: inline-block;
      margin: auto 0;
    }
    .mirror-qr-img {
      width: 48mm;
      height: 48mm;
      display: block;
      image-rendering: -webkit-optimize-contrast;
    }
    .mirror-qr-caption {
      font-size: 7.5pt;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-top: 1.8mm;
    }
    .mirror-url-chip {
      display: inline-block;
      font-size: 8.5pt;
      font-family: monospace;
      font-weight: 800;
      padding: 1.5mm 3.5mm;
      border-radius: 2mm;
      background: ${chipBg};
      color: ${chipColor};
    }

    /* QR Only: 80x80mm */
    .card-inner-qr-only {
      padding: 5mm;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      align-items: center;
      text-align: center;
    }
    .qr-only-title {
      font-size: 11pt;
      font-weight: 900;
      line-height: 1.1;
    }
    .qr-only-box {
      padding: 2mm;
      border-radius: 3mm;
      box-shadow: 0 1mm 3mm rgba(0,0,0,0.12);
      display: inline-block;
      margin: auto 0;
    }
    .qr-only-img {
      width: 42mm;
      height: 42mm;
      display: block;
      image-rendering: -webkit-optimize-contrast;
    }
    .qr-only-url-chip {
      display: inline-block;
      font-size: 7pt;
      font-family: monospace;
      font-weight: 800;
      padding: 1.2mm 2.5mm;
      border-radius: 1.5mm;
      background: ${chipBg};
      color: ${chipColor};
    }
  </style>
</head>
<body>
  ${bodyContent}
</body>
</html>`;
  };

  // Direct Print via isolated iframe to avoid printing the rest of the application
  const handlePrint = () => {
    if (!qrCodeDataUrl) {
      toast({
        title: "Generando código QR...",
        description: "Espera un segundo mientras se genera el código.",
      });
      return;
    }

    setIsPrinting(true);
    toast({
      title: "Preparando impresión",
      description: `Imprimiendo ${currentFormat.label} (${currentFormat.dimensions})...`,
    });

    try {
      const printHtml = buildPrintHTML();

      // Look for or create our dedicated print frame
      let iframe = document.getElementById("glow-qr-print-frame") as HTMLIFrameElement | null;
      if (iframe) {
        iframe.remove();
      }

      iframe = document.createElement("iframe");
      iframe.id = "glow-qr-print-frame";
      iframe.style.position = "fixed";
      iframe.style.right = "0";
      iframe.style.bottom = "0";
      iframe.style.width = "0";
      iframe.style.height = "0";
      iframe.style.border = "none";
      iframe.style.opacity = "0";
      iframe.style.pointerEvents = "none";
      document.body.appendChild(iframe);

      const doc = iframe.contentWindow?.document;
      if (!doc) {
        // Fallback for popup window
        const win = window.open("", "_blank");
        if (win) {
          win.document.write(printHtml);
          win.document.close();
          win.onload = () => {
            setTimeout(() => {
              win.print();
              setIsPrinting(false);
            }, 300);
          };
        } else {
          setIsPrinting(false);
        }
        return;
      }

      doc.open();
      doc.write(printHtml);
      doc.close();

      const executePrint = () => {
        try {
          iframe?.contentWindow?.focus();
          iframe?.contentWindow?.print();
        } catch (err) {
          console.error("Print execution failed:", err);
        } finally {
          setIsPrinting(false);
        }
      };

      const images = Array.from(doc.images);
      if (images.length === 0) {
        setTimeout(executePrint, 250);
      } else {
        let pending = images.length;
        let fired = false;
        const checkReady = () => {
          pending--;
          if (pending <= 0 && !fired) {
            fired = true;
            setTimeout(executePrint, 200);
          }
        };

        images.forEach((img) => {
          if (img.complete) {
            checkReady();
          } else {
            img.onload = checkReady;
            img.onerror = checkReady;
          }
        });

        // Safety timeout
        setTimeout(() => {
          if (!fired) {
            fired = true;
            executePrint();
          }
        }, 700);
      }
    } catch (e) {
      console.error(e);
      setIsPrinting(false);
      toast({
        title: "Error al imprimir",
        description: "No se pudo abrir el diálogo de impresión.",
        variant: "destructive",
      });
    }
  };

  // Intercept Cmd+P / Ctrl+P while in this tab so it prints only the card
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "p") {
        e.preventDefault();
        handlePrint();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  // High-Res Download (Pixel-perfect export from live preview)
  const handleDownload = async () => {
    if (!cardRef.current) return;
    setDownloading(true);
    toast({
      title: "Generando imagen PNG...",
      description: "Capturando el diseño en alta resolución (300 DPI)...",
    });

    try {
      // Small pause to ensure layout is settled
      await new Promise((r) => setTimeout(r, 60));

      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        pixelRatio: 3, // 3x ultra-sharp resolution
        quality: 1,
        style: {
          boxShadow: "none",
          transform: "none",
        },
      });

      const filename = `QR-${salonName.replace(/\s+/g, "_")}-${currentFormat.label.toLowerCase()}-${currentFormat.dimensions.replace(/\s+/g, "")}.png`;
      const link = document.createElement("a");
      link.download = filename;
      link.href = dataUrl;
      link.click();
      toast({ title: "Tarjeta descargada con éxito ✓" });
    } catch (e) {
      console.error("Error exporting PNG:", e);
      toast({
        title: "Error al generar la imagen",
        description: "No se pudo generar el archivo PNG. Intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      setDownloading(false);
    }
  };

  // URL chip style on live card
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
      {/* Header */}
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
            Genera tarjetas de mostrador, folletos A4 y pegatinas con medidas reales listas para imprimir
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

      {/* Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Col: Controls */}
        <div className="lg:col-span-5 space-y-5">
          {/* 1. Format */}
          <div className="p-4 rounded-2xl bg-card border border-border/80 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                1. Formato y Medidas
              </label>
              <span className="text-[11px] font-semibold text-primary">
                {currentFormat.dimensions}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {Object.values(FORMAT_CONFIG).map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFormat(f.id)}
                  className={cn(
                    "p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between",
                    format === f.id
                      ? "bg-primary/10 border-primary font-bold text-primary shadow-xs ring-1 ring-primary/30"
                      : "bg-muted/30 border-border/60 hover:bg-muted/60 text-foreground"
                  )}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xs font-bold leading-tight">{f.label}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-background/80 border border-border/40">
                      {f.dimensions}
                    </span>
                  </div>
                  <span className="text-[10px] text-muted-foreground mt-1.5 line-clamp-1">{f.sublabel}</span>
                </button>
              ))}
            </div>

            {/* Paper Mode Selector (when not poster) */}
            {format !== "poster" && (
              <div className="pt-2 border-t border-border/40 mt-2 space-y-1.5">
                <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1.5">
                  <Scissors className="w-3 h-3 text-primary" />
                  Modo de hoja para imprimir:
                </span>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setPaperMode("a4_marks")}
                    className={cn(
                      "p-2 rounded-lg border text-left transition-all text-[11px] cursor-pointer",
                      paperMode === "a4_marks"
                        ? "bg-primary/10 border-primary text-primary font-bold"
                        : "bg-muted/20 border-border/50 text-muted-foreground hover:bg-muted/40"
                    )}
                  >
                    <div className="font-semibold flex items-center gap-1">
                      <span>Hoja A4</span>
                      <span className="text-[9px] px-1 rounded bg-primary/20 text-primary">Recomendado</span>
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">
                      Con marcas de corte para recortar
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaperMode("exact")}
                    className={cn(
                      "p-2 rounded-lg border text-left transition-all text-[11px] cursor-pointer",
                      paperMode === "exact"
                        ? "bg-primary/10 border-primary text-primary font-bold"
                        : "bg-muted/20 border-border/50 text-muted-foreground hover:bg-muted/40"
                    )}
                  >
                    <div className="font-semibold">Tamaño directo</div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">
                      {currentFormat.dimensions} exactos (imprenta/foto)
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 2. Theme */}
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

          {/* 3. Tagline & Options */}
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
              {format !== "qr_only" && (
                <label className="flex items-center justify-between text-xs cursor-pointer">
                  <span className="text-foreground font-medium">Mostrar ventajas ("Sin esperas...")</span>
                  <input
                    type="checkbox"
                    checked={showPerks}
                    onChange={(e) => setShowPerks(e.target.checked)}
                    className="rounded border-border text-primary h-4 w-4"
                  />
                </label>
              )}
            </div>
          </div>

          <p className="text-[11px] text-muted-foreground px-1">
            <span className="font-semibold text-primary">✓ QR con tracking activo</span>
            {" "}— escaneo directo a tu perfil con banner de bienvenida.
          </p>

          {/* Action Buttons */}
          <div className="space-y-2.5">
            <button
              type="button"
              onClick={handlePrint}
              disabled={isPrinting || !qrCodeDataUrl}
              className="glow-btn glow-btn--primary w-full justify-center py-3 shadow-md cursor-pointer disabled:opacity-50 text-sm font-bold"
            >
              <Printer className="w-4 h-4" />
              <span>
                {isPrinting
                  ? "Abriendo diálogo de impresión..."
                  : `Imprimir ${currentFormat.label} (${currentFormat.dimensions})`}
              </span>
            </button>

            <button
              type="button"
              onClick={handleDownload}
              disabled={downloading || !qrCodeDataUrl}
              className="glow-btn glow-btn--outline w-full justify-center py-2.5 cursor-pointer hover:bg-muted text-xs font-semibold text-muted-foreground hover:text-foreground"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{downloading ? "Generando PNG..." : "Descargar imagen PNG en alta resolución"}</span>
            </button>
          </div>
        </div>

        {/* Right Col: Live Preview */}
        <div className="lg:col-span-7 flex flex-col items-center">
          <div className="w-full flex items-center justify-between mb-3 px-1">
            <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-primary" />
              Previsualización en tiempo real
            </span>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-muted/50 border border-border/50 text-foreground font-bold">
              {currentFormat.label} · {currentFormat.dimensions}
            </span>
          </div>

          <div className="w-full max-w-lg p-6 sm:p-8 rounded-3xl bg-muted/20 border border-border/50 flex items-center justify-center">
            <div
              ref={cardRef}
              className={cn(
                "relative transition-all duration-300 rounded-3xl p-6 sm:p-8 border shadow-[0_24px_50px_-12px_rgba(0,0,0,0.28)] flex flex-col justify-between overflow-hidden",
                themeId !== "salon" && currentTheme.bgClass,
                currentTheme.borderClass,
                currentFormat.aspectClass
              )}
              style={salonBgStyle}
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/10 pointer-events-none" />

              {/* Format: Counter (Tarjeta) */}
              {format === "counter" && (
                <div className="relative z-10 h-full flex items-center justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-2.5">
                      {showLogo && salonLogo ? (
                        <img
                          src={salonLogo}
                          alt={salonName}
                          crossOrigin="anonymous"
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

                    {showPerks && (
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
                    )}

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

              {/* Format: Poster (Folleto A4) */}
              {format === "poster" && (
                <div className="relative z-10 h-full flex flex-col justify-between items-center text-center p-2">
                  <div className="space-y-2">
                    {showLogo && salonLogo ? (
                      <img
                        src={salonLogo}
                        alt={salonName}
                        crossOrigin="anonymous"
                        className="w-14 h-14 rounded-2xl object-cover border border-white/20 shadow-xs mx-auto"
                      />
                    ) : (
                      <div
                        className="w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-white text-xl shadow-xs mx-auto"
                        style={{
                          backgroundColor:
                            themeId === "salon" ? secondaryColor : currentTheme.accentColor,
                        }}
                      >
                        {salonName.charAt(0)}
                      </div>
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

              {/* Format: Mirror (Sticker Espejo) */}
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
                    <div
                      className="text-[10px] font-bold text-center mt-1 uppercase tracking-wider"
                      style={{ color: currentTheme.onCardLabel }}
                    >
                      Escanea aquí
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

              {/* Format: Solo QR (Pegatina compacta) */}
              {format === "qr_only" && (
                <div className="relative z-10 h-full flex flex-col justify-between items-center text-center p-2">
                  <div className="flex items-center gap-2">
                    {showLogo && salonLogo ? (
                      <img
                        src={salonLogo}
                        alt={salonName}
                        crossOrigin="anonymous"
                        className="w-7 h-7 rounded-lg object-cover border border-white/20 shadow-xs shrink-0"
                      />
                    ) : (
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-white text-xs shadow-xs shrink-0"
                        style={{
                          backgroundColor:
                            themeId === "salon" ? secondaryColor : currentTheme.accentColor,
                        }}
                      >
                        {salonName.charAt(0)}
                      </div>
                    )}
                    <h4
                      className={cn(
                        "text-sm font-black tracking-tight leading-tight m-0",
                        themeId !== "salon" && currentTheme.textClass
                      )}
                      style={themeId === "salon" ? { color: salonInk } : undefined}
                    >
                      {salonName}
                    </h4>
                  </div>

                  <div className="my-auto">
                    <div className={cn("p-3 rounded-2xl shadow-lg border border-black/5 inline-block", currentTheme.qrBgClass)}>
                      {qrCodeDataUrl ? (
                        <img src={qrCodeDataUrl} alt="QR de Reserva" className="w-32 h-32 object-contain" />
                      ) : (
                        <div className="w-32 h-32 bg-muted animate-pulse rounded-xl" />
                      )}
                    </div>
                  </div>

                  <div>
                    <span
                      className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-md inline-block"
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
