import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  EyeOff
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
  "#8B5CF6", "#EC4899", "#3B82F6", "#10B981", "#F59E0B", "#EF4444"
];

const STEPS = [
  { id: 1, title: "Datos básicos", icon: Building2 },
  { id: 2, title: "Estilistas", icon: Users },
  { id: 3, title: "Horarios", icon: Clock },
  { id: 4, title: "Google Calendar", icon: Calendar },
  { id: 5, title: "Webhooks n8n", icon: Webhook },
];

export function TenantOnboardingWizard({ open, onOpenChange, onComplete }: TenantOnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [showSecrets, setShowSecrets] = useState(false);
  const { toast } = useToast();

  // Step 1: Basic Info
  const [basicInfo, setBasicInfo] = useState({
    name: "",
    slug: "",
    email: "",
    phone: "",
    address: "",
    city: "",
  });

  // Step 2: Stylists
  const [stylists, setStylists] = useState<Stylist[]>([
    { name: "", slug: "", color: COLORS[0], calendarId: "" }
  ]);

  // Step 3: Business Hours
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

  // Step 4: Google Calendar
  const [gcalEnabled, setGcalEnabled] = useState(false);
  const [gcalCredentials, setGcalCredentials] = useState({
    clientId: "",
    clientSecret: "",
    refreshToken: "",
  });

  // Step 5: n8n Webhooks
  const [n8nEnabled, setN8nEnabled] = useState(false);
  const [n8nWebhooks, setN8nWebhooks] = useState({
    webhookUrl: "",
    cancelWebhookUrl: "",
    whatsappWebhookUrl: "",
  });

  const resetForm = () => {
    setCurrentStep(1);
    setBasicInfo({ name: "", slug: "", email: "", phone: "", address: "", city: "" });
    setStylists([{ name: "", slug: "", color: COLORS[0], calendarId: "" }]);
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

  const updateBusinessHours = (index: number, field: keyof BusinessHours, value: any) => {
    const updated = [...businessHours];
    updated[index] = { ...updated[index], [field]: value };
    setBusinessHours(updated);
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
      case 2:
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

      // 3. Create business hours
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

      // 4. Create Google Calendar integration if enabled
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

        // Build settings with calendar IDs from stylists
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

      // 5. Create n8n integration if enabled
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
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Crear Nuevo Tenant
          </DialogTitle>
          <DialogDescription>
            Configura todos los aspectos de la nueva peluquería
          </DialogDescription>
        </DialogHeader>

        {/* Step Indicator */}
        <div className="flex items-center justify-between mb-6 px-2">
          {STEPS.map((step, index) => (
            <div key={step.id} className="flex items-center">
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
                  "w-8 h-0.5 mx-1",
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
                  <Label htmlFor="name">Nombre *</Label>
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
                  <Input
                    id="slug"
                    placeholder="peluqueria-cristina"
                    value={basicInfo.slug}
                    onChange={(e) => setBasicInfo({ ...basicInfo, slug: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
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
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="address">Dirección</Label>
                  <Input
                    id="address"
                    placeholder="Calle Principal, 123"
                    value={basicInfo.address}
                    onChange={(e) => setBasicInfo({ ...basicInfo, address: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">Ciudad</Label>
                  <Input
                    id="city"
                    placeholder="Madrid"
                    value={basicInfo.city}
                    onChange={(e) => setBasicInfo({ ...basicInfo, city: e.target.value })}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Stylists */}
          {currentStep === 2 && (
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
                      <Label>Nombre</Label>
                      <Input
                        placeholder="Cristina"
                        value={stylist.name}
                        onChange={(e) => updateStylist(index, "name", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Slug</Label>
                      <Input
                        placeholder="cris"
                        value={stylist.slug}
                        onChange={(e) => updateStylist(index, "slug", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Color</Label>
                      <div className="flex gap-2">
                        {COLORS.map((color) => (
                          <button
                            key={color}
                            type="button"
                            className={cn(
                              "w-8 h-8 rounded-full border-2 transition-all",
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

          {/* Step 3: Business Hours */}
          {currentStep === 3 && (
            <div className="space-y-3">
              {businessHours.map((hour, index) => (
                <div key={hour.day} className="flex items-center gap-3 p-3 border rounded-lg">
                  <div className="w-24">
                    <span className="font-medium">{hour.dayName}</span>
                  </div>
                  <Switch
                    checked={hour.isOpen}
                    onCheckedChange={(checked) => updateBusinessHours(index, "isOpen", checked)}
                  />
                  {hour.isOpen ? (
                    <div className="flex items-center gap-2 flex-1">
                      <Input
                        type="time"
                        value={hour.openTime}
                        onChange={(e) => updateBusinessHours(index, "openTime", e.target.value)}
                        className="w-28"
                      />
                      <span>-</span>
                      <Input
                        type="time"
                        value={hour.closeTime}
                        onChange={(e) => updateBusinessHours(index, "closeTime", e.target.value)}
                        className="w-28"
                      />
                      <span className="text-muted-foreground text-sm">Descanso:</span>
                      <Input
                        type="time"
                        value={hour.breakStart}
                        onChange={(e) => updateBusinessHours(index, "breakStart", e.target.value)}
                        className="w-28"
                      />
                      <span>-</span>
                      <Input
                        type="time"
                        value={hour.breakEnd}
                        onChange={(e) => updateBusinessHours(index, "breakEnd", e.target.value)}
                        className="w-28"
                      />
                    </div>
                  ) : (
                    <span className="text-muted-foreground">Cerrado</span>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Step 4: Google Calendar */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <Label className="text-base">Habilitar Google Calendar</Label>
                  <p className="text-sm text-muted-foreground">
                    Sincroniza las citas con Google Calendar
                  </p>
                </div>
                <Switch checked={gcalEnabled} onCheckedChange={setGcalEnabled} />
              </div>

              {gcalEnabled && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Credenciales OAuth2</Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowSecrets(!showSecrets)}
                    >
                      {showSecrets ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <Label>Client ID</Label>
                      <Input
                        type={showSecrets ? "text" : "password"}
                        placeholder="Tu Client ID de Google"
                        value={gcalCredentials.clientId}
                        onChange={(e) => setGcalCredentials({ ...gcalCredentials, clientId: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Client Secret</Label>
                      <Input
                        type={showSecrets ? "text" : "password"}
                        placeholder="Tu Client Secret de Google"
                        value={gcalCredentials.clientSecret}
                        onChange={(e) => setGcalCredentials({ ...gcalCredentials, clientSecret: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Refresh Token</Label>
                      <Input
                        type={showSecrets ? "text" : "password"}
                        placeholder="Tu Refresh Token de Google"
                        value={gcalCredentials.refreshToken}
                        onChange={(e) => setGcalCredentials({ ...gcalCredentials, refreshToken: e.target.value })}
                      />
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Los Calendar IDs de cada estilista se configuraron en el paso anterior.
                  </p>
                </div>
              )}

              {!gcalEnabled && (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Puedes configurar Google Calendar más tarde desde el panel de integraciones.</p>
                </div>
              )}
            </div>
          )}

          {/* Step 5: n8n Webhooks */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <Label className="text-base">Habilitar n8n Webhooks</Label>
                  <p className="text-sm text-muted-foreground">
                    Conecta con n8n para automatizaciones
                  </p>
                </div>
                <Switch checked={n8nEnabled} onCheckedChange={setN8nEnabled} />
              </div>

              {n8nEnabled && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Webhook URL (Nueva reserva)</Label>
                    <Input
                      placeholder="https://n8n.example.com/webhook/booking"
                      value={n8nWebhooks.webhookUrl}
                      onChange={(e) => setN8nWebhooks({ ...n8nWebhooks, webhookUrl: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Cancel Webhook URL</Label>
                    <Input
                      placeholder="https://n8n.example.com/webhook/cancel"
                      value={n8nWebhooks.cancelWebhookUrl}
                      onChange={(e) => setN8nWebhooks({ ...n8nWebhooks, cancelWebhookUrl: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>WhatsApp Webhook URL</Label>
                    <Input
                      placeholder="https://n8n.example.com/webhook/whatsapp"
                      value={n8nWebhooks.whatsappWebhookUrl}
                      onChange={(e) => setN8nWebhooks({ ...n8nWebhooks, whatsappWebhookUrl: e.target.value })}
                    />
                  </div>
                </div>
              )}

              {!n8nEnabled && (
                <div className="text-center py-8 text-muted-foreground">
                  <Webhook className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Puedes configurar los webhooks de n8n más tarde desde el panel de integraciones.</p>
                </div>
              )}
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
