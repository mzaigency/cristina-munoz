import { useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Camera, Loader2, User, X, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useHaptic } from "@/hooks/useHaptic";

interface AvatarUploaderProps {
  currentAvatarUrl?: string | null;
  userName?: string;
  userId: string;
  onAvatarChange?: (url: string | null) => void;
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "w-16 h-16",
  md: "w-24 h-24",
  lg: "w-32 h-32",
};

const iconSizes = {
  sm: "h-6 w-6",
  md: "h-10 w-10",
  lg: "h-14 w-14",
};

export function AvatarUploader({
  currentAvatarUrl,
  userName = "",
  userId,
  onAvatarChange,
  size = "md",
}: AvatarUploaderProps) {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(currentAvatarUrl || null);
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const haptic = useHaptic();

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Generate a consistent color based on name
  const getAvatarColor = (name: string) => {
    const colors = [
      "from-rose-500 to-pink-500",
      "from-violet-500 to-purple-500",
      "from-blue-500 to-cyan-500",
      "from-emerald-500 to-teal-500",
      "from-amber-500 to-orange-500",
      "from-fuchsia-500 to-pink-500",
    ];
    const index = name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[index % colors.length];
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      haptic.error();
      toast({
        title: "Archivo no válido",
        description: "Por favor, selecciona una imagen",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      haptic.error();
      toast({
        title: "Imagen muy grande",
        description: "El tamaño máximo es 5MB",
        variant: "destructive",
      });
      return;
    }

    haptic.selection();

    // Show preview
    const reader = new FileReader();
    reader.onload = (event) => {
      setPreviewUrl(event.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload to Supabase
    setIsUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${userId}/avatar-${Date.now()}.${fileExt}`;

      // Delete old avatar if exists
      if (avatarUrl) {
        const oldPath = avatarUrl.split("/").pop();
        if (oldPath) {
          await supabase.storage
            .from("tenant-assets")
            .remove([`avatars/${userId}/${oldPath}`]);
        }
      }

      const { data, error: uploadError } = await supabase.storage
        .from("tenant-assets")
        .upload(`avatars/${fileName}`, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("tenant-assets")
        .getPublicUrl(`avatars/${fileName}`);

      const newUrl = urlData.publicUrl;

      // Update profile in database
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: newUrl })
        .eq("id", userId);

      if (updateError) throw updateError;

      setAvatarUrl(newUrl);
      setPreviewUrl(null);
      onAvatarChange?.(newUrl);
      
      haptic.success();
      toast({
        title: "Avatar actualizado",
        description: "Tu foto de perfil ha sido cambiada",
      });
    } catch (error: any) {
      console.error("Error uploading avatar:", error);
      haptic.error();
      toast({
        title: "Error",
        description: error.message || "No se pudo subir la imagen",
        variant: "destructive",
      });
      setPreviewUrl(null);
    } finally {
      setIsUploading(false);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemoveAvatar = async () => {
    if (!avatarUrl) return;

    haptic.selection();
    setIsUploading(true);

    try {
      // Update profile to remove avatar
      const { error } = await supabase
        .from("profiles")
        .update({ avatar_url: null })
        .eq("id", userId);

      if (error) throw error;

      setAvatarUrl(null);
      onAvatarChange?.(null);
      
      haptic.success();
      toast({
        title: "Avatar eliminado",
        description: "Tu foto de perfil ha sido eliminada",
      });
    } catch (error: any) {
      haptic.error();
      toast({
        title: "Error",
        description: "No se pudo eliminar la imagen",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const displayUrl = previewUrl || avatarUrl;
  const initials = getInitials(userName);
  const avatarColor = getAvatarColor(userName);

  return (
    <div className="relative inline-block">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Avatar container */}
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={() => !isUploading && fileInputRef.current?.click()}
        className={`relative ${sizeClasses[size]} rounded-full overflow-hidden group`}
        disabled={isUploading}
      >
        <AnimatePresence mode="wait">
          {displayUrl ? (
            <motion.img
              key="avatar"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              src={displayUrl}
              alt="Avatar"
              className="w-full h-full object-cover"
            />
          ) : initials ? (
            <motion.div
              key="initials"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={`w-full h-full flex items-center justify-center bg-gradient-to-br ${avatarColor} text-white font-bold ${
                size === "sm" ? "text-lg" : size === "md" ? "text-2xl" : "text-3xl"
              }`}
            >
              {initials}
            </motion.div>
          ) : (
            <motion.div
              key="placeholder"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full h-full flex items-center justify-center bg-primary/10"
            >
              <User className={`${iconSizes[size]} text-primary`} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Overlay on hover/loading */}
        <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity ${
          isUploading ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        }`}>
          {isUploading ? (
            <Loader2 className="h-6 w-6 text-white animate-spin" />
          ) : (
            <Camera className="h-6 w-6 text-white" />
          )}
        </div>
      </motion.button>

      {/* Remove button (only if there's an avatar) */}
      {avatarUrl && !isUploading && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          onClick={(e) => {
            e.stopPropagation();
            handleRemoveAvatar();
          }}
          className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-destructive text-white flex items-center justify-center shadow-lg"
        >
          <X className="h-3 w-3" />
        </motion.button>
      )}
    </div>
  );
}
