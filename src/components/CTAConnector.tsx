import { Zap } from "lucide-react";

const CTAConnector = () => {
  return (
    <div className="relative -my-8 py-8 flex items-center justify-center">
      {/* Animated vertical line */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-px h-full bg-gradient-to-b from-[#E0F7F9] via-[#E0F7F9] to-[#E0F7F9] dark:from-[#0B7A8A] dark:via-[#0B7A8A] dark:to-[#0B7A8A] opacity-30" />
      </div>

      {/* Animated dots */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full bg-[#0B7A8A] dark:bg-[#E0F7F9] animate-pulse" style={{ animationDelay: '0s' }} />
        <div className="w-1.5 h-1.5 rounded-full bg-[#E0F7F9] dark:bg-[#0B7A8A] animate-pulse" style={{ animationDelay: '0.3s' }} />
        <div className="w-1.5 h-1.5 rounded-full bg-[#0B7A8A] dark:bg-[#E0F7F9] animate-pulse" style={{ animationDelay: '0.6s' }} />
      </div>

      {/* Central badge */}
      <div className="relative z-10 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-[#E0F7F9]/20 via-[#E0F7F9]/10 to-[#E0F7F9]/20 dark:from-[#0B7A8A]/20 dark:via-[#0B7A8A]/10 dark:to-[#0B7A8A]/20 border border-border/50 shadow-lg">
        <Zap className="w-4 h-4 text-primary animate-pulse" />
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Choose Your Path
        </span>
        <Zap className="w-4 h-4 text-secondary animate-pulse" style={{ animationDelay: '0.5s' }} />
      </div>
    </div>
  );
};

export default CTAConnector;
