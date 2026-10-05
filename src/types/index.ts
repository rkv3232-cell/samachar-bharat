// ============================================================
// types/index.ts
// Central type definitions
// Re-exports from auth.types.ts for unified import path
// ============================================================

// Re-export auth types so code importing from "@/types" still works
export type { FirestoreUser, AuthContextType, SessionVerifyResponse } from "@/types/auth.types";
export { UserRole, Permission } from "@/types/auth.types";

import { Timestamp } from "firebase/firestore";

export interface Comment {
    id: string;
    postId: string;
    postTitle?: string;
    name?: string;
    userName?: string;
    userId?: string;
    message: string;
    createdAt: any;
    status?: "approved" | "pending" | "rejected";
}

export interface UserData {
    id: string;
    name: string;
    email: string;
    role: "owner" | "admin" | "editor" | "reporter" | "user";
    createdAt: any;
}

export interface UserDoc {
    id: string;
    name: string;
    email: string;
    role: string;
    createdAt: any;
}

export interface UserDocument {
    uid: string;
    name: string;
    email: string;
    role: "owner" | "admin" | "editor" | "reporter" | "user";
    createdAt: string;
    status: "active" | "disabled" | "suspended";
}

export interface CreateUserPayload {
    name: string;
    email: string;
    password: string;
    role: "admin" | "editor" | "reporter" | "user"; // Never "owner"
}

export interface ApiResponse<T = unknown> {
    success: boolean;
    message: string;
    data?: T;
    error?: string;
}

// UserRole as a string union (legacy — prefer the UserRole enum from auth.types)
// Both are exported so existing code using `type UserRole` still works.

export interface Category {
    id: string;
    name: string;
    slug: string;
}

export interface Tag {
    id: string;
    name: string;
}

export interface Post {
    id: string;
    title: string;
    slug?: string;
    category?: string;
    views?: number;
    author?: string;
    imageUrl?: string;
    createdAt: any;
}

export interface SiteSettings {
    siteName: string;
    logoUrl: string;
    theme: "light";
    language: "hi" | "en";
    contactEmail: string;
    instagramUrl?: string; // Social links
    facebookUrl?: string;
    primaryColor: string;
    autoSave: boolean;
}

export interface ChartDataPoint {
    date: string;
    value: number;
}

export interface AnalyticsOverview {
    totalPosts: number;
    totalUsers: number;
    totalComments: number;
    totalViews: number;
    avgReadTime?: number;
    topLocation?: string;
}

export interface AnalyticsData {
    overview: AnalyticsOverview;
    trendingPosts: Post[];
    dailyViews: ChartDataPoint[];
    postsCreated: ChartDataPoint[];
    userGrowth: ChartDataPoint[];
    recentPosts: Post[];
    recentComments: Comment[];
    topCategories: { name: string; count: number }[];
    dailyDistribution: { hour: string; views: number }[];
}

export type DateFilter = "today" | "7days" | "30days";

export interface LiveChannel {
    id: string;
    title: string;
    streamUrl: string;
    provider: "youtube" | "custom";
    isActive: boolean;
}

export interface LiveStatus {
    isActive: boolean;
    streamUrl: string;
    title: string;
    provider: "youtube" | "custom";
    channels?: LiveChannel[];
}
