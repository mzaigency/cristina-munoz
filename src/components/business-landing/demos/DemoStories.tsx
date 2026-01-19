import { motion } from "motion/react";
import { Heart, MessageCircle, Send, Eye, Plus } from "lucide-react";
import { demoStories } from "./demoData";

const DemoStories = () => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className="bg-background min-h-full overflow-hidden flex flex-col"
    >
      {/* Stories carousel */}
      <div className="p-3 border-b border-border/30">
        <h4 className="text-xs font-medium text-muted-foreground mb-2">Stories</h4>
        <div className="flex gap-3 overflow-x-auto pb-1">
          {/* Add story button */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="flex flex-col items-center gap-1 shrink-0"
          >
            <div className="w-12 h-12 rounded-full bg-muted/50 border-2 border-dashed border-muted-foreground/30 flex items-center justify-center">
              <Plus className="w-5 h-5 text-muted-foreground" />
            </div>
            <span className="text-[9px] text-muted-foreground">Tu story</span>
          </motion.div>

          {/* Other stories */}
          {demoStories.map((story, index) => (
            <motion.div
              key={story.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 + (index + 1) * 0.1 }}
              className="flex flex-col items-center gap-1 shrink-0 cursor-pointer"
            >
              <div 
                className={`w-12 h-12 rounded-full p-0.5 ${
                  story.hasNew 
                    ? "bg-gradient-to-br from-pink-500 via-purple-500 to-orange-500" 
                    : "bg-muted/50"
                }`}
              >
                <div 
                  className="w-full h-full rounded-full flex items-center justify-center text-white text-sm font-bold"
                  style={{ backgroundColor: story.color }}
                >
                  {story.salon[0]}
                </div>
              </div>
              <span className="text-[9px] text-muted-foreground truncate max-w-[50px]">
                {story.salon}
              </span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Active story preview */}
      <div className="relative flex-1">
        <div className="h-full min-h-[280px] bg-gradient-to-br from-pink-500/20 via-purple-500/20 to-orange-500/20 relative overflow-hidden">
          {/* Progress bars */}
          <div className="absolute top-2 left-2 right-2 flex gap-1">
            <motion.div 
              className="h-0.5 bg-white/80 rounded-full flex-1"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 2, ease: "linear" }}
              style={{ transformOrigin: "left" }}
            />
            <div className="h-0.5 bg-white/30 rounded-full flex-1" />
            <div className="h-0.5 bg-white/30 rounded-full flex-1" />
          </div>

          {/* Header */}
          <div className="absolute top-5 left-3 right-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-pink-500 flex items-center justify-center text-white text-xs font-bold">
                B
              </div>
              <div>
                <div className="text-white text-[10px] font-semibold">Beauty Studio</div>
                <div className="text-white/60 text-[8px]">Hace 2h</div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="absolute inset-0 flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="text-center"
            >
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 mb-3">
                <div className="text-3xl mb-2">✨</div>
                <div className="text-white font-bold text-sm">¡Nuevo servicio!</div>
                <div className="text-white/80 text-xs mt-1">Tratamiento de keratina brasileña</div>
                <div className="text-white font-bold text-lg mt-2">85€</div>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                className="bg-white text-gray-900 px-4 py-1.5 rounded-full text-xs font-semibold"
              >
                Reservar ahora
              </motion.button>
            </motion.div>
          </div>

          {/* Views counter */}
          <div className="absolute bottom-12 left-3 flex items-center gap-1 text-white/60">
            <Eye className="w-3 h-3" />
            <span className="text-[10px]">234 vistas</span>
          </div>
        </div>

        {/* Reply bar */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-3">
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-white/10 backdrop-blur-sm rounded-full px-3 py-1.5">
              <span className="text-white/50 text-[10px]">Enviar mensaje...</span>
            </div>
            <button className="p-1.5 hover:bg-white/10 rounded-full">
              <Heart className="w-5 h-5 text-white" />
            </button>
            <button className="p-1.5 hover:bg-white/10 rounded-full">
              <Send className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* Analytics preview */}
      <div className="p-3 bg-muted/30">
        <div className="flex items-center justify-between text-[10px]">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-muted-foreground">
              <Eye className="w-3 h-3" /> 234
            </span>
            <span className="flex items-center gap-1 text-muted-foreground">
              <MessageCircle className="w-3 h-3" /> 12
            </span>
          </div>
          <span className="text-primary font-medium">Ver analytics →</span>
        </div>
      </div>
    </motion.div>
  );
};

export default DemoStories;
