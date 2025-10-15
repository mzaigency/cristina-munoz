import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Instagram } from "lucide-react";

export const GallerySection = () => {
  // Array de posts de Instagram - puedes reemplazar estos IDs con los reales del Instagram
  const instagramPosts = [
    "C-xxxxxx", // Reemplazar con ID real del post
    "C-yyyyyy",
    "C-zzzzzz",
    "C-aaaaaa",
    "C-bbbbbb",
    "C-cccccc",
  ];

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
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {instagramPosts.map((postId, index) => (
              <Card 
                key={postId} 
                className="overflow-hidden group hover:shadow-lg transition-all duration-300 hover:scale-105"
              >
                <CardContent className="p-0">
                  <a
                    href={`https://www.instagram.com/p/${postId}/`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block relative aspect-square bg-gradient-to-br from-salon-accent/20 to-salon-primary/20"
                  >
                    {/* Instagram embed placeholder */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Instagram className="w-12 h-12 text-muted-foreground group-hover:text-salon-primary transition-colors" />
                    </div>
                    {/* Overlay on hover */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center">
                      <span className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 font-semibold">
                        Ver en Instagram
                      </span>
                    </div>
                  </a>
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
        <div className="mt-12 p-6 bg-muted/50 rounded-lg border border-border">
          <p className="text-sm text-muted-foreground text-center">
            <strong>Nota:</strong> Para mostrar tus posts reales de Instagram, actualiza los IDs de los posts en el array <code className="bg-background px-2 py-1 rounded">instagramPosts</code> en el componente GallerySection.tsx
          </p>
        </div>
      </div>
    </section>
  );
};
