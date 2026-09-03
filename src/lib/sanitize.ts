import DOMPurify from 'dompurify';

export const sanitizeHtml = (html: string): string => {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'ul', 'li', 'ol', 'strong', 'em', 'br', 'span', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'div', 'b', 'i', 'u', 'a'],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'class'],
    ALLOW_DATA_ATTR: false,
    FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form', 'input'],
    FORBID_ATTR: ['style', 'onerror', 'onclick', 'onload', 'onmouseover', 'onfocus', 'onblur'],
    // Only allow https: and mailto: URIs — blocks javascript: and data: URIs
    ALLOWED_URI_REGEXP: /^(?:https?|mailto):/i,
    FORCE_BODY: true,
  });
};
