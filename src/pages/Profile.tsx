import { SEO } from "@/components/SEO";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2, User, Mail, Phone, ChevronRight, LogOut, Calendar, Star, Settings, Shield, FileText } from "lucide-react";
import { Link } from "react-router-dom";
import { AppLayout } from "@/components/navigation/AppLayout";
import { AvatarUploader } from "@/components/profile/AvatarUploader";

const profileSchema = z.object({
  full_name: z.string().trim().min(1, "El nombre es requerido").max(100),
  email: z.string().trim().email("Email inválido").max(255),
  phone: z.string().trim().min(9, "Mínimo 9 dígitos").max(15),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function Profile() {
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { full_name: "", email: "", phone: "" },
  });

  useEffect(() => {
    const checkAuthAndLoadProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      setUserId(session.user.id);

      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('full_name, email, phone, avatar_url')
          .eq('id', session.user.id)
          .single();

        if (error) throw error;

        if (profile) {
          form.reset({
            full_name: profile.full_name || "",
            email: profile.email || "",
            phone: profile.phone || "",
          });
          setAvatarUrl(profile.avatar_url);
        }
      } catch (error) {
        console.error('Error loading profile:', error);
        toast({
          title: "Error",
          description: "No se pudo cargar tu perfil",
          variant: "destructive",
        });
      } finally {
        setInitialLoading(false);
      }
    };

    checkAuthAndLoadProfile();
  }, [navigate, toast, form]);

  const handleSubmit = async (values: ProfileFormValues) => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: values.full_name,
          email: values.email,
          phone: values.phone,
        })
        .eq('id', session.user.id);

      if (error) throw error;

      toast({
        title: "Perfil actualizado",
        description: "Tu información ha sido guardada",
      });
      setIsEditing(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error al actualizar",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  if (initialLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  const profileData = form.getValues();

  return (
    <AppLayout>
      <SEO 
        title="Mi Perfil"
        description="Gestiona tu información personal"
        canonicalUrl="/perfil"
        noindex={true}
      />
      
      {/* Header */}
      <div className="bg-gradient-to-b from-primary/10 to-background pt-8 pb-6 px-4 safe-area-top">
        <div className="flex flex-col items-center">
          {/* Avatar with upload */}
          {userId && (
            <div className="mb-4">
              <AvatarUploader
                currentAvatarUrl={avatarUrl}
                userName={profileData.full_name}
                userId={userId}
                onAvatarChange={setAvatarUrl}
                size="lg"
              />
            </div>
          )}
          
          <h1 className="text-xl font-bold text-foreground">
            {profileData.full_name || "Usuario"}
          </h1>
          <p className="text-sm text-muted-foreground">{profileData.email}</p>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-6">
        {isEditing ? (
          /* Edit Mode */
          <div className="ios-card p-4">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="full_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre completo</FormLabel>
                      <FormControl>
                        <Input 
                          type="text" 
                          placeholder="Tu nombre" 
                          {...field}
                          disabled={loading}
                          className="h-12 rounded-xl"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input 
                          type="email" 
                          placeholder="tu@email.com" 
                          {...field}
                          disabled={loading}
                          className="h-12 rounded-xl"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Teléfono</FormLabel>
                      <FormControl>
                        <Input 
                          type="tel" 
                          placeholder="600 000 000" 
                          {...field}
                          disabled={loading}
                          className="h-12 rounded-xl"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-3 pt-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsEditing(false)}
                    disabled={loading}
                    className="flex-1 h-12 rounded-xl"
                  >
                    Cancelar
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={loading} 
                    className="flex-1 h-12 rounded-xl"
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Guardar"
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        ) : (
          /* View Mode */
          <div className="space-y-4">
            {/* Personal Info Section */}
            <div className="ios-card overflow-hidden">
              <button 
                onClick={() => setIsEditing(true)}
                className="ios-list-item w-full text-left flex items-center gap-4 border-0 rounded-none"
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">Información personal</p>
                  <p className="text-xs text-muted-foreground">Nombre, email, teléfono</p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
              </button>
            </div>

            {/* Quick Links */}
            <div className="ios-card overflow-hidden divide-y divide-border/50">
              <button 
                onClick={() => navigate("/mis-citas")}
                className="ios-list-item w-full text-left flex items-center gap-4 border-0 rounded-none"
              >
                <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                  <Calendar className="h-5 w-5 text-accent" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">Mis citas</p>
                  <p className="text-xs text-muted-foreground">Ver historial de reservas</p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
              </button>

              <button 
                onClick={() => navigate("/valoracion")}
                className="ios-list-item w-full text-left flex items-center gap-4 border-0 rounded-none"
              >
                <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center shrink-0">
                  <Star className="h-5 w-5 text-warning" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">Valoraciones</p>
                  <p className="text-xs text-muted-foreground">Dejar una reseña</p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
              </button>
            </div>

            {/* Legal Links */}
            <div className="ios-card overflow-hidden divide-y divide-border/50">
              <Link 
                to="/privacidad"
                className="ios-list-item w-full text-left flex items-center gap-4 border-0 rounded-none"
              >
                <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
                  <Shield className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">Política de Privacidad</p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
              </Link>

              <Link 
                to="/terminos"
                className="ios-list-item w-full text-left flex items-center gap-4 border-0 rounded-none"
              >
                <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">Términos de Uso</p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
              </Link>
            </div>

            {/* Logout */}
            <div className="ios-card overflow-hidden">
              <button 
                onClick={handleLogout}
                className="ios-list-item w-full text-left flex items-center gap-4 border-0 rounded-none"
              >
                <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center shrink-0">
                  <LogOut className="h-5 w-5 text-destructive" />
                </div>
                <p className="text-sm font-medium text-destructive">Cerrar sesión</p>
              </button>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
