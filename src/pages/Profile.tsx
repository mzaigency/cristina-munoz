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
import { Loader2, User, Mail, Phone, ChevronRight, LogOut, Calendar, Star, Shield, FileText, Moon, Sun, Monitor, Users, AtSign, Trash2, Bell } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Link } from "react-router-dom";
import { AppLayout } from "@/components/navigation/AppLayout";
import { AvatarUploader } from "@/components/profile/AvatarUploader";
import { UserStats } from "@/components/profile/UserStats";
import { useTheme } from "next-themes";
import { useFollows } from "@/hooks/useFollows";

const profileSchema = z.object({
  full_name: z.string().trim().min(1, "El nombre es requerido").max(100),
  username: z.string().trim().min(3, "Mínimo 3 caracteres").max(30, "Máximo 30 caracteres")
    .regex(/^[a-zA-Z0-9_]+$/, "Solo letras, números y guion bajo"),
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
  const [originalUsername, setOriginalUsername] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const { followingCount } = useFollows();

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { full_name: "", username: "", email: "", phone: "" },
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
          .select('full_name, username, email, phone, avatar_url')
          .eq('id', session.user.id)
          .single();

        if (error) throw error;

        if (profile) {
          form.reset({
            full_name: profile.full_name || "",
            username: profile.username || "",
            email: profile.email || "",
            phone: profile.phone || "",
          });
          setAvatarUrl(profile.avatar_url);
          setOriginalUsername(profile.username);
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

      // Check if username is being changed and if new one is available
      if (values.username.toLowerCase() !== originalUsername?.toLowerCase()) {
        const { data: existingUser } = await supabase
          .from("profiles")
          .select("id")
          .eq("username", values.username.toLowerCase())
          .neq("id", session.user.id)
          .single();

        if (existingUser) {
          toast({
            title: "Usuario no disponible",
            description: "Este nombre de usuario ya está en uso",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: values.full_name,
          username: values.username.toLowerCase(),
          email: values.email,
          phone: values.phone,
        })
        .eq('id', session.user.id);

      if (error) throw error;

      setOriginalUsername(values.username.toLowerCase());
      toast({
        title: "Perfil actualizado",
        description: "Tu información ha sido guardada",
      });
      setIsEditing(false);

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

  const [deletingAccount, setDeletingAccount] = useState(false);

  const handleDeleteAccount = async () => {
    setDeletingAccount(true);
    try {
      const { data, error } = await supabase.functions.invoke('delete-account');
      
      if (error) throw error;
      
      toast({
        title: "Cuenta eliminada",
        description: "Tu cuenta ha sido eliminada correctamente",
      });
      
      await supabase.auth.signOut();
      navigate("/");
    } catch (error: any) {
      console.error('Error deleting account:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar la cuenta",
        variant: "destructive",
      });
    } finally {
      setDeletingAccount(false);
    }
  };

  if (initialLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-[80vh]">
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
            <p className="text-sm text-muted-foreground">Cargando perfil...</p>
          </div>
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
      
      {/* Header with safe area */}
      <div className="bg-gradient-to-b from-primary/10 to-background pt-[calc(env(safe-area-inset-top)+2rem)] pb-6 px-4">
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
          {profileData.username && (
            <p className="text-sm text-primary font-medium">@{profileData.username}</p>
          )}
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
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre de usuario</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">@</span>
                          <Input 
                            type="text" 
                            placeholder="tu_usuario" 
                            {...field}
                            disabled={loading}
                            className="h-12 rounded-xl pl-8"
                          />
                        </div>
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
            {/* User Stats */}
            {userId && (
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-muted-foreground mb-3 px-1">Tu actividad</h3>
                <UserStats userId={userId} />
              </div>
            )}

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

            {/* Notifications */}
            <div className="ios-card overflow-hidden">
              <button 
                onClick={() => navigate("/perfil/notificaciones")}
                className="ios-list-item w-full text-left flex items-center gap-4 border-0 rounded-none"
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Bell className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">Notificaciones</p>
                  <p className="text-xs text-muted-foreground">Gestiona tus alertas</p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
              </button>
            </div>

            <div className="ios-card overflow-hidden">
              <div className="ios-list-item w-full text-left flex items-center gap-4 border-0 rounded-none">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">Siguiendo</p>
                  <p className="text-xs text-muted-foreground">{followingCount} salones</p>
                </div>
              </div>
            </div>

            {/* Appearance */}
            <div className="ios-card overflow-hidden">
              <div className="ios-list-item w-full text-left flex items-center gap-4 border-0 rounded-none">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  {theme === 'dark' ? (
                    <Moon className="h-5 w-5 text-primary" />
                  ) : theme === 'light' ? (
                    <Sun className="h-5 w-5 text-primary" />
                  ) : (
                    <Monitor className="h-5 w-5 text-primary" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">Apariencia</p>
                  <p className="text-xs text-muted-foreground">
                    {theme === 'dark' ? 'Modo oscuro' : theme === 'light' ? 'Modo claro' : 'Automático'}
                  </p>
                </div>
                <div className="flex items-center gap-1 bg-secondary rounded-lg p-1">
                  <button
                    onClick={() => setTheme('light')}
                    className={`p-2 rounded-md transition-all ${
                      theme === 'light' 
                        ? 'bg-background shadow-sm text-foreground' 
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Sun className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setTheme('dark')}
                    className={`p-2 rounded-md transition-all ${
                      theme === 'dark' 
                        ? 'bg-background shadow-sm text-foreground' 
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Moon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setTheme('system')}
                    className={`p-2 rounded-md transition-all ${
                      theme === 'system' 
                        ? 'bg-background shadow-sm text-foreground' 
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Monitor className="h-4 w-4" />
                  </button>
                </div>
              </div>
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

            {/* Delete Account */}
            <div className="ios-card overflow-hidden mt-8">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button 
                    className="ios-list-item w-full text-left flex items-center gap-4 border-0 rounded-none"
                  >
                    <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center shrink-0">
                      <UserX className="h-5 w-5 text-destructive" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-destructive">Eliminar cuenta</p>
                      <p className="text-xs text-muted-foreground">Esta acción es permanente</p>
                    </div>
                  </button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                    <AlertDialogDescription className="space-y-2">
                      <p>Esta acción eliminará permanentemente tu cuenta y todos tus datos:</p>
                      <ul className="list-disc list-inside text-sm space-y-1 mt-2">
                        <li>Tu perfil e información personal</li>
                        <li>Historial de reservas</li>
                        <li>Reseñas y comentarios</li>
                        <li>Salones seguidos y favoritos</li>
                      </ul>
                      <p className="font-medium pt-2">Esta acción no se puede deshacer.</p>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteAccount}
                      disabled={deletingAccount}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {deletingAccount ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Eliminando...
                        </>
                      ) : (
                        "Sí, eliminar mi cuenta"
                      )}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
