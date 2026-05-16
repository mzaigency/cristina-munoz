import { useEffect, useState } from "react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import {
  Home,
  Calendar,
  Wallet,
  Hourglass,
  ShoppingBag,
  UserCircle,
  MessageCircle,
  Star,
  Scissors,
  Package,
  Percent,
  ImagePlus,
  QrCode,
  MessageSquare,
  Users,
  Clock,
  BarChart3,
  Settings,
  ExternalLink,
  LogOut,
  Plus,
} from "lucide-react";

interface AdminCommandPaletteProps {
  tenantSlug: string;
  onNavigate: (path: string) => void;
  onNewBooking: () => void;
  onViewWeb: () => void;
  onSignOut: () => void;
}

/**
 * Cmd/Ctrl+K command palette for instant admin navigation.
 * Lists every section + sub-tab + the most common quick actions.
 */
export function AdminCommandPalette({
  tenantSlug,
  onNavigate,
  onNewBooking,
  onViewWeb,
  onSignOut,
}: AdminCommandPaletteProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const go = (path: string) => {
    setOpen(false);
    onNavigate(`/admin/${tenantSlug}${path}`);
  };

  const run = (fn: () => void) => {
    setOpen(false);
    fn();
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Buscar acciones o secciones… (Cmd+K)" />
      <CommandList>
        <CommandEmpty>Sin resultados.</CommandEmpty>

        <CommandGroup heading="Acciones rápidas">
          <CommandItem onSelect={() => run(onNewBooking)}>
            <Plus className="mr-2 h-4 w-4" /> Nueva cita
            <CommandShortcut>N</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => run(onViewWeb)}>
            <ExternalLink className="mr-2 h-4 w-4" /> Ver web pública
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Inicio">
          <CommandItem onSelect={() => go("/inicio/resumen")}>
            <Home className="mr-2 h-4 w-4" /> Resumen
          </CommandItem>
          <CommandItem onSelect={() => go("/inicio/agenda")}>
            <Calendar className="mr-2 h-4 w-4" /> Agenda
          </CommandItem>
          <CommandItem onSelect={() => go("/inicio/caja")}>
            <Wallet className="mr-2 h-4 w-4" /> Caja
          </CommandItem>
          <CommandItem onSelect={() => go("/inicio/espera")}>
            <Hourglass className="mr-2 h-4 w-4" /> Lista de espera
          </CommandItem>
          <CommandItem onSelect={() => go("/inicio/pedidos")}>
            <ShoppingBag className="mr-2 h-4 w-4" /> Pedidos
          </CommandItem>
        </CommandGroup>

        <CommandGroup heading="Clientes">
          <CommandItem onSelect={() => go("/clientes/directorio")}>
            <UserCircle className="mr-2 h-4 w-4" /> Directorio
          </CommandItem>
          <CommandItem onSelect={() => go("/clientes/mensajes")}>
            <MessageCircle className="mr-2 h-4 w-4" /> Mensajes
          </CommandItem>
          <CommandItem onSelect={() => go("/clientes/resenas")}>
            <Star className="mr-2 h-4 w-4" /> Reseñas
          </CommandItem>
        </CommandGroup>

        <CommandGroup heading="Catálogo">
          <CommandItem onSelect={() => go("/catalogo/services")}>
            <Scissors className="mr-2 h-4 w-4" /> Servicios
          </CommandItem>
          <CommandItem onSelect={() => go("/catalogo/products")}>
            <ShoppingBag className="mr-2 h-4 w-4" /> Productos
          </CommandItem>
          <CommandItem onSelect={() => go("/catalogo/packages")}>
            <Package className="mr-2 h-4 w-4" /> Paquetes
          </CommandItem>
          <CommandItem onSelect={() => go("/catalogo/promos")}>
            <Percent className="mr-2 h-4 w-4" /> Promociones
          </CommandItem>
        </CommandGroup>

        <CommandGroup heading="Marketing">
          <CommandItem onSelect={() => go("/marketing/posts")}>
            <ImagePlus className="mr-2 h-4 w-4" /> Posts
          </CommandItem>
          <CommandItem onSelect={() => go("/marketing/qr")}>
            <QrCode className="mr-2 h-4 w-4" /> Tarjetas QR
          </CommandItem>
          <CommandItem onSelect={() => go("/marketing/whatsapp")}>
            <MessageSquare className="mr-2 h-4 w-4" /> Kit WhatsApp
          </CommandItem>
        </CommandGroup>

        <CommandGroup heading="Negocio">
          <CommandItem onSelect={() => go("/negocio/equipo")}>
            <Users className="mr-2 h-4 w-4" /> Equipo
          </CommandItem>
          <CommandItem onSelect={() => go("/negocio/informes")}>
            <BarChart3 className="mr-2 h-4 w-4" /> Informes
          </CommandItem>
          <CommandItem onSelect={() => go("/negocio/ajustes")}>
            <Settings className="mr-2 h-4 w-4" /> Ajustes
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Cuenta">
          <CommandItem
            onSelect={() => run(onSignOut)}
            className="text-destructive aria-selected:bg-destructive/10 aria-selected:text-destructive"
          >
            <LogOut className="mr-2 h-4 w-4" /> Cerrar sesión
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
