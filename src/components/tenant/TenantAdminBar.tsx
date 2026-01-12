import { Edit3, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TenantAdminBarProps {
  tenantSlug: string;
  isAdmin: boolean;
  isEditMode: boolean;
  onToggleEditMode: () => void;
}

export const TenantAdminBar = ({ isAdmin, isEditMode, onToggleEditMode }: TenantAdminBarProps) => {
  return (
    <div
      className="fixed right-4 z-[60] flex flex-col gap-2"
      style={{ bottom: "calc(6rem + env(safe-area-inset-bottom))" }}
    >
      {/* Edit Mode Toggle - Only for admins */}
      {isAdmin && (
        <Button
          onClick={onToggleEditMode}
          size="lg"
          className={`rounded-full shadow-lg transition-all duration-300 ${
            isEditMode ? "bg-destructive hover:bg-destructive/90" : "bg-primary hover:bg-primary/90"
          }`}
        >
          {isEditMode ? (
            <>
              <X className="h-5 w-5 mr-2" />
              Salir
            </>
          ) : (
            <>
              <Edit3 className="h-5 w-5 mr-2" />
              Editar
            </>
          )}
        </Button>
      )}
    </div>
  );
};
