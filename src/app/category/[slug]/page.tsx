import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getPostsByCategory } from '@/lib/posts';
import { fetchCategories } from '@/lib/firestore/categories';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CategoryPostList from '@/components/sorting/CategoryPostList';
import { Suspense } from 'react';

interface Props {
    params: Promise<{ slug: string }>;
}

import slugify from 'slugify';

const SLUG_MAP: Record<string, string> = {
    'uttar-pradesh': 'उत्तर प्रदेश',
    'desh': 'देश',
    'videsh': 'विदेश',
    'karobar': 'कारोबार',
    'business': 'कारोबार',
    'crime': 'क्राइम',
    'dharm': 'धर्म',
    'rajniti': 'राजनीति',
    'politics': 'राजनीति',
    'lifestyle': 'लाइफस्टाइल',
    'sports': 'खेल',
    'entertainment': 'मनोरंजन',
    'technology': 'तकनीक',
    'world': 'दुनिया'
};

// Fetch category name from Firestore by slug or fallback to map
async function getCategoryName(slug: string): Promise<string | null> {
    try {
        // 1. Check dynamic map first (fastest)
        if (SLUG_MAP[slug]) return SLUG_MAP[slug];

        // 2. Check Firestore
        const categories = await fetchCategories();
        const match = categories.find((c) => c.slug === slug || slugify(c.name, { lower: true }) === slug);
        return match?.name ?? null;
    } catch {
        return SLUG_MAP[slug] || null;
    }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    const catLabel = await getCategoryName(slug);
    if (!catLabel) return { title: 'Category Not Found' };
    return {
        title: `${catLabel} | Samachar Bharat`,
        description: `${catLabel} की ताज़ा खबरें पढ़ें Samachar Bharat पर।`,
    };
}

export const revalidate = 60;

export default async function CategoryPage({ params }: Props) {
    const { slug } = await params;
    const catLabel = await getCategoryName(slug);

    if (!catLabel) {
        notFound();
    }

    let posts: any[] = [];
    let hasError = false;

    try {
        const results = await Promise.allSettled([
            getPostsByCategory(slug, 30),
        ]);
        if (results[0].status === 'fulfilled') posts = results[0].value;
    } catch (e) {
        hasError = true;
        console.error('Error fetching category posts:', e);
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />

            <main className="max-w-7xl mx-auto px-4 py-6">
                {/* Category Header */}
                <div className="bg-red-600 text-white rounded-xl p-6 mb-8 flex items-center gap-4">
                    <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center text-3xl">
                        📰
                    </div>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-extrabold">{catLabel}</h1>
                        <p className="text-red-100 text-sm mt-1">{catLabel} की ताज़ा खबरें</p>
                    </div>
                </div>

                {hasError && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 text-center">
                        <p className="text-yellow-700 text-sm">⚠️ डेटा लोड नहीं हो सका। कृपया Firebase credentials जांचें।</p>
                    </div>
                )}

                {posts.length === 0 && !hasError ? (
                    <div className="text-center py-20">
                        <p className="text-5xl mb-4">📭</p>
                        <h2 className="text-xl font-bold text-gray-600">इस श्रेणी में अभी कोई खबर नहीं है</h2>
                        <p className="text-gray-400 text-sm mt-2">Admin Panel से {catLabel} की खबरें जोड़ें।</p>
                    </div>
                ) : (
                    <Suspense fallback={<div className="text-center py-20 text-gray-400">Loading Latest News...</div>}>
                        <CategoryPostList initialPosts={posts} category={slug} />
                    </Suspense>
                )}
            </main>

            <Footer />
        </div>
    );
}
