"use client";

import { Link, type LinkProps } from "@/components/Link";
import { forwardRef } from "react";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";

interface NavLinkProps extends Omit<LinkProps, 'to'> {
  to: string;
  children: React.ReactNode;
  className?: string;
  activeClassName?: string;
  pendingClassName?: string;
}

const NavLink = forwardRef<HTMLAnchorElement, NavLinkProps>(
  ({ to, children, className, activeClassName, pendingClassName, ...props }, ref) => {
    const pathname = usePathname();
    const isActive = pathname === to;

    return (
      <Link
        ref={ref}
        to={to}
        className={cn(className, isActive && activeClassName)}
        {...props}
      >
        {children}
      </Link>
    );
  }
);

NavLink.displayName = "NavLink";

export default NavLink;
