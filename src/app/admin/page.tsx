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
        <div>
            <div className="mb-6">
                <h1 className="text-2xl font-extrabold text-gray-800">Dashboard</h1>
                <p className="text-gray-500 text-sm mt-1">NewsPortal Admin Overview</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
                <div className="bg-white rounded-2xl shadow-md p-6 flex items-center gap-4">
                    <div className="w-14 h-14 bg-red-100 rounded-xl flex items-center justify-center">
                        <Newspaper className="w-7 h-7 text-red-600" />
                    </div>
                    <div>
                        <p className="text-gray-500 text-sm">कुल खबरें</p>
                        <p className="text-3xl font-extrabold text-gray-900">
                            {loading ? '—' : posts.length}
                        </p>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-md p-6 flex items-center gap-4">
                    <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center">
                        <BarChart3 className="w-7 h-7 text-blue-600" />
                    </div>
                    <div>
                        <p className="text-gray-500 text-sm">श्रेणियाँ</p>
                        <p className="text-3xl font-extrabold text-gray-900">
                            {loading ? '—' : Object.keys(categoryCount).length}
                        </p>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-md p-6 flex items-center gap-4">
                    <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center">
                        <TrendingUp className="w-7 h-7 text-green-600" />
                    </div>
                    <div>
                        <p className="text-gray-500 text-sm">आज की खबरें</p>
                        <p className="text-3xl font-extrabold text-gray-900">
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <Link
                    href="/admin/posts/new"
                    className="group bg-gradient-to-br from-red-600 to-red-700 text-white rounded-2xl shadow-lg p-6 flex items-center gap-4 hover:shadow-xl transition-all"
                >
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                        <PlusCircle className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg">नई खबर जोड़ें</h3>
                        <p className="text-red-100 text-sm">नया पोस्ट लिखें और publish करें</p>
                    </div>
                </Link>

                <Link
                    href="/"
                    target="_blank"
                    className="group bg-white rounded-2xl shadow-md p-6 flex items-center gap-4 hover:shadow-xl transition-all border border-gray-100"
                >
                    <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                        <Eye className="w-6 h-6 text-gray-600" />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg text-gray-800">Website देखें</h3>
                        <p className="text-gray-500 text-sm">Public website खोलें</p>
                    </div>
                </Link>
            </div>

            {/* Category Breakdown */}
            {!loading && Object.keys(categoryCount).length > 0 && (
                <div className="bg-white rounded-2xl shadow-md p-6">
                    <h2 className="text-lg font-bold text-gray-800 mb-4">श्रेणी अनुसार खबरें</h2>
                    <div className="space-y-3">
                        {Object.entries(categoryCount).map(([cat, count]) => (
                            <div key={cat} className="flex items-center gap-3">
                                <span className="text-sm text-gray-600 w-32 shrink-0">{categoryMap[cat] || cat}</span>
                                <div className="flex-1 bg-gray-100 rounded-full h-2.5">
                                    <div
                                        className="bg-red-600 h-2.5 rounded-full transition-all"
                                        style={{ width: `${Math.min((count / posts.length) * 100, 100)}%` }}
                                    />
                                </div>
                                <span className="text-sm font-bold text-gray-700 w-8 text-right">{count}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
