import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, User, Clock, Search, Filter, X } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface Contact {
  id: string;
  phone_number: string;
  name: string | null;
  last_message_at: string;
  unread_count: number;
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
  const { toast } = useToast();

  useEffect(() => {
    fetchContacts();
    
    // Suscribirse a cambios en tiempo real
    const contactsChannel = supabase
      .channel('whatsapp-contacts-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'whatsapp_contacts'
        },
        () => {
          fetchContacts();
        }
      )
      .subscribe();

    const messagesChannel = supabase
      .channel('whatsapp-messages-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'whatsapp_messages'
        },
        (payload) => {
          const newMessage = payload.new as Message;
          
          if (selectedContact && newMessage.contact_id === selectedContact.id) {
            setMessages(prev => [...prev, newMessage]);
            // Marcar como leído automáticamente si está viendo la conversación
            markAsRead(selectedContact.id);
          }
          
          // Mostrar notificación para mensajes de usuario
          if (newMessage.message_type === 'user') {
            toast({
              title: "Nuevo mensaje de WhatsApp",
              description: "Has recibido un nuevo mensaje",
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(contactsChannel);
      supabase.removeChannel(messagesChannel);
    };
  }, [selectedContact, toast]);

  const fetchContacts = async () => {
    try {
      const { data, error } = await supabase
        .from('whatsapp_contacts')
        .select('*')
        .order('last_message_at', { ascending: false });

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
      filtered = filtered.filter(
        (contact) =>
          contact.name?.toLowerCase().includes(search) ||
          contact.phone_number.includes(search)
      );
    }

    // Filtro de no leídos
    if (showUnreadOnly) {
      filtered = filtered.filter((contact) => contact.unread_count > 0);
    }

    setFilteredContacts(filtered);
  }, [contacts, searchTerm, showUnreadOnly]);

  const markAsRead = async (contactId: string) => {
    try {
      await supabase
        .from('whatsapp_contacts')
        .update({ unread_count: 0 })
        .eq('id', contactId);
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const fetchMessages = async (contactId: string) => {
    try {
      const { data, error } = await supabase
        .from('whatsapp_messages')
        .select('*')
        .eq('contact_id', contactId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages((data || []) as Message[]);
      
      // Marcar como leído al abrir la conversación
      await markAsRead(contactId);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const handleContactClick = (contact: Contact) => {
    setSelectedContact(contact);
    fetchMessages(contact.id);
    
    // Actualizar el estado local inmediatamente para eliminar el badge
    setContacts(prevContacts =>
      prevContacts.map(c =>
        c.id === contact.id ? { ...c, unread_count: 0 } : c
      )
    );
  };

  if (loading) {
    return <div className="flex items-center justify-center p-8">Cargando...</div>;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[calc(100vh-200px)]">
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
            <Input
              placeholder="Buscar por nombre o teléfono..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-9 h-9 text-sm"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Filtro de no leídos */}
          <Button
            variant={showUnreadOnly ? "default" : "outline"}
            size="sm"
            onClick={() => setShowUnreadOnly(!showUnreadOnly)}
            className="w-full mt-2 h-8 text-xs"
          >
            <Filter className="h-3 w-3 mr-2" />
            {showUnreadOnly ? "Mostrar todos" : "Solo no leídos"}
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[calc(100vh-400px)] md:h-[calc(100vh-360px)]">
            {filteredContacts.length === 0 ? (
              <p className="text-sm text-muted-foreground p-4 text-center">
                {searchTerm || showUnreadOnly ? "No se encontraron contactos" : "No hay contactos aún"}
              </p>
            ) : (
              <div className="space-y-1">
                {filteredContacts.map((contact) => (
                  <button
                    key={contact.id}
                    onClick={() => handleContactClick(contact)}
                    className={`w-full text-left p-4 hover:bg-muted/50 transition-colors border-b ${
                      selectedContact?.id === contact.id ? 'bg-muted' : ''
                    }`}
                  >
                      <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="p-2 rounded-full bg-primary/10">
                          <User className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">
                            {contact.name || contact.phone_number}
                          </p>
                          {contact.name && (
                            <p className="text-xs text-muted-foreground truncate">
                              {contact.phone_number}
                            </p>
                          )}
                          <div className="flex items-center gap-1 mt-1">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(contact.last_message_at), "dd MMM HH:mm", { locale: es })}
                            </p>
                          </div>
                        </div>
                      </div>
                      {contact.unread_count > 0 && (
                        <Badge 
                          variant="destructive" 
                          className="h-6 min-w-6 flex items-center justify-center rounded-full px-2 text-xs font-semibold"
                        >
                          {contact.unread_count}
                        </Badge>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Conversación */}
      <Card className="lg:col-span-2">
        <CardHeader className="border-b">
          <CardTitle className="text-base">
            {selectedContact ? (
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-primary/10">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-base font-semibold">{selectedContact.name || selectedContact.phone_number}</p>
                  {selectedContact.name && (
                    <p className="text-xs font-normal text-muted-foreground">
                      {selectedContact.phone_number}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-muted-foreground">
                <MessageCircle className="h-5 w-5" />
                Selecciona un contacto
              </div>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          {!selectedContact ? (
            <div className="flex items-center justify-center h-[calc(100vh-400px)] md:h-[calc(100vh-360px)] text-muted-foreground">
              <div className="text-center">
                <MessageCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Selecciona un contacto para ver la conversación</p>
              </div>
            </div>
          ) : (
            <ScrollArea className="h-[calc(100vh-400px)] md:h-[calc(100vh-360px)]">
              {messages.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No hay mensajes
                </p>
              ) : (
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.message_type === 'user' ? 'justify-start' : 'justify-end'}`}
                    >
                      <div
                        className={`max-w-[85%] md:max-w-[80%] rounded-lg p-3 ${
                          message.message_type === 'user'
                            ? 'bg-muted'
                            : 'bg-primary text-primary-foreground'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant={message.message_type === 'user' ? 'secondary' : 'default'} className="text-xs">
                            {message.message_type === 'user' ? 'Cliente' : 'Asistente IA'}
                          </Badge>
                          <span className="text-xs opacity-70">
                            {format(new Date(message.created_at), "HH:mm", { locale: es })}
                          </span>
                        </div>
                        <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
};