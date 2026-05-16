import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Send, CheckCircle2, Loader2, Building2, User, Mail, Phone, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { BUSINESS_TYPES } from "@/constants/businessTypes";

const leadSchema = z.object({
  business_name: z.string().trim().min(2, "Mínimo 2 caracteres").max(100),
  contact_name: z.string().trim().min(2, "Mínimo 2 caracteres").max(100),
  email: z.string().trim().email("Email no válido").max(255),
  phone: z.string().trim().min(9, "Teléfono no válido").max(20),
  city: z.string().trim().max(100).optional(),
});

const SERVICE_OPTIONS = BUSINESS_TYPES.map((t) => ({ id: t.id, label: t.label }));

export const B2BLeadForm = () => {
  const [form, setForm] = useState({
    business_name: "",
    contact_name: "",
    email: "",
    phone: "",
    city: "",
  });
  const [services, setServices] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { toast } = useToast();

  const toggleService = (id: string) => {
    setServices((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const parsed = leadSchema.safeParse(form);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      parsed.error.errors.forEach((err) => {
        if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from("b2b_leads").insert({
        business_name: parsed.data.business_name,
        contact_name: parsed.data.contact_name,
        email: parsed.data.email,
        phone: parsed.data.phone,
        city: parsed.data.city || null,
        services: services.length > 0 ? services : null,
      });

      if (error) throw error;

      // Send confirmation email (fire-and-forget)
      supabase.functions.invoke('send-email', {
        body: {
          type: 'b2b-lead-confirmation',
          to: parsed.data.email,
          data: {
            contactName: parsed.data.contact_name,
            businessName: parsed.data.business_name,
          },
        },
      }).catch(() => {});

      // Fire n8n webhook (fire-and-forget)
      fetch("https://n8n-n8n.fzgtc4.easypanel.host/webhook/ea27e11c-5dd6-4725-a94b-255923ee2a6f", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          business_name: parsed.data.business_name,
          contact_name: parsed.data.contact_name,
          email: parsed.data.email,
          phone: parsed.data.phone,
          city: parsed.data.city || null,
          services: services.length > 0 ? services : null,
        }),
      }).catch(() => {});

      setSubmitted(true);
    } catch {
      toast({
        title: "Error",
        description: "No se pudo enviar. Inténtalo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="contact-form" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-lg mx-auto"
        >
          <div className="text-center mb-8">
            <span className="text-xs font-semibold text-accent uppercase tracking-wider">
              Opción guante blanco
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold mt-2 mb-3 text-foreground">
              ¿Prefieres que lo montemos contigo?
            </h2>
            <p className="text-muted-foreground text-sm">
              Si no quieres configurarlo tú, déjanos tus datos y un humano te llama en 24 h
              para montarte la web, los servicios y la agenda en una sola sesión. Sin coste.
            </p>
          </div>

          <AnimatePresence mode="wait">
            {submitted ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-card border border-border rounded-2xl p-8 text-center"
              >
                <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">
                  ¡Gracias por tu interés!
                </h3>
                <p className="text-muted-foreground text-sm">
                  Nos pondremos en contacto contigo en las próximas 24 horas.
                </p>
              </motion.div>
            ) : (
              <motion.form
                key="form"
                onSubmit={handleSubmit}
                className="bg-card border border-border rounded-2xl p-6 space-y-4"
              >
                {/* Business name */}
                <div className="space-y-1.5">
                  <Label htmlFor="business_name" className="text-sm font-medium flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                    Nombre del negocio *
                  </Label>
                  <Input
                    id="business_name"
                    placeholder="Ej: Peluquería Cristina"
                    value={form.business_name}
                    onChange={(e) => setForm({ ...form, business_name: e.target.value })}
                    className={errors.business_name ? "border-destructive" : ""}
                  />
                  {errors.business_name && <p className="text-xs text-destructive">{errors.business_name}</p>}
                </div>

                {/* Contact name */}
                <div className="space-y-1.5">
                  <Label htmlFor="contact_name" className="text-sm font-medium flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-muted-foreground" />
                    Tu nombre *
                  </Label>
                  <Input
                    id="contact_name"
                    placeholder="Nombre y apellido"
                    value={form.contact_name}
                    onChange={(e) => setForm({ ...form, contact_name: e.target.value })}
                    className={errors.contact_name ? "border-destructive" : ""}
                  />
                  {errors.contact_name && <p className="text-xs text-destructive">{errors.contact_name}</p>}
                </div>

                {/* Email + Phone row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-sm font-medium flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                      Email *
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="tu@email.com"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className={errors.email ? "border-destructive" : ""}
                    />
                    {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="phone" className="text-sm font-medium flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                      Teléfono *
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="612 345 678"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      className={errors.phone ? "border-destructive" : ""}
                    />
                    {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
                  </div>
                </div>

                {/* City */}
                <div className="space-y-1.5">
                  <Label htmlFor="city" className="text-sm font-medium flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                    Ciudad (opcional)
                  </Label>
                  <Input
                    id="city"
                    placeholder="Ej: Madrid"
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                  />
                </div>

                {/* Services */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Servicios principales (opcional)</Label>
                  <div className="flex flex-wrap gap-2">
                    {SERVICE_OPTIONS.map((s) => (
                      <label
                        key={s.id}
                        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm cursor-pointer transition-colors ${
                          services.includes(s.id)
                            ? "bg-primary/10 border-primary text-foreground"
                            : "border-border text-muted-foreground hover:border-primary/50"
                        }`}
                      >
                        <Checkbox
                          checked={services.includes(s.id)}
                          onCheckedChange={() => toggleService(s.id)}
                          className="hidden"
                        />
                        {s.label}
                      </label>
                    ))}
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 rounded-xl gradient-primary text-white font-medium"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      Solicitar información
                      <Send className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </motion.form>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
};
