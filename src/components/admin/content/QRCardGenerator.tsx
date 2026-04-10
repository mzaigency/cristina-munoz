import { useState, useRef, useEffect } from "react";
import QRCode from "qrcode";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Download, Share2, Smartphone } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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

// Each template uses its own fonts to match its personality
const TEMPLATE_FONTS: Record<TemplateId, { heading: string; body: string }> = {
  salon: { heading: "", body: "" }, // dynamic — uses tenant's own fonts
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
      return {
        bg: "#FAF7F2",
        text: "#2C1810",
        sub: "#8B7355",
        accent: "#B8860B",
        qrBg: "#FFFFFF",
      };
    case "minimal":
      return {
        bg: "#FFFFFF",
        text: "#111111",
        sub: "#888888",
        accent: "#111111",
        qrBg: "#F5F5F5",
      };
    case "dark":
      return {
        bg: "#0F0F0F",
        text: "#FFFFFF",
        sub: "rgba(255,255,255,0.55)",
        accent: "#E5C07B",
        qrBg: "#FFFFFF",
      };
  }
}

function getTemplateFonts(tid: TemplateId, branding: TenantBranding) {
  if (tid === "salon") {
    return {
      heading: branding.font_heading || "Inter",
      body: branding.font_body || "Inter",
    };
  }
  return TEMPLATE_FONTS[tid];
}

export function QRCardGenerator({ tenantId, tenantSlug }: QRCardGeneratorProps) {
  const [template, setTemplate] = useState<TemplateId>("salon");
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
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();

  const bookingUrl = `https://www.glowapp.app/${tenantSlug}`;

  // Fetch tenant branding
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

  // Load all needed Google Fonts
  useEffect(() => {
    const loadFonts = async () => {
      const allFonts = new Set<string>();
      // Tenant fonts for "salon" template
      if (branding.font_heading) allFonts.add(branding.font_heading);
      if (branding.font_body) allFonts.add(branding.font_body);
      // Static template fonts
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
      setFontsLoaded(true);
    };
    if (branding.font_heading) loadFonts();
  }, [branding.font_heading, branding.font_body]);

  // Load logo image
  useEffect(() => {
    if (!branding.logo_url) { setLogoImage(null); return; }
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => setLogoImage(img);
    img.onerror = () => setLogoImage(null);
    img.src = branding.logo_url;
  }, [branding.logo_url]);

  // Generate QR
  useEffect(() => {
    QRCode.toDataURL(bookingUrl, {
      width: 400,
      margin: 2,
      color: { dark: "#000000", light: "#FFFFFF" },
      errorCorrectionLevel: "H",
    }).then(setQrDataUrl);
  }, [bookingUrl]);

  const pc = branding.primary_color;
  const sc = branding.secondary_color;

  const generateCard = async (): Promise<HTMLCanvasElement | null> => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    const w = 1200, h = 800;
    canvas.width = w;
    canvas.height = h;

    const s = getTemplateStyles(template, pc, sc);
    const fonts = getTemplateFonts(template, branding);

    // — Background —
    ctx.fillStyle = s.bg;
    ctx.beginPath();
    ctx.roundRect(0, 0, w, h, 32);
    ctx.fill();

    // Elegant: subtle warm border
    if (template === "elegant") {
      ctx.strokeStyle = hexToRgba("#B8860B", 0.25);
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(20, 20, w - 40, h - 40, 24);
      ctx.stroke();
    }

    // Dark: subtle glow line at top
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

    // Minimal: thin border
    if (template === "minimal") {
      ctx.strokeStyle = "#E5E5E5";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(0, 0, w, h, 32);
      ctx.stroke();
    }

    // Salon: subtle gradient overlay
    if (template === "salon") {
      const overlay = ctx.createLinearGradient(0, 0, w, h);
      overlay.addColorStop(0, "rgba(255,255,255,0.08)");
      overlay.addColorStop(1, "rgba(0,0,0,0.08)");
      ctx.fillStyle = overlay;
      ctx.fillRect(0, 0, w, h);
    }

    // — Left content area —
    const contentX = 80;
    const contentMaxW = w - 480; // leave room for QR on right

    // Logo — positioned with clear separation from name
    let nameY = 200;
    if (logoImage) {
      const logoSize = 72;
      const logoX = contentX;
      const logoY = 70;
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(logoX, logoY, logoSize, logoSize, 14);
      ctx.clip();
      ctx.drawImage(logoImage, logoX, logoY, logoSize, logoSize);
      ctx.restore();
      // logo border
      ctx.strokeStyle = hexToRgba(s.accent, 0.3);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(logoX, logoY, logoSize, logoSize, 14);
      ctx.stroke();
      nameY = 190; // extra gap after logo
    }

    // Name
    ctx.fillStyle = s.text;
    ctx.font = `bold 52px "${fonts.heading}", sans-serif`;
    ctx.textAlign = "left";
    ctx.fillText(branding.name || "Tu Salón", contentX, nameY);

    // Accent line
    ctx.fillStyle = s.accent;
    ctx.beginPath();
    ctx.roundRect(contentX, nameY + 18, 60, 4, 2);
    ctx.fill();

    // Tagline
    ctx.fillStyle = s.sub;
    ctx.font = `28px "${fonts.body}", sans-serif`;
    ctx.fillText(tagline, contentX, nameY + 60);

    // URL at bottom-left
    ctx.fillStyle = s.accent;
    ctx.font = `bold 22px "${fonts.body}", sans-serif`;
    ctx.fillText(bookingUrl.replace("https://", ""), contentX, h - 60);

    // — QR Code on right —
    if (qrDataUrl) {
      const qrImg = new Image();
      qrImg.crossOrigin = "anonymous";
      await new Promise<void>((resolve) => {
        qrImg.onload = () => {
          const qrSize = 300;
          const qrX = w - qrSize - 100;
          const qrY = (h - qrSize - 50) / 2;

          // QR background card
          ctx.fillStyle = s.qrBg;
          ctx.beginPath();
          ctx.roundRect(qrX - 24, qrY - 24, qrSize + 48, qrSize + 80, 20);
          ctx.fill();

          // Subtle shadow for QR card
          ctx.save();
          ctx.shadowColor = "rgba(0,0,0,0.08)";
          ctx.shadowBlur = 24;
          ctx.shadowOffsetY = 8;
          ctx.fillStyle = s.qrBg;
          ctx.beginPath();
          ctx.roundRect(qrX - 24, qrY - 24, qrSize + 48, qrSize + 80, 20);
          ctx.fill();
          ctx.restore();

          // QR image
          ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

          // "Escanea para reservar" below QR
          ctx.fillStyle = template === "minimal" ? "#888888" : "#666666";
          ctx.font = `20px "${fonts.body}", sans-serif`;
          ctx.textAlign = "center";
          ctx.fillText("Escanea para reservar", qrX + qrSize / 2, qrY + qrSize + 36);
          ctx.textAlign = "left";

          resolve();
        };
        qrImg.src = qrDataUrl;
      });
    }

    return canvas;
  };

  const handleDownload = async () => {
    const canvas = await generateCard();
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `tarjeta-${tenantSlug}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
    toast({ title: "Descargado", description: "Tarjeta guardada en alta resolución" });
  };

  const handleShare = async () => {
    const canvas = await generateCard();
    if (!canvas) return;
    canvas.toBlob(async (blob) => {
      if (!blob) return;
      if (navigator.share) {
        const file = new File([blob], `tarjeta-${tenantSlug}.png`, { type: "image/png" });
        await navigator.share({ files: [file], title: branding.name, text: tagline });
      } else {
        await navigator.clipboard.writeText(bookingUrl);
        toast({ title: "Link copiado", description: "El enlace de reserva se copió al portapapeles" });
      }
    });
  };

  // — Preview —
  const previewStyles = getTemplateStyles(template, pc, sc);
  const previewFonts = getTemplateFonts(template, branding);

  // Template selector preview colors
  const templatePreviewBgs: Record<TemplateId, string> = {
    salon: pc,
    elegant: "#FAF7F2",
    minimal: "#FFFFFF",
    dark: "#0F0F0F",
  };

  return (
    <div className="space-y-5">
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
                  template === t.id
                    ? "ring-2 ring-primary shadow-lg scale-[1.03]"
                    : "ring-1 ring-border hover:ring-muted-foreground/30"
                )}
                style={{ background: templatePreviewBgs[t.id] }}
              >
                <span
                  className="absolute bottom-1 left-2 text-[10px] font-medium"
                  style={{ color: ts.text }}
                >
                  {t.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tagline */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-foreground">Eslogan</label>
        <Input
          value={tagline}
          onChange={(e) => setTagline(e.target.value)}
          placeholder="Reserva tu cita online"
          maxLength={50}
        />
      </div>

      {/* Preview card */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div
            className="relative p-5 aspect-[3/2] flex"
            style={{ background: previewStyles.bg }}
          >
            {/* Left content */}
            <div className="flex-1 flex flex-col justify-between min-w-0 pr-3">
              <div className="space-y-2">
                {branding.logo_url && (
                  <img
                    src={branding.logo_url}
                    alt=""
                    className="h-8 w-8 rounded-lg object-cover"
                  />
                )}
                <div className="pt-1">
                  <h3
                    className="text-base font-bold truncate"
                    style={{
                      color: previewStyles.text,
                      fontFamily: `"${previewFonts.heading}", sans-serif`,
                    }}
                  >
                    {branding.name || "Tu Salón"}
                  </h3>
                  <div
                    className="w-6 h-0.5 rounded-full mt-1.5"
                    style={{ background: previewStyles.accent }}
                  />
                  <p
                    className="text-[10px] mt-2"
                    style={{
                      color: previewStyles.sub,
                      fontFamily: `"${previewFonts.body}", sans-serif`,
                    }}
                  >
                    {tagline}
                  </p>
                </div>
              </div>
              <p
                className="text-[8px] font-medium truncate"
                style={{
                  color: previewStyles.accent,
                  fontFamily: `"${previewFonts.body}", sans-serif`,
                }}
              >
                {bookingUrl.replace("https://", "")}
              </p>
            </div>

            {/* QR right side */}
            <div className="flex items-center shrink-0">
              {qrDataUrl && (
                <div
                  className="p-1.5 rounded-lg shadow-sm flex flex-col items-center gap-1"
                  style={{ background: previewStyles.qrBg }}
                >
                  <img src={qrDataUrl} alt="QR Code" className="w-20 h-20" />
                  <span
                    className="text-[7px]"
                    style={{
                      color: "#888",
                      fontFamily: `"${previewFonts.body}", sans-serif`,
                    }}
                  >
                    Escanea para reservar
                  </span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-3">
        <Button onClick={handleDownload} className="flex-1 gap-2">
          <Download className="h-4 w-4" />
          Descargar PNG
        </Button>
        <Button onClick={handleShare} variant="outline" className="flex-1 gap-2">
          <Share2 className="h-4 w-4" />
          Compartir
        </Button>
      </div>

      {/* Hidden canvas */}
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
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                navigator.clipboard.writeText(bookingUrl);
                toast({ title: "Copiado" });
              }}
            >
              Copiar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
