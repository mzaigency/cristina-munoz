import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Sparkles, RefreshCw, Check, Wand2, Edit3 } from "lucide-react";
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

interface BrandingData {
  tagline: string;
  description: string;
  seoTitle: string;
  seoDescription: string;
  faqs: Array<{ question: string; answer: string }>;
  brandTone: string;
}

export function AIGenerationStep({ tenantId, onNext, loading, setLoading }: StepProps) {
  const [generating, setGenerating] = useState(false);
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

      toast.success("¡Contenido generado con IA!");
    } catch (error: unknown) {
      console.error("Error generating branding:", error);
      toast.error(error instanceof Error ? error.message : "Error al generar contenido");
    } finally {
      setGenerating(false);
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
      // Update tenant with final content
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

      // Activate tenant — setup is complete
      await activateTenant();
      
      toast.success("¡Contenido guardado!");
      onNext();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Error al guardar");
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    // Activate tenant even when skipping AI generation
    await activateTenant();
    onNext();
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center mx-auto mb-4"
        >
          <Wand2 className="w-8 h-8 text-white" />
        </motion.div>
        <h2 className="text-2xl font-bold">Generación con IA</h2>
        <p className="text-muted-foreground">
          Usaremos toda la información que has proporcionado para crear contenido único para tu landing
        </p>
      </div>

      {!generated ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <Card className="p-6 border-dashed border-2 border-primary/30 bg-primary/5">
            <div className="text-center space-y-4">
              <div className="space-y-2">
                <h3 className="font-semibold">¿Qué generará la IA?</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>✨ Eslogan único para tu negocio</li>
                  <li>📝 Descripción atractiva para la web</li>
                  <li>❓ Preguntas frecuentes personalizadas</li>
                  <li>🔍 Contenido SEO optimizado</li>
                </ul>
              </div>
              
              <p className="text-xs text-muted-foreground">
                Basado en: tipo de negocio, servicios, horarios, ubicación y equipo
              </p>
            </div>
          </Card>

          <Button
            onClick={generateBranding}
            disabled={generating}
            className="w-full h-14 text-lg rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700"
            size="lg"
          >
            {generating ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Generando contenido...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-2" />
                Generar con IA
              </>
            )}
          </Button>

          <Button
            variant="ghost"
            onClick={handleSkip}
            className="w-full text-muted-foreground"
          >
            Omitir este paso
          </Button>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {/* Success indicator */}
          <div className="flex items-center justify-center gap-2 text-green-600 bg-green-50 dark:bg-green-950/30 rounded-xl py-3">
            <Check className="w-5 h-5" />
            <span className="font-medium">Contenido generado con éxito</span>
          </div>

          {/* Generated content preview */}
          <Card className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <Label className="font-semibold">Eslogan</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditMode(!editMode)}
                className="h-8"
              >
                <Edit3 className="w-4 h-4 mr-1" />
                {editMode ? "Vista previa" : "Editar"}
              </Button>
            </div>
            
            {editMode ? (
              <Input
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                className="text-lg font-medium"
              />
            ) : (
              <p className="text-lg font-medium text-primary">"{tagline}"</p>
            )}

            <div>
              <Label className="font-semibold">Descripción</Label>
              {editMode ? (
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="mt-2 min-h-[80px]"
                />
              ) : (
                <p className="text-muted-foreground mt-1">{description}</p>
              )}
            </div>

            {branding?.faqs && branding.faqs.length > 0 && (
              <div className="pt-2">
                <Label className="font-semibold mb-2 block">Preguntas Frecuentes</Label>
                <Accordion type="single" collapsible className="w-full">
                  {branding.faqs.map((faq, index) => (
                    <AccordionItem key={index} value={`faq-${index}`} className="border-b">
                      <AccordionTrigger className="text-sm text-left hover:no-underline py-3">
                        {faq.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-sm text-muted-foreground pb-3">
                        {faq.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            )}

            {branding?.brandTone && (
              <div className="pt-2 border-t">
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium">Tono recomendado:</span> {branding.brandTone}
                </p>
              </div>
            )}
          </Card>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={generateBranding}
              disabled={generating}
              className="flex-1 rounded-xl"
            >
              {generating ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              Regenerar
            </Button>
            <Button
              onClick={handleSave}
              disabled={loading}
              className="flex-1 rounded-xl"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Check className="w-4 h-4 mr-2" />
              )}
              Guardar y continuar
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
