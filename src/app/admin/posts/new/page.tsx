'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { addPost, uploadToCloudinary } from '@/lib/posts';
import { useAuth } from '@/lib/auth-context';
import { PostStatus } from '@/types/admin';
import { ImageIcon, Save, X, ChevronLeft, AlertCircle, CheckCircle, Video as VideoIcon, Sparkles, Loader2, Upload } from 'lucide-react';
import Link from 'next/link';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import RichTextEditor from '@/components/RichTextEditor';

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

export default function NewPostPage() {
    const router = useRouter();
    const { user } = useAuth();

    const [form, setForm] = useState({
        title: '',
        content: '',
        category: '',
        status: 'published' as PostStatus,
        tags: [] as string[]
    });

    const [imageFiles, setImageFiles] = useState<File[]>([]);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [videoPreview, setVideoPreview] = useState('');

    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [saving, setSaving] = useState(false);
    const [generatingAI, setGeneratingAI] = useState(false);
    const [translatingAI, setTranslatingAI] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [dbCategories, setDbCategories] = useState<{ name: string; slug: string }[]>([]);

    useEffect(() => {
        const fetchTaxonomies = async () => {
            try {
                const catSnap = await getDocs(collection(db, "categories"));
                const firestoreCats = catSnap.docs.map(doc => doc.data() as { name: string; slug: string });
                const defaultSlugs = new Set(DEFAULT_CATEGORIES.map(c => c.slug));
                const extraCats = firestoreCats.filter(c => !defaultSlugs.has(c.slug));
                setDbCategories([...DEFAULT_CATEGORIES, ...extraCats]);
            } catch (err) {
                console.error("Failed to fetch taxonomies", err);
            }
        };
        fetchTaxonomies();
    }, []);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return;
        const files = Array.from(e.target.files);

        let validFiles: File[] = [];
        let validPreviews: string[] = [];
        let errorMessage = '';

        for (const file of files) {
            if (!file.type.startsWith('image/')) {
                errorMessage = 'कुछ चुनी गई फाइल्स Image नहीं हैं।';
                continue;
            }
            if (file.size > 50 * 1024 * 1024) {
                errorMessage = 'Image size 50MB से छोटी होनी चाहिए।';
                continue;
            }
            validFiles.push(file);
            validPreviews.push(URL.createObjectURL(file));
        }

        if (errorMessage) setError(errorMessage);
        else setError('');

        const newTotalFiles = [...imageFiles, ...validFiles];
        const newTotalPreviews = [...imagePreviews, ...validPreviews];

        if (newTotalFiles.length > 5) {
            setError('आप अधिकतम 5 तस्वीरें ही चुन सकते हैं।');
            setImageFiles(newTotalFiles.slice(0, 5));
            setImagePreviews(newTotalPreviews.slice(0, 5));
        } else {
            setImageFiles(newTotalFiles);
            setImagePreviews(newTotalPreviews);
        }
    };

    const removeImage = (index: number) => {
        const newFiles = [...imageFiles];
        const newPreviews = [...imagePreviews];
        newFiles.splice(index, 1);
        newPreviews.splice(index, 1);
        setImageFiles(newFiles);
        setImagePreviews(newPreviews);
    };

    const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith('video/')) {
            setError('कृपया सिर्फ Video फ़ाइल चुनें।');
            return;
        }
        if (file.size > 700 * 1024 * 1024) return setError('Video size 700MB से छोटी होनी चाहिए।');
        setVideoFile(file);
        setVideoPreview(URL.createObjectURL(file));
        setError('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true); setError(''); setSuccess('');

        if (!form.title.trim()) return (setSaving(false), setError('शीर्षक (Title) खाली है।'));
        if (!form.content.trim() || form.content === '<p><br></p>') return (setSaving(false), setError('कंटेंट खाली है।'));
        if (!form.category) return (setSaving(false), setError('कैटेगरी चुनें।'));

        try {
            let finalImageUrls: string[] = [];
            let finalVideoUrl = "";

            if (imageFiles.length > 0) {
                setUploading(true);
                for (let i = 0; i < imageFiles.length; i++) {
                    setUploadProgress(Math.round((i / imageFiles.length) * 50)); // First 50% for images
                    const url = await uploadToCloudinary(imageFiles[i], () => { });
                    finalImageUrls.push(url);
                }
            }

            if (videoFile) {
                setUploading(true);
                setUploadProgress(50);
                finalVideoUrl = await uploadToCloudinary(videoFile, (p: number) => {
                    setUploadProgress(50 + Math.round(p / 2)); // Last 50% for video
                });
            }

            setUploading(false);

            if (finalImageUrls.length === 0 && !finalVideoUrl) {
                setSaving(false);
                return setError('कम से कम एक फ़ोटो या वीडियो अपलोड करें।');
            }

            await addPost({
                title: form.title.trim(),
                content: form.content.trim(),
                category: form.category,
                image: finalImageUrls.length > 0 ? finalImageUrls[0] : "",
                images: finalImageUrls,
                video: finalVideoUrl,
                status: form.status,
                authorId: user?.uid || '',
                authorName: user?.email?.split('@')[0] || 'Admin',
                tags: form.tags,
            });

            setSuccess('खबर सफलतापूर्वक publish हो गई!');
            setTimeout(() => router.push('/admin/posts'), 1500);
        } catch (err: any) {
            setError('Error: ' + err.message);
            setUploading(false);
        } finally {
            setSaving(false);
        }
    };

    const generateAIHeadline = async () => {
        if (!form.content.trim()) return setError('Content लिखें।');
        setGeneratingAI(true);
        try {
            const res = await fetch('/api/ai/post-assistant', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: form.content, type: 'headline' })
            });
            const data = await res.json();
            if (data.headline) setForm(prev => ({ ...prev, title: data.headline }));
        } finally { setGeneratingAI(false); }
    };

    const translateToEnglish = async () => {
        if (!form.content.trim()) return setError('पहिले Content लिखें।');
        setTranslatingAI(true);
        try {
            const res = await fetch('/api/ai/post-assistant', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: form.content, type: 'translate' })
            });
            const data = await res.json();
            if (data.content) setForm(prev => ({ ...prev, content: data.content }));
        } finally { setTranslatingAI(false); }
    };

    const generateAIContent = async () => {
        if (!form.title.trim()) return setError('पहिले Title लिखें।');
        setGeneratingAI(true);
        try {
            const res = await fetch('/api/ai/post-assistant', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: form.title, type: 'rewrite' })
            });
            const data = await res.json();
            if (data.content) setForm(prev => ({ ...prev, content: data.content }));
        } finally { setGeneratingAI(false); }
    };

    const suggestCategory = async () => {
        if (!form.title.trim()) return setError('Title लिखें।');
        setGeneratingAI(true);
        try {
            const res = await fetch('/api/ai/post-assistant', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: form.title, content: form.content, type: 'suggest-category' })
            });
            const data = await res.json();
            if (data.category) setForm(prev => ({ ...prev, category: data.category }));
        } finally { setGeneratingAI(false); }
    };

    return (
        <div className="max-w-6xl mx-auto pb-10">
            <div className="flex items-center gap-3 mb-6">
                <Link href="/admin/posts" className="text-gray-500 hover:text-gray-700 transition">
                    <ChevronLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-2xl font-extrabold text-gray-800">नई खबर जोड़ें</h1>
                    <p className="text-gray-500 text-sm">Image (Max 5) और Video एक साथ अपलोड करें</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {error && <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm flex gap-2"><AlertCircle className="w-5 h-5 shrink-0" /> {error}</div>}
                {success && <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-green-700 text-sm flex gap-2"><CheckCircle className="w-5 h-5 shrink-0" /> {success}</div>}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
                            <label className="block text-sm font-semibold text-gray-700 mb-2 flex justify-between items-center">
                                शीर्षक (Title) *
                                <button type="button" onClick={generateAIHeadline} disabled={generatingAI} className="text-[10px] bg-purple-50 text-purple-600 px-2 py-1 rounded-md uppercase font-bold hover:bg-purple-100 transition">
                                    {generatingAI ? '...' : 'AI Headline'}
                                </button>
                            </label>
                            <input
                                type="text"
                                value={form.title}
                                onChange={(e) => setForm({ ...form, title: e.target.value })}
                                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-lg focus:ring-2 focus:ring-red-500 outline-none bg-gray-50"
                                placeholder="खबर का शीर्षक लिखें..."
                            />
                        </div>

                        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
                            <label className="block text-sm font-semibold text-gray-700 mb-2 flex justify-between items-center">
                                खबर की सामग्री (Content) *
                                <div className="flex items-center gap-2">
                                    <button type="button" onClick={generateAIContent} disabled={generatingAI} className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-1 rounded-md uppercase font-bold flex items-center gap-1 hover:bg-indigo-100 transition">
                                        <Sparkles className="w-3 h-3" />
                                        {generatingAI ? '...' : 'AI Rewrite'}
                                    </button>
                                    <button type="button" onClick={translateToEnglish} disabled={translatingAI} className="text-[10px] bg-emerald-50 text-emerald-600 px-2 py-1 rounded-md uppercase font-bold hover:bg-emerald-100 transition">
                                        {translatingAI ? '...' : 'Translate to English'}
                                    </button>
                                </div>
                            </label>
                            <RichTextEditor
                                value={form.content}
                                onChange={(content) => setForm({ ...form, content })}
                                placeholder="खबर का विस्तृत विवरण लिखें..."
                            />
                        </div>

                        {/* Media Section */}
                        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Photos Upload */}
                                <div className="space-y-3">
                                    <label className="text-sm font-bold text-gray-700 flex items-center justify-between">
                                        <span className="flex items-center gap-2"><ImageIcon className="w-4 h-4 text-red-600" /> Photos ({imageFiles.length}/5)</span>
                                    </label>
                                    <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 bg-gray-50">
                                        <div className="grid grid-cols-2 gap-2 mb-4">
                                            {imagePreviews.map((preview, idx) => (
                                                <div key={idx} className="relative">
                                                    <img src={preview} className="h-24 w-full object-cover rounded-lg" alt={`Preview ${idx + 1}`} />
                                                    <button type="button" onClick={() => removeImage(idx)} className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1 shadow-md"><X className="w-3 h-3" /></button>
                                                </div>
                                            ))}
                                        </div>
                                        {imageFiles.length < 5 && (
                                            <label className="cursor-pointer block py-4 text-center border border-gray-300 border-dashed rounded-lg hover:bg-gray-100 transition">
                                                <Upload className="w-6 h-6 text-gray-400 mx-auto mb-1" />
                                                <span className="text-xs text-gray-500">Pick Images (Max 50MB)</span>
                                                <input type="file" className="hidden" accept="image/*" multiple onChange={handleImageChange} />
                                            </label>
                                        )}
                                    </div>
                                </div>

                                {/* Video Upload */}
                                <div className="space-y-3">
                                    <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                        <VideoIcon className="w-4 h-4 text-blue-600" /> Video (Optional)
                                    </label>
                                    <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 bg-gray-50 text-center relative h-full flex items-center justify-center">
                                        {videoPreview ? (
                                            <div className="relative w-full">
                                                <video src={videoPreview} className="h-40 w-full object-cover rounded-lg" controls />
                                                <button type="button" onClick={() => { setVideoFile(null); setVideoPreview(''); }} className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1"><X className="w-4 h-4" /></button>
                                            </div>
                                        ) : (
                                            <label className="cursor-pointer block w-full">
                                                <Upload className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                                                <span className="text-xs text-gray-500">MP4/MOV (Max 700MB)</span>
                                                <input type="file" className="hidden" accept="video/*" onChange={handleVideoChange} />
                                            </label>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
                            <label className="block text-sm font-bold text-gray-700 mb-3">श्रेणी (Category) *</label>
                            <select
                                value={form.category}
                                onChange={(e) => setForm({ ...form, category: e.target.value })}
                                className="w-full border border-gray-200 rounded-xl px-4 py-3 bg-gray-50 outline-none focus:ring-2 focus:ring-red-500 mb-4"
                            >
                                <option value="">-- श्रेणी चुनें --</option>
                                {dbCategories.map(cat => <option key={cat.slug} value={cat.slug}>{cat.name}</option>)}
                            </select>

                            <button type="button" onClick={suggestCategory} disabled={generatingAI} className="w-full text-xs font-bold py-2 px-4 rounded-lg bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center gap-2">
                                {generatingAI ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                                AI Suggest Category
                            </button>
                        </div>

                        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
                            <label className="block text-sm font-bold text-gray-700 mb-3">Status</label>
                            <select
                                value={form.status}
                                onChange={(e) => setForm({ ...form, status: e.target.value as PostStatus })}
                                className="w-full border border-gray-200 rounded-xl px-4 py-3 bg-gray-50 outline-none focus:ring-2 focus:ring-red-500"
                            >
                                <option value="published">Publish Now</option>
                                <option value="draft">Save as Draft</option>
                            </select>
                        </div>

                        <button
                            type="submit"
                            disabled={saving || uploading}
                            className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-bold py-4 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2"
                        >
                            {saving || uploading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    <span>{uploading ? `अपलोड हो रहा है: ${uploadProgress}%` : 'Publish हो रहा है...'}</span>
                                </>
                            ) : (
                                <>
                                    <Save className="w-5 h-5" />
                                    <span>Publish News</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}
