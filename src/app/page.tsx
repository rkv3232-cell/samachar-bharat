import { Metadata } from 'next';
import Image from 'next/image';
import { getLatestPosts, getPostsByCategory } from '@/lib/posts';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import NewsCard from '@/components/NewsCard';
import BreakingTicker from '@/components/BreakingTicker';
import { TrendingUp, ChevronRight, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

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

  try {
    const [latest, crime, rajniti] = await Promise.all([
      getLatestPosts(12),
      getPostsByCategory('crime', 4),
      getPostsByCategory('rajniti', 4),
    ]);

    latestPosts = latest || [];
    crimePosts = crime || [];
    rajnitiPosts = rajniti || [];

  } catch (e: any) {
    hasError = true;
    console.error('Failed to fetch posts:', e);
  }

  const featuredPost = latestPosts[0];
  const sidebarPosts = latestPosts.slice(1, 5); // 4 compact side news
  const gridPosts = latestPosts.slice(5, 11);
  const breakingHeadlines = latestPosts.slice(0, 5).map(p => p.title);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
      <WeatherWidget />

      {/* Ticker Section */}
      <BreakingTicker headlines={breakingHeadlines} />

      <main className="max-w-7xl mx-auto px-4 py-3 md:py-5 flex-1 w-full animate-in fade-in duration-300">

        {latestPosts.length > 0 && <InstagramStories posts={latestPosts} />}

        {/* Error States */}
        {!process.env.NEXT_PUBLIC_FIREBASE_API_KEY || !process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-5 text-center shadow-xs">
            <h2 className="text-red-700 font-bold text-sm flex items-center justify-center gap-1.5 mb-1">
              <AlertTriangle className="w-4 h-4" /> Firebase Not Connected
            </h2>
            <p className="text-red-600 text-xs">
              आपके <code className="bg-red-100 px-1 rounded text-red-800">.env.local</code> में Firebase credentials गायब हैं।
            </p>
          </div>
        ) : (
          hasError && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 mb-5 text-center shadow-xs">
              <p className="text-yellow-700 text-xs font-semibold flex items-center justify-center gap-1.5">
                <AlertTriangle className="w-4 h-4" />
                डेटा लोड करने में कुछ समस्या आ रही है।
              </p>
            </div>
          )
        )}

        {latestPosts.length === 0 && !hasError && (
          <div className="text-center py-12 bg-white rounded-2xl shadow-xs border border-gray-200 mb-6 mt-3">
            <p className="text-4xl mb-3 opacity-40">📭</p>
            <h2 className="text-base md:text-lg font-bold text-gray-800">अभी कोई समाचार नहीं है</h2>
            <p className="text-gray-500 text-xs mt-1 mb-4">Admin Panel से नई खबरें जोड़ें</p>
            <Link href="/admin" className="inline-block bg-red-600 font-bold text-white text-xs px-5 py-2 rounded-lg hover:bg-red-700 transition-all shadow-xs active:scale-95">
              Admin Panel
            </Link>
          </div>
        )}

        {latestPosts.length > 0 && (
          <>
            {/* Hero Section */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-5 mb-6 md:mb-8">
              <div className="lg:col-span-8">
                {featuredPost && (
                  <Link
                    href={`/post/${featuredPost.id}`}
                    className="group relative block rounded-2xl overflow-hidden bg-gray-900 aspect-[16/9] md:aspect-[21/9] lg:aspect-[16/9] max-h-[380px] shadow-sm hover:shadow-md transition-all active:scale-[0.99]"
                  >
                    {featuredPost.image ? (
                      <Image
                        src={featuredPost.image}
                        alt={featuredPost.title}
                        fill
                        priority
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 opacity-85"
                        sizes="(max-width: 1024px) 100vw, 66vw"
                      />
                    ) : (
                      <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                        <span className="text-4xl opacity-40">📰</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent" />
                    <div className="absolute bottom-0 p-4 sm:p-6 w-full">
                      <span className="inline-block bg-red-600 text-white text-[9px] md:text-[10px] font-black px-2.5 py-0.5 rounded mb-2 uppercase tracking-wider shadow-xs">
                        Featured News
                      </span>
                      <h2 className="text-base sm:text-xl lg:text-2xl font-black text-white leading-snug transition-colors group-hover:text-red-300 drop-shadow-xs line-clamp-2">
                        {featuredPost.title}
                      </h2>
                    </div>
                  </Link>
                )}
              </div>
              <div className="lg:col-span-4 flex flex-col mt-4 lg:mt-0">
                <div className="flex items-center gap-1.5 mb-2 px-1">
                  <TrendingUp className="text-red-600" size={15} />
                  <h3 className="font-bold text-gray-900 uppercase tracking-wider text-xs">Recent Updates</h3>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 px-3 py-1 shadow-2xs divide-y divide-gray-100 flex-1">
                  {sidebarPosts.map(post => (
                    <NewsCard key={post.id} post={post} variant="compact" />
                  ))}
                </div>
              </div>
            </div>

            {/* Crime Section */}
            {crimePosts.length > 0 && (
              <section className="mb-6 md:mb-8">
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-200">
                  <div className="flex items-center gap-2">
                    <span className="w-1 h-4 bg-red-600 rounded-full" />
                    <h2 className="text-sm md:text-base font-black text-gray-900 uppercase tracking-tight">क्राइम रिपोर्ट</h2>
                  </div>
                  <Link href="/category/crime" className="group flex items-center gap-0.5 text-red-600 font-bold text-xs tracking-tight hover:underline">
                    सब देखें <ChevronRight size={13} className="transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                  {crimePosts.map(post => <NewsCard key={post.id} post={post} />)}
                </div>
              </section>
            )}

            {/* Political News */}
            {rajnitiPosts.length > 0 && (
              <section className="mb-6 md:mb-8">
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-200">
                  <div className="flex items-center gap-2">
                    <span className="w-1 h-4 bg-blue-600 rounded-full" />
                    <h2 className="text-sm md:text-base font-black text-gray-900 uppercase tracking-tight">राजनीति हलचल</h2>
                  </div>
                  <Link href="/category/rajniti" className="group flex items-center gap-0.5 text-blue-600 font-bold text-xs tracking-tight hover:underline">
                    सब देखें <ChevronRight size={13} className="transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                  {rajnitiPosts.map(post => <NewsCard key={post.id} post={post} />)}
                </div>
              </section>
            )}

            {/* Grid Section */}
            {gridPosts.length > 0 && (
              <section className="mb-6">
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-200">
                  <span className="w-1 h-4 bg-red-600 rounded-full" />
                  <h2 className="text-sm md:text-base font-black text-gray-900 uppercase tracking-tight">अन्य सुर्खियां</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
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
