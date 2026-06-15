import { ContainerScroll } from "@/components/ui/container-scroll-animation";
import panelInicio from "@/assets/panel-inicio.png";

export const ScrollPanelReveal = () => {
  return (
    <section className="relative overflow-hidden">
      <ContainerScroll
        titleComponent={
          <>
            <span className="mb-3 inline-block text-xs font-semibold uppercase tracking-[0.16em] text-accent">
              Tu salón, sin caos
            </span>
            <h2 className="text-balance text-4xl font-bold leading-[1.05] tracking-tight text-foreground sm:text-5xl md:text-6xl">
              Olvídate de la libreta. <br />
              <span
                className="font-serif italic"
                style={{
                  background:
                    "linear-gradient(100deg, hsl(var(--primary)), hsl(var(--accent)))",
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  color: "transparent",
                }}
              >
                Este es tu nuevo panel.
              </span>
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-base text-muted-foreground sm:text-lg">
              Reservas, agenda, caja y clientes. Todo en una pantalla, desde el móvil.
            </p>
          </>
        }
      >
        <img
          src={panelInicio}
          alt="Panel Glowapp para negocios de belleza"
          className="mx-auto h-full w-full rounded-2xl object-cover object-left-top"
          draggable={false}
        />
      </ContainerScroll>
    </section>
  );
};
