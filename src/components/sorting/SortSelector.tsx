'use client';

import { SortOption } from "@/types/sorting";
import { Calendar, Eye, Heart, CodeSquare, ChevronDown, Check } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { SORT_CONFIGS } from "@/lib/queries";
import { useRouter, useSearchParams } from "next/navigation";

interface SortSelectorProps {
    value: SortOption;
    onChange: (val: SortOption) => void;
}

export default function SortSelector({ value, onChange }: SortSelectorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const router = useRouter();
    const searchParams = useSearchParams();

    // Map icons to the SortOptions roughly
    const ICONS: Record<SortOption, React.ReactNode> = {
        "latest": <Calendar className="w-4 h-4 text-gray-500" />,
        "oldest": <Calendar className="w-4 h-4 text-gray-500 scale-y-[-1]" />,
        "most-viewed": <Eye className="w-4 h-4 text-gray-500" />,
        "most-liked": <Heart className="w-4 h-4 text-gray-500" />,
        "a-z": <CodeSquare className="w-4 h-4 text-gray-500" />,
        "z-a": <CodeSquare className="w-4 h-4 text-gray-500 scale-y-[-1]" />
    };

    const currentConfig = Object.values(SORT_CONFIGS).find(c => c.id === value) || SORT_CONFIGS["latest"];

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (option: SortOption) => {
        onChange(option);
        setIsOpen(false);
        // Persist preference and search param
        if (typeof window !== 'undefined') {
            localStorage.setItem('newsportal-sort-pref', option);
            const params = new URLSearchParams(searchParams.toString());
            params.set('sort', option);
            router.replace(`?${params.toString()}`, { scroll: false });
        }
    };

    return (
        <div className="relative inline-block text-left" ref={dropdownRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="inline-flex items-center justify-between w-full md:w-56 gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 shadow-sm rounded-xl hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all"
            >
                <div className="flex items-center gap-2">
                    {ICONS[currentConfig.id]}
                    <span className="truncate">{currentConfig.label}</span>
                </div>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute right-0 z-10 w-full md:w-56 mt-2 origin-top-right bg-white border border-gray-100 rounded-xl shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                    <div className="py-1" role="menu" aria-orientation="vertical">
                        {Object.values(SORT_CONFIGS).map((config) => (
                            <button
                                key={config.id}
                                onClick={() => handleSelect(config.id)}
                                className={`w-full text-left px-4 py-2.5 text-sm flex items-center justify-between group transition-colors ${value === config.id
                                        ? 'bg-red-50 text-red-700 font-semibold'
                                        : 'text-gray-700 hover:bg-gray-50 hover:text-red-600'
                                    }`}
                                role="menuitem"
                            >
                                <div className="flex items-center gap-2">
                                    <span className="opacity-70 group-hover:opacity-100">{ICONS[config.id]}</span>
                                    {config.label}
                                </div>
                                {value === config.id && <Check className="w-4 h-4 text-red-600" />}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
