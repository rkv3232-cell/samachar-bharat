'use client';

import { Eye } from 'lucide-react';
import { formatViewCount } from '@/lib/views';

interface ViewCountDisplayProps {
    views: number;
    className?: string;
}

export default function ViewCountDisplay({ views, className = "" }: ViewCountDisplayProps) {
    const formattedViews = formatViewCount(views);

    return (
        <div className={`flex items-center gap-1.5 text-gray-400 text-xs font-medium ${className}`} title={`${views || 0} Views`}>
            <Eye className="w-3.5 h-3.5" />
            <span className="tabular-nums">{formattedViews}</span>
        </div>
    );
}
