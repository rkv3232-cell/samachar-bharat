import { Timestamp } from 'firebase/firestore';

export interface Comment {
    id: string;
    postId: string;
    authorName: string;
    authorEmail?: string;
    authorAvatar: string;
    authorId: string | null;
    content: string;
    createdAt: Timestamp | Date | number;
    updatedAt: Timestamp | Date | number | null;
    isEdited: boolean;
    isApproved: boolean;
    likes: number;
    parentId: string | null;
    isDeleted: boolean;
}
