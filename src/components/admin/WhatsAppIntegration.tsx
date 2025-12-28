import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Loader2, MessageCircle, Eye, EyeOff, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface WhatsAppIntegrationProps {
  tenantId: string;
}

interface WhatsAppSettings {
  sender_id: string;
  phone_number: string;
  business_name: string;
  // Template configuration
  template_confirmation: string;
  template_cancellation: string;
  template_reminder: string;
  template_language: string;
}

export const WhatsAppIntegration = ({ tenantId }: WhatsAppIntegrationProps) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [apiToken, setApiToken] = useState("");
  const [hasExistingToken, setHasExistingToken] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const [settings, setSettings] = useState<WhatsAppSettings>({
    sender_id: "",
    phone_number: "",
    business_name: "",
    template_confirmation: "reserva_confirmada",
    template_cancellation: "cita_cancelada",
    template_reminder: "recordatorio",
    template_language: "es",
  });
  const [testResult, setTestResult] = useState<"success" | "error" | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchIntegration();
  }, [tenantId]);

  const fetchIntegration = async () => {
    try {
      const { data, error } = await supabase
        .from("tenant_integrations")
        .select("*")
        .eq("tenant_id", tenantId)
        .eq("integration_type", "whatsapp")
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setIsEnabled(data.is_enabled || false);
        setHasExistingToken(!!data.credentials_encrypted);
        const savedSettings = data.settings as unknown as WhatsAppSettings | null;
        if (savedSettings) {
          setSettings({
            sender_id: savedSettings.sender_id || "",
            phone_number: savedSettings.phone_number || "",
            business_name: savedSettings.business_name || "",
            template_confirmation: savedSettings.template_confirmation || "reserva_confirmada",
            template_cancellation: savedSettings.template_cancellation || "cita_cancelada",
            template_reminder: savedSettings.template_reminder || "recordatorio",
            template_language: savedSettings.template_language || "es",
          });
        }
      }
    } catch (error) {
      console.error("Error fetching WhatsApp integration:", error);
      toast({
        title: "Error",
        description: "No se pudo cargar la configuración de WhatsApp",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      // First check if integration exists
      const { data: existing } = await supabase
        .from("tenant_integrations")
        .select("id")
        .eq("tenant_id", tenantId)
        .eq("integration_type", "whatsapp")
        .maybeSingle();

      const integrationData: any = {
        tenant_id: tenantId,
        integration_type: "whatsapp",
        is_enabled: isEnabled,
        settings: settings,
        updated_at: new Date().toISOString(),
      };

      // Only update credentials if a new token was provided
      if (apiToken.trim()) {
        // We'll encrypt the token using a database function
        const { data: encryptedData, error: encryptError } = await supabase
          .rpc('encrypt_sensitive_data', {
            _plaintext: apiToken,
            _tenant_id: tenantId
          });

        if (encryptError) throw encryptError;
        integrationData.credentials_encrypted = encryptedData;
      }

      let error;
      if (existing) {
        const result = await supabase
          .from("tenant_integrations")
          .update(integrationData)
          .eq("id", existing.id);
        error = result.error;
      } else {
        const result = await supabase
          .from("tenant_integrations")
          .insert(integrationData);
        error = result.error;
      }

      if (error) throw error;

      // Also update the whatsapp_sender_id in tenants table for backward compatibility
      await supabase
        .from("tenants")
        .update({ whatsapp_sender_id: settings.sender_id })
        .eq("id", tenantId);

      setHasExistingToken(!!apiToken.trim() || hasExistingToken);
      setApiToken(""); // Clear the token after saving
      
      toast({
        title: "Guardado",
        description: "Configuración de WhatsApp guardada correctamente",
      });
    } catch (error: any) {
      console.error("Error saving WhatsApp integration:", error);
      toast({
        title: "Error",
        description: error.message || "No se pudo guardar la configuración",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    try {
      setTesting(true);
      setTestResult(null);

      // Call the edge function to test the connection
      const { data, error } = await supabase.functions.invoke('get-whatsapp-credentials', {
        body: { tenant_id: tenantId, test_mode: true }
      });

      if (error) throw error;

      if (data?.success) {
        setTestResult("success");
        toast({
          title: "Conexión exitosa",
          description: "La integración de WhatsApp está configurada correctamente",
        });
      } else {
        throw new Error(data?.error || "Error desconocido");
      }
    } catch (error: any) {
      console.error("Error testing WhatsApp connection:", error);
      setTestResult("error");
      toast({
        title: "Error de conexión",
        description: error.message || "No se pudo verificar la conexión",
        variant: "destructive",
      });
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-green-600" />
            <CardTitle>Integración WhatsApp Business</CardTitle>
          </div>
          <Switch
            checked={isEnabled}
            onCheckedChange={setIsEnabled}
          />
        </div>
        <CardDescription>
          Configura tu cuenta de WhatsApp Business API para enviar mensajes automatizados
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Necesitas una cuenta de WhatsApp Business API. Puedes obtenerla a través de 
            proveedores como 360dialog, Twilio, o directamente desde Meta Business Suite.
          </AlertDescription>
        </Alert>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="sender_id">WhatsApp Sender ID *</Label>
            <Input
              id="sender_id"
              value={settings.sender_id}
              onChange={(e) => setSettings({ ...settings, sender_id: e.target.value })}
              placeholder="Ej: 123456789012345"
              disabled={!isEnabled}
            />
            <p className="text-xs text-muted-foreground mt-1">
              ID único de tu número de WhatsApp Business
            </p>
          </div>

          <div>
            <Label htmlFor="phone_number">Número de WhatsApp</Label>
            <Input
              id="phone_number"
              value={settings.phone_number}
              onChange={(e) => setSettings({ ...settings, phone_number: e.target.value })}
              placeholder="+34 600 000 000"
              disabled={!isEnabled}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Tu número de WhatsApp Business con código de país
            </p>
          </div>

          <div className="md:col-span-2">
            <Label htmlFor="business_name">Nombre del Negocio en WhatsApp</Label>
            <Input
              id="business_name"
              value={settings.business_name}
              onChange={(e) => setSettings({ ...settings, business_name: e.target.value })}
              placeholder="Mi Peluquería"
              disabled={!isEnabled}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Nombre que aparecerá en los mensajes de WhatsApp
            </p>
          </div>
        </div>

        {/* Template Configuration Section */}
        <div className="border-t pt-4 mt-4">
          <h4 className="text-sm font-medium mb-3">Configuración de Plantillas</h4>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="template_confirmation">Plantilla de Confirmación</Label>
              <Input
                id="template_confirmation"
                value={settings.template_confirmation}
                onChange={(e) => setSettings({ ...settings, template_confirmation: e.target.value })}
                placeholder="reserva_confirmada"
                disabled={!isEnabled}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Nombre de la plantilla en Meta para confirmar reservas
              </p>
            </div>

            <div>
              <Label htmlFor="template_cancellation">Plantilla de Cancelación</Label>
              <Input
                id="template_cancellation"
                value={settings.template_cancellation}
                onChange={(e) => setSettings({ ...settings, template_cancellation: e.target.value })}
                placeholder="cita_cancelada"
                disabled={!isEnabled}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Nombre de la plantilla en Meta para cancelaciones
              </p>
            </div>

            <div>
              <Label htmlFor="template_reminder">Plantilla de Recordatorio</Label>
              <Input
                id="template_reminder"
                value={settings.template_reminder}
                onChange={(e) => setSettings({ ...settings, template_reminder: e.target.value })}
                placeholder="recordatorio"
                disabled={!isEnabled}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Nombre de la plantilla para recordatorios (usado por n8n)
              </p>
            </div>

            <div>
              <Label htmlFor="template_language">Idioma de Plantillas</Label>
              <Input
                id="template_language"
                value={settings.template_language}
                onChange={(e) => setSettings({ ...settings, template_language: e.target.value })}
                placeholder="es"
                disabled={!isEnabled}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Código de idioma (ej: es, es_ES, en)
              </p>
            </div>
          </div>

          <div className="md:col-span-2">
            <Label htmlFor="api_token">
              API Token {hasExistingToken && "(Token guardado)"}
            </Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  id="api_token"
                  type={showToken ? "text" : "password"}
                  value={apiToken}
                  onChange={(e) => setApiToken(e.target.value)}
                  placeholder={hasExistingToken ? "••••••••••••••••" : "Introduce tu API token"}
                  disabled={!isEnabled}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                  onClick={() => setShowToken(!showToken)}
                  disabled={!isEnabled}
                >
                  {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {hasExistingToken 
                ? "Deja en blanco para mantener el token actual, o introduce uno nuevo para actualizarlo"
                : "Token de acceso de tu proveedor de WhatsApp Business API"
              }
            </p>
          </div>
        </div>

        {/* Status indicators */}
        {testResult && (
          <div className={`flex items-center gap-2 p-3 rounded-lg ${
            testResult === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
          }`}>
            {testResult === "success" ? (
              <>
                <CheckCircle className="h-5 w-5" />
                <span>Conexión verificada correctamente</span>
              </>
            ) : (
              <>
                <XCircle className="h-5 w-5" />
                <span>Error al verificar la conexión</span>
              </>
            )}
          </div>
        )}

        <div className="flex gap-2 pt-4 border-t">
          <Button
            onClick={handleSave}
            disabled={saving || !isEnabled}
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Guardando...
              </>
            ) : (
              "Guardar Configuración"
            )}
          </Button>
          <Button
            variant="outline"
            onClick={handleTestConnection}
            disabled={testing || !isEnabled || !hasExistingToken}
          >
            {testing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Probando...
              </>
            ) : (
              "Probar Conexión"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default WhatsAppIntegration;
