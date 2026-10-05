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

    const renderMedia = (className: string, sizes?: string, priority = false) => {
        if (!post.image) {
            return (
                <div className={`w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center ${className}`}>
                    <span className="text-2xl opacity-40">📰</span>
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
                        className="w-full h-full object-cover opacity-85 group-hover:opacity-100 transition-opacity"
                    />
                    <div className="absolute top-2 right-2 bg-black/60 p-1 rounded-full backdrop-blur-xs">
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
                priority={priority}
                loading={priority ? undefined : "lazy"}
                className={`object-cover group-hover:scale-105 transition-transform duration-300 ${className}`}
                sizes={sizes}
            />
        );
    };

    if (variant === 'featured') {
        return (
            <Link
                href={`/post/${post.id}`}
                prefetch={true}
                className="group relative block rounded-2xl overflow-hidden shadow-md hover:shadow-lg transition-all duration-200 active:scale-[0.99]"
            >
                <div className="relative h-64 sm:h-72 md:h-[350px] w-full">
                    {renderMedia("", "(max-width: 768px) 100vw, 66vw", true)}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent" />
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6">
                    <CategoryLabel
                        slug={post.category}
                        className="inline-block bg-red-600 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-md mb-2 shadow-xs uppercase tracking-wider"
                    />
                    <h2 className="text-white text-lg sm:text-2xl font-black leading-snug group-hover:text-red-300 transition-colors drop-shadow-xs line-clamp-2">
                        {post.title}
                    </h2>
                    <div className="flex items-center gap-2.5 mt-2.5 text-gray-300 text-xs font-medium">
                        <span>{formatDate(post.createdAt)}</span>
                        <div className="w-1 h-1 bg-white/40 rounded-full" />
                        <ViewCountDisplay className="text-white/80" views={post.views || 0} />
                    </div>
                </div>
            </Link>
        );
    }

    if (variant === 'compact') {
        return (
            <Link
                href={`/post/${post.id}`}
                prefetch={true}
                className="group flex gap-3 items-start py-2.5 border-b border-gray-100 last:border-0 hover:bg-red-50/40 rounded-lg px-1.5 transition-colors active:scale-[0.99]"
            >
                <div className="relative w-20 h-16 flex-shrink-0 rounded-lg overflow-hidden shadow-2xs bg-gray-100">
                    {renderMedia("", "80px")}
                </div>
                <div className="flex-1 min-w-0 py-0.5">
                    <h3 className="text-xs sm:text-[13px] font-bold text-gray-900 group-hover:text-red-600 transition-colors line-clamp-2 leading-snug">
                        {post.title}
                    </h3>
                    <div className="flex items-center gap-1.5 mt-1.5 text-gray-400 text-[10px] font-medium">
                        <Clock className="w-2.5 h-2.5 text-red-500" />
                        <span>{formatDate(post.createdAt)}</span>
                        <span className="opacity-40">•</span>
                        <ViewCountDisplay views={post.views || 0} />
                    </div>
                </div>
            </Link>
        );
    }

    return (
        <Link
            href={`/post/${post.id}`}
            prefetch={true}
            className="group bg-white rounded-xl overflow-hidden shadow-2xs hover:shadow-md border border-gray-200 transition-all duration-200 flex flex-col active:scale-[0.99]"
        >
            <div className="relative h-36 sm:h-40 w-full overflow-hidden bg-gray-100">
                {renderMedia("", "(max-width: 768px) 100vw, 33vw")}
                <div className="absolute top-2.5 left-2.5">
                    <CategoryLabel
                        slug={post.category}
                        className="bg-red-600/90 backdrop-blur-xs text-white text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider shadow-xs"
                    />
                </div>
            </div>
            <div className="p-3.5 flex flex-col flex-1">
                <h3 className="text-gray-900 font-bold text-sm leading-snug group-hover:text-red-600 transition-colors line-clamp-2 mb-1.5">
                    {post.title}
                </h3>
                <p className="text-gray-500 text-xs line-clamp-2 flex-1 leading-relaxed">
                    {truncate(post.content?.replace(/<[^>]+>/g, '') || '', 90)}
                </p>
                <div className="flex flex-row justify-between items-center mt-3 pt-2.5 border-t border-gray-100 text-gray-400 text-[10px] font-medium">
                    <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-red-500" />
                        <span>{formatDate(post.createdAt)}</span>
                    </div>
                    <ViewCountDisplay views={post.views || 0} />
                </div>
            </div>
        </Link>
    );
}
