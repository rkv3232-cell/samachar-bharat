import { collection, doc, addDoc, updateDoc, increment, serverTimestamp, writeBatch } from 'firebase/firestore';
import { db } from './firebase';

export const addComment = async (postId: string, commentData: any) => {
    try {
        const batch = writeBatch(db);

        // Add Comment
        const commentsRef = collection(db, `posts/${postId}/comments`);
        const newCommentRef = doc(commentsRef);
        batch.set(newCommentRef, {
            ...commentData,
            createdAt: serverTimestamp(),
            updatedAt: null,
            isEdited: false,
            isApproved: true, // Assuming auto-approve unless moderation enabled
            likes: 0,
            isDeleted: false,
            postId,
        });

        // Increment Post Comment Count
        const postRef = doc(db, 'posts', postId);
        batch.update(postRef, { commentCount: increment(1) });

        await batch.commit();
        return newCommentRef.id;
    } catch (error) {
        console.error("Failed to add comment:", error);
        throw error;
    }
};

export const editComment = async (postId: string, commentId: string, newContent: string) => {
    try {
        const commentRef = doc(db, `posts/${postId}/comments`, commentId);
        await updateDoc(commentRef, {
            content: newContent,
            isEdited: true,
            updatedAt: serverTimestamp(),
        });
    } catch (error) {
        console.error("Failed to edit comment:", error);
        throw error;
    }
};

export const deleteComment = async (postId: string, commentId: string) => {
    try {
        const batch = writeBatch(db);

        const commentRef = doc(db, `posts/${postId}/comments`, commentId);
        batch.update(commentRef, {
            isDeleted: true,
            content: "[This comment has been removed]",
            updatedAt: serverTimestamp(),
        });

        // Decrement comment count for full accuracy or leave if soft deleting means it shouldn't be decremented
        const postRef = doc(db, 'posts', postId);
        batch.update(postRef, { commentCount: increment(-1) });

        await batch.commit();
    } catch (error) {
        console.error("Failed to delete comment:", error);
        throw error;
    }
};
