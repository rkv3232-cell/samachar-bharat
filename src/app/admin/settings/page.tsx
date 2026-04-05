"use client";

import { useState, useEffect, useCallback, useRef } from "react";

import { Settings, Save, Loader2, Check, Lock } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { useAuth } from "@/context/AuthContext";

import {
    fetchSettings,
    saveSettings,
    resetSettings,
    DEFAULT_SETTINGS,
} from "@/lib/firestore";
import type { SiteSettings } from "@/types";

import GeneralTab from "@/components/settings/GeneralTab";
import AppearanceTab from "@/components/settings/AppearanceTab";
import AdvancedTab from "@/components/settings/AdvancedTab";
import { FormSkeleton } from "@/components/ui/Skeleton";

const TABS = [
    { key: "general", label: "General" },
    { key: "appearance", label: "Appearance" },
    { key: "advanced", label: "Advanced" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export default function SettingsPage() {
    const { isOwner } = useAuth();
    const [settings, setSettings] = useState<SiteSettings | null>(null);
    const [activeTab, setActiveTab] = useState<TabKey>("general");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);
    const originalRef = useRef<SiteSettings | null>(null);
    const autoSaveTimer = useRef<NodeJS.Timeout | null>(null);

    // ── Load ──
    useEffect(() => {
        (async () => {
            try {
                const s = await fetchSettings();
                setSettings(s);
                originalRef.current = { ...s };
            } catch (err) {
                console.error(err);
                toast.error("Failed to load settings");
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    // ── Patch handler ──
    const handleChange = useCallback(
        (patch: Partial<SiteSettings>) => {
            setSettings((prev) => {
                if (!prev) return prev;
                const next = { ...prev, ...patch };
                setHasChanges(true);

                // Auto-save logic
                if (next.autoSave) {
                    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
                    autoSaveTimer.current = setTimeout(async () => {
                        try {
                            await saveSettings(next);
                            originalRef.current = { ...next };
                            setHasChanges(false);
                            toast.success("Auto-saved!", { duration: 1500 });
                        } catch {
                            toast.error("Auto-save failed");
                        }
                    }, 1500);
                }

                return next;
            });
        },
        []
    );

    // ── Manual Save ──
    const handleSave = async () => {
        if (!settings) return;
        setSaving(true);
        try {
            await saveSettings(settings);
            originalRef.current = { ...settings };
            setHasChanges(false);
            toast.success("Settings saved successfully!");
        } catch (err) {
            toast.error("Failed to save settings");
        } finally {
            setSaving(false);
        }
    };

    // ── Reset ──
    const handleReset = async () => {
        if (!confirm("Are you sure you want to reset all settings to defaults?"))
            return;
        setSaving(true);
        try {
            await resetSettings();
            setSettings({ ...DEFAULT_SETTINGS });
            originalRef.current = { ...DEFAULT_SETTINGS };
            setHasChanges(false);
            toast.success("Settings reset to defaults");
        } catch {
            toast.error("Failed to reset settings");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <Toaster position="top-right" />

            <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
                {/* ── Header ── */}
                <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="flex items-center gap-3 text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">
                            <div className="rounded-xl bg-purple-100 p-2 text-purple-600 dark:bg-purple-900/40 dark:text-purple-400">
                                <Settings size={28} />
                            </div>
                            Settings
                        </h1>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            Manage your website configuration
                        </p>
                    </div>

                    {/* Save Button */}
                    {settings && !settings.autoSave && (
                        <button
                            onClick={handleSave}
                            disabled={saving || !hasChanges || !isOwner}
                            className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-medium text-white shadow-lg shadow-blue-600/25 transition-all hover:bg-blue-700 disabled:opacity-50 disabled:shadow-none"
                        >
                            {!isOwner ? (
                                <>
                                    <Lock size={16} />
                                    Owner Only
                                </>
                            ) : saving ? (
                                <>
                                    <Loader2 size={16} className="animate-spin" />
                                    Saving...
                                </>
                            ) : hasChanges ? (
                                <>
                                    <Save size={16} />
                                    Save Changes
                                </>
                            ) : (
                                <>
                                    <Check size={16} />
                                    Saved
                                </>
                            )}
                        </button>
                    )}
                </div>

                {/* Role Block Banner */}
                {!isOwner && !loading && (
                    <div className="mb-6 rounded-xl border border-red-100 bg-red-50 p-4 flex items-center gap-3 text-red-700">
                        <Lock size={20} className="shrink-0" />
                        <div>
                            <p className="font-bold text-sm">Owner Mode Required</p>
                            <p className="text-xs opacity-80">You can view these settings, but only the Owner can modify them.</p>
                        </div>
                    </div>
                )}

                {/* ── Loading ── */}
                {loading && <FormSkeleton />}

                {/* ── Content ── */}
                {settings && (
                    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
                        {/* Tabs */}
                        <div className="border-b border-gray-200 dark:border-gray-700">
                            <div className="flex">
                                {TABS.map((tab) => (
                                    <button
                                        key={tab.key}
                                        onClick={() => setActiveTab(tab.key)}
                                        className={`relative px-6 py-4 text-sm font-medium transition-colors ${activeTab === tab.key
                                            ? "text-blue-600 dark:text-blue-400"
                                            : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                            }`}
                                    >
                                        {tab.label}
                                        {activeTab === tab.key && (
                                            <span className="absolute bottom-0 left-0 h-0.5 w-full bg-blue-600 dark:bg-blue-400" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Tab content */}
                        <div className={`p-6 sm:p-8 ${!isOwner ? 'pointer-events-none opacity-80 select-none' : ''}`}>
                            {activeTab === "general" && (
                                <GeneralTab settings={settings} onChange={handleChange} />
                            )}
                            {activeTab === "appearance" && (
                                <AppearanceTab settings={settings} onChange={handleChange} />
                            )}
                            {activeTab === "advanced" && (
                                <AdvancedTab
                                    settings={settings}
                                    onChange={handleChange}
                                    onReset={handleReset}
                                />
                            )}
                        </div>
                    </div>
                )}

                {/* Unsaved banner */}
                {hasChanges && settings && !settings.autoSave && (
                    <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-2xl border border-amber-200 bg-amber-50 px-6 py-3 shadow-xl dark:border-amber-800 dark:bg-amber-900/30">
                        <p className="flex items-center gap-2 text-sm font-medium text-amber-700 dark:text-amber-300">
                            <span className="h-2 w-2 animate-pulse rounded-full bg-amber-500" />
                            You have unsaved changes
                            <button
                                onClick={handleSave}
                                className="ml-3 rounded-lg bg-amber-600 px-3 py-1 text-xs text-white hover:bg-amber-700"
                            >
                                Save now
                            </button>
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
