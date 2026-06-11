import { motion } from 'motion/react';

export function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 6 }}
      transition={{ duration: 0.18 }}
      className="msg-typing-row"
      aria-label="Escribiendo"
      role="status"
    >
      <div className="msg-typing-bubble">
        <span className="msg-typing-dot" />
        <span className="msg-typing-dot" />
        <span className="msg-typing-dot" />
      </div>
    </motion.div>
  );
}
