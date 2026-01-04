import { Building2, Shield, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface SmartSearchHeaderProps {
  userTenant?: { slug: string; name: string; primary_color?: string | null } | null;
  isSuperadmin?: boolean;
}

export function SmartSearchHeader({
  userTenant,
  isSuperadmin,
}: SmartSearchHeaderProps) {
  return (
    <div className="sticky top-0 z-50">
      <div className="bg-background/95 backdrop-blur-xl border-b border-border/30">
        <div className="px-4 py-2.5 safe-area-top">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <img src="/favicon.png" alt="GlowApp" className="h-8 w-8" />
              <span className="text-xl font-black text-foreground">
                Glow<span className="text-primary">App</span>
              </span>
            </div>
            
            {/* Action buttons */}
            <div className="flex items-center gap-1">
              {userTenant && (
                <Button asChild variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                  <Link to={`/admin/${userTenant.slug}`}>
                    <Shield className="h-4 w-4 text-muted-foreground" />
                  </Link>
                </Button>
              )}
              {isSuperadmin && (
                <Button asChild variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                  <Link to="/superadmin">
                    <Crown className="h-4 w-4 text-amber-500" />
                  </Link>
                </Button>
              )}
              <Button 
                asChild 
                size="sm" 
                className="h-7 px-2.5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold"
              >
                <Link to="/para-negocios">
                  <Building2 className="h-3 w-3 mr-1" />
                  Pro
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}