/**
 * Brand Configuration
 * 
 * All brand-specific values are read from environment variables.
 * To customize for a partner, update the .env file or set vars in Vercel dashboard.
 */

export interface BrandConfig {
  name: string;
  tagline: string;
  logo: string;
  favicon: string;
  email: string;
  analyticsId: string;
  headerBgColor: string;
  colors: {
    primaryHue: string;
    primarySaturation: string;
    primaryLightness: string;
    secondaryHue: string;
    secondarySaturation: string;
    secondaryLightness: string;
  };
}

export const brandConfig: BrandConfig = {
  name: process.env.NEXT_PUBLIC_BRAND_NAME || 'Niraj Dugar',
  tagline: process.env.NEXT_PUBLIC_BRAND_TAGLINE || 'Find Your Perfect Credit Card',
  logo: process.env.NEXT_PUBLIC_BRAND_LOGO || '/niraj-dugar.jpg',
  favicon: process.env.NEXT_PUBLIC_BRAND_FAVICON || '/niraj-dugar.jpg',
  email: process.env.NEXT_PUBLIC_BRAND_EMAIL || 'niraj@holisticwealth.in',
  analyticsId: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || '',
  headerBgColor: process.env.NEXT_PUBLIC_HEADER_BG_COLOR || '#fff',
  colors: {
    primaryHue: process.env.NEXT_PUBLIC_PRIMARY_HUE || '145',
    primarySaturation: process.env.NEXT_PUBLIC_PRIMARY_SAT || '100%',
    primaryLightness: process.env.NEXT_PUBLIC_PRIMARY_LIGHT || '33%',
    secondaryHue: process.env.NEXT_PUBLIC_SECONDARY_HUE || '211',
    secondarySaturation: process.env.NEXT_PUBLIC_SECONDARY_SAT || '100%',
    secondaryLightness: process.env.NEXT_PUBLIC_SECONDARY_LIGHT || '40%',
  }
};

/**
 * Utility to convert Hex to HSL
 * Returns [h, s%, l%] or null if invalid
 */
const hexToHsl = (hex: string) => {
  let r = 0, g = 0, b = 0;
  if (hex.length === 4) {
    r = parseInt("0x" + hex[1] + hex[1]);
    g = parseInt("0x" + hex[2] + hex[2]);
    b = parseInt("0x" + hex[3] + hex[3]);
  } else if (hex.length === 7) {
    r = parseInt("0x" + hex[1] + hex[2]);
    g = parseInt("0x" + hex[3] + hex[4]);
    b = parseInt("0x" + hex[5] + hex[6]);
  } else {
    return null;
  }

  r /= 255;
  g /= 255;
  b /= 255;

  const cmin = Math.min(r, g, b),
    cmax = Math.max(r, g, b),
    delta = cmax - cmin;
  let h = 0,
    s = 0,
    l = 0;

  if (delta === 0) h = 0;
  else if (cmax === r) h = ((g - b) / delta) % 6;
  else if (cmax === g) h = (b - r) / delta + 2;
  else h = (r - g) / delta + 4;

  h = Math.round(h * 60);

  if (h < 0) h += 360;

  l = (cmax + cmin) / 2;
  s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));

  s = +(s * 100).toFixed(1);
  l = +(l * 100).toFixed(1);

  return [`${h}`, `${s}%`, `${l}%`];
};

// Override colors if Hex is provided
if (process.env.NEXT_PUBLIC_PRIMARY_COLOR) {
  const hsl = hexToHsl(process.env.NEXT_PUBLIC_PRIMARY_COLOR);
  if (hsl) {
    brandConfig.colors.primaryHue = hsl[0];
    brandConfig.colors.primarySaturation = hsl[1];
    brandConfig.colors.primaryLightness = hsl[2];
  }
}

if (process.env.NEXT_PUBLIC_SECONDARY_COLOR) {
  const hsl = hexToHsl(process.env.NEXT_PUBLIC_SECONDARY_COLOR);
  if (hsl) {
    brandConfig.colors.secondaryHue = hsl[0];
    brandConfig.colors.secondarySaturation = hsl[1];
    brandConfig.colors.secondaryLightness = hsl[2];
  }
}

/**
 * Helper to get the full primary HSL string
 */
export const getPrimaryColor = () =>
  `${brandConfig.colors.primaryHue} ${brandConfig.colors.primarySaturation} ${brandConfig.colors.primaryLightness}`;

/**
 * Helper to get the full secondary HSL string
 */
export const getSecondaryColor = () =>
  `${brandConfig.colors.secondaryHue} ${brandConfig.colors.secondarySaturation} ${brandConfig.colors.secondaryLightness}`;
