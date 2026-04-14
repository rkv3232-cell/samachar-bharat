'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { getAllPosts, deletePost, Post, formatDate } from '@/lib/posts';
import { PlusCircle, Pencil, Trash2, Search, AlertCircle, Eye, X, Share2, MessageCircle, Video, Copy, CheckCircle, RefreshCw, ExternalLink } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import { fetchCategories } from '@/lib/firestore/categories';
import { useAuth } from '@/lib/auth-context';
import { toast } from 'react-hot-toast';

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

// ── Social Share Modal ──────────────────────────────────────────────────────
function SocialShareModal({ post, onClose, userUid, isYouTubeConnected }: { post: Post; onClose: () => void; userUid: string; isYouTubeConnected: boolean }) {
    const [copied, setCopied] = useState(false);
    const [youtubeText, setYoutubeText] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

    const siteUrl = typeof window !== 'undefined' ? window.location.origin : 'https://samachar-bharat.netlify.app';
    const postUrl = `${siteUrl}/post/${post.id}`;
    const tags = Array.isArray(post.tags) ? post.tags : [];
    const hashTags = tags.map(t => `#${t}`).join(' ');
    const safeContent = post.content ? post.content.replace(/<[^>]*>/g, '').substring(0, 300) : '';

    const youtubeDescription = `${post.title}\n\n${safeContent}${safeContent.length >= 300 ? '...' : ''}\n\n${hashTags}\n\n🔗 Puri khabar padhen: ${postUrl}\n\n© Samachar Bharat`;

    useEffect(() => {
        setYoutubeText(youtubeDescription);
    }, []);

    const handleFacebook = () => {
        const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(postUrl)}&quote=${encodeURIComponent(post.title)}`;
        window.open(fbUrl, '_blank', 'width=600,height=500');
    };

    const handleWhatsApp = () => {
        const msg = `📰 *${post.title}*\n\n${safeContent.substring(0, 200)}${safeContent.length > 200 ? '...' : ''}\n\n${hashTags}\n\n🔗 Puri khabar: ${postUrl}\n\n_Samachar Bharat_`;
        window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`, '_blank');
    };

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(youtubeText);
            setCopied(true);
            setTimeout(() => setCopied(false), 2500);
        } catch {
            alert('Copy nahi ho saka.');
        }
    };

    const handleYouTubeAction = async () => {
        if (!isYouTubeConnected) {
            // Redirect to OAuth start
            window.location.href = `/api/auth/youtube?uid=${userUid}`;
            return;
        }

        // Direct Upload
        setIsUploading(true);
        try {
            const res = await fetch('/api/youtube/upload', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ postId: post.id, uid: userUid })
            });
            const data = await res.json();
            if (data.success) {
                setUploadSuccess(data.url);
                toast.success('Video YouTube par upload ho gaya!');
            } else {
                toast.error(data.error || 'Upload fail ho gaya');
            }
        } catch (err) {
            toast.error('Connection error');
        } finally {
            setIsUploading(false);
        }
    };

    const isVideo = post.image?.match(/\.(mp4|webm|ogg|mov)$/) || post.image?.includes('/video/upload/');

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 text-gray-900" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-gray-50/50">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            <Share2 className="w-5 h-5 text-red-600" />
                            Social Hub
                        </h2>
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{post.title}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-xl transition">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <div className="max-h-[80vh] overflow-y-auto">
                    {/* Share Grid */}
                    <div className="p-5 space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <button onClick={handleFacebook} className="flex items-center justify-center gap-3 p-4 bg-[#1877F2] text-white rounded-xl hover:opacity-90 transition font-bold shadow-md">
                                <Share2 className="w-5 h-5" /> Facebook
                            </button>
                            <button onClick={handleWhatsApp} className="flex items-center justify-center gap-3 p-4 bg-[#25D366] text-white rounded-xl hover:opacity-90 transition font-bold shadow-md">
                                <MessageCircle className="w-5 h-5" /> WhatsApp
                            </button>
                        </div>

                        {/* YouTube Section */}
                        <div className={`p-4 rounded-2xl border-2 transition ${isYouTubeConnected ? 'border-red-100 bg-red-50/30' : 'border-gray-100 bg-gray-50'}`}>
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isYouTubeConnected ? 'bg-red-600 shadow-red-200' : 'bg-gray-400'}`}>
                                        <Video className="w-4 h-4 text-white" />
                                    </div>
                                    <span className="text-sm font-bold text-gray-800">YouTube Channel</span>
                                </div>
                                {isYouTubeConnected && (
                                    <span className="flex items-center gap-1 text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                                        Connected
                                    </span>
                                )}
                            </div>

                            {uploadSuccess ? (
                                <div className="bg-green-100 border border-green-200 rounded-xl p-3 flex items-center justify-between gap-3">
                                    <span className="text-xs font-bold text-green-800">Video Uploaded!</span>
                                    <a href={uploadSuccess} target="_blank" className="flex items-center gap-1 text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 transition font-bold">
                                        Watch <ExternalLink className="w-3 h-3" />
                                    </a>
                                </div>
                            ) : (
                                <button
                                    disabled={isUploading || (isYouTubeConnected && !isVideo)}
                                    onClick={handleYouTubeAction}
                                    className={`w-full py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition shadow-sm ${!isYouTubeConnected
                                        ? 'bg-gray-800 text-white hover:bg-black'
                                        : isVideo
                                            ? 'bg-red-600 text-white hover:bg-red-700'
                                            : 'bg-red-100 text-red-300 cursor-not-allowed'
                                        }`}
                                >
                                    {isUploading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Video className="w-5 h-5" />}
                                    {!isYouTubeConnected
                                        ? 'Connect YouTube Channel'
                                        : isVideo
                                            ? 'Upload Video to YouTube'
                                            : 'No Video found to Upload'}
                                </button>
                            )}
                            {!isYouTubeConnected && <p className="text-[10px] text-gray-400 text-center mt-2 italic">OAuth setup required from Google Console first.</p>}
                        </div>

                        {/* Description Copy */}
                        <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Post Copy-Template</span>
                                <button onClick={handleCopy} className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg transition ${copied ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700'}`}>
                                    {copied ? <CheckCircle className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                    {copied ? 'Copied' : 'Copy Template'}
                                </button>
                            </div>
                            <textarea
                                value={youtubeText}
                                readOnly
                                className="w-full h-32 text-xs bg-transparent border-none p-0 focus:ring-0 text-gray-600 font-mono resize-none"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ── Main Page ───────────────────────────────────────────────────────────────
export default function AdminPostsPage() {
    const { isOwner, user, firestoreUser } = useAuth();
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [sharePost, setSharePost] = useState<Post | null>(null);
    const [confirmDelete, setConfirmDelete] = useState<{ id: string; title: string } | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [error, setError] = useState('');
    const [categoryMap, setCategoryMap] = useState<Record<string, string>>({});

    const isYouTubeConnected = !!(firestoreUser as any)?.youtubeTokens;

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const fetchedCats = await fetchCategories();
            const map: Record<string, string> = {};
            DEFAULT_CATEGORIES.forEach(c => map[c.slug] = c.name);
            fetchedCats.forEach(c => map[c.slug] = c.name);
            setCategoryMap(map);
            await loadPosts();
        } catch (e: any) {
            setError('Data load nahi ho saka');
            toast.error('Categories load nahi ho saki');
        } finally {
            setLoading(false);
        }
    };

    const loadPosts = async () => {
        setLoading(true);
        try {
            const data = await getAllPosts(true);
            setPosts(data);
        } catch (e: any) {
            setError('Posts load nahi ho sake');
            toast.error('Khabrein load nahi ho saki');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!confirmDelete) return;
        const { id } = confirmDelete;

        setDeletingId(id);
        const toastId = toast.loading('खबर डिलीट की जा रही है...');

        try {
            await deletePost(id);
            setPosts((prev) => prev.filter((p) => p.id !== id));
            toast.success('खबर सफलतापूर्वक डिलीट हो गई', { id: toastId });
        } catch (e: any) {
            console.error('Delete error:', e);
            toast.error('डिलीट करने में समस्या आई। फिर से कोशिश करें।', { id: toastId });
        } finally {
            setDeletingId(null);
            setConfirmDelete(null);
        }
    };

    const filtered = posts.filter(
        (p) =>
            p.title.toLowerCase().includes(search.toLowerCase()) ||
            (categoryMap[p.category] || p.category).toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div>
            {sharePost && (
                <SocialShareModal
                    post={sharePost}
                    onClose={() => setSharePost(null)}
                    userUid={user?.uid || ''}
                    isYouTubeConnected={isYouTubeConnected}
                />
            )}

            {/* Robust Delete Confirmation Modal */}
            {confirmDelete && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => !deletingId && setConfirmDelete(null)}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden p-6 animate-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
                        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-red-100">
                            <Trash2 className="w-8 h-8 text-red-600 animate-pulse" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 text-center mb-2">खबर डिलीट करें?</h3>
                        <p className="text-gray-500 text-sm text-center mb-6 px-2">क्या आप वाकई इस खबर को डिलीट करना चाहते हैं? यह एक्शन वापस नहीं लिया जा सकता।</p>
                        <div className="flex flex-col gap-3">
                            <button
                                disabled={!!deletingId}
                                onClick={handleDelete}
                                className="w-full py-3.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-red-200 disabled:opacity-50"
                            >
                                {deletingId ? <RefreshCw className="w-5 h-5 animate-spin" /> : "हां, डिलीट करें"}
                            </button>
                            <button
                                disabled={!!deletingId}
                                onClick={() => setConfirmDelete(null)}
                                className="w-full py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl font-bold transition"
                            >
                                कैंसिल
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-extrabold text-gray-800">Admin Dashboard v2</h1>
                    <p className="text-gray-500 text-sm mt-1">{posts.length} कुल खबरें</p>
                </div>
                <Link
                    href="/admin/posts/new"
                    className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition shadow-lg"
                >
                    <PlusCircle className="w-4 h-4" /> नई खबर
                </Link>
            </div>

            <div className="relative mb-5">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search keywords..."
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 bg-white text-sm"
                />
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
                    <LoadingSpinner />
                    <p className="text-gray-400 text-sm mt-4 font-medium animate-pulse">खबरें लोड हो रही हैं...</p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-100 text-gray-600">
                                    <th className="text-left px-4 py-4 font-extrabold tracking-wider uppercase text-[10px]">Media</th>
                                    <th className="text-left px-4 py-4 font-extrabold tracking-wider uppercase text-[10px]">Khabar Title</th>
                                    <th className="text-left px-4 py-4 font-extrabold tracking-wider uppercase text-[10px] hidden md:table-cell">Status</th>
                                    <th className="text-right px-4 py-4 font-extrabold tracking-wider uppercase text-[10px]">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filtered.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="text-center py-20 text-gray-400 italic">कोई खबर नहीं मिली</td>
                                    </tr>
                                ) : (
                                    filtered.map((post) => {
                                        const isVideo = post.image?.match(/\.(mp4|webm|ogg|mov)$/) || post.image?.includes('/video/upload/');
                                        return (
                                            <tr key={post.id} className="hover:bg-gray-50/80 transition-colors group">
                                                <td className="px-4 py-4">
                                                    <div className="relative w-14 h-12 rounded-xl overflow-hidden bg-gray-100 border border-gray-100 shadow-sm">
                                                        {post.image ? (
                                                            isVideo ? (
                                                                <div className="w-full h-full flex items-center justify-center bg-gray-900 border-2 border-gray-800">
                                                                    <Video className="w-5 h-5 text-gray-400" />
                                                                </div>
                                                            ) : (
                                                                <Image src={post.image} alt="" fill className="object-cover group-hover:scale-110 transition duration-500" />
                                                            )
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-lg bg-gray-50 text-gray-300"></div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <p className="font-bold text-gray-900 line-clamp-1 group-hover:text-red-600 transition tracking-tight">{post.title}</p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="text-[10px] font-black text-white bg-red-600 px-2 py-0.5 rounded-md uppercase tracking-tighter">
                                                            {categoryMap[post.category] || post.category}
                                                        </span>
                                                        <span className="text-[10px] text-gray-400 font-medium">#{post.id?.substring(0, 8)}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4 hidden md:table-cell">
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-green-50 text-green-700 border border-green-100 uppercase">
                                                        {post.status || 'published'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <div className="flex items-center justify-end gap-2 text-gray-700">
                                                        {isOwner && (
                                                            <button
                                                                onClick={() => setSharePost(post)}
                                                                className="flex items-center gap-1.5 px-3 py-2 bg-gray-900 text-white text-[10px] font-black rounded-xl hover:bg-black transition shadow-md shadow-gray-200 active:scale-95"
                                                            >
                                                                <Share2 className="w-3.5 h-3.5" /> DISTRIBUTE
                                                            </button>
                                                        )}
                                                        <Link
                                                            href={`/admin/posts/edit/${post.id}`}
                                                            className="p-2.5 text-blue-600 hover:bg-blue-50 rounded-xl transition-all active:scale-90"
                                                            title="Edit Post"
                                                        >
                                                            <Pencil className="w-4 h-4" />
                                                        </Link>
                                                        <button
                                                            onClick={() => setConfirmDelete({ id: post.id!, title: post.title })}
                                                            className="p-2.5 text-red-600 hover:bg-red-50 rounded-xl transition-all active:scale-90"
                                                            title="Delete Khabar"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
