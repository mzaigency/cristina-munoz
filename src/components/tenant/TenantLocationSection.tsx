import { MapPin, Phone, Mail, Instagram, Facebook, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { SmoothTitle } from "@/components/animations/SmoothTitle";

interface TenantLocationSectionProps {
  tenantName: string;
  address?: string | null;
  city?: string | null;
  postalCode?: string | null;
  phone?: string | null;
  email?: string | null;
  instagramUrl?: string | null;
  facebookUrl?: string | null;
  googleMapsUrl?: string | null;
  primaryColor?: string; // kept for backwards compatibility but not used
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
  googleMapsUrl,
}: TenantLocationSectionProps) => {
  const fullAddress = [address, city, postalCode].filter(Boolean).join(", ");
  const mapsSearchUrl = googleMapsUrl || 
    (fullAddress ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}` : null);

  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="mb-12 text-center">
          <SmoothTitle>
            <h2 className="mb-4 text-3xl font-bold text-foreground md:text-4xl">
              Encuéntranos
            </h2>
          </SmoothTitle>
          <div className="line-accent mx-auto mb-4" />
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Contact Info */}
          <ScrollReveal>
            <div className="bg-card rounded-2xl p-8 shadow-lg h-full">
              <h3 className="text-2xl font-bold mb-6 text-primary">
                {tenantName}
              </h3>
              
              <div className="space-y-4">
                {fullAddress && (
                  <div className="flex items-start gap-4">
                    <MapPin className="h-5 w-5 mt-1 flex-shrink-0 text-primary" />
                    <div>
                      <p className="font-medium">Dirección</p>
                      <p className="text-muted-foreground">{fullAddress}</p>
                      {mapsSearchUrl && (
                        <a
                          href={mapsSearchUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline inline-flex items-center gap-1 mt-1"
                        >
                          Ver en Google Maps
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {phone && (
                  <div className="flex items-start gap-4">
                    <Phone className="h-5 w-5 mt-1 flex-shrink-0 text-primary" />
                    <div>
                      <p className="font-medium">Teléfono</p>
                      <a 
                        href={`tel:${phone}`}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {phone}
                      </a>
                    </div>
                  </div>
                )}

                {email && (
                  <div className="flex items-start gap-4">
                    <Mail className="h-5 w-5 mt-1 flex-shrink-0 text-primary" />
                    <div>
                      <p className="font-medium">Email</p>
                      <a 
                        href={`mailto:${email}`}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {email}
                      </a>
                    </div>
                  </div>
                )}

                {/* Social Links */}
                {(instagramUrl || facebookUrl) && (
                  <div className="pt-4 border-t">
                    <p className="font-medium mb-3">Síguenos</p>
                    <div className="flex gap-3">
                      {instagramUrl && (
                        <Button 
                          variant="outline" 
                          size="icon" 
                          asChild
                          className="hover:bg-gradient-to-br hover:from-purple-500 hover:to-pink-500 hover:text-white hover:border-transparent"
                        >
                          <a href={instagramUrl} target="_blank" rel="noopener noreferrer">
                            <Instagram className="h-5 w-5" />
                          </a>
                        </Button>
                      )}
                      {facebookUrl && (
                        <Button 
                          variant="outline" 
                          size="icon" 
                          asChild
                          className="hover:bg-blue-600 hover:text-white hover:border-transparent"
                        >
                          <a href={facebookUrl} target="_blank" rel="noopener noreferrer">
                            <Facebook className="h-5 w-5" />
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </ScrollReveal>

          {/* Map Embed */}
          <ScrollReveal delay={100}>
            <div className="bg-card rounded-2xl overflow-hidden shadow-lg h-full min-h-[300px]">
              {mapsSearchUrl ? (
                <iframe
                  src={`https://www.google.com/maps?q=${encodeURIComponent(fullAddress || tenantName)}&output=embed`}
                  width="100%"
                  height="100%"
                  style={{ border: 0, minHeight: "300px" }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title={`Ubicación de ${tenantName}`}
                />
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  <MapPin className="h-12 w-12 opacity-20" />
                </div>
              )}
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
};

export default TenantLocationSection;
