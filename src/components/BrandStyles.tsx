import { brandConfig, getPrimaryColor, getSecondaryColor } from '@/config/brand.config';

/**
 * BrandStyles Component (Server Component)
 * 
 * Injects brand colors as CSS custom properties into the document head.
 * This prevents the "flash of unstyled content" (FOUC) by ensuring
 * styles are part of the initial HTML payload.
 */
/** Strip characters that could break out of a CSS value context */
const sanitizeCSSValue = (value: string): string =>
    value.replace(/[<>"'\\;{}]/g, '');

export const BrandStyles = () => {
    const { colors } = brandConfig;
    const primary = sanitizeCSSValue(getPrimaryColor());
    const primaryHue = sanitizeCSSValue(String(colors.primaryHue));
    const primarySaturation = sanitizeCSSValue(String(colors.primarySaturation));
    const primaryGlow = `${primaryHue} ${primarySaturation} 45%`;
    const secondary = sanitizeCSSValue(getSecondaryColor());

    const cssVariables = `
        :root {
            --primary: ${primary};
            --primary-glow: ${primaryGlow};
            --ring: ${primary};
            --accent-foreground: ${primary};
            
            --mc-green-50: ${primaryHue} 100% 97%;
            --mc-green-100: ${primaryHue} 100% 94%;
            --mc-green-200: ${primaryHue} 100% 86%;
            --mc-green-500: ${primary};
            --mc-green-600: ${primaryHue} 100% 28%;
            --mc-green-700: ${primaryHue} 100% 24%;
            --mc-green-900: ${primaryHue} 80% 16%;

            --accent: ${primaryHue} 100% 96%;
            --secondary: ${secondary};

            --gradient-hero: linear-gradient(180deg, hsl(0 0% 100%), hsl(${primaryHue} 100% 98%));
            --gradient-accent: linear-gradient(135deg, hsl(${primary}), hsl(${primaryGlow}));
            --shadow-glow: 0 0 30px hsl(${primaryHue} 100% 45% / 0.3);
        }
    `;

    return (
        <style id="brand-styles" dangerouslySetInnerHTML={{ __html: cssVariables }} />
    );
};
