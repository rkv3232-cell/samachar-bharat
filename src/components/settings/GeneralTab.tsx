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
        <div className="space-y-3.5">
            {/* Site Name */}
            <div>
                <label className="mb-1 block text-xs font-semibold text-gray-700">
                    Site Name
                </label>
                <input
                    type="text"
                    value={settings.siteName}
                    onChange={(e) => onChange({ siteName: e.target.value })}
                    className="h-8 w-full rounded-lg border border-gray-200 bg-white px-3 text-xs text-gray-900 outline-none transition-all focus:border-red-500 focus:ring-1 focus:ring-red-500"
                    placeholder="Enter site name"
                />
            </div>

            {/* Contact Email */}
            <div>
                <label className="mb-1 block text-xs font-semibold text-gray-700">
                    Contact Email
                </label>
                <input
                    type="email"
                    value={settings.contactEmail}
                    onChange={(e) => onChange({ contactEmail: e.target.value })}
                    className="h-8 w-full rounded-lg border border-gray-200 bg-white px-3 text-xs text-gray-900 outline-none transition-all focus:border-red-500 focus:ring-1 focus:ring-red-500"
                    placeholder="admin@example.com"
                />
            </div>

            {/* Facebook URL */}
            <div>
                <label className="mb-1 block text-xs font-semibold text-gray-700">
                    Facebook Profile URL
                </label>
                <input
                    type="url"
                    value={settings.facebookUrl || ""}
                    onChange={(e) => onChange({ facebookUrl: e.target.value })}
                    className="h-8 w-full rounded-lg border border-gray-200 bg-white px-3 text-xs text-gray-900 outline-none transition-all focus:border-red-500 focus:ring-1 focus:ring-red-500"
                    placeholder="https://facebook.com/..."
                />
            </div>

            {/* Instagram URL */}
            <div>
                <label className="mb-1 block text-xs font-semibold text-gray-700">
                    Instagram Profile URL
                </label>
                <input
                    type="url"
                    value={settings.instagramUrl || ""}
                    onChange={(e) => onChange({ instagramUrl: e.target.value })}
                    className="h-8 w-full rounded-lg border border-gray-200 bg-white px-3 text-xs text-gray-900 outline-none transition-all focus:border-red-500 focus:ring-1 focus:ring-red-500"
                    placeholder="https://instagram.com/..."
                />
            </div>

            {/* Logo Upload */}
            <div>
                <label className="mb-1 block text-xs font-semibold text-gray-700">
                    Site Logo
                </label>

                {settings.logoUrl ? (
                    <div className="relative inline-block">
                        <Image
                            src={settings.logoUrl}
                            alt="Logo"
                            width={90}
                            height={90}
                            className="rounded-lg border border-gray-200 object-contain"
                        />
                        <button
                            onClick={() => onChange({ logoUrl: "" })}
                            className="absolute -right-1.5 -top-1.5 rounded-full bg-red-500 p-0.5 text-white shadow-sm transition-transform hover:scale-110"
                        >
                            <X size={12} />
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={() => fileRef.current?.click()}
                        disabled={uploading}
                        className="flex h-20 w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-200 text-xs text-gray-500 transition-colors hover:border-red-400 hover:bg-red-50/30"
                    >
                        {uploading ? (
                            <>
                                <Loader2 size={16} className="animate-spin" />
                                Uploading...
                            </>
                        ) : (
                            <>
                                <Upload size={16} />
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
