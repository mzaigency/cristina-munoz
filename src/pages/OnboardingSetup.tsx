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
  Building2
} from "lucide-react";
import { AppLayout } from "@/components/navigation/AppLayout";
import { motion, AnimatePresence } from "motion/react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import confetti from "canvas-confetti";

interface StepProps {
  onNext: () => void;
  onPrev?: () => void;
  tenantId: string;
  loading: boolean;
  setLoading: (loading: boolean) => void;
}

const colorPresets = [
  { primary: "#8B5CF6", secondary: "#D946EF", name: "Violeta" },
  { primary: "#3B82F6", secondary: "#06B6D4", name: "Azul" },
  { primary: "#10B981", secondary: "#34D399", name: "Esmeralda" },
  { primary: "#F59E0B", secondary: "#FBBF24", name: "Ámbar" },
  { primary: "#EF4444", secondary: "#F87171", name: "Rojo" },
  { primary: "#EC4899", secondary: "#F472B6", name: "Rosa" },
  { primary: "#1F2937", secondary: "#374151", name: "Elegante" },
  { primary: "#7C3AED", secondary: "#A78BFA", name: "Púrpura" },
];

const dayNames = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

// Step 1: Branding
function BrandingStep({ onNext, tenantId, loading, setLoading }: StepProps) {
  const [selectedColor, setSelectedColor] = useState(colorPresets[0]);
  const [tagline, setTagline] = useState("");
  const [description, setDescription] = useState("");
  const { toast } = useToast();

  const handleSave = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("tenants")
        .update({
          primary_color: selectedColor.primary,
          secondary_color: selectedColor.secondary,
          tagline: tagline || null,
          description: description || null,
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
          Personaliza tu marca
        </h3>
        <p className="text-sm text-muted-foreground">
          Elige los colores que representen tu salón
        </p>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {colorPresets.map((preset) => (
          <button
            key={preset.name}
            type="button"
            onClick={() => setSelectedColor(preset)}
            className={`p-3 rounded-xl border-2 transition-all ${
              selectedColor.name === preset.name 
                ? "border-primary ring-2 ring-primary/20" 
                : "border-border hover:border-primary/50"
            }`}
          >
            <div className="flex gap-1 mb-2">
              <div 
                className="h-6 w-6 rounded-full" 
                style={{ backgroundColor: preset.primary }} 
              />
              <div 
                className="h-6 w-6 rounded-full" 
                style={{ backgroundColor: preset.secondary }} 
              />
            </div>
            <p className="text-xs text-muted-foreground">{preset.name}</p>
          </button>
        ))}
      </div>

      <div className="space-y-4">
        <div>
          <Label>Eslogan (opcional)</Label>
          <Input
            placeholder="Tu belleza, nuestra pasión"
            value={tagline}
            onChange={(e) => setTagline(e.target.value)}
            className="h-12 rounded-xl mt-2"
          />
        </div>

        <div>
          <Label>Descripción (opcional)</Label>
          <Textarea
            placeholder="Describe brevemente tu salón..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="rounded-xl mt-2 min-h-[100px]"
          />
        </div>
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

// Step 2: Business Hours
function HoursStep({ onNext, onPrev, tenantId, loading, setLoading }: StepProps) {
  const [hours, setHours] = useState(
    dayNames.map((_, index) => ({
      day_of_week: index,
      is_open: index !== 0, // Sunday closed by default
      open_time: "09:00",
      close_time: "20:00",
      break_start: "14:00",
      break_end: "16:00",
    }))
  );
  const { toast } = useToast();

  const handleToggleDay = (index: number) => {
    const newHours = [...hours];
    newHours[index].is_open = !newHours[index].is_open;
    setHours(newHours);
  };

  const handleTimeChange = (index: number, field: string, value: string) => {
    const newHours = [...hours];
    newHours[index] = { ...newHours[index], [field]: value };
    setHours(newHours);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // Delete existing hours and insert new ones
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
            open_time: h.is_open ? h.open_time : null,
            close_time: h.is_open ? h.close_time : null,
            break_start: h.is_open ? h.break_start : null,
            break_end: h.is_open ? h.break_end : null,
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
          Configura cuándo está abierto tu salón
        </p>
      </div>

      <div className="space-y-3">
        {hours.map((day, index) => (
          <div 
            key={index} 
            className={`ios-card p-4 ${!day.is_open ? "opacity-60" : ""}`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="font-medium text-foreground">{dayNames[index]}</span>
              <Switch
                checked={day.is_open}
                onCheckedChange={() => handleToggleDay(index)}
              />
            </div>
            
            {day.is_open && (
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <Label className="text-xs text-muted-foreground">Apertura</Label>
                  <Input
                    type="time"
                    value={day.open_time}
                    onChange={(e) => handleTimeChange(index, "open_time", e.target.value)}
                    className="h-10 rounded-lg mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Cierre</Label>
                  <Input
                    type="time"
                    value={day.close_time}
                    onChange={(e) => handleTimeChange(index, "close_time", e.target.value)}
                    className="h-10 rounded-lg mt-1"
                  />
                </div>
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

// Step 3: Services
function ServicesStep({ onNext, onPrev, tenantId, loading, setLoading }: StepProps) {
  const [services, setServices] = useState([
    { name: "", duration: 30, price: "" },
  ]);
  const { toast } = useToast();

  const addService = () => {
    setServices([...services, { name: "", duration: 30, price: "" }]);
  };

  const removeService = (index: number) => {
    if (services.length > 1) {
      setServices(services.filter((_, i) => i !== index));
    }
  };

  const updateService = (index: number, field: string, value: string | number) => {
    const newServices = [...services];
    newServices[index] = { ...newServices[index], [field]: value };
    setServices(newServices);
  };

  const handleSave = async () => {
    const validServices = services.filter((s) => s.name.trim());
    
    if (validServices.length === 0) {
      // Skip if no services added
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
            duration_part1_active: s.duration,
            price: s.price ? parseFloat(s.price) : null,
            type: "simple",
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
          Puedes añadir más servicios después desde el panel de administración
        </p>
      </div>

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
            
            <div className="space-y-3">
              <Input
                placeholder="Nombre del servicio (ej: Corte de pelo)"
                value={service.name}
                onChange={(e) => updateService(index, "name", e.target.value)}
                className="h-11 rounded-xl"
              />
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
          Finalizar
          <Check className="h-4 w-4 ml-2" />
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
  const [initializing, setInitializing] = useState(true);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  useEffect(() => {
    const initSetup = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth?redirect=/onboarding");
        return;
      }

      // Check if user already has a tenant
      const { data: existingAdmin } = await supabase
        .from("tenant_admins")
        .select("tenant_id, tenants(id, slug, name)")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (existingAdmin?.tenant_id) {
        // User already has a tenant, go to success
        setTenantId(existingAdmin.tenant_id);
        const tenant = existingAdmin.tenants as unknown as { slug: string };
        setTenantSlug(tenant?.slug || "");
        setStep(3); // Go to success
      } else {
        // Need to provision the business
        const sessionId = searchParams.get("session_id");
        if (!sessionId) {
          navigate("/onboarding");
          return;
        }

        try {
          // Get stored business info and provision
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

          // Clear stored data
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
  }, [navigate, searchParams, toast]);

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

  const steps = [
    { title: "Marca", icon: Palette },
    { title: "Horarios", icon: Clock },
    { title: "Servicios", icon: Scissors },
    { title: "¡Listo!", icon: PartyPopper },
  ];

  return (
    <AppLayout hideNavigation>
      <SEO
        title="Configura tu Salón - SalonHub"
        description="Personaliza tu landing page profesional"
        canonicalUrl="/onboarding/setup"
        noindex
      />

      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/50 safe-area-top">
        <div className="px-4 py-3 flex items-center gap-3">
          {step < 3 && (
            <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          <h1 className="font-semibold text-foreground">Configura tu salón</h1>
        </div>

        {/* Progress */}
        {step < 3 && (
          <div className="px-4 pb-3">
            <div className="flex gap-2">
              {steps.slice(0, 3).map((s, index) => (
                <div
                  key={index}
                  className={`h-1 flex-1 rounded-full transition-colors ${
                    index <= step ? "bg-primary" : "bg-secondary"
                  }`}
                />
              ))}
            </div>
            <div className="flex justify-between mt-2">
              {steps.slice(0, 3).map((s, index) => (
                <span
                  key={index}
                  className={`text-xs ${
                    index === step ? "text-primary font-medium" : "text-muted-foreground"
                  }`}
                >
                  {s.title}
                </span>
              ))}
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
              {step === 0 && tenantId && (
                <BrandingStep
                  onNext={() => setStep(1)}
                  tenantId={tenantId}
                  loading={loading}
                  setLoading={setLoading}
                />
              )}
              {step === 1 && tenantId && (
                <HoursStep
                  onNext={() => setStep(2)}
                  onPrev={() => setStep(0)}
                  tenantId={tenantId}
                  loading={loading}
                  setLoading={setLoading}
                />
              )}
              {step === 2 && tenantId && (
                <ServicesStep
                  onNext={() => setStep(3)}
                  onPrev={() => setStep(1)}
                  tenantId={tenantId}
                  loading={loading}
                  setLoading={setLoading}
                />
              )}
              {step === 3 && tenantSlug && (
                <SuccessStep tenantSlug={tenantSlug} />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </AppLayout>
  );
}
