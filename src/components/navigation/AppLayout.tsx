import { ReactNode } from "react";
import { BottomNavigation } from "./BottomNavigation";

interface AppLayoutProps {
  children: ReactNode;
  hideNavigation?: boolean;
}

export function AppLayout({ children, hideNavigation = false }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <main className={hideNavigation ? "" : "pb-20"}>
        {children}
      </main>
      {!hideNavigation && <BottomNavigation />}
    </div>
  );
}
