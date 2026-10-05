'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getAllPosts } from '@/lib/posts';
import { Newspaper, PlusCircle, TrendingUp, BarChart3, Eye } from 'lucide-react';
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

export default function AdminDashboard() {
    const [posts, setPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [categoryMap, setCategoryMap] = useState<Record<string, string>>({});

    useEffect(() => {
        const loadData = async () => {
            try {
                const [allPosts, fetchedCats] = await Promise.all([
                    getAllPosts(true),
                    fetchCategories()
                ]);

                const map: Record<string, string> = {};
                DEFAULT_CATEGORIES.forEach(c => map[c.slug] = c.name);
                fetchedCats.forEach(c => map[c.slug] = c.name);

                setCategoryMap(map);
                setPosts(allPosts);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    const categoryCount = posts.reduce((acc: Record<string, number>, post) => {
        acc[post.category] = (acc[post.category] || 0) + 1;
        return acc;
    }, {});


    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-lg font-extrabold text-gray-900 tracking-tight">Dashboard</h1>
                    <p className="text-gray-500 text-xs">Samachar Bharat CMS Overview</p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <div className="bg-white rounded-xl border border-gray-200/80 shadow-2xs p-3.5 flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-50 text-red-600 rounded-lg flex items-center justify-center shrink-0">
                        <Newspaper className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-gray-500 text-xs font-medium">कुल खबरें</p>
                        <p className="text-xl font-black text-gray-900 leading-tight">
                            {loading ? '—' : posts.length}
                        </p>
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200/80 shadow-2xs p-3.5 flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center shrink-0">
                        <BarChart3 className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-gray-500 text-xs font-medium">श्रेणियाँ</p>
                        <p className="text-xl font-black text-gray-900 leading-tight">
                            {loading ? '—' : Object.keys(categoryCount).length}
                        </p>
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200/80 shadow-2xs p-3.5 flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-50 text-green-600 rounded-lg flex items-center justify-center shrink-0">
                        <TrendingUp className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-gray-500 text-xs font-medium">आज की खबरें</p>
                        <p className="text-xl font-black text-gray-900 leading-tight">
                            {loading ? '—' : posts.filter(p => {
                                if (!p.createdAt) return false;
                                const d = p.createdAt.toDate ? p.createdAt.toDate() : new Date(p.createdAt);
                                return d.toDateString() === new Date().toDateString();
                            }).length}
                        </p>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Link
                    href="/admin/posts/new"
                    prefetch={true}
                    className="group bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl shadow-xs p-3.5 flex items-center gap-3 hover:shadow-sm transition-all active:scale-[0.99]"
                >
                    <div className="w-9 h-9 bg-white/20 rounded-lg flex items-center justify-center shrink-0">
                        <PlusCircle className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="font-bold text-sm">नई खबर जोड़ें</h3>
                        <p className="text-red-100 text-xs">नया पोस्ट लिखें और तुरंत प्रकाशित करें</p>
                    </div>
                </Link>

                <Link
                    href="/"
                    prefetch={true}
                    target="_blank"
                    className="group bg-white rounded-xl border border-gray-200/90 shadow-2xs p-3.5 flex items-center gap-3 hover:border-red-300 hover:shadow-xs transition-all active:scale-[0.99]"
                >
                    <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center shrink-0 text-gray-600 group-hover:text-red-600 transition-colors">
                        <Eye className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="font-bold text-sm text-gray-800 group-hover:text-red-600 transition-colors">Website देखें</h3>
                        <p className="text-gray-500 text-xs">Public website एक नए टैब में खोलें</p>
                    </div>
                </Link>
            </div>

            {/* Category Breakdown */}
            {!loading && Object.keys(categoryCount).length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200/80 shadow-2xs p-4">
                    <h2 className="text-sm font-bold text-gray-800 mb-3">श्रेणी अनुसार खबरें</h2>
                    <div className="space-y-2">
                        {Object.entries(categoryCount).map(([cat, count]) => (
                            <div key={cat} className="flex items-center gap-3 text-xs">
                                <span className="text-gray-600 w-28 shrink-0 truncate">{categoryMap[cat] || cat}</span>
                                <div className="flex-1 bg-gray-100 rounded-full h-2">
                                    <div
                                        className="bg-red-600 h-2 rounded-full transition-all"
                                        style={{ width: `${Math.min((count / posts.length) * 100, 100)}%` }}
                                    />
                                </div>
                                <span className="font-bold text-gray-700 w-6 text-right">{count}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
