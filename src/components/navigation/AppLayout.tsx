import { ReactNode } from "react";
import { BottomNavigation } from "./BottomNavigation";
import { useNavigation } from "@/contexts/NavigationContext";

interface AppLayoutProps {
  children: ReactNode;
  hideNavigation?: boolean;
  /** Skip automatic safe-area-top padding (use when page has its own sticky header) */
  noTopSafeArea?: boolean;
  /** Skip automatic safe-area-bottom padding (use when page handles its own bottom padding) */
  noBottomSafeArea?: boolean;
}

export function AppLayout({ 
  children, 
  hideNavigation = false, 
  noTopSafeArea = false,
  noBottomSafeArea = false 
}: AppLayoutProps) {
  const { isNavigationHidden } = useNavigation();
  
  const shouldHideNav = hideNavigation || isNavigationHidden;

  return (
    <div className="min-h-screen bg-background">
      {/* Global safe area spacer for notch/status bar - only when not handled by page */}
      {!noTopSafeArea && (
        <div 
          className="bg-background fixed top-0 left-0 right-0 z-[60]" 
          style={{ height: 'env(safe-area-inset-top)' }}
        />
      )}
      <main 
        className={`
          ${shouldHideNav ? "" : "pb-20"} 
          ${!noTopSafeArea ? "pt-[env(safe-area-inset-top)]" : ""}
          ${!noBottomSafeArea && shouldHideNav ? "pb-[env(safe-area-inset-bottom)]" : ""}
        `.trim().replace(/\s+/g, ' ')}
      >
        {children}
      </main>
      {!shouldHideNav && <BottomNavigation />}
    </div>
  );
}
