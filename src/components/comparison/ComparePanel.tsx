import { useState, useEffect, useRef } from 'react';
import { useComparison } from '@/contexts/ComparisonContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { X, Star, ExternalLink, ChevronDown, ChevronUp, Search, Plus, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { sanitizeHtml } from '@/lib/sanitize';
import { feeCalc } from '@/lib/feeUtils';
import { redirectToCardApplication } from '@/utils/redirectHandler';
import EligibilityDialog from '@/components/EligibilityDialog';
import { cardService } from '@/services/cardService';
import { getCardAlias, getCardKey } from '@/utils/cardAlias';
import { useDebounce } from '@/hooks/useDebounce';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';

interface ComparePanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preSelectedCard?: any;
}

export function ComparePanel({ open, onOpenChange, preSelectedCard }: ComparePanelProps) {
  const { selectedCards, removeCard, toggleCard, maxCompare } = useComparison();
  const [searchQueries, setSearchQueries] = useState<string[]>(['', '', '']);
  const [searchResults, setSearchResults] = useState<any[][]>([[], [], []]);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [detailViewCard, setDetailViewCard] = useState<any>(null);
  const [pendingApplyCard, setPendingApplyCard] = useState<any>(null);
  const [applyEligibilityDone, setApplyEligibilityDone] = useState(false);
  const [detailViewOpen, setDetailViewOpen] = useState(false);
  const [allCards, setAllCards] = useState<any[]>([]);
  const [hydratedCards, setHydratedCards] = useState<Record<string, any>>({});
  const hydrationQueueRef = useRef<Record<string, boolean>>({});

  const debouncedQuery0 = useDebounce(searchQueries[0], 300);
  const debouncedQuery1 = useDebounce(searchQueries[1], 300);
  const debouncedQuery2 = useDebounce(searchQueries[2], 300);

  useEffect(() => {
    if (!open || allCards.length > 0) return;
    cardService.getCardListing({ slug: '', banks_ids: [], card_networks: [], annualFees: '', credit_score: '', sort_by: '', free_cards: '', eligiblityPayload: {}, cardGeniusPayload: [] })
      .then(response => setAllCards(response.data?.cards || response.data?.data || []))
      .catch(console.error);
  }, [open, allCards.length]);

  useEffect(() => {
    [debouncedQuery0, debouncedQuery1, debouncedQuery2].forEach((query, idx) => {
      if (query?.length >= 2) {
        setSearchResults(prev => { const newResults = [...prev]; newResults[idx] = allCards.filter((card: any) => card.name.toLowerCase().includes(query.toLowerCase())).slice(0, 5); return newResults; });
      } else {
        setSearchResults(prev => { const newResults = [...prev]; newResults[idx] = []; return newResults; });
      }
    });
  }, [debouncedQuery0, debouncedQuery1, debouncedQuery2, allCards]);

  const handleSearchChange = (slotIndex: number, value: string) => setSearchQueries(prev => { const newQueries = [...prev]; newQueries[slotIndex] = value; return newQueries; });
  const handleSelectCard = (slotIndex: number, card: any) => { toggleCard(card); handleSearchChange(slotIndex, ''); };
  const toggleRowExpansion = (rowKey: string) => setExpandedRows(prev => { const newSet = new Set(prev); if (newSet.has(rowKey)) newSet.delete(rowKey); else newSet.add(rowKey); return newSet; });
  const getNestedValue = (obj: any, path: string) => {
    const value = path.split('.').reduce((acc: any, part: string) => acc?.[part], obj);
    if (typeof value === 'string') {
      return value.replace(/withdrawa([^l]|$)/gi, 'withdrawal$1');
    }
    return value;
  };
  const isLongText = (text: string) => text ? text.replace(/<[^>]*>/g, '').length > 150 : false;

  const comparisonSections = [
    {
      id: 'fee-eligibility',
      title: 'Fee & Eligibility',
      rows: [
        { key: 'joining_fee_text', label: 'Joining Fee' },
        { key: 'joining_fee_offset', label: 'Joining Fee Waiver', type: 'html' },
        { key: 'annual_fee_text', label: 'Annual Fee' },
        { key: 'annual_fee_waiver', label: 'Annual Fee Waiver', type: 'html' },
        { key: 'annual_saving', label: 'Annual Savings Potential' },
        { key: 'min_age', label: 'Minimum Age' },
        { key: 'max_age', label: 'Maximum Age' },
        { key: 'income_salaried', label: 'Income (Salaried)' },
        { key: 'income_self_emp', label: 'Income (Self-Employed)' },
        { key: 'crif', label: 'Credit Score Required' },
        { key: 'employment_type', label: 'Employment Type' },
      ],
    },
    {
      id: 'key-benefits',
      title: 'Key Benefits',
      rows: [
        { key: 'product_usps', label: 'All Key Benefits', type: 'usps' },
      ],
    },
    {
      id: 'best-for',
      title: 'Best For',
      rows: [
        { key: 'tags', label: 'Best For', type: 'tags' },
      ],
    },
    {
      id: 'rewards',
      title: 'Rewards & Redemption',
      rows: [
        { key: 'reward_conversion_rate', label: 'Reward Conversion Rate', type: 'html' },
        { key: 'redemption_options', label: 'Redemption Options', type: 'html' },
        { key: 'redemption_catalogue', label: 'Redemption Catalogue', type: 'link' },
      ],
    },
    {
      id: 'fee-structure',
      title: 'Fee Structure',
      rows: [
        { key: 'bank_fee_structure.forex_markup', label: 'Foreign Currency Markup' },
        { key: 'bank_fee_structure.forex_markup_comment', label: 'Forex Markup Details', type: 'html' },
        { key: 'bank_fee_structure.apr_fees', label: 'APR Fees' },
        { key: 'bank_fee_structure.apr_fees_comment', label: 'APR Details', type: 'html' },
        { key: 'bank_fee_structure.atm_withdrawal', label: 'ATM Withdrawal Charges' },
        { key: 'bank_fee_structure.atm_withdrawal_comment', label: 'ATM Withdrawal Details', type: 'html' },
        { key: 'bank_fee_structure.reward_redemption_fees', label: 'Reward Redemption Fees' },
        { key: 'bank_fee_structure.reward_redemption_fees_comment', label: 'Reward Redemption Details', type: 'html' },
        { key: 'bank_fee_structure.railway_surcharge', label: 'Railway Surcharge' },
        { key: 'bank_fee_structure.railway_surcharge_comment', label: 'Railway Surcharge Details', type: 'html' },
        { key: 'bank_fee_structure.rent_payment_fees', label: 'Rent Payment Fees' },
        { key: 'bank_fee_structure.rent_payment_fees_comment', label: 'Rent Payment Details', type: 'html' },
        { key: 'bank_fee_structure.check_payment_fees', label: 'Cheque Payment Fees' },
        { key: 'bank_fee_structure.check_payment_fees_comment', label: 'Cheque Payment Details', type: 'html' },
        { key: 'bank_fee_structure.cash_payment_fees', label: 'Cash Payment Fees' },
        { key: 'bank_fee_structure.cash_payment_fees_comment', label: 'Cash Payment Details', type: 'html' },
        { key: 'bank_fee_structure.late_payment_fine', label: 'Late Payment Charges' },
        { key: 'bank_fee_structure.late_payment_annual', label: 'Late Payment (Annual Slabs)' },
        { key: 'bank_fee_structure.late_payment_comment', label: 'Late Payment Details', type: 'html' },
      ],
    },
    {
      id: 'exclusions',
      title: 'Exclusions',
      rows: [
        { key: 'exclusion_earnings', label: 'Earning Exclusions', type: 'list' },
        { key: 'exclusion_spends', label: 'Spending Exclusions', type: 'list' },
      ],
    },
    {
      id: 'terms',
      title: 'Terms & Conditions',
      rows: [
        { key: 'tnc', label: 'Terms & Conditions', type: 'html' },
      ],
    },
  ];

  // Use the utility function from cardAlias.ts

  const slots = Array.from({ length: maxCompare }, (_, i) =>
    i === 0 &&
    preSelectedCard &&
    !selectedCards.find(
      (c) => getCardKey(c) === getCardKey(preSelectedCard)
    )
      ? preSelectedCard
      : selectedCards[i] || null
  );

  const resolvedSlots = slots.map((card) => {
    if (!card) return null;
    const key = getCardKey(card);
    const hydrated = key && hydratedCards[key];
    if (!hydrated) return card;
    return {
      ...card,
      ...hydrated,
      banks: hydrated.banks || card.banks,
      image: hydrated.image || card.image,
      network_url: hydrated.network_url || card.network_url,
    };
  });

  // Active cards used in UI (no empty slots)
  const activeCards = resolvedSlots.filter(Boolean);

  const handleApply = (card: any) => {
    if (applyEligibilityDone) {
      redirectToCardApplication(card);
      return;
    }
    setPendingApplyCard(card);
  };

  // When the panel opens with a preSelectedCard (e.g. from CardDetails), ensure it is in
  // selectedCards so the X button's removeCard() call can find and remove it.
  // Without this, preSelectedCard sits in slot 0 as a display-only card and X does nothing.
  useEffect(() => {
    if (!open || !preSelectedCard) return;
    const key = getCardKey(preSelectedCard);
    if (!key) return;
    if (!selectedCards.some(c => getCardKey(c) === key) && selectedCards.length < maxCompare) {
      toggleCard(preSelectedCard);
    }
    // Only run when the panel opens/closes, not on every selectedCards change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;

    selectedCards.forEach(card => {
      const key = getCardKey(card);
      if (!key || hydratedCards[key] || hydrationQueueRef.current[key]) return;

      hydrationQueueRef.current[key] = true;
      
      // Use getCardAlias to ensure we use the correct alias for API call
      const alias = getCardAlias(card);
      if (!alias) {
        console.warn('No alias found for card:', card);
        delete hydrationQueueRef.current[key];
        return;
      }
      
      cardService.getCardDetailsByAlias(alias)
        .then(response => {
          const detail =
            Array.isArray(response?.data) ? response.data[0] :
            response?.data?.data ? response.data.data :
            response?.data;

          if (detail) {
            setHydratedCards(prev => ({
              ...prev,
              [key]: {
                ...card,
                ...detail,
                // Preserve important fields from original card
                banks: detail.banks || card.banks,
                image: detail.image || card.image || card.card_bg_image,
                card_type: detail.card_type || card.card_type,
                network_url: detail.network_url || card.network_url,
                seo_card_alias: detail.seo_card_alias || card.seo_card_alias || alias,
                card_alias: detail.card_alias || card.card_alias || alias,
              }
            }));
          } else {
            console.warn('No detail data found for card:', alias);
          }
        })
        .catch(err => {
          console.error('Failed to hydrate card for comparison:', alias, err);
          toast.error(`Failed to load details for ${card.name || 'card'}`);
        })
        .finally(() => {
          delete hydrationQueueRef.current[key];
        });
    });
  }, [open, selectedCards]);

  const renderCellValue = (card: any, row: any) => {
    const value = getNestedValue(card, row.key);

    // Fee fields always show inline GST-inclusive format
    if (row.key === 'joining_fee_text' || row.key === 'annual_fee_text') {
      return <span>{feeCalc(value || '0').inline}</span>;
    }

    // For Fee Structure rows with comments, check both value and comment
    if (row.key.startsWith('bank_fee_structure.')) {
      const isCommentRow = row.key.endsWith('_comment');
      if (!isCommentRow) {
        // For value rows, check if there's a corresponding comment
        const commentKey = `${row.key}_comment`;
        const commentValue = getNestedValue(card, commentKey);
        // Only show "Not Available" if both value and comment are empty
        if ((!value || value === 'N/A' || value === '') && (!commentValue || commentValue === 'N/A' || commentValue === '')) {
          return <span className="text-muted-foreground italic">Not Available</span>;
        }
      }
    } else {
      // For non-fee-structure fields, use original logic
      if (!value || value === 'N/A' || value === '') return <span className="text-muted-foreground italic">Not Available</span>;
    }
    
    if (row.type === 'rating') return <div className="flex items-center gap-1"><Star className="w-4 h-4 fill-yellow-400 text-yellow-400" /><span className="font-semibold">{value}</span></div>;
    if (row.type === 'usps') return <div className="space-y-2">{(Array.isArray(value) ? value : []).sort((a: any, b: any) => a.priority - b.priority).map((usp: any, idx: number) => (<div key={idx} className="p-2 bg-muted/50 rounded-lg"><div className="font-semibold text-sm mb-1">{usp.header}</div><div className="text-xs text-muted-foreground">{usp.description}</div></div>))}</div>;
    if (row.type === 'tags') return <div className="flex flex-wrap gap-2">{(Array.isArray(value) ? value : []).map((t: any) => <span key={t.id || t.name} className="px-2 py-1 rounded-full bg-[#E0F7F9] text-primary border border-[#0B7A8A]/20 text-xs font-medium">{t.name}</span>)}</div>;
    if (row.type === 'list') return <ul className="list-disc list-inside space-y-1 text-sm">{value.split(',').map((item: string) => item.trim()).filter(Boolean).map((item: string, idx: number) => <li key={idx}>{item}</li>)}</ul>;
    if (row.type === 'link') return <a href={value} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">View Catalogue <ExternalLink className="w-3 h-3" /></a>;
    if (row.type === 'html') {
      const rowKey = `${row.key}`; const isExpanded = expandedRows.has(rowKey); const needsExpansion = isLongText(value);
      return <div><div className={cn("prose prose-sm max-w-none", !isExpanded && needsExpansion && "line-clamp-3")} dangerouslySetInnerHTML={{ __html: sanitizeHtml(value) }} />{needsExpansion && <Button variant="link" size="sm" onClick={() => toggleRowExpansion(rowKey)} className="mt-1 p-0 h-auto text-xs">{isExpanded ? <>Show Less <ChevronUp className="w-3 h-3 ml-1" /></> : <>Show More <ChevronDown className="w-3 h-3 ml-1" /></>}</Button>}</div>;
    }
    const rowKey = `${row.key}`; const isExpanded = expandedRows.has(rowKey); const strValue = String(value); const needsExpansion = strValue.length > 150;
    return <div><div className={cn(!isExpanded && needsExpansion && "line-clamp-3")}>{strValue}</div>{needsExpansion && <Button variant="link" size="sm" onClick={() => toggleRowExpansion(rowKey)} className="mt-1 p-0 h-auto text-xs">{isExpanded ? <>Show Less <ChevronUp className="w-3 h-3 ml-1" /></> : <>Show More <ChevronDown className="w-3 h-3 ml-1" /></>}</Button>}</div>;
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[98vw] sm:max-w-[95vw] h-[92vh] sm:h-[90vh] p-0">
          <DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4 border-b">
            <DialogTitle className="text-xl sm:text-2xl font-bold">Compare Credit Cards</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-full px-4 sm:px-6 pb-4 sm:pb-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
              {resolvedSlots.map((card, index) => (
                <div key={index} className="border rounded-lg p-4 bg-card">
                  {card ? (
                    <div className="space-y-3">
                      <div className="relative">
                        <img
                          src={card.image || '/placeholder.svg'}
                          alt={card.name}
                          className="w-full h-40 object-contain rounded-lg bg-gradient-to-br from-muted to-muted/50"
                          onError={e => { e.currentTarget.src = '/placeholder.svg'; }}
                        />
                        <button
                          type="button"
                          className="absolute top-2 right-2 z-10 flex items-center justify-center h-7 w-7 rounded-full bg-background/90 hover:bg-red-100 hover:text-red-600 shadow-sm border border-border"
                          onClick={(e) => { e.stopPropagation(); e.preventDefault(); if (slots[index]) toggleCard(slots[index]); }}
                          aria-label={`Remove ${card.name} from comparison`}
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <div>
                        <h3 className="font-semibold line-clamp-2">{card.name}</h3>
                        <p className="text-sm text-muted-foreground">{card.banks?.name}</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => {
                          setDetailViewCard(card);
                          setDetailViewOpen(true);
                        }}
                      >
                        <Info className="w-4 h-4 mr-2" />
                        View Details
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="relative w-full h-32 sm:h-40 flex items-center justify-center bg-muted/50 rounded-lg border-2 border-dashed">
                        <Plus className="w-10 h-10 sm:w-12 sm:h-12 text-muted-foreground" />
                      </div>
                      <div className="space-y-2">
                        <Popover open={searchResults[index].length > 0}>
                          <PopoverTrigger asChild>
                            <Input
                              placeholder="Search for a card..."
                              value={searchQueries[index]}
                              onChange={(e) => handleSearchChange(index, e.target.value)}
                              className="w-full text-sm sm:text-base touch-target"
                            />
                          </PopoverTrigger>
                          <PopoverContent
                            className="p-0 max-h-60 overflow-auto"
                            align="start"
                            style={{ width: 'var(--radix-popover-trigger-width)' }}
                            onOpenAutoFocus={(e) => e.preventDefault()}
                          >
                            {searchResults[index].map((searchCard: any) => (
                              <button
                                key={searchCard.id}
                                className="w-full text-left px-3 py-2 hover:bg-muted flex items-center gap-2"
                                onClick={() => handleSelectCard(index, searchCard)}
                              >
                                <img
                                  src={searchCard.image || '/placeholder.svg'}
                                  alt={searchCard.name}
                                  className="w-12 h-8 object-contain"
                                  onError={e => { e.currentTarget.src = '/placeholder.svg'; }}
                                />
                                <div className="flex-1">
                                  <div className="font-medium text-sm line-clamp-1">{searchCard.name}</div>
                                  <div className="text-xs text-muted-foreground">{searchCard.banks?.name}</div>
                                </div>
                              </button>
                            ))}
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {selectedCards.length === 0 && (
              <div className="text-center py-16">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted mb-4">
                  <Search className="w-10 h-10 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-2">No Cards Selected</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Search and select at least 2 cards above to start comparing their features, fees, and benefits
                  side-by-side.
                </p>
              </div>
            )}

            {selectedCards.length >= 2 && (
              <div className="space-y-6">
                {/* Mobile-friendly stacked comparison */}
                <div className="space-y-4 sm:hidden">
                  {comparisonSections.map((section) => (
                    <div key={section.id} className="border rounded-lg overflow-hidden">
                      <div className="bg-muted px-4 py-3">
                        <h3 className="font-semibold text-base">{section.title}</h3>
                      </div>
                      <div className="divide-y">
                        {section.rows.map((row) => (
                          <div key={row.key} className="px-4 py-3">
                            <div className="text-[11px] font-semibold text-muted-foreground mb-2">
                              {row.label}
                            </div>
                            <div
                              className={cn(
                                "grid gap-2",
                                activeCards.length === 1 && "grid-cols-1",
                                activeCards.length === 2 && "grid-cols-2",
                                activeCards.length >= 3 && "grid-cols-3"
                              )}
                            >
                              {activeCards.map((card, idx) => (
                                <div
                                  key={idx}
                                  className="border rounded-md bg-background/70 px-2.5 py-2 space-y-1"
                                >
                                  <div className="text-[10px] font-semibold line-clamp-2 min-h-[1.5rem]">
                                    {card?.name || 'Card'}
                                  </div>
                                  <div className="text-[10px] leading-snug">
                                    {renderCellValue(card, row)}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Tablet / Desktop table view */}
                <div className="hidden sm:block space-y-6">
                  {comparisonSections.map((section) => (
                    <div key={section.id} className="border rounded-lg overflow-hidden">
                      <div className="bg-muted px-4 py-3">
                        <h3 className="font-semibold text-lg">{section.title}</h3>
                      </div>
                      {/* Make the comparison table horizontally scrollable on small tablet widths */}
                      <div className="w-full overflow-x-auto">
                        <Table className="min-w-[680px] sm:min-w-full">
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-[160px] min-w-[160px] sm:w-[200px] sm:min-w-[200px] font-semibold sticky left-0 bg-background z-10 text-sm sm:text-base">
                                Attribute
                              </TableHead>
                              {activeCards.map((card, idx) => (
                                <TableHead
                                  key={idx}
                                  className="font-semibold text-center min-w-[220px] w-[220px] sm:min-w-[260px] sm:w-[260px] text-sm sm:text-base"
                                >
                                  {card?.name || 'Card'}
                                </TableHead>
                              ))}
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {section.rows.map((row) => (
                              <TableRow key={row.key} className="hover:bg-muted/50">
                                <TableCell className="font-medium align-top w-[160px] min-w-[160px] sm:w-[200px] sm:min-w-[200px] sticky left-0 bg-background z-10 text-xs sm:text-sm">
                                  {row.label}
                                </TableCell>
                                {activeCards.map((card, idx) => (
                                  <TableCell
                                    key={idx}
                                    className="align-top min-w-[220px] w-[220px] sm:min-w-[260px] sm:w-[260px] text-xs sm:text-sm"
                                  >
                                    {renderCellValue(card, row)}
                                  </TableCell>
                                ))}
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
                  {resolvedSlots.filter(Boolean).map((card, idx) => (
                    <Button key={idx} className="w-full" onClick={() => handleApply(card)}>
                      Apply for {card?.name || 'this card'}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <Sheet open={detailViewOpen} onOpenChange={setDetailViewOpen}>
        <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
          {detailViewCard && (
            <>
              <SheetHeader>
                <SheetTitle>{detailViewCard.name}</SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-6">
                <div className="relative w-full">
                  <img
                    src={detailViewCard.image || '/placeholder.svg'}
                    alt={detailViewCard.name}
                    className="w-full h-56 object-contain rounded-lg bg-gradient-to-br from-muted to-muted/50"
                    onError={e => { e.currentTarget.src = '/placeholder.svg'; }}
                  />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-3">Overview</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Bank:</span>
                      <span className="font-medium">{detailViewCard.banks?.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Card Type:</span>
                      <span className="font-medium">{detailViewCard.card_type}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Rating:</span>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-semibold">{detailViewCard.rating}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {comparisonSections.map((section) => {
                  const hasData = section.rows.some((row) => {
                    const value = getNestedValue(detailViewCard, row.key);
                    return value && value !== 'N/A' && value !== '';
                  });
                  if (!hasData) return null;
                  return (
                    <div key={section.id}>
                      <h3 className="font-semibold text-lg mb-3">{section.title}</h3>
                      <div className="space-y-4">
                        {section.rows.map((row) => {
                          const value = getNestedValue(detailViewCard, row.key);
                          if (!value || value === 'N/A' || value === '') return null;
                          return (
                            <div key={row.key} className="border-b pb-3 last:border-0">
                              <div className="text-sm font-medium text-muted-foreground mb-1">{row.label}</div>
                              <div className="text-sm">{renderCellValue(detailViewCard, row)}</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}

                <Button className="w-full" size="lg" onClick={() => handleApply(detailViewCard)}>
                  Apply Now
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
      <EligibilityDialog
        open={!!pendingApplyCard}
        onOpenChange={(open) => {
          if (!open) {
            if (!applyEligibilityDone) {
              toast.error('Please complete eligibility check to apply for a card.');
            }
            setPendingApplyCard(null);
          }
        }}
        onEligibilityComplete={() => setApplyEligibilityDone(true)}
        onEligibilityReset={() => setApplyEligibilityDone(false)}
        cardAlias={pendingApplyCard?.seo_card_alias || pendingApplyCard?.card_alias || getCardAlias(pendingApplyCard) || ''}
        cardName={pendingApplyCard?.name || pendingApplyCard?.card_name || ''}
        networkUrl={pendingApplyCard?.network_url || pendingApplyCard?.cg_network_url || pendingApplyCard?.ck_store_url || pendingApplyCard?.card_apply_link || ''}
      />
    </>
  );
}
