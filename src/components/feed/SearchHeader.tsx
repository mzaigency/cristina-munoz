import { Search, Bell } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface SearchHeaderProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  showNotifications?: boolean;
}

export function SearchHeader({ searchQuery, onSearchChange, showNotifications = true }: SearchHeaderProps) {
  return (
    <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/50 safe-area-top">
      <div className="px-4 py-3">
        <div className="flex items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar salones..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 h-10 rounded-xl bg-secondary/50 border-0 focus-visible:ring-1 focus-visible:ring-primary/50"
            />
          </div>

          {/* Notifications */}
          {showNotifications && (
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-xl shrink-0"
              asChild
            >
              <Link to="/mensajes">
                <Bell className="h-5 w-5" />
              </Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
