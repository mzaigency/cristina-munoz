import { Link } from "react-router-dom";
import { Calendar, Clock, ArrowRight } from "lucide-react";
import { SEO } from "@/components/SEO";
import { BLOG_POSTS } from "@/content/blog-posts";
import { StickyHeader, Footer } from "@/components/business-landing";

export default function Blog() {
  return (
    <>
      <SEO
        title="Blog Glowapp | Recursos para salones de belleza"
        description="Guías, comparativas y consejos prácticos para digitalizar tu peluquería, barbería o centro de estética en España."
        keywords="blog salón belleza, gestión peluquería, software peluquería, digitalización salón, marketing peluquería"
        canonicalUrl="/blog"
        breadcrumbs={[
          { name: "Inicio", url: "/" },
          { name: "Blog", url: "/blog" },
        ]}
      />
      <div className="min-h-screen bg-background text-foreground">
        <StickyHeader />
        <main
          className="pt-20 pb-24 px-4 sm:px-6 max-w-4xl mx-auto"
          style={{ paddingTop: "max(5rem, env(safe-area-inset-top))" }}
        >
          <header className="text-center pt-6 pb-10">
            <p className="text-xs font-semibold tracking-widest text-primary uppercase mb-3">Blog</p>
            <h1 className="text-3xl sm:text-5xl font-bold tracking-tight mb-4">
              Recursos para hacer crecer tu salón
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
              Guías, comparativas y consejos prácticos para peluquerías, barberías y centros de estética en España.
            </p>
          </header>

          <section className="grid gap-5 sm:gap-6">
            {BLOG_POSTS.map((post) => (
              <Link
                key={post.slug}
                to={`/blog/${post.slug}`}
                className="block group p-5 sm:p-6 rounded-3xl bg-card border border-border hover:border-primary/40 hover:shadow-lg transition-all"
              >
                <div className="flex flex-wrap gap-2 mb-3">
                  {post.tags.map((tag) => (
                    <span key={tag} className="text-[10px] uppercase tracking-wider font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
                <h2 className="text-xl sm:text-2xl font-bold mb-2 group-hover:text-primary transition-colors text-balance">
                  {post.title}
                </h2>
                <p className="text-sm sm:text-base text-muted-foreground mb-4">{post.description}</p>
                <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(post.date).toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" })}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    {post.readingMinutes} min
                  </span>
                  <span className="ml-auto inline-flex items-center gap-1 text-primary font-semibold">
                    Leer <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </Link>
            ))}
          </section>
        </main>
        <Footer />
      </div>
    </>
  );
}
