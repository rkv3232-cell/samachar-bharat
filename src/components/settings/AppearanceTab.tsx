"use client";

import { Palette, Globe } from "lucide-react";
import type { SiteSettings } from "@/types";

interface Props {
    settings: SiteSettings;
    onChange: (patch: Partial<SiteSettings>) => void;
}

const colorOptions = [
    { name: "Samachar Red", value: "#dc2626" },
    { name: "Blue", value: "#2563eb" },
    { name: "Emerald", value: "#059669" },
    { name: "Purple", value: "#7c3aed" },
    { name: "Rose", value: "#e11d48" },
    { name: "Orange", value: "#ea580c" },
    { name: "Cyan", value: "#0891b2" },
];

export default function AppearanceTab({ settings, onChange }: Props) {
    return (
        <div className="space-y-4">
            {/* Primary Accent Color */}
            <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-gray-800">
                    <Palette size={14} className="text-red-600" />
                    Primary Accent Color
                </label>
                <p className="text-[11px] text-gray-500 mb-2">
                    Select the main brand color used across buttons, links, and highlights.
                </p>
                <div className="flex flex-wrap gap-2">
                    {colorOptions.map((color) => {
                        const isSelected = settings.primaryColor === color.value;
                        return (
                            <button
                                key={color.value}
                                type="button"
                                onClick={() => onChange({ primaryColor: color.value })}
                                className={`h-8 flex items-center gap-2 rounded-lg border px-2.5 text-xs font-semibold transition-all active:scale-95 ${
                                    isSelected
                                        ? "border-gray-900 bg-gray-50 text-gray-900 shadow-2xs font-bold ring-1 ring-gray-900/10"
                                        : "border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50"
                                }`}
                            >
                                <span
                                    className="h-3.5 w-3.5 rounded-full shadow-inner ring-1 ring-black/10"
                                    style={{ backgroundColor: color.value }}
                                />
                                {color.name}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Language */}
            <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-gray-800">
                    <Globe size={14} className="text-blue-600" />
                    Platform Default Language
                </label>
                <div className="grid grid-cols-2 gap-2 max-w-sm">
                    <button
                        type="button"
                        onClick={() => onChange({ language: "hi" })}
                        className={`h-9 rounded-lg border px-3 text-xs font-bold transition-all active:scale-95 ${
                            settings.language === "hi"
                                ? "border-red-600 bg-red-50 text-red-700 shadow-2xs ring-1 ring-red-600/10"
                                : "border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50"
                        }`}
                    >
                        🇮🇳 हिन्दी (Hindi)
                    </button>
                    <button
                        type="button"
                        onClick={() => onChange({ language: "en" })}
                        className={`h-9 rounded-lg border px-3 text-xs font-bold transition-all active:scale-95 ${
                            settings.language === "en"
                                ? "border-red-600 bg-red-50 text-red-700 shadow-2xs ring-1 ring-red-600/10"
                                : "border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50"
                        }`}
                    >
                        🌐 English
                    </button>
                </div>
            </div>
        </div>
    );
}
