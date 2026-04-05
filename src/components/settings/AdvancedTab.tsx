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
        <div className="space-y-8">
            {/* Auto-save toggle */}
            <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
                <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                        Auto-save Settings
                    </p>
                    <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                        Automatically save changes when you modify any setting
                    </p>
                </div>
                <button
                    onClick={() => onChange({ autoSave: !settings.autoSave })}
                    className="text-blue-600 transition-colors hover:text-blue-700 dark:text-blue-400"
                >
                    {settings.autoSave ? (
                        <ToggleRight size={36} />
                    ) : (
                        <ToggleLeft size={36} className="text-gray-400" />
                    )}
                </button>
            </div>

            {/* Cloudinary Info */}
            <div>
                <h4 className="mb-3 flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    <Cloud size={16} />
                    Cloudinary Configuration
                </h4>
                <div className="space-y-2 rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500 dark:text-gray-400">
                            Cloud Name
                        </span>
                        <code className="rounded bg-gray-200 px-2 py-0.5 text-xs dark:bg-gray-700">
                            {process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "Not set"}
                        </code>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500 dark:text-gray-400">Status</span>
                        <span className="flex items-center gap-1 text-xs text-emerald-600">
                            <span className="h-2 w-2 rounded-full bg-emerald-500" />
                            Connected
                        </span>
                    </div>
                </div>
            </div>

            {/* Firebase Info */}
            <div>
                <h4 className="mb-3 flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    <Database size={16} />
                    Firebase Configuration
                </h4>
                <div className="space-y-2 rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500 dark:text-gray-400">
                            Project ID
                        </span>
                        <code className="rounded bg-gray-200 px-2 py-0.5 text-xs dark:bg-gray-700">
                            {process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "Not set"}
                        </code>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500 dark:text-gray-400">Status</span>
                        <span className="flex items-center gap-1 text-xs text-emerald-600">
                            <span className="h-2 w-2 rounded-full bg-emerald-500" />
                            Connected
                        </span>
                    </div>
                </div>
            </div>

            {/* Reset */}
            <div className="border-t border-gray-200 pt-6 dark:border-gray-700">
                <h4 className="text-sm font-medium text-red-600 dark:text-red-400">
                    Danger Zone
                </h4>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    This will reset all settings to their default values.
                </p>
                <button
                    onClick={onReset}
                    className="mt-3 rounded-xl border-2 border-red-200 bg-red-50 px-5 py-2 text-sm font-medium text-red-600 transition-all hover:border-red-300 hover:bg-red-100 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40"
                >
                    Reset All Settings
                </button>
            </div>
        </div>
    );
}
