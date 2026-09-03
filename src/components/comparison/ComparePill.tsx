import { useState, useEffect } from 'react';
import { useComparison } from '@/contexts/ComparisonContext';
import { Button } from '@/components/ui/button';
import { X, ArrowRightLeft } from 'lucide-react';
import { ComparePanel } from './ComparePanel';
import { cn } from '@/lib/utils';
import { getCardKey } from '@/utils/cardAlias';
import { trackComparePanelViewed, trackCompareNowClicked } from '@/services/journeyTrack';

export function ComparePill() {
  const { selectedCards, removeCard, clearAll } = useComparison();
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (selectedCards.length > 0) {
      if (!isVisible) trackComparePanelViewed(selectedCards.length);
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCards]);

  useEffect(() => {
    const handleOpen = () => setIsPanelOpen(true);
    window.addEventListener('openComparison', handleOpen);
    return () => window.removeEventListener('openComparison', handleOpen);
  }, []);

  if (!isVisible) return null;

  return (
    <>
      {/* Hide the visual pill on small screens or when the panel is open (Dialog marks outside content as inert) */}
      <div
        className={cn(
          "hidden lg:block",
          // Desktop: dock to bottom-right
          "fixed right-8 bottom-8 z-[60] w-[340px]",
          isVisible && !isPanelOpen ? "animate-slide-in-right" : "opacity-0 pointer-events-none"
        )}
      >
        <div className="bg-gradient-to-r from-[#0B7A8A] to-[#E0F7F9] rounded-2xl shadow-2xl px-4 py-3 backdrop-blur-md border border-[#0B7A8A]/25">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs sm:text-sm font-semibold text-primary-foreground flex items-center gap-1.5 sm:gap-2">
              <ArrowRightLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden xs:inline">Compare Cards</span>
              <span className="xs:hidden">Compare</span>
            </span>
            <Button
              size="sm"
              variant="ghost"
              onClick={clearAll}
              className="h-6 w-6 sm:h-7 sm:w-7 p-0 hover:bg-white/20 text-primary-foreground touch-target"
            >
              <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </Button>
          </div>

          {/* Card Thumbnails */}
          <div className="flex gap-2 mb-3">
            {selectedCards.map((card, idx) => (
              <div
                key={card.id || idx}
                className="relative w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 flex-shrink-0"
              >
                {/* Image container — overflow-hidden is scoped here so it does NOT clip the X button */}
                <div className="absolute inset-0 rounded-md sm:rounded-lg bg-white border-2 border-white/50 overflow-hidden shadow-md">
                  <img
                    src={card.card_bg_image || card.image || '/placeholder.svg'}
                    alt={card.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = '/placeholder.svg';
                    }}
                  />
                </div>
                {/* X button is a sibling of the image container — never clipped */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    removeCard(getCardKey(card));
                  }}
                  className="absolute top-0 right-0 z-10 bg-black/70 hover:bg-red-600 text-white rounded-bl-md p-1 leading-none"
                  aria-label={`Remove ${card.name} from comparison`}
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>

          {/* Compare Button */}
          <Button
            size="sm"
            onClick={() => { trackCompareNowClicked(selectedCards.map(getCardKey)); setIsPanelOpen(true); }}
            className="mt-1 w-full bg-white hover:bg-white/90 text-primary font-semibold shadow-lg text-xs sm:text-sm h-9 rounded-xl"
          >
            <ArrowRightLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
            <span className="hidden xs:inline">Compare {selectedCards.length} Card{selectedCards.length > 1 ? 's' : ''}</span>
            <span className="xs:hidden">Compare ({selectedCards.length})</span>
          </Button>
        </div>
      </div>

      <ComparePanel 
        open={isPanelOpen}
        onOpenChange={setIsPanelOpen}
      />
    </>
  );
}
