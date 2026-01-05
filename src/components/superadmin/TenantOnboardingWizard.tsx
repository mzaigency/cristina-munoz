import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import {
  Loader2,
  Building2,
  Users,
  Clock,
  ChevronRight,
  ChevronLeft,
  Check,
  Plus,
  Trash2,
  Palette,
  Scissors,
  Upload,
  UserPlus,
  Sparkles,
  MapPin,
  Phone,
  Mail,
  Instagram,
  ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "motion/react";

interface TenantOnboardingWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
}

interface Stylist {
  name: string;
  slug: string;
  color: string;
}

interface BusinessHours {
  day: number;
  dayName: string;
  isOpen: boolean;
  openTime: string;
  closeTime: string;
  breakStart: string;
  breakEnd: string;
}

interface Service {
  name: string;
  category: string;
  type: "Simple" | "Compuesto";
  durationPart1: number;
  durationPause: number;
  durationPart2: number;
  price: number;
}

const DAYS = [
  { day: 1, name: "Lunes" },
  { day: 2, name: "Martes" },
  { day: 3, name: "Miércoles" },
  { day: 4, name: "Jueves" },
  { day: 5, name: "Viernes" },
  { day: 6, name: "Sábado" },
  { day: 0, name: "Domingo" },
];

const COLORS = [
  "#8B5CF6", "#EC4899", "#3B82F6", "#10B981", "#F59E0B",
  "#EF4444", "#6366F1", "#14B8A6", "#F97316", "#84CC16",
];

const SERVICE_CATEGORIES = ["Corte", "Coloración", "Peinados", "Tratamientos", "Mechas", "Alisados", "Barba", "Otros"];

const STEPS = [
  { id: 1, title: "Datos básicos", subtitle: "Nombre y contacto", icon: Building2 },
  { id: 2, title: "Personalización", subtitle: "Colores y branding", icon: Palette },
  { id: 3, title: "Administrador", subtitle: "Credenciales de acceso", icon: UserPlus },
  { id: 4, title: "Equipo", subtitle: "Estilistas del salón", icon: Users },
  { id: 5, title: "Servicios", subtitle: "Catálogo de servicios", icon: Scissors },
  { id: 6, title: "Horarios", subtitle: "Horario de apertura", icon: Clock },
];

export function TenantOnboardingWizard({ open, onOpenChange, onComplete }: TenantOnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingHero, setUploadingHero] = useState(false);
  const [generatingBranding, setGeneratingBranding] = useState(false);
  const { toast } = useToast();

  // Step 1: Basic Info
  const [basicInfo, setBasicInfo] = useState({
    name: "",
    slug: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    postalCode: "",
    instagramUrl: "",
    whatsappNumber: "",
  });

  // Step 2: Customization
  const [customization, setCustomization] = useState({
    tagline: "",
    description: "",
    primaryColor: "#8B5CF6",
    secondaryColor: "#EC4899",
    logoUrl: "",
    heroImageUrl: "",
  });

  // Step 3: Admin
  const [adminInfo, setAdminInfo] = useState({
    email: "",
    name: "",
    sendWelcomeEmail: true,
  });

  // Step 4: Stylists
  const [stylists, setStylists] = useState<Stylist[]>([
    { name: "", slug: "", color: COLORS[0] }
  ]);

  // Step 5: Services
  const [services, setServices] = useState<Service[]>([
    { name: "", category: "Corte", type: "Simple", durationPart1: 30, durationPause: 0, durationPart2: 0, price: 0 },
  ]);

  // Step 6: Business Hours
  const [businessHours, setBusinessHours] = useState<BusinessHours[]>(
    DAYS.map((d) => ({
      day: d.day,
      dayName: d.name,
      isOpen: d.day >= 1 && d.day <= 5,
      openTime: "09:00",
      closeTime: "19:00",
      breakStart: "14:00",
      breakEnd: "15:00",
    })),
  );

  const resetForm = () => {
    setCurrentStep(1);
    setBasicInfo({ name: "", slug: "", email: "", phone: "", address: "", city: "", postalCode: "", instagramUrl: "", whatsappNumber: "" });
    setCustomization({ tagline: "", description: "", primaryColor: "#8B5CF6", secondaryColor: "#EC4899", logoUrl: "", heroImageUrl: "" });
    setAdminInfo({ email: "", name: "", sendWelcomeEmail: true });
    setStylists([{ name: "", slug: "", color: COLORS[0] }]);
    setServices([{ name: "", category: "Corte", type: "Simple", durationPart1: 30, durationPause: 0, durationPart2: 0, price: 0 }]);
    setBusinessHours(DAYS.map((d) => ({
      day: d.day, dayName: d.name, isOpen: d.day >= 1 && d.day <= 5,
      openTime: "09:00", closeTime: "19:00", breakStart: "14:00", breakEnd: "15:00",
    })));
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  // Stylists handlers
  const addStylist = () => {
    setStylists([...stylists, { name: "", slug: "", color: COLORS[stylists.length % COLORS.length] }]);
  };

  const removeStylist = (index: number) => {
    if (stylists.length > 1) setStylists(stylists.filter((_, i) => i !== index));
  };

  const updateStylist = (index: number, field: keyof Stylist, value: string) => {
    const updated = [...stylists];
    updated[index] = { ...updated[index], [field]: value };
    if (field === "name") {
      updated[index].slug = value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    }
    setStylists(updated);
  };

  // Services handlers
  const addService = () => {
    setServices([...services, { name: "", category: "Corte", type: "Simple", durationPart1: 30, durationPause: 0, durationPart2: 0, price: 0 }]);
  };

  const removeService = (index: number) => {
    if (services.length > 1) setServices(services.filter((_, i) => i !== index));
  };

  const updateService = (index: number, field: keyof Service, value: any) => {
    const updated = [...services];
    updated[index] = { ...updated[index], [field]: value };
    setServices(updated);
  };

  // Business hours handlers
  const updateBusinessHours = (index: number, field: keyof BusinessHours, value: any) => {
    const updated = [...businessHours];
    updated[index] = { ...updated[index], [field]: value };
    setBusinessHours(updated);
  };

  // Image upload
  const handleImageUpload = async (file: File, type: "logo" | "hero") => {
    if (type === "logo") setUploadingLogo(true);
    else setUploadingHero(true);

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${basicInfo.slug || "temp"}-${type}-${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from("tenant-assets").upload(fileName, file);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from("tenant-assets").getPublicUrl(fileName);

      if (type === "logo") {
        setCustomization({ ...customization, logoUrl: publicUrl });
      } else {
        setCustomization({ ...customization, heroImageUrl: publicUrl });
      }

      toast({ title: "Imagen subida", description: `${type === "logo" ? "Logo" : "Imagen hero"} subida correctamente` });
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Error al subir la imagen", variant: "destructive" });
    } finally {
      if (type === "logo") setUploadingLogo(false);
      else setUploadingHero(false);
    }
  };

  const generatePassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%";
    let password = "";
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  // AI Branding
  const handleGenerateBranding = async () => {
    if (!basicInfo.name) {
      toast({ title: "Error", description: "Primero añade el nombre del salón", variant: "destructive" });
      return;
    }

    setGeneratingBranding(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-tenant-branding", {
        body: { name: basicInfo.name, city: basicInfo.city, address: basicInfo.address },
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Error al generar branding");

      const branding = data.branding;
      setCustomization((prev) => ({
        ...prev,
        tagline: branding.tagline || prev.tagline,
        description: branding.description || prev.description,
      }));

      toast({ title: "Contenido generado", description: "La IA ha creado el tagline y descripción" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "No se pudo generar el contenido", variant: "destructive" });
    } finally {
      setGeneratingBranding(false);
    }
  };

  const validateStep = (): boolean => {
    switch (currentStep) {
      case 1:
        if (!basicInfo.name || !basicInfo.slug) {
          toast({ title: "Error", description: "Nombre y slug son obligatorios", variant: "destructive" });
          return false;
        }
        return true;
      case 3:
        if (!adminInfo.email) {
          toast({ title: "Error", description: "El email del administrador es obligatorio", variant: "destructive" });
          return false;
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(adminInfo.email)) {
          toast({ title: "Error", description: "Email no válido", variant: "destructive" });
          return false;
        }
        return true;
      case 4:
        const validStylists = stylists.filter((s) => s.name && s.slug);
        if (validStylists.length === 0) {
          toast({ title: "Error", description: "Añade al menos un estilista", variant: "destructive" });
          return false;
        }
        return true;
      case 5:
        const validServices = services.filter((s) => s.name && s.category);
        if (validServices.length === 0) {
          toast({ title: "Error", description: "Añade al menos un servicio", variant: "destructive" });
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (validateStep()) setCurrentStep(Math.min(currentStep + 1, STEPS.length));
  };

  const prevStep = () => {
    setCurrentStep(Math.max(currentStep - 1, 1));
  };

  const handleComplete = async () => {
    if (!validateStep()) return;

    setSaving(true);
    try {
      const adminPassword = generatePassword();

      // 1. Create tenant
      const { data: tenant, error: tenantError } = await supabase
        .from("tenants")
        .insert({
          name: basicInfo.name,
          slug: basicInfo.slug.toLowerCase().replace(/\s+/g, "-"),
          email: basicInfo.email || null,
          phone: basicInfo.phone || null,
          address: basicInfo.address || null,
          city: basicInfo.city || null,
          postal_code: basicInfo.postalCode || null,
          tagline: customization.tagline || null,
          description: customization.description || null,
          primary_color: customization.primaryColor,
          secondary_color: customization.secondaryColor,
          logo_url: customization.logoUrl || null,
          hero_image_url: customization.heroImageUrl || null,
          instagram_url: basicInfo.instagramUrl || null,
          whatsapp_number: basicInfo.whatsappNumber || null,
        })
        .select()
        .single();

      if (tenantError) {
        if (tenantError.code === "23505") {
          throw new Error(`El slug "${basicInfo.slug}" ya existe`);
        }
        throw tenantError;
      }

      const tenantId = tenant.id;

      // 2. Create admin
      const { data: adminProvision, error: adminProvisionError } = await supabase.functions.invoke(
        "provision-tenant-admin",
        {
          body: {
            tenantId,
            tenantName: basicInfo.name,
            tenantSlug: basicInfo.slug.toLowerCase().replace(/\s+/g, "-"),
            email: adminInfo.email,
            name: adminInfo.name || basicInfo.name,
            password: adminPassword,
            sendWelcomeEmail: adminInfo.sendWelcomeEmail,
          },
        },
      );

      if (adminProvisionError) throw adminProvisionError;
      if (!adminProvision?.success) throw new Error(adminProvision?.error || "No se pudo crear el administrador");

      if (adminInfo.sendWelcomeEmail && adminProvision?.emailSent) {
        toast({ title: "Administrador creado", description: `Email enviado a ${adminInfo.email}` });
      } else {
        toast({ title: "Administrador creado", description: `Credenciales: ${adminInfo.email} / ${adminPassword}`, duration: 30000 });
      }

      // 3. Create stylists
      const validStylists = stylists.filter((s) => s.name && s.slug);
      if (validStylists.length > 0) {
        const stylistsData = validStylists.map((s) => ({
          tenant_id: tenantId, name: s.name, slug: s.slug, color: s.color,
        }));
        const { error: stylistsError } = await supabase.from("tenant_stylists").insert(stylistsData);
        if (stylistsError) throw stylistsError;
      }

      // 4. Create services
      const validServices = services.filter((s) => s.name && s.category);
      if (validServices.length > 0) {
        const servicesData = validServices.map((s) => ({
          tenant_id: tenantId,
          name: s.name,
          category: s.category,
          type: s.type,
          duration_part1_active: s.durationPart1,
          duration_exposure_pause: s.type === "Compuesto" ? s.durationPause : 0,
          duration_part2_active: s.type === "Compuesto" ? s.durationPart2 : 0,
          price: s.price || null,
        }));
        const { error: servicesError } = await supabase.from("services").insert(servicesData);
        if (servicesError) throw servicesError;
      }

      // 5. Create business hours
      const hoursData = businessHours.map((h) => ({
        tenant_id: tenantId,
        day_of_week: h.day,
        is_open: h.isOpen,
        open_time: h.isOpen ? h.openTime : null,
        close_time: h.isOpen ? h.closeTime : null,
        break_start: h.isOpen ? h.breakStart : null,
        break_end: h.isOpen ? h.breakEnd : null,
      }));
      const { error: hoursError } = await supabase.from("tenant_business_hours").insert(hoursData);
      if (hoursError) throw hoursError;

      toast({ title: "¡Tenant creado!", description: `${basicInfo.name} ha sido configurado correctamente` });
      handleClose();
      onComplete();
    } catch (error: any) {
      console.error("Error creating tenant:", error);
      toast({ title: "Error", description: error.message || "No se pudo crear el tenant", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const currentStepData = STEPS[currentStep - 1];

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent side="bottom" className="h-[95vh] rounded-t-3xl p-0 overflow-hidden">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-xl border-b" style={{ paddingTop: "env(safe-area-inset-top)" }}>
          <div className="px-4 py-3 flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={currentStep > 1 ? prevStep : handleClose}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <h1 className="font-semibold text-foreground">{currentStepData.title}</h1>
              <p className="text-xs text-muted-foreground">{currentStepData.subtitle}</p>
            </div>
            <span className="text-sm text-muted-foreground">{currentStep}/{STEPS.length}</span>
          </div>

          {/* Progress bar */}
          <div className="h-1 bg-muted">
            <motion.div
              className="h-full bg-primary"
              initial={{ width: 0 }}
              animate={{ width: `${(currentStep / STEPS.length) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 py-6 pb-32">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {/* Step 1: Basic Info */}
              {currentStep === 1 && (
                <div className="space-y-4 max-w-lg mx-auto">
                  <Card className="ios-card">
                    <CardContent className="p-4 space-y-4">
                      <div>
                        <Label className="text-sm font-medium">Nombre del negocio *</Label>
                        <Input
                          placeholder="Mi Salón de Belleza"
                          value={basicInfo.name}
                          onChange={(e) => setBasicInfo({
                            ...basicInfo,
                            name: e.target.value,
                            slug: e.target.value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-"),
                          })}
                          className="h-12 rounded-xl mt-1.5"
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium">URL del salón *</Label>
                        <div className="flex items-center mt-1.5">
                          <span className="text-sm text-muted-foreground mr-2">glowapp.app/salon/</span>
                          <Input
                            placeholder="mi-salon"
                            value={basicInfo.slug}
                            onChange={(e) => setBasicInfo({ ...basicInfo, slug: e.target.value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") })}
                            className="h-12 rounded-xl flex-1"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="ios-card">
                    <CardContent className="p-4 space-y-4">
                      <div className="flex items-center gap-3 text-muted-foreground mb-2">
                        <MapPin className="h-4 w-4" />
                        <span className="text-sm font-medium">Ubicación</span>
                      </div>
                      <Input
                        placeholder="Dirección"
                        value={basicInfo.address}
                        onChange={(e) => setBasicInfo({ ...basicInfo, address: e.target.value })}
                        className="h-12 rounded-xl"
                      />
                      <div className="grid grid-cols-2 gap-3">
                        <Input
                          placeholder="Ciudad"
                          value={basicInfo.city}
                          onChange={(e) => setBasicInfo({ ...basicInfo, city: e.target.value })}
                          className="h-12 rounded-xl"
                        />
                        <Input
                          placeholder="C.P."
                          value={basicInfo.postalCode}
                          onChange={(e) => setBasicInfo({ ...basicInfo, postalCode: e.target.value })}
                          className="h-12 rounded-xl"
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="ios-card">
                    <CardContent className="p-4 space-y-4">
                      <div className="flex items-center gap-3 text-muted-foreground mb-2">
                        <Phone className="h-4 w-4" />
                        <span className="text-sm font-medium">Contacto</span>
                      </div>
                      <Input
                        type="email"
                        placeholder="email@salon.com"
                        value={basicInfo.email}
                        onChange={(e) => setBasicInfo({ ...basicInfo, email: e.target.value })}
                        className="h-12 rounded-xl"
                      />
                      <Input
                        type="tel"
                        placeholder="Teléfono"
                        value={basicInfo.phone}
                        onChange={(e) => setBasicInfo({ ...basicInfo, phone: e.target.value })}
                        className="h-12 rounded-xl"
                      />
                      <Input
                        placeholder="WhatsApp (con prefijo +34)"
                        value={basicInfo.whatsappNumber}
                        onChange={(e) => setBasicInfo({ ...basicInfo, whatsappNumber: e.target.value })}
                        className="h-12 rounded-xl"
                      />
                      <Input
                        placeholder="Instagram URL"
                        value={basicInfo.instagramUrl}
                        onChange={(e) => setBasicInfo({ ...basicInfo, instagramUrl: e.target.value })}
                        className="h-12 rounded-xl"
                      />
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Step 2: Customization */}
              {currentStep === 2 && (
                <div className="space-y-4 max-w-lg mx-auto">
                  <Card className="ios-card">
                    <CardContent className="p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium">Contenido con IA</Label>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleGenerateBranding}
                          disabled={generatingBranding || !basicInfo.name}
                          className="gap-2"
                        >
                          {generatingBranding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                          Generar
                        </Button>
                      </div>
                      <div>
                        <Label className="text-sm text-muted-foreground">Tagline</Label>
                        <Input
                          placeholder="Tu eslogan aquí"
                          value={customization.tagline}
                          onChange={(e) => setCustomization({ ...customization, tagline: e.target.value })}
                          className="h-12 rounded-xl mt-1.5"
                        />
                      </div>
                      <div>
                        <Label className="text-sm text-muted-foreground">Descripción</Label>
                        <Textarea
                          placeholder="Describe tu salón..."
                          value={customization.description}
                          onChange={(e) => setCustomization({ ...customization, description: e.target.value })}
                          className="rounded-xl mt-1.5 min-h-[100px]"
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="ios-card">
                    <CardContent className="p-4 space-y-4">
                      <Label className="text-sm font-medium">Colores</Label>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-xs text-muted-foreground">Principal</Label>
                          <div className="flex items-center gap-2 mt-1.5">
                            <input
                              type="color"
                              value={customization.primaryColor}
                              onChange={(e) => setCustomization({ ...customization, primaryColor: e.target.value })}
                              className="w-12 h-12 rounded-xl border-0 cursor-pointer"
                            />
                            <Input
                              value={customization.primaryColor}
                              onChange={(e) => setCustomization({ ...customization, primaryColor: e.target.value })}
                              className="h-12 rounded-xl flex-1 font-mono text-sm"
                            />
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Secundario</Label>
                          <div className="flex items-center gap-2 mt-1.5">
                            <input
                              type="color"
                              value={customization.secondaryColor}
                              onChange={(e) => setCustomization({ ...customization, secondaryColor: e.target.value })}
                              className="w-12 h-12 rounded-xl border-0 cursor-pointer"
                            />
                            <Input
                              value={customization.secondaryColor}
                              onChange={(e) => setCustomization({ ...customization, secondaryColor: e.target.value })}
                              className="h-12 rounded-xl flex-1 font-mono text-sm"
                            />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="ios-card">
                    <CardContent className="p-4 space-y-4">
                      <Label className="text-sm font-medium">Imágenes</Label>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-xs text-muted-foreground mb-2 block">Logo</Label>
                          <label className="flex flex-col items-center justify-center h-24 border-2 border-dashed rounded-xl cursor-pointer hover:bg-muted/50 transition-colors">
                            {customization.logoUrl ? (
                              <img src={customization.logoUrl} alt="Logo" className="h-full object-contain p-2" />
                            ) : uploadingLogo ? (
                              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                            ) : (
                              <Upload className="h-6 w-6 text-muted-foreground" />
                            )}
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], "logo")}
                            />
                          </label>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground mb-2 block">Hero</Label>
                          <label className="flex flex-col items-center justify-center h-24 border-2 border-dashed rounded-xl cursor-pointer hover:bg-muted/50 transition-colors">
                            {customization.heroImageUrl ? (
                              <img src={customization.heroImageUrl} alt="Hero" className="h-full w-full object-cover rounded-lg" />
                            ) : uploadingHero ? (
                              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                            ) : (
                              <Upload className="h-6 w-6 text-muted-foreground" />
                            )}
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], "hero")}
                            />
                          </label>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Step 3: Admin */}
              {currentStep === 3 && (
                <div className="space-y-4 max-w-lg mx-auto">
                  <Card className="ios-card">
                    <CardContent className="p-4 space-y-4">
                      <div className="flex items-center gap-3 text-muted-foreground mb-2">
                        <UserPlus className="h-4 w-4" />
                        <span className="text-sm font-medium">Credenciales del administrador</span>
                      </div>
                      <div>
                        <Label className="text-sm text-muted-foreground">Email *</Label>
                        <Input
                          type="email"
                          placeholder="admin@salon.com"
                          value={adminInfo.email}
                          onChange={(e) => setAdminInfo({ ...adminInfo, email: e.target.value })}
                          className="h-12 rounded-xl mt-1.5"
                        />
                      </div>
                      <div>
                        <Label className="text-sm text-muted-foreground">Nombre</Label>
                        <Input
                          placeholder="Nombre del administrador"
                          value={adminInfo.name}
                          onChange={(e) => setAdminInfo({ ...adminInfo, name: e.target.value })}
                          className="h-12 rounded-xl mt-1.5"
                        />
                      </div>
                      <div className="flex items-center justify-between pt-2">
                        <div>
                          <Label className="text-sm font-medium">Enviar email de bienvenida</Label>
                          <p className="text-xs text-muted-foreground">Incluye las credenciales de acceso</p>
                        </div>
                        <Switch
                          checked={adminInfo.sendWelcomeEmail}
                          onCheckedChange={(checked) => setAdminInfo({ ...adminInfo, sendWelcomeEmail: checked })}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <p className="text-xs text-center text-muted-foreground px-4">
                    Se generará una contraseña segura automáticamente. El administrador podrá cambiarla después.
                  </p>
                </div>
              )}

              {/* Step 4: Stylists */}
              {currentStep === 4 && (
                <div className="space-y-4 max-w-lg mx-auto">
                  {stylists.map((stylist, index) => (
                    <Card key={index} className="ios-card">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shrink-0"
                            style={{ backgroundColor: stylist.color }}
                          >
                            {stylist.name ? stylist.name.charAt(0).toUpperCase() : (index + 1)}
                          </div>
                          <div className="flex-1 space-y-3">
                            <Input
                              placeholder="Nombre del estilista"
                              value={stylist.name}
                              onChange={(e) => updateStylist(index, "name", e.target.value)}
                              className="h-11 rounded-xl"
                            />
                            <div className="flex gap-2">
                              <div className="flex gap-1">
                                {COLORS.slice(0, 5).map((color) => (
                                  <button
                                    key={color}
                                    type="button"
                                    className={cn(
                                      "w-6 h-6 rounded-full transition-transform",
                                      stylist.color === color && "ring-2 ring-offset-2 ring-primary scale-110"
                                    )}
                                    style={{ backgroundColor: color }}
                                    onClick={() => updateStylist(index, "color", color)}
                                  />
                                ))}
                              </div>
                              {stylists.length > 1 && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="ml-auto h-8 w-8 text-destructive"
                                  onClick={() => removeStylist(index)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  <Button variant="outline" className="w-full h-12 rounded-xl gap-2" onClick={addStylist}>
                    <Plus className="h-4 w-4" />
                    Añadir estilista
                  </Button>
                </div>
              )}

              {/* Step 5: Services */}
              {currentStep === 5 && (
                <div className="space-y-4 max-w-lg mx-auto">
                  {services.map((service, index) => (
                    <Card key={index} className="ios-card">
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-center gap-2">
                          <Input
                            placeholder="Nombre del servicio"
                            value={service.name}
                            onChange={(e) => updateService(index, "name", e.target.value)}
                            className="h-11 rounded-xl flex-1"
                          />
                          {services.length > 1 && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive shrink-0"
                              onClick={() => removeService(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <Select value={service.category} onValueChange={(v) => updateService(index, "category", v)}>
                            <SelectTrigger className="h-11 rounded-xl">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {SERVICE_CATEGORIES.map((cat) => (
                                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Select value={service.type} onValueChange={(v) => updateService(index, "type", v as "Simple" | "Compuesto")}>
                            <SelectTrigger className="h-11 rounded-xl">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Simple">Simple</SelectItem>
                              <SelectItem value="Compuesto">Compuesto</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <Label className="text-xs text-muted-foreground">Duración</Label>
                            <Input
                              type="number"
                              value={service.durationPart1}
                              onChange={(e) => updateService(index, "durationPart1", parseInt(e.target.value) || 0)}
                              className="h-10 rounded-xl mt-1"
                            />
                          </div>
                          {service.type === "Compuesto" && (
                            <>
                              <div>
                                <Label className="text-xs text-muted-foreground">Pausa</Label>
                                <Input
                                  type="number"
                                  value={service.durationPause}
                                  onChange={(e) => updateService(index, "durationPause", parseInt(e.target.value) || 0)}
                                  className="h-10 rounded-xl mt-1"
                                />
                              </div>
                              <div>
                                <Label className="text-xs text-muted-foreground">Parte 2</Label>
                                <Input
                                  type="number"
                                  value={service.durationPart2}
                                  onChange={(e) => updateService(index, "durationPart2", parseInt(e.target.value) || 0)}
                                  className="h-10 rounded-xl mt-1"
                                />
                              </div>
                            </>
                          )}
                          <div className={service.type === "Simple" ? "col-span-2" : ""}>
                            <Label className="text-xs text-muted-foreground">Precio €</Label>
                            <Input
                              type="number"
                              placeholder="0.00"
                              value={service.price || ""}
                              onChange={(e) => updateService(index, "price", parseFloat(e.target.value) || 0)}
                              className="h-10 rounded-xl mt-1"
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  <Button variant="outline" className="w-full h-12 rounded-xl gap-2" onClick={addService}>
                    <Plus className="h-4 w-4" />
                    Añadir servicio
                  </Button>
                </div>
              )}

              {/* Step 6: Business Hours */}
              {currentStep === 6 && (
                <div className="space-y-3 max-w-lg mx-auto">
                  {businessHours.map((hours, index) => (
                    <Card key={hours.day} className={cn("ios-card transition-opacity", !hours.isOpen && "opacity-60")}>
                      <CardContent className="p-3">
                        <div className="flex items-center gap-3">
                          <Switch
                            checked={hours.isOpen}
                            onCheckedChange={(checked) => updateBusinessHours(index, "isOpen", checked)}
                          />
                          <span className="font-medium w-20">{hours.dayName}</span>
                          {hours.isOpen ? (
                            <div className="flex-1 grid grid-cols-2 gap-2 text-sm">
                              <div className="flex items-center gap-1">
                                <Input
                                  type="time"
                                  value={hours.openTime}
                                  onChange={(e) => updateBusinessHours(index, "openTime", e.target.value)}
                                  className="h-9 rounded-lg text-xs"
                                />
                                <span className="text-muted-foreground">-</span>
                                <Input
                                  type="time"
                                  value={hours.breakStart}
                                  onChange={(e) => updateBusinessHours(index, "breakStart", e.target.value)}
                                  className="h-9 rounded-lg text-xs"
                                />
                              </div>
                              <div className="flex items-center gap-1">
                                <Input
                                  type="time"
                                  value={hours.breakEnd}
                                  onChange={(e) => updateBusinessHours(index, "breakEnd", e.target.value)}
                                  className="h-9 rounded-lg text-xs"
                                />
                                <span className="text-muted-foreground">-</span>
                                <Input
                                  type="time"
                                  value={hours.closeTime}
                                  onChange={(e) => updateBusinessHours(index, "closeTime", e.target.value)}
                                  className="h-9 rounded-lg text-xs"
                                />
                              </div>
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">Cerrado</span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer Actions */}
        <div
          className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-xl border-t"
          style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom))" }}
        >
          <div className="max-w-lg mx-auto">
            {currentStep < STEPS.length ? (
              <Button onClick={nextStep} className="w-full h-12 rounded-xl gradient-primary text-primary-foreground gap-2">
                Continuar
                <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={handleComplete}
                disabled={saving}
                className="w-full h-12 rounded-xl gradient-primary text-primary-foreground gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creando tenant...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    Crear Tenant
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
