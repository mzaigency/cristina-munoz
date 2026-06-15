import mobileShot from "@/assets/business-landing/cristina-mobile.png.asset.json";
import desktopShot from "@/assets/business-landing/cristina-desktop.png.asset.json";

/**
 * Captura real de la landing pública de un tenant (Cristina Muñoz).
 * Variante `mobile` → screenshot vertical (para PhoneVisual).
 * Variante `desktop` → screenshot horizontal (para WebVisual).
 * Imagen pixel-perfect, sin reconstrucción CSS.
 */

type Variant = "mobile" | "desktop";

interface Props {
  variant?: Variant;
  className?: string;
}

export const TenantLandingMockup = ({ variant = "mobile", className = "" }: Props) => {
  const src = variant === "mobile" ? mobileShot.url : desktopShot.url;
  return (
    <img
      src={src}
      alt="Landing real de Cristina Muñoz creada con GlowApp"
      loading="lazy"
      decoding="async"
      className={`block h-full w-full object-cover object-top ${className}`}
      draggable={false}
    />
  );
};
