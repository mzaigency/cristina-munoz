import { MapPin, Phone, Mail, Instagram, Facebook, ExternalLink } from "lucide-react";
import { SectionHeader } from "./_shared/SectionHeader";

const TikTokIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
  </svg>
);

interface TenantLocationSectionProps {
  tenantName: string;
  address?: string | null;
  city?: string | null;
  postalCode?: string | null;
  phone?: string | null;
  email?: string | null;
  instagramUrl?: string | null;
  facebookUrl?: string | null;
  tiktokUrl?: string | null;
  googleMapsUrl?: string | null;
  primaryColor?: string;
}

export const TenantLocationSection = ({
  tenantName,
  address,
  city,
  postalCode,
  phone,
  email,
  instagramUrl,
  facebookUrl,
  tiktokUrl,
  googleMapsUrl,
  primaryColor,
}: TenantLocationSectionProps) => {
  const fullAddress = [address, city, postalCode].filter(Boolean).join(", ");
  const mapsSearchUrl =
    googleMapsUrl ||
    (fullAddress ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}` : null);

  const accent = primaryColor || "hsl(var(--primary))";

  return (
    <section id="ubicacion" className="py-20 md:py-28 bg-white">
      <div className="container mx-auto px-5 md:px-8 max-w-6xl">
        <SectionHeader
          eyebrow="Visítanos"
          title={
            <>
              Te <span className="font-editorial-italic">esperamos</span>
            </>
          }
          description="Pasa por el estudio o escríbenos por el canal que prefieras."
          accentColor={primaryColor}
        />

        <div className="grid lg:grid-cols-[1fr_1.2fr] gap-6 lg:gap-10">
          {/* Info column */}
          <div className="flex flex-col">
            <h3 className="font-editorial text-3xl text-neutral-900 mb-1 tracking-[-0.02em]">{tenantName}</h3>
            <div className="h-px w-10 bg-neutral-300 mb-8 mt-3" />

            <ul className="space-y-7">
              {fullAddress && (
                <li className="flex gap-5">
                  <div
                    className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ background: `color-mix(in oklab, ${accent}, white 90%)`, color: accent }}
                  >
                    <MapPin className="h-4 w-4" strokeWidth={2} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10.5px] font-bold uppercase tracking-[0.18em] mb-1 font-body" style={{ color: accent }}>
                      Dirección
                    </p>
                    <p className="font-editorial text-lg text-neutral-900 leading-snug">{fullAddress}</p>
                    {mapsSearchUrl && (
                      <a
                        href={mapsSearchUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-flex items-center gap-1.5 text-xs font-body font-semibold underline-offset-4 hover:underline"
                        style={{ color: accent }}
                      >
                        Ver en Google Maps
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </li>
              )}

              {phone && (
                <li className="flex gap-5">
                  <div
                    className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ background: `color-mix(in oklab, ${accent}, white 90%)`, color: accent }}
                  >
                    <Phone className="h-4 w-4" strokeWidth={2} />
                  </div>
                  <div>
                    <p className="text-[10.5px] font-bold uppercase tracking-[0.18em] mb-1 font-body" style={{ color: accent }}>
                      Teléfono
                    </p>
                    <a
                      href={`tel:${phone}`}
                      className="font-editorial text-lg text-neutral-900 hover:opacity-70 transition-opacity"
                    >
                      {phone}
                    </a>
                  </div>
                </li>
              )}

              {email && (
                <li className="flex gap-5">
                  <div
                    className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ background: `color-mix(in oklab, ${accent}, white 90%)`, color: accent }}
                  >
                    <Mail className="h-4 w-4" strokeWidth={2} />
                  </div>
                  <div>
                    <p className="text-[10.5px] font-bold uppercase tracking-[0.18em] mb-1 font-body" style={{ color: accent }}>
                      Email
                    </p>
                    <a
                      href={`mailto:${email}`}
                      className="font-editorial text-lg text-neutral-900 hover:opacity-70 transition-opacity break-all"
                    >
                      {email}
                    </a>
                  </div>
                </li>
              )}
            </ul>

            {(instagramUrl || facebookUrl || tiktokUrl) && (
              <div className="mt-10 pt-8 border-t border-neutral-200">
                <p className="text-[10.5px] font-bold uppercase tracking-[0.18em] mb-4 font-body text-neutral-500">
                  Síguenos
                </p>
                <div className="flex gap-2">
                  {instagramUrl && (
                    <a
                      href={instagramUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-11 h-11 rounded-full border border-neutral-200 text-neutral-700 flex items-center justify-center transition-all duration-300 hover:bg-gradient-to-br hover:from-purple-500 hover:to-pink-500 hover:text-white hover:border-transparent hover:-translate-y-0.5"
                      aria-label="Instagram"
                    >
                      <Instagram className="h-4 w-4" />
                    </a>
                  )}
                  {facebookUrl && (
                    <a
                      href={facebookUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-11 h-11 rounded-full border border-neutral-200 text-neutral-700 flex items-center justify-center transition-all duration-300 hover:bg-blue-600 hover:text-white hover:border-transparent hover:-translate-y-0.5"
                      aria-label="Facebook"
                    >
                      <Facebook className="h-4 w-4" />
                    </a>
                  )}
                  {tiktokUrl && (
                    <a
                      href={tiktokUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-11 h-11 rounded-full border border-neutral-200 text-neutral-700 flex items-center justify-center transition-all duration-300 hover:bg-black hover:text-white hover:border-transparent hover:-translate-y-0.5"
                      aria-label="TikTok"
                    >
                      <TikTokIcon className="h-4 w-4" />
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Map */}
          <div className="rounded-2xl overflow-hidden bg-neutral-100 shadow-[0_18px_40px_-22px_rgba(20,22,40,0.18)] min-h-[420px] lg:min-h-[520px] relative">
            {mapsSearchUrl ? (
              <iframe
                src={`https://www.google.com/maps?q=${encodeURIComponent(fullAddress || tenantName)}&output=embed`}
                width="100%"
                height="100%"
                style={{ border: 0, minHeight: "420px" }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title={`Ubicación de ${tenantName}`}
                className="filter grayscale-[0.15]"
              />
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-neutral-400">
                <MapPin className="h-12 w-12 opacity-30 mb-3" strokeWidth={1.5} />
                <p className="font-body text-sm">Ubicación próximamente</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default TenantLocationSection;
