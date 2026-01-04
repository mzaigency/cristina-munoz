import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { SmoothTitle } from "@/components/animations/SmoothTitle";
import { Skeleton } from "@/components/ui/skeleton";
import { usePosts } from "@/hooks/usePosts";
import { PostGrid } from "@/components/social/PostGrid";
import { Grid3X3, Camera } from "lucide-react";

interface TenantGallerySectionProps {
  tenantId: string;
  tenantName?: string;
  primaryColor?: string;
}

export const TenantGallerySection = ({ tenantId, tenantName }: TenantGallerySectionProps) => {
  const { tenantPosts, isLoadingTenantPosts } = usePosts(tenantId);

  if (isLoadingTenantPosts) {
    return (
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="mb-8 text-center">
            <Skeleton className="h-8 w-48 mx-auto mb-4" />
            <Skeleton className="h-5 w-72 mx-auto" />
          </div>
          <div className="grid grid-cols-3 gap-0.5">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="aspect-square" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (tenantPosts.length === 0) {
    return (
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <SmoothTitle>
              <h2 className="mb-3 text-2xl font-bold text-foreground sm:text-3xl">
                Nuestros Trabajos
              </h2>
            </SmoothTitle>
            <div className="line-accent mx-auto mb-6" />
            <div className="py-12 text-muted-foreground">
              <Camera className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p>Próximamente compartiremos nuestros trabajos</p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4">
        <div className="mb-8 text-center">
          <SmoothTitle>
            <h2 className="mb-3 text-2xl font-bold text-foreground sm:text-3xl">
              Nuestros Trabajos
            </h2>
          </SmoothTitle>
          <div className="line-accent mx-auto mb-4" />
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Descubre algunos de nuestros mejores trabajos
            {tenantName && ` en ${tenantName}`}
          </p>
        </div>

        {/* Instagram-style grid */}
        <ScrollReveal>
          <div className="flex justify-center gap-4 mb-6">
            <button className="flex items-center gap-2 text-sm font-medium text-foreground border-t-2 border-foreground pt-3 px-4">
              <Grid3X3 className="w-4 h-4" />
              Publicaciones
            </button>
          </div>
          <PostGrid posts={tenantPosts} />
        </ScrollReveal>

        {/* Post count */}
        <div className="text-center mt-6 text-sm text-muted-foreground">
          {tenantPosts.length} publicación{tenantPosts.length !== 1 ? "es" : ""}
        </div>
      </div>
    </section>
  );
};

export default TenantGallerySection;
