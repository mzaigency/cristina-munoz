import { useParams, Link, Navigate } from "react-router-dom";
import { Calendar, Clock, ArrowLeft, ArrowRight } from "lucide-react";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { getPostBySlug, BLOG_POSTS } from "@/content/blog-posts";
import { StickyHeader, Footer } from "@/components/business-landing";

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
      <div className="min-h-screen bg-background text-foreground">
        <StickyHeader />
        <main
          className="pt-20 pb-24 px-4 sm:px-6 max-w-3xl mx-auto"
          style={{ paddingTop: "max(5rem, env(safe-area-inset-top))" }}
        >
          <Link
            to="/blog"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary mt-4 mb-6"
          >
            <ArrowLeft className="w-4 h-4" /> Volver al blog
          </Link>

          <article>
            <div className="flex flex-wrap gap-2 mb-4">
              {post.tags.map((tag) => (
                <span key={tag} className="text-[10px] uppercase tracking-wider font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                  {tag}
                </span>
              ))}
            </div>
            <h1 className="text-3xl sm:text-5xl font-bold tracking-tight mb-4 text-balance">
              {post.title}
            </h1>
            <p className="text-base sm:text-xl text-muted-foreground mb-6">{post.description}</p>
            <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground pb-6 border-b border-border mb-8">
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                {new Date(post.date).toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" })}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                {post.readingMinutes} min de lectura
              </span>
              <span>Por {post.author}</span>
            </div>

            <div
              className="prose prose-slate max-w-none prose-headings:font-bold prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4 prose-h3:text-xl prose-p:text-base prose-p:leading-relaxed prose-li:text-base prose-a:text-primary prose-strong:text-foreground"
              dangerouslySetInnerHTML={{ __html: post.body }}
            />
          </article>

          {/* CTA */}
          <section className="mt-12 text-center bg-primary/5 border border-primary/20 rounded-3xl p-8">
            <h2 className="text-2xl font-bold mb-2">Prueba Glowapp gratis 1 mes</h2>
            <p className="text-muted-foreground mb-5 text-sm">Todo lo que tu salón necesita en una sola app. Sin permanencia.</p>
            <Link to="/onboarding">
              <Button size="lg">
                Empezar ahora <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </section>

          {/* Related */}
          {related.length > 0 && (
            <section className="mt-12">
              <h2 className="text-xl font-bold mb-4">Sigue leyendo</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {related.map((p) => (
                  <Link
                    key={p.slug}
                    to={`/blog/${p.slug}`}
                    className="block p-4 rounded-2xl bg-card border border-border hover:border-primary/40 transition-colors"
                  >
                    <h3 className="font-semibold mb-1 text-sm sm:text-base">{p.title}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-2">{p.description}</p>
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
