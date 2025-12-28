import { SEO } from "@/components/SEO";
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { 
  Loader2, 
  ArrowLeft, 
  ArrowRight, 
  Check, 
  Palette, 
  Clock, 
  Scissors, 
  PartyPopper,
  Building2,
  HelpCircle,
  Layers,
  Sparkles,
  RefreshCw,
  Paintbrush,
  MapPin,
  Phone,
  Share2,
  Users,
  Type,
  Image
} from "lucide-react";
import { AppLayout } from "@/components/navigation/AppLayout";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { motion, AnimatePresence } from "motion/react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import confetti from "canvas-confetti";

import {
  BusinessTypeStep,
  LocationStep,
  ContactStep,
  SocialStep,
  StylistsStep,
  TypographyStep,
  ImagesStep,
  AIGenerationStep,
  colorPresets,
  dayNames,
  StepProps,
  ServiceForm,
} from "@/components/onboarding";

// Step: Colors only (AI generation moved to end)
function ColorsStep({ onNext, tenantId, loading, setLoading }: StepProps) {
  const [selectedColor, setSelectedColor] = useState(colorPresets[0]);
  const [useCustomColor, setUseCustomColor] = useState(false);
  const [customPrimary, setCustomPrimary] = useState("#8B5CF6");
  const [customSecondary, setCustomSecondary] = useState("#D946EF");
  const { toast } = useToast();

  const handleSave = async () => {
    setLoading(true);
    try {
      const primaryColor = useCustomColor ? customPrimary : selectedColor.primary;
      const secondaryColor = useCustomColor ? customSecondary : selectedColor.secondary;

      const { error } = await supabase
        .from("tenants")
        .update({
          primary_color: primaryColor,
          secondary_color: secondaryColor,
        })
        .eq("id", tenantId);

      if (error) throw error;
      onNext();
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al guardar",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-2 flex items-center gap-2">
          <Palette className="h-5 w-5 text-primary" />
          Paleta de colores
        </h3>
        <p className="text-sm text-muted-foreground">
          Elige los colores que representan tu marca
        </p>
      </div>

      {/* Color Selection */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">Selecciona una paleta</Label>
          <button
            type="button"
            onClick={() => setUseCustomColor(!useCustomColor)}
            className="flex items-center gap-2 text-xs text-primary hover:underline"
          >
            <Paintbrush className="h-3 w-3" />
            {useCustomColor ? "Usar paletas" : "Color personalizado"}
          </button>
        </div>

        {!useCustomColor ? (
          <div className="grid grid-cols-4 gap-2">
            {colorPresets.map((preset) => (
              <button
                key={preset.name}
                type="button"
                onClick={() => setSelectedColor(preset)}
                className={`p-2 rounded-xl border-2 transition-all ${
                  selectedColor.name === preset.name 
                    ? "border-primary ring-2 ring-primary/20" 
                    : "border-border hover:border-primary/50"
                }`}
              >
                <div 
                  className={`h-8 w-full rounded-lg bg-gradient-to-r ${preset.gradient}`}
                />
                <p className="text-[10px] text-muted-foreground mt-1 text-center">{preset.name}</p>
              </button>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 p-4 bg-secondary/30 rounded-xl">
            <div>
              <Label className="text-xs text-muted-foreground">Color principal</Label>
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="color"
                  value={customPrimary}
                  onChange={(e) => setCustomPrimary(e.target.value)}
                  className="w-12 h-10 rounded-lg cursor-pointer border-0"
                />
                <Input
                  value={customPrimary}
                  onChange={(e) => setCustomPrimary(e.target.value)}
                  className="h-10 rounded-lg font-mono text-sm"
                  placeholder="#8B5CF6"
                />
              </div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Color secundario</Label>
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="color"
                  value={customSecondary}
                  onChange={(e) => setCustomSecondary(e.target.value)}
                  className="w-12 h-10 rounded-lg cursor-pointer border-0"
                />
                <Input
                  value={customSecondary}
                  onChange={(e) => setCustomSecondary(e.target.value)}
                  className="h-10 rounded-lg font-mono text-sm"
                  placeholder="#D946EF"
                />
              </div>
            </div>
            {/* Preview */}
            <div className="col-span-2">
              <Label className="text-xs text-muted-foreground">Vista previa</Label>
              <div 
                className="h-10 w-full rounded-lg mt-1"
                style={{ 
                  background: `linear-gradient(to right, ${customPrimary}, ${customSecondary})` 
                }}
              />
            </div>
          </div>
        )}
      </div>

      <Button 
        onClick={handleSave} 
        className="w-full h-12 rounded-xl"
        disabled={loading}
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
        Continuar
        <ArrowRight className="h-4 w-4 ml-2" />
      </Button>
    </div>
  );
}

// Step: Business Hours with shifts support
function HoursStep({ onNext, onPrev, tenantId, loading, setLoading }: StepProps) {
  const [hours, setHours] = useState(
    dayNames.map((_, index) => ({
      day_of_week: index,
      is_open: index !== 0,
      morning_start: "09:00",
      morning_end: "14:00",
      afternoon_start: "16:00",
      afternoon_end: "20:00",
      has_afternoon: true,
    }))
  );
  const [selectedDaysToCopy, setSelectedDaysToCopy] = useState<number[]>([]);
  const [copyFromDay, setCopyFromDay] = useState<number | null>(null);
  const { toast } = useToast();

  const handleToggleDay = (index: number) => {
    const newHours = [...hours];
    newHours[index].is_open = !newHours[index].is_open;
    setHours(newHours);
  };

  const handleToggleAfternoon = (index: number) => {
    const newHours = [...hours];
    newHours[index].has_afternoon = !newHours[index].has_afternoon;
    setHours(newHours);
  };

  const handleTimeChange = (index: number, field: string, value: string) => {
    const newHours = [...hours];
    newHours[index] = { ...newHours[index], [field]: value };
    setHours(newHours);
  };

  const handleCopyToSelectedDays = (sourceIndex: number) => {
    if (selectedDaysToCopy.length === 0) {
      setCopyFromDay(copyFromDay === sourceIndex ? null : sourceIndex);
      return;
    }
    
    const sourceDay = hours[sourceIndex];
    const newHours = [...hours];
    selectedDaysToCopy.forEach((targetIndex) => {
      if (targetIndex !== sourceIndex) {
        newHours[targetIndex] = {
          ...newHours[targetIndex],
          is_open: sourceDay.is_open,
          morning_start: sourceDay.morning_start,
          morning_end: sourceDay.morning_end,
          afternoon_start: sourceDay.afternoon_start,
          afternoon_end: sourceDay.afternoon_end,
          has_afternoon: sourceDay.has_afternoon,
        };
      }
    });
    setHours(newHours);
    setSelectedDaysToCopy([]);
    setCopyFromDay(null);
    toast({
      title: "Horarios copiados",
      description: `Se han copiado los horarios a ${selectedDaysToCopy.length} día(s)`,
    });
  };

  const toggleDaySelection = (index: number) => {
    if (selectedDaysToCopy.includes(index)) {
      setSelectedDaysToCopy(selectedDaysToCopy.filter(i => i !== index));
    } else {
      setSelectedDaysToCopy([...selectedDaysToCopy, index]);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await supabase
        .from("tenant_business_hours")
        .delete()
        .eq("tenant_id", tenantId);

      const { error } = await supabase
        .from("tenant_business_hours")
        .insert(
          hours.map((h) => ({
            tenant_id: tenantId,
            day_of_week: h.day_of_week,
            is_open: h.is_open,
            open_time: h.is_open ? h.morning_start : null,
            close_time: h.is_open ? (h.has_afternoon ? h.afternoon_end : h.morning_end) : null,
            break_start: h.is_open && h.has_afternoon ? h.morning_end : null,
            break_end: h.is_open && h.has_afternoon ? h.afternoon_start : null,
          }))
        );

      if (error) throw error;
      onNext();
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al guardar",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-2 flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          Horarios de apertura
        </h3>
        <p className="text-sm text-muted-foreground">
          Configura tus turnos de trabajo
        </p>
      </div>

      {copyFromDay !== null && (
        <div className="bg-primary/10 border border-primary/20 rounded-xl p-3">
          <p className="text-sm text-primary font-medium text-center">
            Selecciona los días donde copiar el horario de {dayNames[copyFromDay]}
          </p>
          <div className="flex flex-wrap gap-2 justify-center mt-2">
            {dayNames.map((day, index) => (
              index !== copyFromDay && (
                <button
                  key={index}
                  onClick={() => toggleDaySelection(index)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                    selectedDaysToCopy.includes(index)
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                  }`}
                >
                  {day.slice(0, 3)}
                </button>
              )
            ))}
          </div>
          <div className="flex gap-2 mt-3 justify-center">
            <Button
              size="sm"
              onClick={() => handleCopyToSelectedDays(copyFromDay)}
              disabled={selectedDaysToCopy.length === 0}
              className="rounded-lg"
            >
              Copiar a {selectedDaysToCopy.length} día(s)
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setCopyFromDay(null);
                setSelectedDaysToCopy([]);
              }}
              className="rounded-lg"
            >
              Cancelar
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {hours.map((day, index) => (
          <div 
            key={index} 
            className={`ios-card p-4 transition-all ${
              !day.is_open ? "opacity-60" : ""
            } ${copyFromDay === index ? "ring-2 ring-primary" : ""}`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="font-medium text-foreground">{dayNames[index]}</span>
                {day.is_open && copyFromDay === null && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCopyFromDay(index)}
                    className="text-xs h-6 px-2 text-muted-foreground hover:text-primary"
                  >
                    Copiar a...
                  </Button>
                )}
              </div>
              <Switch
                checked={day.is_open}
                onCheckedChange={() => handleToggleDay(index)}
              />
            </div>
            
            {day.is_open && (
              <div className="space-y-3">
                <div className="bg-secondary/30 rounded-lg p-3">
                  <Label className="text-xs text-muted-foreground font-medium mb-2 block">
                    🌅 Turno mañana
                  </Label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">Entrada</Label>
                      <Input
                        type="time"
                        value={day.morning_start}
                        onChange={(e) => handleTimeChange(index, "morning_start", e.target.value)}
                        className="h-9 rounded-lg mt-1 text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Salida</Label>
                      <Input
                        type="time"
                        value={day.morning_end}
                        onChange={(e) => handleTimeChange(index, "morning_end", e.target.value)}
                        className="h-9 rounded-lg mt-1 text-sm"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <Label className="text-sm text-muted-foreground">¿Turno de tarde?</Label>
                  <Switch
                    checked={day.has_afternoon}
                    onCheckedChange={() => handleToggleAfternoon(index)}
                  />
                </div>

                {day.has_afternoon && (
                  <div className="bg-secondary/30 rounded-lg p-3">
                    <Label className="text-xs text-muted-foreground font-medium mb-2 block">
                      🌇 Turno tarde
                    </Label>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs text-muted-foreground">Entrada</Label>
                        <Input
                          type="time"
                          value={day.afternoon_start}
                          onChange={(e) => handleTimeChange(index, "afternoon_start", e.target.value)}
                          className="h-9 rounded-lg mt-1 text-sm"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Salida</Label>
                        <Input
                          type="time"
                          value={day.afternoon_end}
                          onChange={(e) => handleTimeChange(index, "afternoon_end", e.target.value)}
                          className="h-9 rounded-lg mt-1 text-sm"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex gap-3">
        <Button variant="outline" onClick={onPrev} className="flex-1 h-12 rounded-xl">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Atrás
        </Button>
        <Button onClick={handleSave} className="flex-1 h-12 rounded-xl" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Continuar
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}

// Step: Services
function ServicesStep({ onNext, onPrev, tenantId, loading, setLoading }: StepProps) {
  const [services, setServices] = useState<ServiceForm[]>([
    { 
      name: "", 
      price: "", 
      type: "simple", 
      duration: 30,
      duration_part1_active: 15,
      duration_exposure_pause: 30,
      duration_part2_active: 15,
    },
  ]);
  const [showCompoundHelp, setShowCompoundHelp] = useState(false);
  const { toast } = useToast();

  const addService = () => {
    setServices([
      ...services, 
      { 
        name: "", 
        price: "", 
        type: "simple", 
        duration: 30,
        duration_part1_active: 15,
        duration_exposure_pause: 30,
        duration_part2_active: 15,
      }
    ]);
  };

  const removeService = (index: number) => {
    if (services.length > 1) {
      setServices(services.filter((_, i) => i !== index));
    }
  };

  const updateService = (index: number, field: keyof ServiceForm, value: string | number) => {
    const newServices = [...services];
    newServices[index] = { ...newServices[index], [field]: value };
    setServices(newServices);
  };

  const handleSave = async () => {
    const validServices = services.filter((s) => s.name.trim());
    
    if (validServices.length === 0) {
      onNext();
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from("services")
        .insert(
          validServices.map((s) => ({
            tenant_id: tenantId,
            name: s.name.trim(),
            type: s.type,
            duration_part1_active: s.type === "simple" ? s.duration : s.duration_part1_active,
            duration_exposure_pause: s.type === "compound" ? s.duration_exposure_pause : 0,
            duration_part2_active: s.type === "compound" ? s.duration_part2_active : 0,
            price: s.price ? parseFloat(s.price) : null,
            category: "General",
          }))
        );

      if (error) throw error;
      onNext();
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al guardar",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-2 flex items-center gap-2">
          <Scissors className="h-5 w-5 text-primary" />
          Añade tus servicios
        </h3>
        <p className="text-sm text-muted-foreground">
          Servicios simples o compuestos. Podrás añadir más después.
        </p>
      </div>

      <button
        type="button"
        onClick={() => setShowCompoundHelp(!showCompoundHelp)}
        className="flex items-center gap-2 text-sm text-primary hover:underline"
      >
        <HelpCircle className="h-4 w-4" />
        ¿Qué es un servicio compuesto?
      </button>
      
      {showCompoundHelp && (
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 text-sm space-y-3">
          <div className="flex items-start gap-3">
            <Layers className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-foreground mb-2">
                Un servicio compuesto tiene 3 fases:
              </p>
              <ol className="space-y-2 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">1</span>
                  <strong className="text-foreground">Fase activa 1:</strong> Aplicar el producto
                </li>
                <li className="flex items-start gap-2">
                  <span className="bg-secondary text-secondary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">2</span>
                  <strong className="text-foreground">Pausa:</strong> Tiempo de exposición
                </li>
                <li className="flex items-start gap-2">
                  <span className="bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">3</span>
                  <strong className="text-foreground">Fase activa 2:</strong> Lavar y peinar
                </li>
              </ol>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {services.map((service, index) => (
          <div key={index} className="ios-card p-4">
            <div className="flex justify-between items-start mb-3">
              <span className="text-sm font-medium text-muted-foreground">
                Servicio {index + 1}
              </span>
              {services.length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeService(index)}
                  className="text-destructive h-8"
                >
                  Eliminar
                </Button>
              )}
            </div>
            
            <div className="space-y-4">
              <Input
                placeholder="Nombre del servicio"
                value={service.name}
                onChange={(e) => updateService(index, "name", e.target.value)}
                className="h-11 rounded-xl"
              />

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => updateService(index, "type", "simple")}
                  className={`p-3 rounded-xl border-2 transition-all text-left ${
                    service.type === "simple"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <p className="font-medium text-sm text-foreground">Simple</p>
                  <p className="text-xs text-muted-foreground">Un solo tiempo</p>
                </button>
                <button
                  type="button"
                  onClick={() => updateService(index, "type", "compound")}
                  className={`p-3 rounded-xl border-2 transition-all text-left ${
                    service.type === "compound"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <div className="flex items-center gap-1">
                    <p className="font-medium text-sm text-foreground">Compuesto</p>
                    <Layers className="h-3 w-3 text-primary" />
                  </div>
                  <p className="text-xs text-muted-foreground">3 fases</p>
                </button>
              </div>

              {service.type === "simple" ? (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">Duración (min)</Label>
                    <Input
                      type="number"
                      min={5}
                      step={5}
                      value={service.duration}
                      onChange={(e) => updateService(index, "duration", parseInt(e.target.value) || 30)}
                      className="h-10 rounded-lg mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Precio (€)</Label>
                    <Input
                      type="number"
                      min={0}
                      step={0.5}
                      placeholder="Opcional"
                      value={service.price}
                      onChange={(e) => updateService(index, "price", e.target.value)}
                      className="h-10 rounded-lg mt-1"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <Label className="text-xs text-muted-foreground">Fase 1</Label>
                      <Input
                        type="number"
                        min={5}
                        step={5}
                        value={service.duration_part1_active}
                        onChange={(e) => updateService(index, "duration_part1_active", parseInt(e.target.value) || 15)}
                        className="h-9 rounded-lg mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Pausa</Label>
                      <Input
                        type="number"
                        min={5}
                        step={5}
                        value={service.duration_exposure_pause}
                        onChange={(e) => updateService(index, "duration_exposure_pause", parseInt(e.target.value) || 30)}
                        className="h-9 rounded-lg mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Fase 2</Label>
                      <Input
                        type="number"
                        min={5}
                        step={5}
                        value={service.duration_part2_active}
                        onChange={(e) => updateService(index, "duration_part2_active", parseInt(e.target.value) || 15)}
                        className="h-9 rounded-lg mt-1"
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm bg-primary/10 rounded-lg p-2">
                    <span className="text-muted-foreground">Total:</span>
                    <span className="font-medium text-primary">
                      {service.duration_part1_active + service.duration_exposure_pause + service.duration_part2_active} min
                    </span>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Precio (€)</Label>
                    <Input
                      type="number"
                      min={0}
                      step={0.5}
                      placeholder="Opcional"
                      value={service.price}
                      onChange={(e) => updateService(index, "price", e.target.value)}
                      className="h-10 rounded-lg mt-1"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        <Button
          variant="outline"
          onClick={addService}
          className="w-full h-11 rounded-xl border-dashed"
        >
          + Añadir otro servicio
        </Button>
      </div>

      <div className="flex gap-3">
        <Button variant="outline" onClick={onPrev} className="flex-1 h-12 rounded-xl">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Atrás
        </Button>
        <Button onClick={handleSave} className="flex-1 h-12 rounded-xl" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Continuar
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}

// Success Step
function SuccessStep({ tenantSlug }: { tenantSlug: string }) {
  const navigate = useNavigate();

  useEffect(() => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    });
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center py-8"
    >
      <div className="w-20 h-20 rounded-full gradient-primary flex items-center justify-center mx-auto mb-6">
        <PartyPopper className="h-10 w-10 text-primary-foreground" />
      </div>
      
      <h2 className="text-2xl font-bold text-foreground mb-3">
        ¡Tu salón está listo!
      </h2>
      <p className="text-muted-foreground mb-8 max-w-sm mx-auto">
        Tu landing page profesional está creada. Ahora puedes empezar a recibir reservas online.
      </p>

      <div className="space-y-3">
        <Button
          onClick={() => navigate(`/salon/${tenantSlug}`)}
          className="w-full h-12 rounded-xl gradient-primary text-primary-foreground"
        >
          <Building2 className="h-4 w-4 mr-2" />
          Ver mi landing page
        </Button>
        <Button
          variant="outline"
          onClick={() => navigate(`/admin/${tenantSlug}`)}
          className="w-full h-12 rounded-xl"
        >
          Ir al panel de administración
        </Button>
      </div>
    </motion.div>
  );
}

export default function OnboardingSetup() {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [tenantSlug, setTenantSlug] = useState<string | null>(null);
  const [tenantName, setTenantName] = useState<string>("Mi Salón");
  const [initializing, setInitializing] = useState(true);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  // Define all steps with their icons
  const steps = [
    { title: "Negocio", icon: Building2 },
    { title: "Colores", icon: Palette },
    { title: "Tipografía", icon: Type },
    { title: "Imágenes", icon: Image },
    { title: "Ubicación", icon: MapPin },
    { title: "Contacto", icon: Phone },
    { title: "Redes", icon: Share2 },
    { title: "Horarios", icon: Clock },
    { title: "Servicios", icon: Scissors },
    { title: "Equipo", icon: Users },
    { title: "IA", icon: Sparkles },
    { title: "¡Listo!", icon: PartyPopper },
  ];

  const totalSteps = steps.length - 1; // Exclude success step from count

  useEffect(() => {
    const initSetup = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth?redirect=/onboarding");
        return;
      }

      const isDemo = searchParams.get("demo") === "true";
      
      if (isDemo) {
        const { data: isSuperadmin } = await supabase.rpc('is_superadmin');
        if (!isSuperadmin) {
          toast({
            title: "Acceso denegado",
            description: "Solo superadmins pueden usar el modo demo",
            variant: "destructive",
          });
          navigate("/");
          return;
        }
        
        try {
          const demoSlug = `demo-${Date.now()}`;
          const { data, error } = await supabase.functions.invoke("provision-business", {
            body: {
              businessName: "Salón Demo",
              businessSlug: demoSlug,
              email: session.user.email,
              plan: "demo",
              skipStripe: true,
            },
          });

          if (error) throw error;
          if (data?.error) throw new Error(data.error);

          setTenantId(data.tenant.id);
          setTenantSlug(data.tenant.slug);
          setTenantName(data.tenant.name || "Salón Demo");
          setInitializing(false);

          toast({
            title: "Modo Demo",
            description: "Salón de prueba creado. Puedes probar el wizard.",
          });
          return;
        } catch (error: unknown) {
          toast({
            title: "Error",
            description: error instanceof Error ? error.message : "Error al crear salón demo",
            variant: "destructive",
          });
          navigate("/");
          return;
        }
      }

      const { data: existingAdmin } = await supabase
        .from("tenant_admins")
        .select("tenant_id, tenants(id, slug, name)")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (existingAdmin?.tenant_id) {
        setTenantId(existingAdmin.tenant_id);
        const tenant = existingAdmin.tenants as unknown as { slug: string; name: string };
        setTenantSlug(tenant?.slug || "");
        setTenantName(tenant?.name || "Mi Salón");
        setStep(totalSteps);
      } else {
        const sessionId = searchParams.get("session_id");
        if (!sessionId) {
          navigate("/onboarding");
          return;
        }

        try {
          const businessName = localStorage.getItem("onboarding_business_name") || "Mi Salón";
          const businessSlug = localStorage.getItem("onboarding_business_slug") || `salon-${Date.now()}`;
          
          const { data, error } = await supabase.functions.invoke("provision-business", {
            body: {
              businessName,
              businessSlug,
              email: session.user.email,
              plan: localStorage.getItem("onboarding_plan") || "monthly",
            },
          });

          if (error) throw error;
          if (data?.error) throw new Error(data.error);

          setTenantId(data.tenant.id);
          setTenantSlug(data.tenant.slug);
          setTenantName(data.tenant.name || businessName);

          localStorage.removeItem("onboarding_business_name");
          localStorage.removeItem("onboarding_business_slug");
          localStorage.removeItem("onboarding_plan");

          toast({
            title: "¡Salón creado!",
            description: "Ahora personaliza tu landing page",
          });
        } catch (error: unknown) {
          toast({
            title: "Error",
            description: error instanceof Error ? error.message : "Error al crear el salón",
            variant: "destructive",
          });
          navigate("/onboarding");
          return;
        }
      }

      setInitializing(false);
    };

    initSetup();
  }, [navigate, searchParams, toast, totalSteps]);

  if (initializing) {
    return (
      <AppLayout hideNavigation>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Preparando tu salón...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  const renderStep = () => {
    if (!tenantId) return null;

    const stepProps: StepProps = {
      onNext: () => setStep(step + 1),
      onPrev: step > 0 ? () => setStep(step - 1) : undefined,
      tenantId,
      tenantName,
      loading,
      setLoading,
    };

    switch (step) {
      case 0:
        return <BusinessTypeStep {...stepProps} tenantName={tenantName} setTenantName={setTenantName} />;
      case 1:
        return <ColorsStep {...stepProps} />;
      case 2:
        return <TypographyStep {...stepProps} />;
      case 3:
        return <ImagesStep {...stepProps} />;
      case 4:
        return <LocationStep {...stepProps} />;
      case 5:
        return <ContactStep {...stepProps} />;
      case 6:
        return <SocialStep {...stepProps} />;
      case 7:
        return <HoursStep {...stepProps} />;
      case 8:
        return <ServicesStep {...stepProps} />;
      case 9:
        return <StylistsStep {...stepProps} />;
      case 10:
        return <AIGenerationStep {...stepProps} />;
      case 11:
        return tenantSlug ? <SuccessStep tenantSlug={tenantSlug} /> : null;
      default:
        return null;
    }
  };

  return (
    <AppLayout hideNavigation>
      <SEO
        title="Configura tu Perfil - GlowUp"
        description="Personaliza tu perfil profesional en GlowUp"
        canonicalUrl="/onboarding/setup"
        noindex
      />

      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/50 safe-area-top">
        <div className="px-4 py-3 flex items-center gap-3">
          {step < totalSteps && (
            <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          <div className="flex-1">
            <h1 className="font-semibold text-foreground">Configura tu salón</h1>
            {step < totalSteps && (
              <p className="text-xs text-muted-foreground">
                Paso {step + 1} de {totalSteps}
              </p>
            )}
          </div>
        </div>

        {/* Progress */}
        {step < totalSteps && (
          <div className="px-4 pb-3">
            <div className="flex gap-1">
              {steps.slice(0, totalSteps).map((_, index) => (
                <div
                  key={index}
                  className={`h-1 flex-1 rounded-full transition-colors ${
                    index <= step ? "bg-primary" : "bg-secondary"
                  }`}
                />
              ))}
            </div>
            <div className="flex items-center justify-center mt-2 gap-1">
              {(() => {
                const StepIcon = steps[step].icon;
                return <StepIcon className="h-4 w-4 text-primary" />;
              })()}
              <span className="text-sm font-medium text-primary">
                {steps[step].title}
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="px-4 py-6 pb-24">
        <div className="max-w-lg mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              {renderStep()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </AppLayout>
  );
}
