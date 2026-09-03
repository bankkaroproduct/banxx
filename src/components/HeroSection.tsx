"use client";

import { useEffect, useRef } from "react";
import { brandConfig } from "@/config/brand.config";
import { analytics } from "@/services/analytics";
import { Link } from "@/components/Link";
import { Button } from "./ui/button";
import { CreditCard3D } from "./CreditCard3D";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Sparkles, CreditCard } from "lucide-react";
import { useRouter } from "next/navigation";

gsap.registerPlugin(useGSAP, ScrollTrigger);

const HeroSection = () => {
  const router = useRouter();
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const subheadlineRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const floatingElementsRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const timeline = gsap.timeline({
      defaults: {
        ease: "power3.out",
        force3D: true
      }
    });

    timeline.from(headlineRef.current, {
      y: 60,
      opacity: 0,
      duration: 1
    }).from(subheadlineRef.current, {
      y: 40,
      opacity: 0,
      duration: 0.8
    }, "-=0.6");

    // Parallax effect for floating background elements
    if (floatingElementsRef.current) {
      const floatingCircles = floatingElementsRef.current.querySelectorAll('.floating-circle');

      floatingCircles.forEach((circle, index) => {
        gsap.to(circle, {
          y: -100 - (index * 30),
          scrollTrigger: {
            trigger: floatingElementsRef.current,
            start: "top top",
            end: "bottom top",
            scrub: 1.5,
            invalidateOnRefresh: true
          }
        });
      });
    }

    return () => {
      timeline.kill();
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    };
  }, []);

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-white to-[#E0F7F9] pt-28 sm:pt-32 pb-12 sm:pb-16 lg:pb-20 min-h-[85vh] sm:min-h-screen flex items-center">
      {/* Animated Background Elements with Parallax */}
      <div ref={floatingElementsRef} className="absolute inset-0 overflow-hidden pointer-events-none opacity-40 sm:opacity-100">
        {[...Array(5)].map((_, i) => (
          <div key={i} className={`floating-circle absolute rounded-full bg-[#f0f9ff] animate-float ${i > 2 ? 'hidden sm:block' : ''}`} style={{
            width: `${Math.random() * 300 + 100}px`,
            height: `${Math.random() * 300 + 100}px`,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${i * 0.5}s`,
            animationDuration: `${Math.random() * 10 + 15}s`
          }} />
        ))}
      </div>

      <div className="section-shell relative z-10 w-full">
        <div className="flex flex-col-reverse lg:grid lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-20 items-center">
          {/* Left Content */}
          <div className="text-center lg:text-left space-y-4 sm:space-y-6 max-w-2xl w-full">
            <h1 ref={headlineRef} className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-extrabold text-charcoal-900 leading-[1.1] tracking-tight">
              {brandConfig.tagline && brandConfig.tagline !== 'Find Your Perfect Credit Card' ? (
                brandConfig.tagline
              ) : (
                <>
                  Stop Leaving{" "}
                  <span className="text-primary">
                    Money
                  </span>{" "}
                  on the Table
                </>
              )}
            </h1>

            <p ref={subheadlineRef} className="text-base sm:text-lg md:text-xl lg:text-2xl text-charcoal-700 max-w-xl mx-auto lg:mx-0 leading-relaxed">
              Find the credit card that pays you back for living your life. Get personalized recommendations in 60 seconds.
            </p>

            {/* CTA Buttons */}
            <div ref={ctaRef} className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start opacity-100 pt-2">
              <Button
                size="lg"
                onClick={() => {
                  analytics.trackEvent({ category: 'Navigation', action: 'Hero Click', label: 'Discover Cards' });
                  router.push("/cards");
                  setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
                }}
                className="w-full sm:w-auto group shadow-xl text-base sm:text-lg px-6 sm:px-8 py-6 sm:py-7 touch-target"
              >
                <CreditCard className="mr-2 w-5 h-5" />
                <span className="hidden xs:inline">Discover Credit Cards</span>
                <span className="xs:hidden">Discover Cards</span>
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => {
                  analytics.trackGeniusStart('Hero Section');
                  router.push("/card-genius");
                  setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
                }}
                className="w-full sm:w-auto shadow-lg text-base sm:text-lg px-6 sm:px-8 py-6 sm:py-7 border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground touch-target"
              >
                <Sparkles className="mr-2 w-5 h-5" />
                <span className="hidden xs:inline">Try AI Card Recommendation</span>
                <span className="xs:hidden">AI Recommendation</span>
              </Button>
            </div>
          </div>

          {/* Right Content - 3D Card */}
          <div className="hidden lg:flex justify-center items-center lg:justify-end w-full pointer-events-auto">
            <CreditCard3D
              cardImage="https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=800&auto=format&fit=crop"
              cardName="Your Dream Card"
              className="w-full max-w-lg"
            />
          </div>
        </div>
      </div>

      {/* Bottom Gradient Fade */}
      <div className="absolute bottom-0 left-0 right-0 h-20 sm:h-32 bg-gradient-to-t from-white to-transparent pointer-events-none" />
    </section>
  );
};

export default HeroSection;