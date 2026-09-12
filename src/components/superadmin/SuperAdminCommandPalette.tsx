import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  LayoutDashboard,
  Activity,
  ShieldAlert,
  Building2,
  TrendingUp,
  UserCheck,
  Users,
  Image,
  Star,
  CreditCard,
  Receipt,
  Terminal,
  Wand2,
  ExternalLink,
  Plus,
} from "lucide-react";

interface TenantOption {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
}

interface SuperAdminCommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectTab: (tab: string, subtab: string) => void;
  tenants: TenantOption[];
  onOpenNewTenantModal: () => void;
}

export const SuperAdminCommandPalette: React.FC<SuperAdminCommandPaletteProps> = ({
  open,
  onOpenChange,
  onSelectTab,
  tenants,
  onOpenNewTenantModal,
}) => {
  const navigate = useNavigate();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open, onOpenChange]);

  const handleSelectSection = (tab: string, subtab: string) => {
    onSelectTab(tab, subtab);
    onOpenChange(false);
  };

  const handleImpersonateTenant = (slug: string) => {
    navigate(`/admin/${slug}`);
    onOpenChange(false);
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Buscar salones, usuarios, secciones o acciones (Cmd+K)..." />
      <CommandList className="max-h-[380px] p-1.5">
        <CommandEmpty>No se encontraron resultados.</CommandEmpty>

        {/* Acciones Rápidas */}
        <CommandGroup heading="Acciones Rápidas">
          <CommandItem
            onSelect={() => {
              onOpenNewTenantModal();
              onOpenChange(false);
            }}
            className="cursor-pointer gap-2 py-2"
          >
            <Plus className="h-4 w-4 text-[var(--glow-brand)]" />
            <span>Dar de alta un nuevo Salón</span>
          </CommandItem>
          <CommandItem
            onSelect={() => handleSelectSection("command", "maintenance")}
            className="cursor-pointer gap-2 py-2"
          >
            <ShieldAlert className="h-4 w-4 text-amber-500" />
            <span>Configurar Modo Mantenimiento / Anuncio Global</span>
          </CommandItem>
          <CommandItem
            onSelect={() => handleSelectSection("system", "logs")}
            className="cursor-pointer gap-2 py-2"
          >
            <Terminal className="h-4 w-4 text-rose-500" />
            <span>Ver Errores del Sistema en Tiempo Real</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator className="my-1" />

        {/* Salones de la Plataforma */}
        {tenants.length > 0 && (
          <CommandGroup heading="Salones (Entrar a su Panel)">
            {tenants.slice(0, 8).map((t) => (
              <CommandItem
                key={t.id}
                onSelect={() => handleImpersonateTenant(t.slug)}
                className="cursor-pointer justify-between py-2"
              >
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-[var(--glow-brand)]" />
                  <span className="font-medium">{t.name}</span>
                  <span className="text-xs text-muted-foreground">/{t.slug}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-[var(--glow-brand)] font-semibold">
                  <span>Acceder</span>
                  <ExternalLink className="h-3 w-3" />
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        <CommandSeparator className="my-1" />

        {/* Secciones del Superadmin */}
        <CommandGroup heading="Secciones del SuperAdmin">
          <CommandItem
            onSelect={() => handleSelectSection("command", "kpis")}
            className="cursor-pointer gap-2 py-2"
          >
            <LayoutDashboard className="h-4 w-4 text-slate-500" />
            <span>Centro de Mando: Visión Global (KPIs)</span>
          </CommandItem>
          <CommandItem
            onSelect={() => handleSelectSection("command", "pulse")}
            className="cursor-pointer gap-2 py-2"
          >
            <Activity className="h-4 w-4 text-emerald-500" />
            <span>Centro de Mando: Live Pulse (Citas en curso)</span>
          </CommandItem>
          <CommandItem
            onSelect={() => handleSelectSection("tenants", "directory")}
            className="cursor-pointer gap-2 py-2"
          >
            <Building2 className="h-4 w-4 text-indigo-500" />
            <span>Ecosistema Salones: Directorio 360°</span>
          </CommandItem>
          <CommandItem
            onSelect={() => handleSelectSection("tenants", "b2b_leads")}
            className="cursor-pointer gap-2 py-2"
          >
            <TrendingUp className="h-4 w-4 text-amber-500" />
            <span>Ecosistema Salones: Leads B2B & CRM Kanban</span>
          </CommandItem>
          <CommandItem
            onSelect={() => handleSelectSection("tenants", "onboarding")}
            className="cursor-pointer gap-2 py-2"
          >
            <UserCheck className="h-4 w-4 text-sky-500" />
            <span>Ecosistema Salones: Embudo de Onboarding</span>
          </CommandItem>
          <CommandItem
            onSelect={() => handleSelectSection("community", "users")}
            className="cursor-pointer gap-2 py-2"
          >
            <Users className="h-4 w-4 text-purple-500" />
            <span>Comunidad: Directorio Global de Usuarios</span>
          </CommandItem>
          <CommandItem
            onSelect={() => handleSelectSection("community", "feed_moderation")}
            className="cursor-pointer gap-2 py-2"
          >
            <Image className="h-4 w-4 text-rose-500" />
            <span>Comunidad: Moderación de Feed e Historias</span>
          </CommandItem>
          <CommandItem
            onSelect={() => handleSelectSection("community", "reviews")}
            className="cursor-pointer gap-2 py-2"
          >
            <Star className="h-4 w-4 text-amber-500" />
            <span>Comunidad: Moderación de Reseñas</span>
          </CommandItem>
          <CommandItem
            onSelect={() => handleSelectSection("system", "plans")}
            className="cursor-pointer gap-2 py-2"
          >
            <CreditCard className="h-4 w-4 text-emerald-500" />
            <span>Monetización: Planes y Suscripciones</span>
          </CommandItem>
          <CommandItem
            onSelect={() => handleSelectSection("system", "transactions")}
            className="cursor-pointer gap-2 py-2"
          >
            <Receipt className="h-4 w-4 text-blue-500" />
            <span>Monetización: Facturación & Transacciones</span>
          </CommandItem>
          <CommandItem
            onSelect={() => handleSelectSection("system", "logs")}
            className="cursor-pointer gap-2 py-2"
          >
            <Terminal className="h-4 w-4 text-rose-500" />
            <span>Sistema: Salud del Sistema & Logs</span>
          </CommandItem>
          <CommandItem
            onSelect={() => handleSelectSection("system", "sandbox")}
            className="cursor-pointer gap-2 py-2"
          >
            <Wand2 className="h-4 w-4 text-violet-500" />
            <span>Sistema: Fábrica de Demos (Sandbox)</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
};
