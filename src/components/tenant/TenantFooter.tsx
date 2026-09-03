import { useT } from "@/lib/tenantI18n";

interface Tenant {
  id: string;
  name: string;
  city?: string | null;
  tagline?: string | null;
  description?: string | null;
}

interface TenantFooterProps {
  tenant: Tenant;
}

export const TenantFooter = ({ tenant }: TenantFooterProps) => {
  const currentYear = new Date().getFullYear();
  const t = useT();

  const subline =
    tenant.tagline ||
    (tenant.city ? `Tu espacio de confianza en ${tenant.city}` : "Tu espacio de confianza y bienestar");

  return (
    <footer
      className="bg-[var(--tv-section-tint)] border-t border-neutral-200/70 py-10 transition-colors"
      style={{ paddingBottom: "calc(5.5rem + env(safe-area-inset-bottom))" }}
    >
      <div className="container mx-auto px-5 md:px-8 max-w-6xl">
        <div className="flex flex-col items-center text-center gap-5">
          {/* Brand & Subtitle */}
          <div>
            <h3 className="font-editorial text-2xl text-neutral-900 tracking-[-0.02em] font-semibold">
              {tenant.name}
            </h3>
            {subline && (
              <p className="text-xs text-neutral-400 font-body mt-1 max-w-md mx-auto">
                {subline}
              </p>
            )}
          </div>

          {/* Sello Glowapp — gradiente de marca sólido */}
          <a
            href="https://www.glowapp.app"
            target="_blank"
            rel="noopener noreferrer"
            className="tv-brand-pill hover:brightness-110 transition-all duration-200 ease-out active:scale-[0.97] touch-manipulation my-1"
          >
            <img src="/favicon.png" alt="Glowapp" className="h-[18px] w-[18px] rounded-[5px]" />
            <span className="text-[13px] font-semibold">{t("footer.madeWithGlow")}</span>
          </a>

          {/* Legal Links & Copyright */}
          <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-6 text-xs text-neutral-500 font-body">
            <div className="flex items-center gap-4">
              <a
                href="/privacidad"
                className="hover:text-neutral-900 transition-colors py-1"
              >
                {t("footer.privacy")}
              </a>
              <span className="text-neutral-300">·</span>
              <a
                href="/terminos"
                className="hover:text-neutral-900 transition-colors py-1"
              >
                {t("footer.terms")}
              </a>
            </div>
            <span className="hidden sm:inline text-neutral-300">·</span>
            <p className="text-neutral-400">
              © {currentYear} {tenant.name}. {t("footer.rights")}.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default TenantFooter;
