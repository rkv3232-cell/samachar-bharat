"use client";

import { useEffect, useState, useCallback } from "react";
import {
    MessageSquare,
    ThumbsUp,
    Plus,
    Search,
    Filter,
    Loader2,
    User,
    ChevronRight,
    MessageCircle,
    Trash2,
    X,
    Send
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import {
    getForumPosts,
    createForumPost,
    ForumPost,
    likeForumPost,
    deleteForumPost,
    getForumComments,
    addForumComment,
    ForumComment
} from "@/lib/community";
import { UserRole } from "@/types/auth.types";
import { toast } from "sonner";

export default function CommunityHub() {
    const { user, isAdmin } = useAuth();
    const [posts, setPosts] = useState<ForumPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [newPost, setNewPost] = useState({ title: "", content: "", category: "general" });
    const [submitting, setSubmitting] = useState(false);
    const [activeTab, setActiveTab] = useState("all");

    // Comments state
    const [expandedPostId, setExpandedPostId] = useState<string | null>(null);
    const [comments, setComments] = useState<ForumComment[]>([]);
    const [loadingComments, setLoadingComments] = useState(false);
    const [newComment, setNewComment] = useState("");
    const [submittingComment, setSubmittingComment] = useState(false);

    const loadPosts = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getForumPosts(activeTab === 'all' ? undefined : activeTab);
            setPosts(data);
        } catch (err: any) {
            console.error(err);
            toast.error("डेटा लोड करने में समस्या: " + (err.message?.includes("index") ? "Firebase Index आवश्यक है" : "सर्वर त्रुटि"));
        } finally {
            setLoading(false);
        }
    }, [activeTab]);

    useEffect(() => {
        let isCancelled = false;
        const timer = setTimeout(() => {
            if (!isCancelled) {
                loadPosts();
            }
        }, 0);

        return () => {
            isCancelled = true;
            clearTimeout(timer);
        };
    }, [loadPosts]);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return toast.error("Please login to post");
        if (!newPost.title.trim()) return toast.error("Title is required");

        setSubmitting(true);
        try {
            await createForumPost({
                title: newPost.title,
                content: newPost.content,
                category: newPost.category,
                userId: user.uid,
                userName: user.displayName || user.email || "Anonymous"
            });
            setNewPost({ title: "", content: "", category: "general" });
            setShowCreate(false);
            toast.success("Discussion started!");
            loadPosts();
        } catch (err: any) {
            console.error("Community Post Error:", err);
            toast.error("Failed to post: " + (err.message || "Unknown error"));
        } finally {
            setSubmitting(false);
        }
    };

    const handleLike = async (post: ForumPost, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!user) return toast.error("Please login to like");
        if (post.likedBy?.includes(user.uid)) return toast.error("You already liked this");

        try {
            if (post.id) {
                await likeForumPost(post.id, user.uid);
                setPosts(posts.map(p => p.id === post.id
                    ? { ...p, likes: (p.likes || 0) + 1, likedBy: [...(p.likedBy || []), user.uid] }
                    : p
                ));
                toast.success("Thanks for the feedback!");
            }
        } catch (err) {
            toast.error("Failed to like post");
        }
    };

    const handleDelete = async (postId: string, postUserId: string, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!user) return toast.error("हटाने के लिए लॉगिन करें");
        if (user.uid !== postUserId && !isAdmin) {
            return toast.error("आपके पास इस पोस्ट को हटाने की अनुमति नहीं है");
        }

        if (!confirm("क्या आप वाकई इस चर्चा को हटाना चाहते हैं?")) return;

        try {
            await deleteForumPost(postId);
            setPosts(prev => prev.filter(p => p.id !== postId));
            toast.success("Discussion deleted");
        } catch (err: any) {
            console.error("Delete Error:", err);
            toast.error("Failed to delete discussion: " + (err.message || "Unknown error"));
        }
    };

    const toggleExpand = async (postId: string) => {
        if (expandedPostId === postId) {
            setExpandedPostId(null);
            return;
        }

        setExpandedPostId(postId);
        setLoadingComments(true);
        try {
            const data = await getForumComments(postId);
            setComments(data);
        } catch (err: any) {
            console.error(err);
            toast.error("टिप्पणियाँ लोड करने में समस्या: " + (err.message?.includes("index") ? "Firebase Index आवश्यक है" : "Failed to load comments"));
        } finally {
            setLoadingComments(false);
        }
    };

    const handleComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !expandedPostId || !newComment.trim()) return;

        setSubmittingComment(true);
        try {
            await addForumComment({
                postId: expandedPostId,
                userId: user.uid,
                userName: user.displayName || user.email || "Anonymous",
                content: newComment
            });
            setNewComment("");
            // Refresh comments
            const data = await getForumComments(expandedPostId);
            setComments(data);
            // Update post count in UI
            setPosts(posts.map(p => p.id === expandedPostId ? { ...p, commentCount: (p.commentCount || 0) + 1 } : p));
            toast.success("Reply added!");
        } catch (err) {
            toast.error("Failed to post reply");
        } finally {
            setSubmittingComment(false);
        }
    };

    const categories = [
        { id: "all", name: "All Discussions" },
        { id: "politics", name: "Politics" },
        { id: "local", name: "Local News" },
        { id: "sports", name: "Sports" },
        { id: "general", name: "General" }
    ];

    const canDeletePost = (postUserId: string) => {
        if (!user) return false;
        return user.uid === postUserId || isAdmin;
    };

    return (
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
            {/* Header */}
            <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-red-600 to-red-700 text-white">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-black flex items-center gap-2">
                            <MessageSquare className="w-7 h-7" />
                            NewsPortal Community
                        </h2>
                        <p className="text-red-100 text-sm mt-1">Join the conversation and share your thoughts</p>
                    </div>
                    <button
                        onClick={() => setShowCreate(!showCreate)}
                        className="bg-white text-red-600 hover:bg-red-50 font-bold px-6 py-2.5 rounded-xl flex items-center gap-2 transition shadow-lg"
                    >
                        {showCreate ? <X className="w-5 h-5 text-gray-500" /> : <Plus className="w-5 h-5 text-red-600" />}
                        Discuss Now
                    </button>
                </div>
            </div>

            {/* Create Post Form */}
            {showCreate && (
                <div className="p-6 bg-red-50 border-b border-red-100 animate-in slide-in-from-top duration-300">
                    <form onSubmit={handleCreate} className="space-y-4 max-w-2xl mx-auto">
                        <input
                            type="text"
                            placeholder="Discussion Title..."
                            value={newPost.title}
                            onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                            className="w-full bg-white border border-red-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-900"
                        />
                        <textarea
                            placeholder="What's on your mind? (Optional)"
                            rows={3}
                            value={newPost.content}
                            onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                            className="w-full bg-white border border-red-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500 resize-none text-gray-900"
                        />
                        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                            <select
                                value={newPost.category}
                                onChange={(e) => setNewPost({ ...newPost, category: e.target.value })}
                                className="bg-white border border-red-200 rounded-xl px-4 py-2 text-sm text-gray-900"
                            >
                                {categories.filter(c => c.id !== 'all').map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                            <button
                                type="submit"
                                disabled={submitting}
                                className="bg-red-600 text-white font-bold px-8 py-2.5 rounded-xl hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
                            >
                                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageCircle className="w-4 h-4" />}
                                Post Contribution
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Filter Tabs */}
            <div className="px-6 py-4 flex items-center gap-2 overflow-x-auto border-b border-gray-50 scrollbar-hide">
                {categories.map(cat => (
                    <button
                        key={cat.id}
                        onClick={() => setActiveTab(cat.id)}
                        className={`whitespace-nowrap px-5 py-2 rounded-full text-sm font-bold transition ${activeTab === cat.id
 ? "bg-red-100 text-red-700"
 : "text-gray-500 hover:bg-gray-100"
 }`}
                    >
                        {cat.name}
                    </button>
                ))}
            </div>

            {/* Post List */}
            <div className="divide-y divide-gray-50">
                {loading ? (
                    <div className="p-20 flex flex-col items-center justify-center gap-4">
                        <Loader2 className="w-8 h-8 text-red-600 animate-spin" />
                        <p className="text-gray-400 font-medium">Loading Community Discussions...</p>
                    </div>
                ) : posts.length === 0 ? (
                    <div className="p-20 text-center">
                        <p className="text-gray-400 italic">No discussions found in this category.</p>
                        <button onClick={() => setShowCreate(true)} className="text-red-600 font-bold mt-2 hover:underline">Be the first to post!</button>
                    </div>
                ) : (
                    posts.map(post => (
                        <div key={post.id} className="relative group divide-y divide-gray-50">
                            {/* Delete Button - Top Right Absolute */}
                            {canDeletePost(post.userId) && (
                                <button
                                    onClick={(e) => post.id && handleDelete(post.id, post.userId, e)}
                                    className="absolute top-4 right-12 p-2 text-gray-300 hover:text-white hover:bg-red-500 rounded-lg transition-all z-50 border border-transparent hover:border-red-400 opacity-0 group-hover:opacity-100 shadow-sm"
                                    title="डिलीट करें"
                                >
                                    <Trash2 size={18} />
                                </button>
                            )}
                            <div className="flex p-6 hover:bg-gray-50 transition">
                                <div className="flex gap-4 w-full">
                                    {/* Avatar */}
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center shrink-0">
                                        <User className="text-gray-400" size={20} />
                                    </div>

                                    {/* Content Area */}
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-bold text-gray-900 text-sm">{post.userName}</span>
                                            <span className="text-gray-400 text-xs">•</span>
                                            <span className="text-gray-400 text-xs uppercase">{post.category}</span>
                                        </div>

                                        {/* Clickable Area for Expansion */}
                                        <div
                                            onClick={() => post.id && toggleExpand(post.id)}
                                            className="cursor-pointer"
                                        >
                                            <h3 className="text-lg font-bold text-gray-800 group-hover:text-red-600 transition pr-10">
                                                {post.title}
                                            </h3>
                                            <p className={`text-gray-500 text-sm mt-1 leading-relaxed ${expandedPostId === post.id ? '' : 'line-clamp-2'}`}>
                                                {post.content}
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-6 mt-4">
                                            <button
                                                onClick={(e) => handleLike(post, e)}
                                                disabled={!!(user && post.likedBy?.includes(user.uid))}
                                                className={`flex items-center gap-1.5 text-xs font-bold transition-all px-2 py-1 rounded-lg ${user && post.likedBy?.includes(user.uid)
 ? "text-blue-600 bg-blue-50"
 : "text-gray-500 hover:text-blue-600 hover:bg-blue-50"
 }`}
                                            >
                                                <ThumbsUp size={14} />
                                                <span>{post.likes || 0} {user && post.likedBy?.includes(user.uid) ? "Saved" : "Helpful"}</span>
                                            </button>
                                            <button
                                                onClick={() => post.id && toggleExpand(post.id)}
                                                className="flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-red-500 hover:bg-red-50 px-2 py-1 rounded-lg transition-all"
                                            >
                                                <MessageSquare size={14} />
                                                <span>{post.commentCount || 0} Replies</span>
                                            </button>
                                            <div className="ml-auto">
                                                <span className="text-[10px] uppercase tracking-wider text-gray-400 font-black">
                                                    {post.createdAt ? new Date(post.createdAt).toLocaleDateString() : 'Just now'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Arrow Indicator */}
                                    <div
                                        onClick={() => post.id && toggleExpand(post.id)}
                                        className={`flex items-center text-gray-300 cursor-pointer transition ${expandedPostId === post.id ? 'rotate-90 text-red-500' : 'group-hover:translate-x-1'}`}
                                    >
                                        <ChevronRight size={24} />
                                    </div>
                                </div>
                            </div>

                            {/* Replies Section */}
                            {expandedPostId === post.id && (
                                <div className="bg-gray-100/50 p-6 border-t border-gray-100 animate-in fade-in duration-300">
                                    <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Discussion Replies</h4>

                                    <div className="space-y-4 mb-6">
                                        {loadingComments ? (
                                            <div className="py-4 flex justify-center">
                                                <Loader2 className="w-5 h-5 text-red-600 animate-spin" />
                                            </div>
                                        ) : comments.length === 0 ? (
                                            <p className="text-sm text-gray-400 italic">No replies yet. Be the first!</p>
                                        ) : (
                                            comments.map(c => (
                                                <div key={c.id} className="flex gap-3 bg-white p-3 rounded-xl shadow-sm border border-gray-100">
                                                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                                                        <User className="text-gray-400" size={14} />
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="font-bold text-gray-900 text-xs">{c.userName}</span>
                                                            <span className="text-[10px] text-gray-400">
                                                                {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : 'Just now'}
                                                            </span>
                                                        </div>
                                                        <p className="text-gray-600 text-sm">{c.content}</p>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>

                                    {user ? (
                                        <form onSubmit={handleComment} className="flex gap-2">
                                            <input
                                                type="text"
                                                placeholder="Write a reply..."
                                                value={newComment}
                                                required
                                                onChange={(e) => setNewComment(e.target.value)}
                                                className="flex-1 bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-900"
                                            />
                                            <button
                                                type="submit"
                                                disabled={submittingComment}
                                                className="bg-red-600 text-white p-2 rounded-xl hover:bg-red-700 disabled:opacity-50 transition shadow-md"
                                            >
                                                {submittingComment ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send size={20} />}
                                            </button>
                                        </form>
                                    ) : (
                                        <div className="bg-gray-50 p-4 rounded-xl text-center border border-dashed border-gray-300">
                                            <p className="text-xs text-gray-500">Please <a href="/login" className="text-red-600 font-bold hover:underline">Login</a> to participate in the discussion.</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            <div className="p-4 bg-gray-50 text-center border-t border-gray-100">
                <button className="text-xs font-black text-gray-400 hover:text-red-600 uppercase tracking-widest transition">
                    View Full Forum Guidelines
                </button>
            </div>
        </div>
    );
}
