'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { addPost, uploadToCloudinary } from '@/lib/posts';
import { useAuth } from '@/context/AuthContext';
import { PostStatus } from '@/types/admin';
import { ImageIcon, Save, X, ChevronLeft, AlertCircle, CheckCircle, Video, FileText, Sparkles, Loader2, ShieldCheck, ShieldAlert } from 'lucide-react';
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
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { user } = useAuth();

    const [form, setForm] = useState({
        title: '',
        content: '',
        category: '',
        image: '',
        status: 'published' as PostStatus,
        tags: [] as string[]
    });

    const [mediaFiles, setMediaFiles] = useState<File[]>([]);
    const [mediaPreviews, setMediaPreviews] = useState<string[]>([]);
    const [isSliderVideo, setIsSliderVideo] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [generatingAI, setGeneratingAI] = useState(false);
    const [translatingAI, setTranslatingAI] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [dbCategories, setDbCategories] = useState<any[]>([]);
    const [dbTags, setDbTags] = useState<any[]>([]);
    const [tagInput, setTagInput] = useState('');

    // SEO fields
    const [seo, setSeo] = useState({ metaTitle: '', metaDescription: '', slug: '' });

    // Content quality/validation state
    const [validationResult, setValidationResult] = useState<any>(null);
    const [validating, setValidating] = useState(false);

    useEffect(() => {
        const fetchTaxonomies = async () => {
            try {
                const catSnap = await getDocs(collection(db, "categories"));
                const firestoreCats = catSnap.docs.map(doc => doc.data());
                const defaultSlugs = new Set(DEFAULT_CATEGORIES.map(c => c.slug));
                const extraCats = firestoreCats.filter(c => !defaultSlugs.has(c.slug));
                setDbCategories([...DEFAULT_CATEGORIES, ...extraCats]);

                const tagSnap = await getDocs(collection(db, "tags"));
                setDbTags(tagSnap.docs.map(doc => doc.data()));
            } catch (err) {
                console.error("Failed to fetch taxonomies", err);
            }
        };
        fetchTaxonomies();
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (!files.length) return;

        setError('');
        const images = files.filter(f => f.type.startsWith('image/'));
        const videos = files.filter(f => f.type.startsWith('video/'));

        if (videos.length > 1) return setError('आप केवल 1 वीडियो अपलोड कर सकते हैं।');
        if (images.length > 5) return setError('आप अधिकतम 5 तस्वीरें अपलोड कर सकते हैं।');
        if (images.length + videos.length > 6) return setError('कुल मिलाकर 6 से अधिक फाइलें अपलोड नहीं की जा सकतीं।');

        const largeVideo = videos.find(v => v.size > 700 * 1024 * 1024);
        if (largeVideo) return setError('वीडियो का साइज 700MB से छोटा होना चाहिए।');

        setMediaFiles([...images, ...videos]);
        setMediaPreviews([...images, ...videos].map(f => URL.createObjectURL(f)));
        setIsSliderVideo(videos.length > 0);
    };

    const handleAddCustomTag = () => {
        if (tagInput.trim() && !form.tags.includes(tagInput.trim())) {
            setForm({ ...form, tags: [...form.tags, tagInput.trim()] });
        }
        setTagInput('');
    };

    const [uploadProgress, setUploadProgress] = useState(0);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError(''); setSuccess('');

        if (!form.title.trim()) { setSaving(false); return setError('शीर्षक (Title) खाली है।'); }
        if (!form.content.trim() || form.content === '<p><br></p>') { setSaving(false); return setError('खबर की सामग्री खाली है।'); }
        if (!form.category) { setSaving(false); return setError('कृपया एक श्रेणी चुनें।'); }

        try {
            let mediaUrl = form.image;
            let uploadedImages: string[] = [];

            if (mediaFiles.length > 0) {
                setUploading(true);
                setUploadProgress(0);
                const urls: string[] = [];
                for (let i = 0; i < mediaFiles.length; i++) {
                    const u = await uploadToCloudinary(mediaFiles[i], (percent: number) => {
                        setUploadProgress(Math.round(((i * 100) + percent) / mediaFiles.length));
                    });
                    urls.push(u);
                }
                setUploading(false);
                if (urls.length > 0) {
                    mediaUrl = urls[0];
                    uploadedImages = urls;
                }
            }

            if (!mediaUrl && uploadedImages.length === 0) {
                setSaving(false);
                return setError('Image या Video अपलोड करना जरूरी है।');
            }

            await addPost({
                title: form.title.trim(),
                content: form.content.trim(),
                category: form.category,
                image: mediaUrl,
                images: uploadedImages,
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

    const isVideoUrl = (url: string): boolean => {
        if (!url) return false;
        return !!(url.match(/\.(mp4|webm|ogg|mov)$/) || url.includes('/video/upload/'));
    };

    const suggestCategory = async () => {
        if (!form.title.trim() && !form.content.trim()) {
            setError('Category suggest करने के लिए Title या Content लिखें।');
            return;
        }
        setGeneratingAI(true);
        setError('');
        try {
            const res = await fetch('/api/ai/post-assistant', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: form.title, content: form.content, type: 'suggest-category' })
            });
            const data = await res.json();
            if (data.category) {
                setForm(prev => ({ ...prev, category: data.category }));
                setSuccess(`AI का सुझाव: "${data.category}"`);
            }
        } catch { setError('Category suggest नहीं हो पाई।'); } finally { setGeneratingAI(false); }
    };

    const validateContent = async () => {
        if (!form.title.trim() || !form.content.trim()) {
            setError('Validate करने के लिए Title और Content जरूरी है।');
            return;
        }
        setValidating(true);
        setError('');
        try {
            const res = await fetch('/api/ai/post-assistant', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: form.title, content: form.content, type: 'validate' })
            });
            const data = await res.json();
            if (data.score !== undefined) setValidationResult(data);
        } catch { setError('Validation failed।'); } finally { setValidating(false); }
    };

    const generateAITags = async () => {
        if (!form.title.trim() || !form.content.trim()) {
            setError('पहले टाइटल और कंटेंट लिखें फिर AI का इस्तेमाल करें।');
            return;
        }
        setGeneratingAI(true);
        setError('');
        try {
            const res = await fetch('/api/ai/post-assistant', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: form.title, content: form.content, type: 'seo-tags' })
            });
            const data = await res.json();
            if (data.tags) setForm(prev => ({ ...prev, tags: Array.from(new Set([...prev.tags, ...data.tags])) }));
            if (data.seoDescription) setSeo(prev => ({ ...prev, metaDescription: data.seoDescription }));
            if (data.slug) setSeo(prev => ({ ...prev, slug: data.slug }));
            setSuccess('AI ने SEO Tags और Metadata तैयार कर दिए हैं!');
        } catch { setError('AI Failed to generate tags.'); } finally { setGeneratingAI(false); }
    };

    const translateToEnglish = async () => {
        if (!form.title.trim() || !form.content.trim()) {
            setError('ट्रांसलेट करने के लिए टाइटल और कंटेंट जरूरी है।');
            return;
        }
        setTranslatingAI(true);
        try {
            const res = await fetch('/api/ai/post-assistant', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: form.title, content: form.content, type: 'translate' })
            });
            const data = await res.json();
            if (data.translatedTitle) {
                setForm(prev => ({ ...prev, title: data.translatedTitle, content: data.translatedContent }));
                setSuccess('AI ने इसे इंग्लिश में ट्रांसलेट कर दिया है!');
            }
        } catch { setError('Translation failed.'); } finally { setTranslatingAI(false); }
    };

    const generateAIHeadline = async () => {
        if (!form.content.trim()) {
            setError('Content लिखें तभी हेडलाइन जनरेट हो पाएगी।');
            return;
        }
        setGeneratingAI(true);
        try {
            const res = await fetch('/api/ai/post-assistant', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: form.content, type: 'headline' })
            });
            const data = await res.json();
            if (data.headline) {
                setForm(prev => ({ ...prev, title: data.headline }));
                setSuccess('AI ने शानदार हेडलाइन जनरेट कर दी है!');
            }
        } catch { setError('AI Failed to generate headline.'); } finally { setGeneratingAI(false); }
    };

    const generateAIContent = async () => {
        if (!form.title.trim()) {
            setError('पहले टाइटल लिखें तभी कंटेंट जनरेट हो पाएगा।');
            return;
        }
        setGeneratingAI(true);
        try {
            const res = await fetch('/api/ai/post-assistant', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: form.title, content: form.content, type: 'content' })
            });
            const data = await res.json();
            if (data.content) {
                setForm(prev => ({ ...prev, content: data.content }));
                setSuccess('AI ने खबर लिख दी है!');
            }
        } catch { setError('AI Failed to generate content.'); } finally { setGeneratingAI(false); }
    };

    return (
        <div className="space-y-3.5">
            <div className="flex items-center gap-2 mb-2">
                <Link href="/admin/posts" className="p-1 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition">
                    <ChevronLeft className="w-4 h-4" />
                </Link>
                <div>
                    <h1 className="text-lg font-extrabold text-gray-900 tracking-tight">नई खबर जोड़ें</h1>
                    <p className="text-gray-500 text-xs">Cloudinary के साथ upload करें</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5">
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-2.5 flex items-start gap-2 text-xs">
                        <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
                        <p className="text-red-700 font-medium">{error}</p>
                    </div>
                )}
                {success && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-2.5 flex items-start gap-2 text-xs">
                        <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                        <p className="text-green-700 font-medium">{success}</p>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5">
                    <div className="lg:col-span-2 space-y-3.5">
                        <div className="bg-white rounded-xl shadow-2xs p-3.5 border border-gray-200/90">
                            <div className="flex items-center justify-between mb-1.5">
                                <label className="block text-xs font-bold text-gray-700">खबर का शीर्षक <span className="text-red-500">*</span></label>
                                <div className="flex items-center gap-1.5">
                                    <button type="button" onClick={generateAIHeadline} disabled={generatingAI}
                                        className="text-[9px] font-bold bg-purple-50 text-purple-700 px-2 py-0.5 rounded-md uppercase tracking-wider hover:bg-purple-100 transition-colors flex items-center gap-1 border border-purple-200/60 active:scale-95">
                                        {generatingAI ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <Sparkles className="w-2.5 h-2.5" />}
                                        AI Headline
                                    </button>
                                </div>
                            </div>
                            <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                                className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-gray-900 focus:outline-none focus:ring-1 focus:ring-red-500 bg-white text-xs font-semibold" placeholder="खबर का शीर्षक लिखें..." />
                        </div>

                        <div className="bg-white rounded-xl shadow-2xs p-3.5 border border-gray-200/90">
                            <div className="flex items-center justify-between mb-1.5">
                                <label className="block text-xs font-bold text-gray-700">खबर की सामग्री <span className="text-red-500">*</span></label>
                                <div className="flex items-center gap-1.5">
                                    <button type="button" onClick={generateAIContent} disabled={generatingAI}
                                        className="text-[9px] font-bold bg-purple-50 text-purple-700 px-2 py-0.5 rounded-md uppercase tracking-wider hover:bg-purple-100 transition-colors flex items-center gap-1 border border-purple-200/60 active:scale-95">
                                        {generatingAI ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <Sparkles className="w-2.5 h-2.5" />}
                                        AI WRITE
                                    </button>
                                    <button type="button" onClick={translateToEnglish} disabled={translatingAI}
                                        className="text-[9px] font-bold bg-green-50 text-green-700 px-2 py-0.5 rounded-md uppercase tracking-wider hover:bg-green-100 transition-colors flex items-center gap-1 border border-green-200/60 active:scale-95">
                                        {translatingAI ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <Sparkles className="w-2.5 h-2.5" />}
                                        Translate English
                                    </button>
                                </div>
                            </div>
                            <RichTextEditor value={form.content} onChange={(content) => setForm({ ...form, content })} placeholder="खबर का विस्तृत विवरण लिखें..." />
                        </div>
                    </div>

                    <div className="space-y-3.5">
                        <div className="bg-white rounded-xl shadow-2xs p-3.5 border border-gray-200/90">
                            <label className="block text-xs font-bold text-gray-800 mb-1.5 flex items-center justify-between">
                                <span>श्रेणी चुनें <span className="text-red-500">*</span></span>
                                <button type="button" onClick={suggestCategory} disabled={generatingAI}
                                    className="text-[9px] font-bold bg-amber-50 text-amber-700 px-2 py-0.5 rounded-md uppercase tracking-wider hover:bg-amber-100 transition-colors flex items-center gap-1 border border-amber-200/60 active:scale-95">
                                    {generatingAI ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <Sparkles className="w-2.5 h-2.5" />}
                                    AI Suggest
                                </button>
                            </label>
                            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                                className="h-8 w-full border border-gray-200 rounded-lg px-2.5 text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-red-500 bg-white mb-3 font-semibold transition-all">
                                <option value="">-- श्रेणी चुनें --</option>
                                {dbCategories.map((cat) => <option key={cat.slug} value={cat.slug}>{cat.name}</option>)}
                            </select>

                            <div className="flex items-center justify-between mb-1.5">
                                <label className="block text-xs font-bold text-gray-700">टैग्स (Tags)</label>
                                <button type="button" onClick={generateAITags} disabled={generatingAI}
                                    className="text-[9px] font-bold bg-purple-50 text-purple-700 px-2 py-0.5 rounded-md uppercase tracking-wider hover:bg-purple-100 transition-colors flex items-center gap-1 border border-purple-200/60 active:scale-95">
                                    {generatingAI ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <Sparkles className="w-2.5 h-2.5" />}
                                    AI Auto-Fill
                                </button>
                            </div>

                            <div className="flex flex-wrap gap-1.5 mb-2">
                                {form.tags.map(tag => (
                                    <span key={tag} className="bg-red-50 text-red-700 px-2 py-0.5 rounded-md text-[11px] font-medium flex items-center gap-1 border border-red-200/80">
                                        {tag}
                                        <button type="button" onClick={() => setForm({ ...form, tags: form.tags.filter(t => t !== tag) })} className="hover:text-red-900 rounded-full"><X className="w-2.5 h-2.5" /></button>
                                    </span>
                                ))}
                            </div>

                            <div className="flex gap-1.5 mb-3">
                                <input type="text" value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddCustomTag(); } }}
                                    className="h-7 flex-1 border border-gray-200 rounded-lg px-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-red-500 bg-white" placeholder="Add tag & press Enter" />
                                <button type="button" onClick={handleAddCustomTag} className="h-7 bg-gray-100 hover:bg-gray-200 px-2.5 rounded-lg font-bold text-xs transition active:scale-95">Add</button>
                            </div>

                            <label className="block text-xs font-bold text-gray-700 mb-1 mt-3">स्टेटस (Status) <span className="text-red-500">*</span></label>
                            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as PostStatus })}
                                className="h-8 w-full border border-gray-200 rounded-lg px-2.5 text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-red-500 bg-white">
                                <option value="published">Published</option>
                                <option value="draft">Draft</option>
                            </select>
                        </div>

                        <div className="bg-white rounded-xl shadow-2xs p-3.5 border border-gray-200/90">
                            <label className="block text-xs font-bold text-gray-700 mb-1.5">मीडिया (Max 5 Photos + 1 Video)</label>
                            {mediaPreviews.length > 0 || form.image ? (
                                <div className="space-y-2.5">
                                    <div className="grid grid-cols-2 gap-2">
                                        {(mediaPreviews.length > 0 ? mediaPreviews : [form.image]).map((url, i) => (
                                            <div key={i} className="relative h-20 rounded-lg overflow-hidden bg-black flex items-center justify-center">
                                                {isVideoUrl(url) ? <video src={url} className="object-cover w-full h-full" /> : <img src={url} alt="Preview" className="object-cover w-full h-full" />}
                                            </div>
                                        ))}
                                    </div>
                                    <button type="button" onClick={() => { setMediaFiles([]); setMediaPreviews([]); setForm({ ...form, image: '' }); }}
                                        className="h-7 w-full bg-red-50 text-red-600 hover:bg-red-100 rounded-lg font-bold text-xs flex justify-center items-center gap-1.5 transition active:scale-95"><X className="w-3.5 h-3.5" /> मीडिया हटाएं</button>
                                </div>
                            ) : (
                                <button type="button" onClick={() => fileInputRef.current?.click()}
                                    className="w-full h-24 border-2 border-dashed border-gray-200 rounded-lg flex flex-col items-center justify-center gap-1 hover:border-red-400 hover:bg-red-50/20 transition group active:scale-[0.99]">
                                    <ImageIcon className="w-6 h-6 text-gray-300 group-hover:text-red-400" />
                                    <span className="text-xs text-gray-400 group-hover:text-red-500 font-medium">Image/Video Upload करें</span>
                                </button>
                            )}
                            <input ref={fileInputRef} type="file" multiple accept="image/*,video/*" onChange={handleFileChange} className="hidden" />
                        </div>

                        <button type="submit" disabled={saving || uploading}
                            className="h-9 w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-bold rounded-lg transition shadow-xs flex items-center justify-center gap-1.5 text-xs active:scale-[0.99]">
                            {saving || uploading ? <><div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> {uploading ? `अपलोड: ${uploadProgress}%` : 'Publish हो रहा है...'}</> : <><Save className="w-3.5 h-3.5" /> Publish करें</>}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}

