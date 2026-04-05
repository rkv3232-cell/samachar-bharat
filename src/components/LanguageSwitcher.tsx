"use client";

import { useSettings } from "@/context/SettingsContext";
import { Languages } from "lucide-react";
import { useState, useRef, useEffect } from "react";

export default function LanguageSwitcher() {
    const { language, setLanguage } = useSettings();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close on out-click
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const toggleLang = (lang: string) => {
        setLanguage(lang);
        setIsOpen(false);
        // We do a hard reload to ensure all static components using translations re-render correctly
        // Or we let React handle it dynamically since it's using Context hooks. Try dynamic first!
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-1.5 p-2 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors"
                aria-label="Select Language"
            >
                <Languages className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                <span className="text-xs font-bold uppercase text-gray-700 dark:text-gray-300">
                    {language === 'hi' ? 'HI' : 'EN'}
                </span>
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-32 bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-100 dark:border-gray-800 py-1 z-50">
                    <button
                        onClick={() => toggleLang('hi')}
                        className={`w-full text-left px-4 py-2 text-sm transition-colors ${language === 'hi' ? 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400 font-bold' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                    >
                        हिन्दी (Hindi)
                    </button>
                    <button
                        onClick={() => toggleLang('en')}
                        className={`w-full text-left px-4 py-2 text-sm transition-colors ${language === 'en' ? 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400 font-bold' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                    >
                        English
                    </button>
                </div>
            )}
        </div>
    );
}
