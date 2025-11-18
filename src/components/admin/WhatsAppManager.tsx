import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, User, Clock } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Contact {
  id: string;
  phone_number: string;
  name: string | null;
  last_message_at: string;
}

interface Message {
  id: string;
  message_type: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export const WhatsAppManager = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

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
          if (selectedContact && payload.new.contact_id === selectedContact.id) {
            setMessages(prev => [...prev, payload.new as Message]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(contactsChannel);
      supabase.removeChannel(messagesChannel);
    };
  }, [selectedContact]);

  const fetchContacts = async () => {
    try {
      const { data, error } = await supabase
        .from('whatsapp_contacts')
        .select('*')
        .order('last_message_at', { ascending: false });

      if (error) throw error;
      setContacts(data || []);
    } catch (error) {
      console.error('Error fetching contacts:', error);
    } finally {
      setLoading(false);
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
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const handleContactClick = (contact: Contact) => {
    setSelectedContact(contact);
    fetchMessages(contact.id);
  };

  if (loading) {
    return <div className="flex items-center justify-center p-8">Cargando...</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[calc(100vh-200px)]">
      {/* Lista de contactos */}
      <Card className="md:col-span-1">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Contactos ({contacts.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[calc(100vh-280px)]">
            {contacts.length === 0 ? (
              <p className="text-sm text-muted-foreground p-4 text-center">
                No hay contactos aún
              </p>
            ) : (
              <div className="space-y-1">
                {contacts.map((contact) => (
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
                    </div>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Conversación */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>
            {selectedContact ? (
              <div>
                <p className="text-lg">{selectedContact.name || selectedContact.phone_number}</p>
                {selectedContact.name && (
                  <p className="text-sm font-normal text-muted-foreground">
                    {selectedContact.phone_number}
                  </p>
                )}
              </div>
            ) : (
              "Selecciona un contacto"
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!selectedContact ? (
            <div className="flex items-center justify-center h-[calc(100vh-360px)] text-muted-foreground">
              <div className="text-center">
                <MessageCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Selecciona un contacto para ver la conversación</p>
              </div>
            </div>
          ) : (
            <ScrollArea className="h-[calc(100vh-360px)] pr-4">
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
                        className={`max-w-[80%] rounded-lg p-3 ${
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
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
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