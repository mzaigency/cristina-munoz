/** Parte una palabra en spans por carácter (para desintegración GSAP). */
export function Chars({ text }: { text: string }) {
  return (
    <span className="ch-word">
      {Array.from(text).map((c, i) => (
        <span
          key={i}
          className="ch-char inline-block will-change-transform"
          style={c === " " ? { whiteSpace: "pre" } : undefined}
        >
          {c === " " ? "\u00A0" : c}
        </span>
      ))}
    </span>
  );
}
