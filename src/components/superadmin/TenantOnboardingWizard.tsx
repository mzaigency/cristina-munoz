import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Loader2, 
  Building2, 
  Users, 
  Clock, 
  Calendar, 
  Webhook,
  ChevronRight,
  ChevronLeft,
  Check,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Palette,
  Scissors,
  Upload,
  Image
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TenantOnboardingWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
}

interface Stylist {
  name: string;
  slug: string;
  color: string;
  calendarId: string;
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
  type: "simple" | "compuesto";
  durationPart1: number;
  durationPause: number;
  durationPart2: number;
}

const DAYS = [
  { day: 0, name: "Domingo" },
  { day: 1, name: "Lunes" },
  { day: 2, name: "Martes" },
  { day: 3, name: "Miércoles" },
  { day: 4, name: "Jueves" },
  { day: 5, name: "Viernes" },
  { day: 6, name: "Sábado" },
];

const COLORS = [
  "#8B5CF6", "#EC4899", "#3B82F6", "#10B981", "#F59E0B", "#EF4444",
  "#6366F1", "#14B8A6", "#F97316", "#84CC16"
];

const SERVICE_CATEGORIES = [
  "Corte",
  "Coloración",
  "Peinados",
  "Tratamientos",
  "Mechas",
  "Alisados",
  "Barba",
  "Otros"
];

const STEPS = [
  { id: 1, title: "Datos básicos", icon: Building2 },
  { id: 2, title: "Personalización", icon: Palette },
  { id: 3, title: "Estilistas", icon: Users },
  { id: 4, title: "Servicios", icon: Scissors },
  { id: 5, title: "Horarios", icon: Clock },
  { id: 6, title: "Integraciones", icon: Calendar },
];

export function TenantOnboardingWizard({ open, onOpenChange, onComplete }: TenantOnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [showSecrets, setShowSecrets] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingHero, setUploadingHero] = useState(false);
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

  // Step 3: Stylists
  const [stylists, setStylists] = useState<Stylist[]>([
    { name: "", slug: "", color: COLORS[0], calendarId: "" }
  ]);

  // Step 4: Services
  const [services, setServices] = useState<Service[]>([
    { name: "", category: "Corte", type: "simple", durationPart1: 30, durationPause: 0, durationPart2: 0 }
  ]);

  // Step 5: Business Hours
  const [businessHours, setBusinessHours] = useState<BusinessHours[]>(
    DAYS.map(d => ({
      day: d.day,
      dayName: d.name,
      isOpen: d.day >= 1 && d.day <= 5,
      openTime: "09:00",
      closeTime: "19:00",
      breakStart: "14:00",
      breakEnd: "15:00",
    }))
  );

  // Step 6: Integrations
  const [gcalEnabled, setGcalEnabled] = useState(false);
  const [gcalCredentials, setGcalCredentials] = useState({
    clientId: "",
    clientSecret: "",
    refreshToken: "",
  });

  const [n8nEnabled, setN8nEnabled] = useState(false);
  const [n8nWebhooks, setN8nWebhooks] = useState({
    webhookUrl: "",
    cancelWebhookUrl: "",
    whatsappWebhookUrl: "",
  });

  const resetForm = () => {
    setCurrentStep(1);
    setBasicInfo({ name: "", slug: "", email: "", phone: "", address: "", city: "", postalCode: "" });
    setCustomization({ tagline: "", description: "", primaryColor: "#8B5CF6", secondaryColor: "#EC4899", logoUrl: "", heroImageUrl: "" });
    setStylists([{ name: "", slug: "", color: COLORS[0], calendarId: "" }]);
    setServices([{ name: "", category: "Corte", type: "simple", durationPart1: 30, durationPause: 0, durationPart2: 0 }]);
    setBusinessHours(DAYS.map(d => ({
      day: d.day,
      dayName: d.name,
      isOpen: d.day >= 1 && d.day <= 5,
      openTime: "09:00",
      closeTime: "19:00",
      breakStart: "14:00",
      breakEnd: "15:00",
    })));
    setGcalEnabled(false);
    setGcalCredentials({ clientId: "", clientSecret: "", refreshToken: "" });
    setN8nEnabled(false);
    setN8nWebhooks({ webhookUrl: "", cancelWebhookUrl: "", whatsappWebhookUrl: "" });
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  // Stylists handlers
  const addStylist = () => {
    setStylists([...stylists, { 
      name: "", 
      slug: "", 
      color: COLORS[stylists.length % COLORS.length],
      calendarId: "" 
    }]);
  };

  const removeStylist = (index: number) => {
    if (stylists.length > 1) {
      setStylists(stylists.filter((_, i) => i !== index));
    }
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
    setServices([...services, { 
      name: "", 
      category: "Corte", 
      type: "simple", 
      durationPart1: 30, 
      durationPause: 0, 
      durationPart2: 0 
    }]);
  };

  const removeService = (index: number) => {
    if (services.length > 1) {
      setServices(services.filter((_, i) => i !== index));
    }
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

  const copyFirstDayToAll = () => {
    const firstOpenDay = businessHours.find(h => h.isOpen);
    if (firstOpenDay) {
      setBusinessHours(businessHours.map(h => ({
        ...h,
        openTime: firstOpenDay.openTime,
        closeTime: firstOpenDay.closeTime,
        breakStart: firstOpenDay.breakStart,
        breakEnd: firstOpenDay.breakEnd,
      })));
    }
  };

  // Image upload handlers
  const handleImageUpload = async (file: File, type: 'logo' | 'hero') => {
    if (type === 'logo') setUploadingLogo(true);
    else setUploadingHero(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${basicInfo.slug || 'temp'}-${type}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('tenant-assets')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('tenant-assets')
        .getPublicUrl(filePath);

      if (type === 'logo') {
        setCustomization({ ...customization, logoUrl: publicUrl });
      } else {
        setCustomization({ ...customization, heroImageUrl: publicUrl });
      }

      toast({
        title: "Imagen subida",
        description: `${type === 'logo' ? 'Logo' : 'Imagen hero'} subida correctamente`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error al subir la imagen",
        variant: "destructive",
      });
    } finally {
      if (type === 'logo') setUploadingLogo(false);
      else setUploadingHero(false);
    }
  };

  const validateStep = (): boolean => {
    switch (currentStep) {
      case 1:
        if (!basicInfo.name || !basicInfo.slug) {
          toast({
            title: "Error",
            description: "Nombre y slug son obligatorios",
            variant: "destructive",
          });
          return false;
        }
        return true;
      case 3:
        const validStylists = stylists.filter(s => s.name && s.slug);
        if (validStylists.length === 0) {
          toast({
            title: "Error",
            description: "Añade al menos un estilista",
            variant: "destructive",
          });
          return false;
        }
        return true;
      case 4:
        const validServices = services.filter(s => s.name && s.category);
        if (validServices.length === 0) {
          toast({
            title: "Error",
            description: "Añade al menos un servicio",
            variant: "destructive",
          });
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (validateStep()) {
      setCurrentStep(Math.min(currentStep + 1, STEPS.length));
    }
  };

  const prevStep = () => {
    setCurrentStep(Math.max(currentStep - 1, 1));
  };

  const handleComplete = async () => {
    if (!validateStep()) return;

    setSaving(true);
    try {
      // 1. Create tenant with all customization data
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
        })
        .select()
        .single();

      if (tenantError) throw tenantError;

      const tenantId = tenant.id;

      // 2. Create stylists
      const validStylists = stylists.filter(s => s.name && s.slug);
      if (validStylists.length > 0) {
        const stylistsData = validStylists.map(s => ({
          tenant_id: tenantId,
          name: s.name,
          slug: s.slug,
          color: s.color,
          google_calendar_id: s.calendarId || null,
        }));

        const { error: stylistsError } = await supabase
          .from("tenant_stylists")
          .insert(stylistsData);

        if (stylistsError) throw stylistsError;
      }

      // 3. Create services
      const validServices = services.filter(s => s.name && s.category);
      if (validServices.length > 0) {
        const servicesData = validServices.map(s => ({
          tenant_id: tenantId,
          name: s.name,
          category: s.category,
          type: s.type,
          duration_part1_active: s.durationPart1,
          duration_exposure_pause: s.type === "compuesto" ? s.durationPause : 0,
          duration_part2_active: s.type === "compuesto" ? s.durationPart2 : 0,
        }));

        const { error: servicesError } = await supabase
          .from("services")
          .insert(servicesData);

        if (servicesError) throw servicesError;
      }

      // 4. Create business hours
      const hoursData = businessHours.map(h => ({
        tenant_id: tenantId,
        day_of_week: h.day,
        is_open: h.isOpen,
        open_time: h.isOpen ? h.openTime : null,
        close_time: h.isOpen ? h.closeTime : null,
        break_start: h.isOpen ? h.breakStart : null,
        break_end: h.isOpen ? h.breakEnd : null,
      }));

      const { error: hoursError } = await supabase
        .from("tenant_business_hours")
        .insert(hoursData);

      if (hoursError) throw hoursError;

      // 5. Create Google Calendar integration if enabled
      if (gcalEnabled && gcalCredentials.clientId) {
        const credentials = JSON.stringify({
          client_id: gcalCredentials.clientId,
          client_secret: gcalCredentials.clientSecret,
          refresh_token: gcalCredentials.refreshToken,
        });

        const { data: encrypted } = await supabase.rpc("encrypt_sensitive_data", {
          _plaintext: credentials,
          _tenant_id: tenantId,
        });

        const calendarSettings: Record<string, string> = {};
        validStylists.forEach(s => {
          if (s.calendarId) {
            calendarSettings[`calendar_id_${s.slug}`] = s.calendarId;
          }
        });

        const { error: gcalError } = await supabase
          .from("tenant_integrations")
          .insert({
            tenant_id: tenantId,
            integration_type: "google_calendar",
            is_enabled: true,
            credentials_encrypted: encrypted,
            settings: calendarSettings,
          });

        if (gcalError) throw gcalError;
      }

      // 6. Create n8n integration if enabled
      if (n8nEnabled && (n8nWebhooks.webhookUrl || n8nWebhooks.cancelWebhookUrl)) {
        const { error: n8nError } = await supabase
          .from("tenant_integrations")
          .insert({
            tenant_id: tenantId,
            integration_type: "n8n",
            is_enabled: true,
            settings: {
              webhook_url: n8nWebhooks.webhookUrl || null,
              cancel_webhook_url: n8nWebhooks.cancelWebhookUrl || null,
              whatsapp_webhook_url: n8nWebhooks.whatsappWebhookUrl || null,
            },
          });

        if (n8nError) throw n8nError;
      }

      toast({
        title: "¡Tenant creado!",
        description: `${basicInfo.name} ha sido configurado correctamente`,
      });

      handleClose();
      onComplete();
    } catch (error: any) {
      console.error("Error creating tenant:", error);
      toast({
        title: "Error",
        description: error.message || "No se pudo crear el tenant",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Crear Nuevo Tenant
          </DialogTitle>
          <DialogDescription>
            Configura todos los aspectos de la nueva peluquería para una página totalmente personalizada
          </DialogDescription>
        </DialogHeader>

        {/* Step Indicator */}
        <div className="flex items-center justify-between mb-6 px-2 overflow-x-auto">
          {STEPS.map((step, index) => (
            <div key={step.id} className="flex items-center flex-shrink-0">
              <div className={cn(
                "flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors",
                currentStep === step.id 
                  ? "border-primary bg-primary text-primary-foreground"
                  : currentStep > step.id
                    ? "border-primary bg-primary/20 text-primary"
                    : "border-muted-foreground/30 text-muted-foreground"
              )}>
                {currentStep > step.id ? (
                  <Check className="h-5 w-5" />
                ) : (
                  <step.icon className="h-5 w-5" />
                )}
              </div>
              {index < STEPS.length - 1 && (
                <div className={cn(
                  "w-6 h-0.5 mx-1",
                  currentStep > step.id ? "bg-primary" : "bg-muted-foreground/30"
                )} />
              )}
            </div>
          ))}
        </div>

        <div className="text-center mb-4">
          <h3 className="font-semibold">{STEPS[currentStep - 1].title}</h3>
          <p className="text-sm text-muted-foreground">Paso {currentStep} de {STEPS.length}</p>
        </div>

        {/* Step Content */}
        <div className="min-h-[350px]">
          {/* Step 1: Basic Info */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre del negocio *</Label>
                  <Input
                    id="name"
                    placeholder="Peluquería Cristina"
                    value={basicInfo.name}
                    onChange={(e) => setBasicInfo({ 
                      ...basicInfo, 
                      name: e.target.value,
                      slug: e.target.value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug">Slug (URL) *</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">/salon/</span>
                    <Input
                      id="slug"
                      placeholder="peluqueria-cristina"
                      value={basicInfo.slug}
                      onChange={(e) => setBasicInfo({ ...basicInfo, slug: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="email">Email de contacto</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="contacto@peluqueria.com"
                    value={basicInfo.email}
                    onChange={(e) => setBasicInfo({ ...basicInfo, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Teléfono</Label>
                  <Input
                    id="phone"
                    placeholder="612 345 678"
                    value={basicInfo.phone}
                    onChange={(e) => setBasicInfo({ ...basicInfo, phone: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Dirección completa</Label>
                <Input
                  id="address"
                  placeholder="Calle Principal, 123"
                  value={basicInfo.address}
                  onChange={(e) => setBasicInfo({ ...basicInfo, address: e.target.value })}
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="city">Ciudad</Label>
                  <Input
                    id="city"
                    placeholder="Madrid"
                    value={basicInfo.city}
                    onChange={(e) => setBasicInfo({ ...basicInfo, city: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="postalCode">Código Postal</Label>
                  <Input
                    id="postalCode"
                    placeholder="28001"
                    value={basicInfo.postalCode}
                    onChange={(e) => setBasicInfo({ ...basicInfo, postalCode: e.target.value })}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Customization */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="tagline">Tagline / Eslogan</Label>
                <Input
                  id="tagline"
                  placeholder="Tu estilo, nuestra pasión"
                  value={customization.tagline}
                  onChange={(e) => setCustomization({ ...customization, tagline: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descripción del negocio</Label>
                <Textarea
                  id="description"
                  placeholder="Describe tu peluquería, servicios destacados, historia..."
                  value={customization.description}
                  onChange={(e) => setCustomization({ ...customization, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-3">
                  <Label>Color Principal</Label>
                  <div className="flex items-center gap-3">
                    <div className="flex flex-wrap gap-2">
                      {COLORS.map((color) => (
                        <button
                          key={color}
                          type="button"
                          className={cn(
                            "w-8 h-8 rounded-full border-2 transition-all",
                            customization.primaryColor === color ? "border-foreground scale-110" : "border-transparent"
                          )}
                          style={{ backgroundColor: color }}
                          onClick={() => setCustomization({ ...customization, primaryColor: color })}
                        />
                      ))}
                    </div>
                    <Input
                      type="color"
                      value={customization.primaryColor}
                      onChange={(e) => setCustomization({ ...customization, primaryColor: e.target.value })}
                      className="w-12 h-10 p-1"
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <Label>Color Secundario</Label>
                  <div className="flex items-center gap-3">
                    <div className="flex flex-wrap gap-2">
                      {COLORS.map((color) => (
                        <button
                          key={color}
                          type="button"
                          className={cn(
                            "w-8 h-8 rounded-full border-2 transition-all",
                            customization.secondaryColor === color ? "border-foreground scale-110" : "border-transparent"
                          )}
                          style={{ backgroundColor: color }}
                          onClick={() => setCustomization({ ...customization, secondaryColor: color })}
                        />
                      ))}
                    </div>
                    <Input
                      type="color"
                      value={customization.secondaryColor}
                      onChange={(e) => setCustomization({ ...customization, secondaryColor: e.target.value })}
                      className="w-12 h-10 p-1"
                    />
                  </div>
                </div>
              </div>

              {/* Preview */}
              <div 
                className="p-4 rounded-lg border"
                style={{ 
                  background: `linear-gradient(135deg, ${customization.primaryColor}20, ${customization.secondaryColor}20)`
                }}
              >
                <p className="text-sm text-muted-foreground mb-2">Vista previa de colores:</p>
                <div className="flex gap-3">
                  <Button style={{ backgroundColor: customization.primaryColor }} className="text-white">
                    Reservar
                  </Button>
                  <Button variant="outline" style={{ borderColor: customization.secondaryColor, color: customization.secondaryColor }}>
                    Ver más
                  </Button>
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-3">
                  <Label>Logo</Label>
                  <div className="border-2 border-dashed rounded-lg p-4 text-center">
                    {customization.logoUrl ? (
                      <div className="space-y-2">
                        <img src={customization.logoUrl} alt="Logo" className="max-h-20 mx-auto" />
                        <Button variant="outline" size="sm" onClick={() => setCustomization({ ...customization, logoUrl: "" })}>
                          Cambiar
                        </Button>
                      </div>
                    ) : (
                      <label className="cursor-pointer">
                        <div className="flex flex-col items-center gap-2">
                          {uploadingLogo ? (
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                          ) : (
                            <Upload className="h-8 w-8 text-muted-foreground" />
                          )}
                          <span className="text-sm text-muted-foreground">Subir logo</span>
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleImageUpload(file, 'logo');
                          }}
                          disabled={uploadingLogo}
                        />
                      </label>
                    )}
                  </div>
                  <Input
                    placeholder="O introduce URL del logo"
                    value={customization.logoUrl}
                    onChange={(e) => setCustomization({ ...customization, logoUrl: e.target.value })}
                  />
                </div>

                <div className="space-y-3">
                  <Label>Imagen Hero (cabecera)</Label>
                  <div className="border-2 border-dashed rounded-lg p-4 text-center">
                    {customization.heroImageUrl ? (
                      <div className="space-y-2">
                        <img src={customization.heroImageUrl} alt="Hero" className="max-h-20 mx-auto object-cover rounded" />
                        <Button variant="outline" size="sm" onClick={() => setCustomization({ ...customization, heroImageUrl: "" })}>
                          Cambiar
                        </Button>
                      </div>
                    ) : (
                      <label className="cursor-pointer">
                        <div className="flex flex-col items-center gap-2">
                          {uploadingHero ? (
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                          ) : (
                            <Image className="h-8 w-8 text-muted-foreground" />
                          )}
                          <span className="text-sm text-muted-foreground">Subir imagen hero</span>
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleImageUpload(file, 'hero');
                          }}
                          disabled={uploadingHero}
                        />
                      </label>
                    )}
                  </div>
                  <Input
                    placeholder="O introduce URL de la imagen"
                    value={customization.heroImageUrl}
                    onChange={(e) => setCustomization({ ...customization, heroImageUrl: e.target.value })}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Stylists */}
          {currentStep === 3 && (
            <div className="space-y-4">
              {stylists.map((stylist, index) => (
                <div key={index} className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Estilista {index + 1}</span>
                    {stylists.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeStylist(index)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                  <div className="grid gap-3 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label>Nombre *</Label>
                      <Input
                        placeholder="Cristina"
                        value={stylist.name}
                        onChange={(e) => updateStylist(index, "name", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Slug *</Label>
                      <Input
                        placeholder="cris"
                        value={stylist.slug}
                        onChange={(e) => updateStylist(index, "slug", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Color</Label>
                      <div className="flex gap-2">
                        {COLORS.slice(0, 6).map((color) => (
                          <button
                            key={color}
                            type="button"
                            className={cn(
                              "w-7 h-7 rounded-full border-2 transition-all",
                              stylist.color === color ? "border-foreground scale-110" : "border-transparent"
                            )}
                            style={{ backgroundColor: color }}
                            onClick={() => updateStylist(index, "color", color)}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Google Calendar ID (opcional)</Label>
                    <Input
                      placeholder="calendar-id@group.calendar.google.com"
                      value={stylist.calendarId}
                      onChange={(e) => updateStylist(index, "calendarId", e.target.value)}
                    />
                  </div>
                </div>
              ))}
              <Button variant="outline" onClick={addStylist} className="w-full gap-2">
                <Plus className="h-4 w-4" />
                Añadir estilista
              </Button>
            </div>
          )}

          {/* Step 4: Services */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Añade los servicios que ofrece tu peluquería. Los servicios "compuestos" tienen tiempo de espera entre dos fases (ej: tintes).
              </p>
              {services.map((service, index) => (
                <div key={index} className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Servicio {index + 1}</span>
                    {services.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeService(index)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                  <div className="grid gap-3 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label>Nombre *</Label>
                      <Input
                        placeholder="Corte de pelo"
                        value={service.name}
                        onChange={(e) => updateService(index, "name", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Categoría *</Label>
                      <Select
                        value={service.category}
                        onValueChange={(value) => updateService(index, "category", value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {SERVICE_CATEGORIES.map(cat => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Tipo</Label>
                      <Select
                        value={service.type}
                        onValueChange={(value) => updateService(index, "type", value as "simple" | "compuesto")}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="simple">Simple</SelectItem>
                          <SelectItem value="compuesto">Compuesto</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid gap-3 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label>Duración {service.type === "compuesto" ? "Parte 1" : ""} (min)</Label>
                      <Input
                        type="number"
                        min={5}
                        step={5}
                        value={service.durationPart1}
                        onChange={(e) => updateService(index, "durationPart1", parseInt(e.target.value) || 0)}
                      />
                    </div>
                    {service.type === "compuesto" && (
                      <>
                        <div className="space-y-2">
                          <Label>Pausa/Exposición (min)</Label>
                          <Input
                            type="number"
                            min={0}
                            step={5}
                            value={service.durationPause}
                            onChange={(e) => updateService(index, "durationPause", parseInt(e.target.value) || 0)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Duración Parte 2 (min)</Label>
                          <Input
                            type="number"
                            min={0}
                            step={5}
                            value={service.durationPart2}
                            onChange={(e) => updateService(index, "durationPart2", parseInt(e.target.value) || 0)}
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))}
              <Button variant="outline" onClick={addService} className="w-full gap-2">
                <Plus className="h-4 w-4" />
                Añadir servicio
              </Button>
            </div>
          )}

          {/* Step 5: Business Hours */}
          {currentStep === 5 && (
            <div className="space-y-4">
              <div className="flex justify-end">
                <Button variant="outline" size="sm" onClick={copyFirstDayToAll}>
                  Copiar horario a todos
                </Button>
              </div>
              <div className="space-y-2">
                {businessHours.map((hour, index) => (
                  <div key={hour.day} className="flex items-center gap-3 p-3 border rounded-lg">
                    <div className="w-24 flex-shrink-0">
                      <span className="font-medium text-sm">{hour.dayName}</span>
                    </div>
                    <Switch
                      checked={hour.isOpen}
                      onCheckedChange={(checked) => updateBusinessHours(index, "isOpen", checked)}
                    />
                    {hour.isOpen ? (
                      <div className="flex items-center gap-2 flex-1 flex-wrap">
                        <Input
                          type="time"
                          value={hour.openTime}
                          onChange={(e) => updateBusinessHours(index, "openTime", e.target.value)}
                          className="w-24"
                        />
                        <span className="text-muted-foreground">-</span>
                        <Input
                          type="time"
                          value={hour.closeTime}
                          onChange={(e) => updateBusinessHours(index, "closeTime", e.target.value)}
                          className="w-24"
                        />
                        <span className="text-muted-foreground text-xs">Desc:</span>
                        <Input
                          type="time"
                          value={hour.breakStart}
                          onChange={(e) => updateBusinessHours(index, "breakStart", e.target.value)}
                          className="w-24"
                        />
                        <span className="text-muted-foreground">-</span>
                        <Input
                          type="time"
                          value={hour.breakEnd}
                          onChange={(e) => updateBusinessHours(index, "breakEnd", e.target.value)}
                          className="w-24"
                        />
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">Cerrado</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 6: Integrations */}
          {currentStep === 6 && (
            <div className="space-y-6">
              {/* Google Calendar */}
              <div className="border rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5" />
                    <div>
                      <Label className="text-base">Google Calendar</Label>
                      <p className="text-sm text-muted-foreground">
                        Sincroniza las citas con Google Calendar
                      </p>
                    </div>
                  </div>
                  <Switch checked={gcalEnabled} onCheckedChange={setGcalEnabled} />
                </div>

                {gcalEnabled && (
                  <div className="space-y-3 pt-2 border-t">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Credenciales OAuth2</Label>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowSecrets(!showSecrets)}
                      >
                        {showSecrets ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    <div className="grid gap-3">
                      <Input
                        type={showSecrets ? "text" : "password"}
                        placeholder="Client ID"
                        value={gcalCredentials.clientId}
                        onChange={(e) => setGcalCredentials({ ...gcalCredentials, clientId: e.target.value })}
                      />
                      <Input
                        type={showSecrets ? "text" : "password"}
                        placeholder="Client Secret"
                        value={gcalCredentials.clientSecret}
                        onChange={(e) => setGcalCredentials({ ...gcalCredentials, clientSecret: e.target.value })}
                      />
                      <Input
                        type={showSecrets ? "text" : "password"}
                        placeholder="Refresh Token"
                        value={gcalCredentials.refreshToken}
                        onChange={(e) => setGcalCredentials({ ...gcalCredentials, refreshToken: e.target.value })}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* n8n Webhooks */}
              <div className="border rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Webhook className="h-5 w-5" />
                    <div>
                      <Label className="text-base">n8n Webhooks</Label>
                      <p className="text-sm text-muted-foreground">
                        Automatizaciones con n8n
                      </p>
                    </div>
                  </div>
                  <Switch checked={n8nEnabled} onCheckedChange={setN8nEnabled} />
                </div>

                {n8nEnabled && (
                  <div className="space-y-3 pt-2 border-t">
                    <Input
                      placeholder="Webhook URL (nueva reserva)"
                      value={n8nWebhooks.webhookUrl}
                      onChange={(e) => setN8nWebhooks({ ...n8nWebhooks, webhookUrl: e.target.value })}
                    />
                    <Input
                      placeholder="Cancel Webhook URL"
                      value={n8nWebhooks.cancelWebhookUrl}
                      onChange={(e) => setN8nWebhooks({ ...n8nWebhooks, cancelWebhookUrl: e.target.value })}
                    />
                    <Input
                      placeholder="WhatsApp Webhook URL"
                      value={n8nWebhooks.whatsappWebhookUrl}
                      onChange={(e) => setN8nWebhooks({ ...n8nWebhooks, whatsappWebhookUrl: e.target.value })}
                    />
                  </div>
                )}
              </div>

              <p className="text-sm text-muted-foreground text-center">
                Las integraciones se pueden configurar o modificar más tarde desde el panel de administración.
              </p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={currentStep === 1 ? handleClose : prevStep}
            disabled={saving}
          >
            {currentStep === 1 ? (
              "Cancelar"
            ) : (
              <>
                <ChevronLeft className="h-4 w-4 mr-1" />
                Anterior
              </>
            )}
          </Button>

          {currentStep < STEPS.length ? (
            <Button onClick={nextStep} disabled={saving}>
              Siguiente
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button onClick={handleComplete} disabled={saving} className="gap-2">
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
              Crear Tenant
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
