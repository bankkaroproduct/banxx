import ReactGA from "react-ga4";
import { brandConfig } from "@/config/brand.config";

// Event Categories
export type EventCategory =
    | 'Navigation'
    | 'Card'
    | 'Genius'
    | 'BeatMyCard'
    | 'Discovery'
    | 'Engagement';

// Typed event interfaces for type safety
interface BaseEvent {
    category: EventCategory;
    action: string;
    label?: string;
    value?: number;
    nonInteraction?: boolean;
}

class AnalyticsService {
    private isInitialized = false;
    private partnerName = brandConfig.name;

    constructor() {
        this.init();
    }

    init() {
        // Guard against server-side rendering
        if (typeof window === 'undefined') return;

        const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

        if (measurementId && !this.isInitialized) {
            try {
                ReactGA.initialize(measurementId);

                // Set partner_name as a user property or persistent parameter
                // Note: In GA4, custom dimensions are often set via event params, 
                // but 'set' works for persistent params in the session.
                ReactGA.set({ partner_name: this.partnerName });

                this.isInitialized = true;
                if (process.env.NODE_ENV !== 'production') {
                    console.log(`Analytics initialized for ${this.partnerName}`);
                }
            } catch (error) {
                console.warn('Analytics initialization failed (likely due to ad blocker or restricted storage access):', error);
                // Mark as initialized to prevent repeated failures, but effectively disabled
                this.isInitialized = false;
            }
        } else if (!measurementId) {
            console.warn('Analytics: NEXT_PUBLIC_GA_MEASUREMENT_ID not found');
        }
    }

    // --- Core Tracking ---

    trackPageView(path: string) {
        if (!this.isInitialized) return;

        ReactGA.send({
            hitType: "pageview",
            page: path,
            partner_name: this.partnerName
        });
    }

    trackEvent(event: BaseEvent) {
        if (!this.isInitialized) {
            // Log to console in dev mode for debugging
            if (process.env.NODE_ENV !== 'production') {
                console.log('[Analytics]', event);
            }
            return;
        }

        ReactGA.event({
            category: event.category,
            action: event.action,
            label: event.label,
            value: event.value,
            nonInteraction: event.nonInteraction,
            // Custom dimension for all events
            partner_name: this.partnerName
        } as any);
    }

    // --- Helper Methods using the Event Schema ---

    // 1. Navigation
    trackMenuClick(linkName: string) {
        this.trackEvent({
            category: 'Navigation',
            action: 'Click',
            label: linkName
        });
    }

    trackFooterClick(linkName: string) {
        this.trackEvent({
            category: 'Navigation',
            action: 'Footer Click',
            label: linkName
        });
    }

    // 2. Card Interactions (High Value)
    trackCardAction(action: 'View Details' | 'Check Eligibility' | 'Apply Now' | 'Video Play' | 'Compare', cardName: string) {
        this.trackEvent({
            category: 'Card',
            action: action,
            label: cardName
        });
    }

    // 3. Card Genius (Quiz)
    trackGeniusStart(category: string) {
        this.trackEvent({
            category: 'Genius',
            action: 'Start',
            label: category
        });
    }

    trackGeniusStep(questionField: string, answerValue?: string | number) {
        this.trackEvent({
            category: 'Genius',
            action: 'Answer',
            label: questionField,
            value: typeof answerValue === 'number' ? answerValue : undefined
        });
    }

    trackGeniusComplete(category: string, resultCount: number) {
        this.trackEvent({
            category: 'Genius',
            action: 'Complete',
            label: category,
            value: resultCount
        });
    }

    trackGeniusResultClick(cardName: string) {
        this.trackEvent({
            category: 'Genius',
            action: 'Result Click',
            label: cardName
        });
    }

    // 4. Beat My Card (Comparison)
    trackBeatStart(initialCard?: string) {
        this.trackEvent({
            category: 'BeatMyCard',
            action: 'Start',
            label: initialCard
        });
    }

    trackBeatSelect(cardName: string) {
        this.trackEvent({
            category: 'BeatMyCard',
            action: 'Select Current',
            label: cardName
        });
    }

    trackBeatCompare(userCard: string, geniusCard: string, savings: number) {
        this.trackEvent({
            category: 'BeatMyCard',
            action: 'Compare',
            label: `${userCard} vs ${geniusCard}`,
            value: savings
        });
    }

    // 5. Discovery
    trackCollectionClick(collectionName: string) {
        this.trackEvent({
            category: 'Discovery',
            action: 'Collection Click',
            label: collectionName
        });
    }

    trackSearch(query: string) {
        this.trackEvent({
            category: 'Discovery',
            action: 'Search',
            label: query
        });
    }

    trackFilterChange(filterType: string, value: string) {
        this.trackEvent({
            category: 'Discovery',
            action: 'Filter Change',
            label: `${filterType}: ${value}`
        });
    }
}

export const analytics = new AnalyticsService();
