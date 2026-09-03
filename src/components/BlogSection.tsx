"use client";

import { useEffect, useRef, useState } from "react";
import { TrendingUp, Calendar, Clock, ExternalLink } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { SubstackPost } from "@/lib/substack";

gsap.registerPlugin(ScrollTrigger);

const BlogSection = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement[]>([]);
  const [posts, setPosts] = useState<SubstackPost[]>([]);

  useEffect(() => {
    fetch('/api/substack')
      .then((r) => r.json())
      .then((data: SubstackPost[]) => setPosts(data.slice(0, 6)))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (cardsRef.current.length === 0) return;

    gsap.fromTo(
      cardsRef.current,
      { opacity: 0, y: 60, scale: 0.95 },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.8,
        stagger: 0.2,
        ease: "power3.out",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 70%",
          end: "top 40%",
          scrub: 1,
        },
      }
    );
  }, [posts]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.location.hash !== "#blog") return;

    const section = sectionRef.current;
    if (!section) return;

    const rect = section.getBoundingClientRect();
    const currentScroll = window.scrollY || window.pageYOffset || 0;
    const navOffset = 80;
    const targetY = Math.max(rect.top + currentScroll - navOffset, 0);

    window.scrollTo({ top: targetY, behavior: "smooth" });
  }, []);

  const openPost = (url: string) => {
    if (url) window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <section id="blog" ref={sectionRef} className="py-[var(--section-space-lg)] bg-gradient-to-br from-muted/30 via-background to-accent/10 scroll-mt-20">
      <div className="section-shell">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 bg-[#E0F7F9] text-black px-4 py-2 rounded-full mb-4">
            <TrendingUp className="w-4 h-4" />
            <span className="text-sm font-semibold">Niraj&apos;s Insights</span>
          </div>
          <h2 className="fluid-h2 mb-3 text-[#0B7A8A]">
            Real Stories, Real Strategies
          </h2>
          <p className="fluid-body text-muted-foreground max-w-4xl mx-auto">
            Personal finance insights from Niraj Dugar — credit cards, travel rewards, and smarter money decisions.
          </p>
        </div>

        {posts.length === 0 && (
          <div className="text-center py-12 text-muted-foreground text-sm">
            Loading insights…
          </div>
        )}

        {/* Blog Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mb-8 sm:mb-12">
          {posts.map((post, index) => (
            <div
              key={post.id}
              ref={(el) => { if (el) cardsRef.current[index] = el; }}
              onClick={() => openPost(post.url)}
              className="group bg-card rounded-xl sm:rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 border border-border/50 hover:border-[#0B7A8A]/30 hover:-translate-y-1 sm:hover:-translate-y-2 cursor-pointer touch-target"
            >
              {/* Image */}
              <div className="relative h-44 sm:h-52 md:h-56 overflow-hidden">
                <img
                  src={post.image}
                  alt={post.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=800&h=600&fit=crop'; }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute top-4 left-4">
                  <span className="bg-[#E0F7F9] text-black px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                    {post.category}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="p-4 sm:p-6">
                <div className="hidden sm:flex items-center gap-4 text-sm text-muted-foreground mb-4 flex-wrap">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>{post.pubDate}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{post.readTime}</span>
                  </div>
                </div>

                <h3 className="text-base sm:text-lg md:text-xl font-bold mb-2 sm:mb-3 text-foreground group-hover:text-[#0B7A8A] transition-colors line-clamp-2">
                  {post.title}
                </h3>

                <p className="hidden sm:block text-sm md:text-base text-muted-foreground mb-4 line-clamp-3 leading-relaxed">
                  {post.excerpt}
                </p>

                <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-3 sm:mb-4">
                  {post.tags.slice(0, 2).map((tag) => (
                    <span
                      key={tag}
                      className="text-[10px] sm:text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-3 sm:pt-4 border-t border-border/50">
                  <div className="hidden sm:block">
                    <p className="text-sm font-semibold text-foreground">{post.author}</p>
                    <p className="text-xs text-muted-foreground">Author</p>
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2 text-[#0B7A8A] text-sm sm:text-base font-medium group-hover:translate-x-1 transition-all sm:ml-auto">
                    Read on Substack
                    <ExternalLink className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {posts.length > 0 && (
          <div className="text-center">
            <a
              href="https://nirajdugar.substack.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#0B7A8A] text-white font-semibold text-sm hover:bg-[#0B7A8A]/90 transition-colors"
            >
              View All Posts on Substack
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        )}
      </div>
    </section>
  );
};

export default BlogSection;
