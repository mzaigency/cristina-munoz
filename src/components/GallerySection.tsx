import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Instagram } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { Parallax3D } from "@/components/animations/Parallax3D";
import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { SmoothTitle } from "@/components/animations/SmoothTitle";
export const GallerySection = () => {
  const [loadedEmbeds, setLoadedEmbeds] = useState<Set<number>>(new Set());
  const { ref, isVisible } = useScrollAnimation(0.1);
  
  const instagramPosts = JSON.parse(import.meta.env.VITE_INSTAGRAM_POSTS_JSON || '[]');
  useEffect(() => {
    // Cargar el script de Instagram embeds
    const script = document.createElement("script");
    script.src = "https://www.instagram.com/embed.js";
    script.async = true;
    document.body.appendChild(script);
    script.onload = () => {
      // Procesar los embeds cuando el script carga
      if ((window as any).instgrm) {
        (window as any).instgrm.Embeds.process();
      }
    };
    return () => {
      document.body.removeChild(script);
    };
  }, []);
  const handleEmbedLoad = (index: number) => {
    setLoadedEmbeds((prev) => new Set(prev).add(index));
  };
  return (
    <section ref={ref} className="py-20 px-4 bg-gradient-to-b from-background to-secondary/10">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-12 space-y-4">
          <SmoothTitle>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              Nuestros Trabajos
            </h2>
          </SmoothTitle>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Descubre las últimas tendencias y transformaciones realizadas en nuestro salón
          </p>
        </div>

        <div className="mb-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {instagramPosts.map((postUrl: string, index: number) => (
              <ScrollReveal key={index} delay={index * 100}>
                  <Card className="overflow-hidden hover-lift">
                    <CardContent className="p-0">
                      <blockquote
                        className="instagram-media"
                        data-instgrm-permalink={postUrl}
                        data-instgrm-version="14"
                        style={{
                          background: "#FFF",
                          border: 0,
                          borderRadius: "3px",
                          boxShadow: "0 0 1px 0 rgba(0,0,0,0.5),0 1px 10px 0 rgba(0,0,0,0.15)",
                          margin: "1px",
                          maxWidth: "540px",
                          minWidth: "326px",
                          padding: 0,
                          width: "calc(100% - 2px)",
                        }}
                        onLoad={() => handleEmbedLoad(index)}
                      />
                    </CardContent>
                  </Card>
              </ScrollReveal>
            ))}
          </div>
        </div>

        <div className="text-center">
          <Button
            size="lg"
            variant="default"
            onClick={() => window.open(import.meta.env.VITE_SOCIAL_INSTAGRAM_URL, "_blank")}
            className="gap-2 transition-all duration-300 hover:scale-105 hover:shadow-lg"
          >
            <Instagram className="w-5 h-5" />
            Síguenos en Instagram
          </Button>
        </div>
      </div>
    </section>
  );
};
