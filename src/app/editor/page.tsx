// src/app/editor/page.tsx
// Editor dashboard — shows the current user's posts.
// Owners and admins see ALL posts.

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PlusCircle, Pencil, Trash2, FileText, Eye, AlertCircle } from "lucide-react";
import { getAllPosts, deletePost, type Post, formatDate } from "@/lib/posts";
import { useAuth } from "@/context/AuthContext";
import LoadingSpinner from "@/components/LoadingSpinner";
import { fetchCategories } from "@/lib/firestore/categories";

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


export default function EditorDashboard() {
    const { user, isAdmin } = useAuth();
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [error, setError] = useState("");
    const [categoryMap, setCategoryMap] = useState<Record<string, string>>({});

    useEffect(() => {
        loadPosts();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.uid, isAdmin]);

    const loadPosts = async () => {
        setLoading(true);
        try {
            const [all, fetchedCats] = await Promise.all([
                getAllPosts(true),
                fetchCategories()
            ]);

            const map: Record<string, string> = {};
            DEFAULT_CATEGORIES.forEach(c => map[c.slug] = c.name);
            fetchedCats.forEach(c => map[c.slug] = c.name);
            setCategoryMap(map);

            // Admins/owners see ALL; editors/reporters see only own posts
            const filtered = isAdmin
                ? all
                : all.filter((p) => p.authorId === user?.uid);
            setPosts(filtered);
        } catch (e: unknown) {
            setError("Posts load नहीं हो सके।");
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string, title: string) => {
        if (!confirm(`"${title}" को delete करना चाहते हैं?`)) return;
        setDeletingId(id);
        try {
            await deletePost(id);
            setPosts((prev) => prev.filter((p) => p.id !== id));
        } catch {
            alert("Delete नहीं हो सका।");
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <div>
            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-extrabold text-gray-800">
                        {isAdmin ? "सभी Posts" : "मेरी Posts"}
                    </h1>
                    <p className="mt-1 text-sm text-gray-500">
                        {loading ? "Loading..." : `${posts.length} posts`}
                    </p>
                </div>
                <Link
                    href="/editor/create"
                    className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow transition hover:bg-blue-700"
                >
                    <PlusCircle className="h-4 w-4" />
                    नई Post
                </Link>
            </div>

            {error && (
                <div className="mb-4 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
                    <AlertCircle className="h-5 w-5 shrink-0 text-red-600" />
                    <p className="text-sm text-red-700">{error}</p>
                </div>
            )}

            {loading ? (
                <LoadingSpinner text="Posts load हो रहे हैं..." />
            ) : posts.length === 0 ? (
                <div className="rounded-2xl bg-white py-16 text-center shadow-sm">
                    <FileText className="mx-auto mb-4 h-12 w-12 text-gray-300" />
                    <p className="font-medium text-gray-500">अभी कोई post नहीं है।</p>
                    <Link
                        href="/editor/create"
                        className="mt-4 inline-block rounded-lg bg-blue-600 px-5 py-2 text-sm text-white hover:bg-blue-700"
                    >
                        पहली post लिखें
                    </Link>
                </div>
            ) : (
                <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-100 bg-gray-50">
                                    <th className="px-4 py-3 text-left text-gray-600 font-semibold">Title</th>
                                    {isAdmin && (
                                        <th className="hidden px-4 py-3 text-left text-gray-600 font-semibold md:table-cell">
                                            Author
                                        </th>
                                    )}
                                    <th className="px-4 py-3 text-left text-gray-600 font-semibold">Status</th>
                                    <th className="hidden px-4 py-3 text-left text-gray-600 font-semibold lg:table-cell">
                                        Category
                                    </th>
                                    <th className="hidden px-4 py-3 text-left text-gray-600 font-semibold xl:table-cell">
                                        Date
                                    </th>
                                    <th className="px-4 py-3 text-right text-gray-600 font-semibold">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {posts.map((post) => {
                                    const statusColors: Record<string, string> = {
                                        draft: "bg-gray-100 text-gray-700",
                                        published: "bg-green-100 text-green-700",
                                        archived: "bg-red-100 text-red-700",
                                    };
                                    const badge =
                                        statusColors[post.status ?? "published"] ?? statusColors.published;
                                    const isOwnPost = post.authorId === user?.uid;
                                    const canEdit = isAdmin || isOwnPost;

                                    return (
                                        <tr key={post.id} className="transition hover:bg-gray-50">
                                            <td className="px-4 py-3">
                                                <p className="line-clamp-1 font-semibold text-gray-800" title={post.title}>
                                                    {post.title}
                                                </p>
                                                <p className="mt-0.5 flex items-center gap-1 text-xs text-gray-400">
                                                    <Eye className="h-3 w-3" />
                                                    {post.views ?? 0}
                                                </p>
                                            </td>
                                            {isAdmin && (
                                                <td className="hidden px-4 py-3 md:table-cell">
                                                    <p className="text-sm font-medium text-gray-700">
                                                        {post.authorName ?? "Unknown"}
                                                    </p>
                                                </td>
                                            )}
                                            <td className="px-4 py-3">
                                                <span
                                                    className={`rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${badge}`}
                                                >
                                                    {post.status ?? "published"}
                                                </span>
                                            </td>
                                            <td className="hidden px-4 py-3 lg:table-cell">
                                                <span className="rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                                                    {categoryMap[post.category] ?? post.category}
                                                </span>
                                            </td>
                                            <td className="hidden whitespace-nowrap px-4 py-3 text-xs text-gray-400 xl:table-cell">
                                                {formatDate(post.createdAt as Parameters<typeof formatDate>[0])}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center justify-end gap-2">
                                                    {canEdit && (
                                                        <Link
                                                            href={`/editor/posts/edit/${post.id}`}
                                                            className="rounded-lg p-2 text-blue-600 transition hover:bg-blue-50"
                                                            title="Edit"
                                                        >
                                                            <Pencil className="h-4 w-4" />
                                                        </Link>
                                                    )}
                                                    {canEdit && (
                                                        <button
                                                            onClick={() => handleDelete(post.id!, post.title)}
                                                            disabled={deletingId === post.id}
                                                            className="rounded-lg p-2 text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                                                            title="Delete"
                                                        >
                                                            {deletingId === post.id ? (
                                                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-600/30 border-t-red-600" />
                                                            ) : (
                                                                <Trash2 className="h-4 w-4" />
                                                            )}
                                                        </button>
                                                    )}
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
