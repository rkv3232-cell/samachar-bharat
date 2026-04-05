"use client";

import { useState, useRef } from "react";
import { Upload, X, Loader2 } from "lucide-react";
import Image from "next/image";
import type { SiteSettings } from "@/types";
import { uploadToCloudinary } from "@/lib/firebase";

interface Props {
    settings: SiteSettings;
    onChange: (patch: Partial<SiteSettings>) => void;
}

export default function GeneralTab({ settings, onChange }: Props) {
    const fileRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);

    async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            const url = await uploadToCloudinary(file);
            if (url) {
                onChange({ logoUrl: url });
            }
        } catch (err) {
            console.error("Upload failed:", err);
        } finally {
            setUploading(false);
        }
    }

    return (
        <div className="space-y-6">
            {/* Site Name */}
            <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Site Name
                </label>
                <input
                    type="text"
                    value={settings.siteName}
                    onChange={(e) => onChange({ siteName: e.target.value })}
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    placeholder="Enter site name"
                />
            </div>

            {/* Contact Email */}
            <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Contact Email
                </label>
                <input
                    type="email"
                    value={settings.contactEmail}
                    onChange={(e) => onChange({ contactEmail: e.target.value })}
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    placeholder="admin@example.com"
                />
            </div>

            {/* Facebook URL */}
            <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Facebook Profile URL
                </label>
                <input
                    type="url"
                    value={settings.facebookUrl || ""}
                    onChange={(e) => onChange({ facebookUrl: e.target.value })}
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    placeholder="https://facebook.com/..."
                />
            </div>

            {/* Instagram URL */}
            <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Instagram Profile URL
                </label>
                <input
                    type="url"
                    value={settings.instagramUrl || ""}
                    onChange={(e) => onChange({ instagramUrl: e.target.value })}
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    placeholder="https://instagram.com/..."
                />
            </div>

            {/* Logo Upload */}
            <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Site Logo
                </label>

                {settings.logoUrl ? (
                    <div className="relative inline-block">
                        <Image
                            src={settings.logoUrl}
                            alt="Logo"
                            width={120}
                            height={120}
                            className="rounded-xl border border-gray-200 object-contain dark:border-gray-700"
                        />
                        <button
                            onClick={() => onChange({ logoUrl: "" })}
                            className="absolute -right-2 -top-2 rounded-full bg-red-500 p-1 text-white shadow-lg transition-transform hover:scale-110"
                        >
                            <X size={14} />
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={() => fileRef.current?.click()}
                        disabled={uploading}
                        className="flex h-32 w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 text-sm text-gray-500 transition-colors hover:border-blue-400 hover:bg-blue-50 dark:border-gray-600 dark:hover:border-blue-500 dark:hover:bg-blue-900/20"
                    >
                        {uploading ? (
                            <>
                                <Loader2 size={20} className="animate-spin" />
                                Uploading...
                            </>
                        ) : (
                            <>
                                <Upload size={20} />
                                Click to upload logo
                            </>
                        )}
                    </button>
                )}

                <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleLogoUpload}
                />
            </div>
        </div>
    );
}
