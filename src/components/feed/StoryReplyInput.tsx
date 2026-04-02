import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Send, Heart, Smile, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

interface StoryReplyInputProps {
  tenantId: string;
  tenantName: string;
  storyId: string;
  onClose: () => void;
  onSent: () => void;
}

const QUICK_REACTIONS = ["❤️", "🔥", "😍", "👏", "💯", "✨"];

export function StoryReplyInput({ tenantId, tenantName, storyId, onClose, onSent }: StoryReplyInputProps) {
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const sendReply = async (content: string) => {
    if (!content.trim()) return;
    
    setIsSending(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Debes iniciar sesión para responder");
        return;
      }

      // Get or create conversation with this tenant
      let { data: conversation } = await supabase
        .from("conversations")
        .select("id")
        .eq("tenant_id", tenantId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (!conversation) {
        const { data: newConversation, error: convError } = await supabase
          .from("conversations")
          .insert({
            tenant_id: tenantId,
            user_id: user.id,
          })
          .select("id")
          .single();

        if (convError) throw convError;
        conversation = newConversation;
      }

      // Send message with story reference
      const { error: msgError } = await supabase
        .from("direct_messages")
        .insert({
          conversation_id: conversation.id,
          sender_id: user.id,
          sender_type: "user",
          content: content,
          message_type: "story_reply",
          metadata: { story_id: storyId }
        });

      if (msgError) throw msgError;

      toast.success("Respuesta enviada");
      onSent();
      onClose();
    } catch (error) {
      console.error("Error sending reply:", error);
      toast.error("Error al enviar la respuesta");
    } finally {
      setIsSending(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendReply(message);
  };

  const handleReaction = (emoji: string) => {
    sendReply(emoji);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black via-black/90 to-transparent pt-12 pb-safe"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Quick reactions */}
      <AnimatePresence>
        {showReactions && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="flex justify-center gap-3 mb-4"
          >
            {QUICK_REACTIONS.map((emoji) => (
              <motion.button
                key={emoji}
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => handleReaction(emoji)}
                className="text-3xl hover:transform hover:scale-110 transition-transform"
                disabled={isSending}
              >
                {emoji}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="px-4 pb-4">
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowReactions(!showReactions)}
            className={cn(
              "p-3 rounded-full transition-colors",
              showReactions ? "bg-white/20 text-white" : "bg-white/10 text-white/70 hover:bg-white/20"
            )}
          >
            <Smile className="w-5 h-5" />
          </button>

          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={`Responde a ${tenantName}...`}
              className="w-full bg-white/10 border border-white/20 rounded-full px-4 py-3 text-white placeholder:text-white/50 focus:ring-2 focus:ring-white/30 focus:border-transparent pr-12"
              disabled={isSending}
            />
            <button
              type="button"
              onClick={() => handleReaction("❤️")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70 hover:text-red-400 transition-colors"
              disabled={isSending}
            >
              <Heart className="w-5 h-5" />
            </button>
          </div>

          <button
            type="submit"
            disabled={!message.trim() || isSending}
            className={cn(
              "p-3 rounded-full transition-all",
              message.trim() 
                ? "bg-white text-black hover:bg-white/90" 
                : "bg-white/10 text-white/50"
            )}
          >
            {isSending ? (
              <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </form>
      </div>
    </motion.div>
  );
}