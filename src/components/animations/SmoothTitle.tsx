import { motion } from "motion/react";
import { ReactNode } from "react";

interface SmoothTitleProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

export function SmoothTitle({ children, className = "", delay = 0 }: SmoothTitleProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
