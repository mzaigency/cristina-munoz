import { ReactNode } from "react";
import { BottomNavigation } from "./BottomNavigation";
import { useNavigation } from "@/contexts/NavigationContext";

interface AppLayoutProps {
  children: ReactNode;
  hideNavigation?: boolean;
  /** Skip automatic safe-area-top padding (use when page has its own sticky header) */
  noTopSafeArea?: boolean;
}

export function AppLayout({ children, hideNavigation = false, noTopSafeArea = false }: AppLayoutProps) {
  const { isNavigationHidden } = useNavigation();
  
  const shouldHideNav = hideNavigation || isNavigationHidden;

  return (
    <div className="min-h-screen bg-background">
      {/* Global safe area spacer for notch/status bar */}
      {!noTopSafeArea && (
        <div className="h-[env(safe-area-inset-top)] bg-background fixed top-0 left-0 right-0 z-[60]" />
      )}
      <main className={`${shouldHideNav ? "" : "pb-20"} ${!noTopSafeArea ? "pt-[env(safe-area-inset-top)]" : ""}`}>
        {children}
      </main>
      {!shouldHideNav && <BottomNavigation />}
    </div>
  );
}