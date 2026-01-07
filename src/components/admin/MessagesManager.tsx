import { useState, useEffect } from 'react';
import { MessageCircle, Send, ArrowLeft, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ConversationList } from '@/components/messages/ConversationList';
import { ChatWindow } from '@/components/messages/ChatWindow';
import { useConversations, useMessages, Conversation, getOrCreateConversation } from '@/hooks/useConversations';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';

interface MessagesManagerProps {
  tenantId: string;
}

export function MessagesManager({ tenantId }: MessagesManagerProps) {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [user, setUser] = useState<any>(null);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [newMessageDialog, setNewMessageDialog] = useState(false);
  const [searchUsername, setSearchUsername] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);

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

  const handleSearchUser = async () => {
    if (!searchUsername.trim() || searchUsername.trim().length < 2) {
      toast({
        title: 'Búsqueda inválida',
        description: 'Escribe al menos 2 caracteres para buscar',
        variant: 'destructive',
      });
      return;
    }

    setSearching(true);
    setSearchResults([]);
    try {
      const searchTerm = searchUsername.trim().toLowerCase();
      
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, username, full_name, email, avatar_url')
        .or(`username.ilike.%${searchTerm}%,full_name.ilike.%${searchTerm}%`)
        .limit(10);

      if (error) throw error;

      if (!profiles || profiles.length === 0) {
        toast({
          title: 'Sin resultados',
          description: 'No se encontraron usuarios con ese nombre',
          variant: 'destructive',
        });
        return;
      }

      setSearchResults(profiles);
    } catch (error) {
      console.error('Error searching users:', error);
      toast({
        title: 'Error',
        description: 'No se pudo buscar usuarios',
        variant: 'destructive',
      });
    } finally {
      setSearching(false);
    }
  };

  const handleSelectUser = async (profile: any) => {
    try {
      const conversationId = await getOrCreateConversation(tenantId, profile.id);
      
      if (conversationId) {
        await refetch();
        const newConv = conversations.find(c => c.id === conversationId);
        if (newConv) {
          setSelectedConversation(newConv);
        }
        setNewMessageDialog(false);
        setSearchUsername('');
        setSearchResults([]);
        toast({
          title: 'Conversación creada',
          description: `Ahora puedes enviar mensajes a ${profile.full_name || profile.username || profile.email}`,
        });
      }
    } catch (error) {
      console.error('Error starting conversation:', error);
      toast({
        title: 'Error',
        description: 'No se pudo iniciar la conversación',
        variant: 'destructive',
      });
    }
  };

  const handleBack = () => {
    setSelectedConversation(null);
  };

  const totalUnread = conversations.reduce((acc, c) => acc + c.unread_count_salon, 0);

  // Mobile Layout
  if (isMobile) {
    return (
      <div className="flex flex-col h-[calc(100vh-180px)] bg-background rounded-lg border overflow-hidden">
        {/* Mobile Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b bg-card">
          {selectedConversation ? (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="h-10 w-10 p-0"
                aria-label="Volver a conversaciones"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <span className="font-medium text-sm truncate flex-1 mx-3">
                {selectedConversation.user?.full_name || selectedConversation.user?.email || 'Usuario'}
              </span>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-primary" />
                <span className="font-semibold">Mensajes</span>
                {totalUnread > 0 && (
                  <span className="bg-primary text-primary-foreground text-xs font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center">
                    {totalUnread}
                  </span>
                )}
              </div>
              <Dialog open={newMessageDialog} onOpenChange={setNewMessageDialog}>
                <DialogTrigger asChild>
                  <Button size="sm" className="h-10 min-w-[44px]" aria-label="Nuevo mensaje">
                    <Plus className="h-4 w-4 mr-1" />
                    <span className="sr-only sm:not-sr-only">Nuevo</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="mx-4 max-w-[calc(100vw-32px)]">
                  <DialogHeader>
                    <DialogTitle>Iniciar conversación</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Buscar cliente por nombre o username
                      </label>
                      <div className="flex flex-col gap-2">
                        <Input
                          type="text"
                          placeholder="Nombre o @username"
                          value={searchUsername}
                          onChange={(e) => setSearchUsername(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSearchUser()}
                          className="h-12"
                        />
                        <Button 
                          onClick={handleSearchUser} 
                          disabled={searching}
                          className="h-12 w-full"
                        >
                          {searching ? 'Buscando...' : 'Buscar cliente'}
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        El cliente debe tener una cuenta registrada
                      </p>
                    </div>
                    
                    {/* Search Results */}
                    {searchResults.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Resultados:</p>
                        <div className="max-h-[200px] overflow-y-auto space-y-1">
                          {searchResults.map((profile) => (
                            <button
                              key={profile.id}
                              onClick={() => handleSelectUser(profile)}
                              className="w-full flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-left"
                            >
                              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
                                {(profile.full_name || profile.username || 'U').charAt(0).toUpperCase()}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">
                                  {profile.full_name || profile.username || 'Usuario'}
                                </p>
                                {profile.username && (
                                  <p className="text-xs text-muted-foreground truncate">
                                    @{profile.username}
                                  </p>
                                )}
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            </>
          )}
        </div>

        {/* Mobile Content */}
        <div className="flex-1 overflow-hidden">
          {selectedConversation ? (
            <ChatWindow
              conversation={selectedConversation}
              messages={messages}
              loading={loadingMessages}
              onSendMessage={handleSendMessage}
              currentUserId={user?.id || ''}
              role="salon"
            />
          ) : (
            <ConversationList
              conversations={conversations}
              loading={loadingConversations}
              selectedId={null}
              onSelect={setSelectedConversation}
              role="salon"
            />
          )}
        </div>
      </div>
    );
  }

  // Desktop Layout (unchanged)
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
                  Buscar cliente por nombre o username
                </label>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    placeholder="Nombre o @username"
                    value={searchUsername}
                    onChange={(e) => setSearchUsername(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearchUser()}
                  />
                  <Button onClick={handleSearchUser} disabled={searching}>
                    {searching ? 'Buscando...' : 'Buscar'}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  El cliente debe tener una cuenta registrada
                </p>
              </div>
              
              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Resultados:</p>
                  <div className="max-h-[200px] overflow-y-auto space-y-1">
                    {searchResults.map((profile) => (
                      <button
                        key={profile.id}
                        onClick={() => handleSelectUser(profile)}
                        className="w-full flex items-center gap-3 p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-left"
                      >
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium text-sm">
                          {(profile.full_name || profile.username || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate text-sm">
                            {profile.full_name || profile.username || 'Usuario'}
                          </p>
                          {profile.username && (
                            <p className="text-xs text-muted-foreground truncate">
                              @{profile.username}
                            </p>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>

      <CardContent>
        <div className="grid md:grid-cols-[300px_1fr] gap-4 h-[500px]">
          <div className="border rounded-lg overflow-hidden">
            <ConversationList
              conversations={conversations}
              loading={loadingConversations}
              selectedId={selectedConversation?.id || null}
              onSelect={setSelectedConversation}
              role="salon"
            />
          </div>

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
