import type { Metadata } from "next";
import Navigation from "@/components/Navigation";
import BlogsGrid from "@/components/BlogsGrid";
import { fetchSubstackPosts } from "@/lib/substack";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Blog — Credit Card Tips, Travel Rewards & Financial Guides | BankKaro",
  description:
    "Expert articles on maximising credit card rewards, travel hacking, building credit, and making smarter financial decisions. Real strategies, real savings.",
  robots: 'noindex, follow',
  alternates: { canonical: 'https://great.cards/blogs' },
  openGraph: {
    title: "Blog — BankKaro",
    description: "Expert credit card tips, travel reward strategies, and financial guides.",
    type: "website",
  },
};

export default async function BlogsPage() {
  const posts = await fetchSubstackPosts();

  return (
    <main className="min-h-screen bg-background">
      <Navigation />

      {/* Hero header */}
      <div className="pt-24 pb-10 px-4 bg-gradient-to-br from-[#f0f9ff] via-background to-background border-b border-border/40">
        <div className="max-w-7xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-[#E0F7F9] text-black px-4 py-1.5 rounded-full text-sm font-semibold mb-4">
            Niraj&apos;s Insights
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-3 leading-tight">
            Real Stories. Real Strategies.
          </h1>
          <p className="text-muted-foreground text-base sm:text-lg max-w-2xl">
            Personal finance insights from Niraj Dugar — credit cards, travel rewards, and smarter money decisions.
          </p>
          <a
            href="https://nirajdugar.substack.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 mt-4 text-sm text-[#0B7A8A] font-semibold hover:underline"
          >
            Follow on Substack →
          </a>
        </div>
      </div>

      <BlogsGrid posts={posts} />
    </main>
  );
}
