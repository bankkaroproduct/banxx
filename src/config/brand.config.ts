/**
 * Brand configuration for the Banxx deployment (partner entity: Credit Links).
 *
 * This repo serves Banxx only, so brand values are Banxx defaults rather than a
 * parameterised partner build. The env vars remain as deployment overrides.
 *
 * Colour is NOT configured here. It lives in src/app/globals.css as design
 * tokens. The previous hue/saturation/lightness model could only express a
 * single accent and had no slot for Banxx's dark surfaces, indigo text variant
 * or border token, and the runtime :root injection it relied on would have
 * silently overridden the dark-mode token block.
 */

export interface BrandConfig {
  name: string;
  tagline: string;
  /**
   * Wordmark asset path, the single swap point for the logo.
   *
   * Empty string falls back to a text wordmark. Set this (or
   * NEXT_PUBLIC_BRAND_LOGO) and nothing else needs to change.
   */
  logo: string;
  /** Dark-mode wordmark. Falls back to the text wordmark when empty. */
  logoDark: string;
  favicon: string;
  email: string;
  analyticsId: string;
}

export const brandConfig: BrandConfig = {
  name: process.env.NEXT_PUBLIC_BRAND_NAME || 'Banxx',
  tagline: process.env.NEXT_PUBLIC_BRAND_TAGLINE || 'Find the credit card you actually qualify for',
  // Derived from the brand asset in the Banxx brand pack: the wordmark trimmed
  // to its glyphs, plus a dark-mode variant with the lettering in white and the
  // orange/blue X marks untouched. See public/banxx-wordmark.png.
  logo: process.env.NEXT_PUBLIC_BRAND_LOGO || '/banxx-wordmark.png',
  logoDark: process.env.NEXT_PUBLIC_BRAND_LOGO_DARK || '/banxx-wordmark-dark.png',
  // Was /favicon.svg, which is byte-identical to placeholder.svg — a grey
  // placeholder graphic. The only real favicon in the repo was Tide's logo,
  // inherited from the template this shell was forked from.
  favicon: process.env.NEXT_PUBLIC_BRAND_FAVICON || '/banxx-favicon.png',
  email: process.env.NEXT_PUBLIC_BRAND_EMAIL || 'support@banxx.com',
  analyticsId: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || '',
};

/**
 * Brand book constraints for the wordmark.
 * Minimum reproduction width 124px, 50px clear space on all sides.
 */
export const WORDMARK_MIN_WIDTH_PX = 124;
export const WORDMARK_CLEAR_SPACE_PX = 50;
