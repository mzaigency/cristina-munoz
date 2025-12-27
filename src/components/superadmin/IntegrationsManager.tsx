import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Calendar, Webhook, Save, RefreshCw, Eye, EyeOff } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Tenant {
  id: string;
  name: string;
  slug: string;
}

interface Integration {
  id?: string;
  tenant_id: string;
  integration_type: string;
  is_enabled: boolean;
  settings: Record<string, any>;
  credentials?: {
    client_id?: string;
    client_secret?: string;
    refresh_token?: string;
  };
}

export function IntegrationsManager() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [selectedTenantId, setSelectedTenantId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSecrets, setShowSecrets] = useState(false);
  const { toast } = useToast();

  // Google Calendar integration state
  const [gcalEnabled, setGcalEnabled] = useState(false);
  const [gcalClientId, setGcalClientId] = useState("");
  const [gcalClientSecret, setGcalClientSecret] = useState("");
  const [gcalRefreshToken, setGcalRefreshToken] = useState("");
  const [gcalCalendarIdCris, setGcalCalendarIdCris] = useState("");
  const [gcalCalendarIdDesi, setGcalCalendarIdDesi] = useState("");

  // n8n integration state
  const [n8nEnabled, setN8nEnabled] = useState(false);
  const [n8nWebhookUrl, setN8nWebhookUrl] = useState("");
  const [n8nCancelWebhookUrl, setN8nCancelWebhookUrl] = useState("");
  const [n8nWhatsappWebhookUrl, setN8nWhatsappWebhookUrl] = useState("");
  const [n8nPasswordRecoveryUrl, setN8nPasswordRecoveryUrl] = useState("");

  useEffect(() => {
    fetchTenants();
  }, []);

  useEffect(() => {
    if (selectedTenantId) {
      fetchIntegrations(selectedTenantId);
    }
  }, [selectedTenantId]);

  const fetchTenants = async () => {
    try {
      const { data, error } = await supabase
        .from("tenants")
        .select("id, name, slug")
        .eq("is_active", true)
        .order("name");

      if (error) throw error;
      setTenants(data || []);
      if (data && data.length > 0) {
        setSelectedTenantId(data[0].id);
      }
    } catch (error) {
      console.error("Error fetching tenants:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los tenants",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchIntegrations = async (tenantId: string) => {
    setLoading(true);
    try {
      const { data: integrations, error } = await supabase
        .from("tenant_integrations")
        .select("*")
        .eq("tenant_id", tenantId);

      if (error) throw error;

      // Reset all states
      setGcalEnabled(false);
      setGcalClientId("");
      setGcalClientSecret("");
      setGcalRefreshToken("");
      setGcalCalendarIdCris("");
      setGcalCalendarIdDesi("");
      setN8nEnabled(false);
      setN8nWebhookUrl("");
      setN8nCancelWebhookUrl("");
      setN8nWhatsappWebhookUrl("");
      setN8nPasswordRecoveryUrl("");

      // Load Google Calendar integration
      const gcalIntegration = integrations?.find(i => i.integration_type === "google_calendar");
      if (gcalIntegration) {
        setGcalEnabled(gcalIntegration.is_enabled || false);
        const settings = gcalIntegration.settings as Record<string, any> || {};
        setGcalCalendarIdCris(settings.calendar_id_cris || "");
        setGcalCalendarIdDesi(settings.calendar_id_desi || "");
        // Note: credentials are encrypted, we'll show placeholder
        setGcalClientId("••••••••");
        setGcalClientSecret("••••••••");
        setGcalRefreshToken("••••••••");
      }

      // Load n8n integration
      const n8nIntegration = integrations?.find(i => i.integration_type === "n8n");
      if (n8nIntegration) {
        setN8nEnabled(n8nIntegration.is_enabled || false);
        const settings = n8nIntegration.settings as Record<string, any> || {};
        setN8nWebhookUrl(settings.webhook_url || "");
        setN8nCancelWebhookUrl(settings.cancel_webhook_url || "");
        setN8nWhatsappWebhookUrl(settings.whatsapp_webhook_url || "");
        setN8nPasswordRecoveryUrl(settings.password_recovery_url || "");
      }
    } catch (error) {
      console.error("Error fetching integrations:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las integraciones",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveGoogleCalendarIntegration = async () => {
    if (!selectedTenantId) return;
    setSaving(true);

    try {
      // Check if integration exists
      const { data: existing } = await supabase
        .from("tenant_integrations")
        .select("id")
        .eq("tenant_id", selectedTenantId)
        .eq("integration_type", "google_calendar")
        .maybeSingle();

      const settings = {
        calendar_id_cris: gcalCalendarIdCris,
        calendar_id_desi: gcalCalendarIdDesi,
      };

      // Only encrypt credentials if they're not placeholders
      let credentialsEncrypted = null;
      if (gcalClientId && !gcalClientId.includes("••••")) {
        const credentials = JSON.stringify({
          client_id: gcalClientId,
          client_secret: gcalClientSecret,
          refresh_token: gcalRefreshToken,
        });
        
        const { data: encrypted } = await supabase.rpc("encrypt_sensitive_data", {
          _plaintext: credentials,
          _tenant_id: selectedTenantId,
        });
        credentialsEncrypted = encrypted;
      }

      const integrationData: any = {
        tenant_id: selectedTenantId,
        integration_type: "google_calendar",
        is_enabled: gcalEnabled,
        settings,
        updated_at: new Date().toISOString(),
      };

      if (credentialsEncrypted) {
        integrationData.credentials_encrypted = credentialsEncrypted;
      }

      if (existing) {
        const { error } = await supabase
          .from("tenant_integrations")
          .update(integrationData)
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("tenant_integrations")
          .insert(integrationData);
        if (error) throw error;
      }

      toast({
        title: "Guardado",
        description: "Integración de Google Calendar guardada correctamente",
      });
    } catch (error) {
      console.error("Error saving Google Calendar integration:", error);
      toast({
        title: "Error",
        description: "No se pudo guardar la integración",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const saveN8nIntegration = async () => {
    if (!selectedTenantId) return;
    setSaving(true);

    try {
      // Check if integration exists
      const { data: existing } = await supabase
        .from("tenant_integrations")
        .select("id")
        .eq("tenant_id", selectedTenantId)
        .eq("integration_type", "n8n")
        .maybeSingle();

      const settings = {
        webhook_url: n8nWebhookUrl,
        cancel_webhook_url: n8nCancelWebhookUrl,
        whatsapp_webhook_url: n8nWhatsappWebhookUrl,
        password_recovery_url: n8nPasswordRecoveryUrl,
      };

      const integrationData = {
        tenant_id: selectedTenantId,
        integration_type: "n8n",
        is_enabled: n8nEnabled,
        settings,
        updated_at: new Date().toISOString(),
      };

      if (existing) {
        const { error } = await supabase
          .from("tenant_integrations")
          .update(integrationData)
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("tenant_integrations")
          .insert(integrationData);
        if (error) throw error;
      }

      toast({
        title: "Guardado",
        description: "Integración de n8n guardada correctamente",
      });
    } catch (error) {
      console.error("Error saving n8n integration:", error);
      toast({
        title: "Error",
        description: "No se pudo guardar la integración",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading && tenants.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Gestión de Integraciones
          </CardTitle>
          <CardDescription>
            Configura las integraciones de Google Calendar y n8n para cada tenant
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <Label>Seleccionar Tenant</Label>
            <Select value={selectedTenantId} onValueChange={setSelectedTenantId}>
              <SelectTrigger className="w-full max-w-md mt-2">
                <SelectValue placeholder="Selecciona un tenant" />
              </SelectTrigger>
              <SelectContent>
                {tenants.map((tenant) => (
                  <SelectItem key={tenant.id} value={tenant.id}>
                    {tenant.name} ({tenant.slug})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedTenantId && (
            <Tabs defaultValue="google_calendar" className="w-full">
              <TabsList className="grid w-full grid-cols-2 max-w-md">
                <TabsTrigger value="google_calendar" className="gap-2">
                  <Calendar className="h-4 w-4" />
                  Google Calendar
                </TabsTrigger>
                <TabsTrigger value="n8n" className="gap-2">
                  <Webhook className="h-4 w-4" />
                  n8n Webhooks
                </TabsTrigger>
              </TabsList>

              <TabsContent value="google_calendar" className="mt-6 space-y-6">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <Label className="text-base">Habilitar Google Calendar</Label>
                    <p className="text-sm text-muted-foreground">
                      Sincroniza las citas con Google Calendar
                    </p>
                  </div>
                  <Switch checked={gcalEnabled} onCheckedChange={setGcalEnabled} />
                </div>

                <div className="grid gap-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Credenciales OAuth2</Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowSecrets(!showSecrets)}
                    >
                      {showSecrets ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label htmlFor="gcal-client-id">Client ID</Label>
                      <Input
                        id="gcal-client-id"
                        type={showSecrets ? "text" : "password"}
                        value={gcalClientId}
                        onChange={(e) => setGcalClientId(e.target.value)}
                        placeholder="Tu Client ID de Google"
                      />
                    </div>
                    <div>
                      <Label htmlFor="gcal-client-secret">Client Secret</Label>
                      <Input
                        id="gcal-client-secret"
                        type={showSecrets ? "text" : "password"}
                        value={gcalClientSecret}
                        onChange={(e) => setGcalClientSecret(e.target.value)}
                        placeholder="Tu Client Secret de Google"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="gcal-refresh-token">Refresh Token</Label>
                    <Input
                      id="gcal-refresh-token"
                      type={showSecrets ? "text" : "password"}
                      value={gcalRefreshToken}
                      onChange={(e) => setGcalRefreshToken(e.target.value)}
                      placeholder="Tu Refresh Token de Google"
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="gcal-calendar-cris">Calendar ID - Cris</Label>
                    <Input
                      id="gcal-calendar-cris"
                      value={gcalCalendarIdCris}
                      onChange={(e) => setGcalCalendarIdCris(e.target.value)}
                      placeholder="calendar-id@group.calendar.google.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="gcal-calendar-desi">Calendar ID - Desi</Label>
                    <Input
                      id="gcal-calendar-desi"
                      value={gcalCalendarIdDesi}
                      onChange={(e) => setGcalCalendarIdDesi(e.target.value)}
                      placeholder="calendar-id@group.calendar.google.com"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => fetchIntegrations(selectedTenantId)}
                    disabled={saving}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Recargar
                  </Button>
                  <Button onClick={saveGoogleCalendarIntegration} disabled={saving}>
                    {saving ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Guardar Google Calendar
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="n8n" className="mt-6 space-y-6">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <Label className="text-base">Habilitar n8n Webhooks</Label>
                    <p className="text-sm text-muted-foreground">
                      Conecta con n8n para automatizaciones
                    </p>
                  </div>
                  <Switch checked={n8nEnabled} onCheckedChange={setN8nEnabled} />
                </div>

                <div className="grid gap-4">
                  <div>
                    <Label htmlFor="n8n-webhook">Webhook URL (Nueva reserva)</Label>
                    <Input
                      id="n8n-webhook"
                      value={n8nWebhookUrl}
                      onChange={(e) => setN8nWebhookUrl(e.target.value)}
                      placeholder="https://n8n.example.com/webhook/..."
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Se llama cuando se crea una nueva reserva
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="n8n-cancel-webhook">Cancel Webhook URL</Label>
                    <Input
                      id="n8n-cancel-webhook"
                      value={n8nCancelWebhookUrl}
                      onChange={(e) => setN8nCancelWebhookUrl(e.target.value)}
                      placeholder="https://n8n.example.com/webhook/..."
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Se llama cuando se cancela una reserva
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="n8n-whatsapp-webhook">WhatsApp Webhook URL</Label>
                    <Input
                      id="n8n-whatsapp-webhook"
                      value={n8nWhatsappWebhookUrl}
                      onChange={(e) => setN8nWhatsappWebhookUrl(e.target.value)}
                      placeholder="https://n8n.example.com/webhook/..."
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Se llama para enviar mensajes de WhatsApp
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="n8n-password-recovery">Password Recovery Webhook URL</Label>
                    <Input
                      id="n8n-password-recovery"
                      value={n8nPasswordRecoveryUrl}
                      onChange={(e) => setN8nPasswordRecoveryUrl(e.target.value)}
                      placeholder="https://n8n.example.com/webhook/..."
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Se llama para enviar emails de recuperación de contraseña
                    </p>
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => fetchIntegrations(selectedTenantId)}
                    disabled={saving}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Recargar
                  </Button>
                  <Button onClick={saveN8nIntegration} disabled={saving}>
                    {saving ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Guardar n8n
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
