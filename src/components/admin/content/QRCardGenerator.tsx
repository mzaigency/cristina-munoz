import { useState, useRef, useEffect, useCallback } from "react";
import QRCode from "qrcode";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Download,
  Share2,
  Smartphone,
  Image as ImageIcon,
  FileText,
  Sparkles,
  Copy,
  Loader2,
} from "lucide-react";
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
  { id: "salon", label: "Tu Salón", hint: "Colores de tu marca" },
  { id: "glow", label: "Glowapp", hint: "Azul y púrpura brand" },
  { id: "elegant", label: "Elegante", hint: "Crema y dorado" },
  { id: "boho", label: "Boho", hint: "Terracota y arena" },
  { id: "minimal", label: "Minimalista", hint: "Blanco y negro" },
  { id: "dark", label: "Oscuro", hint: "Negro y dorado" },
] as const;

type TemplateId = typeof TEMPLATES[number]["id"];
type Format = "card" | "a4";

const TEMPLATE_FONTS: Record<TemplateId, { heading: string; body: string }> = {
  salon: { heading: "", body: "" },
  glow: { heading: "Inter", body: "Inter" },
  elegant: { heading: "Playfair Display", body: "Cormorant Garamond" },
  boho: { heading: "DM Serif Display", body: "Karla" },
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
    case "glow":
      return { bg: "#22408b", text: "#FFFFFF", sub: "rgba(255,255,255,0.65)", accent: "#E0C8F0", qrBg: "#FFFFFF" };
    case "elegant":
      return { bg: "#FAF7F2", text: "#2C1810", sub: "#8B7355", accent: "#B8860B", qrBg: "#FFFFFF" };
    case "boho":
      return { bg: "#E8DCC8", text: "#5D3A2E", sub: "rgba(93,58,46,0.65)", accent: "#C9764D", qrBg: "#FAF1E6" };
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
  const [rendering, setRendering] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();

  const bookingUrl = `https://www.glowapp.app/${tenantSlug}`;

  // ── Load tenant branding ──
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

  // ── Load fonts ──
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

  // ── Load images ──
  useEffect(() => {
    if (!branding.logo_url) { setLogoImage(null); return; }
    loadImage(branding.logo_url).then(setLogoImage);
  }, [branding.logo_url]);

  useEffect(() => {
    loadImage(glowappLetras).then(setGlowLogoImage);
  }, []);

  // ── Generate QR ──
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
  const renderCard = useCallback(async (ctx: CanvasRenderingContext2D, s: TemplateStyle, fonts: { heading: string; body: string }) => {
    const w = 1200, h = 800;

    // Background base
    if (template === "glow") {
      const grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, "#22408b");
      grad.addColorStop(1, "#99329a");
      ctx.fillStyle = grad;
    } else {
      ctx.fillStyle = s.bg;
    }
    ctx.beginPath();
    ctx.roundRect(0, 0, w, h, 32);
    ctx.fill();

    // Per-template decoration
    if (template === "elegant") {
      // Inner border
      ctx.strokeStyle = hexToRgba("#B8860B", 0.3);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(24, 24, w - 48, h - 48, 22);
      ctx.stroke();
      // Corner ornaments
      ctx.strokeStyle = hexToRgba("#B8860B", 0.55);
      ctx.lineWidth = 1.5;
      const c = 56;
      ctx.beginPath();
      ctx.moveTo(c, 56); ctx.lineTo(c + 24, 56);
      ctx.moveTo(56, c); ctx.lineTo(56, c + 24);
      ctx.moveTo(w - c - 24, h - 56); ctx.lineTo(w - c, h - 56);
      ctx.moveTo(w - 56, h - c - 24); ctx.lineTo(w - 56, h - c);
      ctx.stroke();
    }
    if (template === "dark") {
      // Top and bottom gold bars
      const glowT = ctx.createLinearGradient(80, 0, w - 80, 0);
      glowT.addColorStop(0, "rgba(229,192,123,0)");
      glowT.addColorStop(0.5, "rgba(229,192,123,0.7)");
      glowT.addColorStop(1, "rgba(229,192,123,0)");
      ctx.fillStyle = glowT;
      ctx.fillRect(80, 26, w - 160, 1.5);
      ctx.fillRect(80, h - 28, w - 160, 1.5);
      // Vignette
      const vg = ctx.createRadialGradient(w / 2, h / 2, 100, w / 2, h / 2, w * 0.7);
      vg.addColorStop(0, "rgba(229,192,123,0.06)");
      vg.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = vg;
      ctx.fillRect(0, 0, w, h);
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
      overlay.addColorStop(0, "rgba(255,255,255,0.10)");
      overlay.addColorStop(1, "rgba(0,0,0,0.10)");
      ctx.fillStyle = overlay;
      ctx.fillRect(0, 0, w, h);
      // Accent corner glow
      const cg = ctx.createRadialGradient(w - 200, 100, 0, w - 200, 100, 400);
      cg.addColorStop(0, hexToRgba(sc, 0.18));
      cg.addColorStop(1, hexToRgba(sc, 0));
      ctx.fillStyle = cg;
      ctx.fillRect(0, 0, w, h);
    }
    if (template === "glow") {
      // Sparkle overlay
      const sp = ctx.createRadialGradient(w * 0.75, h * 0.3, 0, w * 0.75, h * 0.3, 350);
      sp.addColorStop(0, "rgba(255,255,255,0.18)");
      sp.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = sp;
      ctx.fillRect(0, 0, w, h);
      // Accent thin top line
      ctx.fillStyle = "rgba(255,255,255,0.25)";
      ctx.fillRect(80, 26, w - 160, 1);
    }
    if (template === "boho") {
      // Cream arch behind QR area
      ctx.fillStyle = hexToRgba("#C9764D", 0.12);
      ctx.beginPath();
      ctx.arc(w - 270, h / 2, 280, 0, Math.PI * 2);
      ctx.fill();
      // Wavy line top
      ctx.strokeStyle = hexToRgba("#C9764D", 0.5);
      ctx.lineWidth = 2;
      ctx.beginPath();
      const waveY = 50;
      for (let x = 80; x <= w - 80; x += 4) {
        const y = waveY + Math.sin((x - 80) * 0.05) * 4;
        if (x === 80) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
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
  }, [template, logoImage, branding.name, tagline, bookingUrl, qrDataUrl]);

  // ───────── A4 POSTER (vertical 2480x3508 @ 300dpi) ─────────
  const renderA4 = useCallback(async (ctx: CanvasRenderingContext2D, s: TemplateStyle, fonts: { heading: string; body: string }) => {
    const w = 2480, h = 3508;

    // Background base
    if (template === "glow") {
      const grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, "#22408b");
      grad.addColorStop(1, "#99329a");
      ctx.fillStyle = grad;
    } else {
      ctx.fillStyle = s.bg;
    }
    ctx.fillRect(0, 0, w, h);

    if (template === "salon") {
      const overlay = ctx.createLinearGradient(0, 0, w, h);
      overlay.addColorStop(0, "rgba(255,255,255,0.08)");
      overlay.addColorStop(1, "rgba(0,0,0,0.12)");
      ctx.fillStyle = overlay;
      ctx.fillRect(0, 0, w, h);
      const cg = ctx.createRadialGradient(w - 400, 200, 0, w - 400, 200, 800);
      cg.addColorStop(0, hexToRgba(sc, 0.18));
      cg.addColorStop(1, hexToRgba(sc, 0));
      ctx.fillStyle = cg;
      ctx.fillRect(0, 0, w, h);
    }
    if (template === "glow") {
      const sp = ctx.createRadialGradient(w * 0.78, h * 0.22, 0, w * 0.78, h * 0.22, 1100);
      sp.addColorStop(0, "rgba(255,255,255,0.18)");
      sp.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = sp;
      ctx.fillRect(0, 0, w, h);
    }
    if (template === "elegant") {
      ctx.strokeStyle = hexToRgba("#B8860B", 0.35);
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.roundRect(80, 80, w - 160, h - 160, 30);
      ctx.stroke();
      // Inner double-line
      ctx.strokeStyle = hexToRgba("#B8860B", 0.2);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(110, 110, w - 220, h - 220, 22);
      ctx.stroke();
    }
    if (template === "boho") {
      // Arch behind central QR
      ctx.fillStyle = hexToRgba("#C9764D", 0.13);
      ctx.beginPath();
      ctx.arc(w / 2, h * 0.55, 900, Math.PI, 0, false);
      ctx.fill();
      // Wavy line top + bottom
      ctx.strokeStyle = hexToRgba("#C9764D", 0.55);
      ctx.lineWidth = 4;
      for (const baseY of [180, h - 180]) {
        ctx.beginPath();
        for (let x = 200; x <= w - 200; x += 6) {
          const y = baseY + Math.sin((x - 200) * 0.012) * 12;
          if (x === 200) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
    }
    if (template === "minimal") {
      ctx.strokeStyle = "#E5E5E5";
      ctx.lineWidth = 4;
      ctx.strokeRect(40, 40, w - 80, h - 80);
    }
    if (template === "dark") {
      // Gold thin border
      ctx.strokeStyle = hexToRgba("#E5C07B", 0.4);
      ctx.lineWidth = 3;
      ctx.strokeRect(80, 80, w - 160, h - 160);
      // Vignette
      const vg = ctx.createRadialGradient(w / 2, h / 2, 200, w / 2, h / 2, w * 0.8);
      vg.addColorStop(0, "rgba(229,192,123,0.05)");
      vg.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = vg;
      ctx.fillRect(0, 0, w, h);
    }

    const centerX = w / 2;
    let y = 320;

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

    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillStyle = s.text;
    ctx.font = `bold 200px "${fonts.heading}", sans-serif`;
    ctx.fillText("RESERVA TU CITA", centerX, y);
    y += 230;

    ctx.fillStyle = s.text;
    ctx.font = `100px "${fonts.heading}", sans-serif`;
    const salonLine = `en ${branding.name || "nuestro salón"}`;
    ctx.fillText(salonLine, centerX, y);
    y += 130;
    ctx.textBaseline = "alphabetic";

    ctx.fillStyle = s.accent;
    ctx.beginPath();
    ctx.roundRect(centerX - 120, y, 240, 8, 4);
    ctx.fill();
    y += 100;

    if (qrDataUrl) {
      const qrImg = await loadImage(qrDataUrl);
      if (qrImg) {
        const qrSize = 1400;
        const qrX = centerX - qrSize / 2;
        const qrY = y;
        const pad = 60;

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

    ctx.fillStyle = s.sub;
    ctx.font = `54px "${fonts.body}", sans-serif`;
    ctx.fillText("Escanea con tu móvil", centerX, y);
    y += 90;

    ctx.fillStyle = s.accent;
    ctx.font = `bold 60px "${fonts.body}", sans-serif`;
    ctx.fillText(bookingUrl.replace("https://", ""), centerX, y);
    y += 80;

    if (tagline && tagline !== "Reserva tu cita online") {
      ctx.fillStyle = s.sub;
      ctx.font = `italic 44px "${fonts.body}", sans-serif`;
      ctx.fillText(tagline, centerX, y);
      y += 70;
    }

    const footerY = h - 240;
    ctx.strokeStyle = hexToRgba(s.text === "#FFFFFF" ? "#FFFFFF" : "#000000", 0.1);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(centerX - 400, footerY);
    ctx.lineTo(centerX + 400, footerY);
    ctx.stroke();

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
  }, [template, logoImage, branding.name, tagline, bookingUrl, qrDataUrl, glowLogoImage]);

  const renderToCanvas = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    setRendering(true);
    const isA4 = format === "a4";
    canvas.width = isA4 ? 2480 : 1200;
    canvas.height = isA4 ? 3508 : 800;

    const s = getTemplateStyles(template, pc, sc);
    const fonts = getTemplateFonts(template, branding);

    try {
      if (isA4) await renderA4(ctx, s, fonts);
      else await renderCard(ctx, s, fonts);
    } catch (e) {
      console.warn("Canvas render error:", e);
    } finally {
      setRendering(false);
    }
  }, [format, template, pc, sc, branding, renderCard, renderA4]);

  // ── Live re-render: debounced for tagline, instant for selectors ──
  useEffect(() => {
    const t = setTimeout(() => { renderToCanvas(); }, 80);
    return () => clearTimeout(t);
  }, [renderToCanvas]);

  const handleDownload = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    await renderToCanvas();
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
    const canvas = canvasRef.current;
    if (!canvas) return;
    await renderToCanvas();
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

  // ── Template thumbnail bg colors (for visual selector) ──
  const templatePreviewBgs: Record<TemplateId, string> = {
    salon: pc,
    glow: "linear-gradient(135deg, #22408b, #99329a)",
    elegant: "#FAF7F2",
    boho: "#E8DCC8",
    minimal: "#FFFFFF",
    dark: "#0F0F0F",
  };
  const templateAccents: Record<TemplateId, string> = {
    salon: sc,
    glow: "#E0C8F0",
    elegant: "#B8860B",
    boho: "#C9764D",
    minimal: "#111111",
    dark: "#E5C07B",
  };
  const templateBgForLight: Record<TemplateId, string> = {
    salon: pc, glow: "#22408b", elegant: "#FAF7F2", boho: "#E8DCC8", minimal: "#FFFFFF", dark: "#0F0F0F",
  };

  return (
    <div className="qr-gen">
      {/* ── Heading ── */}
      <div className="qr-gen-head">
        <div>
          <h2 className="text-lg font-bold">Tarjetas QR</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Genera tarjetas y carteles con tu QR de reserva
          </p>
        </div>
      </div>

      {/* ── Body: 2-col desktop, stacked mobile ── */}
      <div className="qr-gen-grid">
        {/* ── Preview (top on mobile, right on desktop, sticky) ── */}
        <div className="qr-gen-preview-wrap">
          <div className="qr-gen-preview-sticky">
            <div className="qr-gen-preview-card" data-format={format}>
              <div className="qr-gen-preview-frame">
                {rendering && (
                  <div className="qr-gen-rendering">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                )}
                <canvas
                  ref={canvasRef}
                  className="qr-gen-canvas"
                  style={{ aspectRatio: format === "a4" ? "210/297" : "3/2" }}
                />
              </div>
            </div>

            {/* Action buttons under preview */}
            <div className="qr-gen-actions">
              <Button onClick={handleDownload} className="flex-1 gap-2 h-11 gp-grad-brand">
                <Download className="h-4 w-4" />
                <span className="text-sm font-semibold">Descargar PNG</span>
              </Button>
              <Button onClick={handleShare} variant="outline" className="gap-2 h-11">
                <Share2 className="h-4 w-4" />
                <span className="text-sm font-semibold hidden sm:inline">Compartir</span>
              </Button>
            </div>

            {format === "a4" && (
              <p className="text-[11px] text-muted-foreground text-center mt-2">
                <Sparkles className="inline h-3 w-3 mr-0.5 -mt-0.5" />
                2480×3508 px @ 300 DPI · Listo para imprimir
              </p>
            )}
          </div>
        </div>

        {/* ── Controls (left on desktop, below preview on mobile) ── */}
        <div className="qr-gen-controls">
          {/* Format segmented control */}
          <section>
            <h3 className="qr-gen-label">Formato</h3>
            <div className="qr-gen-seg">
              <button
                onClick={() => setFormat("card")}
                className={cn("qr-gen-seg-btn", format === "card" && "on")}
                type="button"
              >
                <ImageIcon className="h-4 w-4" />
                <div className="text-left leading-tight">
                  <div className="text-[13px] font-semibold">Tarjeta</div>
                  <div className="text-[10px] opacity-70">Horizontal · redes</div>
                </div>
              </button>
              <button
                onClick={() => setFormat("a4")}
                className={cn("qr-gen-seg-btn", format === "a4" && "on")}
                type="button"
              >
                <FileText className="h-4 w-4" />
                <div className="text-left leading-tight">
                  <div className="text-[13px] font-semibold">Cartel A4</div>
                  <div className="text-[10px] opacity-70">Vertical · imprimir</div>
                </div>
              </button>
            </div>
          </section>

          {/* Template grid */}
          <section>
            <h3 className="qr-gen-label">Estilo</h3>
            <div className="qr-gen-tplgrid">
              {TEMPLATES.map((t) => {
                const isOn = template === t.id;
                const bgColor = templatePreviewBgs[t.id];
                const accentColor = templateAccents[t.id];
                const bgForLight = templateBgForLight[t.id];
                const isLight = isLightColor(bgForLight.startsWith("#") ? bgForLight : "#FFFFFF");
                return (
                  <button
                    key={t.id}
                    onClick={() => setTemplate(t.id)}
                    type="button"
                    className={cn("qr-gen-tpl", isOn && "on")}
                  >
                    <div
                      className="qr-gen-tpl-swatch"
                      style={{ background: bgColor }}
                    >
                      <span
                        className="qr-gen-tpl-accent"
                        style={{ background: accentColor }}
                      />
                      <span
                        className="qr-gen-tpl-dots"
                        style={{ color: isLight ? "rgba(0,0,0,.25)" : "rgba(255,255,255,.4)" }}
                      >
                        ▪ ▪ ▪
                      </span>
                    </div>
                    <div className="qr-gen-tpl-meta">
                      <div className="text-[13px] font-semibold">{t.label}</div>
                      <div className="text-[10px] text-muted-foreground">{t.hint}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Tagline */}
          <section>
            <h3 className="qr-gen-label">Eslogan</h3>
            <Input
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              placeholder="Reserva tu cita online"
              maxLength={50}
              className="h-10"
            />
            <p className="text-[10px] text-muted-foreground mt-1.5">
              {tagline.length}/50 caracteres
            </p>
          </section>

          {/* Booking link */}
          <section className="qr-gen-link-card">
            <div className="qr-gen-link-icon">
              <Smartphone className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-semibold text-foreground">Tu link de reservas</p>
              <p className="text-[11px] text-muted-foreground truncate">{bookingUrl}</p>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => { navigator.clipboard.writeText(bookingUrl); toast({ title: "Copiado" }); }}
              className="h-8 px-2.5"
            >
              <Copy className="h-3.5 w-3.5 mr-1" />
              <span className="text-[11px] font-semibold">Copiar</span>
            </Button>
          </section>
        </div>
      </div>
    </div>
  );
}
