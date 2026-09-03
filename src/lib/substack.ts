export interface SubstackPost {
  id: string;
  title: string;
  url: string;
  pubDate: string;
  rawDate: string;
  excerpt: string;
  image: string;
  category: string;
  tags: string[];
  readTime: string;
  author: string;
}

const FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&h=600&fit=crop',
];

function extractCdata(xml: string, tag: string): string {
  const escaped = tag.replace(':', '\\:');
  const pattern = new RegExp(
    `<${escaped}[^>]*>(?:<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>|([^<]*?))<\\/${escaped}>`,
    'i'
  );
  const match = xml.match(pattern);
  if (!match) return '';
  return (match[1] ?? match[2] ?? '').trim();
}

function extractAllCdata(xml: string, tag: string): string[] {
  const results: string[] = [];
  const escaped = tag.replace(':', '\\:');
  const pattern = new RegExp(
    `<${escaped}[^>]*>(?:<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>|([^<]*?))<\\/${escaped}>`,
    'gi'
  );
  let match;
  while ((match = pattern.exec(xml)) !== null) {
    const val = (match[1] ?? match[2] ?? '').trim();
    if (val) results.push(val);
  }
  return results;
}

function extractLink(item: string): string {
  const cdataMatch = item.match(
    /<link>(?:<!\[CDATA\[)?(https?:\/\/[^\s<\]]+?)(?:\]\]>)?<\/link>/i
  );
  if (cdataMatch) return cdataMatch[1].trim();
  const guidMatch = item.match(
    /<guid[^>]*>(?:<!\[CDATA\[)?(https?:\/\/[^\s<\]]+?)(?:\]\]>)?<\/guid>/i
  );
  if (guidMatch) return guidMatch[1].trim();
  return '';
}

function extractEnclosure(item: string): string {
  const match = item.match(/<enclosure[^>]+url="([^"]+)"/i);
  return match ? match[1] : '';
}

function extractMediaContent(item: string): string {
  const match = item.match(/<media:(?:content|thumbnail)[^>]+url="([^"]+)"/i);
  return match ? match[1] : '';
}

function extractFirstImage(html: string): string {
  const match = html.match(/<img[^>]+src="([^"]+)"/i);
  return match ? match[1] : '';
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&#\d+;/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function estimateReadTime(content: string): string {
  const words = stripHtml(content).split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.round(words / 200));
  return `${minutes} min read`;
}

function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

export async function fetchSubstackPosts(): Promise<SubstackPost[]> {
  try {
    const res = await fetch('https://nirajdugar.substack.com/feed', {
      next: { revalidate: 3600 },
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; BankKaro/1.0)' },
    });
    if (!res.ok) return [];
    const xml = await res.text();

    const itemMatches = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)];
    if (!itemMatches.length) return [];

    return itemMatches.map((m, index) => {
      const item = m[0];
      const title = extractCdata(item, 'title') || 'Untitled';
      const url = extractLink(item);
      const pubDate = extractCdata(item, 'pubDate');
      const description = extractCdata(item, 'description');
      const content = extractCdata(item, 'content:encoded');
      const categories = extractAllCdata(item, 'category');

      const image =
        extractEnclosure(item) ||
        extractMediaContent(item) ||
        extractFirstImage(content) ||
        extractFirstImage(description) ||
        FALLBACK_IMAGES[index % FALLBACK_IMAGES.length];

      const rawExcerpt = stripHtml(description || content);
      const excerpt =
        rawExcerpt.length > 220 ? rawExcerpt.substring(0, 220) + '…' : rawExcerpt;

      return {
        id: url || String(index),
        title,
        url,
        pubDate: formatDate(pubDate),
        rawDate: pubDate,
        excerpt,
        image,
        category: categories[0] || 'Insights',
        tags: categories.slice(0, 3).length ? categories.slice(0, 3) : ['Finance', 'Credit Cards'],
        readTime: estimateReadTime(content || description),
        author: 'Niraj Dugar',
      };
    });
  } catch (e) {
    console.error('[fetchSubstackPosts] error:', e);
    return [];
  }
}
