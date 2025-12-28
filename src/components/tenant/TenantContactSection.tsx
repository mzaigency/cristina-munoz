import React, { useState } from 'react';
import { Send, MessageCircle, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { getOrCreateConversation } from '@/hooks/useConversations';
import { useNavigate } from 'react-router-dom';

interface TenantContactSectionProps {
  tenantId: string;
  tenantName: string;
  primaryColor?: string;
}

const TenantContactSection: React.FC<TenantContactSectionProps> = ({
  tenantId,
  tenantName,
  primaryColor = '#8B5CF6'
}) => {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  React.useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setCheckingAuth(false);
    };
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSendMessage = async () => {
    if (!message.trim()) {
      toast({
        title: "Mensaje vacío",
        description: "Por favor escribe un mensaje antes de enviar.",
        variant: "destructive"
      });
      return;
    }

    if (!user) {
      toast({
        title: "Inicia sesión",
        description: "Necesitas iniciar sesión para enviar mensajes.",
        variant: "destructive"
      });
      return;
    }

    setSending(true);
    try {
      // Get or create conversation
      const conversationId = await getOrCreateConversation(tenantId, user.id);
      
      if (!conversationId) {
        throw new Error('No se pudo crear la conversación');
      }

      // Send message
      const { error } = await supabase
        .from('direct_messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          sender_type: 'user',
          content: message.trim(),
          message_type: 'text'
        });

      if (error) throw error;

      // Update conversation
      await supabase
        .from('conversations')
        .update({
          last_message_at: new Date().toISOString(),
          unread_count_salon: 1
        })
        .eq('id', conversationId);

      setSent(true);
      setMessage('');
      toast({
        title: "¡Mensaje enviado!",
        description: `Tu mensaje ha sido enviado a ${tenantName}.`
      });

      // Reset sent state after 3 seconds
      setTimeout(() => setSent(false), 3000);

    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "No se pudo enviar el mensaje. Inténtalo de nuevo.",
        variant: "destructive"
      });
    } finally {
      setSending(false);
    }
  };

  if (checkingAuth) {
    return null;
  }

  return (
    <section id="contacto" className="py-12 sm:py-16 px-4 sm:px-6 bg-muted/30">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-6 sm:mb-8">
          <div 
            className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-full mb-4"
            style={{ backgroundColor: `${primaryColor}20` }}
          >
            <MessageCircle 
              className="w-6 h-6 sm:w-7 sm:h-7" 
              style={{ color: primaryColor }}
            />
          </div>
          <h2 className="text-xl sm:text-2xl font-heading font-semibold text-foreground mb-2">
            ¿Tienes alguna pregunta?
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            Envíanos un mensaje y te responderemos lo antes posible
          </p>
        </div>

        <div className="bg-card rounded-2xl p-4 sm:p-6 shadow-sm border border-border/50">
          {user ? (
            <>
              <Textarea
                placeholder="Escribe tu mensaje aquí..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="min-h-[120px] sm:min-h-[140px] resize-none mb-4 text-sm sm:text-base border-border/50 focus:border-primary/50 bg-background"
                disabled={sending}
              />
              <Button
                onClick={handleSendMessage}
                disabled={sending || !message.trim()}
                className="w-full h-11 sm:h-12 text-sm sm:text-base font-medium touch-manipulation"
                style={{ 
                  backgroundColor: sent ? '#10B981' : primaryColor,
                  color: 'white'
                }}
              >
                {sending ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Enviando...
                  </span>
                ) : sent ? (
                  <span className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    ¡Enviado!
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Send className="w-4 h-4 sm:w-5 sm:h-5" />
                    Enviar mensaje
                  </span>
                )}
              </Button>
            </>
          ) : (
            <div className="text-center py-4">
              <p className="text-muted-foreground mb-4 text-sm sm:text-base">
                Inicia sesión para enviar un mensaje
              </p>
              <Button
                onClick={() => navigate('/auth')}
                className="h-11 sm:h-12 px-6 text-sm sm:text-base font-medium touch-manipulation"
                style={{ backgroundColor: primaryColor, color: 'white' }}
              >
                <LogIn className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                Iniciar sesión
              </Button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default TenantContactSection;
