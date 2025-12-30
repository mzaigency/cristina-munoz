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
  title = "GlowApp",
  description = "La red social de belleza y bienestar. Conecta con los mejores salones, descubre tendencias y reserva citas al instante.",
  keywords = "red social belleza, salones de belleza, reservas online, peluquería, estética, bienestar, tendencias belleza, GlowUp, GlowApp",
  ogImage = "https://lovable.dev/opengraph-image-p98pqg.png",
  canonicalUrl,
  noindex = false,
}: SEOProps) => {
  const baseUrl = "https://glowup.lovable.app";
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
      <meta property="og:url" content={fullCanonicalUrl} />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="GlowApp" />

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
