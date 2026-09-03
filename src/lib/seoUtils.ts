export const isWhitelabelDomain = (): boolean => {
  if (typeof window === 'undefined') return false;
  const hostname = window.location.hostname;
  if (hostname === 'great.cards' || hostname === 'www.great.cards') return false;
  if (hostname === 'localhost' || hostname.includes('127.0.0.1')) return false;
  return true;
};

export const getCanonicalUrl = (path: string): string => {
  const cleanPath = path.replace(/\/$/, '') || '/';
  return `https://great.cards${cleanPath}`;
};

export const isHomePage = (path: string): boolean => {
  return path === '/' || path === '';
};
