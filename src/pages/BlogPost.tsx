import { useParams, Link, Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Calendar, Clock, ArrowLeft, ArrowRight, Sparkles } from "lucide-react";
import { SEO } from "@/components/SEO";
import { getPostBySlug, BLOG_POSTS } from "@/content/blog-posts";
import { StickyHeader, Footer } from "@/components/business-landing";
import { EASE, gradientText, gradientBg, brandCard } from "@/components/business-landing/_landingShared";

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const post = slug ? getPostBySlug(slug) : null;

  if (!post) return <Navigate to="/blog" replace />;

  const canonical = `/blog/${post.slug}`;
  const related = BLOG_POSTS.filter((p) => p.slug !== post.slug).slice(0, 2);

  return (
    <>
      <SEO
        title={`${post.title} | Glowapp`}
        description={post.description}
        keywords={post.tags.join(", ")}
        canonicalUrl={canonical}
        type="article"
        publishedTime={post.date}
        modifiedTime={post.date}
        author={post.author}
        breadcrumbs={[
          { name: "Inicio", url: "/" },
          { name: "Blog", url: "/blog" },
          { name: post.title, url: canonical },
        ]}
      />
      <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
        <StickyHeader />

        {/* HERO */}
        <header
          className="relative liquid-bg pt-28 pb-12 sm:pt-36 sm:pb-16 px-4 sm:px-6 overflow-hidden"
          style={{ paddingTop: "max(7rem, calc(env(safe-area-inset-top) + 5rem))" }}
        >
          <div className="absolute inset-0 -z-10 opacity-40 bg-[radial-gradient(circle_at_top,hsl(var(--accent)/0.18),transparent_55%)]" />
          <div className="max-w-3xl mx-auto">
            <Link
              to="/blog"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-accent transition-colors mb-6"
            >
              <ArrowLeft className="w-4 h-4" /> Volver al blog
            </Link>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: EASE }}
              className="flex flex-wrap gap-2 mb-5"
            >
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] uppercase tracking-[0.14em] font-semibold text-accent bg-accent/10 px-2.5 py-1 rounded-full"
                >
                  {tag}
                </span>
              ))}
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: EASE, delay: 0.05 }}
              className="text-balance text-3xl sm:text-5xl font-bold leading-[1.08] tracking-tight mb-5"
            >
              {post.title}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: EASE, delay: 0.12 }}
              className="text-base sm:text-xl text-muted-foreground leading-relaxed mb-6"
            >
              {post.description}
            </motion.p>

            <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                {new Date(post.date).toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" })}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                {post.readingMinutes} min de lectura
              </span>
              <span>Por <span className="text-foreground font-medium">{post.author}</span></span>
            </div>
          </div>
        </header>

        <main className="px-4 sm:px-6 max-w-3xl mx-auto pb-24">
          <motion.article
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6, ease: EASE }}
            className="pt-10"
          >
            <div
              className="prose prose-slate max-w-none
                prose-headings:font-bold prose-headings:tracking-tight
                prose-h2:text-2xl sm:prose-h2:text-3xl prose-h2:mt-12 prose-h2:mb-4 prose-h2:leading-tight
                prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3
                prose-p:text-base prose-p:leading-relaxed prose-p:text-foreground/85
                prose-li:text-base prose-li:text-foreground/85 prose-li:my-1
                prose-a:text-accent prose-a:no-underline hover:prose-a:underline
                prose-strong:text-foreground prose-strong:font-semibold
                prose-ol:my-4 prose-ul:my-4"
              dangerouslySetInnerHTML={{ __html: post.body }}
            />
          </motion.article>

          {/* CTA brand card */}
          <motion.section
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6, ease: EASE }}
            className="mt-16 text-center rounded-3xl p-10 sm:p-12 text-white relative overflow-hidden"
            style={brandCard}
          >
            <Sparkles className="absolute top-5 right-5 w-5 h-5 text-accent opacity-60" />
            <h2 className="text-2xl sm:text-3xl font-bold mb-3 leading-tight">
              Prueba <span className="font-ashing">Glowapp</span> <span className="font-serif italic" style={gradientText}>gratis 1 mes</span>
            </h2>
            <p className="text-white/70 mb-6 text-sm max-w-md mx-auto">
              Todo lo que tu salón necesita en una sola app. Sin permanencia.
            </p>
            <Link
              to="/onboarding"
              className="group inline-flex items-center justify-center gap-1.5 rounded-full px-6 py-3 text-sm font-semibold text-white shadow-xl shadow-accent/40 transition-all duration-300 hover:scale-[1.02] active:scale-[0.97]"
              style={{ backgroundImage: gradientBg }}
            >
              Empezar ahora
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </motion.section>

          {/* Related */}
          {related.length > 0 && (
            <section className="mt-16">
              <h2 className="text-xl sm:text-2xl font-bold mb-5">
                Sigue <span className="font-serif italic" style={gradientText}>leyendo</span>
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {related.map((p) => (
                  <Link
                    key={p.slug}
                    to={`/blog/${p.slug}`}
                    className="block p-5 rounded-2xl liquid-glass-card transition-all hover:-translate-y-0.5"
                  >
                    <h3 className="font-semibold mb-2 text-base leading-tight group-hover:text-primary">{p.title}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{p.description}</p>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </main>
        <Footer />
      </div>
    </>
  );
}
