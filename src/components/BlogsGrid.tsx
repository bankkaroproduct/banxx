"use client";

import { useState } from "react";
import { Calendar, Clock, ArrowRight, ExternalLink, Search } from "lucide-react";
import type { SubstackPost } from "@/lib/substack";

interface Props {
  posts: SubstackPost[];
}

const BlogsGrid = ({ posts }: Props) => {
  const allCategories = ["All", ...Array.from(new Set(posts.map((p) => p.category)))];
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = posts.filter((post) => {
    const matchesCategory = selectedCategory === "All" || post.category === selectedCategory;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      post.title.toLowerCase().includes(q) ||
      post.excerpt.toLowerCase().includes(q) ||
      post.tags.some((t) => t.toLowerCase().includes(q));
    return matchesCategory && matchesSearch;
  });

  const [featured, ...rest] = filtered;

  const openPost = (url: string) => {
    if (url) window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
      {/* Search and filter bar */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search articles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          {allCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                selectedCategory === cat
                  ? "bg-[#0B7A8A] text-white"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {posts.length === 0 && (
        <div className="text-center py-20 text-muted-foreground">
          <p className="text-lg font-medium">Loading articles…</p>
          <p className="text-sm mt-1">Fetching Niraj&apos;s latest posts from Substack</p>
        </div>
      )}

      {posts.length > 0 && filtered.length === 0 && (
        <div className="text-center py-20 text-muted-foreground">
          <p className="text-lg font-medium">No articles found</p>
          <p className="text-sm mt-1">Try a different search term or category</p>
        </div>
      )}

      {/* Featured article */}
      {featured && (
        <div
          onClick={() => openPost(featured.url)}
          className="group mb-10 cursor-pointer grid grid-cols-1 lg:grid-cols-2 gap-0 bg-card rounded-2xl overflow-hidden border border-border/50 shadow-lg hover:shadow-2xl hover:border-[#0B7A8A]/30 transition-all duration-300"
        >
          <div className="relative h-56 sm:h-72 lg:h-full min-h-[220px] overflow-hidden">
            <img
              src={featured.image}
              alt={featured.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=800&h=600&fit=crop'; }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 lg:bg-gradient-to-r lg:from-transparent lg:to-transparent" />
            <span className="absolute top-4 left-4 bg-[#E0F7F9] text-black px-3 py-1 rounded-full text-xs font-bold shadow">
              {featured.category}
            </span>
          </div>

          <div className="p-6 sm:p-8 flex flex-col justify-center">
            <div className="inline-flex items-center gap-1.5 text-xs text-[#0B7A8A] font-semibold uppercase tracking-wide mb-3">
              Featured Article
            </div>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground mb-3 group-hover:text-[#0B7A8A] transition-colors leading-tight">
              {featured.title}
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base leading-relaxed mb-4 line-clamp-3">
              {featured.excerpt}
            </p>

            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-5">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                <span>{featured.pubDate}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                <span>{featured.readTime}</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-5">
              {featured.tags.map((tag) => (
                <span key={tag} className="bg-muted text-muted-foreground px-3 py-1 rounded-full text-xs font-medium">
                  #{tag}
                </span>
              ))}
            </div>

            <div className="flex items-center gap-2 text-[#0B7A8A] font-semibold text-sm group-hover:gap-3 transition-all">
              Read on Substack
              <ExternalLink className="w-4 h-4" />
            </div>
          </div>
        </div>
      )}

      {/* Article grid */}
      {rest.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {rest.map((post) => (
            <div
              key={post.id}
              onClick={() => openPost(post.url)}
              className="group bg-card rounded-2xl overflow-hidden border border-border/50 shadow hover:shadow-xl hover:border-[#0B7A8A]/30 hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col"
            >
              <div className="relative h-48 overflow-hidden flex-shrink-0">
                <img
                  src={post.image}
                  alt={post.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=800&h=600&fit=crop'; }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                <span className="absolute top-3 left-3 bg-[#E0F7F9] text-black px-2.5 py-1 rounded-full text-xs font-bold shadow">
                  {post.category}
                </span>
              </div>

              <div className="p-5 flex flex-col flex-1">
                <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{post.pubDate}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{post.readTime}</span>
                  </div>
                </div>

                <h3 className="font-bold text-foreground group-hover:text-[#0B7A8A] transition-colors mb-2 leading-snug line-clamp-2 flex-1">
                  {post.title}
                </h3>

                <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed mb-4">
                  {post.excerpt}
                </p>

                <div className="flex items-center justify-between pt-3 border-t border-border/50 mt-auto">
                  <span className="text-xs font-semibold text-foreground">{post.author}</span>
                  <div className="flex items-center gap-1 text-[#0B7A8A] text-xs font-semibold group-hover:gap-1.5 transition-all">
                    Read
                    <ArrowRight className="w-3 h-3" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BlogsGrid;
