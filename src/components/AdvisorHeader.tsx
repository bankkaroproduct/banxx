"use client";
import { useState } from "react";
import { Menu, X, ChevronDown } from "lucide-react";
import { Link } from "@/components/Link";

const NIRAJ_BRAND = "#0B7A8A";

interface AdvisorHeaderProps {
  name: string;
  photoSrc: string;
}

const AdvisorHeader = ({ name, photoSrc }: AdvisorHeaderProps) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <img
            src={photoSrc}
            alt={name}
            className="h-9 w-9 rounded-full object-cover border-2"
            style={{ borderColor: NIRAJ_BRAND }}
          />
          <span className="text-xl font-bold" style={{ color: NIRAJ_BRAND }}>
            {name}
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          <Link
            to="/"
            className="text-[15px] font-medium text-foreground hover:text-[#0B7A8A] transition-colors"
          >
            Home
          </Link>
          <Link
            to="/cards"
            className="text-[15px] font-medium text-foreground hover:text-[#0B7A8A] transition-colors"
          >
            Discover
          </Link>

          <div className="relative group">
            <button className="text-[15px] font-medium text-foreground hover:text-[#0B7A8A] transition-colors flex items-center gap-1">
              Tools <ChevronDown className="h-4 w-4" />
            </button>
            <div className="absolute left-0 mt-0 w-56 bg-background border border-border rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
              <Link
                to="/card-genius"
                className="block px-4 py-3 text-sm font-medium text-foreground hover:bg-secondary first:rounded-t-lg"
              >
                Super Card Genius
              </Link>
              <Link
                to="/card-genius-category"
                className="block px-4 py-3 text-sm font-medium text-foreground hover:bg-secondary"
              >
                Category Card Genius
              </Link>
              <Link
                to="/beat-my-card"
                className="block px-4 py-3 text-sm font-medium text-foreground hover:bg-secondary last:rounded-b-lg"
              >
                Beat My Card
              </Link>
            </div>
          </div>

          <Link
            to="/blogs"
            className="text-[15px] font-medium text-foreground hover:text-[#0B7A8A] transition-colors"
          >
            Blogs
          </Link>
        </nav>

        {/* Mobile Toggle */}
        <button
          className="md:hidden text-foreground"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Nav */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-background px-4 pb-4 pt-2 space-y-3">
          <Link
            to="/"
            className="block text-sm font-medium py-2"
            onClick={() => setMobileOpen(false)}
          >
            Home
          </Link>
          <Link
            to="/cards"
            className="block text-sm font-medium py-2"
            onClick={() => setMobileOpen(false)}
          >
            Discover
          </Link>
          <button
            className="w-full text-left text-sm font-medium py-2 flex items-center justify-between"
            onClick={() => setToolsOpen(!toolsOpen)}
          >
            Tools{" "}
            <ChevronDown
              className={`h-4 w-4 transition-transform ${toolsOpen ? "rotate-180" : ""}`}
            />
          </button>
          {toolsOpen && (
            <div className="pl-4 space-y-2">
              <Link
                to="/card-genius"
                className="block text-sm py-2"
                onClick={() => {
                  setMobileOpen(false);
                  setToolsOpen(false);
                }}
              >
                Super Card Genius
              </Link>
              <Link
                to="/card-genius-category"
                className="block text-sm py-2"
                onClick={() => {
                  setMobileOpen(false);
                  setToolsOpen(false);
                }}
              >
                Category Card Genius
              </Link>
              <Link
                to="/beat-my-card"
                className="block text-sm py-2"
                onClick={() => {
                  setMobileOpen(false);
                  setToolsOpen(false);
                }}
              >
                Beat My Card
              </Link>
            </div>
          )}
          <Link
            to="/blogs"
            className="block text-sm font-medium py-2"
            onClick={() => setMobileOpen(false)}
          >
            Blogs
          </Link>
        </div>
      )}
    </header>
  );
};

export default AdvisorHeader;
