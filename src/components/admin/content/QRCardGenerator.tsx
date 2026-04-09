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
  { id: "minimal", label: "Minimal" },
  { id: "dark", label: "Elegante" },
  { id: "brand", label: "Marca" },
  { id: "nature", label: "Natural" },
  { id: "salon", label: "Tu Salón" },
  { id: "gradient", label: "Gradiente" },
  { id: "glass", label: "Glass" },
] as const;

type TemplateId = typeof TEMPLATES[number]["id"];

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function darkenHex(hex: string, amount: number): string {
  const r = Math.max(0, parseInt(hex.slice(1, 3), 16) - amount);
  const g = Math.max(0, parseInt(hex.slice(3, 5), 16) - amount);
  const b = Math.max(0, parseInt(hex.slice(5, 7), 16) - amount);
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

function isLightColor(hex: string): boolean {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 128;
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

  // Load Google Fonts
  useEffect(() => {
    const loadFonts = async () => {
      const fonts = [branding.font_heading, branding.font_body].filter((f, i, arr) => arr.indexOf(f) === i);
      try {
        await Promise.all(
          fonts.map(async (fontName) => {
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

  // Generate QR at high resolution
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

  const getTemplateStyles = (tid: TemplateId) => {
    switch (tid) {
      case "minimal": return { bg: "#FFFFFF", text: "#111827", sub: "#6B7280", accent: "#8B5CF6" };
      case "dark": return { bg: "#1F2937", text: "#FFFFFF", sub: "rgba(255,255,255,0.7)", accent: "#F59E0B" };
      case "brand": return { bg: pc, text: isLightColor(pc) ? "#111827" : "#FFFFFF", sub: isLightColor(pc) ? "rgba(0,0,0,0.6)" : "rgba(255,255,255,0.7)", accent: isLightColor(pc) ? "#111827" : "#FFFFFF" };
      case "nature": return { bg: "#ECFDF5", text: "#064E3B", sub: "#6B7280", accent: "#059669" };
      case "salon": return { bg: pc, text: isLightColor(pc) ? "#111827" : "#FFFFFF", sub: isLightColor(pc) ? "rgba(0,0,0,0.5)" : "rgba(255,255,255,0.6)", accent: sc };
      case "gradient": return { bg: "gradient", text: "#FFFFFF", sub: "rgba(255,255,255,0.7)", accent: "#FFFFFF" };
      case "glass": return { bg: "#FFFFFF", text: "#111827", sub: "#6B7280", accent: pc };
      default: return { bg: "#FFFFFF", text: "#111827", sub: "#6B7280", accent: "#8B5CF6" };
    }
  };

  const generateCard = async (): Promise<HTMLCanvasElement | null> => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    const w = 1200, h = 800;
    canvas.width = w;
    canvas.height = h;

    const s = getTemplateStyles(template);
    const headingFont = branding.font_heading || "Inter";
    const bodyFont = branding.font_body || "Inter";

    // Background
    if (template === "gradient") {
      const grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, pc);
      grad.addColorStop(1, sc);
      ctx.fillStyle = grad;
    } else if (template === "glass") {
      ctx.fillStyle = "#F8F9FA";
      ctx.fillRect(0, 0, w, h);
      // Glass border effect
      ctx.strokeStyle = hexToRgba(pc, 0.3);
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.roundRect(16, 16, w - 32, h - 32, 32);
      ctx.stroke();
      // Inner subtle gradient
      const gGlass = ctx.createLinearGradient(0, 0, w, h);
      gGlass.addColorStop(0, hexToRgba(pc, 0.05));
      gGlass.addColorStop(1, hexToRgba(sc, 0.08));
      ctx.fillStyle = gGlass;
    } else {
      ctx.fillStyle = s.bg;
    }
    ctx.beginPath();
    ctx.roundRect(0, 0, w, h, 32);
    ctx.fill();

    // Border for non-glass
    if (template !== "glass") {
      ctx.strokeStyle = "rgba(0,0,0,0.08)";
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // Logo
    const logoSize = 80;
    let textStartY = 140;
    if (logoImage) {
      const logoX = 80, logoY = 60;
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(logoX, logoY, logoSize, logoSize, 16);
      ctx.clip();
      ctx.drawImage(logoImage, logoX, logoY, logoSize, logoSize);
      ctx.restore();
      // Logo border
      ctx.strokeStyle = hexToRgba(s.accent, 0.3);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(logoX, logoY, logoSize, logoSize, 16);
      ctx.stroke();
      textStartY = 170;
    }

    // Name
    ctx.fillStyle = s.text;
    ctx.font = `bold 56px "${headingFont}", sans-serif`;
    ctx.fillText(branding.name || "Tu Salón", 80, textStartY);

    // Tagline
    ctx.fillStyle = s.sub;
    ctx.font = `32px "${bodyFont}", sans-serif`;
    ctx.fillText(tagline, 80, textStartY + 50);

    // URL
    ctx.fillStyle = s.accent;
    ctx.font = `bold 24px "${bodyFont}", sans-serif`;
    ctx.fillText(bookingUrl.replace("https://", ""), 80, h - 60);

    // Decorative accent line
    ctx.fillStyle = s.accent;
    ctx.beginPath();
    ctx.roundRect(80, textStartY + 70, 80, 4, 2);
    ctx.fill();

    // QR Code
    if (qrDataUrl) {
      const qrImg = new Image();
      qrImg.crossOrigin = "anonymous";
      await new Promise<void>((resolve) => {
        qrImg.onload = () => {
          const qrSize = 320;
          const qrX = w - qrSize - 80;
          const qrY = (h - qrSize) / 2;
          // White bg for QR
          ctx.fillStyle = "#FFFFFF";
          ctx.beginPath();
          ctx.roundRect(qrX - 20, qrY - 20, qrSize + 40, qrSize + 40, 24);
          ctx.fill();
          ctx.shadowColor = "rgba(0,0,0,0.1)";
          ctx.shadowBlur = 20;
          ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);
          ctx.shadowBlur = 0;
          resolve();
        };
        qrImg.src = qrDataUrl;
      });
    }

    // "Escanea para reservar"
    ctx.fillStyle = s.sub;
    ctx.font = `24px "${bodyFont}", sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText("Escanea para reservar", w - 240, h - 60);
    ctx.textAlign = "left";

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

  // Preview colors per template
  const previewStyles = getTemplateStyles(template);

  return (
    <div className="space-y-6">
      {/* Template selector */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Elige una plantilla</h3>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {TEMPLATES.map((t) => {
            const ts = getTemplateStyles(t.id);
            const bgStyle = t.id === "gradient"
              ? { background: `linear-gradient(135deg, ${pc}, ${sc})` }
              : t.id === "glass"
              ? { background: "#F8F9FA", border: `2px solid ${hexToRgba(pc, 0.3)}` }
              : { background: ts.bg };

            return (
              <button
                key={t.id}
                onClick={() => setTemplate(t.id)}
                className={cn(
                  "relative h-16 rounded-xl overflow-hidden transition-all",
                  template === t.id ? "ring-2 ring-primary shadow-lg scale-[1.02]" : "ring-1 ring-border hover:ring-muted-foreground/30"
                )}
                style={bgStyle}
              >
                <span
                  className="absolute bottom-1.5 left-2 text-[10px] font-medium"
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
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Eslogan</label>
        <Input
          value={tagline}
          onChange={(e) => setTagline(e.target.value)}
          placeholder="Reserva tu cita online"
          maxLength={50}
        />
      </div>

      {/* Preview */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div
            className="relative p-5 aspect-[3/2] flex"
            style={
              template === "gradient"
                ? { background: `linear-gradient(135deg, ${pc}, ${sc})` }
                : template === "glass"
                ? { background: "#F8F9FA", border: `2px solid ${hexToRgba(pc, 0.3)}`, borderRadius: "0.75rem" }
                : { background: previewStyles.bg }
            }
          >
            <div className="flex-1 flex flex-col justify-between min-w-0">
              <div>
                {branding.logo_url && (
                  <img
                    src={branding.logo_url}
                    alt=""
                    className="h-8 w-8 rounded-lg object-cover mb-2"
                  />
                )}
                <h3
                  className="text-base font-bold truncate"
                  style={{ color: previewStyles.text, fontFamily: `"${branding.font_heading}", sans-serif` }}
                >
                  {branding.name || "Tu Salón"}
                </h3>
                <p
                  className="text-[10px] mt-0.5"
                  style={{ color: previewStyles.sub, fontFamily: `"${branding.font_body}", sans-serif` }}
                >
                  {tagline}
                </p>
                <div className="w-8 h-0.5 rounded-full mt-2" style={{ background: previewStyles.accent }} />
              </div>
              <p
                className="text-[8px] font-mono truncate"
                style={{ color: previewStyles.accent }}
              >
                {bookingUrl.replace("https://", "")}
              </p>
            </div>
            <div className="flex items-center shrink-0">
              {qrDataUrl && (
                <div className="bg-white p-1.5 rounded-lg shadow-sm">
                  <img src={qrDataUrl} alt="QR Code" className="w-20 h-20" />
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
