import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface OnboardingOverlayProps {
  onClose: () => void;
  onContinue: () => void;
}

export const OnboardingOverlay = ({ onClose, onContinue }: OnboardingOverlayProps) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop blur */}
      <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" />
      
      {/* Highlighted Pro Tip area - positioned where the actual Pro Tip is */}
      <div className="absolute top-[180px] left-1/2 -translate-x-1/2 w-full max-w-7xl px-4">
        <div className="relative bg-[#E0F7F9] border-2 border-primary rounded-lg p-3 shadow-2xl">
          {/* Arrow pointing to button */}
          <div className="absolute -bottom-16 right-8 flex flex-col items-center gap-2 animate-bounce">
            <svg 
              width="40" 
              height="40" 
              viewBox="0 0 24 24" 
              fill="none" 
              className="text-primary"
            >
              <path 
                d="M12 5V19M12 19L5 12M12 19L19 12" 
                stroke="currentColor" 
                strokeWidth="3" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
            </svg>
            <span className="text-sm font-medium text-primary bg-background px-3 py-1 rounded-full shadow-lg">
              Click here to get started!
            </span>
          </div>
          
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute -top-3 -right-3 w-8 h-8 bg-background border-2 border-border rounded-full flex items-center justify-center hover:bg-accent transition-colors shadow-lg z-10"
            aria-label="Close onboarding"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Bottom action buttons */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-4 z-[101]">
        <Button
          variant="outline"
          size="lg"
          onClick={onClose}
          className="bg-background shadow-lg"
        >
          Skip for now
        </Button>
        <Button
          size="lg"
          onClick={onContinue}
          className="shadow-lg"
        >
          Got it!
        </Button>
      </div>
    </div>
  );
};
