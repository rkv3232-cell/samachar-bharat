'use client';

import { useEffect, useState, useCallback } from 'react';
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
    const siteUrl = typeof window !== 'undefined' ? window.location.origin : 'https://samachar-bharat.web.app';
    const postUrl = `${siteUrl}/post/${post.id}`;
    const tags = Array.isArray(post.tags) ? post.tags : [];
    const hashTags = tags.map(t => `#${t}`).join(' ');
    const safeContent = post.content ? post.content.replace(/<[^>]*>/g, '').substring(0, 300) : '';

    const youtubeDescription = `${post.title}\n\n${safeContent}${safeContent.length >= 300 ? '...' : ''}\n\n${hashTags}\n\n🔗 Puri khabar padhen: ${postUrl}\n\n© Samachar Bharat`;

    const [copied, setCopied] = useState(false);
    const [youtubeText, setYoutubeText] = useState(youtubeDescription);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-3 text-gray-900" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-150" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-gray-100 bg-gray-50/50">
                    <div>
                        <h2 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                            <Share2 className="w-4 h-4 text-red-600" />
                            Social Hub
                        </h2>
                        <p className="text-[11px] text-gray-500 line-clamp-1">{post.title}</p>
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg transition text-gray-400 hover:text-gray-700">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <div className="max-h-[80vh] overflow-y-auto">
                    {/* Share Grid */}
                    <div className="p-3.5 space-y-3">
                        <div className="grid grid-cols-2 gap-2">
                            <button onClick={handleFacebook} className="h-8 flex items-center justify-center gap-1.5 bg-[#1877F2] text-white rounded-lg hover:opacity-90 transition text-xs font-bold shadow-xs active:scale-95">
                                <Share2 className="w-3.5 h-3.5" /> Facebook
                            </button>
                            <button onClick={handleWhatsApp} className="h-8 flex items-center justify-center gap-1.5 bg-[#25D366] text-white rounded-lg hover:opacity-90 transition text-xs font-bold shadow-xs active:scale-95">
                                <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                            </button>
                        </div>

                        {/* YouTube Section */}
                        <div className={`p-3 rounded-lg border transition ${isYouTubeConnected ? 'border-red-100 bg-red-50/30' : 'border-gray-100 bg-gray-50/50'}`}>
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-1.5">
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${isYouTubeConnected ? 'bg-red-600 text-white' : 'bg-gray-400 text-white'}`}>
                                        <Video className="w-3 h-3" />
                                    </div>
                                    <span className="text-xs font-bold text-gray-800">YouTube Channel</span>
                                </div>
                                {isYouTubeConnected && (
                                    <span className="flex items-center gap-1 text-[9px] bg-green-100 text-green-700 px-1.5 py-0.2 rounded-full font-bold uppercase tracking-wider">
                                        Connected
                                    </span>
                                )}
                            </div>

                            {uploadSuccess ? (
                                <div className="bg-green-50 border border-green-200 rounded-lg p-2.5 flex items-center justify-between gap-2">
                                    <span className="text-xs font-bold text-green-800">Video Uploaded!</span>
                                    <a href={uploadSuccess} target="_blank" className="flex items-center gap-1 text-xs bg-green-600 text-white px-2.5 py-1 rounded-md hover:bg-green-700 transition font-bold active:scale-95">
                                        Watch <ExternalLink className="w-3 h-3" />
                                    </a>
                                </div>
                            ) : (
                                <button
                                    disabled={isUploading || (isYouTubeConnected && !isVideo)}
                                    onClick={handleYouTubeAction}
                                    className={`h-8 w-full rounded-lg font-bold flex items-center justify-center gap-1.5 transition text-xs shadow-xs active:scale-95 ${!isYouTubeConnected
                                        ? 'bg-gray-800 text-white hover:bg-black'
                                        : isVideo
                                            ? 'bg-red-600 text-white hover:bg-red-700'
                                            : 'bg-red-50 text-red-300 cursor-not-allowed border border-red-100'
                                        }`}
                                >
                                    {isUploading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Video className="w-3.5 h-3.5" />}
                                    {!isYouTubeConnected
                                        ? 'Connect YouTube Channel'
                                        : isVideo
                                            ? 'Upload Video to YouTube'
                                            : 'No Video found to Upload'}
                                </button>
                            )}
                            {!isYouTubeConnected && <p className="text-[10px] text-gray-400 text-center mt-1.5 italic">OAuth setup required from Google Console first.</p>}
                        </div>

                        {/* Description Copy */}
                        <div className="bg-gray-50 rounded-lg p-2.5 border border-gray-100">
                            <div className="flex items-center justify-between mb-1.5">
                                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Post Copy-Template</span>
                                <button onClick={handleCopy} className={`flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md transition active:scale-95 ${copied ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700'}`}>
                                    {copied ? <CheckCircle className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                    {copied ? 'Copied' : 'Copy'}
                                </button>
                            </div>
                            <textarea
                                value={youtubeText}
                                readOnly
                                className="w-full h-24 text-[11px] bg-transparent border-none p-0 focus:ring-0 text-gray-600 font-mono resize-none"
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

    const loadPosts = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getAllPosts(true);
            setPosts(data);
        } catch (e: any) {
            setError('Data load nahi ho saka');
            toast.error('Khabrein load nahi ho saki');
        } finally {
            setLoading(false);
        }
    }, []);

    const loadData = useCallback(async () => {
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
    }, [loadPosts]);

    useEffect(() => {
        loadData();
    }, [loadData]);

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
                <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-[100] flex items-center justify-center p-3 animate-in fade-in duration-150" onClick={() => !deletingId && setConfirmDelete(null)}>
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-xs overflow-hidden p-4 animate-in zoom-in duration-150 border border-gray-100" onClick={e => e.stopPropagation()}>
                        <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-2 border border-red-100">
                            <Trash2 className="w-5 h-5 text-red-600" />
                        </div>
                        <h3 className="text-sm font-bold text-gray-900 text-center mb-1">खबर डिलीट करें?</h3>
                        <p className="text-gray-500 text-xs text-center mb-3.5 px-1 leading-relaxed">क्या आप वाकई इस खबर को डिलीट करना चाहते हैं? यह एक्शन वापस नहीं लिया जा सकता।</p>
                        <div className="flex gap-2">
                            <button
                                disabled={!!deletingId}
                                onClick={() => setConfirmDelete(null)}
                                className="flex-1 h-8 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold transition active:scale-95"
                            >
                                कैंसिल
                            </button>
                            <button
                                disabled={!!deletingId}
                                onClick={handleDelete}
                                className="flex-1 h-8 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs disabled:opacity-50 active:scale-95"
                            >
                                {deletingId ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : "डिलीट करें"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex items-center justify-between mb-3.5">
                <div>
                    <h1 className="text-lg font-extrabold text-gray-900 tracking-tight">Khabar Management</h1>
                    <p className="text-gray-500 text-xs">{posts.length} कुल खबरें</p>
                </div>
                <Link
                    href="/admin/posts/new"
                    prefetch={true}
                    className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-xs active:scale-95"
                >
                    <PlusCircle className="w-3.5 h-3.5" /> नई खबर
                </Link>
            </div>

            <div className="relative mb-3">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search keywords..."
                    className="w-full pl-8 pr-3 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-red-500 bg-white text-xs"
                />
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl border border-gray-100 shadow-2xs">
                    <LoadingSpinner />
                    <p className="text-gray-400 text-xs mt-3 font-medium animate-pulse">खबरें लोड हो रही हैं...</p>
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-2xs border border-gray-200/90 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                            <thead>
                                <tr className="bg-gray-50/80 border-b border-gray-200/80 text-gray-600">
                                    <th className="text-left px-3 py-2 font-bold tracking-wider uppercase text-[10px]">Media</th>
                                    <th className="text-left px-3 py-2 font-bold tracking-wider uppercase text-[10px]">Khabar Title</th>
                                    <th className="text-left px-3 py-2 font-bold tracking-wider uppercase text-[10px] hidden md:table-cell">Status</th>
                                    <th className="text-right px-3 py-2 font-bold tracking-wider uppercase text-[10px]">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filtered.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="text-center py-12 text-gray-400 italic text-xs">कोई खबर नहीं मिली</td>
                                    </tr>
                                ) : (
                                    filtered.map((post) => {
                                        const isVideo = post.image?.match(/\.(mp4|webm|ogg|mov)$/) || post.image?.includes('/video/upload/');
                                        return (
                                            <tr key={post.id} className="hover:bg-red-50/20 transition-colors group">
                                                <td className="px-3 py-1.5">
                                                    <div className="relative w-11 h-9 rounded-md overflow-hidden bg-gray-100 border border-gray-200/70 shadow-2xs">
                                                        {post.image ? (
                                                            isVideo ? (
                                                                <div className="w-full h-full flex items-center justify-center bg-gray-900">
                                                                    <Video className="w-4 h-4 text-gray-400" />
                                                                </div>
                                                            ) : (
                                                                <Image src={post.image} alt="" fill className="object-cover group-hover:scale-105 transition duration-300" />
                                                            )
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-xs bg-gray-50 text-gray-400">📰</div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-3 py-1.5">
                                                    <p className="font-bold text-gray-900 line-clamp-1 group-hover:text-red-600 transition tracking-tight text-xs">{post.title}</p>
                                                    <div className="flex items-center gap-1.5 mt-0.5">
                                                        <span className="text-[9px] font-black text-white bg-red-600 px-1.5 py-0.2 rounded uppercase">
                                                            {categoryMap[post.category] || post.category}
                                                        </span>
                                                        <span className="text-[9px] text-gray-400 font-medium">#{post.id?.substring(0, 8)}</span>
                                                    </div>
                                                </td>
                                                <td className="px-3 py-1.5 hidden md:table-cell">
                                                    <span className="inline-flex items-center px-2 py-0.2 rounded-full text-[9px] font-bold bg-green-50 text-green-700 border border-green-200 uppercase">
                                                        {post.status || 'published'}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-1.5">
                                                    <div className="flex items-center justify-end gap-1.5 text-gray-700">
                                                        {isOwner && (
                                                            <button
                                                                onClick={() => setSharePost(post)}
                                                                className="flex items-center gap-1 px-2 py-1 bg-gray-900 text-white text-[9px] font-black rounded-md hover:bg-black transition shadow-xs active:scale-95"
                                                            >
                                                                <Share2 className="w-3 h-3" /> Share
                                                            </button>
                                                        )}
                                                        <Link
                                                            href={`/admin/posts/edit/${post.id}`}
                                                            prefetch={true}
                                                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-all active:scale-95"
                                                            title="Edit Post"
                                                        >
                                                            <Pencil className="w-3.5 h-3.5" />
                                                        </Link>
                                                        <button
                                                            onClick={() => setConfirmDelete({ id: post.id!, title: post.title })}
                                                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-all active:scale-95"
                                                            title="Delete Khabar"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
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
