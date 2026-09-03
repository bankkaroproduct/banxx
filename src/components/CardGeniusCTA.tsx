"use client";

import { Link } from "@/components/Link";
import { Button } from "./ui/button";
import { Sparkles, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";

const CardGeniusCTA = () => {
  const router = useRouter();

  return (
    <section className="py-8 bg-background">
      <div className="container mx-auto px-4">
        <div
          onClick={() => router.push('/card-genius')}
          role="button"
          tabIndex={0}
          onKeyDown={e => {
            if (e.key === 'Enter') router.push('/card-genius');
          }}
          className="max-w-5xl mx-auto bg-gradient-to-br from-[#E0F7F9]/20 to-background dark:from-[#0B7A8A]/20 dark:to-background rounded-3xl p-10 md:p-14 border-[1.5px] border-[#E0F7F9] dark:border-[#0B7A8A]/50 relative overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl group"
          aria-label="Navigate to Card Genius"
        >
          {/* Decorative gradient blob */}
          <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-br from-[#E0F7F9]/30 to-[#E0F7F9]/10 dark:from-[#0B7A8A]/20 dark:to-[#0B7A8A]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform duration-500" />

          <div className="relative z-10 text-center">
            {/* Icon with gradient background and glow */}
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-[#E0F7F9] to-[#E0F7F9]/50 dark:from-[#0B7A8A]/50 dark:to-[#0B7A8A]/30 mb-6 shadow-lg ring-1 ring-[#E0F7F9]/50 dark:ring-[#0B7A8A]/50 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
              <Sparkles className="w-10 h-10 text-[#0B7A8A] dark:text-[#E0F7F9] group-hover:animate-pulse" />
            </div>

            {/* Heading */}
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-[#0B7A8A] dark:text-[#E0F7F9]">
              AI Super Card Genius
            </h2>

            {/* Subheading */}
            <p className="text-lg md:text-xl text-foreground/80 mb-8 max-w-2xl mx-auto">
              AI Powered tool to find the best card for <span className="text-[#0B7A8A] dark:text-[#E0F7F9] font-semibold">YOU!</span>
            </p>

            {/* CTA Button */}
            <Button
              size="lg"
              onClick={e => {
                e.stopPropagation();
                router.push('/card-genius');
              }}
              className="bg-[#0B7A8A] hover:bg-[#085F6D] text-white shadow-lg hover:shadow-xl transition-all duration-300 px-8 py-6 text-base group/btn"
            >
              Try AI Card Genius
              <ArrowRight className="ml-2 w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
            </Button>

            {/* Trust indicator */}
            <p className="mt-6 text-sm text-muted-foreground font-medium">
              Get personalized recommendations in under <strong className="text-foreground"> 60 seconds </strong>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CardGeniusCTA;
