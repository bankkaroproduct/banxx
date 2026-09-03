"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { toast } from 'sonner';
import { getCardKey } from '@/utils/cardAlias';
import { trackCompareCardAdded, trackCompareCardRemoved } from '@/services/journeyTrack';

interface ComparisonContextType {
  selectedCards: any[];
  maxCompare: number;
  toggleCard: (card: any) => void;
  removeCard: (cardId: string) => void;
  clearAll: () => void;
  isSelected: (cardId: string) => boolean;
  canAddMore: boolean;
  startComparisonWith: (card: any) => void;
}

const ComparisonContext = createContext<ComparisonContextType | undefined>(undefined);

export function ComparisonProvider({ children, maxCompare = 2 }: { children: ReactNode; maxCompare?: number }) {
  const [selectedCards, setSelectedCards] = useState<any[]>([]);

  // Load from sessionStorage on mount (clears when the tab is closed)
  useEffect(() => {
    const saved = sessionStorage.getItem('selectedCards');
    if (saved) {
      try {
        setSelectedCards(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse selectedCards from sessionStorage', e);
      }
    }
  }, []);

  // Persist minimal card fields to sessionStorage whenever selection changes.
  // Storing only the fields needed for display + key lookup avoids saving full
  // API response objects (which include network URLs, fee structures, etc.).
  useEffect(() => {
    const minimal = selectedCards.map((card) => ({
      id: card.id,
      name: card.name || card.card_name,
      seo_card_alias: card.seo_card_alias || card.card_alias || card.alias,
      image: card.image || card.card_bg_image,
      card_bg_image: card.card_bg_image || card.image,
    }));
    sessionStorage.setItem('selectedCards', JSON.stringify(minimal));
  }, [selectedCards]);

  const toggleCard = (card: any) => {
    const cardId = getCardKey(card);

    if (isSelected(cardId)) {
      // Remove card
      trackCompareCardRemoved(cardId, card.name || card.card_name);
      setSelectedCards(prev => prev.filter(c => {
        const cId = getCardKey(c);
        return cId !== cardId;
      }));
      toast.success('Removed from comparison', {
        description: card.name,
        position: 'top-right'
      });
    } else {
      // Add card
      if (selectedCards.length >= maxCompare) {
        toast.error(`Maximum ${maxCompare} cards allowed`, {
          description: 'Remove one to add another',
          position: 'top-right',
          action: selectedCards.length === 2 ? {
            label: 'Compare Now',
            onClick: () => {
              const event = new CustomEvent('openComparison');
              window.dispatchEvent(event);
            }
          } : undefined
        });
        return;
      }

      trackCompareCardAdded(cardId, card.name || card.card_name, card.source);
      setSelectedCards(prev => [...prev, card]);
      toast.success('Added to comparison', {
        description: `${selectedCards.length + 1} of ${maxCompare} cards selected`,
        position: 'top-right'
      });
    }
  };

  const removeCard = (cardId: string) => {
    if (!cardId) return;
    const removed = selectedCards.find(c => getCardKey(c) === cardId);
    if (removed) trackCompareCardRemoved(cardId, removed.name || removed.card_name);
    setSelectedCards(prev => prev.filter(c => getCardKey(c) !== cardId));
    if (removed) {
      toast.success('Removed from comparison', { description: removed.name || removed.card_name, position: 'top-right' });
    }
  };

  const clearAll = () => {
    setSelectedCards([]);
    toast.info('Comparison cleared', {
      position: 'top-right'
    });
  };

  const isSelected = (cardId: string) => {
    return selectedCards.some(c => {
      const cId = getCardKey(c);
      return cId === cardId;
    });
  };

  const canAddMore = selectedCards.length < maxCompare;

  const startComparisonWith = (card: any) => {
    // Clear all existing selections and add this card as the first selection
    trackCompareCardAdded(getCardKey(card), card.name || card.card_name, card.source);
    setSelectedCards([card]);
    toast.success('Comparison started', {
      description: `${card.name} selected. Add ${maxCompare - 1} more card${maxCompare > 2 ? 's' : ''} to compare.`,
      position: 'top-right'
    });
  };

  return (
    <ComparisonContext.Provider value={{
      selectedCards,
      maxCompare,
      toggleCard,
      removeCard,
      clearAll,
      isSelected,
      canAddMore,
      startComparisonWith
    }}>
      {children}
    </ComparisonContext.Provider>
  );
}

export function useComparison() {
  const context = useContext(ComparisonContext);
  if (context === undefined) {
    throw new Error('useComparison must be used within ComparisonProvider');
  }
  return context;
}

// Also export the context itself for debugging
export { ComparisonContext };
