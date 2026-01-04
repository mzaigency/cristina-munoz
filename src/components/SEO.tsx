import { Helmet } from "react-helmet";

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  ogImage?: string;
  canonicalUrl?: string;
  noindex?: boolean;
}

export const SEO = ({
  title = "GlowApp - La Red Social de Belleza y Bienestar",
  description = "Descubre los mejores salones de belleza, conecta con estilistas profesionales y reserva citas al instante. GlowApp es tu red social de belleza y bienestar.",
  keywords = "salones de belleza, peluquería, estética, reservas online, belleza, bienestar, estilistas, tratamientos, manicura, spa",
  ogImage = "https://glowup.app/og-image.png",
  canonicalUrl,
  noindex = false,
}: SEOProps) => {
  const baseUrl = "https://glowup.app";
  const fullCanonicalUrl = canonicalUrl ? `${baseUrl}${canonicalUrl}` : baseUrl;

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      {noindex && <meta name="robots" content="noindex,nofollow" />}

      {/* Canonical URL */}
      <link rel="canonical" href={fullCanonicalUrl} />

      {/* Open Graph */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:url" content={fullCanonicalUrl} />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="GlowApp" />
      <meta property="og:locale" content="es_ES" />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />

      {/* Additional SEO */}
      <meta name="author" content="GlowApp" />
    </Helmet>
  );
};
