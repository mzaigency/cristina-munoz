import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const signInSchema = z.object({
  email: z.string().trim().email("Email inválido").max(255, "Email demasiado largo"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres").max(100, "Contraseña demasiado larga"),
});

const signUpSchema = signInSchema.extend({
  firstName: z.string().trim().min(1, "El nombre es requerido").max(50, "El nombre debe tener menos de 50 caracteres"),
  lastName: z.string().trim().min(1, "El apellido es requerido").max(50, "El apellido debe tener menos de 50 caracteres"),
  phone: z.string().trim().min(9, "El teléfono debe tener al menos 9 dígitos").max(15, "El teléfono debe tener menos de 15 dígitos"),
  confirmPassword: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  acceptTerms: z.boolean().refine((val) => val === true, {
    message: "Debes aceptar la política de privacidad y los términos de uso",
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

const resetPasswordSchema = z.object({
  email: z.string().trim().email("Email inválido").max(255, "Email demasiado largo"),
});

const newPasswordSchema = z.object({
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres").max(100, "Contraseña demasiado larga"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

type SignInFormValues = z.infer<typeof signInSchema>;
type SignUpFormValues = z.infer<typeof signUpSchema>;
type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;
type NewPasswordFormValues = z.infer<typeof newPasswordSchema>;

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  const form = useForm<SignInFormValues | SignUpFormValues>({
    resolver: zodResolver(isSignUp ? signUpSchema : signInSchema),
    defaultValues: {
      email: "",
      password: "",
      ...(isSignUp ? { firstName: "", lastName: "", phone: "", confirmPassword: "", acceptTerms: false } : {}),
    },
  });

  const resetForm = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const handleNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword.length < 6) {
      toast({
        title: "Error",
        description: "La contraseña debe tener al menos 6 caracteres",
        variant: "destructive",
      });
      return;
    }
    
    if (newPassword !== confirmNewPassword) {
      toast({
        title: "Error",
        description: "Las contraseñas no coinciden",
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      toast({
        title: "Contraseña actualizada",
        description: "Tu contraseña ha sido cambiada correctamente",
      });
      
      setIsPasswordRecovery(false);
      navigate("/mis-citas");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Ocurrió un error al cambiar la contraseña",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    
    // Verificar si es recuperación de contraseña
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const type = hashParams.get('type');
    
    if (type === 'recovery') {
      setIsPasswordRecovery(true);
      return;
    }
    
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session && !isPasswordRecovery) {
        navigate("/mis-citas");
      }
    };
    
    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session && !isPasswordRecovery) {
        navigate("/mis-citas");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, isPasswordRecovery]);

  const handleAuth = async (values: SignInFormValues | SignUpFormValues) => {
    setLoading(true);
    try {
      if (isSignUp) {
        const signUpValues = values as SignUpFormValues;
        const redirectUrl = `${window.location.origin}/`;
        const { error } = await supabase.auth.signUp({
          email: signUpValues.email,
          password: signUpValues.password,
          options: {
            emailRedirectTo: redirectUrl,
            data: {
              full_name: `${signUpValues.firstName} ${signUpValues.lastName}`,
              phone: signUpValues.phone,
            }
          }
        });

        if (error) throw error;

        // Enviar email de bienvenida
        setTimeout(() => {
          supabase.functions.invoke('send-welcome-email', {
            body: {
              name: signUpValues.firstName,
              email: signUpValues.email,
            }
          }).then(({ error: emailError }) => {
            if (emailError) {
              console.error('Error sending welcome email:', emailError);
            }
          });
        }, 0);

        toast({
          title: "¡Cuenta creada!",
          description: "Por favor, revisa tu email para confirmar tu cuenta. Puede que el email esté en tu carpeta de spam.",
        });
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: values.email,
          password: values.password,
        });

        if (error) throw error;

        toast({
          title: "Bienvenida",
          description: "Has iniciado sesión correctamente",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Ocurrió un error al procesar tu solicitud",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (values: ResetPasswordFormValues) => {
    setResettingPassword(true);
    try {
      const redirectUrl = `${window.location.origin}/auth`;
      const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
        redirectTo: redirectUrl,
      });

      if (error) throw error;

      toast({
        title: "Email enviado",
        description: "Revisa tu correo para restablecer tu contraseña. Puede que esté en tu carpeta de spam.",
      });
      
      setResetDialogOpen(false);
      resetForm.reset();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Ocurrió un error al enviar el email de recuperación",
        variant: "destructive",
      });
    } finally {
      setResettingPassword(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header onNavigate={() => {}} activeSection="" />
      
      <main className="container mx-auto px-4 py-20">
        <div className="max-w-md mx-auto animate-fade-in">
          <Card className="scroll-reveal visible">
            <CardHeader className="text-center">
              <CardTitle>
                {isPasswordRecovery 
                  ? "Cambiar contraseña" 
                  : (isSignUp ? "Crear cuenta" : "Iniciar sesión")}
              </CardTitle>
              <CardDescription>
                {isPasswordRecovery
                  ? "Introduce tu nueva contraseña"
                  : (isSignUp 
                    ? "Crea una cuenta para gestionar tus citas" 
                    : "Accede a tu cuenta para ver tus citas")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isPasswordRecovery ? (
                <form onSubmit={handleNewPassword} className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="newPassword" className="text-sm font-medium">
                      Nueva contraseña
                    </label>
                    <Input
                      id="newPassword"
                      type="password"
                      placeholder="••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      disabled={loading}
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="confirmNewPassword" className="text-sm font-medium">
                      Confirmar nueva contraseña
                    </label>
                    <Input
                      id="confirmNewPassword"
                      type="password"
                      placeholder="••••••"
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      disabled={loading}
                      className="w-full"
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Cambiando contraseña...
                      </>
                    ) : (
                      "Cambiar contraseña"
                    )}
                  </Button>
                </form>
              ) : (
                <>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleAuth)} className="space-y-4">
                  {isSignUp && (
                    <>
                      <FormField
                        control={form.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nombre</FormLabel>
                            <FormControl>
                              <Input 
                                type="text" 
                                placeholder="Tu nombre" 
                                {...field}
                                disabled={loading}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Apellido</FormLabel>
                            <FormControl>
                              <Input 
                                type="text" 
                                placeholder="Tu apellido" 
                                {...field}
                                disabled={loading}
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
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </>
                  )}

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
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contraseña</FormLabel>
                        <FormControl>
                          <Input 
                            type="password" 
                            placeholder="••••••" 
                            {...field}
                            disabled={loading}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {isSignUp && (
                    <>
                      <FormField
                        control={form.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Verificar Contraseña</FormLabel>
                            <FormControl>
                              <Input 
                                type="password" 
                                placeholder="••••••" 
                                {...field}
                                disabled={loading}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="acceptTerms"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                disabled={loading}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel className="text-sm font-normal">
                                Acepto la{" "}
                                <Link 
                                  to="/politica-privacidad" 
                                  target="_blank"
                                  className="text-primary hover:underline font-medium"
                                >
                                  Política de Privacidad
                                </Link>
                                {" "}y los{" "}
                                <Link 
                                  to="/terminos-uso" 
                                  target="_blank"
                                  className="text-primary hover:underline font-medium"
                                >
                                  Términos de Uso
                                </Link>
                              </FormLabel>
                              <FormMessage />
                            </div>
                          </FormItem>
                        )}
                      />
                    </>
                  )}

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Procesando...
                      </>
                    ) : (
                      isSignUp ? "Crear cuenta" : "Iniciar sesión"
                    )}
                  </Button>
                </form>
              </Form>

              {!isSignUp && (
                <div className="text-center">
                  <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
                    <DialogTrigger asChild>
                      <Button
                        variant="link"
                        disabled={loading}
                        className="text-sm"
                      >
                        ¿Olvidaste tu contraseña?
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Recuperar contraseña</DialogTitle>
                        <DialogDescription>
                          Introduce tu email y te enviaremos un enlace para restablecer tu contraseña.
                        </DialogDescription>
                      </DialogHeader>
                      <Form {...resetForm}>
                        <form onSubmit={resetForm.handleSubmit(handleResetPassword)} className="space-y-4">
                          <FormField
                            control={resetForm.control}
                            name="email"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="email" 
                                    placeholder="tu@email.com" 
                                    {...field}
                                    disabled={resettingPassword}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <Button type="submit" className="w-full" disabled={resettingPassword}>
                            {resettingPassword ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Enviando...
                              </>
                            ) : (
                              "Enviar enlace de recuperación"
                            )}
                          </Button>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                </div>
              )}

              <div className="text-center">
                <Button
                  variant="link"
                  onClick={() => {
                    setIsSignUp(!isSignUp);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  disabled={loading}
                  className="text-sm"
                >
                  {isSignUp 
                    ? "¿Ya tienes cuenta? Inicia sesión" 
                    : "¿No tienes cuenta? Regístrate"}
                </Button>
              </div>
              </>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}