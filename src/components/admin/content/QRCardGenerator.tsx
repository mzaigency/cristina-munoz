import { useState, useRef, useEffect } from "react";
import QRCode from "qrcode";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Download, Share2, Smartphone, Printer } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface QRCardGeneratorProps {
  tenantId: string;
  tenantSlug: string;
}

const TEMPLATES = [
  { id: "minimal", label: "Minimal", bg: "from-white to-gray-50", text: "text-gray-900", accent: "#8B5CF6" },
  { id: "dark", label: "Elegante", bg: "from-gray-900 to-gray-800", text: "text-white", accent: "#F59E0B" },
  { id: "brand", label: "Marca", bg: "from-primary to-primary/80", text: "text-primary-foreground", accent: "#FFFFFF" },
  { id: "nature", label: "Natural", bg: "from-emerald-50 to-teal-50", text: "text-emerald-900", accent: "#059669" },
] as const;

export function QRCardGenerator({ tenantId, tenantSlug }: QRCardGeneratorProps) {
  const [template, setTemplate] = useState<string>("minimal");
  const [tagline, setTagline] = useState("Reserva tu cita online");
  const [tenantName, setTenantName] = useState("");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();

  const bookingUrl = `https://www.glowapp.app/${tenantSlug}`;

  useEffect(() => {
    const fetchTenant = async () => {
      const { data } = await supabase
        .from("tenants")
        .select("name, logo_url")
        .eq("id", tenantId)
        .single();
      if (data) {
        setTenantName(data.name);
        setLogoUrl(data.logo_url);
      }
    };
    fetchTenant();
  }, [tenantId]);

  useEffect(() => {
    QRCode.toDataURL(bookingUrl, {
      width: 200,
      margin: 2,
      color: { dark: "#000000", light: "#FFFFFF" },
      errorCorrectionLevel: "H",
    }).then(setQrDataUrl);
  }, [bookingUrl]);

  const selectedTemplate = TEMPLATES.find((t) => t.id === template) || TEMPLATES[0];

  const generateCard = async (): Promise<HTMLCanvasElement | null> => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    const w = 600;
    const h = 400;
    canvas.width = w;
    canvas.height = h;

    // Background
    ctx.fillStyle = template === "dark" ? "#1F2937" : template === "brand" ? "#8B5CF6" : template === "nature" ? "#ECFDF5" : "#FFFFFF";
    ctx.beginPath();
    ctx.roundRect(0, 0, w, h, 16);
    ctx.fill();

    // Border
    ctx.strokeStyle = "rgba(0,0,0,0.1)";
    ctx.lineWidth = 1;
    ctx.stroke();

    const textColor = template === "dark" || template === "brand" ? "#FFFFFF" : "#111827";
    const subtextColor = template === "dark" || template === "brand" ? "rgba(255,255,255,0.7)" : "#6B7280";

    // Left side content
    ctx.fillStyle = textColor;
    ctx.font = "bold 28px -apple-system, BlinkMacSystemFont, sans-serif";
    ctx.fillText(tenantName || "Tu Salón", 40, 80);

    ctx.fillStyle = subtextColor;
    ctx.font = "16px -apple-system, BlinkMacSystemFont, sans-serif";
    ctx.fillText(tagline, 40, 115);

    // URL
    ctx.fillStyle = selectedTemplate.accent;
    ctx.font = "bold 14px -apple-system, BlinkMacSystemFont, sans-serif";
    ctx.fillText(bookingUrl.replace("https://", ""), 40, h - 40);

    // QR Code on right side
    if (qrDataUrl) {
      const qrImg = new Image();
      qrImg.crossOrigin = "anonymous";
      await new Promise<void>((resolve) => {
        qrImg.onload = () => {
          const qrSize = 180;
          const qrX = w - qrSize - 40;
          const qrY = (h - qrSize) / 2;
          
          // White background for QR
          ctx.fillStyle = "#FFFFFF";
          ctx.beginPath();
          ctx.roundRect(qrX - 10, qrY - 10, qrSize + 20, qrSize + 20, 12);
          ctx.fill();
          
          ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);
          resolve();
        };
        qrImg.src = qrDataUrl;
      });
    }

    // "Escanea para reservar" text under QR
    ctx.fillStyle = subtextColor;
    ctx.font = "12px -apple-system, BlinkMacSystemFont, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Escanea para reservar", w - 130, h - 30);
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

    toast({ title: "Descargado", description: "Tarjeta guardada como PNG" });
  };

  const handleShare = async () => {
    const canvas = await generateCard();
    if (!canvas) return;

    canvas.toBlob(async (blob) => {
      if (!blob) return;
      if (navigator.share) {
        const file = new File([blob], `tarjeta-${tenantSlug}.png`, { type: "image/png" });
        await navigator.share({ files: [file], title: tenantName, text: tagline });
      } else {
        await navigator.clipboard.writeText(bookingUrl);
        toast({ title: "Link copiado", description: "El enlace de reserva se copió al portapapeles" });
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Template selector */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Elige una plantilla</h3>
        <div className="grid grid-cols-2 gap-3">
          {TEMPLATES.map((t) => (
            <button
              key={t.id}
              onClick={() => setTemplate(t.id)}
              className={cn(
                "relative h-20 rounded-xl bg-gradient-to-br overflow-hidden border-2 transition-all",
                t.bg,
                template === t.id ? "border-primary shadow-lg scale-[1.02]" : "border-transparent hover:border-muted-foreground/30"
              )}
            >
              <span className={cn("absolute bottom-2 left-3 text-xs font-medium", t.text)}>{t.label}</span>
            </button>
          ))}
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
            className={cn(
              "relative p-6 bg-gradient-to-br aspect-[3/2] flex",
              selectedTemplate.bg
            )}
          >
            <div className="flex-1 flex flex-col justify-between">
              <div>
                <h3 className={cn("text-lg font-bold", selectedTemplate.text)}>{tenantName || "Tu Salón"}</h3>
                <p className={cn("text-xs mt-1 opacity-70", selectedTemplate.text)}>{tagline}</p>
              </div>
              <p className="text-[10px] font-mono opacity-60" style={{ color: selectedTemplate.accent }}>
                {bookingUrl.replace("https://", "")}
              </p>
            </div>
            <div className="flex items-center">
              {qrDataUrl && (
                <div className="bg-white p-2 rounded-lg shadow-sm">
                  <img src={qrDataUrl} alt="QR Code" className="w-24 h-24" />
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

      {/* Hidden canvas for generation */}
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
