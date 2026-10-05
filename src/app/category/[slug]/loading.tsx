export default function CategoryLoading() {
    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            {/* Header skeleton */}
            <div className="h-14 bg-white border-b border-gray-200 flex items-center px-4">
                <div className="skeleton h-7 w-32 rounded-md" />
            </div>

            <main className="max-w-7xl mx-auto px-4 py-6 w-full flex-1 animate-pulse">
                {/* Category Header Banner skeleton */}
                <div className="h-24 bg-red-100/60 rounded-xl p-5 mb-8 flex items-center gap-4">
                    <div className="w-12 h-12 bg-red-200/80 rounded-xl shrink-0" />
                    <div className="space-y-2">
                        <div className="skeleton h-6 w-40 rounded" />
                        <div className="skeleton h-3.5 w-28 rounded" />
                    </div>
                </div>

                {/* News Cards Grid Skeleton */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {Array(6).fill(0).map((_, i) => (
                        <div key={i} className="bg-white rounded-xl overflow-hidden border border-gray-200 p-3.5 flex flex-col gap-3">
                            <div className="skeleton h-40 w-full rounded-lg" />
                            <div className="skeleton h-4 w-3/4 rounded mt-1" />
                            <div className="skeleton h-4 w-full rounded" />
                            <div className="skeleton h-3 w-1/2 rounded" />
                            <div className="skeleton h-3 w-1/4 rounded mt-auto" />
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
}
