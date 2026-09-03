"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Calendar, Clock, Share2, ArrowUp, CheckCircle2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { blogs } from "@/data/blogs";
import { toast } from "sonner";

interface Props {
  slug: string;
}

const BlogsPost = ({ slug }: Props) => {
  const router = useRouter();
  const [showStickyBar, setShowStickyBar] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const blog = blogs.find((b) => b.slug === slug);
  const related = blogs.filter((b) => b.slug !== slug).slice(0, 3);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [slug]);

  useEffect(() => {
    const handleScroll = () => {
      const y = window.scrollY;
      setShowStickyBar(y > 300);
      setShowScrollTop(y > 800);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleShare = async () => {
    const shareUrl = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: blog?.title, text: blog?.excerpt, url: shareUrl });
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          navigator.clipboard.writeText(shareUrl);
          toast.success("Link copied to clipboard!");
        }
      }
    } else {
      navigator.clipboard.writeText(shareUrl);
      toast.success("Link copied to clipboard!");
    }
  };

  if (!blog) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4 text-foreground">Article not found</h1>
          <Button onClick={() => router.push("/blogs")} size="lg">
            Back to Blog
          </Button>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    const lines = blog.content.split("\n");
    const elements: React.ReactNode[] = [];
    let listItems: React.ReactNode[] = [];
    let listType: "bullet" | "number" | null = null;

    const flushList = () => {
      if (listItems.length === 0) return;
      if (listType === "bullet") {
        elements.push(
          <ul key={`list-${elements.length}`} className="space-y-3 my-8 pl-1">
            {listItems}
          </ul>
        );
      } else {
        elements.push(
          <ol key={`list-${elements.length}`} className="space-y-3 my-8 pl-1">
            {listItems}
          </ol>
        );
      }
      listItems = [];
      listType = null;
    };

    lines.forEach((line, index) => {
      const trimmed = line.trim();

      if (trimmed.startsWith("# ")) {
        flushList();
        elements.push(
          <h1 key={`h1-${index}`} className="text-2xl sm:text-3xl md:text-4xl font-bold mt-10 mb-6 text-foreground leading-tight">
            {trimmed.slice(2)}
          </h1>
        );
      } else if (trimmed.startsWith("## ")) {
        flushList();
        elements.push(
          <div key={`h2-${index}`} className="mt-12 mb-6">
            <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent mb-8" />
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground leading-tight">
              {trimmed.slice(3)}
            </h2>
          </div>
        );
      } else if (trimmed.startsWith("### ")) {
        flushList();
        elements.push(
          <h3 key={`h3-${index}`} className="text-lg sm:text-xl font-semibold mt-8 mb-4 text-foreground">
            {trimmed.slice(4)}
          </h3>
        );
      } else if (trimmed.startsWith("- ")) {
        if (listType !== "bullet") { flushList(); listType = "bullet"; }
        listItems.push(
          <li key={`li-${index}`} className="flex gap-3 items-start">
            <CheckCircle2 className="w-5 h-5 text-[#0B7A8A] flex-shrink-0 mt-0.5" />
            <span className="text-[15px] sm:text-base leading-[1.8] text-foreground/90">{trimmed.slice(2)}</span>
          </li>
        );
      } else if (/^\d+\./.test(trimmed)) {
        if (listType !== "number") { flushList(); listType = "number"; }
        const content = trimmed.replace(/^\d+\.\s*/, "");
        listItems.push(
          <li key={`num-${index}`} className="flex gap-3 items-start">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[#E0F7F9] flex items-center justify-center mt-0.5">
              <span className="text-xs font-bold text-black">{listItems.length + 1}</span>
            </div>
            <span className="text-[15px] sm:text-base leading-[1.8] text-foreground/90">{content}</span>
          </li>
        );
      } else if (trimmed.startsWith("|")) {
        // Simple markdown table — render as styled pre block
        flushList();
        if (trimmed.replace(/[\s|:-]/g, "").length > 0) {
          elements.push(
            <div key={`tr-${index}`} className="overflow-x-auto my-1">
              <p className="text-sm text-muted-foreground font-mono border-b border-border pb-1 whitespace-pre">{trimmed}</p>
            </div>
          );
        }
      } else if (trimmed.includes("**")) {
        flushList();
        const parts = trimmed.split("**");
        elements.push(
          <p key={`p-${index}`} className="mb-5 text-[15px] sm:text-base leading-[1.8] text-foreground/90">
            {parts.map((part, i) =>
              i % 2 === 0 ? part : <strong key={i} className="font-bold text-foreground">{part}</strong>
            )}
          </p>
        );
      } else if (trimmed) {
        flushList();
        elements.push(
          <p key={`p-${index}`} className="mb-5 text-[15px] sm:text-base leading-[1.8] text-foreground/90">
            {trimmed}
          </p>
        );
      } else if (!trimmed && listType === null) {
        elements.push(<div key={`sp-${index}`} className="h-2" />);
      }
    });

    flushList();
    return elements;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="relative h-[50vh] sm:h-[55vh] md:h-[420px] overflow-hidden">
        <img src={blog.image} alt={blog.title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/20" />

        <button
          onClick={() => router.push("/blogs")}
          className="absolute top-4 left-4 sm:top-6 sm:left-6 flex items-center gap-2 text-white hover:text-[#0B7A8A] bg-white/10 backdrop-blur-xl px-3 py-2 sm:px-4 sm:py-2.5 rounded-full border border-white/20 hover:bg-white/20 shadow-lg touch-target transition-all group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          <span className="text-sm font-semibold">All Articles</span>
        </button>

        <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-8">
          <div className="max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-[#E0F7F9] text-black px-3 py-1.5 rounded-full text-xs sm:text-sm font-bold mb-3 shadow-lg">
              {blog.category}
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-3 leading-tight">
              {blog.title}
            </h1>
            <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-white/90 text-xs sm:text-sm">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>{blog.date}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>{blog.readTime}</span>
              </div>
              <div className="font-medium">By {blog.author}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Article body */}
      <article className="max-w-3xl mx-auto px-5 sm:px-6 md:px-8 py-8 sm:py-10 md:py-12">
        <div className="flex justify-end mb-8">
          <button
            onClick={handleShare}
            className="inline-flex items-center gap-2 bg-card hover:bg-muted text-foreground px-4 py-2.5 rounded-full text-sm font-medium border border-border hover:border-[#0B7A8A]/30 transition-all shadow-sm"
          >
            <Share2 className="w-4 h-4" />
            Share
          </button>
        </div>

        <div className="blog-content">{renderContent()}</div>

        {/* Tags */}
        <div className="mt-12 pt-8 border-t border-border">
          <p className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wide">Topics</p>
          <div className="flex flex-wrap gap-2">
            {blog.tags.map((tag) => (
              <span key={tag} className="bg-muted/60 hover:bg-muted text-foreground px-4 py-2 rounded-full text-sm font-medium transition-colors">
                #{tag}
              </span>
            ))}
          </div>
        </div>

        {/* Author */}
        <div className="mt-10 p-5 sm:p-6 bg-gradient-to-br from-muted/50 to-muted/30 rounded-2xl border border-border/50">
          <p className="text-xs sm:text-sm font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Written by</p>
          <p className="text-lg sm:text-xl font-bold text-foreground mb-1">{blog.author}</p>
          <p className="text-sm text-muted-foreground">Financial Content Specialist</p>
        </div>

        {/* Back button */}
        <div className="mt-10 sm:mt-12">
          <Button
            size="lg"
            onClick={() => router.push("/blogs")}
            className="w-full sm:w-auto sm:min-w-[240px] shadow-lg py-6 sm:py-7 text-base sm:text-lg font-semibold rounded-2xl hover:shadow-xl transition-all group"
          >
            <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
            All Articles
          </Button>
        </div>
      </article>

      {/* More Articles */}
      {related.length > 0 && (
        <section className="bg-muted/30 border-t border-border/40 py-12 sm:py-16">
          <div className="max-w-5xl mx-auto px-5 sm:px-6 md:px-8">
            <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-8">More Articles</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {related.map((rel) => (
                <div
                  key={rel.id}
                  onClick={() => router.push(`/blogs/${rel.slug}`)}
                  className="group bg-card rounded-2xl overflow-hidden border border-border/50 shadow hover:shadow-lg hover:border-[#0B7A8A]/30 hover:-translate-y-0.5 transition-all cursor-pointer"
                >
                  <div className="relative h-40 overflow-hidden">
                    <img
                      src={rel.image}
                      alt={rel.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    <span className="absolute top-3 left-3 bg-[#E0F7F9] text-black px-2.5 py-0.5 rounded-full text-xs font-bold">
                      {rel.category}
                    </span>
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-sm text-foreground group-hover:text-[#0B7A8A] transition-colors leading-snug line-clamp-2 mb-3">
                      {rel.title}
                    </h3>
                    <div className="flex items-center gap-1 text-[#0B7A8A] text-xs font-semibold">
                      Read
                      <ArrowRight className="w-3 h-3" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Sticky bar */}
      {showStickyBar && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-center gap-2 bg-white/80 dark:bg-card/80 backdrop-blur-xl px-4 py-3 rounded-full border border-border/50 shadow-2xl">
            <button
              onClick={() => router.push("/blogs")}
              className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-muted transition-colors"
              aria-label="All articles"
            >
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </button>
            <div className="h-6 w-px bg-border" />
            <button
              onClick={handleShare}
              className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-muted transition-colors"
              aria-label="Share article"
            >
              <Share2 className="w-5 h-5 text-foreground" />
            </button>
            {showScrollTop && (
              <>
                <div className="h-6 w-px bg-border" />
                <button
                  onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                  className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-lg"
                  aria-label="Scroll to top"
                >
                  <ArrowUp className="w-5 h-5" />
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default BlogsPost;
