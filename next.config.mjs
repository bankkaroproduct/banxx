/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    async headers() {
        return [
            {
                source: '/api/:path*',
                headers: [
                    { key: 'X-Robots-Tag', value: 'noindex' },
                ],
            },
            {
                source: '/:path*',
                headers: [
                    { key: 'X-Frame-Options', value: 'DENY' },
                    { key: 'X-Content-Type-Options', value: 'nosniff' },
                    { key: 'X-XSS-Protection', value: '1; mode=block' },
                    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
                    { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
                    { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
                    {
                        key: 'Content-Security-Policy',
                        value: [
                            "default-src 'self'",
                            // 'unsafe-inline' required by Next.js inline scripts; remove 'unsafe-eval' for production
                            // TODO: replace 'unsafe-inline' with a nonce-based approach once Next.js nonce support is configured
                            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com",
                            // 'unsafe-inline' for styles is acceptable — CSS injection risk is lower than JS injection
                            "style-src 'self' 'unsafe-inline'",
                            "font-src 'self' data:",
                            "img-src 'self' data: https: blob:",
                            "connect-src 'self' https: wss:",
                            "frame-src 'none'",
                            "frame-ancestors 'none'",
                            "object-src 'none'",
                            "base-uri 'self'",
                            "form-action 'self'",
                        ].join('; '),
                    },
                ],
            },
        ];
    },
};

export default nextConfig;
