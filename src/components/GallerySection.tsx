import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Instagram } from "lucide-react";

export const GallerySection = () => {
  const [loadedEmbeds, setLoadedEmbeds] = useState<Set<number>>(new Set());
  
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
    const script = document.createElement('script');
    script.src = 'https://www.instagram.com/embed.js';
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
    setLoadedEmbeds(prev => new Set(prev).add(index));
  };

  return (
    <section className="py-20 px-4 bg-gradient-to-b from-background to-secondary/10">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-12 space-y-4">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground">
            Nuestros Trabajos
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Descubre las últimas tendencias y transformaciones realizadas en nuestro salón
          </p>
        </div>

        <div className="mb-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {instagramPosts.map((postUrl, index) => (
              <Card 
                key={index} 
                className="overflow-hidden hover:shadow-lg transition-shadow duration-300"
              >
                <CardContent className="p-0">
                  {!loadedEmbeds.has(index) && (
                    <Skeleton className="w-full aspect-square" />
                  )}
                  <blockquote
                    className="instagram-media"
                    data-instgrm-permalink={postUrl}
                    data-instgrm-version="14"
                    style={{
                      background: '#FFF',
                      border: 0,
                      borderRadius: '3px',
                      boxShadow: '0 0 1px 0 rgba(0,0,0,0.5),0 1px 10px 0 rgba(0,0,0,0.15)',
                      margin: '1px',
                      maxWidth: '540px',
                      minWidth: '326px',
                      padding: 0,
                      width: 'calc(100% - 2px)',
                      display: loadedEmbeds.has(index) ? 'block' : 'none'
                    }}
                    onLoad={() => handleEmbedLoad(index)}
                  />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="text-center">
          <Button
            size="lg"
            className="gap-2 bg-gradient-to-r from-salon-primary to-salon-accent hover:opacity-90 transition-opacity"
            onClick={() => window.open('https://www.instagram.com/cristinamunoz_peluqueria/', '_blank')}
          >
            <Instagram className="w-5 h-5" />
            Síguenos en Instagram
          </Button>
        </div>

        {/* Instrucciones para actualizar */}
        <div className="mt-12 p-6 bg-muted rounded-lg border border-border shadow-sm">
          <p className="text-sm text-muted-foreground">
            <strong>Cómo actualizar tus posts:</strong>
          </p>
          <ol className="text-sm text-muted-foreground mt-2 space-y-1 list-decimal list-inside">
            <li>Abre Instagram en tu navegador</li>
            <li>Ve a tu perfil (@cristinamunoz_peluqueria)</li>
            <li>Haz clic en una foto que quieras mostrar</li>
            <li>Copia la URL completa de la barra de direcciones (ejemplo: https://www.instagram.com/p/ABC123/)</li>
            <li>Pega esa URL en el archivo <code className="bg-background px-2 py-1 rounded">src/components/GallerySection.tsx</code> en el array <code className="bg-background px-2 py-1 rounded">instagramPosts</code></li>
            <li>Repite para cada foto que quieras mostrar</li>
          </ol>
        </div>
      </div>
    </section>
  );
};
