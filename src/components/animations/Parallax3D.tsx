import { useEffect, useRef, ReactNode } from "react";

interface Parallax3DProps {
  children: ReactNode;
  intensity?: number;
  className?: string;
  enableShadow?: boolean;
}

export const Parallax3D = ({ 
  children, 
  intensity = 15, 
  className = "",
  enableShadow = true 
}: Parallax3DProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const rectRef = useRef<DOMRect | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Cache del getBoundingClientRect
    const updateRect = () => {
      rectRef.current = container.getBoundingClientRect();
    };
    
    updateRect();
    window.addEventListener('resize', updateRect);

    const handleMouseMove = (e: MouseEvent) => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }

      rafRef.current = requestAnimationFrame(() => {
        if (!rectRef.current) return;
        
        const x = (e.clientX - rectRef.current.left) / rectRef.current.width - 0.5;
        const y = (e.clientY - rectRef.current.top) / rectRef.current.height - 0.5;

        const rotateX = -y * intensity;
        const rotateY = x * intensity;
        
        // Utilitzar CSS custom properties per evitar forced reflow
        container.style.setProperty('--rotate-x', `${rotateX}deg`);
        container.style.setProperty('--rotate-y', `${rotateY}deg`);

        if (enableShadow) {
          const shadowX = x * 20;
          const shadowY = y * 20;
          const shadowBlur = 30 + Math.abs(x * 10) + Math.abs(y * 10);
          
          container.style.setProperty('--shadow-x', `${shadowX}px`);
          container.style.setProperty('--shadow-y', `${shadowY}px`);
          container.style.setProperty('--shadow-blur', `${shadowBlur}px`);
        }
      });
    };

    const handleMouseLeave = () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      
      container.style.setProperty('--rotate-x', '0deg');
      container.style.setProperty('--rotate-y', '0deg');
      
      if (enableShadow) {
        container.style.setProperty('--shadow-x', '0px');
        container.style.setProperty('--shadow-y', '0px');
        container.style.setProperty('--shadow-blur', '6px');
      }
    };

    container.addEventListener("mousemove", handleMouseMove, { passive: true });
    container.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      window.removeEventListener('resize', updateRect);
      container.removeEventListener("mousemove", handleMouseMove);
      container.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [intensity, enableShadow]);

  return (
    <div
      ref={containerRef}
      className={`parallax-3d ${className}`}
      style={{
        '--rotate-x': '0deg',
        '--rotate-y': '0deg',
        '--shadow-x': '0px',
        '--shadow-y': '0px',
        '--shadow-blur': '6px',
        transform: 'perspective(1000px) rotateX(var(--rotate-x)) rotateY(var(--rotate-y)) translateZ(10px)',
        transformStyle: "preserve-3d",
        transition: "all 0.3s cubic-bezier(0.23, 1, 0.32, 1)",
        willChange: "transform",
        boxShadow: enableShadow 
          ? 'var(--shadow-x) var(--shadow-y) var(--shadow-blur) rgba(0, 0, 0, 0.15)' 
          : undefined,
      } as React.CSSProperties}
    >
      {children}
    </div>
  );
};
