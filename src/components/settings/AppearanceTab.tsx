"use client";

import { Sun, Moon, Palette } from "lucide-react";
import type { SiteSettings } from "@/types";

interface Props {
    settings: SiteSettings;
    onChange: (patch: Partial<SiteSettings>) => void;
}

const colorOptions = [
    { name: "Blue", value: "#2563eb" },
    { name: "Emerald", value: "#059669" },
    { name: "Purple", value: "#7c3aed" },
    { name: "Rose", value: "#e11d48" },
    { name: "Orange", value: "#ea580c" },
    { name: "Cyan", value: "#0891b2" },
];

export default function AppearanceTab({ settings, onChange }: Props) {
    return (
        <div className="space-y-8">
            {/* Theme Toggle */}
            <div>
                <label className="mb-3 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Theme
                </label>
                <div className="grid grid-cols-2 gap-3">
                    <button
                        onClick={() => onChange({ theme: "light" })}
                        className={`flex items-center justify-center gap-2 rounded-xl border-2 px-4 py-4 text-sm font-medium transition-all ${settings.theme === "light"
                                ? "border-blue-500 bg-blue-50 text-blue-700 shadow-md dark:bg-blue-900/30 dark:text-blue-400"
                                : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                            }`}
                    >
                        <Sun size={20} />
                        Light Mode
                    </button>
                    <button
                        onClick={() => onChange({ theme: "dark" })}
                        className={`flex items-center justify-center gap-2 rounded-xl border-2 px-4 py-4 text-sm font-medium transition-all ${settings.theme === "dark"
                                ? "border-blue-500 bg-blue-50 text-blue-700 shadow-md dark:bg-blue-900/30 dark:text-blue-400"
                                : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                            }`}
                    >
                        <Moon size={20} />
                        Dark Mode
                    </button>
                </div>
            </div>

            {/* Primary Color */}
            <div>
                <label className="mb-3 flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    <Palette size={16} />
                    Primary Color
                </label>
                <div className="flex flex-wrap gap-3">
                    {colorOptions.map((color) => (
                        <button
                            key={color.value}
                            onClick={() => onChange({ primaryColor: color.value })}
                            className={`group flex items-center gap-2 rounded-xl border-2 px-4 py-2.5 text-sm transition-all ${settings.primaryColor === color.value
                                    ? "border-gray-900 shadow-md dark:border-white"
                                    : "border-gray-200 hover:border-gray-400 dark:border-gray-700"
                                }`}
                        >
                            <span
                                className="h-5 w-5 rounded-full shadow-inner"
                                style={{ backgroundColor: color.value }}
                            />
                            {color.name}
                        </button>
                    ))}
                </div>
            </div>

            {/* Language */}
            <div>
                <label className="mb-3 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Language
                </label>
                <div className="grid grid-cols-2 gap-3">
                    <button
                        onClick={() => onChange({ language: "en" })}
                        className={`rounded-xl border-2 px-4 py-3 text-sm font-medium transition-all ${settings.language === "en"
                                ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                                : "border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300"
                            }`}
                    >
                        🇺🇸 English
                    </button>
                    <button
                        onClick={() => onChange({ language: "hi" })}
                        className={`rounded-xl border-2 px-4 py-3 text-sm font-medium transition-all ${settings.language === "hi"
                                ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                                : "border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300"
                            }`}
                    >
                        🇮🇳 हिन्दी
                    </button>
                </div>
            </div>
        </div>
    );
}
