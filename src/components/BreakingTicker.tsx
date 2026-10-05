'use client';

import { useState, useEffect, useRef } from 'react';

interface BreakingTickerProps {
    headlines?: string[];
}

const DEFAULT_BREAKING: string[] = [
    'मऊ में भीषण सड़क हादसा: राहत और बचाव कार्य जारी',
    'उत्तर प्रदेश: नई विकास परियोजनाओं को मिली कैबिनेट से मंजूरी',
    'मौसम अपडेट: पूर्वांचल में अगले 48 घंटों में बारिश की संभावना',
    'देश: डिजिटल भारत मिशन के तहत ग्रामीण क्षेत्रों में नई सुविधाएं शुरू',
    'सटीक, निष्पक्ष और सबसे पहले — समाचार भारत पर ताज़ा अपडेट्स'
];

const CACHE_KEY = 'sb_breaking_headlines_v2';
const CACHE_TIME = 5 * 60 * 1000; // 5 minutes fresh

export default function BreakingTicker({ headlines }: BreakingTickerProps) {
    // 1. Initialize immediately with provided headlines or fallbacks
    const [items, setItems] = useState<string[]>(() => {
        if (headlines && headlines.length > 0) return headlines;
        return DEFAULT_BREAKING;
    });

    const [isPaused, setIsPaused] = useState(false);
    const [durationSec, setDurationSec] = useState(35);
    const trackRef = useRef<HTMLDivElement>(null);
    const sequenceRef = useRef<HTMLDivElement>(null);

    // 2. Hydrate from localStorage or update cache with SSR props
    useEffect(() => {
        if (headlines && headlines.length > 0) {
            setItems(headlines);
            try {
                localStorage.setItem(
                    CACHE_KEY,
                    JSON.stringify({ data: headlines, timestamp: Date.now() })
                );
            } catch {
                // Ignore storage error
            }
            return;
        }

        // If no props passed, read from cached breaking headlines
        try {
            const cached = localStorage.getItem(CACHE_KEY);
            if (cached) {
                const parsed = JSON.parse(cached);
                if (parsed.data && parsed.data.length > 0) {
                    setItems(parsed.data);
                }
            }
        } catch {
            // Ignore cache error
        }

        // Stale-while-revalidate: Fetch fresh headlines in background
        const fetchFreshBreaking = async () => {
            try {
                const res = await fetch('/api/news?limit=6');
                if (!res.ok) return;
                const json = await res.json();
                const rawArticles = json.articles || (Array.isArray(json) ? json : []);
                if (rawArticles && rawArticles.length > 0) {
                    const titles: string[] = rawArticles.map((a: any) => a.title).filter(Boolean);
                    if (titles.length > 0) {
                        setItems(titles);
                        try {
                            localStorage.setItem(
                                CACHE_KEY,
                                JSON.stringify({ data: titles, timestamp: Date.now() })
                            );
                        } catch {
                            // Ignore storage error
                        }
                    }
                }
            } catch {
                // Quiet fallback, maintain current items
            }
        };

        fetchFreshBreaking();
    }, [headlines]);

    // 3. Calculate readable duration: ~50-60 pixels per second based on measured sequence width
    useEffect(() => {
        if (!sequenceRef.current) return;

        const updateSpeed = () => {
            if (!sequenceRef.current) return;
            const width = sequenceRef.current.offsetWidth || 1500;
            // 50 pixels per second = comfortable, natural Hindi reading speed
            const readableDuration = Math.max(20, Math.round(width / 52));
            setDurationSec(readableDuration);
        };

        updateSpeed();

        const resizeObserver = new ResizeObserver(() => {
            updateSpeed();
        });

        if (sequenceRef.current) {
            resizeObserver.observe(sequenceRef.current);
        }

        return () => resizeObserver.disconnect();
    }, [items]);

    const activeList = items.length > 0 ? items : DEFAULT_BREAKING;

    return (
        <aside
            aria-label="ताज़ा ब्रेकिंग न्यूज़"
            className="bg-red-50/90 border-b border-red-100 text-gray-900 flex items-center overflow-hidden h-8 select-none"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            onTouchStart={() => setIsPaused(true)}
            onTouchEnd={() => setIsPaused(false)}
        >
            {/* Red Breaking Label - Fixed and sharp */}
            <div className="flex-shrink-0 flex items-center gap-1.5 bg-red-600 text-white h-full px-3 z-10 shadow-xs">
                <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                <span className="text-[11px] font-black uppercase tracking-wider whitespace-nowrap">
                    ब्रेकिंग न्यूज़
                </span>
            </div>

            {/* Seamless scrolling marquee track */}
            <div className="flex-1 overflow-hidden relative h-full flex items-center">
                <div
                    ref={trackRef}
                    className={`ticker-track py-0.5 ${isPaused ? 'paused' : ''}`}
                    style={{ '--ticker-duration': `${durationSec}s` } as React.CSSProperties}
                >
                    {/* Sequence 1: Immediately starts at translateX(0) */}
                    <div ref={sequenceRef} className="inline-flex items-center shrink-0">
                        {activeList.map((headline, i) => (
                            <span
                                key={`seq1-${i}`}
                                className="text-xs md:text-[13px] font-semibold text-gray-800 mx-5 inline-flex items-center"
                            >
                                <span className="text-red-500 mr-2 font-bold text-xs select-none">▸</span>
                                {headline}
                            </span>
                        ))}
                    </div>

                    {/* Sequence 2: Exact duplicate that smoothly scrolls in from right */}
                    <div className="inline-flex items-center shrink-0" aria-hidden="true">
                        {activeList.map((headline, i) => (
                            <span
                                key={`seq2-${i}`}
                                className="text-xs md:text-[13px] font-semibold text-gray-800 mx-5 inline-flex items-center"
                            >
                                <span className="text-red-500 mr-2 font-bold text-xs select-none">▸</span>
                                {headline}
                            </span>
                        ))}
                    </div>
                </div>
            </div>
        </aside>
    );
}
