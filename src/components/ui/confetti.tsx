import { useEffect, useRef, useImperativeHandle, forwardRef } from "react";
import confetti from "canvas-confetti";

export interface ConfettiRef {
  fire: (options?: confetti.Options) => void;
}

interface ConfettiProps {
  className?: string;
  onMouseEnter?: () => void;
}

export const Confetti = forwardRef<ConfettiRef, ConfettiProps>(
  ({ className, onMouseEnter }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const confettiInstanceRef = useRef<confetti.CreateTypes | null>(null);

    useEffect(() => {
      if (canvasRef.current) {
        confettiInstanceRef.current = confetti.create(canvasRef.current, {
          resize: true,
          useWorker: true,
        });
      }

      return () => {
        confettiInstanceRef.current = null;
      };
    }, []);

    useImperativeHandle(ref, () => ({
      fire: (options = {}) => {
        if (confettiInstanceRef.current) {
          const defaults = {
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
          };
          confettiInstanceRef.current({
            ...defaults,
            ...options,
          });
        }
      },
    }));

    return (
      <canvas
        ref={canvasRef}
        className={className}
        onMouseEnter={onMouseEnter}
      />
    );
  }
);

Confetti.displayName = "Confetti";
