export interface Comment {
    id: string;
    postId: string;
    postTitle: string;
    name: string;
    message: string;
    createdAt: any;
    status: "approved" | "pending" | "rejected";
}

export interface User {
    id: string;
    name: string;
    email: string;
    role: "admin" | "editor" | "user";
    createdAt: any;
}

export interface Category {
    id: string;
    name: string;
    slug: string;
}

export interface Tag {
    id: string;
    name: string;
}

export type ToastType = "success" | "error" | "info" | "warning";

export interface ToastMessage {
    id: string;
    message: string;
    type: ToastType;
}

export interface AuthorInfo {
    uid: string;
    name: string;
    photoURL?: string;
}

export interface SEOMeta {
    metaTitle?: string;
    metaDescription?: string;
    keywords?: string[];
}

export type PostStatus = 'published' | 'draft' | 'in_review' | 'scheduled' | 'archived';
