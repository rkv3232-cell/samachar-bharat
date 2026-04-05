'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getPostById, updatePost, uploadToCloudinary } from '@/lib/posts';
import { PostStatus } from '@/types/admin';
import { UserRole } from '@/types/auth.types';
import { useAuth } from '@/context/AuthContext';
import { Save, ChevronLeft, ImageIcon, X, AlertCircle, CheckCircle, Video, FileText, Sparkles, Loader2 } from 'lucide-react';
import Link from 'next/link';
import LoadingSpinner from '@/components/LoadingSpinner';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

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

export default function EditPostPage() {
    const { id } = useParams() as { id: string };
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { role } = useAuth();

    const [form, setForm] = useState({
        title: '',
        content: '',
        category: '',
        image: '',
        status: 'published' as PostStatus,
        tags: [] as string[]
    });
    const [mediaFile, setMediaFile] = useState<File | null>(null);
    const [mediaPreview, setMediaPreview] = useState('');
    const [isSliderVideo, setIsSliderVideo] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [generatingAI, setGeneratingAI] = useState(false);
    const [translatingAI, setTranslatingAI] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [tagInput, setTagInput] = useState('');
    const [dbCategories, setDbCategories] = useState<{ name: string; slug: string }[]>([]);

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

        const fetchPost = async () => {
            try {
                const post = await getPostById(id);
                if (!post) { router.push('/editor/posts'); return; }
                setForm({
                    title: post.title,
                    content: post.content,
                    category: post.category,
                    image: post.image,
                    status: post.status || 'published',
                    tags: post.tags || []
                });
                setMediaPreview(post.image);
                setIsSliderVideo(isVideoUrl(post.image));
            } catch (err) {
                router.push('/editor/posts');
            } finally {
                setLoading(false);
            }
        };

        fetchTaxonomies().then(fetchPost);
    }, [id, router]);

    const isVideoUrl = (url: string): boolean => {
        if (!url) return false;
        return !!(url.match(/\.(mp4|webm|ogg|mov)$/) || url.includes('/video/upload/'));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setError('');
        const isVideo = file.type.startsWith('video/');
        setIsSliderVideo(isVideo);

        if (file.size > 50 * 1024 * 1024) {
            setError('File size 50MB से छोटी होनी चाहिए।');
            return;
        }

        setMediaFile(file);
        setMediaPreview(URL.createObjectURL(file));
    };

    const handleAddCustomTag = () => {
        if (tagInput.trim() && !form.tags.includes(tagInput.trim())) {
            setForm({ ...form, tags: [...form.tags, tagInput.trim()] });
        }
        setTagInput('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(''); setSuccess('');
        if (!form.title.trim()) return setError('Title जरूरी है।');
        if (!form.content.trim()) return setError('Content जरूरी है।');
        if (!form.category) return setError('Category चुनें।');

        setSaving(true);
        try {
            let mediaUrl = form.image;
            if (mediaFile) {
                setUploading(true);
                mediaUrl = await uploadToCloudinary(mediaFile);
                setUploading(false);
            }
            await updatePost(id, {
                title: form.title.trim(),
                content: form.content.trim(),
                category: form.category,
                image: mediaUrl,
                status: form.status,
                tags: form.tags
            });
            setSuccess('पोस्ट सफलतापूर्वक update हो गई!');
            setTimeout(() => router.push('/editor/posts'), 1500);
        } catch (err: any) {
            setError('Error: ' + err.message);
            setUploading(false);
        } finally {
            setSaving(false);
        }
    };

    const generateAITags = async () => { /* no-op for editor pane without db */ };
    const translateToEnglish = async () => { /* no-op directly without api */ };
    const generateAIHeadline = async () => { /* no-op */ };
    const generateAIContent = async () => { /* no-op */ };

    if (loading) return <LoadingSpinner text="Post load हो रहा है..." />;

    return (
        <div>
            <div className="flex items-center gap-3 mb-6">
                <Link href="/editor/posts" className="text-gray-500 hover:text-gray-700 transition">
                    <ChevronLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-2xl font-extrabold text-gray-800">खबर Edit करें</h1>
                    <p className="text-gray-500 text-sm">Cloudinary के साथ update करें</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex gap-3">
                        <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                        <p className="text-red-700 text-sm">{error}</p>
                    </div>
                )}
                {success && (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex gap-3">
                        <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                        <p className="text-green-700 text-sm">{success}</p>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                    <div className="lg:col-span-2 space-y-5">
                        <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100">
                            <div className="flex items-center justify-between mb-2">
                                <label className="block text-sm font-semibold text-gray-700">शीर्षक <span className="text-red-500">*</span></label>
                            </div>
                            <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 text-lg" />
                        </div>
                        <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100">
                            <div className="flex items-center justify-between mb-2">
                                <label className="block text-sm font-semibold text-gray-700">सामग्री <span className="text-red-500">*</span></label>
                            </div>
                            <textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })}
                                rows={14} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 resize-none leading-relaxed" />
                        </div>
                    </div>

                    <div className="space-y-5">
                        <div className="bg-white rounded-2xl shadow-sm p-5 border border-blue-100 ring-1 ring-blue-50">
                            <label className="block text-sm font-bold text-blue-700 mb-2 flex items-center justify-between">
                                <span>श्रेणी चुनें (Compulsory) <span className="text-red-500">*</span></span>
                            </label>
                            <select
                                required
                                value={form.category}
                                onChange={(e) => setForm({ ...form, category: e.target.value })}
                                className="w-full border-2 border-blue-100 rounded-xl px-4 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-blue-50/30 font-semibold transition-all hover:bg-white"
                            >
                                <option value="">-- श्रेणी चुनें (अनिवार्य) --</option>
                                {dbCategories.map((cat) => (
                                    <option key={cat.slug} value={cat.slug}>
                                        {cat.name}
                                    </option>
                                ))}
                            </select>

                            <div className="flex items-center justify-between mb-2 mt-4">
                                <label className="block text-sm font-semibold text-gray-700">
                                    टैग्स (Tags)
                                </label>
                            </div>

                            <div className="flex flex-wrap gap-2 mb-3">
                                {form.tags.map(tag => (
                                    <span key={tag} className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm flex items-center gap-1 border border-blue-200">
                                        {tag}
                                        <button type="button" onClick={() => setForm({ ...form, tags: form.tags.filter(t => t !== tag) })} className="hover:text-blue-900 rounded-full">
                                            <X className="w-3 h-3" />
                                        </button>
                                    </span>
                                ))}
                            </div>

                            <div className="flex gap-2 mb-3">
                                <input
                                    type="text"
                                    value={tagInput}
                                    onChange={(e) => setTagInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            handleAddCustomTag();
                                        }
                                    }}
                                    className="flex-1 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                                    placeholder="Add tag & press Enter"
                                />
                                <button
                                    type="button"
                                    onClick={handleAddCustomTag}
                                    className="bg-gray-200 px-3 rounded-xl hover:bg-gray-300 font-medium text-sm transition"
                                >
                                    Add
                                </button>
                            </div>

                            <label className="block text-sm font-semibold text-gray-700 mb-2 mt-4">स्टेटस (Status) <span className="text-red-500">*</span></label>
                            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as PostStatus })}
                                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50">
                                <option value="published" disabled={role === UserRole.REPORTER}>
                                    Published {role === UserRole.REPORTER && "(Admin/Editor only)"}
                                </option>
                                <option value="draft">Draft</option>
                            </select>
                        </div>

                        <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">मीडिया (Image or Video)</label>

                            {mediaPreview || form.image ? (
                                <div className="relative">
                                    <div className="relative h-44 rounded-xl overflow-hidden bg-black flex items-center justify-center">
                                        {isSliderVideo || isVideoUrl(mediaPreview || form.image) ? (
                                            <video src={mediaPreview || form.image} controls className="max-h-full" />
                                        ) : (
                                            <img src={mediaPreview || form.image} alt="Preview" className="object-cover w-full h-full" />
                                        )}
                                    </div>
                                    <button type="button" onClick={() => { setMediaFile(null); setMediaPreview(''); setForm({ ...form, image: '' }); }}
                                        className="absolute top-2 right-2 w-7 h-7 bg-red-600 text-white rounded-full flex items-center justify-center hover:bg-red-700 shadow-lg">
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ) : (
                                <button type="button" onClick={() => fileInputRef.current?.click()}
                                    className="w-full h-44 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center gap-2 hover:border-blue-400 transition group">
                                    <div className="flex gap-2">
                                        <ImageIcon className="w-8 h-8 text-gray-300 group-hover:text-blue-400" />
                                        <Video className="w-8 h-8 text-gray-300 group-hover:text-blue-400" />
                                    </div>
                                    <span className="text-sm text-gray-400 group-hover:text-blue-500">Image/Video Upload करें</span>
                                </button>
                            )}
                            <input ref={fileInputRef} type="file" accept="image/*,video/*" onChange={handleFileChange} className="hidden" />
                            <div className="mt-3">
                                <label className="block text-xs text-gray-500 mb-1">या मीडिया URL</label>
                                <input type="url" value={form.image} onChange={(e) => { setForm({ ...form, image: e.target.value }); setMediaPreview(''); }}
                                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50" />
                            </div>
                        </div>

                        <button type="submit" disabled={saving || uploading}
                            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-4 rounded-xl transition shadow-lg flex items-center justify-center gap-2 text-sm">
                            {saving || uploading ? (
                                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    {uploading ? 'Media Upload हो रहा है...' : 'Update हो रहा है...'}</>
                            ) : (
                                <><Save className="w-4 h-4" /> Update करें</>
                            )}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}
