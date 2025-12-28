import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Settings, Edit3, Eye, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TenantAdminBarProps {
  tenantSlug: string;
  isAdmin: boolean;
  isEditMode: boolean;
  onToggleEditMode: () => void;
}

export const TenantAdminBar = ({ 
  tenantSlug, 
  isAdmin, 
  isEditMode, 
  onToggleEditMode 
}: TenantAdminBarProps) => {
  const navigate = useNavigate();

  return (
    <div className="fixed bottom-6 right-6 z-[60] flex flex-col gap-2">
      {/* Edit Mode Toggle - Only for admins */}
      {isAdmin && (
        <Button
          onClick={onToggleEditMode}
          size="lg"
          className={`rounded-full shadow-lg transition-all duration-300 ${
            isEditMode 
              ? "bg-destructive hover:bg-destructive/90" 
              : "bg-primary hover:bg-primary/90"
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

      {/* Admin Panel Button */}
      <Button
        onClick={() => navigate(`/admin/${tenantSlug}`)}
        size="lg"
        variant="secondary"
        className="rounded-full shadow-lg"
      >
        <Settings className="h-5 w-5 mr-2" />
        Panel Admin
      </Button>
    </div>
  );
};
