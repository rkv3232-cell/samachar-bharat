'use client';

interface BreakingTickerProps {
    headlines: string[];
}

export default function BreakingTicker({ headlines }: BreakingTickerProps) {
    if (!headlines || headlines.length === 0) return null;

    // Repeat headlines so ticker never shows empty space
    const repeated = [...headlines, ...headlines, ...headlines];

    return (
        <div className="bg-gray-900 text-white flex items-center overflow-hidden h-9 border-b border-gray-800">
            {/* Label */}
            <div className="flex-shrink-0 flex items-center gap-2 bg-red-600 h-full px-4 z-10 shadow-lg">
                <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                <span className="text-xs font-black uppercase tracking-widest whitespace-nowrap">ब्रेकिंग न्यूज़</span>
            </div>

            {/* Scrolling content */}
            <div className="flex-1 overflow-hidden relative">
                <div className="ticker-track py-1">
                    {repeated.map((headline, i) => (
                        <span key={i} className="text-sm font-medium text-gray-200 mx-8">
                            <span className="text-red-400 mr-2">▸</span>
                            {headline}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
}
