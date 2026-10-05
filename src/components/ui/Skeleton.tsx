"use client";

export function CardSkeleton() {
    return (
        <div className="animate-pulse rounded-2xl border border-gray-200 bg-white p-6 shadow-xs">
            <div className="mb-3 h-4 w-24 rounded bg-gray-200" />
            <div className="mb-2 h-8 w-32 rounded bg-gray-200" />
            <div className="h-3 w-20 rounded bg-gray-200" />
        </div>
    );
}

export function ChartSkeleton() {
    return (
        <div className="animate-pulse rounded-2xl border border-gray-200 bg-white p-6 shadow-xs">
            <div className="mb-4 h-5 w-40 rounded bg-gray-200" />
            <div className="h-64 w-full rounded bg-gray-100" />
        </div>
    );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
    return (
        <div className="animate-pulse rounded-2xl border border-gray-200 bg-white p-6 shadow-xs">
            <div className="mb-4 h-5 w-40 rounded bg-gray-200" />
            <div className="space-y-3">
                {Array.from({ length: rows }).map((_, i) => (
                    <div key={i} className="flex items-center gap-4">
                        <div className="h-4 w-8 rounded bg-gray-200" />
                        <div className="h-4 flex-1 rounded bg-gray-100" />
                        <div className="h-4 w-16 rounded bg-gray-200" />
                    </div>
                ))}
            </div>
        </div>
    );
}

export function FormSkeleton() {
    return (
        <div className="animate-pulse space-y-6 rounded-2xl border border-gray-200 bg-white p-8 shadow-xs">
            {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-2">
                    <div className="h-4 w-28 rounded bg-gray-200" />
                    <div className="h-10 w-full rounded bg-gray-100" />
                </div>
            ))}
            <div className="h-10 w-32 rounded bg-gray-200" />
        </div>
    );
}
