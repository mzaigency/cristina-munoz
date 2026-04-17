import { useState, useEffect } from "react";
import { motion, AnimatePresence, PanInfo } from "motion/react";
import { Sparkles, Calendar, Heart, Star, MapPin, Check, Clock, Scissors } from "lucide-react";
import { useHaptic } from "@/hooks/useHaptic";

const ONBOARDING_KEY = "glowapp_onboarding_completed";

interface WelcomeCarouselProps {
  onComplete: () => void;
}

// ---------- Visual Mocks ----------

const SalonCardMock = () => (
  <motion.div
    initial={{ y: 20, opacity: 0, scale: 0.95 }}
    animate={{ y: 0, opacity: 1, scale: 1 }}
    transition={{ delay: 0.15, type: "spring", damping: 18, stiffness: 200 }}
    className="relative w-full max-w-[280px] mx-auto"
  >
    {/* Glow */}
    <div className="absolute -inset-4 bg-gradient-to-br from-primary/30 to-purple-600/30 rounded-3xl blur-2xl opacity-60" />
    
    <div className="relative rounded-2xl overflow-hidden bg-card border border-border/50 shadow-xl">
      {/* Image */}
      <div className="relative h-32 bg-gradient-to-br from-primary/40 via-purple-500/40 to-pink-500/40">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400')] bg-cover bg-center opacity-90" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        <motion.div
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.5, type: "spring", damping: 12 }}
          className="absolute top-2 right-2 px-2 py-1 rounded-full bg-card/90 backdrop-blur-md flex items-center gap-1 shadow-md"
        >
          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
          <span className="text-xs font-semibold text-foreground">4.9</span>
        </motion.div>
      </div>
      {/* Info */}
      <div className="p-3 space-y-1.5">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-foreground">Cristina Muñoz</h4>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.7, type: "spring", damping: 10 }}
          >
            <Heart className="h-4 w-4 fill-pink-500 text-pink-500" />
          </motion.div>
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3" />
          <span>A 320 m de ti</span>
        </div>
      </div>
    </div>
  </motion.div>
);

const BookingStepperMock = () => {
  const steps = [
    { icon: Scissors, label: "Servicio", done: true },
    { icon: Sparkles, label: "Pro", done: true },
    { icon: Clock, label: "Hora", done: false },
  ];
  const times = ["10:00", "11:30", "16:00", "17:30"];

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.15, type: "spring", damping: 20 }}
      className="w-full max-w-[280px] mx-auto space-y-4"
    >
      {/* Stepper */}
      <div className="relative flex items-center justify-between px-2">
        <div className="absolute left-6 right-6 top-1/2 h-0.5 bg-border -translate-y-1/2" />
        <motion.div
          initial={{ width: "0%" }}
          animate={{ width: "50%" }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="absolute left-6 top-1/2 h-0.5 bg-gradient-to-r from-primary to-purple-600 -translate-y-1/2"
        />
        {steps.map((step, i) => (
          <motion.div
            key={i}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3 + i * 0.1, type: "spring", damping: 12 }}
            className="relative z-10 flex flex-col items-center gap-1"
          >
            <div
              className={`h-9 w-9 rounded-full flex items-center justify-center shadow-sm ${
                step.done
                  ? "bg-gradient-to-br from-primary to-purple-600 text-white"
                  : i === 2
                  ? "bg-card border-2 border-primary text-primary"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {step.done ? <Check className="h-4 w-4" /> : <step.icon className="h-4 w-4" />}
            </div>
            <span className="text-[10px] font-medium text-muted-foreground">{step.label}</span>
          </motion.div>
        ))}
      </div>

      {/* Time chips */}
      <div className="grid grid-cols-4 gap-2">
        {times.map((t, i) => (
          <motion.div
            key={t}
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.7 + i * 0.08 }}
            className={`py-2 rounded-xl text-xs font-semibold text-center border ${
              i === 1
                ? "bg-gradient-to-br from-primary to-purple-600 text-white border-transparent shadow-md"
                : "bg-card border-border text-foreground"
            }`}
          >
            {t}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

const FollowingStackMock = () => {
  const salons = [
    { name: "Cristina Muñoz", color: "from-primary to-purple-600", img: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=200" },
    { name: "Studio Glow", color: "from-purple-500 to-pink-500", img: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=200" },
    { name: "Belle Maison", color: "from-pink-500 to-amber-400", img: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=200" },
  ];

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.15, type: "spring", damping: 20 }}
      className="w-full max-w-[280px] mx-auto space-y-2.5"
    >
      {salons.map((s, i) => (
        <motion.div
          key={s.name}
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.3 + i * 0.12, type: "spring", damping: 18 }}
          className="flex items-center gap-3 p-2.5 rounded-2xl bg-card/80 backdrop-blur-md border border-border/50 shadow-sm"
        >
          <div className={`relative h-11 w-11 rounded-full bg-gradient-to-br ${s.color} p-[2px]`}>
            <div
              className="h-full w-full rounded-full bg-cover bg-center border-2 border-card"
              style={{ backgroundImage: `url(${s.img})` }}
            />
            {i < 2 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.6 + i * 0.1, type: "spring", damping: 10 }}
                className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full bg-pink-500 border-2 border-card flex items-center justify-center"
              >
                <Sparkles className="h-2 w-2 text-white" />
              </motion.div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-semibold text-foreground truncate">{s.name}</span>
              <Heart className="h-3 w-3 fill-pink-500 text-pink-500 shrink-0" />
            </div>
            <span className="text-[11px] text-muted-foreground">
              {i === 0 ? "Nuevo post · hace 2 h" : i === 1 ? "Promo activa · -20%" : "Te sigue"}
            </span>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
};

// ---------- Slides Data ----------

const slides = [
  {
    visual: <SalonCardMock />,
    title: "Tu próxima cita, en un toque",
    description: "Descubre salones cerca de ti, con fotos reales y reseñas de gente como tú.",
  },
  {
    visual: <BookingStepperMock />,
    title: "Sin llamadas. Sin esperas.",
    description: "Elige servicio, profesional y hora. Reservas confirmadas al instante.",
  },
  {
    visual: <FollowingStackMock />,
    title: "Sigue tus salones favoritos",
    description: "Recibe sus novedades, posts y promos. Como un Instagram, pero para reservar.",
  },
];

// ---------- Main Component ----------

export function WelcomeCarousel({ onComplete }: WelcomeCarouselProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const haptic = useHaptic();

  useEffect(() => {
    const completed = localStorage.getItem(ONBOARDING_KEY);
    if (!completed) {
      // Delayed appearance to let the feed render first
      const timer = setTimeout(() => setIsVisible(true), 400);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleComplete = () => {
    localStorage.setItem(ONBOARDING_KEY, "true");
    haptic.success();
    setIsVisible(false);
    setTimeout(() => onComplete(), 300);
  };

  const handleNext = () => {
    haptic.selection();
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentSlide > 0) {
      haptic.selection();
      setCurrentSlide(currentSlide - 1);
    }
  };

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    // Vertical swipe down → close
    if (info.offset.y > 100 && info.velocity.y > 0) {
      handleComplete();
      return;
    }
    // Horizontal swipe
    if (Math.abs(info.offset.x) > 60) {
      if (info.offset.x < 0) handleNext();
      else handlePrev();
    }
  };

  if (!isVisible) return null;

  const slide = slides[currentSlide];
  const isLast = currentSlide === slides.length - 1;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        className="fixed inset-0 z-[100] flex items-end justify-center"
      >
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleComplete}
          className="absolute inset-0 bg-black/40 backdrop-blur-md"
        />

        {/* Sheet */}
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 28, stiffness: 280 }}
          drag="y"
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={{ top: 0, bottom: 0.4 }}
          onDragEnd={handleDragEnd}
          className="relative w-full max-w-md bg-card/85 backdrop-blur-2xl rounded-t-[28px] border-t border-x border-border/40 shadow-[0_-20px_60px_-15px_rgba(0,0,0,0.3)] overflow-hidden"
          style={{ maxHeight: "78vh" }}
        >
          {/* Drag handle */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="h-1.5 w-10 rounded-full bg-muted-foreground/30" />
          </div>

          {/* Progress bar segmented */}
          <div className="flex gap-1.5 px-6 pt-2 pb-1">
            {slides.map((_, i) => (
              <div
                key={i}
                className="flex-1 h-1 rounded-full bg-muted overflow-hidden"
              >
                <motion.div
                  initial={false}
                  animate={{
                    width: i < currentSlide ? "100%" : i === currentSlide ? "100%" : "0%",
                  }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className="h-full bg-gradient-to-r from-primary to-purple-600"
                />
              </div>
            ))}
          </div>

          {/* Content */}
          <div className="px-6 pt-4 pb-2 min-h-[380px] flex flex-col">
            {/* Visual */}
            <div className="flex-1 flex items-center justify-center py-4 min-h-[180px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={`visual-${currentSlide}`}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.25 }}
                  className="w-full"
                >
                  {slide.visual}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Text */}
            <AnimatePresence mode="wait">
              <motion.div
                key={`text-${currentSlide}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25, delay: 0.05 }}
                className="text-center space-y-2 px-2"
              >
                <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                  {slide.title}
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">
                  {slide.description}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="px-6 pt-4 pb-[calc(env(safe-area-inset-bottom)+16px)] space-y-3">
            <button
              onClick={handleNext}
              className="w-full h-12 rounded-2xl bg-gradient-to-r from-primary to-purple-600 text-primary-foreground font-semibold text-[15px] shadow-lg shadow-primary/20 active:scale-[0.98] transition-transform"
            >
              {isLast ? "Empezar a explorar" : "Continuar"}
            </button>
            <button
              onClick={handleComplete}
              className="w-full text-xs text-muted-foreground/70 hover:text-muted-foreground transition-colors py-1"
            >
              Saltar
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export function useWelcomeOnboarding() {
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    const completed = localStorage.getItem(ONBOARDING_KEY);
    if (!completed) {
      setShowWelcome(true);
    }
  }, []);

  const handleComplete = () => {
    setShowWelcome(false);
  };

  return { showWelcome, handleComplete };
}
