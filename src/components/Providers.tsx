"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "./ui/tooltip";
import { ComparisonProvider } from "@/contexts/ComparisonContext";
import { Toaster } from "./ui/toaster";
import { Toaster as Sonner } from "./ui/sonner";
import { useState } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
    const [queryClient] = useState(() => new QueryClient());

    return (
        <QueryClientProvider client={queryClient}>
            <TooltipProvider>
                <ComparisonProvider maxCompare={3}>
                    {children}
                    <Toaster />
                    <Sonner />
                </ComparisonProvider>
            </TooltipProvider>
        </QueryClientProvider>
    );
}
