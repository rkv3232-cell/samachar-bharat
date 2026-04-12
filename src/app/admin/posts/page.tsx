'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { getAllPosts, deletePost, Post, formatDate } from '@/lib/posts';
import { PlusCircle, Pencil, Trash2, Search, AlertCircle, Eye, X, Share2, MessageCircle, Youtube, Copy, CheckCircle } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import { fetchCategories } from '@/lib/firestore/categories';
import { useAuth } from '@/lib/auth-context';

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
function SocialShareModal({ post, onClose }: { post: Post; onClose: () => void }) {
    const [copied, setCopied] = useState(false);
    const [youtubeText, setYoutubeText] = useState('');

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
            alert('Copy nahi ho saka. Please manually copy karein.');
        }
    };

    const handleYouTubeOpen = () => {
        window.open('https://studio.youtube.com/channel/UC/videos/upload', '_blank');
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-gray-100">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">Social Share</h2>
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{post.title}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Post Preview */}
                <div className="p-5 border-b border-gray-100">
                    <div className="flex gap-3 items-start bg-gray-50 rounded-xl p-3">
                        {post.image && (
                            <div className="relative w-16 h-14 rounded-lg overflow-hidden shrink-0">
                                <Image src={post.image} alt={post.title} fill className="object-cover" sizes="64px" />
                            </div>
                        )}
                        <div className="min-w-0">
                            <p className="font-semibold text-sm text-gray-800 line-clamp-2">{post.title}</p>
                            <p className="text-xs text-gray-500 mt-1 line-clamp-2">{safeContent.substring(0, 100)}</p>
                            {tags.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1.5">
                                    {tags.slice(0, 4).map(t => (
                                        <span key={t} className="text-[10px] bg-red-50 text-red-600 px-1.5 py-0.5 rounded-full font-medium">#{t}</span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Quick Share Buttons */}
                <div className="p-5 border-b border-gray-100">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Quick Share</p>
                    <div className="grid grid-cols-3 gap-3">
                        {/* Facebook */}
                        <button
                            onClick={handleFacebook}
                            className="flex flex-col items-center gap-2 p-4 bg-blue-50 hover:bg-blue-100 border border-blue-100 rounded-xl transition group"
                        >
                            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Share2 className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-xs font-semibold text-blue-700">Facebook</span>
                        </button>

                        {/* WhatsApp */}
                        <button
                            onClick={handleWhatsApp}
                            className="flex flex-col items-center gap-2 p-4 bg-green-50 hover:bg-green-100 border border-green-100 rounded-xl transition group"
                        >
                            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                                <MessageCircle className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-xs font-semibold text-green-700">WhatsApp</span>
                        </button>

                        {/* YouTube */}
                        <button
                            onClick={handleYouTubeOpen}
                            className="flex flex-col items-center gap-2 p-4 bg-red-50 hover:bg-red-100 border border-red-100 rounded-xl transition group"
                        >
                            <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Youtube className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-xs font-semibold text-red-700">YouTube</span>
                        </button>
                    </div>
                </div>

                {/* YouTube / Copy Section */}
                <div className="p-5">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">YouTube / Social Description</p>
                        <button
                            onClick={handleCopy}
                            className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition ${copied ? 'bg-green-100 text-green-700' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
                        >
                            {copied ? <CheckCircle className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                            {copied ? 'Copied!' : 'Copy All'}
                        </button>
                    </div>
                    <textarea
                        value={youtubeText}
                        onChange={e => setYoutubeText(e.target.value)}
                        rows={5}
                        className="w-full text-xs text-gray-700 border border-gray-200 rounded-xl p-3 resize-none focus:outline-none focus:ring-2 focus:ring-red-400 bg-gray-50 font-mono"
                    />
                    <p className="text-[10px] text-gray-400 mt-1.5 text-center">
                        💡 YouTube par "Copy All" karein, phir YouTube Studio mein paste karein
                    </p>
                </div>
            </div>
        </div>
    );
}

// ── Main Page ───────────────────────────────────────────────────────────────
export default function AdminPostsPage() {
    const { isOwner } = useAuth();
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [error, setError] = useState('');
    const [categoryMap, setCategoryMap] = useState<Record<string, string>>({});
    const [sharePost, setSharePost] = useState<Post | null>(null);

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
            setError('Data load नहीं हो सका: ' + e.message);
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
            setError('Posts load नहीं हो सके: ' + e.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string, title: string) => {
        if (!confirm(`क्या आप "${title}" को delete करना चाहते हैं?`)) return;
        setDeletingId(id);
        try {
            await deletePost(id);
            setPosts((prev) => prev.filter((p) => p.id !== id));
        } catch (e: any) {
            alert('Delete नहीं हो सका: ' + e.message);
        } finally {
            setDeletingId(null);
        }
    };

    const filtered = posts.filter(
        (p) =>
            p.title.toLowerCase().includes(search.toLowerCase()) ||
            (categoryMap[p.category] || p.category).toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div>
            {/* Social Share Modal */}
            {sharePost && <SocialShareModal post={sharePost} onClose={() => setSharePost(null)} />}

            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-extrabold text-gray-800">सभी खबरें</h1>
                    <p className="text-gray-500 text-sm mt-1">{posts.length} खबरें published हैं</p>
                </div>
                <Link
                    href="/admin/posts/new"
                    className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition shadow-lg"
                >
                    <PlusCircle className="w-4 h-4" />
                    नई खबर
                </Link>
            </div>

            {/* Search */}
            <div className="relative mb-5">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="खबर खोजें..."
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 bg-white text-sm text-gray-700"
                />
            </div>

            {error && (
                <div className="mb-4 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
                    <p className="text-red-700 text-sm">{error}</p>
                </div>
            )}

            {loading ? (
                <LoadingSpinner text="Posts load हो रहे हैं..." />
            ) : filtered.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl shadow-sm">
                    <p className="text-5xl mb-4">📭</p>
                    <p className="text-gray-500 font-medium">
                        {search ? 'कोई खबर नहीं मिली।' : 'अभी कोई खबर नहीं है।'}
                    </p>
                    {!search && (
                        <Link href="/admin/posts/new" className="mt-4 inline-block bg-red-600 text-white px-5 py-2 rounded-lg text-sm hover:bg-red-700 transition">
                            पहली खबर जोड़ें
                        </Link>
                    )}
                </div>
            ) : (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-100">
                                    <th className="text-left px-4 py-3 text-gray-600 font-semibold w-16">Image</th>
                                    <th className="text-left px-4 py-3 text-gray-600 font-semibold">Title</th>
                                    <th className="text-left px-4 py-3 text-gray-600 font-semibold hidden md:table-cell">Author</th>
                                    <th className="text-left px-4 py-3 text-gray-600 font-semibold">Status</th>
                                    <th className="text-left px-4 py-3 text-gray-600 font-semibold hidden lg:table-cell">Category</th>
                                    <th className="text-left px-4 py-3 text-gray-600 font-semibold hidden xl:table-cell">Date</th>
                                    <th className="text-right px-4 py-3 text-gray-600 font-semibold">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filtered.map((post) => {
                                    const statusColors: Record<string, string> = {
                                        draft: 'bg-gray-100 text-gray-700',
                                        in_review: 'bg-yellow-100 text-yellow-700',
                                        published: 'bg-green-100 text-green-700',
                                        archived: 'bg-red-100 text-red-700',
                                        scheduled: 'bg-blue-100 text-blue-700'
                                    };
                                    const badgeColor = statusColors[post.status || 'published'] || statusColors.published;
                                    const isVideoUrl = (url: string) =>
                                        url?.match(/\.(mp4|webm|ogg|mov)$/) != null || url?.includes('/video/upload/');

                                    return (
                                        <tr key={post.id} className="hover:bg-gray-50 transition">
                                            <td className="px-4 py-3">
                                                <div className="relative w-12 h-10 rounded-lg overflow-hidden bg-gray-100">
                                                    {post.image ? (
                                                        isVideoUrl(post.image) ? (
                                                            <div className="w-full h-full flex items-center justify-center bg-black text-white text-xs">Video</div>
                                                        ) : (
                                                            <Image src={post.image} alt={post.title} fill className="object-cover" sizes="48px" />
                                                        )
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-lg">📰</div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <p className="font-semibold text-gray-800 line-clamp-1" title={post.title}>{post.title}</p>
                                                <div className="flex items-center gap-2 mt-1 text-xs text-gray-400 lg:hidden">
                                                    <span>{categoryMap[post.category] || post.category}</span>
                                                    <span>•</span>
                                                    <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {post.views || 0}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 hidden md:table-cell">
                                                <p className="text-gray-700 text-sm font-medium">{post.authorName || 'Admin'}</p>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded-md ${badgeColor}`}>
                                                    {post.status || 'Published'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 hidden lg:table-cell">
                                                <span className="bg-red-50 border border-red-100 text-red-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                                                    {categoryMap[post.category] || post.category}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-gray-400 text-xs hidden xl:table-cell whitespace-nowrap">
                                                {formatDate(post.createdAt as any)}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center justify-end gap-2">
                                                    {/* ── Owner Only Social Share Button ── */}
                                                    {isOwner && (
                                                        <button
                                                            onClick={() => setSharePost(post)}
                                                            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gradient-to-r from-blue-600 to-green-500 text-white text-xs font-semibold rounded-lg hover:opacity-90 transition shadow-sm"
                                                            title="Share on Social Media"
                                                        >
                                                            <Share2 className="w-3.5 h-3.5" />
                                                            Share
                                                        </button>
                                                    )}

                                                    <Link
                                                        href={`/admin/posts/edit/${post.id}`}
                                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                                        title="Edit"
                                                    >
                                                        <Pencil className="w-4 h-4" />
                                                    </Link>
                                                    <button
                                                        onClick={() => handleDelete(post.id!, post.title)}
                                                        disabled={deletingId === post.id}
                                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
                                                        title="Delete"
                                                    >
                                                        {deletingId === post.id ? (
                                                            <div className="w-4 h-4 border-2 border-red-600/30 border-t-red-600 rounded-full animate-spin" />
                                                        ) : (
                                                            <Trash2 className="w-4 h-4" />
                                                        )}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
