import { useState, useRef, useEffect } from "react";
import QRCode from "qrcode";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Download, Share2, Smartphone, Image as ImageIcon, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import glowappLetras from "@/assets/Glowapp Letras.png";

interface QRCardGeneratorProps {
  tenantId: string;
  tenantSlug: string;
}

interface TenantBranding {
  name: string;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  font_heading: string;
  font_body: string;
}

const TEMPLATES = [
  { id: "salon", label: "Tu Salón" },
  { id: "elegant", label: "Elegante" },
  { id: "minimal", label: "Minimalista" },
  { id: "dark", label: "Oscuro" },
] as const;

type TemplateId = typeof TEMPLATES[number]["id"];
type Format = "card" | "a4";

const TEMPLATE_FONTS: Record<TemplateId, { heading: string; body: string }> = {
  salon: { heading: "", body: "" },
  elegant: { heading: "Playfair Display", body: "Cormorant Garamond" },
  minimal: { heading: "Inter", body: "Inter" },
  dark: { heading: "Bebas Neue", body: "Raleway" },
};

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function isLightColor(hex: string): boolean {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 128;
}

interface TemplateStyle {
  bg: string;
  text: string;
  sub: string;
  accent: string;
  qrBg: string;
}

function getTemplateStyles(tid: TemplateId, pc: string, sc: string): TemplateStyle {
  switch (tid) {
    case "salon":
      return {
        bg: pc,
        text: isLightColor(pc) ? "#111827" : "#FFFFFF",
        sub: isLightColor(pc) ? "rgba(0,0,0,0.5)" : "rgba(255,255,255,0.6)",
        accent: sc,
        qrBg: "#FFFFFF",
      };
    case "elegant":
      return { bg: "#FAF7F2", text: "#2C1810", sub: "#8B7355", accent: "#B8860B", qrBg: "#FFFFFF" };
    case "minimal":
      return { bg: "#FFFFFF", text: "#111111", sub: "#888888", accent: "#111111", qrBg: "#F5F5F5" };
    case "dark":
      return { bg: "#0F0F0F", text: "#FFFFFF", sub: "rgba(255,255,255,0.55)", accent: "#E5C07B", qrBg: "#FFFFFF" };
  }
}

function getTemplateFonts(tid: TemplateId, branding: TenantBranding) {
  if (tid === "salon") {
    return { heading: branding.font_heading || "Inter", body: branding.font_body || "Inter" };
  }
  return TEMPLATE_FONTS[tid];
}

async function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

export function QRCardGenerator({ tenantId, tenantSlug }: QRCardGeneratorProps) {
  const [template, setTemplate] = useState<TemplateId>("salon");
  const [format, setFormat] = useState<Format>("card");
  const [tagline, setTagline] = useState("Reserva tu cita online");
  const [branding, setBranding] = useState<TenantBranding>({
    name: "",
    logo_url: null,
    primary_color: "#8B5CF6",
    secondary_color: "#EC4899",
    font_heading: "Inter",
    font_body: "Inter",
  });
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [logoImage, setLogoImage] = useState<HTMLImageElement | null>(null);
  const [glowLogoImage, setGlowLogoImage] = useState<HTMLImageElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();

  const bookingUrl = `https://www.glowapp.app/${tenantSlug}`;

  useEffect(() => {
    const fetchTenant = async () => {
      const { data } = await supabase
        .from("tenants")
        .select("name, logo_url, primary_color, secondary_color, font_heading, font_body")
        .eq("id", tenantId)
        .single();
      if (data) {
        setBranding({
          name: data.name || "",
          logo_url: data.logo_url || null,
          primary_color: data.primary_color || "#8B5CF6",
          secondary_color: data.secondary_color || "#EC4899",
          font_heading: data.font_heading || "Inter",
          font_body: data.font_body || "Inter",
        });
      }
    };
    fetchTenant();
  }, [tenantId]);

  useEffect(() => {
    const loadFonts = async () => {
      const allFonts = new Set<string>();
      if (branding.font_heading) allFonts.add(branding.font_heading);
      if (branding.font_body) allFonts.add(branding.font_body);
      Object.values(TEMPLATE_FONTS).forEach(({ heading, body }) => {
        if (heading) allFonts.add(heading);
        if (body) allFonts.add(body);
      });
      try {
        await Promise.all(
          Array.from(allFonts).map(async (fontName) => {
            const url = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontName)}:wght@400;700&display=swap`;
            const res = await fetch(url);
            const css = await res.text();
            const urlMatches = css.match(/url\(([^)]+)\)/g);
            if (urlMatches) {
              await Promise.all(
                urlMatches.slice(0, 2).map(async (match) => {
                  const fontUrl = match.slice(4, -1);
                  const weight = css.includes("font-weight: 700") ? "700" : "400";
                  const face = new FontFace(fontName, `url(${fontUrl})`, { weight });
                  const loaded = await face.load();
                  document.fonts.add(loaded);
                })
              );
            }
          })
        );
      } catch (e) {
        console.warn("Font loading failed, using fallback", e);
      }
    };
    if (branding.font_heading) loadFonts();
  }, [branding.font_heading, branding.font_body]);

  useEffect(() => {
    if (!branding.logo_url) { setLogoImage(null); return; }
    loadImage(branding.logo_url).then(setLogoImage);
  }, [branding.logo_url]);

  useEffect(() => {
    loadImage(glowappLetras).then(setGlowLogoImage);
  }, []);

  // QR size scales with format
  useEffect(() => {
    const qrSize = format === "a4" ? 1400 : 400;
    QRCode.toDataURL(bookingUrl, {
      width: qrSize,
      margin: 2,
      color: { dark: "#000000", light: "#FFFFFF" },
      errorCorrectionLevel: "H",
    }).then(setQrDataUrl);
  }, [bookingUrl, format]);

  const pc = branding.primary_color;
  const sc = branding.secondary_color;

  // ───────── CARD (horizontal 1200x800) ─────────
  const renderCard = async (ctx: CanvasRenderingContext2D, s: TemplateStyle, fonts: { heading: string; body: string }) => {
    const w = 1200, h = 800;

    ctx.fillStyle = s.bg;
    ctx.beginPath();
    ctx.roundRect(0, 0, w, h, 32);
    ctx.fill();

    if (template === "elegant") {
      ctx.strokeStyle = hexToRgba("#B8860B", 0.25);
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(20, 20, w - 40, h - 40, 24);
      ctx.stroke();
    }
    if (template === "dark") {
      const glow = ctx.createLinearGradient(80, 24, w - 80, 24);
      glow.addColorStop(0, "rgba(229,192,123,0)");
      glow.addColorStop(0.5, "rgba(229,192,123,0.5)");
      glow.addColorStop(1, "rgba(229,192,123,0)");
      ctx.strokeStyle = glow;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(80, 24);
      ctx.lineTo(w - 80, 24);
      ctx.stroke();
    }
    if (template === "minimal") {
      ctx.strokeStyle = "#E5E5E5";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(0, 0, w, h, 32);
      ctx.stroke();
    }
    if (template === "salon") {
      const overlay = ctx.createLinearGradient(0, 0, w, h);
      overlay.addColorStop(0, "rgba(255,255,255,0.08)");
      overlay.addColorStop(1, "rgba(0,0,0,0.08)");
      ctx.fillStyle = overlay;
      ctx.fillRect(0, 0, w, h);
    }

    const contentX = 80;
    let nameY = 200;
    if (logoImage) {
      const logoSize = 72;
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(contentX, 70, logoSize, logoSize, 14);
      ctx.clip();
      ctx.drawImage(logoImage, contentX, 70, logoSize, logoSize);
      ctx.restore();
      ctx.strokeStyle = hexToRgba(s.accent, 0.3);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(contentX, 70, logoSize, logoSize, 14);
      ctx.stroke();
      nameY = 190;
    }

    ctx.fillStyle = s.text;
    ctx.font = `bold 52px "${fonts.heading}", sans-serif`;
    ctx.textAlign = "left";
    ctx.fillText(branding.name || "Tu Salón", contentX, nameY);

    ctx.fillStyle = s.accent;
    ctx.beginPath();
    ctx.roundRect(contentX, nameY + 18, 60, 4, 2);
    ctx.fill();

    ctx.fillStyle = s.sub;
    ctx.font = `28px "${fonts.body}", sans-serif`;
    ctx.fillText(tagline, contentX, nameY + 60);

    ctx.fillStyle = s.accent;
    ctx.font = `bold 22px "${fonts.body}", sans-serif`;
    ctx.fillText(bookingUrl.replace("https://", ""), contentX, h - 60);

    if (qrDataUrl) {
      const qrImg = await loadImage(qrDataUrl);
      if (qrImg) {
        const qrSize = 300;
        const qrX = w - qrSize - 100;
        const qrY = (h - qrSize - 50) / 2;

        ctx.save();
        ctx.shadowColor = "rgba(0,0,0,0.08)";
        ctx.shadowBlur = 24;
        ctx.shadowOffsetY = 8;
        ctx.fillStyle = s.qrBg;
        ctx.beginPath();
        ctx.roundRect(qrX - 24, qrY - 24, qrSize + 48, qrSize + 80, 20);
        ctx.fill();
        ctx.restore();

        ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

        ctx.fillStyle = template === "minimal" ? "#888888" : "#666666";
        ctx.font = `20px "${fonts.body}", sans-serif`;
        ctx.textAlign = "center";
        ctx.fillText("Escanea para reservar", qrX + qrSize / 2, qrY + qrSize + 36);
        ctx.textAlign = "left";
      }
    }
  };

  // ───────── A4 POSTER (vertical 2480x3508 @ 300dpi) ─────────
  const renderA4 = async (ctx: CanvasRenderingContext2D, s: TemplateStyle, fonts: { heading: string; body: string }) => {
    const w = 2480, h = 3508;

    // Background
    ctx.fillStyle = s.bg;
    ctx.fillRect(0, 0, w, h);

    // Salon overlay
    if (template === "salon") {
      const overlay = ctx.createLinearGradient(0, 0, w, h);
      overlay.addColorStop(0, "rgba(255,255,255,0.06)");
      overlay.addColorStop(1, "rgba(0,0,0,0.10)");
      ctx.fillStyle = overlay;
      ctx.fillRect(0, 0, w, h);
    }
    if (template === "elegant") {
      ctx.strokeStyle = hexToRgba("#B8860B", 0.3);
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.roundRect(80, 80, w - 160, h - 160, 30);
      ctx.stroke();
    }
    if (template === "minimal") {
      ctx.strokeStyle = "#E5E5E5";
      ctx.lineWidth = 4;
      ctx.strokeRect(40, 40, w - 80, h - 80);
    }

    const centerX = w / 2;
    let y = 320;

    // Salon logo (centered, top)
    if (logoImage) {
      const logoSize = 220;
      const logoX = centerX - logoSize / 2;
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(logoX, y, logoSize, logoSize, 32);
      ctx.clip();
      ctx.drawImage(logoImage, logoX, y, logoSize, logoSize);
      ctx.restore();
      ctx.strokeStyle = hexToRgba(s.accent, 0.4);
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.roundRect(logoX, y, logoSize, logoSize, 32);
      ctx.stroke();
      y += logoSize + 180;
    } else {
      y += 60;
    }

    // H1 "RESERVA TU CITA"
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillStyle = s.text;
    ctx.font = `bold 200px "${fonts.heading}", sans-serif`;
    ctx.fillText("RESERVA TU CITA", centerX, y);
    y += 230;

    // H2 "en {salon}"
    ctx.fillStyle = s.text;
    ctx.font = `100px "${fonts.heading}", sans-serif`;
    const salonLine = `en ${branding.name || "nuestro salón"}`;
    ctx.fillText(salonLine, centerX, y);
    y += 130;
    ctx.textBaseline = "alphabetic";

    // Accent line
    ctx.fillStyle = s.accent;
    ctx.beginPath();
    ctx.roundRect(centerX - 120, y, 240, 8, 4);
    ctx.fill();
    y += 100;

    // QR Code (huge, centered)
    if (qrDataUrl) {
      const qrImg = await loadImage(qrDataUrl);
      if (qrImg) {
        const qrSize = 1400;
        const qrX = centerX - qrSize / 2;
        const qrY = y;
        const pad = 60;

        // White card behind QR with shadow
        ctx.save();
        ctx.shadowColor = "rgba(0,0,0,0.12)";
        ctx.shadowBlur = 60;
        ctx.shadowOffsetY = 20;
        ctx.fillStyle = s.qrBg;
        ctx.beginPath();
        ctx.roundRect(qrX - pad, qrY - pad, qrSize + pad * 2, qrSize + pad * 2, 40);
        ctx.fill();
        ctx.restore();

        ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);
        y = qrY + qrSize + pad + 80;
      }
    }

    // "Escanea con tu móvil"
    ctx.fillStyle = s.sub;
    ctx.font = `54px "${fonts.body}", sans-serif`;
    ctx.fillText("Escanea con tu móvil", centerX, y);
    y += 90;

    // URL
    ctx.fillStyle = s.accent;
    ctx.font = `bold 60px "${fonts.body}", sans-serif`;
    ctx.fillText(bookingUrl.replace("https://", ""), centerX, y);
    y += 80;

    // Tagline (if non-default)
    if (tagline && tagline !== "Reserva tu cita online") {
      ctx.fillStyle = s.sub;
      ctx.font = `italic 44px "${fonts.body}", sans-serif`;
      ctx.fillText(tagline, centerX, y);
      y += 70;
    }

    // Footer separator + Glowapp logo
    const footerY = h - 240;
    ctx.strokeStyle = hexToRgba(s.text === "#FFFFFF" ? "#FFFFFF" : "#000000", 0.1);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(centerX - 400, footerY);
    ctx.lineTo(centerX + 400, footerY);
    ctx.stroke();

    // "Hecho con" + logo
    if (glowLogoImage) {
      const logoH = 90;
      const aspect = glowLogoImage.width / glowLogoImage.height;
      const logoW = logoH * aspect;
      const label = "Hecho con";
      ctx.fillStyle = s.sub;
      ctx.font = `40px "${fonts.body}", sans-serif`;
      ctx.textBaseline = "middle";
      const labelW = ctx.measureText(label).width;
      const gap = 24;
      const totalW = labelW + gap + logoW;
      const startX = centerX - totalW / 2;
      const midY = footerY + 100;

      ctx.textAlign = "left";
      ctx.fillText(label, startX, midY);

      // Invert logo for dark backgrounds
      const isDarkBg = !isLightColor(s.bg.startsWith("#") ? s.bg : "#FFFFFF");
      if (isDarkBg || template === "dark") {
        ctx.save();
        const off = document.createElement("canvas");
        off.width = glowLogoImage.width;
        off.height = glowLogoImage.height;
        const octx = off.getContext("2d")!;
        octx.drawImage(glowLogoImage, 0, 0);
        octx.globalCompositeOperation = "source-in";
        octx.fillStyle = "#FFFFFF";
        octx.fillRect(0, 0, off.width, off.height);
        ctx.drawImage(off, startX + labelW + gap, midY - logoH / 2, logoW, logoH);
        ctx.restore();
      } else {
        ctx.drawImage(glowLogoImage, startX + labelW + gap, midY - logoH / 2, logoW, logoH);
      }
      ctx.textBaseline = "alphabetic";
      ctx.textAlign = "center";
    }
  };

  const generateCanvas = async (): Promise<HTMLCanvasElement | null> => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    const isA4 = format === "a4";
    canvas.width = isA4 ? 2480 : 1200;
    canvas.height = isA4 ? 3508 : 800;

    const s = getTemplateStyles(template, pc, sc);
    const fonts = getTemplateFonts(template, branding);

    if (isA4) await renderA4(ctx, s, fonts);
    else await renderCard(ctx, s, fonts);

    return canvas;
  };

  const handleDownload = async () => {
    const canvas = await generateCanvas();
    if (!canvas) return;
    const link = document.createElement("a");
    const prefix = format === "a4" ? "cartel-A4" : "tarjeta";
    link.download = `${prefix}-${tenantSlug}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
    toast({
      title: "Descargado",
      description: format === "a4" ? "Cartel A4 listo para imprimir (300 DPI)" : "Tarjeta guardada en alta resolución",
    });
  };

  const handleShare = async () => {
    const canvas = await generateCanvas();
    if (!canvas) return;
    canvas.toBlob(async (blob) => {
      if (!blob) return;
      const filename = `${format === "a4" ? "cartel" : "tarjeta"}-${tenantSlug}.png`;
      if (navigator.share) {
        const file = new File([blob], filename, { type: "image/png" });
        try {
          await navigator.share({ files: [file], title: branding.name, text: tagline });
        } catch {
          /* user cancelled */
        }
      } else {
        await navigator.clipboard.writeText(bookingUrl);
        toast({ title: "Link copiado", description: "El enlace de reserva se copió al portapapeles" });
      }
    });
  };

  // — Preview —
  const previewStyles = getTemplateStyles(template, pc, sc);
  const previewFonts = getTemplateFonts(template, branding);

  const templatePreviewBgs: Record<TemplateId, string> = {
    salon: pc, elegant: "#FAF7F2", minimal: "#FFFFFF", dark: "#0F0F0F",
  };

  return (
    <div className="space-y-5">
      {/* Format selector */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-foreground">Formato</h3>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setFormat("card")}
            className={cn(
              "flex items-center justify-center gap-2 h-14 rounded-xl border transition-all",
              format === "card"
                ? "ring-2 ring-primary border-transparent bg-primary/5 text-primary"
                : "border-border text-muted-foreground hover:border-muted-foreground/40",
            )}
          >
            <ImageIcon className="h-4 w-4" />
            <div className="text-left leading-tight">
              <div className="text-sm font-semibold">Tarjeta</div>
              <div className="text-[10px] opacity-70">Horizontal · redes</div>
            </div>
          </button>
          <button
            onClick={() => setFormat("a4")}
            className={cn(
              "flex items-center justify-center gap-2 h-14 rounded-xl border transition-all",
              format === "a4"
                ? "ring-2 ring-primary border-transparent bg-primary/5 text-primary"
                : "border-border text-muted-foreground hover:border-muted-foreground/40",
            )}
          >
            <FileText className="h-4 w-4" />
            <div className="text-left leading-tight">
              <div className="text-sm font-semibold">Cartel A4</div>
              <div className="text-[10px] opacity-70">Vertical · imprimir</div>
            </div>
          </button>
        </div>
      </div>

      {/* Template selector */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-foreground">Estilo</h3>
        <div className="grid grid-cols-4 gap-2">
          {TEMPLATES.map((t) => {
            const ts = getTemplateStyles(t.id, pc, sc);
            return (
              <button
                key={t.id}
                onClick={() => setTemplate(t.id)}
                className={cn(
                  "relative h-14 rounded-xl overflow-hidden transition-all",
                  template === t.id ? "ring-2 ring-primary shadow-lg scale-[1.03]" : "ring-1 ring-border hover:ring-muted-foreground/30"
                )}
                style={{ background: templatePreviewBgs[t.id] }}
              >
                <span className="absolute bottom-1 left-2 text-[10px] font-medium" style={{ color: ts.text }}>
                  {t.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tagline */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-foreground">Eslogan (opcional)</label>
        <Input value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder="Reserva tu cita online" maxLength={50} />
      </div>

      {/* Preview */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          {format === "card" ? (
            <div className="relative p-5 aspect-[3/2] flex" style={{ background: previewStyles.bg }}>
              <div className="flex-1 flex flex-col justify-between min-w-0 pr-3">
                <div className="space-y-2">
                  {branding.logo_url && (
                    <img src={branding.logo_url} alt="" className="h-8 w-8 rounded-lg object-cover" />
                  )}
                  <div className="pt-1">
                    <h3 className="text-base font-bold truncate" style={{ color: previewStyles.text, fontFamily: `"${previewFonts.heading}", sans-serif` }}>
                      {branding.name || "Tu Salón"}
                    </h3>
                    <div className="w-6 h-0.5 rounded-full mt-1.5" style={{ background: previewStyles.accent }} />
                    <p className="text-[10px] mt-2" style={{ color: previewStyles.sub, fontFamily: `"${previewFonts.body}", sans-serif` }}>
                      {tagline}
                    </p>
                  </div>
                </div>
                <p className="text-[8px] font-medium truncate" style={{ color: previewStyles.accent, fontFamily: `"${previewFonts.body}", sans-serif` }}>
                  {bookingUrl.replace("https://", "")}
                </p>
              </div>
              <div className="flex items-center shrink-0">
                {qrDataUrl && (
                  <div className="p-1.5 rounded-lg shadow-sm flex flex-col items-center gap-1" style={{ background: previewStyles.qrBg }}>
                    <img src={qrDataUrl} alt="QR Code" className="w-20 h-20" />
                    <span className="text-[7px]" style={{ color: "#888", fontFamily: `"${previewFonts.body}", sans-serif` }}>
                      Escanea para reservar
                    </span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div
              className="relative mx-auto flex flex-col items-center justify-between"
              style={{
                background: previewStyles.bg,
                aspectRatio: "210 / 297",
                width: "100%",
                maxWidth: "320px",
                padding: "16px 14px",
              }}
            >
              <div className="flex flex-col items-center text-center w-full gap-2">
                {branding.logo_url && (
                  <img src={branding.logo_url} alt="" className="h-10 w-10 rounded-lg object-cover mb-1" />
                )}
                <h3 className="text-[18px] font-bold leading-tight" style={{ color: previewStyles.text, fontFamily: `"${previewFonts.heading}", sans-serif` }}>
                  RESERVA TU CITA
                </h3>
                <p className="text-[10px] -mt-1" style={{ color: previewStyles.text, fontFamily: `"${previewFonts.heading}", sans-serif` }}>
                  en {branding.name || "nuestro salón"}
                </p>
                <div className="w-8 h-[2px] rounded-full" style={{ background: previewStyles.accent }} />
              </div>

              {qrDataUrl && (
                <div className="rounded-lg shadow-md p-2" style={{ background: previewStyles.qrBg }}>
                  <img src={qrDataUrl} alt="QR" className="w-32 h-32" />
                </div>
              )}

              <div className="flex flex-col items-center text-center w-full gap-1">
                <p className="text-[9px]" style={{ color: previewStyles.sub, fontFamily: `"${previewFonts.body}", sans-serif` }}>
                  Escanea con tu móvil
                </p>
                <p className="text-[10px] font-bold" style={{ color: previewStyles.accent, fontFamily: `"${previewFonts.body}", sans-serif` }}>
                  {bookingUrl.replace("https://", "")}
                </p>
                <div className="h-px w-24 my-1 opacity-30" style={{ background: previewStyles.text }} />
                <div className="flex items-center gap-1.5 opacity-80">
                  <span className="text-[7px]" style={{ color: previewStyles.sub }}>Hecho con</span>
                  <img
                    src={glowappLetras}
                    alt="Glowapp"
                    className="h-3 object-contain"
                    style={{ filter: template === "dark" || !isLightColor(previewStyles.bg.startsWith("#") ? previewStyles.bg : "#FFFFFF") ? "invert(1) brightness(2)" : "none" }}
                  />
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-3">
        <Button onClick={handleDownload} className="flex-1 gap-2">
          <Download className="h-4 w-4" />
          {format === "a4" ? "Descargar cartel A4" : "Descargar PNG"}
        </Button>
        <Button onClick={handleShare} variant="outline" className="flex-1 gap-2">
          <Share2 className="h-4 w-4" />
          Compartir
        </Button>
      </div>

      {format === "a4" && (
        <p className="text-[11px] text-muted-foreground text-center -mt-2">
          PNG 2480×3508 px @ 300 DPI · imprime en A4 sin pérdida
        </p>
      )}

      <canvas ref={canvasRef} className="hidden" />

      {/* Booking link */}
      <Card className="bg-muted/30">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Smartphone className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">Tu link de reservas</p>
              <p className="text-xs text-muted-foreground truncate">{bookingUrl}</p>
            </div>
            <Button size="sm" variant="ghost" onClick={() => { navigator.clipboard.writeText(bookingUrl); toast({ title: "Copiado" }); }}>
              Copiar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
