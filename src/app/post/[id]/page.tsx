import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getPostById, getPostsByCategory, Post } from '@/lib/posts';
import { formatDate } from '@/lib/posts';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import NewsCard from '@/components/NewsCard';
import ViewTracker from '@/components/views/ViewTracker';
import LikeButton from '@/components/engagement/LikeButton';
import BookmarkButton from '@/components/engagement/BookmarkButton';
import CommentForm from '@/components/comments/CommentForm';
import CommentList from '@/components/comments/CommentList';

import AISummary from '@/components/AISummary';
import DownloadButton from '@/components/engagement/DownloadButton';
import { Clock, Tag, ChevronLeft } from 'lucide-react';
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


interface Props {
    params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { id } = await params;
    try {
        const post = await getPostById(id);
        if (!post) return { title: 'Post Not Found' };
        return {
            title: post.title,
            description: post.content?.replace(/<[^>]+>/g, '').substring(0, 160) || '',
            openGraph: {
                title: post.title,
                description: post.content?.replace(/<[^>]+>/g, '').substring(0, 160) || '',
                images: post.image ? [{ url: post.image }] : [],
            },
        };
    } catch {
        return { title: 'Post Not Found' };
    }
}

export default async function PostPage({ params }: Props) {
    const { id } = await params;
    let post: Post | null = null;
    let relatedPosts: Post[] = [];

    try {
        post = await getPostById(id);
        if (!post) {
            return notFound();
        }

        if (post?.category) {
            const related = await getPostsByCategory(post.category, 4);
            relatedPosts = (related || []).filter((p) => p.id !== id).slice(0, 3);
        }
    } catch (e) {
        console.error('Error fetching post:', e);
        return notFound();
    }

    if (!post) {
        notFound();
    }

    // Get dynamic category label
    let catLabel = post.category;
    let allCategories: { name: string, slug: string }[] = DEFAULT_CATEGORIES;
    try {
        const fetchedCats = await fetchCategories();
        const defaultSlugs = new Set(DEFAULT_CATEGORIES.map(c => c.slug));
        const extraCats = fetchedCats.filter(c => !defaultSlugs.has(c.slug));
        allCategories = [...DEFAULT_CATEGORIES, ...extraCats];

        const map: Record<string, string> = {};
        allCategories.forEach(c => map[c.slug] = c.name);
        catLabel = map[post.category] || post.category;
    } catch {
        console.error('Error fetching categories for post page label');
    }

    const plainContent = post.content?.replace(/<[^>]+>/g, '') || '';

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />

            <main className="max-w-7xl mx-auto px-4 py-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <article className="lg:col-span-2">

                        {/* Breadcrumb */}
                        <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                            <Link href="/" className="hover:text-red-600 transition">होम</Link>
                            <span>/</span>
                            <Link href={`/category/${post.category}`} className="hover:text-red-600 transition">{catLabel}</Link>
                            <span>/</span>
                            <span className="text-gray-700 line-clamp-1">{post.title}</span>
                        </div>

                        {/* Category Badge */}
                        <div className="mb-3">
                            <Link
                                href={`/category/${post.category}`}
                                className="inline-block bg-red-600 text-white text-xs font-bold px-3 py-1 rounded hover:bg-red-700 transition"
                            >
                                {catLabel}
                            </Link>
                        </div>

                        {/* Title */}
                        <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 leading-tight mb-4">
                            {post.title}
                        </h1>

                        {/* Meta */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-gray-200">
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                                <div className="flex items-center gap-1">
                                    <Clock className="w-4 h-4" />
                                    <span>{formatDate(post.createdAt)}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Tag className="w-4 h-4" />
                                    <Link href={`/category/${post.category}`} className="hover:text-red-600 transition">{catLabel}</Link>
                                </div>
                                <ViewTracker postId={post.id!} initialViews={post.views || 0} />
                            </div>

                            {/* Engagement Bar */}
                            <div className="flex items-center gap-4 flex-wrap">

                                <div className="h-6 w-[1px] bg-gray-200 hidden md:block" />
                                <LikeButton postId={post.id!} initialLikes={post.likes || 0} showCount />
                                <BookmarkButton postId={post.id!} showLabel />
                                <div className="h-6 w-[1px] bg-gray-200 hidden md:block" />
                                <DownloadButton
                                    postId={post.id!}
                                    title={post.title}
                                    content={post.content || plainContent}
                                    image={post.image}
                                    category={catLabel}
                                    date={formatDate(post.createdAt)}
                                />
                            </div>
                        </div>

                        {/* Media Section (Image or Video) */}
                        {post.image && (
                            <div className="relative w-full rounded-2xl overflow-hidden mb-8 shadow-2xl border border-gray-100 bg-gray-900 flex items-center justify-center">
                                {post.image.match(/\.(mp4|webm|ogg|mov)$/) || post.image.includes('/video/upload/') ? (
                                    <video
                                        src={post.image}
                                        controls
                                        className="w-full h-auto max-h-[700px] object-contain rounded-2xl"
                                        poster={post.image.replace(/\/video\/upload\/(v\d+\/)?/, '/video/upload/so_0/')}
                                    />
                                ) : (
                                    /* eslint-disable-next-line @next/next/no-img-element */
                                    <img
                                        src={post.image}
                                        alt={post.title}
                                        className="w-full h-auto max-h-[1200px] object-contain rounded-2xl"
                                    />
                                )}
                            </div>
                        )}

                        {/* Content */}
                        <div
                            className="news-content prose prose-red max-w-none prose-p:leading-relaxed prose-headings:font-extrabold prose-p:text-gray-700 prose-p:text-lg mb-10"
                            dangerouslySetInnerHTML={{ __html: post.content || plainContent }}
                        />

                        {/* Comments Section */}
                        <div className="mt-8 pt-8 border-t border-gray-200">
                            <CommentForm postId={post.id!} />
                            <CommentList postId={post.id!} />
                        </div>

                        {/* Back Button */}
                        <div className="mt-8 pt-6 pb-6 border-t border-gray-200">
                            <Link
                                href="/"
                                className="inline-flex items-center gap-2 text-red-600 hover:text-red-700 font-semibold transition"
                            >
                                <ChevronLeft className="w-5 h-5" />
                                होमपेज पर वापस जाएं
                            </Link>
                        </div>
                    </article>

                    {/* Sidebar */}
                    <aside className="lg:col-span-1 space-y-6">
                        {relatedPosts.length > 0 && (
                            <div className="bg-white rounded-xl shadow-md p-4">
                                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
                                    <span className="w-1.5 h-5 bg-red-600 rounded-full inline-block" />
                                    <h2 className="font-bold text-gray-800">संबंधित खबरें</h2>
                                </div>
                                <div>
                                    {relatedPosts.map((rPost) => (
                                        <NewsCard key={rPost.id} post={rPost} variant="compact" />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Category Quick Links */}
                        <div className="bg-white rounded-xl shadow-md p-4">
                            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
                                <span className="w-1.5 h-5 bg-red-600 rounded-full inline-block" />
                                <h2 className="font-bold text-gray-800">श्रेणियाँ</h2>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {allCategories.map((cat) => (
                                    <Link
                                        key={cat.slug}
                                        href={`/category/${cat.slug}`}
                                        className="bg-gray-100 hover:bg-red-100 hover:text-red-700 text-gray-700 text-xs font-medium px-3 py-1.5 rounded-full transition"
                                    >
                                        {cat.name}
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </aside>
                </div>
            </main>

            <Footer />
        </div>
    );
}
