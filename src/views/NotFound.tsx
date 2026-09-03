"use client";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { Link } from "@/components/Link";

const NotFound = () => {
  const pathname = usePathname();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", pathname);
  }, [pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold">404</h1>
        <p className="mb-4 text-xl text-gray-600">Oops! Page not found</p>
        <Link to="/" className="text-[#0B7A8A] underline hover:text-[#085F6D]">
          Return to Home
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
