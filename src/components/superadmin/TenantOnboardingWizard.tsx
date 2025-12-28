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
  Image,
  UserPlus,
  Mail,
  Sparkles,
  ExternalLink,
  Copy
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
  type: "Simple" | "Compuesto";
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
  { id: 3, title: "Administrador", icon: UserPlus },
  { id: 4, title: "Estilistas", icon: Users },
  { id: 5, title: "Servicios", icon: Scissors },
  { id: 6, title: "Horarios", icon: Clock },
  { id: 7, title: "Integraciones", icon: Calendar },
];

export function TenantOnboardingWizard({ open, onOpenChange, onComplete }: TenantOnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [showSecrets, setShowSecrets] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingHero, setUploadingHero] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [generatingBranding, setGeneratingBranding] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [generatingPreview, setGeneratingPreview] = useState(false);
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
    facebookUrl: "",
    whatsappNumber: "",
    googleMapsUrl: "",
  });

  // Step 2: Customization
  const [customization, setCustomization] = useState({
    tagline: "",
    description: "",
    primaryColor: "#8B5CF6",
    secondaryColor: "#EC4899",
    logoUrl: "",
    heroImageUrl: "",
    seoTitle: "",
    seoDescription: "",
    faqs: [] as Array<{ question: string; answer: string }>,
    brandTone: "",
  });

  // Step 3: Admin
  const [adminInfo, setAdminInfo] = useState({
    email: "",
    name: "",
    sendWelcomeEmail: true,
  });

  // Step 4: Stylists
  const [stylists, setStylists] = useState<Stylist[]>([
    { name: "", slug: "", color: COLORS[0], calendarId: "" }
  ]);

  // Step 5: Services
  const [services, setServices] = useState<Service[]>([
    { name: "", category: "Corte", type: "Simple", durationPart1: 30, durationPause: 0, durationPart2: 0 }
  ]);

  // Step 6: Business Hours
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

  // Step 7: Integrations
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
    setBasicInfo({ name: "", slug: "", email: "", phone: "", address: "", city: "", postalCode: "", instagramUrl: "", facebookUrl: "", whatsappNumber: "", googleMapsUrl: "" });
    setCustomization({ tagline: "", description: "", primaryColor: "#8B5CF6", secondaryColor: "#EC4899", logoUrl: "", heroImageUrl: "", seoTitle: "", seoDescription: "", faqs: [], brandTone: "" });
    setAdminInfo({ email: "", name: "", sendWelcomeEmail: true });
    setStylists([{ name: "", slug: "", color: COLORS[0], calendarId: "" }]);
    setServices([{ name: "", category: "Corte", type: "Simple", durationPart1: 30, durationPause: 0, durationPart2: 0 }]);
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
    setShowPreview(false);
    setPreviewUrl(null);
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
      type: "Simple", 
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

  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  // AI Branding Generation
  const handleGenerateBranding = async () => {
    if (!basicInfo.name) {
      toast({
        title: "Error",
        description: "Primero añade el nombre del salón",
        variant: "destructive",
      });
      return;
    }

    setGeneratingBranding(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-tenant-branding", {
        body: {
          name: basicInfo.name,
          city: basicInfo.city,
          address: basicInfo.address,
          services: services.filter(s => s.name).map(s => s.name),
          stylists: stylists.filter(s => s.name).map(s => s.name),
        },
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Error al generar branding");

      const branding = data.branding;
      
      setCustomization(prev => ({
        ...prev,
        tagline: branding.tagline || prev.tagline,
        description: branding.description || prev.description,
        seoTitle: branding.seoTitle || prev.seoTitle,
        seoDescription: branding.seoDescription || prev.seoDescription,
        faqs: branding.faqs || prev.faqs,
        brandTone: branding.brandTone || prev.brandTone,
      }));

      toast({
        title: "Contenido generado",
        description: "La IA ha creado tagline, descripción y FAQs",
      });
    } catch (error: any) {
      console.error("Error generating branding:", error);
      toast({
        title: "Error",
        description: error.message || "No se pudo generar el contenido",
        variant: "destructive",
      });
    } finally {
      setGeneratingBranding(false);
    }
  };

  // Generate Preview URL
  const generatePreviewToken = () => {
    return crypto.randomUUID().replace(/-/g, "").slice(0, 16);
  };

  const handleGeneratePreviewUrl = async () => {
    if (!basicInfo.slug) {
      toast({
        title: "Error",
        description: "Primero añade el slug del salón",
        variant: "destructive",
      });
      return;
    }

    setGeneratingPreview(true);
    try {
      const token = generatePreviewToken();
      const baseUrl = window.location.origin;
      const url = `${baseUrl}/salon/${basicInfo.slug.toLowerCase().replace(/\s+/g, "-")}?preview=${token}`;
      setPreviewUrl(url);
      
      toast({
        title: "URL de preview generada",
        description: "Copia la URL para compartirla (válida 24h)",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "No se pudo generar la URL de preview",
        variant: "destructive",
      });
    } finally {
      setGeneratingPreview(false);
    }
  };

  const copyPreviewUrl = () => {
    if (previewUrl) {
      navigator.clipboard.writeText(previewUrl);
      toast({
        title: "URL copiada",
        description: "La URL de preview se ha copiado al portapapeles",
      });
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
        if (!adminInfo.email) {
          toast({
            title: "Error",
            description: "El email del administrador es obligatorio",
            variant: "destructive",
          });
          return false;
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(adminInfo.email)) {
          toast({
            title: "Error",
            description: "Email no válido",
            variant: "destructive",
          });
          return false;
        }
        return true;
      case 4:
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
      case 5:
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
      // Generate password for admin
      const adminPassword = generatePassword();

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
          instagram_url: basicInfo.instagramUrl || null,
          facebook_url: basicInfo.facebookUrl || null,
          whatsapp_number: basicInfo.whatsappNumber || null,
          google_maps_url: basicInfo.googleMapsUrl || null,
        })
        .select()
        .single();

      if (tenantError) {
        if (tenantError.code === "23505") {
          throw new Error(`El slug "${basicInfo.slug}" ya existe. Por favor, elige otro.`);
        }
        throw tenantError;
      }

      const tenantId = tenant.id;

      // 2. Create tenant admin WITHOUT changing the current session
      const { data: adminProvision, error: adminProvisionError } =
        await supabase.functions.invoke("provision-tenant-admin", {
          body: {
            tenantId,
            tenantName: basicInfo.name,
            tenantSlug: basicInfo.slug.toLowerCase().replace(/\s+/g, "-"),
            email: adminInfo.email,
            name: adminInfo.name || basicInfo.name,
            password: adminPassword,
            sendWelcomeEmail: adminInfo.sendWelcomeEmail,
          },
        });

      if (adminProvisionError) throw adminProvisionError;
      if (!adminProvision?.success) {
        throw new Error(adminProvision?.error || "No se pudo crear el administrador");
      }

      if (adminInfo.sendWelcomeEmail && adminProvision?.emailSent) {
        toast({
          title: "Administrador creado",
          description: `Email enviado a ${adminInfo.email} con las credenciales`,
        });
      } else {
        toast({
          title: adminProvision?.emailSent ? "Administrador creado" : "Administrador creado (email no enviado)",
          description: `Credenciales: ${adminInfo.email} / ${adminPassword}`,
          duration: 30000,
        });
      }

      // 6. Create stylists
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

      // 7. Create services
      const validServices = services.filter(s => s.name && s.category);
      if (validServices.length > 0) {
        const servicesData = validServices.map(s => ({
          tenant_id: tenantId,
          name: s.name,
          category: s.category,
          type: s.type,
          duration_part1_active: s.durationPart1,
          duration_exposure_pause: s.type === "Compuesto" ? s.durationPause : 0,
          duration_part2_active: s.type === "Compuesto" ? s.durationPart2 : 0,
        }));

        const { error: servicesError } = await supabase
          .from("services")
          .insert(servicesData);

        if (servicesError) throw servicesError;
      }

      // 8. Create business hours
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

      // 9. Create Google Calendar integration if enabled
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

      // 10. Create n8n integration if enabled
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

  // Live Preview Component
  const LandingPreview = () => (
    <div className="border rounded-lg overflow-hidden bg-background shadow-lg">
      {/* Hero Section Preview */}
      <div 
        className="relative h-48 flex items-center justify-center"
        style={{
          background: customization.heroImageUrl 
            ? `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url(${customization.heroImageUrl}) center/cover`
            : `linear-gradient(135deg, ${customization.primaryColor}, ${customization.secondaryColor})`
        }}
      >
        <div className="text-center text-white z-10">
          {customization.logoUrl && (
            <img src={customization.logoUrl} alt="Logo" className="h-12 mx-auto mb-2" />
          )}
          <h2 className="text-2xl font-bold">{basicInfo.name || "Nombre del Salón"}</h2>
          <p className="text-sm opacity-90">{customization.tagline || "Tu eslogan aquí"}</p>
          {basicInfo.city && (
            <p className="text-xs opacity-75 mt-1">{basicInfo.address}, {basicInfo.city}</p>
          )}
        </div>
      </div>

      {/* Services Preview */}
      <div className="p-4">
        <h3 className="font-semibold mb-3" style={{ color: customization.primaryColor }}>
          Nuestros Servicios
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {services.filter(s => s.name).slice(0, 4).map((service, i) => (
            <div 
              key={i} 
              className="p-2 rounded text-xs border"
              style={{ borderColor: `${customization.primaryColor}30` }}
            >
              <span className="font-medium">{service.name}</span>
              <span className="text-muted-foreground ml-1">({service.durationPart1}min)</span>
            </div>
          ))}
        </div>
      </div>

      {/* Stylists Preview */}
      {stylists.filter(s => s.name).length > 0 && (
        <div className="p-4 border-t">
          <h3 className="font-semibold mb-3" style={{ color: customization.primaryColor }}>
            Nuestro Equipo
          </h3>
          <div className="flex gap-3">
            {stylists.filter(s => s.name).slice(0, 3).map((stylist, i) => (
              <div key={i} className="text-center">
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold mx-auto"
                  style={{ backgroundColor: stylist.color }}
                >
                  {stylist.name.charAt(0).toUpperCase()}
                </div>
                <span className="text-xs mt-1 block">{stylist.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CTA Button Preview */}
      <div className="p-4 border-t">
        <Button 
          className="w-full text-white"
          style={{ backgroundColor: customization.primaryColor }}
        >
          Reservar Cita
        </Button>
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Crear Nuevo Tenant
          </DialogTitle>
          <DialogDescription>
            Configura todos los aspectos de la nueva peluquería
          </DialogDescription>
        </DialogHeader>

        {/* Toggle Preview */}
        <div className="flex justify-end mb-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPreview(!showPreview)}
            className="gap-2"
          >
            <Eye className="h-4 w-4" />
            {showPreview ? "Ocultar vista previa" : "Ver vista previa"}
          </Button>
        </div>

        <div className={cn("grid gap-6", showPreview ? "md:grid-cols-2" : "grid-cols-1")}>
          {/* Main Content */}
          <div>
            {/* Step Indicator */}
            <div className="flex items-center justify-between mb-6 px-2 overflow-x-auto">
              {STEPS.map((step, index) => (
                <div key={step.id} className="flex items-center flex-shrink-0">
                  <div className={cn(
                    "flex items-center justify-center w-8 h-8 rounded-full border-2 transition-colors",
                    currentStep === step.id 
                      ? "border-primary bg-primary text-primary-foreground"
                      : currentStep > step.id
                        ? "border-primary bg-primary/20 text-primary"
                        : "border-muted-foreground/30 text-muted-foreground"
                  )}>
                    {currentStep > step.id ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <step.icon className="h-4 w-4" />
                    )}
                  </div>
                  {index < STEPS.length - 1 && (
                    <div className={cn(
                      "w-4 h-0.5 mx-0.5",
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
            <div className="min-h-[300px]">
              {/* Step 1: Basic Info */}
              {currentStep === 1 && (
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nombre del negocio *</Label>
                      <Input
                        id="name"
                        placeholder="Salón GlowUp"
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
                          placeholder="salon-glowup"
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
                <div className="space-y-4">
                  {/* AI Generation Button */}
                  <div className="p-4 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg border border-primary/20">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Sparkles className="h-5 w-5 text-primary" />
                        <div>
                          <h4 className="font-medium">Generar con IA</h4>
                          <p className="text-sm text-muted-foreground">
                            Crea tagline, descripción y FAQs automáticamente
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleGenerateBranding}
                        disabled={generatingBranding || !basicInfo.name}
                        className="gap-2"
                      >
                        {generatingBranding ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Generando...
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-4 w-4" />
                            Generar
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

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
                    <Label htmlFor="description">Descripción</Label>
                    <Textarea
                      id="description"
                      placeholder="Describe tu peluquería..."
                      value={customization.description}
                      onChange={(e) => setCustomization({ ...customization, description: e.target.value })}
                      rows={2}
                    />
                  </div>

                  {/* Brand Tone (if generated) */}
                  {customization.brandTone && (
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <Label className="text-sm text-muted-foreground">Tono de marca sugerido</Label>
                      <p className="text-sm mt-1">{customization.brandTone}</p>
                    </div>
                  )}

                  {/* FAQs (if generated) */}
                  {customization.faqs.length > 0 && (
                    <div className="space-y-2">
                      <Label>FAQs generadas</Label>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {customization.faqs.map((faq, i) => (
                          <div key={i} className="p-2 bg-muted/30 rounded text-sm">
                            <p className="font-medium">{faq.question}</p>
                            <p className="text-muted-foreground">{faq.answer}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Color Principal</Label>
                      <div className="flex items-center gap-2">
                        <div className="flex flex-wrap gap-1">
                          {COLORS.slice(0, 5).map((color) => (
                            <button
                              key={color}
                              type="button"
                              className={cn(
                                "w-6 h-6 rounded-full border-2 transition-all",
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
                          className="w-10 h-8 p-1"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Color Secundario</Label>
                      <div className="flex items-center gap-2">
                        <div className="flex flex-wrap gap-1">
                          {COLORS.slice(0, 5).map((color) => (
                            <button
                              key={color}
                              type="button"
                              className={cn(
                                "w-6 h-6 rounded-full border-2 transition-all",
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
                          className="w-10 h-8 p-1"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Logo</Label>
                      <div className="border-2 border-dashed rounded-lg p-3 text-center">
                        {customization.logoUrl ? (
                          <div className="space-y-2">
                            <img src={customization.logoUrl} alt="Logo" className="max-h-16 mx-auto" />
                            <Button variant="outline" size="sm" onClick={() => setCustomization({ ...customization, logoUrl: "" })}>
                              Cambiar
                            </Button>
                          </div>
                        ) : (
                          <label className="cursor-pointer">
                            <div className="flex flex-col items-center gap-1">
                              {uploadingLogo ? (
                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                              ) : (
                                <Upload className="h-6 w-6 text-muted-foreground" />
                              )}
                              <span className="text-xs text-muted-foreground">Subir logo</span>
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
                    </div>

                    <div className="space-y-2">
                      <Label>Imagen Hero</Label>
                      <div className="border-2 border-dashed rounded-lg p-3 text-center">
                        {customization.heroImageUrl ? (
                          <div className="space-y-2">
                            <img src={customization.heroImageUrl} alt="Hero" className="max-h-16 mx-auto object-cover rounded" />
                            <Button variant="outline" size="sm" onClick={() => setCustomization({ ...customization, heroImageUrl: "" })}>
                              Cambiar
                            </Button>
                          </div>
                        ) : (
                          <label className="cursor-pointer">
                            <div className="flex flex-col items-center gap-1">
                              {uploadingHero ? (
                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                              ) : (
                                <Image className="h-6 w-6 text-muted-foreground" />
                              )}
                              <span className="text-xs text-muted-foreground">Subir hero</span>
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
                    </div>
                  </div>

                  {/* Preview URL Section */}
                  <div className="p-4 border rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ExternalLink className="h-4 w-4 text-muted-foreground" />
                        <Label>URL de Vista Previa</Label>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleGeneratePreviewUrl}
                        disabled={generatingPreview || !basicInfo.slug}
                        className="gap-2"
                      >
                        {generatingPreview ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <ExternalLink className="h-4 w-4" />
                        )}
                        Generar URL
                      </Button>
                    </div>
                    {previewUrl && (
                      <div className="flex items-center gap-2 p-2 bg-muted rounded">
                        <code className="text-xs flex-1 truncate">{previewUrl}</code>
                        <Button variant="ghost" size="sm" onClick={copyPreviewUrl}>
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" asChild>
                          <a href={previewUrl} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Esta URL permite previsualizar la landing antes de activar el tenant
                    </p>
                  </div>
                </div>
              )}

              {/* Step 3: Admin */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3 mb-3">
                      <UserPlus className="h-5 w-5 text-primary" />
                      <div>
                        <h4 className="font-medium">Administrador del Tenant</h4>
                        <p className="text-sm text-muted-foreground">
                          Se creará una cuenta de administrador con acceso completo al panel
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="adminEmail">Email del administrador *</Label>
                      <Input
                        id="adminEmail"
                        type="email"
                        placeholder="admin@peluqueria.com"
                        value={adminInfo.email}
                        onChange={(e) => setAdminInfo({ ...adminInfo, email: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="adminName">Nombre del administrador</Label>
                      <Input
                        id="adminName"
                        placeholder="Juan García"
                        value={adminInfo.name}
                        onChange={(e) => setAdminInfo({ ...adminInfo, name: e.target.value })}
                      />
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Mail className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <Label className="cursor-pointer">Enviar email de bienvenida</Label>
                          <p className="text-sm text-muted-foreground">
                            Se enviará un email con las credenciales de acceso
                          </p>
                        </div>
                      </div>
                      <Switch
                        checked={adminInfo.sendWelcomeEmail}
                        onCheckedChange={(checked) => setAdminInfo({ ...adminInfo, sendWelcomeEmail: checked })}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Stylists */}
              {currentStep === 4 && (
                <div className="space-y-3">
                  {stylists.map((stylist, index) => (
                    <div key={index} className="p-3 border rounded-lg space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">Estilista {index + 1}</span>
                        {stylists.length > 1 && (
                          <Button variant="ghost" size="sm" onClick={() => removeStylist(index)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                      <div className="grid gap-2 md:grid-cols-3">
                        <Input
                          placeholder="Nombre *"
                          value={stylist.name}
                          onChange={(e) => updateStylist(index, "name", e.target.value)}
                        />
                        <Input
                          placeholder="Slug *"
                          value={stylist.slug}
                          onChange={(e) => updateStylist(index, "slug", e.target.value)}
                        />
                        <div className="flex gap-1">
                          {COLORS.slice(0, 6).map((color) => (
                            <button
                              key={color}
                              type="button"
                              className={cn(
                                "w-6 h-6 rounded-full border-2 transition-all",
                                stylist.color === color ? "border-foreground scale-110" : "border-transparent"
                              )}
                              style={{ backgroundColor: color }}
                              onClick={() => updateStylist(index, "color", color)}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                  <Button variant="outline" onClick={addStylist} className="w-full gap-2" size="sm">
                    <Plus className="h-4 w-4" />
                    Añadir estilista
                  </Button>
                </div>
              )}

              {/* Step 5: Services */}
              {currentStep === 5 && (
                <div className="space-y-3">
                  {services.map((service, index) => (
                    <div key={index} className="p-3 border rounded-lg space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">Servicio {index + 1}</span>
                        {services.length > 1 && (
                          <Button variant="ghost" size="sm" onClick={() => removeService(index)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                      <div className="grid gap-2 md:grid-cols-4">
                        <Input
                          placeholder="Nombre *"
                          value={service.name}
                          onChange={(e) => updateService(index, "name", e.target.value)}
                        />
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
                        <Select
                          value={service.type}
                          onValueChange={(value) => updateService(index, "type", value as "Simple" | "Compuesto")}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Simple">Simple</SelectItem>
                            <SelectItem value="Compuesto">Compuesto (3 fases)</SelectItem>
                          </SelectContent>
                        </Select>
                        <Input
                          type="number"
                          min={5}
                          step={5}
                          placeholder={service.type === "Compuesto" ? "Fase 1 (min)" : "Duración (min)"}
                          value={service.durationPart1}
                          onChange={(e) => updateService(index, "durationPart1", parseInt(e.target.value) || 0)}
                        />
                      </div>
                      {/* Show extra duration fields for compound services */}
                      {service.type === "Compuesto" && (
                        <div className="grid gap-2 md:grid-cols-2 pt-2 border-t border-dashed">
                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Pausa/Exposición (min)</Label>
                            <Input
                              type="number"
                              min={0}
                              step={5}
                              placeholder="Tiempo de espera"
                              value={service.durationPause}
                              onChange={(e) => updateService(index, "durationPause", parseInt(e.target.value) || 0)}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Fase 2 - Finalización (min)</Label>
                            <Input
                              type="number"
                              min={0}
                              step={5}
                              placeholder="Duración fase 2"
                              value={service.durationPart2}
                              onChange={(e) => updateService(index, "durationPart2", parseInt(e.target.value) || 0)}
                            />
                          </div>
                          <div className="md:col-span-2 text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                            Total: {service.durationPart1 + service.durationPause + service.durationPart2} min 
                            (Fase 1: {service.durationPart1}min → Pausa: {service.durationPause}min → Fase 2: {service.durationPart2}min)
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  <Button variant="outline" onClick={addService} className="w-full gap-2" size="sm">
                    <Plus className="h-4 w-4" />
                    Añadir servicio
                  </Button>
                </div>
              )}

              {/* Step 6: Business Hours */}
              {currentStep === 6 && (
                <div className="space-y-2">
                  <div className="flex justify-end mb-2">
                    <Button variant="outline" size="sm" onClick={copyFirstDayToAll}>
                      Copiar a todos
                    </Button>
                  </div>
                  {businessHours.map((hour, index) => (
                    <div key={hour.day} className="flex items-center gap-2 p-2 border rounded-lg text-sm">
                      <div className="w-20 flex-shrink-0">
                        <span className="font-medium">{hour.dayName}</span>
                      </div>
                      <Switch
                        checked={hour.isOpen}
                        onCheckedChange={(checked) => updateBusinessHours(index, "isOpen", checked)}
                      />
                      {hour.isOpen ? (
                        <div className="flex items-center gap-1 flex-1 flex-wrap">
                          <Input
                            type="time"
                            value={hour.openTime}
                            onChange={(e) => updateBusinessHours(index, "openTime", e.target.value)}
                            className="w-24 h-8"
                          />
                          <span>-</span>
                          <Input
                            type="time"
                            value={hour.closeTime}
                            onChange={(e) => updateBusinessHours(index, "closeTime", e.target.value)}
                            className="w-24 h-8"
                          />
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Cerrado</span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Step 7: Integrations */}
              {currentStep === 7 && (
                <div className="space-y-4">
                  <div className="border rounded-lg p-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <Label>Google Calendar</Label>
                      </div>
                      <Switch checked={gcalEnabled} onCheckedChange={setGcalEnabled} />
                    </div>
                    {gcalEnabled && (
                      <div className="space-y-2 pt-2 border-t">
                        <div className="flex justify-end">
                          <Button variant="ghost" size="sm" onClick={() => setShowSecrets(!showSecrets)}>
                            {showSecrets ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
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
                    )}
                  </div>

                  <div className="border rounded-lg p-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Webhook className="h-4 w-4" />
                        <Label>n8n Webhooks</Label>
                      </div>
                      <Switch checked={n8nEnabled} onCheckedChange={setN8nEnabled} />
                    </div>
                    {n8nEnabled && (
                      <div className="space-y-2 pt-2 border-t">
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
                      </div>
                    )}
                  </div>

                  <p className="text-xs text-muted-foreground text-center">
                    Las integraciones se pueden modificar después desde el panel
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
                {currentStep === 1 ? "Cancelar" : (
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
          </div>

          {/* Preview Panel */}
          {showPreview && (
            <div className="space-y-3">
              <h4 className="font-medium text-sm flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Vista previa de la landing
              </h4>
              <LandingPreview />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
