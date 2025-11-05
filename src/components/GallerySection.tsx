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
    <section ref={ref} className="py-32 px-4 bg-muted/20">
      <div className="container mx-auto max-w-7xl">
        <div className={`text-center mb-20 space-y-4 scroll-reveal ${isVisible ? "visible" : ""}`}>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground">Portfolio</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Cada trabajo es una historia única de transformación y estilo
          </p>
        </div>

        <div className="mb-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {instagramPosts.map((postUrl, index) => (
              <Card
                key={index}
                className={`overflow-hidden border-none shadow-md hover:shadow-2xl transition-all duration-500 scroll-reveal ${isVisible ? "visible" : ""}`}
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
                      borderRadius: "12px",
                      boxShadow: "none",
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
            variant="outline"
            onClick={() => window.open("https://instagram.com/cristinamunoz_hairstylist/", "_blank")}
            className="gap-2 px-8 py-6 text-base bg-background hover:bg-muted transition-all duration-300 hover:scale-105 shadow-md hover:shadow-lg"
          >
            <Instagram className="w-5 h-5" />
            Síguenos en Instagram
          </Button>
        </div>
      </div>
    </section>
  );
};
