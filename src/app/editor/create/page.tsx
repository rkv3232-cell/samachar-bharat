// src/app/editor/create/page.tsx
// Editor create post page — reuses the same form as /admin/posts/new
// but redirects back to /editor on success.

"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { addPost, uploadToCloudinary } from "@/lib/posts";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import {
    ChevronLeft,
    Save,
    FileText,
    AlertCircle,
    CheckCircle,
    ImageIcon,
    Video,
    X,
} from "lucide-react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { PostStatus } from "@/types/admin";
import { UserRole } from "@/types/auth.types";

const DEFAULT_CATEGORIES = [
    { name: 'उत्तर प्रदेश', slug: 'uttar-pradesh' },
    { name: 'देश', slug: 'desh' },
    { name: 'विदेश', slug: 'videsh' },
    { name: 'कारोबार', slug: 'karobar' },
    { name: 'क्राइम', slug: 'crime' },
    { name: 'धर्म', slug: 'dharm' },
    { name: 'राजनीति', slug: 'rajniti' },
    { name: 'लाइफस्टाइल', slug: 'lifestyle' },
];

export default function EditorCreatePage() {
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { user, firestoreUser, role } = useAuth();

    const [form, setForm] = useState({
        title: "",
        content: "",
        category: "",
        image: "",
        status: "published" as PostStatus,
        tags: [] as string[],
    });

    const [mediaFile, setMediaFile] = useState<File | null>(null);
    const [mediaPreview, setMediaPreview] = useState("");
    const [uploading, setUploading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [dbCategories, setDbCategories] = useState<{ name: string; slug: string }[]>([]);
    const [tagInput, setTagInput] = useState("");

    useEffect(() => {
        const fetchTaxonomies = async () => {
            try {
                const snap = await getDocs(collection(db, "categories"));
                const firestoreCats = snap.docs.map((d) => d.data() as { name: string; slug: string });

                const defaultSlugs = new Set(DEFAULT_CATEGORIES.map(c => c.slug));
                const extra = firestoreCats.filter(c => !defaultSlugs.has(c.slug));

                setDbCategories([...DEFAULT_CATEGORIES, ...extra]);
            } catch (e) {
                console.error("Failed to load categories", e);
            }
        };
        fetchTaxonomies();
    }, []);

    // Set default status based on role
    useEffect(() => {
        if (role === UserRole.REPORTER) {
            setForm(prev => ({ ...prev, status: 'draft' }));
        }
    }, [role]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 50 * 1024 * 1024) {
            setError("File size 50MB से छोटी होनी चाहिए।");
            return;
        }
        setMediaFile(file);
        setMediaPreview(URL.createObjectURL(file));
        setError("");
    };

    const handleAddTag = () => {
        if (tagInput.trim() && !form.tags.includes(tagInput.trim())) {
            setForm({ ...form, tags: [...form.tags, tagInput.trim()] });
        }
        setTagInput("");
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        if (!form.title.trim()) return setError("Title जरूरी है।");
        if (!form.content.trim()) return setError("Content जरूरी है।");
        if (!form.category) return setError("Category चुनें।");

        setSaving(true);

        try {
            let mediaUrl = form.image;

            if (mediaFile) {
                setUploading(true);
                mediaUrl = await uploadToCloudinary(mediaFile);
                setUploading(false);
            }

            if (!mediaUrl) {
                setSaving(false);
                return setError("Image या Video जरूरी है।");
            }

            await addPost({
                title: form.title.trim(),
                content: form.content.trim(),
                category: form.category,
                image: mediaUrl,
                status: form.status,
                authorId: user?.uid ?? "",
                authorName: firestoreUser?.name ?? user?.email?.split("@")[0] ?? "Editor",
                tags: form.tags,
            });

            setSuccess("Post successfully published!");
            setTimeout(() => router.push("/editor"), 1500);
        } catch (err: unknown) {
            const e = err as Error;
            setError("Error: " + e.message);
            setUploading(false);
        } finally {
            setSaving(false);
        }
    };

    const isVideoUrl = (url: string) =>
        !!(url.match(/\.(mp4|webm|ogg|mov)$/) || url.includes("/video/upload/"));

    return (
        <div>
            <div className="mb-6 flex items-center gap-3">
                <Link href="/editor" className="text-gray-500 transition hover:text-gray-700">
                    <ChevronLeft className="h-5 w-5" />
                </Link>
                <div>
                    <h1 className="text-2xl font-extrabold text-gray-800">नई Post लिखें</h1>
                    <p className="text-sm text-gray-500">Create and publish a new news article</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                    <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
                        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
                        <p className="text-sm text-red-700">{error}</p>
                    </div>
                )}
                {success && (
                    <div className="flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4">
                        <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
                        <p className="text-sm text-green-700">{success}</p>
                    </div>
                )}

                <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
                    {/* Left: Title + Content */}
                    <div className="space-y-5 lg:col-span-2">
                        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                            <label className="mb-2 block text-sm font-semibold text-gray-700">
                                शीर्षक <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={form.title}
                                onChange={(e) => setForm({ ...form, title: e.target.value })}
                                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Post का शीर्षक लिखें..."
                            />
                        </div>

                        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                            <label className="mb-2 block text-sm font-semibold text-gray-700">
                                Content <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                value={form.content}
                                onChange={(e) => setForm({ ...form, content: e.target.value })}
                                rows={14}
                                className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 leading-relaxed text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Post का विवरण लिखें..."
                            />
                        </div>
                    </div>

                    {/* Right: Meta + Media */}
                    <div className="space-y-5">
                        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                            <label className="mb-2 block text-sm font-semibold text-gray-700">
                                Category <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={form.category}
                                onChange={(e) => setForm({ ...form, category: e.target.value })}
                                className="mb-4 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">-- Category चुनें --</option>
                                {dbCategories.map((cat) => (
                                    <option key={cat.slug} value={cat.slug}>
                                        {cat.name}
                                    </option>
                                ))}
                            </select>

                            <label className="mb-2 block text-sm font-semibold text-gray-700">Tags</label>
                            <div className="mb-2 flex flex-wrap gap-2">
                                {form.tags.map((tag) => (
                                    <span
                                        key={tag}
                                        className="flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-sm text-blue-700"
                                    >
                                        {tag}
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setForm({ ...form, tags: form.tags.filter((t) => t !== tag) })
                                            }
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </span>
                                ))}
                            </div>
                            <div className="mb-4 flex gap-2">
                                <input
                                    type="text"
                                    value={tagInput}
                                    onChange={(e) => setTagInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            e.preventDefault();
                                            handleAddTag();
                                        }
                                    }}
                                    className="flex-1 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Tag add करें..."
                                />
                                <button
                                    type="button"
                                    onClick={handleAddTag}
                                    className="rounded-xl bg-gray-200 px-3 text-sm font-medium hover:bg-gray-300"
                                >
                                    Add
                                </button>
                            </div>

                            <label className="mb-2 block text-sm font-semibold text-gray-700">Status</label>
                            <select
                                value={form.status}
                                onChange={(e) => setForm({ ...form, status: e.target.value as PostStatus })}
                                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="published" disabled={role === UserRole.REPORTER}>
                                    Published {role === UserRole.REPORTER && "(Admin/Editor only)"}
                                </option>
                                <option value="draft">Draft</option>
                            </select>
                        </div>

                        {/* Media upload */}
                        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                            <label className="mb-2 block text-sm font-semibold text-gray-700">
                                Media <span className="text-red-500">*</span>
                            </label>

                            {mediaPreview || form.image ? (
                                <div className="relative">
                                    <div className="relative flex h-44 items-center justify-center overflow-hidden rounded-xl bg-black">
                                        {isVideoUrl(mediaPreview || form.image) ? (
                                            <video src={mediaPreview || form.image} controls className="max-h-full" />
                                        ) : (
                                            <img
                                                src={mediaPreview || form.image}
                                                alt="Preview"
                                                className="h-full w-full object-cover"
                                            />
                                        )}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setMediaFile(null);
                                            setMediaPreview("");
                                            setForm({ ...form, image: "" });
                                        }}
                                        className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-red-600 text-white shadow-lg hover:bg-red-700"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="flex h-44 w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-200 transition hover:border-blue-400 hover:bg-blue-50/50"
                                >
                                    <div className="flex gap-2">
                                        <ImageIcon className="h-8 w-8 text-gray-300" />
                                        <Video className="h-8 w-8 text-gray-300" />
                                    </div>
                                    <span className="text-sm font-medium text-gray-400">Upload Image / Video</span>
                                </button>
                            )}
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*,video/*"
                                onChange={handleFileChange}
                                className="hidden"
                            />

                            <div className="mt-3">
                                <label className="mb-1 block text-xs text-gray-500">या URL paste करें</label>
                                <input
                                    type="url"
                                    value={form.image}
                                    onChange={(e) => {
                                        setForm({ ...form, image: e.target.value });
                                        setMediaPreview("");
                                    }}
                                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="https://..."
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={saving || uploading}
                            className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-4 font-bold text-white shadow-lg transition hover:bg-blue-700 hover:shadow-xl disabled:bg-gray-400"
                        >
                            {saving || uploading ? (
                                <>
                                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                                    <span>{uploading ? "Uploading..." : "Saving..."}</span>
                                </>
                            ) : (
                                <>
                                    {form.status === "draft" ? (
                                        <FileText className="h-4 w-4" />
                                    ) : (
                                        <Save className="h-4 w-4" />
                                    )}
                                    {form.status === "draft" ? "Save as Draft" : "Publish करें"}
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}
