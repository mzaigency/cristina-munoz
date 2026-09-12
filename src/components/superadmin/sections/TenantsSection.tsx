import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Building2,
  Search,
  ExternalLink,
  Edit,
  Plus,
  Loader2,
  Trash2,
  CheckCircle2,
  XCircle,
  Download,
  Calendar,
  Phone,
  Mail,
  SlidersHorizontal,
  TrendingUp,
  UserCheck,
  Sparkles,
  KeyRound,
  Send,
  Copy,
  Check,
  CreditCard,
  Clock,
  Lock,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { logSuperAdminAction } from "@/services/adminAudit";

interface Tenant {
  id: string;
  name: string;
  slug: string;
  email: string | null;
  phone: string | null;
  is_active: boolean;
  subscription_plan: string | null;
  subscription_expires_at?: string | null;
  stripe_customer_id?: string | null;
  stripe_subscription_id?: string | null;
  created_at: string;
  features?: any;
}

export interface TenantStripeInfo {
  isFounder: boolean;
  planName: string;
  priceFormatted: string;
  badgeColor: string;
  statusText: string;
  statusBadgeColor: string;
  renewalText: string;
  daysRemaining: number | null;
  renewalBadgeColor: string;
}

export const getTenantSubscriptionInfo = (tenant: {
  slug: string;
  name: string;
  subscription_plan?: string | null;
  subscription_expires_at?: string | null;
  is_active?: boolean;
}): TenantStripeInfo => {
  const isFounder =
    tenant.slug === "cristina-munoz" ||
    tenant.name.toLowerCase().includes("cristina muñoz");

  if (isFounder) {
    return {
      isFounder: true,
      planName: "Plan Fundador Vitalicio",
      priceFormatted: "0,00 € (Gratis)",
      badgeColor: "bg-purple-500/15 text-purple-600 border-purple-500/30",
      statusText: "Activo para siempre",
      statusBadgeColor: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
      renewalText: "Activo hasta siempre • Sin pagos",
      daysRemaining: null,
      renewalBadgeColor: "bg-purple-500/10 text-purple-600 border-purple-500/20",
    };
  }

  const rawPlan = (tenant.subscription_plan || "starter").toLowerCase();
  let planName = "Plan Starter";
  let priceFormatted = "29,00 € / mes";
  let badgeColor = "bg-blue-500/10 text-blue-600 border-blue-500/20";

  if (rawPlan === "pro") {
    planName = "Plan Pro";
    priceFormatted = "49,00 € / mes";
    badgeColor = "bg-purple-500/10 text-purple-600 border-purple-500/30";
  } else if (rawPlan === "business" || rawPlan === "vip") {
    planName = "Plan Business VIP";
    priceFormatted = "79,00 € / mes";
    badgeColor = "bg-amber-500/10 text-amber-600 border-amber-500/30";
  } else if (rawPlan === "free") {
    planName = "Plan Free";
    priceFormatted = "0,00 € / mes";
    badgeColor = "bg-slate-500/10 text-slate-600 border-slate-500/20";
  }

  let statusText = tenant.is_active ? "Activa en Stripe" : "Inactiva";
  let statusBadgeColor = tenant.is_active
    ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
    : "bg-rose-500/10 text-rose-600 border-rose-500/20";

  let renewalText = "Sin fecha fija en Stripe";
  let daysRemaining: number | null = null;
  let renewalBadgeColor = "bg-slate-500/10 text-slate-600 border-slate-500/20";

  if (tenant.subscription_expires_at) {
    const expDate = new Date(tenant.subscription_expires_at);
    const now = new Date();
    daysRemaining = Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const dateFormatted = format(expDate, "dd/MM/yyyy", { locale: es });

    if (daysRemaining > 7) {
      renewalText = `Renueva en ${daysRemaining} días (${dateFormatted})`;
      renewalBadgeColor = "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
    } else if (daysRemaining > 0) {
      renewalText = `Vence en ${daysRemaining} días (${dateFormatted})`;
      renewalBadgeColor = "bg-amber-500/10 text-amber-600 border-amber-500/20";
    } else if (daysRemaining === 0) {
      renewalText = `Vence hoy (${dateFormatted})`;
      renewalBadgeColor = "bg-rose-500/10 text-rose-600 border-rose-500/20";
    } else {
      renewalText = `Venció hace ${Math.abs(daysRemaining)} días (${dateFormatted})`;
      renewalBadgeColor = "bg-rose-500/10 text-rose-600 border-rose-500/20";
      statusText = "Expirada";
      statusBadgeColor = "bg-rose-500/10 text-rose-600 border-rose-500/20";
    }
  } else if (tenant.is_active) {
    renewalText = "Gestionada en Stripe (Al día)";
    renewalBadgeColor = "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
  }

  return {
    isFounder: false,
    planName,
    priceFormatted,
    badgeColor,
    statusText,
    statusBadgeColor,
    renewalText,
    daysRemaining,
    renewalBadgeColor,
  };
};

interface TenantsSectionProps {
  subtab: string;
  onNavigateTab: (tab: string, subtab: string) => void;
  isCreateModalOpen: boolean;
  onCloseCreateModal: () => void;
  onOpenCreateModal: () => void;
}

export const TenantsSection: React.FC<TenantsSectionProps> = ({
  subtab,
  onNavigateTab,
  isCreateModalOpen,
  onCloseCreateModal,
  onOpenCreateModal,
}) => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [planFilter, setPlanFilter] = useState<string>("all");

  // Edit / Detail Modal
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    slug: "",
    email: "",
    phone: "",
    is_active: true,
  });

  // Create Form
  const [newTenantForm, setNewTenantForm] = useState({
    name: "",
    slug: "",
    email: "",
    phone: "",
    subscription_plan: "starter",
  });
  const [creating, setCreating] = useState(false);

  // Direct Reset State (Modo Dios)
  const [sendingResetForEmail, setSendingResetForEmail] = useState<string | null>(null);

  // Deletion States (Tenant & Lead)
  const [tenantToDelete, setTenantToDelete] = useState<Tenant | null>(null);
  const [deletingTenant, setDeletingTenant] = useState(false);

  const [leadToDelete, setLeadToDelete] = useState<any | null>(null);
  const [deletingLead, setDeletingLead] = useState(false);

  const [checkingStripeId, setCheckingStripeId] = useState<string | null>(null);

  // B2B Leads for subtab b2b_leads
  const [leads, setLeads] = useState<any[]>([]);
  const [loadingLeads, setLoadingLeads] = useState(false);
  const [leadDetail, setLeadDetail] = useState<any | null>(null);

  // Lead Conversion Modal (Option 4)
  const [convertModalOpen, setConvertModalOpen] = useState(false);
  const [leadToConvert, setLeadToConvert] = useState<any | null>(null);
  const [convertForm, setConvertForm] = useState({
    name: "",
    slug: "",
    email: "",
    phone: "",
    subscription_plan: "pro",
    sendInviteEmail: true,
    markAsConverted: true,
  });
  const [convertingLead, setConvertingLead] = useState(false);

  // New Lead Modal (CRM Direct Creation)
  const [newLeadModalOpen, setNewLeadModalOpen] = useState(false);
  const [newLeadForm, setNewLeadForm] = useState({
    business_name: "",
    contact_name: "",
    email: "",
    phone: "",
    city: "",
    notes: "",
  });
  const [savingNewLead, setSavingNewLead] = useState(false);

  const handleCreateLead = async () => {
    if (!newLeadForm.business_name.trim()) {
      toast({
        title: "Campo requerido",
        description: "El nombre del negocio es obligatorio.",
        variant: "destructive",
      });
      return;
    }
    setSavingNewLead(true);
    try {
      const { error } = await supabase.from("b2b_leads").insert({
        business_name: newLeadForm.business_name.trim(),
        contact_name: newLeadForm.contact_name.trim() || null,
        email: newLeadForm.email.trim() || null,
        phone: newLeadForm.phone.trim() || null,
        city: newLeadForm.city.trim() || null,
        notes: newLeadForm.notes.trim() || null,
        status: "nuevo",
      });

      if (error) throw error;

      toast({
        title: "Lead añadido al CRM",
        description: `"${newLeadForm.business_name}" se ha registrado en Nuevos Leads.`,
      });

      setNewLeadModalOpen(false);
      setNewLeadForm({
        business_name: "",
        contact_name: "",
        email: "",
        phone: "",
        city: "",
        notes: "",
      });
      fetchLeads();
    } catch (err: any) {
      toast({
        title: "Error al crear lead",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setSavingNewLead(false);
    }
  };

  useEffect(() => {
    fetchTenants();
    if (subtab === "b2b_leads" || subtab === "onboarding") {
      fetchLeads();
    }
  }, [subtab]);

  const fetchTenants = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("tenants")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTenants(data || []);
    } catch (err: any) {
      toast({
        title: "Error al cargar salones",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchLeads = async () => {
    setLoadingLeads(true);
    try {
      const { data, error } = await supabase
        .from("b2b_leads")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setLeads(data || []);
    } catch (err: any) {
      console.error("Error fetching leads:", err);
    } finally {
      setLoadingLeads(false);
    }
  };

  const handleOpenDetail = (t: Tenant) => {
    setSelectedTenant(t);
    setEditForm({
      name: t.name || "",
      slug: t.slug || "",
      email: t.email || "",
      phone: t.phone || "",
      is_active: t.is_active,
    });
    setIsDetailOpen(true);
  };

  const handleSendResetToOwner = async (email: string, tenantName: string) => {
    if (!email) return;
    setSendingResetForEmail(email);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.toLowerCase().trim(), {
        redirectTo: `${window.location.origin}/nueva-contrasena`,
      });
      if (error) throw error;

      await logSuperAdminAction({
        action: "SEND_PASSWORD_RESET",
        target_type: "tenant",
        target_name: tenantName,
        details: { email, origin: "tenant_directory" },
      });

      toast({
        title: "Enlace de acceso enviado",
        description: `Se ha enviado un correo con instrucciones de restablecimiento a ${email}.`,
      });
    } catch (err: any) {
      toast({
        title: "Error al enviar enlace",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setSendingResetForEmail(null);
    }
  };

  const handleOpenConvertLead = (lead: any) => {
    const autoSlug = (lead.business_name || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");

    setLeadToConvert(lead);
    setConvertForm({
      name: lead.business_name || "",
      slug: autoSlug,
      email: lead.email || "",
      phone: lead.phone || "",
      subscription_plan: "pro",
      sendInviteEmail: Boolean(lead.email),
      markAsConverted: true,
    });
    setLeadDetail(null);
    setConvertModalOpen(true);
  };

  const handleExecuteConvertLead = async () => {
    if (!convertForm.name.trim() || !convertForm.slug.trim()) {
      toast({
        title: "Campos requeridos",
        description: "El nombre y el slug del salón son obligatorios.",
        variant: "destructive",
      });
      return;
    }

    setConvertingLead(true);
    try {
      const formattedSlug = convertForm.slug
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");

      // 1. Alta en la base de salones
      const { data: newTenant, error: tenantErr } = await supabase
        .from("tenants")
        .insert({
          name: convertForm.name.trim(),
          slug: formattedSlug,
          email: convertForm.email.trim() || null,
          phone: convertForm.phone.trim() || null,
          subscription_plan: convertForm.subscription_plan,
          is_active: true,
        })
        .select()
        .single();

      if (tenantErr) throw tenantErr;

      // 2. Marcar en CRM como convertido
      if (convertForm.markAsConverted && leadToConvert?.id) {
        await supabase
          .from("b2b_leads")
          .update({ status: "convertido", updated_at: new Date().toISOString() })
          .eq("id", leadToConvert.id);
      }

      // 3. Enviar email de activación / contraseña si se activó y existe email
      let inviteSent = false;
      if (convertForm.sendInviteEmail && convertForm.email.trim()) {
        try {
          const { error: resetErr } = await supabase.auth.resetPasswordForEmail(
            convertForm.email.toLowerCase().trim(),
            { redirectTo: `${window.location.origin}/nueva-contrasena` }
          );
          if (!resetErr) inviteSent = true;
        } catch (e) {
          console.warn("Could not send activation email to owner:", e);
        }
      }

      // 4. Registro en el Audit Trail
      await logSuperAdminAction({
        action: "CONVERT_B2B_LEAD",
        target_type: "tenant",
        target_id: newTenant?.id,
        target_name: convertForm.name,
        details: {
          slug: formattedSlug,
          plan: convertForm.subscription_plan,
          email: convertForm.email,
          lead_id: leadToConvert?.id,
          invite_sent: inviteSent,
        },
      });

      toast({
        title: "🎉 ¡Salón Convertido y Activado!",
        description: `"${convertForm.name}" ya es un salón oficial.${
          inviteSent ? " Se ha enviado el email con acceso al dueño." : ""
        }`,
      });

      setConvertModalOpen(false);
      fetchLeads();
      fetchTenants();
    } catch (err: any) {
      toast({
        title: "Error en la conversión",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setConvertingLead(false);
    }
  };

  const handleSaveDetail = async () => {
    if (!selectedTenant) return;
    setSavingEdit(true);
    try {
      const { error } = await supabase
        .from("tenants")
        .update({
          name: editForm.name.trim(),
          slug: editForm.slug.trim(),
          email: editForm.email.trim() || null,
          phone: editForm.phone.trim() || null,
          is_active: editForm.is_active,
        })
        .eq("id", selectedTenant.id);

      if (error) throw error;

      await logSuperAdminAction({
        action: "UPDATE_SALON",
        target_type: "tenant",
        target_id: selectedTenant.id,
        target_name: editForm.name,
        details: {
          slug: editForm.slug,
          is_active: editForm.is_active,
          email: editForm.email,
          phone: editForm.phone,
        },
      });

      toast({
        title: "Salón actualizado",
        description: `Los datos de "${editForm.name}" se han guardado con éxito.`,
      });

      setIsDetailOpen(false);
      fetchTenants();
    } catch (err: any) {
      toast({
        title: "Error al actualizar",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setSavingEdit(false);
    }
  };

  const handleRequestDeleteTenant = (tenant: Tenant) => {
    if (tenant.slug === "cristina-munoz" || tenant.name.toLowerCase().includes("cristina muñoz")) {
      toast({
        title: "Salón Fundador Protegido",
        description: "El salón Cristina Muñoz es el Salón Fundador y no se puede eliminar.",
        variant: "destructive",
      });
      return;
    }
    setTenantToDelete(tenant);
  };

  const handleExecuteDeleteTenant = async () => {
    if (!tenantToDelete) return;
    if (tenantToDelete.slug === "cristina-munoz" || tenantToDelete.name.toLowerCase().includes("cristina muñoz")) {
      toast({
        title: "Salón Fundador Protegido",
        description: "El salón Cristina Muñoz no se puede eliminar.",
        variant: "destructive",
      });
      setTenantToDelete(null);
      return;
    }

    setDeletingTenant(true);
    try {
      const { error } = await supabase
        .from("tenants")
        .delete()
        .eq("id", tenantToDelete.id);

      if (error) throw error;

      await logSuperAdminAction({
        action: "DELETE_TENANT",
        target_type: "tenant",
        target_id: tenantToDelete.id,
        target_name: tenantToDelete.name,
        details: { slug: tenantToDelete.slug },
      });

      toast({
        title: "Salón eliminado",
        description: `"${tenantToDelete.name}" ha sido eliminado definitivamente.`,
      });

      setTenantToDelete(null);
      setIsDetailOpen(false);
      fetchTenants();
    } catch (err: any) {
      toast({
        title: "Error al eliminar salón",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setDeletingTenant(false);
    }
  };

  const handleExecuteDeleteLead = async () => {
    if (!leadToDelete) return;
    setDeletingLead(true);
    try {
      const { error } = await supabase
        .from("b2b_leads")
        .delete()
        .eq("id", leadToDelete.id);

      if (error) throw error;

      await logSuperAdminAction({
        action: "DELETE_LEAD",
        target_type: "lead",
        target_id: leadToDelete.id,
        target_name: leadToDelete.business_name,
      });

      toast({
        title: "Lead eliminado",
        description: `El prospecto "${leadToDelete.business_name}" se ha retirado del CRM.`,
      });

      setLeadToDelete(null);
      setLeadDetail(null);
      fetchLeads();
    } catch (err: any) {
      toast({
        title: "Error al eliminar lead",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setDeletingLead(false);
    }
  };

  const handleCheckStripeSubscription = async (tenantId: string) => {
    setCheckingStripeId(tenantId);
    try {
      const { data, error } = await supabase.functions.invoke("check-subscription", {
        body: { tenantId },
      });
      if (error) throw error;

      if (data?.has_subscription) {
        toast({
          title: "Suscripción Stripe Activa",
          description: `Plan: ${data.plan_slug || "Starter"}. Renovación: ${
            data.subscription_end
              ? format(new Date(data.subscription_end), "dd/MM/yyyy")
              : "Al día"
          }.`,
        });
      } else {
        toast({
          title: "Sin suscripción Stripe",
          description: "No se encontró suscripción de pago activa para este salón en Stripe.",
        });
      }
      fetchTenants();
    } catch (err: any) {
      toast({
        title: "Consulta a Stripe",
        description: err.message || "No se pudo sincronizar con Stripe.",
        variant: "destructive",
      });
    } finally {
      setCheckingStripeId(null);
    }
  };

  const handleCreateTenant = async () => {
    if (!newTenantForm.name || !newTenantForm.slug) {
      toast({
        title: "Campos obligatorios",
        description: "El nombre y el slug del salón son requeridos.",
        variant: "destructive",
      });
      return;
    }

    setCreating(true);
    try {
      const formattedSlug = newTenantForm.slug
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, "-")
        .replace(/-+/g, "-");

      const { data, error } = await supabase
        .from("tenants")
        .insert({
          name: newTenantForm.name.trim(),
          slug: formattedSlug,
          email: newTenantForm.email.trim() || null,
          phone: newTenantForm.phone.trim() || null,
          subscription_plan: newTenantForm.subscription_plan,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;

      let inviteSent = false;
      if (newTenantForm.email.trim()) {
        try {
          const { error: inviteErr } = await supabase.auth.resetPasswordForEmail(
            newTenantForm.email.toLowerCase().trim(),
            { redirectTo: `${window.location.origin}/nueva-contrasena` }
          );
          if (!inviteErr) inviteSent = true;
        } catch (e) {
          console.warn("Could not invite owner on salon create:", e);
        }
      }

      await logSuperAdminAction({
        action: "CREATE_SALON",
        target_type: "tenant",
        target_id: data?.id,
        target_name: newTenantForm.name,
        details: {
          slug: formattedSlug,
          subscription_plan: newTenantForm.subscription_plan,
          email: newTenantForm.email,
          invite_sent: inviteSent,
        },
      });

      toast({
        title: "🎉 Salón creado con éxito",
        description: `El salón "${newTenantForm.name}" ya está dado de alta en la plataforma.${
          inviteSent ? " Se ha enviado el correo de activación." : ""
        }`,
      });

      onCloseCreateModal();
      setNewTenantForm({
        name: "",
        slug: "",
        email: "",
        phone: "",
        subscription_plan: "pro",
      });
      fetchTenants();
    } catch (err: any) {
      toast({
        title: "Error al crear salón",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const handleImpersonate = async (slug: string, name?: string) => {
    await logSuperAdminAction({
      action: "IMPERSONATE_SALON",
      target_type: "tenant",
      target_name: name || slug,
      details: { slug, path: `/admin/${slug}` },
    });
    navigate(`/admin/${slug}`);
  };

  const handleExportCSV = () => {
    const headers = ["ID", "Nombre", "Slug", "Email", "Teléfono", "Plan", "Estado", "Fecha Creación"];
    const rows = tenants.map((t) => [
      t.id,
      `"${t.name.replace(/"/g, '""')}"`,
      t.slug,
      t.email || "",
      t.phone || "",
      t.subscription_plan,
      t.is_active ? "Activo" : "Inactivo",
      t.created_at,
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `glowapp-salones-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered tenants
  const filteredTenants = tenants.filter((t) => {
    const matchesSearch =
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.email && t.email.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && t.is_active) ||
      (statusFilter === "inactive" && !t.is_active);

    const isFounderSalon = t.slug === "cristina-munoz" || t.name.toLowerCase().includes("cristina muñoz");
    const matchesPlan =
      planFilter === "all" ||
      (planFilter === "founder" && isFounderSalon) ||
      (planFilter !== "founder" && t.subscription_plan === planFilter);

    return matchesSearch && matchesStatus && matchesPlan;
  });

  const renderConvertLeadModal = () => (
    <Dialog open={convertModalOpen} onOpenChange={setConvertModalOpen}>
      <DialogContent className="rounded-2xl max-w-lg border-[var(--glow-brand)]/20 shadow-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-[var(--glow-brand)] to-[#98329A] text-white">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-foreground">
                Conversión Directa: Lead a Salón Oficial
              </DialogTitle>
              <DialogDescription className="text-xs">
                Modo Dios: Da de alta el salón, asigna plan y envía credenciales directas al propietario.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-3.5 py-2 text-xs">
          {leadToConvert && (
            <div className="p-3 rounded-xl bg-muted/40 border border-[var(--glow-line)] flex items-center justify-between">
              <div>
                <span className="text-[10px] text-muted-foreground block font-bold uppercase tracking-wider">
                  Lead de Origen
                </span>
                <span className="font-bold text-foreground text-xs">{leadToConvert.business_name}</span>
                <span className="text-[11px] text-muted-foreground block">
                  Contacto: {leadToConvert.contact_name || "Dueño"} • {leadToConvert.city || "Sin ciudad"}
                </span>
              </div>
              <Badge variant="outline" className="bg-[var(--glow-brand-soft)] text-[var(--glow-brand)] border-[var(--glow-brand-softer)] text-[10px] font-bold">
                B2B Lead
              </Badge>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Nombre Comercial *</Label>
              <Input
                value={convertForm.name}
                onChange={(e) => {
                  const name = e.target.value;
                  const autoSlug = name
                    .toLowerCase()
                    .normalize("NFD")
                    .replace(/[\u0300-\u036f]/g, "")
                    .replace(/[^a-z0-9]/g, "-")
                    .replace(/-+/g, "-")
                    .replace(/^-|-$/g, "");
                  setConvertForm({ ...convertForm, name, slug: autoSlug });
                }}
                placeholder="Nombre del salón"
                className="h-8.5 text-xs rounded-xl"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Slug URL Pública *</Label>
              <Input
                value={convertForm.slug}
                onChange={(e) => setConvertForm({ ...convertForm, slug: e.target.value })}
                placeholder="slug-del-salon"
                className="h-8.5 text-xs rounded-xl font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Email del Propietario *</Label>
              <Input
                type="email"
                value={convertForm.email}
                onChange={(e) => setConvertForm({ ...convertForm, email: e.target.value })}
                placeholder="propietario@salon.es"
                className="h-8.5 text-xs rounded-xl"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Teléfono</Label>
              <Input
                value={convertForm.phone}
                onChange={(e) => setConvertForm({ ...convertForm, phone: e.target.value })}
                placeholder="+34 600..."
                className="h-8.5 text-xs rounded-xl"
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Plan de Suscripción Inicial</Label>
            <select
              value={convertForm.subscription_plan}
              onChange={(e) => setConvertForm({ ...convertForm, subscription_plan: e.target.value })}
              className="w-full h-8.5 px-3 text-xs rounded-xl border border-[var(--glow-line)] bg-background text-foreground outline-none cursor-pointer"
            >
              <option value="free">Free (Básico)</option>
              <option value="starter">Starter</option>
              <option value="pro">Pro (Recomendado)</option>
              <option value="vip">VIP / Enterprise</option>
            </select>
          </div>

          {/* Opciones Dios */}
          <div className="space-y-2 pt-2 border-t border-[var(--glow-line)]">
            <div className="flex items-center justify-between p-2.5 rounded-xl border border-[var(--glow-line)] bg-muted/30">
              <div className="flex flex-col">
                <span className="font-bold text-[11px] text-foreground flex items-center gap-1.5">
                  <KeyRound className="h-3.5 w-3.5 text-[var(--glow-brand)]" />
                  Enviar Enlace de Activación y Contraseña
                </span>
                <span className="text-[10px] text-muted-foreground">
                  El dueño recibirá un email directo para establecer su contraseña y entrar al panel
                </span>
              </div>
              <Switch
                checked={convertForm.sendInviteEmail}
                onCheckedChange={(val) => setConvertForm({ ...convertForm, sendInviteEmail: val })}
                disabled={!convertForm.email}
              />
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl border border-[var(--glow-line)] bg-muted/30">
              <div className="flex flex-col">
                <span className="font-bold text-[11px] text-foreground flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  Marcar como 'Convertido' en el CRM
                </span>
                <span className="text-[10px] text-muted-foreground">
                  Mueve el lead automáticamente a la columna de convertidos
                </span>
              </div>
              <Switch
                checked={convertForm.markAsConverted}
                onCheckedChange={(val) => setConvertForm({ ...convertForm, markAsConverted: val })}
              />
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setConvertModalOpen(false)}
            className="rounded-xl text-xs"
          >
            Cancelar
          </Button>
          <Button
            size="sm"
            onClick={handleExecuteConvertLead}
            disabled={convertingLead}
            className="rounded-xl bg-gradient-to-r from-[var(--glow-brand)] to-[#98329A] text-white hover:brightness-105 text-xs font-bold gap-1.5 shadow-sm"
          >
            {convertingLead ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Sparkles className="h-3.5 w-3.5" />
            )}
            <span>Convertir y Activar Salón</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  const renderDeleteTenantModal = () => {
    if (!tenantToDelete) return null;
    return (
      <Dialog open={!!tenantToDelete} onOpenChange={() => !deletingTenant && setTenantToDelete(null)}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-rose-600 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              <span>¿Eliminar salón definitivamente?</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Esta acción es destructiva e irreversible.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300">
              <p className="font-semibold text-xs mb-1">
                Estás a punto de eliminar: <span className="font-black underline">{tenantToDelete.name}</span> (/{tenantToDelete.slug})
              </p>
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                Se eliminará el perfil del salón en la base de datos, desconectando sus servicios, estilistas y configuración.
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setTenantToDelete(null)}
              disabled={deletingTenant}
              className="rounded-xl text-xs"
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleExecuteDeleteTenant}
              disabled={deletingTenant}
              className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold gap-1.5 shadow-sm"
            >
              {deletingTenant ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Trash2 className="h-3.5 w-3.5" />
              )}
              <span>Eliminar Salón</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  const renderDeleteLeadModal = () => {
    if (!leadToDelete) return null;
    return (
      <Dialog open={!!leadToDelete} onOpenChange={() => !deletingLead && setLeadToDelete(null)}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-rose-600 flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              <span>¿Eliminar prospecto del CRM?</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Se eliminará este lead y su oportunidad comercial del pipeline.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-2 text-xs">
            <div className="p-3 rounded-xl bg-muted/50 border border-[var(--glow-line)]">
              <span className="text-[10px] text-muted-foreground block">Nombre del Negocio</span>
              <span className="font-bold text-foreground text-sm block">
                {leadToDelete.business_name}
              </span>
              {leadToDelete.email && (
                <span className="text-[11px] text-muted-foreground block mt-1">
                  {leadToDelete.email} {leadToDelete.city ? `• ${leadToDelete.city}` : ""}
                </span>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLeadToDelete(null)}
              disabled={deletingLead}
              className="rounded-xl text-xs"
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleExecuteDeleteLead}
              disabled={deletingLead}
              className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold gap-1.5 shadow-sm"
            >
              {deletingLead ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Trash2 className="h-3.5 w-3.5" />
              )}
              <span>Eliminar Lead</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  // 1. Subtab: Leads B2B & CRM Kanban
  if (subtab === "b2b_leads") {
    const KANBAN_COLS = [
      { id: "nuevo", label: "Nuevos Leads", color: "border-blue-500/30 bg-blue-500/5 text-blue-600" },
      { id: "contactado", label: "Contactados", color: "border-amber-500/30 bg-amber-500/5 text-amber-600" },
      { id: "en_proceso", label: "Demo Agendada", color: "border-purple-500/30 bg-purple-500/5 text-purple-600" },
      { id: "convertido", label: "Convertidos", color: "border-emerald-500/30 bg-emerald-500/5 text-emerald-600" },
      { id: "descartado", label: "Descartados", color: "border-slate-500/30 bg-slate-500/5 text-slate-600" },
    ];

    const updateLeadStatus = async (leadId: string, newStatus: string) => {
      try {
        const { error } = await supabase
          .from("b2b_leads")
          .update({ status: newStatus, updated_at: new Date().toISOString() })
          .eq("id", leadId);
        if (error) throw error;
        toast({ title: "Estado actualizado", description: `El lead ahora está en "${newStatus}".` });
        fetchLeads();
      } catch (err: any) {
        toast({ title: "Error", description: err.message, variant: "destructive" });
      }
    };

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-foreground">
              Pipeline B2B & CRM de Captación
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Gestiona el ciclo de ventas de salones captados a través del portal de negocios o referidos.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchLeads}
              className="gap-1.5 rounded-xl text-xs"
            >
              <Loader2 className={loadingLeads ? "h-3.5 w-3.5 animate-spin" : "h-3.5 w-3.5"} />
              <span>Refrescar CRM</span>
            </Button>
            <Button
              size="sm"
              onClick={() => setNewLeadModalOpen(true)}
              className="gap-1.5 rounded-xl text-xs bg-gradient-to-r from-[var(--glow-brand)] to-[#98329A] text-white hover:brightness-105 font-bold shadow-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Nuevo Lead B2B</span>
            </Button>
          </div>
        </div>

        {/* Tablero Kanban */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3.5 overflow-x-auto pb-4">
          {KANBAN_COLS.map((col) => {
            const colLeads = leads.filter((l) => (l.status || "nuevo") === col.id);
            return (
              <div
                key={col.id}
                className="flex flex-col rounded-2xl border border-[var(--glow-line)] bg-card p-3 shadow-2xs min-w-[210px]"
              >
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-[var(--glow-line)]/70">
                  <span className="text-xs font-bold text-foreground truncate">
                    {col.label}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-muted text-muted-foreground">
                    {colLeads.length}
                  </span>
                </div>

                <div className="flex-1 space-y-2.5 overflow-y-auto max-h-[520px]">
                  {colLeads.length === 0 ? (
                    <div className="py-8 text-center text-[11px] text-muted-foreground">
                      Sin leads
                    </div>
                  ) : (
                    colLeads.map((lead) => (
                      <div
                        key={lead.id}
                        className="p-3 rounded-xl border border-[var(--glow-line)] bg-background hover:border-[var(--glow-brand-softer)] transition-all shadow-2xs space-y-2 cursor-pointer"
                        onClick={() => setLeadDetail(lead)}
                      >
                        <div className="flex items-start justify-between gap-1">
                          <span className="text-xs font-bold text-foreground leading-tight">
                            {lead.business_name}
                          </span>
                          <span className="text-[10px] text-muted-foreground shrink-0">
                            {lead.city || ""}
                          </span>
                        </div>

                        <div className="text-[11px] text-muted-foreground space-y-0.5">
                          <div className="flex items-center gap-1.5 truncate">
                            <Mail className="h-3 w-3 shrink-0" />
                            <span className="truncate">{lead.email}</span>
                          </div>
                          {lead.phone && (
                            <div className="flex items-center gap-1.5">
                              <Phone className="h-3 w-3 shrink-0" />
                              <span>{lead.phone}</span>
                            </div>
                          )}
                        </div>

                        {/* Quick state change and god-mode convert button */}
                        <div
                          className="pt-1 flex items-center justify-between gap-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <select
                            value={lead.status || "nuevo"}
                            onChange={(e) => updateLeadStatus(lead.id, e.target.value)}
                            className="text-[10px] font-semibold bg-muted/60 border border-[var(--glow-line)] rounded-lg px-2 py-1 outline-none text-foreground"
                          >
                            <option value="nuevo">Nuevo</option>
                            <option value="contactado">Contactado</option>
                            <option value="en_proceso">Demo</option>
                            <option value="convertido">Convertido</option>
                            <option value="descartado">Descartado</option>
                          </select>

                          <div className="flex items-center gap-1">
                            {lead.status !== "convertido" ? (
                              <button
                                type="button"
                                onClick={() => handleOpenConvertLead(lead)}
                                className="px-2 py-1 rounded-lg bg-[var(--glow-brand)] text-white text-[10px] font-bold flex items-center gap-1 hover:brightness-110 cursor-pointer shrink-0"
                                title="Convertir lead a salón oficial y activar"
                              >
                                <Sparkles className="h-2.5 w-2.5" />
                                <span>Convertir</span>
                              </button>
                            ) : (
                              <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                                <Check className="h-3 w-3" />
                                <span>Salón Activo</span>
                              </span>
                            )}

                            <button
                              type="button"
                              onClick={() => setLeadToDelete(lead)}
                              className="p-1 rounded-lg text-muted-foreground hover:text-rose-600 hover:bg-rose-500/10 transition-colors"
                              title="Eliminar lead del CRM"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal Detalle Lead */}
        {leadDetail && (
          <Dialog open={!!leadDetail} onOpenChange={() => setLeadDetail(null)}>
            <DialogContent className="rounded-2xl max-w-md">
              <DialogHeader>
                <DialogTitle className="text-base font-bold">
                  {leadDetail.business_name}
                </DialogTitle>
                <DialogDescription className="text-xs">
                  Contacto: {leadDetail.contact_name || "No especificado"}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-muted/50">
                  <div>
                    <span className="text-muted-foreground block text-[10px]">Email</span>
                    <span className="font-semibold text-foreground">{leadDetail.email}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px]">Teléfono</span>
                    <span className="font-semibold text-foreground">{leadDetail.phone || "—"}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px]">Ciudad</span>
                    <span className="font-semibold text-foreground">{leadDetail.city || "—"}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px]">Fecha de registro</span>
                    <span className="font-semibold text-foreground">
                      {format(new Date(leadDetail.created_at), "dd MMM yyyy", { locale: es })}
                    </span>
                  </div>
                </div>

                {leadDetail.notes && (
                  <div>
                    <span className="font-bold text-foreground block mb-1">Notas</span>
                    <p className="p-2.5 rounded-xl border border-[var(--glow-line)] bg-background text-muted-foreground leading-relaxed">
                      {leadDetail.notes}
                    </p>
                  </div>
                )}
              </div>

              <DialogFooter className="flex items-center justify-between gap-2 sm:justify-between">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setLeadToDelete(leadDetail);
                    setLeadDetail(null);
                  }}
                  className="rounded-xl text-xs text-rose-600 border-rose-500/30 hover:bg-rose-500/10 gap-1"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Eliminar Lead</span>
                </Button>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setLeadDetail(null)}
                    className="rounded-xl text-xs"
                  >
                    Cerrar
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleOpenConvertLead(leadDetail)}
                    className="rounded-xl bg-gradient-to-r from-[var(--glow-brand)] to-[#98329A] text-white text-xs font-bold gap-1 shadow-sm"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Convertir a Salón</span>
                  </Button>
                </div>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        {/* Modal Alta Rápida de Lead B2B */}
        <Dialog open={newLeadModalOpen} onOpenChange={setNewLeadModalOpen}>
          <DialogContent className="rounded-2xl max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base font-bold flex items-center gap-2">
                <Plus className="h-4 w-4 text-[var(--glow-brand)]" />
                <span>Registrar Nuevo Lead B2B</span>
              </DialogTitle>
              <DialogDescription className="text-xs">
                Añade un salón prospecto captado manualmente para seguir su oportunidad en el pipeline.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-2 text-xs">
              <div className="space-y-1">
                <Label className="text-xs">Nombre del Negocio / Salón *</Label>
                <Input
                  value={newLeadForm.business_name}
                  onChange={(e) => setNewLeadForm({ ...newLeadForm, business_name: e.target.value })}
                  placeholder="Ej: Beauty Studio Deluxe"
                  className="h-8.5 text-xs rounded-xl"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Persona de Contacto</Label>
                <Input
                  value={newLeadForm.contact_name}
                  onChange={(e) => setNewLeadForm({ ...newLeadForm, contact_name: e.target.value })}
                  placeholder="Ej: Laura Gómez"
                  className="h-8.5 text-xs rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <Label className="text-xs">Email</Label>
                  <Input
                    type="email"
                    value={newLeadForm.email}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, email: e.target.value })}
                    placeholder="contacto@salon.es"
                    className="h-8.5 text-xs rounded-xl"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Teléfono</Label>
                  <Input
                    value={newLeadForm.phone}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, phone: e.target.value })}
                    placeholder="+34 600..."
                    className="h-8.5 text-xs rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Ciudad</Label>
                <Input
                  value={newLeadForm.city}
                  onChange={(e) => setNewLeadForm({ ...newLeadForm, city: e.target.value })}
                  placeholder="Ej: Madrid, Barcelona..."
                  className="h-8.5 text-xs rounded-xl"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Notas / Necesidades</Label>
                <Input
                  value={newLeadForm.notes}
                  onChange={(e) => setNewLeadForm({ ...newLeadForm, notes: e.target.value })}
                  placeholder="Interés en plan Pro, migración..."
                  className="h-8.5 text-xs rounded-xl"
                />
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setNewLeadModalOpen(false)}
                className="rounded-xl text-xs"
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                onClick={handleCreateLead}
                disabled={savingNewLead}
                className="rounded-xl bg-gradient-to-r from-[var(--glow-brand)] to-[#98329A] text-white hover:brightness-105 text-xs font-bold gap-1 shadow-xs"
              >
                {savingNewLead && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                <span>Guardar en Pipeline</span>
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {renderConvertLeadModal()}
        {renderDeleteLeadModal()}
      </div>
    );
  }

  // 2. Subtab: Embudo Onboarding
  if (subtab === "onboarding") {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            Embudo de Incorporación (Onboarding Funnel)
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Supervisa el avance de los nuevos salones desde su primer registro hasta su primera reserva recibida.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4 rounded-2xl border-[var(--glow-line)] bg-card shadow-2xs">
            <span className="text-[11px] font-bold text-muted-foreground">Paso 1: Salón Creado</span>
            <div className="text-2xl font-black text-foreground mt-1">{tenants.length}</div>
            <p className="text-[11px] text-emerald-600 mt-1">100% de la base</p>
          </Card>

          <Card className="p-4 rounded-2xl border-[var(--glow-line)] bg-card shadow-2xs">
            <span className="text-[11px] font-bold text-muted-foreground">Paso 2: Datos de Contacto</span>
            <div className="text-2xl font-black text-foreground mt-1">
              {tenants.filter((t) => t.email && t.phone).length}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">Perfil completado</p>
          </Card>

          <Card className="p-4 rounded-2xl border-[var(--glow-line)] bg-card shadow-2xs">
            <span className="text-[11px] font-bold text-muted-foreground">Paso 3: En Plan de Pago</span>
            <div className="text-2xl font-black text-foreground mt-1">
              {tenants.filter((t) => t.subscription_plan && t.subscription_plan !== "free").length}
            </div>
            <p className="text-[11px] text-purple-600 mt-1">Monetizando</p>
          </Card>

          <Card className="p-4 rounded-2xl border-[var(--glow-line)] bg-card shadow-2xs">
            <span className="text-[11px] font-bold text-muted-foreground">Paso 4: Totalmente Activos</span>
            <div className="text-2xl font-black text-foreground mt-1">
              {tenants.filter((t) => t.is_active).length}
            </div>
            <p className="text-[11px] text-emerald-600 mt-1">Recibiendo reservas</p>
          </Card>
        </div>
      </div>
    );
  }

  // 3. Subtab por defecto: directory (Directorio 360°)
  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            Directorio 360° de Salones
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Administra todos los salones registrados, planes, accesos y entra directamente a sus paneles.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            className="h-8 gap-1.5 rounded-xl text-xs"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Exportar CSV</span>
          </Button>

          <Button
            size="sm"
            onClick={onOpenCreateModal}
            className="h-8 gap-1.5 rounded-xl bg-gradient-to-r from-[var(--glow-brand)] to-[#98329A] text-white hover:brightness-105 text-xs font-bold shadow-xs"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Nuevo Salón</span>
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, slug o email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-xs rounded-xl"
          />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="h-9 px-3 text-xs rounded-xl border border-[var(--glow-line)] bg-card text-foreground outline-none cursor-pointer"
          >
            <option value="all">Todos los estados</option>
            <option value="active">Solo Activos</option>
            <option value="inactive">Solo Inactivos</option>
          </select>

          <select
            value={planFilter}
            onChange={(e) => setPlanFilter(e.target.value)}
            className="h-9 px-3 text-xs rounded-xl border border-[var(--glow-line)] bg-card text-foreground outline-none cursor-pointer"
          >
            <option value="all">Todos los planes</option>
            <option value="founder">💎 Fundador (Gratis)</option>
            <option value="starter">Starter (29 €)</option>
            <option value="pro">Pro (49 €)</option>
            <option value="vip">VIP / Enterprise (79 €)</option>
            <option value="free">Free</option>
          </select>
        </div>
      </div>

      {/* Tenants Table */}
      <Card className="rounded-2xl border-[var(--glow-line)] bg-card overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[var(--glow-line)] bg-muted/40 text-muted-foreground font-semibold">
                <th className="py-3 px-4">Salón</th>
                <th className="py-3 px-4">Contacto</th>
                <th className="py-3 px-4">Plan</th>
                <th className="py-3 px-4">Estado</th>
                <th className="py-3 px-4">Fecha de Alta</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--glow-line)]/60">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2 text-[var(--glow-brand)]" />
                    Cargando directorio de salones...
                  </td>
                </tr>
              ) : filteredTenants.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-muted-foreground">
                    No se encontraron salones con los filtros aplicados.
                  </td>
                </tr>
              ) : (
                filteredTenants.map((t) => (
                  <tr
                    key={t.id}
                    className="hover:bg-muted/30 transition-colors group"
                  >
                    {/* Nombre & Slug */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-[var(--glow-brand-soft)] text-[var(--glow-brand)] font-bold text-xs flex items-center justify-center shrink-0">
                          {t.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-bold text-foreground text-xs truncate">
                            {t.name}
                          </span>
                          <span className="text-[10px] text-muted-foreground font-mono truncate">
                            /{t.slug}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Contacto */}
                    <td className="py-3 px-4 text-muted-foreground">
                      <div className="flex flex-col space-y-0.5">
                        <span className="truncate text-foreground font-medium">
                          {t.email || "Sin email"}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {t.phone || "Sin teléfono"}
                        </span>
                      </div>
                    </td>

                    {/* Plan & Facturación Stripe */}
                    <td className="py-3 px-4">
                      {(() => {
                        const subInfo = getTenantSubscriptionInfo(t);
                        if (subInfo.isFounder) {
                          return (
                            <div className="flex flex-col space-y-0.5">
                              <Badge
                                variant="outline"
                                className="bg-purple-500/15 text-purple-600 border-purple-500/30 text-[10px] font-bold gap-1 w-fit"
                              >
                                <span>💎 Fundador (Gratis)</span>
                              </Badge>
                              <span className="text-[10px] text-purple-600 font-semibold flex items-center gap-1">
                                <Clock className="h-3 w-3 shrink-0" />
                                <span>Activo siempre • 0 €</span>
                              </span>
                            </div>
                          );
                        }
                        return (
                          <div className="flex flex-col space-y-0.5">
                            <div className="flex items-center gap-1.5">
                              <Badge
                                variant="outline"
                                className={`${subInfo.badgeColor} text-[10px] font-bold`}
                              >
                                {subInfo.planName}
                              </Badge>
                              <span className="text-[10px] text-muted-foreground font-mono">
                                {subInfo.priceFormatted}
                              </span>
                            </div>
                            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3 shrink-0" />
                              <span className="truncate max-w-[170px]" title={subInfo.renewalText}>
                                {subInfo.renewalText}
                              </span>
                            </span>
                          </div>
                        );
                      })()}
                    </td>

                    {/* Estado */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            t.is_active ? "bg-emerald-500" : "bg-rose-500"
                          }`}
                        />
                        <span className="text-[11px] font-semibold text-foreground">
                          {t.is_active ? "Activo" : "Inactivo"}
                        </span>
                      </div>
                    </td>

                    {/* Fecha de Alta */}
                    <td className="py-3 px-4 text-muted-foreground text-[11px]">
                      {t.created_at
                        ? format(new Date(t.created_at), "dd/MM/yyyy", { locale: es })
                        : "—"}
                    </td>

                    {/* Botones de Acción */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Botón Reset Contraseña / Acceso Directo (Modo Dios) */}
                        {t.email && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleSendResetToOwner(t.email!, t.name)}
                            disabled={sendingResetForEmail === t.email}
                            className="h-7 w-7 rounded-lg text-muted-foreground hover:text-[var(--glow-brand)]"
                            title={`Enviar enlace de restablecimiento al dueño (${t.email})`}
                          >
                            {sendingResetForEmail === t.email ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <KeyRound className="h-3.5 w-3.5" />
                            )}
                          </Button>
                        )}

                        {/* Botón Impersonar */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleImpersonate(t.slug, t.name)}
                          className="h-7 px-2 text-[11px] gap-1 rounded-lg text-[var(--glow-brand)] hover:bg-[var(--glow-brand-soft)] font-bold"
                          title="Entrar al panel de este salón"
                        >
                          <span>Entrar al Panel</span>
                          <ExternalLink className="h-3 w-3" />
                        </Button>

                        {/* Botón Editar/Ficha */}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenDetail(t)}
                          className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground"
                          title="Ficha 360°"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Button>

                        {/* Botón Eliminar Salón (Protegido para Cristina Muñoz) */}
                        {t.slug === "cristina-munoz" || t.name.toLowerCase().includes("cristina muñoz") ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled
                            className="h-7 w-7 rounded-lg text-muted-foreground/30 cursor-not-allowed"
                            title="Salón Fundador Protegido (No se puede eliminar)"
                          >
                            <Lock className="h-3.5 w-3.5" />
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRequestDeleteTenant(t)}
                            className="h-7 w-7 rounded-lg text-muted-foreground hover:text-rose-600 hover:bg-rose-500/10 transition-colors"
                            title="Eliminar salón definitivamente"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal Ficha 360° del Salón */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="rounded-2xl max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Building2 className="h-4 w-4 text-[var(--glow-brand)]" />
              <span>Ficha del Salón: {selectedTenant?.name}</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Modifica los parámetros de configuración, estado y plan de suscripción.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Nombre comercial</Label>
                <Input
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="h-8 text-xs rounded-xl"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Slug URL</Label>
                <Input
                  value={editForm.slug}
                  onChange={(e) => setEditForm({ ...editForm, slug: e.target.value })}
                  className="h-8 text-xs rounded-xl font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Email</Label>
                <Input
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="h-8 text-xs rounded-xl"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Teléfono</Label>
                <Input
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className="h-8 text-xs rounded-xl"
                />
              </div>
            </div>

            {/* Estado del Salón */}
            <div className="flex items-center justify-between p-3 rounded-xl border border-[var(--glow-line)] bg-muted/30">
              <div className="flex flex-col">
                <span className="font-bold text-xs text-foreground">Estado del Salón (Público)</span>
                <span className="text-[11px] text-muted-foreground">
                  Cuando está activo, el salón aparece en el directorio de GlowApp y acepta citas online.
                </span>
              </div>
              <Switch
                checked={editForm.is_active}
                onCheckedChange={(val) => setEditForm({ ...editForm, is_active: val })}
              />
            </div>

            {/* Monitor de Suscripción Stripe & Renovación */}
            {selectedTenant && (() => {
              const subInfo = getTenantSubscriptionInfo(selectedTenant);
              return (
                <div className="p-3.5 rounded-xl border border-[var(--glow-line)] bg-card space-y-3 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-[var(--glow-brand)]/10 text-[var(--glow-brand)]">
                        <CreditCard className="h-4 w-4" />
                      </div>
                      <div>
                        <span className="font-bold text-xs text-foreground block">
                          Suscripción & Facturación Stripe
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          Tarificación y renovación gestionada por Stripe
                        </span>
                      </div>
                    </div>
                    {subInfo.isFounder ? (
                      <Badge className="bg-purple-500/15 text-purple-600 border border-purple-500/30 font-bold text-[10px] gap-1">
                        💎 Fundador Vitalicio
                      </Badge>
                    ) : (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCheckStripeSubscription(selectedTenant.id)}
                        disabled={checkingStripeId === selectedTenant.id}
                        className="h-7 px-2 text-[10px] font-semibold text-[var(--glow-brand)] gap-1 rounded-lg hover:bg-[var(--glow-brand)]/10"
                        title="Consultar estado en Stripe"
                      >
                        <RefreshCw className={`h-3 w-3 ${checkingStripeId === selectedTenant.id ? "animate-spin" : ""}`} />
                        <span>Sincronizar con Stripe</span>
                      </Button>
                    )}
                  </div>

                  {subInfo.isFounder ? (
                    <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-purple-700 dark:text-purple-300 font-bold">Salón Fundador (Cristina Muñoz)</span>
                        <span className="font-black text-purple-700 dark:text-purple-300">0,00 € (Gratis)</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-purple-600">
                        <span>Vigencia:</span>
                        <span className="font-bold">Activo hasta siempre • Sin pagos</span>
                      </div>
                      <p className="text-[10.5px] text-muted-foreground pt-1 border-t border-purple-500/20">
                        Primer salón registrado en GlowApp. Goza de acceso premium ilimitado vitalicio sin cuotas de suscripción.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="p-2.5 rounded-xl bg-muted/40 border border-[var(--glow-line)]">
                          <span className="text-[10px] text-muted-foreground block font-medium">Plan y Cuota</span>
                          <div className="flex items-center justify-between mt-1">
                            <span className="font-bold text-foreground text-xs">{subInfo.planName}</span>
                            <Badge variant="outline" className={`${subInfo.badgeColor} text-[9px] font-bold`}>
                              {subInfo.priceFormatted}
                            </Badge>
                          </div>
                        </div>
                        <div className="p-2.5 rounded-xl bg-muted/40 border border-[var(--glow-line)]">
                          <span className="text-[10px] text-muted-foreground block font-medium">Ciclo & Renovación</span>
                          <div className="flex items-center gap-1.5 mt-1">
                            <Clock className="h-3 w-3 text-muted-foreground shrink-0" />
                            <span className="font-bold text-xs truncate text-foreground" title={subInfo.renewalText}>
                              {subInfo.renewalText}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1 text-[10px] text-muted-foreground px-1">
                        <span>Customer ID:</span>
                        <span className="font-mono text-foreground font-medium">
                          {selectedTenant.stripe_customer_id || "No vinculado todavía"}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Panel de Soporte Directo Modo Dios */}
            {selectedTenant && (
              <div className="p-3 rounded-xl border border-blue-500/20 bg-blue-500/5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-foreground text-xs">
                    <KeyRound className="h-3.5 w-3.5 text-blue-600" />
                    <span>Soporte Directo SuperAdmin (Modo Dios)</span>
                  </div>
                  <Badge variant="outline" className="text-[10px] bg-blue-500/10 text-blue-600 border-blue-500/30">
                    Control Total
                  </Badge>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Acceso directo al panel o disparo de credenciales de restablecimiento de contraseña para el propietario.
                </p>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {selectedTenant.email && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleSendResetToOwner(selectedTenant.email!, selectedTenant.name)}
                      disabled={sendingResetForEmail === selectedTenant.email}
                      className="h-7 text-xs rounded-lg gap-1.5 font-semibold text-blue-600 border-blue-500/30 hover:bg-blue-500/10"
                    >
                      {sendingResetForEmail === selectedTenant.email ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Send className="h-3 w-3" />
                      )}
                      <span>Enviar Reset a {selectedTenant.email}</span>
                    </Button>
                  )}

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleImpersonate(selectedTenant.slug, selectedTenant.name)}
                    className="h-7 text-xs rounded-lg gap-1.5 font-semibold text-foreground hover:bg-muted"
                  >
                    <ExternalLink className="h-3 w-3" />
                    <span>Entrar al Panel /admin/{selectedTenant.slug}</span>
                  </Button>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="flex items-center justify-between gap-2 sm:justify-between">
            {selectedTenant && (selectedTenant.slug === "cristina-munoz" || selectedTenant.name.toLowerCase().includes("cristina muñoz")) ? (
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-purple-600 bg-purple-500/10 px-2.5 py-1.5 rounded-xl border border-purple-500/20">
                <Lock className="h-3.5 w-3.5" />
                <span>Salón Fundador Protegido</span>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  if (selectedTenant) {
                    setIsDetailOpen(false);
                    handleRequestDeleteTenant(selectedTenant);
                  }
                }}
                className="rounded-xl text-xs text-rose-600 border-rose-500/30 hover:bg-rose-500/10 gap-1"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Eliminar Salón</span>
              </Button>
            )}

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsDetailOpen(false)}
                className="rounded-xl text-xs"
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                onClick={handleSaveDetail}
                disabled={savingEdit}
                className="rounded-xl bg-[var(--glow-brand)] text-white hover:brightness-105 text-xs font-bold gap-1"
              >
                {savingEdit && <Loader2 className="h-3 w-3 animate-spin" />}
                <span>Guardar Cambios</span>
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Nuevo Salón */}
      <Dialog open={isCreateModalOpen} onOpenChange={onCloseCreateModal}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Plus className="h-4 w-4 text-[var(--glow-brand)]" />
              <span>Alta Rápida de Nuevo Salón</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Registra un nuevo centro de belleza en la plataforma en segundos.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="space-y-1">
              <Label className="text-xs">Nombre del Salón *</Label>
              <Input
                placeholder="Ej: Salón Bellas Artes"
                value={newTenantForm.name}
                onChange={(e) => {
                  const name = e.target.value;
                  const autoSlug = name
                    .toLowerCase()
                    .replace(/[^a-z0-9]/g, "-")
                    .replace(/-+/g, "-");
                  setNewTenantForm({ ...newTenantForm, name, slug: autoSlug });
                }}
                className="h-8.5 text-xs rounded-xl"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Slug URL *</Label>
              <Input
                placeholder="salon-bellas-artes"
                value={newTenantForm.slug}
                onChange={(e) =>
                  setNewTenantForm({ ...newTenantForm, slug: e.target.value })
                }
                className="h-8.5 text-xs rounded-xl font-mono"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <Label className="text-xs">Email de Contacto</Label>
                <Input
                  type="email"
                  placeholder="contacto@salon.es"
                  value={newTenantForm.email}
                  onChange={(e) =>
                    setNewTenantForm({ ...newTenantForm, email: e.target.value })
                  }
                  className="h-8.5 text-xs rounded-xl"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Teléfono</Label>
                <Input
                  placeholder="+34 600..."
                  value={newTenantForm.phone}
                  onChange={(e) =>
                    setNewTenantForm({ ...newTenantForm, phone: e.target.value })
                  }
                  className="h-8.5 text-xs rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Plan Asignado</Label>
              <select
                value={newTenantForm.subscription_plan}
                onChange={(e) =>
                  setNewTenantForm({ ...newTenantForm, subscription_plan: e.target.value })
                }
                className="w-full h-8.5 px-3 text-xs rounded-xl border border-[var(--glow-line)] bg-background text-foreground outline-none"
              >
                <option value="free">Free</option>
                <option value="starter">Starter</option>
                <option value="pro">Pro</option>
                <option value="vip">VIP / Enterprise</option>
              </select>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={onCloseCreateModal}
              className="rounded-xl text-xs"
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleCreateTenant}
              disabled={creating}
              className="rounded-xl bg-gradient-to-r from-[var(--glow-brand)] to-[#98329A] text-white hover:brightness-105 text-xs font-bold gap-1"
            >
              {creating && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>Crear Salón</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {renderConvertLeadModal()}
      {renderDeleteTenantModal()}
      {renderDeleteLeadModal()}
    </div>
  );
};
