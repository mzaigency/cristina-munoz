import { useEffect, useRef, ReactNode } from "react";

interface Parallax3DProps {
  children: ReactNode;
  intensity?: number;
  className?: string;
}

export const Parallax3D = ({ children, intensity = 15, className = "" }: Parallax3DProps) => {
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

      container.style.transform = `
        perspective(1000px)
        rotateX(${rotateX}deg)
        rotateY(${rotateY}deg)
        translateZ(10px)
      `;
    };

    const handleMouseLeave = () => {
      container.style.transform = `
        perspective(1000px)
        rotateX(0deg)
        rotateY(0deg)
        translateZ(0px)
      `;
    };

    container.addEventListener("mousemove", handleMouseMove);
    container.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      container.removeEventListener("mousemove", handleMouseMove);
      container.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [intensity]);

  return (
    <div
      ref={containerRef}
      className={`parallax-3d ${className}`}
      style={{
        transformStyle: "preserve-3d",
        transition: "transform 0.3s cubic-bezier(0.23, 1, 0.32, 1)",
        willChange: "transform",
      }}
    >
      {children}
    </div>
  );
};
