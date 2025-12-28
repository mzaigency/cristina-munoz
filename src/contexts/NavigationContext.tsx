import { createContext, useContext, useState, ReactNode } from "react";

interface NavigationContextType {
  isNavigationHidden: boolean;
  setNavigationHidden: (hidden: boolean) => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [isNavigationHidden, setNavigationHidden] = useState(false);

  return (
    <NavigationContext.Provider value={{ isNavigationHidden, setNavigationHidden }}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error("useNavigation must be used within a NavigationProvider");
  }
  return context;
}