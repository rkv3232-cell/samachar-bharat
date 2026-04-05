import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, limit, DocumentData } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Comment } from '@/types/comment';

export const useComments = (postId: string) => {
    const [comments, setComments] = useState<Comment[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!postId) return;

        const q = query(
            collection(db, `posts/${postId}/comments`),
            orderBy('createdAt', 'desc'),
            limit(50)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedComments = snapshot.docs.map(doc => {
                const data = doc.data() as DocumentData;
                return {
                    id: doc.id,
                    ...data,
                    // Ensure Date conversion for real-time snapshots
                    createdAt: data.createdAt?.toDate() || new Date(),
                    updatedAt: data.updatedAt ? data.updatedAt.toDate() : null,
                } as Comment;
            });

            // Filter out fully deleted comments from public view, or display "[Removed]" message
            const activeComments = fetchedComments.filter(c => c.isApproved);
            setComments(activeComments);
            setLoading(false);
        }, (err) => {
            console.error("Live comments error:", err);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [postId]);

    return { comments, loading };
};
