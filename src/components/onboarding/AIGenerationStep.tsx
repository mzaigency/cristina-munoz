import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Loader2, Sparkles, RefreshCw, Check, Wand2, Edit3,
  Quote, FileText, HelpCircle, Search,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { StepProps } from "./types";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { motion } from "motion/react";
import { gradientBg } from "@/components/business-landing/_landingShared";

interface BrandingData {
  tagline: string;
  description: string;
  seoTitle: string;
  seoDescription: string;
  faqs: Array<{ question: string; answer: string }>;
  brandTone: string;
}

type Field = "tagline" | "description" | "faqs";

export function AIGenerationStep({ tenantId, onNext, loading, setLoading }: StepProps) {
  const [generating, setGenerating] = useState(false);
  const [regenField, setRegenField] = useState<Field | null>(null);
  const [generated, setGenerated] = useState(false);
  const [branding, setBranding] = useState<BrandingData | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [tagline, setTagline] = useState("");
  const [description, setDescription] = useState("");

  const generateBranding = async () => {
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-tenant-branding", {
        body: { tenantId },
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Error al generar");

      const brandingData = data.branding as BrandingData;
      setBranding(brandingData);
      setTagline(brandingData.tagline || "");
      setDescription(brandingData.description || "");
      setGenerated(true);

      toast.success("Contenido generado con IA");
    } catch (error: unknown) {
      console.error("Error generating branding:", error);
      toast.error(error instanceof Error ? error.message : "Error al generar contenido");
    } finally {
      setGenerating(false);
    }
  };

  const regenerateField = async (field: Field) => {
    setRegenField(field);
    try {
      const { data, error } = await supabase.functions.invoke("generate-tenant-branding", {
        body: { tenantId, only: field, regenerate: true },
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Error al regenerar");

      const b = data.branding as Partial<BrandingData>;
      if (field === "tagline" && b.tagline) setTagline(b.tagline);
      if (field === "description" && b.description) setDescription(b.description);
      if (field === "faqs" && b.faqs) setBranding((prev) => (prev ? { ...prev, faqs: b.faqs! } : prev));
      toast.success("Nueva versión lista");
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Error al regenerar");
    } finally {
      setRegenField(null);
    }
  };

  const activateTenant = async () => {
    const { error } = await supabase
      .from("tenants")
      .update({ is_active: true })
      .eq("id", tenantId);
    if (error) console.error("Error activating tenant:", error);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const { data: updated, error } = await supabase
        .from("tenants")
        .update({
          tagline: tagline || branding?.tagline,
          description: description || branding?.description,
        })
        .eq("id", tenantId)
        .select("id");

      if (error) throw error;
      if (!updated || updated.length === 0) {
        throw new Error("No se ha podido guardar el contenido (sin permisos).");
      }

      await activateTenant();
      toast.success("Contenido guardado");
      onNext();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Error al guardar");
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    await activateTenant();
    onNext();
  };

  const WILL_GENERATE = [
    { Icon: Quote, label: "Un eslogan con la voz de tu marca" },
    { Icon: FileText, label: "Descripción para tu web" },
    { Icon: HelpCircle, label: "Preguntas frecuentes personalizadas" },
    { Icon: Search, label: "Contenido optimizado para Google" },
  ];

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl"
          style={{ backgroundImage: gradientBg }}
        >
          <Wand2 className="h-8 w-8 text-white" />
        </motion.div>
        <h2 className="text-2xl font-bold tracking-tight">Generación con IA</h2>
        <p className="mx-auto max-w-sm text-sm text-muted-foreground">
          Con lo que has rellenado creamos el contenido de tu web. Puedes editar o regenerar cada parte.
        </p>
      </div>

      {!generated ? (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <Card className="border-2 border-dashed border-primary/25 bg-primary/[0.03] p-6">
            <p className="mb-3 text-center text-sm font-semibold text-foreground">Qué generará la IA</p>
            <ul className="mx-auto max-w-xs space-y-2.5">
              {WILL_GENERATE.map(({ Icon, label }) => (
                <li key={label} className="flex items-center gap-3">
                  <span className="flex h-7 w-7 flex-none items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="text-sm text-muted-foreground">{label}</span>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-center text-xs text-muted-foreground">
              A partir de tu tipo de negocio, servicios, horarios, ubicación y equipo.
            </p>
          </Card>

          <button
            onClick={generateBranding}
            disabled={generating}
            data-guided-cta="true"
            className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-2xl text-base font-semibold text-white shadow-lg shadow-primary/25 disabled:opacity-70"
            style={{ backgroundImage: gradientBg }}
          >
            {generating ? (
              <><Loader2 className="h-5 w-5 animate-spin" /> Generando contenido…</>
            ) : (
              <><Sparkles className="h-5 w-5" /> Generar con IA</>
            )}
          </button>

          <Button variant="ghost" onClick={handleSkip} className="w-full text-muted-foreground">
            Omitir este paso
          </Button>
        </motion.div>
      ) : (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="flex items-center justify-center gap-2 rounded-xl bg-emerald-50 py-3 text-emerald-600 dark:bg-emerald-950/30">
            <Check className="h-5 w-5" />
            <span className="font-medium">Contenido generado</span>
          </div>

          {/* Eslogan */}
          <Card className="space-y-3 p-4">
            <div className="flex items-center justify-between">
              <Label className="font-semibold">Eslogan</Label>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" className="h-8 gap-1 px-2" onClick={() => regenerateField("tagline")} disabled={regenField === "tagline"}>
                  {regenField === "tagline" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                  Regenerar
                </Button>
                <Button variant="ghost" size="sm" className="h-8 gap-1 px-2" onClick={() => setEditMode(!editMode)}>
                  <Edit3 className="h-3.5 w-3.5" />
                  {editMode ? "Vista" : "Editar"}
                </Button>
              </div>
            </div>
            {editMode ? (
              <Input value={tagline} onChange={(e) => setTagline(e.target.value)} className="text-base font-medium" />
            ) : (
              <p className="text-lg font-medium text-primary">"{tagline}"</p>
            )}
          </Card>

          {/* Descripción */}
          <Card className="space-y-3 p-4">
            <div className="flex items-center justify-between">
              <Label className="font-semibold">Descripción</Label>
              <Button variant="ghost" size="sm" className="h-8 gap-1 px-2" onClick={() => regenerateField("description")} disabled={regenField === "description"}>
                {regenField === "description" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                Regenerar
              </Button>
            </div>
            {editMode ? (
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} className="min-h-[80px]" />
            ) : (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
          </Card>

          {/* FAQs */}
          {branding?.faqs && branding.faqs.length > 0 && (
            <Card className="space-y-2 p-4">
              <div className="flex items-center justify-between">
                <Label className="font-semibold">Preguntas frecuentes</Label>
                <Button variant="ghost" size="sm" className="h-8 gap-1 px-2" onClick={() => regenerateField("faqs")} disabled={regenField === "faqs"}>
                  {regenField === "faqs" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                  Regenerar
                </Button>
              </div>
              <Accordion type="single" collapsible className="w-full">
                {branding.faqs.map((faq, index) => (
                  <AccordionItem key={index} value={`faq-${index}`} className="border-b">
                    <AccordionTrigger className="py-3 text-left text-sm hover:no-underline">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="pb-3 text-sm text-muted-foreground">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </Card>
          )}

          {/* Acciones */}
          <div className="flex gap-3">
            <Button variant="outline" onClick={generateBranding} disabled={generating} className="flex-1 rounded-xl">
              {generating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
              Regenerar todo
            </Button>
            <Button onClick={handleSave} disabled={loading} className="flex-1 rounded-xl" data-guided-cta="true">
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
              Guardar y continuar
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
