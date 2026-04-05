'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { getAllPosts, deletePost, Post, formatDate } from '@/lib/posts';
import { PlusCircle, Pencil, Trash2, Search, AlertCircle, Eye } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import { fetchCategories } from '@/lib/firestore/categories';

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


export default function AdminPostsPage() {
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [error, setError] = useState('');
    const [categoryMap, setCategoryMap] = useState<Record<string, string>>({});

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            // Fetch categories first
            const fetchedCats = await fetchCategories();
            const map: Record<string, string> = {};

            // Add defaults
            DEFAULT_CATEGORIES.forEach(c => map[c.slug] = c.name);
            // Add firestore cats (will override defaults if same slug, which is fine)
            fetchedCats.forEach(c => map[c.slug] = c.name);

            setCategoryMap(map);

            // Fetch posts
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
            const data = await getAllPosts(true); // true to include drafts
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
                                    const isVideo = (url: string) => {
                                        if (!url) return false;
                                        return url.match(/\.(mp4|webm|ogg|mov)$/) || url.includes('/video/upload/');
                                    };

                                    return (
                                        <tr key={post.id} className="hover:bg-gray-50 transition">
                                            <td className="px-4 py-3">
                                                <div className="relative w-12 h-10 rounded-lg overflow-hidden bg-gray-100">
                                                    {post.image ? (
                                                        isVideo(post.image) ? (
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
