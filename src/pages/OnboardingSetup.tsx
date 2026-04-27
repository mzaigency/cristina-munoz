import { SEO } from "@/components/SEO";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
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
  Users,
  Image,
  SkipForward,
  Wand2,
  Mail,
  Camera,
} from "lucide-react";
import { AppLayout } from "@/components/navigation/AppLayout";
import { motion, AnimatePresence } from "motion/react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import confetti from "canvas-confetti";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import {
  BusinessTypeStep,
  StylistsStep,
  ImagesStep,
  AIGenerationStep,
  colorPresets,
  dayNames,
  StepProps,
  ServiceForm,
  BusinessInfoStep,
  DesignStep,
  getSuggestedServices,
  businessTypeLabels,
} from "@/components/onboarding";

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
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-1 flex items-center gap-2">
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
interface ServicesStepProps extends StepProps {
  businessType?: string;
}

const EMPTY_SERVICE: ServiceForm = {
  name: "",
  price: "",
  type: "simple",
  duration: 30,
  duration_part1_active: 15,
  duration_exposure_pause: 30,
  duration_part2_active: 15,
  category: "",
};

function ServicesStep({ onNext, onPrev, tenantId, tenantName, loading, setLoading, businessType }: ServicesStepProps) {
  const suggested = getSuggestedServices(businessType);
  const businessLabel = businessType ? businessTypeLabels[businessType] : undefined;

  const [services, setServices] = useState<ServiceForm[]>(
    suggested && suggested.length > 0 ? suggested : [{ ...EMPTY_SERVICE }]
  );
  const [usingSuggestions, setUsingSuggestions] = useState(
    Boolean(suggested && suggested.length > 0)
  );
  const [showCompoundHelp, setShowCompoundHelp] = useState(false);
  const { toast } = useToast();

  const addService = () => {
    setServices([
      ...services,
      { ...EMPTY_SERVICE },
    ]);
  };

  const startFromScratch = () => {
    setServices([{ ...EMPTY_SERVICE }]);
    setUsingSuggestions(false);
  };

  const requestWhiteGloveSetup = () => {
    const subject = encodeURIComponent(
      `Configuración de servicios — ${tenantName || "mi negocio"}`
    );
    const body = encodeURIComponent(
      `Hola equipo de GlowApp,\n\nSoy ${tenantName || "[nombre del negocio]"} y me gustaría que me configuréis los servicios.\nAdjunto foto de mi lista de precios.\n\nGracias!`
    );
    window.location.href = `mailto:hola@glowapp.app?subject=${subject}&body=${body}`;
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

  const handleDurationChange = (index: number, field: keyof ServiceForm, value: string) => {
    // Allow empty string during editing
    if (value === '') {
      updateService(index, field, '' as any);
      return;
    }
    const parsed = parseInt(value);
    if (!isNaN(parsed)) {
      updateService(index, field, parsed);
    }
  };

  const handleSave = async () => {
    const validServices = services.filter((s) => s.name.trim());
    
    if (validServices.length === 0) {
      onNext();
      return;
    }

    // Validate durations are >= 1
    for (const s of validServices) {
      if (s.type === "simple") {
        if (!s.duration || Number(s.duration) < 1) {
          toast({ title: "Error", description: "La duración de cada servicio debe ser al menos 1 minuto", variant: "destructive" });
          return;
        }
      } else {
        if (!s.duration_part1_active || Number(s.duration_part1_active) < 1 ||
            !s.duration_exposure_pause || Number(s.duration_exposure_pause) < 1 ||
            !s.duration_part2_active || Number(s.duration_part2_active) < 1) {
          toast({ title: "Error", description: "Todas las fases deben ser al menos 1 minuto", variant: "destructive" });
          return;
        }
      }
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from("services")
        .insert(
          validServices.map((s) => ({
            tenant_id: tenantId,
            name: s.name.trim(),
            type: s.type === "simple" ? "Simple" : "Compuesto",
            duration_part1_active: s.type === "simple" ? Number(s.duration) : Number(s.duration_part1_active),
            duration_exposure_pause: s.type === "compound" ? Number(s.duration_exposure_pause) : 0,
            duration_part2_active: s.type === "compound" ? Number(s.duration_part2_active) : 0,
            price: s.price ? parseFloat(s.price) : null,
            category: s.category.trim() || "General",
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
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-1 flex items-center gap-2">
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  placeholder="Nombre del servicio"
                  value={service.name}
                  onChange={(e) => updateService(index, "name", e.target.value)}
                  className="h-11 rounded-xl"
                />
                <Input
                  placeholder="Categoría (ej: Corte, Color...)"
                  value={service.category}
                  onChange={(e) => updateService(index, "category", e.target.value)}
                  className="h-11 rounded-xl"
                />
              </div>

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
                      onChange={(e) => handleDurationChange(index, "duration", e.target.value)}
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
                        onChange={(e) => handleDurationChange(index, "duration_part1_active", e.target.value)}
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
                        onChange={(e) => handleDurationChange(index, "duration_exposure_pause", e.target.value)}
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
                        onChange={(e) => handleDurationChange(index, "duration_part2_active", e.target.value)}
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

// Combined Services + Hours step with tabs
function ServicesAndHoursStep({ onNext, onPrev, tenantId, tenantName, loading, setLoading }: StepProps) {
  const [activeTab, setActiveTab] = useState("services");
  const [servicesCompleted, setServicesCompleted] = useState(false);

  if (activeTab === "services" && !servicesCompleted) {
    return (
      <ServicesStep
        onNext={() => {
          setServicesCompleted(true);
          setActiveTab("hours");
        }}
        onPrev={onPrev}
        tenantId={tenantId}
        tenantName={tenantName}
        loading={loading}
        setLoading={setLoading}
      />
    );
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={() => { setServicesCompleted(false); setActiveTab("services"); }}
          className={cn(
            "flex-1 py-2 rounded-lg text-sm font-medium transition-all text-center",
            activeTab === "services" ? "bg-primary text-primary-foreground" : "bg-secondary/50 text-muted-foreground"
          )}
        >
          <Scissors className="h-3.5 w-3.5 inline mr-1" />
          Servicios ✓
        </button>
        <button
          onClick={() => setActiveTab("hours")}
          className={cn(
            "flex-1 py-2 rounded-lg text-sm font-medium transition-all text-center",
            activeTab === "hours" ? "bg-primary text-primary-foreground" : "bg-secondary/50 text-muted-foreground"
          )}
        >
          <Clock className="h-3.5 w-3.5 inline mr-1" />
          Horarios
        </button>
      </div>
      <HoursStep
        onNext={onNext}
        onPrev={() => { setServicesCompleted(false); setActiveTab("services"); }}
        tenantId={tenantId}
        tenantName={tenantName}
        loading={loading}
        setLoading={setLoading}
      />
    </div>
  );
}

// Combined Images + Stylists step
function ContentStep({ onNext, onPrev, tenantId, tenantName, loading, setLoading, maxStylists }: StepProps) {
  const [activeTab, setActiveTab] = useState("images");
  const [imagesCompleted, setImagesCompleted] = useState(false);

  if (activeTab === "images" && !imagesCompleted) {
    return (
      <ImagesStep
        onNext={() => {
          setImagesCompleted(true);
          setActiveTab("team");
        }}
        onPrev={onPrev}
        tenantId={tenantId}
        tenantName={tenantName}
        loading={loading}
        setLoading={setLoading}
      />
    );
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={() => { setImagesCompleted(false); setActiveTab("images"); }}
          className={cn(
            "flex-1 py-2 rounded-lg text-sm font-medium transition-all text-center",
            activeTab === "images" ? "bg-primary text-primary-foreground" : "bg-secondary/50 text-muted-foreground"
          )}
        >
          <Image className="h-3.5 w-3.5 inline mr-1" />
          Imágenes ✓
        </button>
        <button
          onClick={() => setActiveTab("team")}
          className={cn(
            "flex-1 py-2 rounded-lg text-sm font-medium transition-all text-center",
            activeTab === "team" ? "bg-primary text-primary-foreground" : "bg-secondary/50 text-muted-foreground"
          )}
        >
          <Users className="h-3.5 w-3.5 inline mr-1" />
          Equipo
        </button>
      </div>
      <StylistsStep
        onNext={onNext}
        onPrev={() => { setImagesCompleted(false); setActiveTab("images"); }}
        tenantId={tenantId}
        tenantName={tenantName}
        loading={loading}
        setLoading={setLoading}
        maxStylists={maxStylists}
      />
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
      className="text-center py-10"
    >
      <div className="w-24 h-24 rounded-[28px] liquid-glass-card flex items-center justify-center mx-auto mb-8">
        <motion.div
          animate={{ rotate: [0, -10, 10, -5, 5, 0] }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          <PartyPopper className="h-10 w-10 text-primary" />
        </motion.div>
      </div>
      
      <h2 className="text-2xl font-bold text-foreground mb-2">
        ¡Tu salón está listo!
      </h2>
      <p className="text-sm text-muted-foreground mb-8 max-w-xs mx-auto leading-relaxed">
        Tu landing page profesional está creada. Ya puedes empezar a recibir reservas.
      </p>

      <div className="space-y-3">
        <Button
          onClick={() => navigate(`/${tenantSlug}`)}
          className="w-full h-12 rounded-2xl gradient-primary text-primary-foreground shadow-lg shadow-primary/20"
        >
          <Building2 className="h-4 w-4 mr-2" />
          Ver mi landing page
        </Button>
        <Button
          variant="outline"
          onClick={() => navigate(`/admin/${tenantSlug}`)}
          className="w-full h-12 rounded-2xl bg-white/5 backdrop-blur-sm border-white/10"
        >
          Ir al panel de administración
        </Button>
      </div>
    </motion.div>
  );
}

// Microcopy motivacional por paso
const stepMicrocopy = [
  "Empecemos con lo básico 💪",
  "Para que tus clientes te encuentren",
  "Logo, fotos y tu equipo",
  "¿Qué ofreces y cuándo?",
  "Dale personalidad a tu página ✨",
  "La IA creará tu contenido",
];

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

  // 6 grouped steps + success
  const steps = [
    { title: "Tu negocio", icon: Building2 },
    { title: "Datos de contacto", icon: Users },
    { title: "Tu contenido", icon: Image },
    { title: "Servicios y horarios", icon: Scissors },
    { title: "Diseño", icon: Palette },
    { title: "Generar con IA", icon: Sparkles },
    { title: "¡Listo!", icon: PartyPopper },
  ];

  const totalSteps = steps.length - 1; // Exclude success

  // Skippable steps (indices)
  const skippableSteps = [1, 2]; // Datos de contacto, Tu contenido

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
            <div className="w-16 h-16 rounded-2xl liquid-glass-card flex items-center justify-center mx-auto mb-4">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
            <p className="text-sm text-muted-foreground">Preparando tu salón...</p>
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
        return <BusinessInfoStep {...stepProps} />;
      case 2:
        return <ContentStep {...stepProps} />;
      case 3:
        return <ServicesAndHoursStep {...stepProps} />;
      case 4:
        return <DesignStep {...stepProps} tenantName={tenantName} />;
      case 5:
        return <AIGenerationStep {...stepProps} />;
      case 6:
        return tenantSlug ? <SuccessStep tenantSlug={tenantSlug} /> : null;
      default:
        return null;
    }
  };

  const isSkippable = skippableSteps.includes(step);

  return (
    <AppLayout hideNavigation>
      <SEO
        title="Configura tu Perfil - GlowApp"
        description="Personaliza tu perfil profesional en GlowApp"
        canonicalUrl="/onboarding/setup"
        noindex
      />

      {/* Compact Header */}
      <div 
        className="sticky top-0 z-40 bg-background/80 backdrop-blur-2xl border-b border-white/10"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <div className="px-4 py-3">
          {/* Row 1: back + step counter + actions */}
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2">
              {(step > 0 && step < totalSteps) ? (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setStep(step - 1)}
                  className="h-8 w-8 rounded-full shrink-0 bg-white/5 hover:bg-white/10"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              ) : step === 0 ? (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => navigate("/")}
                  className="h-8 w-8 rounded-full shrink-0 bg-white/5 hover:bg-white/10"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              ) : null}
              {step < totalSteps && (
                <span className="text-xs text-muted-foreground">
                  Paso <span className="font-bold text-primary">{step + 1}</span>/{totalSteps}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              {isSkippable && (
                <button
                  onClick={() => setStep(step + 1)}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors px-2 py-1 rounded-lg hover:bg-primary/5"
                >
                  <SkipForward className="h-3 w-3" />
                  Saltar
                </button>
              )}
              {step < totalSteps && (
                <button
                  onClick={() => {
                    const subject = encodeURIComponent("Ayuda con: Configuración de salón");
                    window.location.href = `mailto:contacto@glowapp.app?subject=${subject}`;
                  }}
                  className="p-1.5 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors"
                  aria-label="Ayuda"
                >
                  <HelpCircle className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Row 2: step title */}
          <div className="mb-2">
            <h1 className="font-semibold text-sm text-foreground truncate">
              {step < totalSteps ? steps[step].title : "¡Completado!"}
            </h1>
            {step < totalSteps && (
              <p className="text-[11px] text-muted-foreground truncate">
                {stepMicrocopy[step]}
              </p>
            )}
          </div>

          {step < totalSteps && (
            <div className="relative h-1.5 bg-white/5 rounded-full overflow-hidden">
              <motion.div 
                className="absolute inset-y-0 left-0 rounded-full"
                style={{
                  background: "linear-gradient(90deg, hsl(var(--primary)), hsl(var(--primary) / 0.7))",
                }}
                initial={{ width: 0 }}
                animate={{ width: `${((step + 1) / totalSteps) * 100}%` }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              />
            </div>
          )}
        </div>
      </div>

      <div className="px-4 py-6 pb-24">
        <div className="max-w-lg mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            >
              {renderStep()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </AppLayout>
  );
}
