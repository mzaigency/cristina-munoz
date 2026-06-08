import { Skeleton } from "@/components/ui/skeleton";
import { usePosts } from "@/hooks/usePosts";
import { PostGrid } from "@/components/social/PostGrid";
import { Camera } from "lucide-react";
import { useTenantAccess } from "@/hooks/useTenantAccess";
import { SectionHeader } from "./_shared/SectionHeader";

interface TenantGallerySectionProps {
  tenantId: string;
  tenantName?: string;
  primaryColor?: string;
}

export const TenantGallerySection = ({ tenantId, tenantName, primaryColor }: TenantGallerySectionProps) => {
  const { tenantPosts, isLoadingTenantPosts, deletePost } = usePosts(tenantId);
  const { isAdmin } = useTenantAccess(tenantId);

  if (isLoadingTenantPosts) {
    return (
      <section className="py-20 md:py-28 bg-white">
        <div className="container mx-auto px-5 md:px-8 max-w-6xl">
          <Skeleton className="h-12 w-72 mb-4" />
          <Skeleton className="h-px w-16 mb-12" />
          <div className="grid grid-cols-3 gap-1 md:gap-2">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="aspect-square rounded-lg" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (tenantPosts.length === 0) {
    return (
      <section id="galeria" className="py-20 md:py-28 bg-white">
        <div className="container mx-auto px-5 md:px-8 max-w-6xl">
          <SectionHeader
            eyebrow="Trabajos"
            title={
              <>
                Detrás del <span className="font-editorial-italic">objetivo</span>
              </>
            }
            accentColor={primaryColor}
          />
          <div className="py-20 text-center text-neutral-400 border-y border-neutral-200">
            <Camera className="w-10 h-10 mx-auto mb-4 opacity-50" strokeWidth={1.5} />
            <p className="font-body text-sm">Próximamente compartiremos nuestros trabajos</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="galeria" className="py-20 md:py-28 bg-white">
      <div className="container mx-auto px-5 md:px-8 max-w-6xl">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12 md:mb-16">
          <SectionHeader
            eyebrow="Trabajos"
            title={
              <>
                Detrás del <span className="font-editorial-italic">objetivo</span>
              </>
            }
            description={
              tenantName
                ? `Una mirada al estudio. Lo que hacemos cada día en ${tenantName}.`
                : "Una mirada al estudio."
            }
            accentColor={primaryColor}
            className="mb-0 max-w-2xl"
          />
          <div className="font-body text-sm text-neutral-500 tabular-nums md:flex-shrink-0">
            {String(tenantPosts.length).padStart(2, "0")} publicaciones
          </div>
        </div>

        <PostGrid posts={tenantPosts} isAdmin={isAdmin} onDelete={deletePost} />
      </div>
    </section>
  );
};

export default TenantGallerySection;
