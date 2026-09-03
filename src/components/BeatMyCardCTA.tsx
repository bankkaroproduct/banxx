"use client";

import { Link } from "@/components/Link";
import { Button } from "./ui/button";
import { Swords, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";

const BeatMyCardCTA = () => {
  const router = useRouter();

  return (
    <section className="py-8 bg-background">
      <div className="container mx-auto px-4">
        <div
          onClick={() => router.push('/beat-my-card')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter') router.push('/beat-my-card'); }}
          className="max-w-5xl mx-auto bg-gradient-to-br from-[#E0F7F9]/20 to-background dark:from-[#0B7A8A]/20 dark:to-background rounded-3xl p-10 md:p-14 border-[1.5px] border-[#E0F7F9] dark:border-[#0B7A8A]/50 relative overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl group"
          aria-label="Navigate to Beat My Card"
        >
          {/* Decorative gradient blob */}
          <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-br from-[#E0F7F9]/30 to-[#E0F7F9]/20 dark:from-[#0B7A8A]/20 dark:to-[#0B7A8A]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform duration-500" />

          <div className="relative z-10 text-center">
            {/* Icon with gradient background and glow */}
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-[#E0F7F9] to-[#E0F7F9]/50 dark:from-[#0B7A8A]/50 dark:to-[#0B7A8A]/30 mb-6 shadow-lg ring-1 ring-[#E0F7F9]/50 dark:ring-[#0B7A8A]/50 group-hover:scale-110 group-hover:-rotate-6 transition-all duration-300">
              <Swords className="w-10 h-10 text-[#0B7A8A] dark:text-[#E0F7F9] group-hover:animate-pulse" />
            </div>

            {/* Heading */}
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-[#0B7A8A] dark:text-[#E0F7F9]">
              Beat My Card
            </h2>

            {/* Subheading */}
            <p className="text-lg md:text-xl text-foreground/80 mb-8 max-w-2xl mx-auto">
              Test our AI Card Genius v/s Your Card. See the magic!
            </p>

            {/* CTA Button */}
            <Button
              size="lg"
              onClick={(e) => { e.stopPropagation(); router.push('/beat-my-card'); }}
              className="bg-[#0B7A8A] hover:bg-[#085F6D] text-white shadow-lg hover:shadow-xl transition-all duration-300 px-8 py-6 text-base group/btn"
            >
              Challenge AI Card Genius
              <ArrowRight className="ml-2 w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
            </Button>

            {/* Trust indicator */}
            <p className="mt-6 text-sm text-muted-foreground font-medium">
              Find out if there's a better card for your spending
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BeatMyCardCTA;
