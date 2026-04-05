import Link from 'next/link';
import Image from 'next/image';
import { Post, formatDate } from '@/lib/posts';
import { Clock, Play } from 'lucide-react';
import ViewCountDisplay from './views/ViewCountDisplay';
import CategoryLabel from './CategoryLabel';

export default function NewsCard({ post, variant = 'default' }: { post: Post; variant?: 'default' | 'featured' | 'compact' }) {
    const truncate = (str: string, n: number) =>
        str && str.length > n ? str.substring(0, n) + '...' : str;

    const isVideo = (url: string) => {
        if (!url) return false;
        return url.match(/\.(mp4|webm|ogg|mov)$/) || url.includes('/video/upload/');
    };

    const renderMedia = (className: string, sizes?: string) => {
        if (!post.image) {
            return (
                <div className={`w-full h-full bg-gradient-to-br from-gray-100 to-gray-300 flex items-center justify-center ${className}`}>
                    <span className="text-4xl opacity-40">📰</span>
                </div>
            );
        }

        if (isVideo(post.image)) {
            return (
                <div className={`relative w-full h-full overflow-hidden bg-black flex items-center justify-center ${className}`}>
                    <video
                        src={post.image}
                        muted
                        loop
                        autoPlay
                        playsInline
                        className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                    />
                    <div className="absolute top-2 right-2 bg-black/50 p-1.5 rounded-full backdrop-blur-sm">
                        <Play className="w-3 h-3 text-white fill-white" />
                    </div>
                </div>
            );
        }

        return (
            <Image
                src={post.image}
                alt={post.title}
                fill
                className={`object-cover group-hover:scale-105 transition-transform duration-500 ${className}`}
                sizes={sizes}
            />
        );
    };

    if (variant === 'featured') {
        return (
            <Link href={`/post/${post.id}`} className="group relative block rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300">
                <div className="relative h-80 md:h-[450px] w-full">
                    {renderMedia("", "(max-width: 768px) 100vw, 60vw")}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent" />
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
                    <CategoryLabel
                        slug={post.category}
                        className="inline-block bg-red-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg mb-3 shadow-lg"
                    />
                    <h2 className="text-white text-2xl md:text-3xl font-extrabold leading-tight group-hover:text-red-300 transition-colors drop-shadow-md">
                        {post.title}
                    </h2>
                    <div className="flex items-center gap-3 mt-4 text-gray-300 text-sm font-medium">
                        <span>{formatDate(post.createdAt)}</span>
                        <div className="mx-2 w-1 h-1 bg-white/30 rounded-full" />
                        <ViewCountDisplay className="text-white/80" views={post.views || 0} />
                    </div>
                </div>
            </Link>
        );
    }

    if (variant === 'compact') {
        return (
            <Link href={`/post/${post.id}`} className="group flex gap-4 items-start py-4 border-b border-gray-100 last:border-0 hover:bg-red-50/30 rounded-xl px-2 transition-all">
                <div className="relative w-24 h-20 flex-shrink-0 rounded-xl overflow-hidden shadow-sm">
                    {renderMedia("", "100px")}
                </div>
                <div className="flex-1 min-w-0 py-1">
                    <h3 className="text-[15px] font-bold text-gray-800 group-hover:text-red-600 transition line-clamp-2 leading-snug">
                        {post.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-2 text-gray-400 text-xs">
                        <Clock className="w-3 h-3" />
                        <span>{formatDate(post.createdAt)}</span>
                        <span className="opacity-50">•</span>
                        <ViewCountDisplay views={post.views || 0} />
                    </div>
                </div>
            </Link>
        );
    }

    return (
        <Link href={`/post/${post.id}`} className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl border border-gray-100 transition-all duration-301 flex flex-col">
            <div className="relative h-52 w-full overflow-hidden">
                {renderMedia("", "(max-width: 768px) 100vw, 33vw")}
                <div className="absolute top-4 left-4">
                    <CategoryLabel
                        slug={post.category}
                        className="bg-red-600/90 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider shadow-md"
                    />
                </div>
            </div>
            <div className="p-5 flex flex-col flex-1">
                <h3 className="text-gray-900 font-extrabold text-lg leading-snug group-hover:text-red-700 transition-colors line-clamp-2 mb-3">
                    {post.title}
                </h3>
                <p className="text-gray-500 text-sm line-clamp-3 flex-1 leading-relaxed">
                    {truncate(post.content?.replace(/<[^>]+>/g, '') || '', 120)}
                </p>
                <div className="flex flex-row justify-between items-center mt-5 pt-4 border-t border-gray-50 text-gray-400 text-[11px] font-medium uppercase tracking-tighter">
                    <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-red-500/70" />
                        <span>{formatDate(post.createdAt)}</span>
                    </div>
                    <ViewCountDisplay views={post.views || 0} />
                </div>
            </div>
        </Link>
    );
}
