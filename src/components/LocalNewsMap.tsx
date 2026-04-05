"use client";

import { useState, useEffect } from "react";
import { MapPin, Navigation2, Search, Map as MapIcon, ChevronRight } from "lucide-react";
import { getPostsByCategory, searchPostsLocally, Post } from "@/lib/posts";
import Link from "next/link";

const CITIES = [
    { id: "ghazipur", name: "गाजीपुर (Ghazipur)", lat: 25.5788, lng: 83.5780 },
    { id: "varanasi", name: "वाराणसी (Varanasi)", lat: 25.3176, lng: 82.9739 },
    { id: "lucknow", name: "लखनऊ (Lucknow)", lat: 26.8467, lng: 80.9462 },
    { id: "patna", name: "पटना (Patna)", lat: 25.5941, lng: 85.1376 },
    { id: "delhi", name: "दिल्ली (Delhi)", lat: 28.6139, lng: 77.2090 },
];

export default function LocalNewsMap() {
    const [selectedCity, setSelectedCity] = useState(CITIES[0]);
    const [news, setNews] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLocalNews = async () => {
            setLoading(true);
            try {
                // Grab specifically by matching English or Hindi city name
                const kw = selectedCity.name.split(' ')[0]; // E.g., 'वाराणसी'
                const posts = await searchPostsLocally(kw, 50);
                setNews(posts.slice(0, 4));
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };

        fetchLocalNews();
    }, [selectedCity]);

    return (
        <div className="bg-white dark:bg-gray-900 border border-emerald-100 dark:border-emerald-900/30 rounded-2xl overflow-hidden shadow-xl shadow-emerald-100/20 dark:shadow-none mb-8">
            <div className="flex items-center gap-3 p-6 pb-4 border-b border-gray-100 dark:border-gray-800">
                <div className="w-10 h-10 bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-full flex items-center justify-center">
                    <MapIcon size={20} />
                </div>
                <div>
                    <h2 className="text-xl font-extrabold text-gray-900 dark:text-gray-100">लोकल न्यूज़ मैप (Local Maps)</h2>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-0.5">अपने शहर की ख़बरें जानें</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-gray-100 dark:divide-gray-800">
                {/* Left Side: Map/Cities */}
                <div className="p-6 md:col-span-1 bg-gray-50/50 dark:bg-gray-800/20">
                    <div className="relative mb-4">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="शहर खोजें..."
                            className="w-full pl-9 pr-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                    </div>

                    <div className="space-y-2">
                        {CITIES.map(city => (
                            <button
                                key={city.id}
                                onClick={() => setSelectedCity(city)}
                                className={`w-full flex items-center justify-between p-3 rounded-xl transition-colors ${selectedCity.id === city.id
                                    ? 'bg-emerald-600 text-white shadow-md'
                                    : 'hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-gray-700 dark:text-gray-300'
                                    }`}
                            >
                                <div className="flex items-center gap-2">
                                    <MapPin size={16} className={selectedCity.id === city.id ? "text-emerald-200" : "text-emerald-500"} />
                                    <span className="font-bold text-sm text-left">{city.name}</span>
                                </div>
                                {selectedCity.id === city.id && <Navigation2 size={16} className="text-emerald-200 ml-2" />}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Right Side: Local News Feed */}
                <div className="p-6 md:col-span-2">
                    <div className="flex items-center gap-2 mb-4">
                        <Navigation2 size={18} className="text-emerald-600 dark:text-emerald-400 fill-current" />
                        <h3 className="font-extrabold text-gray-800 dark:text-gray-200">
                            {selectedCity.name} की ताज़ा ख़बरें
                        </h3>
                    </div>

                    {loading ? (
                        <div className="space-y-4 animate-pulse">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="flex gap-4">
                                    <div className="w-20 h-20 bg-gray-200 dark:bg-gray-700 rounded-lg shrink-0" />
                                    <div className="flex-1 space-y-2 py-1">
                                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full" />
                                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : news.length > 0 ? (
                        <div className="space-y-4">
                            {news.map(post => (
                                <Link
                                    href={`/post/${post.id}`}
                                    key={post.id}
                                    className="flex gap-4 group hover:bg-gray-50 dark:hover:bg-gray-800/50 p-2 -mx-2 rounded-xl transition"
                                >
                                    <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-lg shrink-0 overflow-hidden relative">
                                        {post.image ? (
                                            /* eslint-disable-next-line @next/next/no-img-element */
                                            <img
                                                src={post.image.includes('.mp4') ? post.image.replace('.mp4', '.jpg') : post.image}
                                                alt={post.title}
                                                className="w-full h-full object-cover group-hover:scale-110 transition duration-300"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <MapPin className="text-gray-300" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-bold text-gray-900 dark:text-gray-100 text-sm line-clamp-2 leading-tight group-hover:text-emerald-600 transition">
                                            {post.title}
                                        </h4>
                                        <div className="flex items-center gap-2 mt-2 text-[10px] uppercase font-bold text-gray-400">
                                            <span>{post.category}</span>
                                            <span>•</span>
                                            <span>{new Date(post.createdAt as any).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                    <div className="self-center pr-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <ChevronRight size={16} className="text-emerald-500" />
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-10">
                            <MapPin className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                            <p className="text-gray-500 text-sm font-medium">इस क्षेत्र से अभी कोई खबर नहीं है।</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
