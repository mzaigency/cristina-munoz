import { useState, useEffect } from 'react';
import { MessageCircle, Send, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ConversationList } from '@/components/messages/ConversationList';
import { ChatWindow } from '@/components/messages/ChatWindow';
import { useConversations, useMessages, Conversation, getOrCreateConversation } from '@/hooks/useConversations';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface MessagesManagerProps {
  tenantId: string;
}

export function MessagesManager({ tenantId }: MessagesManagerProps) {
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [newMessageDialog, setNewMessageDialog] = useState(false);
  const [searchEmail, setSearchEmail] = useState('');
  const [searching, setSearching] = useState(false);

  const { conversations, loading: loadingConversations, refetch } = useConversations('salon', tenantId);
  const { messages, loading: loadingMessages, sendMessage, markAsRead } = useMessages(
    selectedConversation?.id || null
  );

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      markAsRead('salon');
    }
  }, [selectedConversation?.id]);

  const handleSendMessage = (content: string) => {
    if (user) {
      sendMessage(content, 'salon', user.id);
    }
  };

  const handleStartConversation = async () => {
    if (!searchEmail.trim()) return;

    setSearching(true);
    try {
      // Find user by email
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .eq('email', searchEmail.trim().toLowerCase())
        .single();

      if (error || !profile) {
        toast({
          title: 'Usuario no encontrado',
          description: 'No se encontró ningún usuario con ese email',
          variant: 'destructive',
        });
        return;
      }

      // Create or get conversation
      const conversationId = await getOrCreateConversation(tenantId, profile.id);
      
      if (conversationId) {
        await refetch();
        const newConv = conversations.find(c => c.id === conversationId);
        if (newConv) {
          setSelectedConversation(newConv);
        }
        setNewMessageDialog(false);
        setSearchEmail('');
        toast({
          title: 'Conversación creada',
          description: `Ahora puedes enviar mensajes a ${profile.full_name || profile.email}`,
        });
      }
    } catch (error) {
      console.error('Error starting conversation:', error);
      toast({
        title: 'Error',
        description: 'No se pudo iniciar la conversación',
        variant: 'destructive',
      });
    } finally {
      setSearching(false);
    }
  };

  const totalUnread = conversations.reduce((acc, c) => acc + c.unread_count_salon, 0);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          Mensajes Directos
          {totalUnread > 0 && (
            <span className="bg-primary text-primary-foreground text-xs font-bold px-2 py-0.5 rounded-full">
              {totalUnread}
            </span>
          )}
        </CardTitle>
        
        <Dialog open={newMessageDialog} onOpenChange={setNewMessageDialog}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Send className="h-4 w-4 mr-2" />
              Nuevo mensaje
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Iniciar conversación</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Email del cliente
                </label>
                <div className="flex gap-2">
                  <Input
                    type="email"
                    placeholder="cliente@email.com"
                    value={searchEmail}
                    onChange={(e) => setSearchEmail(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleStartConversation()}
                  />
                  <Button onClick={handleStartConversation} disabled={searching}>
                    {searching ? 'Buscando...' : 'Buscar'}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  El cliente debe tener una cuenta registrada
                </p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>

      <CardContent>
        <div className="grid md:grid-cols-[300px_1fr] gap-4 h-[500px]">
          {/* Conversation list */}
          <div className="border rounded-lg overflow-hidden">
            <ConversationList
              conversations={conversations}
              loading={loadingConversations}
              selectedId={selectedConversation?.id || null}
              onSelect={setSelectedConversation}
              role="salon"
            />
          </div>

          {/* Chat window */}
          <div className="border rounded-lg overflow-hidden">
            <ChatWindow
              conversation={selectedConversation}
              messages={messages}
              loading={loadingMessages}
              onSendMessage={handleSendMessage}
              currentUserId={user?.id || ''}
              role="salon"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
