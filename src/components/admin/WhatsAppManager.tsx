import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, User, Clock, Search, Filter, X, Send, Bot, BotOff, ArrowDown, Ban, Pencil, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
interface Contact {
  id: string;
  phone_number: string;
  name: string | null;
  last_message_at: string;
  unread_count: number;
  ai_agent_enabled: boolean;
  blocked: boolean;
}
interface Message {
  id: string;
  contact_id: string;
  message_type: 'user' | 'assistant';
  content: string;
  created_at: string;
}
export const WhatsAppManager = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [showBlocked, setShowBlocked] = useState(false);
  const [manualMessage, setManualMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState("");
  const messageInputRef = useRef<HTMLInputElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const {
    toast
  } = useToast();
  useEffect(() => {
    fetchContacts();

    // Suscribirse a cambios en tiempo real
    const contactsChannel = supabase.channel('whatsapp-contacts-changes').on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'whatsapp_contacts'
    }, () => {
      fetchContacts();
    }).subscribe();
    const messagesChannel = supabase.channel('whatsapp-messages-changes').on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'whatsapp_messages'
    }, payload => {
      const newMessage = payload.new as Message;
      if (selectedContact && newMessage.contact_id === selectedContact.id) {
        setMessages(prev => {
          const updated = [...prev, newMessage];
          // Si está al final, hacer scroll automático
          if (isAtBottom) {
            setTimeout(() => scrollToBottom(true), 100);
          } else {
            setShowScrollButton(true);
          }
          return updated;
        });
        // Marcar como leído automáticamente si está viendo la conversación
        markAsRead(selectedContact.id);
      }
    }).subscribe();
    return () => {
      supabase.removeChannel(contactsChannel);
      supabase.removeChannel(messagesChannel);
    };
  }, [selectedContact, toast]);
  const fetchContacts = async () => {
    try {
      const {
        data,
        error
      } = await supabase.from('whatsapp_contacts').select('*').order('last_message_at', {
        ascending: false
      });
      if (error) throw error;
      setContacts(data || []);
      setFilteredContacts(data || []);
    } catch (error) {
      console.error('Error fetching contacts:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filtrar contactos según búsqueda y filtro de no leídos
  useEffect(() => {
    let filtered = [...contacts];

    // Filtro de búsqueda
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(contact => contact.name?.toLowerCase().includes(search) || contact.phone_number.includes(search));
    }

    // Filtro de no leídos
    if (showUnreadOnly) {
      filtered = filtered.filter(contact => contact.unread_count > 0);
    }

    // Filtro de bloqueados
    if (showBlocked) {
      filtered = filtered.filter(contact => contact.blocked);
    } else {
      filtered = filtered.filter(contact => !contact.blocked);
    }
    
    setFilteredContacts(filtered);
  }, [contacts, searchTerm, showUnreadOnly, showBlocked]);
  const markAsRead = async (contactId: string) => {
    try {
      // Actualizar estado local inmediatamente
      setContacts(prevContacts => prevContacts.map(c => c.id === contactId ? {
        ...c,
        unread_count: 0
      } : c));
      setFilteredContacts(prevContacts => prevContacts.map(c => c.id === contactId ? {
        ...c,
        unread_count: 0
      } : c));
      await supabase.from('whatsapp_contacts').update({
        unread_count: 0
      }).eq('id', contactId);
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };
  const [firstUnreadIndex, setFirstUnreadIndex] = useState<number | null>(null);
  const scrollToBottom = (smooth = true) => {
    const scrollViewport = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]');
    if (scrollViewport) {
      scrollViewport.scrollTo({
        top: scrollViewport.scrollHeight,
        behavior: smooth ? 'smooth' : 'auto'
      });
      setShowScrollButton(false);
    }
  };
  const checkScrollPosition = () => {
    const scrollViewport = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]');
    if (scrollViewport) {
      const {
        scrollTop,
        scrollHeight,
        clientHeight
      } = scrollViewport;
      const isBottom = scrollHeight - scrollTop - clientHeight < 50;
      setIsAtBottom(isBottom);
      if (isBottom) {
        setShowScrollButton(false);
      }
    }
  };
  useEffect(() => {
    const scrollViewport = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]');
    if (scrollViewport) {
      scrollViewport.addEventListener('scroll', checkScrollPosition);
      return () => scrollViewport.removeEventListener('scroll', checkScrollPosition);
    }
  }, [selectedContact]);
  useEffect(() => {
    if (!selectedContact || messages.length === 0) return;
    if (firstUnreadIndex !== null) {
      const marker = document.querySelector('[data-unread-marker="true"]') as HTMLElement | null;
      if (marker) {
        marker.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }
    } else {
      scrollToBottom(true);
    }
  }, [firstUnreadIndex, messages.length, selectedContact]);
  const fetchMessages = async (contactId: string, unreadCountOnOpen: number) => {
    try {
      const {
        data,
        error
      } = await supabase.from('whatsapp_messages').select('*').eq('contact_id', contactId).order('created_at', {
        ascending: true
      });
      if (error) throw error;
      const loadedMessages = (data || []) as Message[];
      setMessages(loadedMessages);
      if (unreadCountOnOpen > 0 && loadedMessages.length > 0) {
        const startIndex = Math.max(0, loadedMessages.length - unreadCountOnOpen);
        setFirstUnreadIndex(startIndex);
      } else {
        setFirstUnreadIndex(null);
      }

      // Marcar como leído al abrir la conversación
      await markAsRead(contactId);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };
  const handleContactClick = (contact: Contact) => {
    const unreadCountOnOpen = contact.unread_count || 0;
    setSelectedContact({
      ...contact,
      unread_count: 0
    });
    setEditingName(false);
    setNewName(contact.name || "");
    fetchMessages(contact.id, unreadCountOnOpen);
    setManualMessage("");
  };

  const handleUpdateName = async () => {
    if (!selectedContact) return;
    
    try {
      const { error } = await supabase
        .from('whatsapp_contacts')
        .update({ name: newName.trim() || null })
        .eq('id', selectedContact.id);

      if (error) throw error;

      // Actualizar el contacto en el estado local
      setContacts(prev => prev.map(c => 
        c.id === selectedContact.id ? { ...c, name: newName.trim() || null } : c
      ));
      setFilteredContacts(prev => prev.map(c => 
        c.id === selectedContact.id ? { ...c, name: newName.trim() || null } : c
      ));
      setSelectedContact(prev => prev ? { ...prev, name: newName.trim() || null } : null);
      setEditingName(false);
      toast({
        title: "Nombre actualizado",
        description: "El nombre del contacto se ha actualizado correctamente"
      });
    } catch (error) {
      console.error('Error updating contact name:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el nombre",
        variant: "destructive"
      });
    }
  };
  const toggleAIAgent = async (contactId: string, currentState: boolean) => {
    try {
      const {
        error
      } = await supabase.from('whatsapp_contacts').update({
        ai_agent_enabled: !currentState
      }).eq('id', contactId);
      if (error) throw error;

      // Actualizar estado local
      setContacts(prevContacts => prevContacts.map(c => c.id === contactId ? {
        ...c,
        ai_agent_enabled: !currentState
      } : c));
      setFilteredContacts(prevContacts => prevContacts.map(c => c.id === contactId ? {
        ...c,
        ai_agent_enabled: !currentState
      } : c));
      if (selectedContact?.id === contactId) {
        setSelectedContact(prev => prev ? {
          ...prev,
          ai_agent_enabled: !currentState
        } : null);
      }
      toast({
        title: !currentState ? "Agente IA activado" : "Agente IA pausado",
        description: !currentState ? "El agente de IA responderá automáticamente" : "Debes responder manualmente a los mensajes"
      });
    } catch (error) {
      console.error('Error toggling AI agent:', error);
      toast({
        title: "Error",
        description: "No se pudo cambiar el estado del agente",
        variant: "destructive"
      });
    }
  };
  const sendManualMessage = async () => {
    if (!selectedContact || !manualMessage.trim()) return;
    setSendingMessage(true);
    try {
      const {
        error
      } = await supabase.functions.invoke('send-manual-whatsapp-message', {
        body: {
          contact_id: selectedContact.id,
          message_content: manualMessage.trim()
        }
      });
      if (error) throw error;
      setManualMessage("");
      toast({
        title: "Mensaje enviado",
        description: "El mensaje manual se ha enviado correctamente"
      });
    } catch (error) {
      console.error('Error sending manual message:', error);
      toast({
        title: "Error",
        description: "No se pudo enviar el mensaje",
        variant: "destructive"
      });
    } finally {
      setSendingMessage(false);
    }
  };

  const toggleBlockContact = async (contactId: string, currentBlocked: boolean) => {
    try {
      const { error } = await supabase
        .from('whatsapp_contacts')
        .update({ blocked: !currentBlocked })
        .eq('id', contactId);

      if (error) throw error;

      // Actualizar estado local
      setContacts(prevContacts =>
        prevContacts.map(c =>
          c.id === contactId ? { ...c, blocked: !currentBlocked } : c
        )
      );
      setFilteredContacts(prevContacts =>
        prevContacts.map(c =>
          c.id === contactId ? { ...c, blocked: !currentBlocked } : c
        )
      );

      if (selectedContact?.id === contactId) {
        setSelectedContact(prev =>
          prev ? { ...prev, blocked: !currentBlocked } : null
        );
      }

      toast({
        title: !currentBlocked ? "Contacto bloqueado" : "Contacto desbloqueado",
        description: !currentBlocked 
          ? "El contacto ya no podrá enviarte mensajes" 
          : "El contacto puede enviarte mensajes de nuevo"
      });
    } catch (error) {
      console.error('Error toggling block status:', error);
      toast({
        title: "Error",
        description: "No se pudo cambiar el estado de bloqueo",
        variant: "destructive"
      });
    }
  };

  const clearConversation = async (contactId: string) => {
    if (!confirm("¿Estás seguro de que quieres borrar toda la conversación? Esta acción no se puede deshacer.")) {
      return;
    }

    try {
      const { error } = await supabase
        .from('whatsapp_messages')
        .delete()
        .eq('contact_id', contactId);

      if (error) throw error;

      // Limpiar mensajes del estado local
      setMessages([]);
      setFirstUnreadIndex(null);

      toast({
        title: "Conversación eliminada",
        description: "Todos los mensajes han sido borrados"
      });
    } catch (error) {
      console.error('Error clearing conversation:', error);
      toast({
        title: "Error",
        description: "No se pudo borrar la conversación",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center p-8">Cargando...</div>;
  }
  return <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[calc(100vh-200px)]">
      {/* Lista de contactos */}
      <Card className="lg:col-span-1">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <MessageCircle className="h-5 w-5" />
            Contactos ({filteredContacts.length})
          </CardTitle>
          
          {/* Barra de búsqueda */}
          <div className="relative mt-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar por nombre o teléfono..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-9 pr-9 h-9 text-sm" />
            {searchTerm && <button onClick={() => setSearchTerm("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>}
          </div>

          {/* Filtros */}
          <div className="flex gap-2 mt-2">
            <Button variant={showUnreadOnly ? "default" : "outline"} size="sm" onClick={() => setShowUnreadOnly(!showUnreadOnly)} className="flex-1 h-8 text-xs">
              <Filter className="h-3 w-3 mr-2" />
              {showUnreadOnly ? "Todos" : "No leídos"}
            </Button>
            <Button variant={showBlocked ? "default" : "outline"} size="sm" onClick={() => setShowBlocked(!showBlocked)} className="flex-1 h-8 text-xs">
              <Ban className="h-3 w-3 mr-2" />
              {showBlocked ? "Activos" : "Bloqueados"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[calc(100vh-400px)] md:h-[calc(100vh-360px)]">
            {filteredContacts.length === 0 ? <p className="text-sm text-muted-foreground p-4 text-center">
                {searchTerm || showUnreadOnly ? "No se encontraron contactos" : "No hay contactos aún"}
              </p> : <div className="space-y-1">
                {filteredContacts.map(contact => <button key={contact.id} onClick={() => handleContactClick(contact)} className={`w-full text-left p-4 hover:bg-muted/50 transition-colors border-b ${selectedContact?.id === contact.id ? 'bg-muted' : ''}`}>
                      <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="p-2 rounded-full bg-primary/10">
                          <User className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-sm truncate">
                              {contact.name || contact.phone_number}
                            </p>
                            {!contact.ai_agent_enabled && (
                              <BotOff className="h-4 w-4 text-orange-500 flex-shrink-0" />
                            )}
                          </div>
                          {contact.name && <p className="text-xs text-muted-foreground truncate">
                              {contact.phone_number}
                            </p>}
                          <div className="flex items-center gap-1 mt-1">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(contact.last_message_at), "dd MMM HH:mm", {
                          locale: es
                        })}
                            </p>
                          </div>
                        </div>
                      </div>
                      {contact.unread_count > 0 && <Badge variant="destructive" className="h-6 min-w-6 flex items-center justify-center rounded-full px-2 text-xs font-semibold">
                          {contact.unread_count}
                        </Badge>}
                    </div>
                  </button>)}
              </div>}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Conversación */}
      <Card className="lg:col-span-2">
        <CardHeader className="border-b">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <CardTitle className="text-base">
              {selectedContact ? <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-primary/10">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  {editingName ? (
                    <div className="flex items-center gap-2">
                      <Input
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder="Nombre del contacto"
                        className="max-w-[200px] h-8"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleUpdateName();
                          } else if (e.key === 'Escape') {
                            setEditingName(false);
                            setNewName(selectedContact.name || "");
                          }
                        }}
                        autoFocus
                      />
                      <Button size="sm" onClick={handleUpdateName} className="h-7 px-2">
                        Guardar
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => {
                          setEditingName(false);
                          setNewName(selectedContact.name || "");
                        }}
                        className="h-7 px-2"
                      >
                        Cancelar
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <div>
                        <p className="text-base font-semibold">{selectedContact.name || selectedContact.phone_number}</p>
                        {selectedContact.name && <p className="text-xs font-normal text-muted-foreground font-sans">
                            {selectedContact.phone_number}
                          </p>}
                      </div>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => setEditingName(true)}
                        className="h-7 w-7 p-0"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
                </div> : <div className="flex items-center gap-2 text-muted-foreground">
                  <MessageCircle className="h-5 w-5" />
                  Selecciona un contacto
                </div>}
            </CardTitle>
            {selectedContact && <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-2">
                  {selectedContact.ai_agent_enabled ? <Bot className="h-4 w-4 text-primary" /> : <BotOff className="h-4 w-4 text-muted-foreground" />}
                  <Label htmlFor="ai-toggle" className="text-xs md:text-sm cursor-pointer whitespace-nowrap">
                    {selectedContact.ai_agent_enabled ? "IA activa" : "IA pausada"}
                  </Label>
                </div>
                <Switch id="ai-toggle" checked={selectedContact.ai_agent_enabled} onCheckedChange={() => toggleAIAgent(selectedContact.id, selectedContact.ai_agent_enabled)} />
                
                <Button
                  variant={selectedContact.blocked ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleBlockContact(selectedContact.id, selectedContact.blocked)}
                  className="h-8 text-xs md:text-sm"
                >
                  <Ban className="h-3 w-3 mr-1" />
                  {selectedContact.blocked ? "Desbloquear" : "Bloquear"}
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => clearConversation(selectedContact.id)}
                  className="h-8 text-xs md:text-sm text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Limpiar
                </Button>
              </div>}
          </div>
        </CardHeader>
        <CardContent className="p-4">
          {!selectedContact ? <div className="flex items-center justify-center h-[calc(100vh-400px)] md:h-[calc(100vh-360px)] text-muted-foreground">
              <div className="text-center">
                <MessageCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Selecciona un contacto para ver la conversación</p>
              </div>
            </div> : <div className="relative">
              <ScrollArea ref={scrollAreaRef} className="h-[calc(100vh-400px)] md:h-[calc(100vh-360px)]">
                {messages.length === 0 ? <p className="text-sm text-muted-foreground text-center py-8">
                  No hay mensajes
                </p> : <div className="space-y-4">
                  {messages.map((message, index) => {
                const showUnreadMarker = firstUnreadIndex !== null && index === firstUnreadIndex;
                return <div key={message.id} data-last-message={index === messages.length - 1 ? 'true' : undefined}>
                        {showUnreadMarker && <div data-unread-marker="true" className="flex items-center my-2 text-[10px] uppercase tracking-wide text-muted-foreground">
                            <div className="flex-1 h-px bg-border" />
                            <span className="mx-3 bg-background px-2 py-0.5 rounded-full">
                              Nuevos mensajes
                            </span>
                            <div className="flex-1 h-px bg-border" />
                          </div>}
                        <div className={`flex ${message.message_type === 'user' ? 'justify-start' : 'justify-end'}`}>
                          <div className={`max-w-[85%] md:max-w-[80%] rounded-lg p-3 ${message.message_type === 'user' ? 'bg-muted' : 'bg-primary text-primary-foreground'}`}>
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant={message.message_type === 'user' ? 'secondary' : 'default'} className="text-xs">
                                {message.message_type === 'user' ? selectedContact?.name || selectedContact?.phone_number || 'Cliente' : 'Asistente IA'}
                              </Badge>
                              <span className="text-xs opacity-70">
                                {format(new Date(message.created_at), 'dd MMM HH:mm', {
                            locale: es
                          })}
                              </span>
                            </div>
                            <p className="text-sm whitespace-pre-wrap break-words">
                              {message.content}
                            </p>
                          </div>
                        </div>
                      </div>;
              })}
                </div>}
            </ScrollArea>
            {showScrollButton && <Button onClick={() => scrollToBottom(true)} size="icon" className="absolute bottom-4 right-4 rounded-full shadow-lg z-10" variant="default">
                <ArrowDown className="h-4 w-4" />
              </Button>}
            </div>}
          {selectedContact && !selectedContact.ai_agent_enabled && <div className="mt-4 pt-4 border-t">
              <div className="flex gap-2">
                <Input ref={messageInputRef} placeholder="Escribe un mensaje..." value={manualMessage} onChange={e => setManualMessage(e.target.value)} onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendManualMessage();
              }
            }} disabled={sendingMessage} className="flex-1 text-sm" />
                <Button onClick={sendManualMessage} disabled={!manualMessage.trim() || sendingMessage} size="icon" className="shrink-0">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                El agente de IA está pausado. Debes responder manualmente.
              </p>
            </div>}
        </CardContent>
      </Card>
    </div>;
};