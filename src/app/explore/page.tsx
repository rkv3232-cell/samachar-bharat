'use client';

import { useState, useEffect, useCallback } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Search, ExternalLink, Calendar, Newspaper, AlertCircle, RefreshCw } from 'lucide-react';

interface Article {
    id: string;
    title: string;
    description: string;
    url: string;
    image: string;
    publishedAt: string;
    source: string;
    category?: string;
}

const CATEGORIES = [
    { id: '', name: 'Trending' },
    { id: 'politics', name: 'राजनीति' },
    { id: 'business', name: 'कारोबार' },
    { id: 'sports', name: 'खेल' },
    { id: 'technology', name: 'तकनीक' },
    { id: 'entertainment', name: 'मनोरंजन' },
    { id: 'world', name: 'दुनिया' }
];

export default function GlobalNewsPage() {
    const [articles, setArticles] = useState<Article[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [query, setQuery] = useState('');
    const [category, setCategory] = useState('');
    const [error, setError] = useState('');

    const fetchNews = useCallback(async (searchQuery = query, cat = category, isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);

        setError('');
        try {
            const params = new URLSearchParams();
            if (searchQuery) params.append('q', searchQuery);
            if (cat) params.append('category', cat);
            params.append('limit', '50');

            const res = await fetch(`/api/news?${params.toString()}`);
            if (!res.ok) throw new Error('सर्वर से डेटा प्राप्त करने में विफल।');

            const data = await res.json();
            setArticles(data.articles || []);
        } catch (err: any) {
            setError(err.message || 'न्यूज़ लोड करने में समस्या आई।');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [query, category]);

    useEffect(() => {
        fetchNews('', category);
    }, [category, fetchNews]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchNews(query, category);
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <Navbar />

            <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-4 md:py-6">
                {/* Hero Section */}
                <div className="bg-gradient-to-r from-red-600 via-red-600 to-rose-600 text-white p-5 md:p-6 rounded-2xl shadow-sm mb-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-2 mb-1.5">
                                <span className="px-2 py-0.5 bg-white/20 rounded-full text-[9px] font-black uppercase tracking-wider">Live Feed</span>
                                <span className="text-white/80 text-xs font-medium">Auto-synced</span>
                            </div>
                            <h1 className="text-xl md:text-2xl font-black leading-tight">
                                ग्लोबल लाइव न्यूज़
                            </h1>
                            <p className="text-white/90 text-xs mt-1">
                                देश और दुनिया की ताजा खबरें एक ही स्थान पर
                            </p>
                        </div>

                        {/* Search Bar */}
                        <form onSubmit={handleSearch} className="relative sm:w-72">
                            <input
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="खबरें खोजें..."
                                className="w-full bg-white text-gray-800 text-xs font-medium pl-8 pr-16 py-2 rounded-xl border border-white/30 focus:outline-none focus:ring-2 focus:ring-white/40 shadow-xs"
                            />
                            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                            <button
                                type="submit"
                                className="absolute right-1 top-1/2 -translate-y-1/2 bg-red-600 hover:bg-red-700 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg transition-colors active:scale-95"
                            >
                                खोजें
                            </button>
                        </form>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-3 no-scrollbar sticky top-14 z-30 bg-slate-50/95 backdrop-blur-xs py-1">
                    {CATEGORIES.map((cat) => (
                        <button
                            key={cat.id || 'all'}
                            type="button"
                            onClick={() => setCategory(cat.id)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all border active:scale-95 ${category === cat.id
                                ? 'bg-red-600 text-white border-red-600 shadow-2xs'
                                : 'bg-white text-gray-700 border-gray-200 hover:border-red-300 hover:text-red-600'
                                }`}
                        >
                            {cat.name || 'सभी खबरें'}
                        </button>
                    ))}

                    <button
                        type="button"
                        onClick={() => fetchNews(query, category, true)}
                        disabled={refreshing}
                        className="ml-auto p-1.5 bg-white border border-gray-200 text-gray-600 hover:text-red-600 rounded-lg shrink-0 transition-colors"
                        title="ताज़ा करें"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-red-600' : ''}`} />
                    </button>
                </div>

                {/* Content Area */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="w-8 h-8 border-3 border-red-600/20 rounded-full border-t-red-600 animate-spin" />
                        <p className="mt-3 text-gray-500 font-bold uppercase tracking-wider text-[11px]">खबरें लोड हो रही हैं...</p>
                    </div>
                ) : error ? (
                    <div className="bg-white p-8 rounded-2xl border border-red-100 shadow-xs text-center max-w-md mx-auto my-8">
                        <AlertCircle className="w-10 h-10 text-red-600 mx-auto mb-3" />
                        <h2 className="text-base font-bold text-gray-900 mb-1">कनेक्शन समस्या</h2>
                        <p className="text-gray-500 text-xs mb-4">{error}</p>
                        <button
                            type="button"
                            onClick={() => fetchNews()}
                            className="px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-bold hover:bg-red-700 transition-all active:scale-95"
                        >
                            फिर से कोशिश करें
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 md:gap-4 mt-2">
                        {articles.map((article, i) => (
                            <a
                                key={article.id || i}
                                href={article.url}
                                target="_blank"
                                rel="noreferrer"
                                className="bg-white rounded-xl overflow-hidden shadow-2xs border border-gray-200 hover:border-red-300 hover:shadow-md transition-all group flex flex-col h-full active:scale-[0.99]"
                            >
                                <div className="relative aspect-[16/10] bg-gray-100 overflow-hidden">
                                    {article.image ? (
                                        <img
                                            src={article.image}
                                            alt={article.title}
                                            loading="lazy"
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center text-gray-300">
                                            <Newspaper className="w-8 h-8 opacity-30" />
                                            <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400 mt-1">Samachar Bharat</span>
                                        </div>
                                    )}
                                    <div className="absolute top-2.5 left-2.5">
                                        <span className="px-2 py-0.5 bg-white/95 backdrop-blur-xs rounded text-red-600 text-[9px] font-bold uppercase tracking-wider shadow-2xs border border-white/60">
                                            {article.source}
                                        </span>
                                    </div>
                                </div>

                                <div className="p-3.5 flex flex-col flex-1">
                                    <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-semibold mb-1.5">
                                        <Calendar className="w-3 h-3 text-red-500" />
                                        <span>{new Date(article.publishedAt).toLocaleDateString('hi-IN', {
                                            day: 'numeric', month: 'short'
                                        })}</span>
                                    </div>

                                    <h2 className="text-sm font-bold text-gray-900 leading-snug mb-1.5 group-hover:text-red-600 transition-colors line-clamp-2">
                                        {article.title}
                                    </h2>

                                    <p className="text-gray-500 text-xs leading-relaxed line-clamp-2 font-medium flex-1">
                                        {article.description}
                                    </p>

                                    <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center justify-between text-xs">
                                        <span className="text-red-600 font-bold text-[11px] flex items-center gap-1">
                                            पूरी खबर <ExternalLink className="w-3 h-3" />
                                        </span>
                                        {article.category && (
                                            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-[9px] font-bold uppercase">
                                                #{article.category}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </a>
                        ))}
                    </div>
                )}
            </main>
            <Footer />
        </div>
    );
}
