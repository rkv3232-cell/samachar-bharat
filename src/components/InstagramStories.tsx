"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { X, Play, Clock } from "lucide-react";
import { type Post } from "@/lib/posts";
import { motion, AnimatePresence } from "framer-motion";

interface StoriesProps {
    posts: Post[];
}

export default function InstagramStories({ posts }: StoriesProps) {
    const [videoPosts, setVideoPosts] = useState<Post[]>([]);
    const [activeStory, setActiveStory] = useState<Post | null>(null);
    const [progress, setProgress] = useState(0);
    const videoRef = useRef<HTMLVideoElement>(null);

    // Filter posts that are videos
    useEffect(() => {
        const vp = posts.filter(post =>
            post.image && (
                post.image.match(/\.(mp4|webm|ogg|mov)$/i) ||
                post.image.includes('/video/upload/') ||
                post.image.includes('cloud')
            )
            // Note: Since cloudinary images also have 'cloud', we do a strict check for video format
            && (post.image.includes('.mp4') || post.image.includes('.mov') || post.image.includes('/video/'))
        );
        setVideoPosts(vp.slice(0, 10)); // Top 10 latest videos
    }, [posts]);

    // Handle Story Timer/Progress
    useEffect(() => {
        if (!activeStory) return;
        setProgress(0);

        let animationFrame: number;
        const start = Date.now();
        const duration = 15000; // 15 seconds per story

        const updateProgress = () => {
            if (videoRef.current) {
                // If the video is playing, sync progress with video duration
                const p = (videoRef.current.currentTime / (videoRef.current.duration || 15)) * 100;
                setProgress(p);

                if (videoRef.current.ended) {
                    handleNext();
                } else {
                    animationFrame = requestAnimationFrame(updateProgress);
                }
            }
        };

        if (activeStory) {
            animationFrame = requestAnimationFrame(updateProgress);
        }

        return () => cancelAnimationFrame(animationFrame);
    }, [activeStory]);

    const handleNext = () => {
        if (!activeStory) return;
        const currentIndex = videoPosts.findIndex(p => p.id === activeStory.id);
        if (currentIndex < videoPosts.length - 1) {
            setActiveStory(videoPosts[currentIndex + 1]);
        } else {
            setActiveStory(null);
        }
    };

    const handlePrev = () => {
        if (!activeStory) return;
        const currentIndex = videoPosts.findIndex(p => p.id === activeStory.id);
        if (currentIndex > 0) {
            setActiveStory(videoPosts[currentIndex - 1]);
        }
    };

    if (videoPosts.length === 0) return null;

    return (
        <div className="w-full my-6 bg-white dark:bg-gray-900 overflow-hidden">
            <div className="flex items-center gap-2 mb-3 px-4">
                <Play className="w-5 h-5 text-red-600 fill-current animate-pulse" />
                <h2 className="font-extrabold text-lg text-gray-900 dark:text-gray-100">Video Shorts</h2>
            </div>

            {/* Horizontal Scroll Stories */}
            <div className="flex gap-4 overflow-x-auto pb-4 px-4 no-scrollbar">
                {videoPosts.map((story) => {
                    const posterVideoMatch = story.image?.replace(/\/video\/upload\/(v\d+\/)?/, '/video/upload/so_0/');
                    const thumbnail = posterVideoMatch?.replace('.mp4', '.jpg');

                    return (
                        <div
                            key={story.id}
                            onClick={() => setActiveStory(story)}
                            className="relative flex-none w-24 h-40 rounded-xl overflow-hidden cursor-pointer flex flex-col justify-end p-2 group ring-2 ring-red-500 ring-offset-2 dark:ring-offset-gray-900 transition-all hover:scale-105"
                        >
                            <div className="absolute inset-0 bg-black/40 z-10 group-hover:bg-black/20 transition-all" />
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={thumbnail || story.image}
                                alt={story.title}
                                className="absolute inset-0 w-full h-full object-cover"
                            />
                            <p className="relative z-20 text-[10px] text-white font-bold leading-tight line-clamp-3 drop-shadow-md">
                                {story.title}
                            </p>
                        </div>
                    );
                })}
            </div>

            {/* Fullscreen Viewer */}
            <AnimatePresence>
                {activeStory && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center"
                    >
                        {/* Progress Bar */}
                        <div className="absolute top-4 left-4 right-4 z-50 flex gap-1">
                            {videoPosts.map((p, idx) => {
                                const isActive = p.id === activeStory.id;
                                const isPast = videoPosts.findIndex(v => v.id === activeStory.id) > idx;
                                return (
                                    <div key={p.id} className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-white transition-all duration-100 ease-linear"
                                            style={{
                                                width: isActive ? `${progress}%` : isPast ? '100%' : '0%'
                                            }}
                                        />
                                    </div>
                                );
                            })}
                        </div>

                        {/* Top Controls */}
                        <div className="absolute top-8 left-4 right-4 z-50 flex justify-between items-start">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center border-2 border-white shadow-lg">
                                    <span className="text-white font-bold text-xs font-serif">NP</span>
                                </div>
                                <div className="text-white text-sm drop-shadow-md">
                                    <p className="font-bold">NewsPortal</p>
                                    <p className="text-xs opacity-80">{new Date(activeStory.createdAt as any).toLocaleDateString()}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setActiveStory(null)}
                                className="p-2 bg-black/50 text-white rounded-full hover:bg-white hover:text-black transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Video Container */}
                        <div className="relative w-full max-w-sm aspect-[9/16] bg-black rounded-3xl overflow-hidden shadow-2xl mx-auto shadow-red-500/10">
                            <video
                                ref={videoRef}
                                src={activeStory.image}
                                autoPlay
                                playsInline
                                className="w-full h-full object-cover"
                            />

                            {/* Left/Right Click zones for navigation */}
                            <div className="absolute inset-y-0 left-0 w-1/3 z-20" onClick={handlePrev} />
                            <div className="absolute inset-y-0 right-0 w-1/3 z-20" onClick={handleNext} />

                            {/* Story Info (Bottom) */}
                            <div className="absolute bottom-0 inset-x-0 p-6 bg-gradient-to-t from-black via-black/60 to-transparent z-30 flex flex-col gap-3">
                                <Link onClick={() => setActiveStory(null)} href={`/post/${activeStory.id}`} className="inline-block px-3 py-1 bg-red-600/90 backdrop-blur text-white text-[10px] font-bold uppercase rounded-md self-start">
                                    Read Full Story
                                </Link>
                                <h3 className="text-white font-bold text-lg leading-snug break-words drop-shadow-md">
                                    {activeStory.title}
                                </h3>
                                <p className="text-gray-300 text-xs line-clamp-2 leading-relaxed">
                                    {activeStory.content.replace(/<[^>]+>/g, '')}
                                </p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
