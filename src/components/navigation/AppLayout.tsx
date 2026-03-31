import { ReactNode } from "react";
import { BottomNavigation } from "./BottomNavigation";
import { useNavigation } from "@/contexts/NavigationContext";

interface AppLayoutProps {
  children: ReactNode;
  hideNavigation?: boolean;
}

export function AppLayout({ children, hideNavigation = false }: AppLayoutProps) {
  const { isNavigationHidden } = useNavigation();
  const shouldHideNav = hideNavigation || isNavigationHidden;

  return (
    <div className="min-h-screen bg-background">
      <main className={shouldHideNav ? "" : "pb-20"}>
        {children}
      </main>
      {!shouldHideNav && <BottomNavigation />}
    </div>
  );
}
