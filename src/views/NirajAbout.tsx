"use client";
import AdvisorHeader from "@/components/AdvisorHeader";
import Footer from "@/components/Footer";
import { Link } from "@/components/Link";

const NIRAJ_BRAND = "#E0F7F9";

const NirajAbout = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <AdvisorHeader name="Niraj Dugar" photoSrc="/niraj-dugar.jpg" />

      <main className="flex-1">
        <section className="py-16 md:py-24 bg-background">
          <div className="container max-w-4xl mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              {/* Photo */}
              <div className="flex justify-center">
                <div className="relative w-full max-w-sm">
                  <div
                    className="absolute inset-0 rounded-2xl"
                    style={{ backgroundColor: NIRAJ_BRAND, opacity: 0.1 }}
                  />
                  <img
                    src="/niraj-dugar.jpg"
                    alt="Niraj Dugar"
                    className="w-full rounded-2xl shadow-xl object-cover relative"
                  />
                </div>
              </div>

              {/* Bio */}
              <div>
                <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
                  Niraj Dugar
                </h1>
                <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                  Niraj is a thoughtful entrepreneur and financial advisor
                  exploring ideas that shape how we think, live, and build. With
                  a deep passion for personal finance, credit strategy, and
                  lifestyle optimisation, he creates insights that challenge
                  conventional wisdom and inspire smarter financial decisions.
                </p>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      Areas of Expertise
                    </h3>
                    <p className="text-muted-foreground">
                      Credit Card Strategy · Rewards Optimisation · Travel
                      Hacking · Personal Finance · Lifestyle Benefits ·
                      Decision-Making Frameworks
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      The Mission
                    </h3>
                    <p className="text-muted-foreground">
                      To help Indians find the credit card that truly works for
                      their lifestyle — not just the most marketed one. Every
                      recommendation is backed by data and genuine user
                      benefits.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      Explore the Tools
                    </h3>
                    <p className="text-muted-foreground">
                      From AI-powered Card Genius to Beat My Card comparisons —
                      each tool is designed to put the right card in your wallet
                      faster.
                    </p>
                  </div>
                </div>

                <div className="mt-8 flex gap-4 flex-wrap">
                  <Link
                    to="/niraj-dugar"
                    className="inline-flex items-center px-6 py-3 rounded-lg font-semibold text-[#064D59] transition-all hover:opacity-90"
                    style={{ backgroundColor: NIRAJ_BRAND }}
                  >
                    Find Your Card
                  </Link>
                  <Link
                    to="/card-genius"
                    className="inline-flex items-center px-6 py-3 rounded-lg font-semibold border-2 transition-all hover:bg-[#E0F7F9]/5"
                    style={{ borderColor: '#0B7A8A', color: '#0B7A8A' }}
                  >
                    Try Card Genius
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default NirajAbout;
