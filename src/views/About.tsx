"use client";
import { useEffect, useRef } from "react";
import { Link } from "@/components/Link";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Sparkles, Mail, BadgeCheck, Briefcase, TrendingUp } from "lucide-react";
import {
  trackAboutPageView,
  trackAboutSubscribeSectionViewed,
  trackAboutSubscribeClickedAbout,
} from "@/services/journeyTrack";

const XIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-[#0B7A8A]" aria-hidden="true">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.261 5.632 5.903-5.632Zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-[#0B7A8A]" aria-hidden="true">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
  </svg>
);

const YoutubeIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-[#0B7A8A]" aria-hidden="true">
    <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
  </svg>
);

const SOCIAL_LINKS = [
  { label: "X (Twitter)", href: "https://x.com/contliving", icon: XIcon, handle: "@contliving" },
  { label: "Instagram", href: "https://www.instagram.com/nirdugar/", icon: InstagramIcon, handle: "@nirdugar" },
  { label: "YouTube", href: "https://www.youtube.com/@dugarniraj", icon: YoutubeIcon, handle: "@dugarniraj" },
];

const About = () => {
  const ctaRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    trackAboutPageView();
  }, []);

  // Fire when the subscribe/CTA section scrolls into view
  useEffect(() => {
    if (!ctaRef.current || typeof IntersectionObserver === "undefined") return;
    let fired = false;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !fired) {
          fired = true;
          trackAboutSubscribeSectionViewed();
          observer.disconnect();
        }
      });
    }, { threshold: 0.3 });
    observer.observe(ctaRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Hero */}
      <section className="pt-32 pb-16 bg-gradient-to-br from-[#f0f9ff] via-background to-accent/10">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            {/* Photo */}
            <div className="flex justify-center md:justify-end order-1 md:order-2">
              <div className="relative w-56 h-56 sm:w-72 sm:h-72">
                <div className="absolute inset-0 rounded-3xl bg-[#E0F7F9] opacity-40 rotate-3" />
                <img
                  src="/niraj-dugar.jpg"
                  alt="Niraj Dugar"
                  className="relative w-full h-full rounded-3xl object-cover shadow-2xl"
                />
              </div>
            </div>

            {/* Text */}
            <div className="order-2 md:order-1">
              <div className="inline-flex items-center gap-2 bg-[#E0F7F9] text-[#064D59] px-4 py-1.5 rounded-full text-sm font-semibold mb-4">
                About Niraj
              </div>
              <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-2 leading-tight">
                Niraj Dugar
              </h1>
              <p className="text-[#0B7A8A] font-semibold text-lg mb-5">
                Co-founder & CEO, Holistic Wealth · Chartered Accountant
              </p>
              <p className="text-muted-foreground text-base sm:text-lg leading-relaxed mb-6">
                Niraj is the co-founder and CEO at Holistic Wealth. A qualified Chartered Accountant with an all India rank, he has worked in the financial services industry for more than 10 years and has helped many clients transform their financial lives. In the past, Niraj has also worked with one of the Big 4 accounting firms managing their audit and assurance services.
              </p>
              <a
                href="mailto:niraj@holisticwealth.in"
                className="inline-flex items-center gap-2 bg-[#0B7A8A] text-white px-6 py-3 rounded-full font-semibold text-sm hover:bg-[#085F6D] transition-colors"
              >
                <Mail className="w-4 h-4" />
                niraj@holisticwealth.in
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Credentials */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-card border border-border rounded-2xl p-6 flex flex-col items-center text-center shadow-sm">
              <div className="w-12 h-12 bg-[#E0F7F9] rounded-xl flex items-center justify-center mb-3">
                <BadgeCheck className="w-6 h-6 text-[#0B7A8A]" />
              </div>
              <h3 className="font-bold text-foreground mb-1">Chartered Accountant</h3>
              <p className="text-sm text-muted-foreground">All India Rank holder with deep expertise in financial planning and tax strategy.</p>
            </div>

            <div className="bg-card border border-border rounded-2xl p-6 flex flex-col items-center text-center shadow-sm">
              <div className="w-12 h-12 bg-[#E0F7F9] rounded-xl flex items-center justify-center mb-3">
                <TrendingUp className="w-6 h-6 text-[#0B7A8A]" />
              </div>
              <h3 className="font-bold text-foreground mb-1">10+ Years Experience</h3>
              <p className="text-sm text-muted-foreground">Over a decade in financial services, helping clients transform their financial lives.</p>
            </div>

            <div className="bg-card border border-border rounded-2xl p-6 flex flex-col items-center text-center shadow-sm">
              <div className="w-12 h-12 bg-[#E0F7F9] rounded-xl flex items-center justify-center mb-3">
                <Briefcase className="w-6 h-6 text-[#0B7A8A]" />
              </div>
              <h3 className="font-bold text-foreground mb-1">Big 4 Background</h3>
              <p className="text-sm text-muted-foreground">Former Big 4 accounting firm professional — audit and assurance services.</p>
            </div>
          </div>
        </div>
      </section>


      {/* Connect */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-2 text-foreground">Connect with Niraj</h2>
            <p className="text-muted-foreground mb-10">Follow for personal finance insights, credit card strategies, and more.</p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-10">
              {SOCIAL_LINKS.map(({ label, href, icon: Icon, handle }) => (
                <a
                  key={href}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => { if (label === "YouTube") trackAboutSubscribeClickedAbout(href); }}
                  className="flex items-center gap-3 px-5 py-3 rounded-2xl border-2 border-border hover:border-[#0B7A8A] hover:bg-[#E0F7F9]/30 transition-all group"
                >
                  <Icon />
                  <div className="text-left">
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className="text-sm font-semibold text-foreground group-hover:text-[#0B7A8A] transition-colors">{handle}</p>
                  </div>
                </a>
              ))}
            </div>

            <div className="bg-[#f0f9ff] border border-[#0B7A8A]/20 rounded-2xl px-8 py-6">
              <p className="text-sm text-muted-foreground mb-1">Email</p>
              <a
                href="mailto:niraj@holisticwealth.in"
                className="text-xl font-semibold text-[#0B7A8A] hover:underline"
              >
                niraj@holisticwealth.in
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section ref={ctaRef} className="py-16 bg-gradient-to-br from-[#f0f9ff] via-background to-accent/10">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4 text-foreground">Find Your Perfect Card</h2>
            <p className="text-muted-foreground text-lg mb-8">
              Use the tools Niraj built to match the right card to your lifestyle — backed by real financial expertise.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/card-genius"
                className="inline-flex items-center gap-2 bg-[#0B7A8A] text-white px-8 py-4 rounded-full text-base font-semibold hover:bg-[#085F6D] transition-all"
              >
                Try Card Genius
                <Sparkles className="w-4 h-4" />
              </Link>
              <Link
                to="/cards"
                className="inline-flex items-center gap-2 border-2 border-[#0B7A8A] text-[#0B7A8A] px-8 py-4 rounded-full text-base font-semibold hover:bg-[#E0F7F9] transition-all"
              >
                Browse All Cards
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default About;
