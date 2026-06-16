import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Calendar, Clock, ArrowRight, BookOpen } from "lucide-react";
import { SEO } from "@/components/SEO";
import { BLOG_POSTS } from "@/content/blog-posts";
import { StickyHeader, Footer } from "@/components/business-landing";
import { EASE, Eyebrow, gradientText, gradientBg } from "@/components/business-landing/_landingShared";

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
      <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
        <StickyHeader />

        <header
          className="relative liquid-bg pt-32 pb-16 sm:pt-40 sm:pb-24 px-4 sm:px-6 overflow-hidden text-center"
          style={{ paddingTop: "max(8rem, calc(env(safe-area-inset-top) + 6rem))" }}
        >
          <div className="absolute inset-0 -z-10 opacity-40 bg-[radial-gradient(circle_at_top,hsl(var(--accent)/0.18),transparent_55%)]" />
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full liquid-glass-pill text-xs font-semibold uppercase tracking-[0.16em] text-accent mb-6"
          >
            <BookOpen className="w-3.5 h-3.5" />
            Blog Glowapp
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: EASE, delay: 0.05 }}
            className="text-balance text-4xl sm:text-6xl font-bold leading-[1.05] tracking-tight"
          >
            Recursos para hacer <span className="font-serif italic" style={gradientText}>crecer tu salón</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: EASE, delay: 0.15 }}
            className="mx-auto mt-5 max-w-2xl text-base sm:text-lg text-muted-foreground"
          >
            Guías, comparativas y consejos prácticos para peluquerías, barberías y centros de estética en España.
          </motion.p>
        </header>

        <main className="px-4 sm:px-6 max-w-4xl mx-auto pb-24 -mt-8">
          <section className="grid gap-5 sm:gap-6">
            {BLOG_POSTS.map((post, i) => (
              <motion.div
                key={post.slug}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, ease: EASE, delay: i * 0.05 }}
              >
                <Link
                  to={`/blog/${post.slug}`}
                  className="block group p-6 sm:p-8 rounded-3xl liquid-glass-card transition-all hover:-translate-y-0.5"
                >
                  <div className="flex flex-wrap gap-2 mb-4">
                    {post.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] uppercase tracking-[0.14em] font-semibold text-accent bg-accent/10 px-2.5 py-1 rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <h2 className="text-xl sm:text-3xl font-bold mb-3 leading-[1.15] group-hover:text-primary transition-colors text-balance">
                    {post.title}
                  </h2>
                  <p className="text-sm sm:text-base text-muted-foreground mb-5 leading-relaxed">
                    {post.description}
                  </p>
                  <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(post.date).toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" })}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      {post.readingMinutes} min
                    </span>
                    <span
                      className="ml-auto inline-flex items-center gap-1 font-semibold text-transparent bg-clip-text"
                      style={{ backgroundImage: gradientBg }}
                    >
                      Leer
                      <ArrowRight className="w-3.5 h-3.5 text-accent transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </section>
        </main>
        <Footer />
      </div>
    </>
  );
}
