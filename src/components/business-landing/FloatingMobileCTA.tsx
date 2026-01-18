import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowRight, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const FloatingMobileCTA = () => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show after scrolling 500px
      if (window.scrollY > 500 && !isDismissed) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isDismissed]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-background/80 backdrop-blur-xl border-t border-border md:hidden"
          style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}
        >
          <div className="flex items-center gap-3">
            <Button
              className="flex-1 rounded-full"
              onClick={() => navigate('/auth?mode=register&business=true')}
            >
              Empezar gratis
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="flex-shrink-0"
              onClick={() => {
                setIsDismissed(true);
                setIsVisible(false);
              }}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
