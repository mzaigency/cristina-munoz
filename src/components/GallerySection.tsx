import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Instagram } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
export const GallerySection = () => {
  const [loadedEmbeds, setLoadedEmbeds] = useState<Set<number>>(new Set());
  const { ref, isVisible } = useScrollAnimation(0.1);

  // URLs completas de tus posts de Instagram
  const instagramPosts = [
    "https://www.instagram.com/p/DOOJlP2jCFc/",
    "https://www.instagram.com/p/DA1mNTQIQii/",
    "https://www.instagram.com/p/C53dETjoweW/",
    "https://www.instagram.com/p/C4k3-6OIa-K/",
    "https://www.instagram.com/p/C3um5Rao4XF/",
    "https://www.instagram.com/p/C-NFDz_I7bE/",
  ];
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
        <div className={`text-center mb-12 space-y-4 scroll-reveal ${isVisible ? "visible" : ""}`}>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground">Nuestros Trabajos</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Descubre las últimas tendencias y transformaciones realizadas en nuestro salón
          </p>
        </div>

        <div className="mb-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {instagramPosts.map((postUrl, index) => (
              <Card
                key={index}
                className={`overflow-hidden hover-lift scroll-reveal ${isVisible ? "visible" : ""}`}
                style={{
                  animationDelay: `${index * 0.1}s`,
                }}
              >
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
            ))}
          </div>
        </div>

        <div className={`text-center scroll-reveal ${isVisible ? "visible" : ""}`}>
          <Button
            size="lg"
            variant="default"
            onClick={() => window.open("instagram.com/cristinamunoz_hairstylist/", "_blank")}
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
