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

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;

      const rotateX = -y * intensity;
      const rotateY = x * intensity;
      
      // Calcular sombra dinámica basada en posición del mouse
      const shadowX = x * 20;
      const shadowY = y * 20;
      const shadowBlur = 30 + Math.abs(x * 10) + Math.abs(y * 10);

      container.style.transform = `
        perspective(1000px)
        rotateX(${rotateX}deg)
        rotateY(${rotateY}deg)
        translateZ(10px)
      `;

      if (enableShadow) {
        container.style.boxShadow = `
          ${shadowX}px ${shadowY}px ${shadowBlur}px rgba(0, 0, 0, 0.15),
          ${-shadowX / 2}px ${-shadowY / 2}px ${shadowBlur / 2}px rgba(129, 83, 49, 0.1)
        `;
      }
    };

    const handleMouseLeave = () => {
      container.style.transform = `
        perspective(1000px)
        rotateX(0deg)
        rotateY(0deg)
        translateZ(0px)
      `;
      
      if (enableShadow) {
        container.style.boxShadow = "0 4px 6px rgba(0, 0, 0, 0.1)";
      }
    };

    container.addEventListener("mousemove", handleMouseMove);
    container.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      container.removeEventListener("mousemove", handleMouseMove);
      container.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [intensity, enableShadow]);

  return (
    <div
      ref={containerRef}
      className={`parallax-3d ${className}`}
      style={{
        transformStyle: "preserve-3d",
        transition: "all 0.3s cubic-bezier(0.23, 1, 0.32, 1)",
        willChange: "transform, box-shadow",
        boxShadow: enableShadow ? "0 4px 6px rgba(0, 0, 0, 0.1)" : undefined,
      }}
    >
      {children}
    </div>
  );
};
