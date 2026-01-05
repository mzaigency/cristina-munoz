import { Helmet } from "react-helmet";

interface BreadcrumbItem {
  name: string;
  url: string;
}

interface FAQItem {
  question: string;
  answer: string;
}

interface LocalBusinessData {
  name: string;
  description?: string;
  image?: string;
  address?: {
    street?: string;
    city?: string;
    postalCode?: string;
    country?: string;
  };
  geo?: {
    latitude: number;
    longitude: number;
  };
  telephone?: string;
  priceRange?: string;
  openingHours?: string[];
  aggregateRating?: {
    ratingValue: number;
    reviewCount: number;
  };
}

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  ogImage?: string;
  canonicalUrl?: string;
  noindex?: boolean;
  type?: "website" | "article" | "product" | "profile";
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  breadcrumbs?: BreadcrumbItem[];
  faq?: FAQItem[];
  localBusiness?: LocalBusinessData;
  alternateLanguages?: { lang: string; url: string }[];
}

export const SEO = ({
  title = "GlowApp - La Red Social de Belleza y Bienestar",
  description = "Descubre los mejores salones de belleza cerca de ti, conecta con estilistas profesionales y reserva citas al instante. GlowApp es tu red social de belleza y bienestar.",
  keywords = "salones de belleza, peluquería, reservas online, estética, bienestar, estilistas, manicura, spa, tratamientos, GlowApp",
  ogImage = "https://glowapp.app/og-image.png",
  canonicalUrl,
  noindex = false,
  type = "website",
  publishedTime,
  modifiedTime,
  author = "GlowApp",
  breadcrumbs,
  faq,
  localBusiness,
  alternateLanguages,
}: SEOProps) => {
  const baseUrl = "https://glowapp.app";
  const fullCanonicalUrl = canonicalUrl ? `${baseUrl}${canonicalUrl}` : baseUrl;
  
  // Ensure title is under 60 characters for SEO
  const optimizedTitle = title.length > 60 ? title.substring(0, 57) + "..." : title;
  
  // Ensure description is under 160 characters
  const optimizedDescription = description.length > 160 ? description.substring(0, 157) + "..." : description;

  // Generate BreadcrumbList structured data
  const breadcrumbSchema = breadcrumbs && breadcrumbs.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": breadcrumbs.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": `${baseUrl}${item.url}`
    }))
  } : null;

  // Generate FAQPage structured data
  const faqSchema = faq && faq.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faq.map(item => ({
      "@type": "Question",
      "name": item.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": item.answer
      }
    }))
  } : null;

  // Generate LocalBusiness structured data
  const localBusinessSchema = localBusiness ? {
    "@context": "https://schema.org",
    "@type": "BeautySalon",
    "name": localBusiness.name,
    "description": localBusiness.description,
    "image": localBusiness.image,
    "url": fullCanonicalUrl,
    ...(localBusiness.address && {
      "address": {
        "@type": "PostalAddress",
        "streetAddress": localBusiness.address.street,
        "addressLocality": localBusiness.address.city,
        "postalCode": localBusiness.address.postalCode,
        "addressCountry": localBusiness.address.country || "ES"
      }
    }),
    ...(localBusiness.geo && {
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": localBusiness.geo.latitude,
        "longitude": localBusiness.geo.longitude
      }
    }),
    ...(localBusiness.telephone && { "telephone": localBusiness.telephone }),
    ...(localBusiness.priceRange && { "priceRange": localBusiness.priceRange }),
    ...(localBusiness.openingHours && { "openingHours": localBusiness.openingHours }),
    ...(localBusiness.aggregateRating && {
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": localBusiness.aggregateRating.ratingValue,
        "reviewCount": localBusiness.aggregateRating.reviewCount,
        "bestRating": 5,
        "worstRating": 1
      }
    })
  } : null;

  // Generate Organization structured data for brand pages
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "GlowApp",
    "url": baseUrl,
    "logo": `${baseUrl}/pwa-512x512.png`,
    "description": "La red social de belleza y bienestar líder en España",
    "sameAs": [
      "https://www.instagram.com/glowapp",
      "https://www.facebook.com/glowapp",
      "https://twitter.com/glowapp"
    ],
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "customer service",
      "availableLanguage": ["Spanish", "English"]
    }
  };

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{optimizedTitle}</title>
      <meta name="title" content={optimizedTitle} />
      <meta name="description" content={optimizedDescription} />
      <meta name="keywords" content={keywords} />
      <meta name="author" content={author} />
      <meta name="robots" content={noindex ? "noindex, nofollow" : "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"} />
      <meta name="googlebot" content={noindex ? "noindex, nofollow" : "index, follow"} />
      
      {/* Language */}
      <html lang="es" />
      <meta httpEquiv="content-language" content="es-ES" />

      {/* Canonical URL */}
      <link rel="canonical" href={fullCanonicalUrl} />
      
      {/* Alternate Languages */}
      {alternateLanguages?.map(({ lang, url }) => (
        <link key={lang} rel="alternate" hrefLang={lang} href={`${baseUrl}${url}`} />
      ))}

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={fullCanonicalUrl} />
      <meta property="og:title" content={optimizedTitle} />
      <meta property="og:description" content={optimizedDescription} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={optimizedTitle} />
      <meta property="og:site_name" content="GlowApp" />
      <meta property="og:locale" content="es_ES" />
      {publishedTime && <meta property="article:published_time" content={publishedTime} />}
      {modifiedTime && <meta property="article:modified_time" content={modifiedTime} />}
      {author && <meta property="article:author" content={author} />}

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@glowapp" />
      <meta name="twitter:creator" content="@glowapp" />
      <meta name="twitter:url" content={fullCanonicalUrl} />
      <meta name="twitter:title" content={optimizedTitle} />
      <meta name="twitter:description" content={optimizedDescription} />
      <meta name="twitter:image" content={ogImage} />
      <meta name="twitter:image:alt" content={optimizedTitle} />

      {/* Additional SEO Meta Tags */}
      <meta name="application-name" content="GlowApp" />
      <meta name="apple-mobile-web-app-title" content="GlowApp" />
      <meta name="geo.region" content="ES" />
      <meta name="geo.placename" content="España" />
      
      {/* Mobile optimization */}
      <meta name="HandheldFriendly" content="true" />
      <meta name="MobileOptimized" content="width" />

      {/* Structured Data - Organization (only on main pages) */}
      {!localBusiness && (
        <script type="application/ld+json">
          {JSON.stringify(organizationSchema)}
        </script>
      )}

      {/* Structured Data - BreadcrumbList */}
      {breadcrumbSchema && (
        <script type="application/ld+json">
          {JSON.stringify(breadcrumbSchema)}
        </script>
      )}

      {/* Structured Data - FAQPage */}
      {faqSchema && (
        <script type="application/ld+json">
          {JSON.stringify(faqSchema)}
        </script>
      )}

      {/* Structured Data - LocalBusiness */}
      {localBusinessSchema && (
        <script type="application/ld+json">
          {JSON.stringify(localBusinessSchema)}
        </script>
      )}
    </Helmet>
  );
};
