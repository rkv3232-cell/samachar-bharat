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
        <div className="space-y-3.5 max-w-4xl">
            <Toaster position="top-right" />

            {/* ── Header ── */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="flex items-center gap-2 text-lg font-extrabold text-gray-900 tracking-tight">
                        <div className="rounded-lg bg-purple-50 p-1.5 text-purple-600">
                            <Settings size={18} />
                        </div>
                        Settings
                    </h1>
                    <p className="text-xs text-gray-500">
                        Manage your website configuration
                    </p>
                </div>

                {/* Save Button */}
                {settings && !settings.autoSave && (
                    <button
                        onClick={handleSave}
                        disabled={saving || !hasChanges || !isOwner}
                        className="h-8 flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 text-xs font-bold text-white shadow-xs transition-all hover:bg-blue-700 disabled:opacity-50 active:scale-95"
                    >
                        {!isOwner ? (
                            <>
                                <Lock size={13} />
                                Owner Only
                            </>
                        ) : saving ? (
                            <>
                                <Loader2 size={13} className="animate-spin" />
                                Saving...
                            </>
                        ) : hasChanges ? (
                            <>
                                <Save size={13} />
                                Save Changes
                            </>
                        ) : (
                            <>
                                <Check size={13} />
                                Saved
                            </>
                        )}
                    </button>
                )}
            </div>

            {/* Role Block Banner */}
            {!isOwner && !loading && (
                <div className="rounded-lg border border-red-100 bg-red-50 p-3 flex items-center gap-2.5 text-red-700">
                    <Lock size={16} className="shrink-0" />
                    <div>
                        <p className="font-bold text-xs">Owner Mode Required</p>
                        <p className="text-[11px] opacity-80">You can view these settings, but only the Owner can modify them.</p>
                    </div>
                </div>
            )}

                {/* ── Loading ── */}
                {loading && <FormSkeleton />}

            {/* ── Content ── */}
            {settings && (
                <div className="overflow-hidden rounded-xl border border-gray-200/90 bg-white shadow-2xs">
                    {/* Tabs */}
                    <div className="border-b border-gray-100 bg-gray-50/50">
                        <div className="flex">
                            {TABS.map((tab) => (
                                <button
                                    key={tab.key}
                                    onClick={() => setActiveTab(tab.key)}
                                    className={`relative px-4 py-2 text-xs font-semibold transition-colors ${activeTab === tab.key
                                        ? "text-blue-600 font-bold bg-white"
                                        : "text-gray-500 hover:text-gray-700 hover:bg-gray-100/50"
                                        }`}
                                >
                                    {tab.label}
                                    {activeTab === tab.key && (
                                        <span className="absolute bottom-0 left-0 h-0.5 w-full bg-blue-600" />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Tab content */}
                    <div className={`p-4 sm:p-5 ${!isOwner ? 'pointer-events-none opacity-80 select-none' : ''}`}>
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
                <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 shadow-lg">
                    <p className="flex items-center gap-2 text-xs font-semibold text-amber-800">
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500" />
                        You have unsaved changes
                        <button
                            onClick={handleSave}
                            className="ml-2.5 rounded-lg bg-amber-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-amber-700 active:scale-95"
                        >
                            Save now
                        </button>
                    </p>
                </div>
            )}
        </div>
    );
}
