import { ReactNode } from "react";
import { BottomNavigation } from "./BottomNavigation";
import { ClientSidebar } from "./ClientSidebar";
import { useNavigation } from "@/contexts/NavigationContext";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";
import { cn } from "@/lib/utils";

interface AppLayoutProps {
  children: ReactNode;
  hideNavigation?: boolean;
}

export function AppLayout({ children, hideNavigation = false }: AppLayoutProps) {
  const { isNavigationHidden } = useNavigation();
  const shouldHideNav = hideNavigation || isNavigationHidden;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Desktop Sidebar (persistent on >= md) */}
      {!shouldHideNav && <ClientSidebar />}

      {/* Main Content Area */}
      <main
        className={cn(
          "min-h-screen transition-all duration-150",
          shouldHideNav
            ? ""
            : "pb-20 md:pb-8 md:pl-64",
        )}
      >
        {children}
      </main>

      {/* Mobile Bottom Dock (only on < md) */}
      {!shouldHideNav && <BottomNavigation />}
      <InstallPrompt />
    </div>
  );
}

