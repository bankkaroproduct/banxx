'use client';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { isWhitelabelDomain, getCanonicalUrl, isHomePage } from '@/lib/seoUtils';

export const SEOTags = () => {
  const pathname = usePathname();

  useEffect(() => {
    if (!isWhitelabelDomain()) return;

    // Canonical tag
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = getCanonicalUrl(pathname);

    // noindex on all pages except homepage
    let robotsMeta = document.querySelector('meta[name="robots"]') as HTMLMetaElement | null;
    if (!isHomePage(pathname)) {
      if (!robotsMeta) {
        robotsMeta = document.createElement('meta');
        robotsMeta.name = 'robots';
        document.head.appendChild(robotsMeta);
      }
      robotsMeta.content = 'noindex, follow';
    } else {
      robotsMeta?.remove();
    }
  }, [pathname]);

  return null;
};
