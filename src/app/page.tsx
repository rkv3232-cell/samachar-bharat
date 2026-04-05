import { Metadata } from 'next';
import Image from 'next/image';
import { getLatestPosts, getPostsByCategory } from '@/lib/posts';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import NewsCard from '@/components/NewsCard';
import BreakingTicker from '@/components/BreakingTicker';
import { TrendingUp, ChevronRight, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { fetchLiveStatus } from '@/lib/firestore';

import WeatherWidget from '@/components/WeatherWidget';
import InstagramStories from '@/components/InstagramStories';

export const metadata: Metadata = {
  title: 'Samachar Bharat | ताज़ा हिंदी समाचार',
  description: 'भारत की ताज़ा खबरें पढ़ें Samachar Bharat पर। राजनीति, देश, विदेश, क्राइम, कारोबार, धर्म और लाइफस्टाइल की खबरें।',
};

export const revalidate = 60; // Revalidate every 60 seconds (ISR)

export default async function HomePage() {
  let latestPosts: any[] = [];
  let crimePosts: any[] = [];
  let rajnitiPosts: any[] = [];
  let hasError = false;
  let errorMessage = '';

  try {
    const [latest, crime, rajniti] = await Promise.all([
      getLatestPosts(12),
      getPostsByCategory('crime', 5),
      getPostsByCategory('rajniti', 5),
    ]);

    latestPosts = latest || [];
    crimePosts = crime || [];
    rajnitiPosts = rajniti || [];

  } catch (e: any) {
    hasError = true;
    errorMessage = e.message || String(e);
    console.error('Failed to fetch posts:', e);
  }

  const featuredPost = latestPosts[0];
  const sidebarPosts = latestPosts.slice(1, 5); // Exactly 4 small side news
  const gridPosts = latestPosts.slice(5, 11);
  const breakingHeadlines = latestPosts.slice(0, 5).map(p => p.title);

  return (
    <div className="min-h-screen bg-[#fcfcfd] dark:bg-gray-950 flex flex-col transition-colors duration-300">
      <Navbar />
      <WeatherWidget />

      {/* Ticker Section */}
      {breakingHeadlines.length > 0 && <BreakingTicker headlines={breakingHeadlines} />}

      <main className="max-w-7xl mx-auto px-4 py-4 md:py-8 flex-1 w-full animate-in fade-in duration-700">

        {latestPosts.length > 0 && <InstagramStories posts={latestPosts} />}

        {/* Error States */}
        {!process.env.NEXT_PUBLIC_FIREBASE_API_KEY || !process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ? (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 mb-8 text-center shadow-sm">
            <h2 className="text-red-700 font-extrabold text-lg flex items-center justify-center gap-2 mb-2">
              <AlertTriangle className="w-6 h-6" /> Firebase Not Connected
            </h2>
            <p className="text-red-600 text-sm">
              आपके <code className="bg-red-100 px-1 rounded text-red-800">.env.local</code> में Firebase credentials गायब हैं।
            </p>
          </div>
        ) : (
          hasError && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 mb-8 text-center shadow-sm">
              <p className="text-yellow-700 text-sm font-semibold flex items-center justify-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                डेटा लोड करने में कुछ समस्या आ रही है।
              </p>
            </div>
          )
        )}

        {latestPosts.length === 0 && !hasError && (
          <div className="text-center py-20 bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 mb-8 mt-5">
            <p className="text-6xl mb-5 opacity-40">📭</p>
            <h2 className="text-xl md:text-2xl font-extrabold text-gray-800 dark:text-gray-100">अभी कोई समाचार नहीं है</h2>
            <p className="text-gray-500 text-xs md:text-sm mt-2 mb-6">Admin Panel से नई खबरें जोड़ें</p>
            <Link href="/admin" className="inline-block bg-red-600 font-bold text-white px-8 py-3 rounded-xl hover:bg-black transition-all">
              Admin Panel
            </Link>
          </div>
        )}

        {latestPosts.length > 0 && (
          <>
            {/* Hero Section */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 mb-12">
              <div className="lg:col-span-8">
                {featuredPost && (
                  <Link href={`/post/${featuredPost.id}`} className="group relative block rounded-3xl overflow-hidden bg-gray-900 aspect-[16/9] shadow-xl md:shadow-2xl">
                    <Image
                      src={featuredPost.image}
                      alt={featuredPost.title}
                      fill
                      priority
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-80"
                      sizes="(max-width: 1024px) 100vw, 66vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                    <div className="absolute bottom-0 p-5 md:p-10 w-full">
                      <span className="inline-block bg-red-600 text-white text-[10px] md:text-xs font-black px-4 py-1 rounded-full mb-3 uppercase tracking-widest shadow-lg">Featured News</span>
                      <h2 className="text-xl md:text-3xl lg:text-4xl font-black text-white leading-tight transition-colors group-hover:text-red-400 drop-shadow-md">
                        {featuredPost.title}
                      </h2>
                    </div>
                  </Link>
                )}
              </div>
              <div className="lg:col-span-4 space-y-4 md:space-y-6 mt-6 lg:mt-0">
                <div className="flex items-center gap-2 mb-2 px-1">
                  <TrendingUp className="text-red-600" size={18} />
                  <h3 className="font-black text-gray-900 dark:text-white uppercase tracking-tight text-sm">Recent Updates</h3>
                </div>
                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                  {sidebarPosts.map(post => (
                    <NewsCard key={post.id} post={post} variant="compact" />
                  ))}
                </div>
              </div>
            </div>

            {/* Crime Section */}
            {crimePosts.length > 0 && (
              <section className="mb-12 md:mb-16">
                <div className="flex items-center justify-between mb-6 md:mb-8 pb-3 border-b-2 border-gray-100 dark:border-gray-800">
                  <div className="flex items-center gap-3">
                    <span className="w-1.5 h-6 bg-red-600 rounded-full" />
                    <h2 className="text-lg md:text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">क्राइम रिपोर्ट</h2>
                  </div>
                  <Link href="/category/crime" className="group flex items-center gap-1 text-red-600 font-bold text-xs md:text-sm tracking-tight hover:underline">
                    सब देखें <ChevronRight size={14} className="transition-transform group-hover:translate-x-1" />
                  </Link>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                  {crimePosts.map(post => <NewsCard key={post.id} post={post} />)}
                </div>
              </section>
            )}

            {/* Political News */}
            {rajnitiPosts.length > 0 && (
              <section className="mb-12 md:mb-16">
                <div className="flex items-center justify-between mb-6 md:mb-8 pb-3 border-b-2 border-gray-100 dark:border-gray-800">
                  <div className="flex items-center gap-3">
                    <span className="w-1.5 h-6 bg-blue-600 rounded-full" />
                    <h2 className="text-lg md:text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">राजनीति हलचल</h2>
                  </div>
                  <Link href="/category/rajniti" className="group flex items-center gap-1 text-blue-600 font-bold text-xs md:text-sm tracking-tight hover:underline">
                    सब देखें <ChevronRight size={14} className="transition-transform group-hover:translate-x-1" />
                  </Link>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                  {rajnitiPosts.map(post => <NewsCard key={post.id} post={post} />)}
                </div>
              </section>
            )}

            {/* Grid Section */}
            {gridPosts.length > 0 && (
              <section>
                <div className="flex items-center gap-3 mb-6 md:mb-8 pb-3 border-b-2 border-gray-100 dark:border-gray-800">
                  <span className="w-1.5 h-6 bg-gray-900 dark:bg-white rounded-full" />
                  <h2 className="text-lg md:text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">अन्य सुर्खियां</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                  {gridPosts.map(post => <NewsCard key={post.id} post={post} />)}
                </div>
              </section>
            )}
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
