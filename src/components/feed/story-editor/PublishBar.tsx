import { motion } from "motion/react";
import { Send, Users, ChevronRight, Loader2 } from "lucide-react";

interface PublishBarProps {
  onPublish: () => void;
  onCloseFriends?: () => void;
  onSendTo?: () => void;
  isPublishing?: boolean;
  userAvatarUrl?: string;
}

export function PublishBar({
  onPublish,
  onCloseFriends,
  onSendTo,
  isPublishing = false,
  userAvatarUrl,
}: PublishBarProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="absolute bottom-4 left-4 right-4 z-40"
    >
      <div className="bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 p-3 flex items-center gap-3">
        {/* Tu historia */}
        <button
          onClick={onPublish}
          disabled={isPublishing}
          className="
            flex-1 flex items-center gap-3 px-4 py-3 rounded-xl
            bg-white text-black font-semibold
            active:scale-[0.98] transition-all
            disabled:opacity-70
          "
        >
          {isPublishing ? (
            <Loader2 size={20} className="animate-spin" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              {userAvatarUrl ? (
                <img src={userAvatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
              ) : (
                <Send size={16} className="text-white" />
              )}
            </div>
          )}
          <span className="text-sm">Tu historia</span>
        </button>

        {/* Mejores amigos (opcional) */}
        {onCloseFriends && (
          <button
            onClick={onCloseFriends}
            disabled={isPublishing}
            className="
              flex items-center gap-2 px-4 py-3 rounded-xl
              bg-green-500/20 border border-green-500/30
              active:scale-[0.98] transition-all
              disabled:opacity-50
            "
          >
            <Users size={18} className="text-green-400" />
            <span className="text-green-400 text-sm font-medium">Amigos</span>
          </button>
        )}

        {/* Enviar a */}
        {onSendTo && (
          <button
            onClick={onSendTo}
            disabled={isPublishing}
            className="
              w-12 h-12 rounded-xl flex items-center justify-center
              bg-white/10 border border-white/20
              active:scale-90 transition-all
              disabled:opacity-50
            "
          >
            <ChevronRight size={20} className="text-white" />
          </button>
        )}
      </div>
    </motion.div>
  );
}
