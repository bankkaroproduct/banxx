import NextLink, { LinkProps as NextLinkProps } from 'next/link';
import { AnchorHTMLAttributes, forwardRef } from 'react';

export interface LinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
    to: string;
    prefetch?: NextLinkProps['prefetch'];
    replace?: NextLinkProps['replace'];
    scroll?: NextLinkProps['scroll'];
    shallow?: NextLinkProps['shallow'];
}

export const Link = forwardRef<HTMLAnchorElement, LinkProps>(
    ({ to, children, prefetch, replace, scroll, shallow, ...props }, ref) => {
        return (
            <NextLink
                href={to}
                prefetch={prefetch}
                replace={replace}
                scroll={scroll}
                shallow={shallow}
                ref={ref}
                {...props}
            >
                {children}
            </NextLink>
        );
    }
);

Link.displayName = 'Link';
