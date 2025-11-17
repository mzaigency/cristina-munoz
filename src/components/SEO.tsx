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
  title = "Cristina Muñoz - Peluquería en Santpedor",
  description = "Reserva tu cita online en Cristina Muñoz, una peluquería ubicada en Santpedor. Servicios profesionales de corte, coloración, peinados y tratamientos capilares en un ambiente elegante",
  keywords = "peluquería Santpedor, peluquería cerca de mí, corte de pelo Santpedor, coloración cabello, mechas, balayage, tratamientos capilares, peinados profesionales, reserva online peluquería",
  ogImage = "https://lovable.dev/opengraph-image-p98pqg.png",
  canonicalUrl,
  noindex = false,
}: SEOProps) => {
  const baseUrl = "https://cristinamunoz.lovable.app";
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
      <meta property="og:site_name" content="Cristina Muñoz Peluquería" />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />

      {/* Additional SEO */}
      <meta name="author" content="Cristina Muñoz" />
      <meta name="geo.region" content="ES-B" />
      <meta name="geo.placename" content="Santpedor" />
      <meta name="geo.position" content="41.8117;1.8892" />
      <meta name="ICBM" content="41.8117, 1.8892" />
    </Helmet>
  );
};
