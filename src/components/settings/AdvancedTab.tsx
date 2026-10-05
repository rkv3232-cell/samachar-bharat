"use client";

import { Cloud, Database, ToggleLeft, ToggleRight } from "lucide-react";
import type { SiteSettings } from "@/types";

interface Props {
    settings: SiteSettings;
    onChange: (patch: Partial<SiteSettings>) => void;
    onReset: () => void;
}

export default function AdvancedTab({ settings, onChange, onReset }: Props) {
    return (
        <div className="space-y-4">
            {/* Auto-save toggle */}
            <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50/50 p-3">
                <div>
                    <p className="text-xs font-bold text-gray-900">
                        Auto-save Settings
                    </p>
                    <p className="mt-0.5 text-[11px] text-gray-500">
                        Automatically save changes when you modify any setting
                    </p>
                </div>
                <button
                    onClick={() => onChange({ autoSave: !settings.autoSave })}
                    className="text-blue-600 transition-colors hover:text-blue-700"
                >
                    {settings.autoSave ? (
                        <ToggleRight size={28} />
                    ) : (
                        <ToggleLeft size={28} className="text-gray-400" />
                    )}
                </button>
            </div>

            {/* Cloudinary Info */}
            <div>
                <h4 className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-gray-700">
                    <Cloud size={14} />
                    Cloudinary Configuration
                </h4>
                <div className="space-y-1.5 rounded-lg border border-gray-200 bg-gray-50/50 p-3">
                    <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500">
                            Cloud Name
                        </span>
                        <code className="rounded bg-gray-200 px-1.5 py-0.5 text-[11px]">
                            {process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "Not set"}
                        </code>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500">Status</span>
                        <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            Connected
                        </span>
                    </div>
                </div>
            </div>

            {/* Firebase Info */}
            <div>
                <h4 className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-gray-700">
                    <Database size={14} />
                    Firebase Configuration
                </h4>
                <div className="space-y-1.5 rounded-lg border border-gray-200 bg-gray-50/50 p-3">
                    <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500">
                            Project ID
                        </span>
                        <code className="rounded bg-gray-200 px-1.5 py-0.5 text-[11px]">
                            {process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "Not set"}
                        </code>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500">Status</span>
                        <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            Connected
                        </span>
                    </div>
                </div>
            </div>

            {/* Reset */}
            <div className="border-t border-gray-200 pt-3">
                <h4 className="text-xs font-bold text-red-600">
                    Danger Zone
                </h4>
                <p className="mt-0.5 text-[11px] text-gray-500">
                    This will reset all settings to their default values.
                </p>
                <button
                    onClick={onReset}
                    className="mt-2 h-8 rounded-lg border border-red-200 bg-red-50 px-3 text-xs font-bold text-red-600 transition-all hover:bg-red-100 active:scale-95"
                >
                    Reset All Settings
                </button>
            </div>
        </div>
    );
}
