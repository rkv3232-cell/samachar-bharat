export default function Loading() {
    // Generate skeleton grids
    const skeletons = Array(6).fill(0);

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Header Skeleton */}
            <div className="h-16 bg-white w-full border-b border-gray-200 shadow-sm flex items-center px-4">
                <div className="skeleton h-8 w-40 rounded-md"></div>
                <div className="hidden md:flex gap-4 ml-8">
                    <div className="skeleton h-6 w-20 rounded-md"></div>
                    <div className="skeleton h-6 w-20 rounded-md"></div>
                    <div className="skeleton h-6 w-20 rounded-md"></div>
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-4 py-8 w-full flex-1">
                {/* Hero Skeleton */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
                    <div className="lg:col-span-2 relative h-80 md:h-[450px] skeleton rounded-2xl w-full"></div>

                    {/* Sidebar Latest */}
                    <div className="bg-white rounded-xl shadow-md p-4 flex flex-col gap-4">
                        <div className="skeleton h-6 w-1/3 mb-2 rounded-md"></div>
                        {Array(4).fill(0).map((_, i) => (
                            <div key={i} className="flex gap-4 py-3 border-b border-gray-100 last:border-0">
                                <div className="skeleton w-24 h-20 rounded-xl flex-shrink-0"></div>
                                <div className="flex-1 space-y-3 py-1">
                                    <div className="skeleton h-4 w-full rounded"></div>
                                    <div className="skeleton h-4 w-3/4 rounded"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Grid Skeleton */}
                <div className="flex items-center gap-3 mb-6">
                    <div className="skeleton h-6 w-2 rounded-full"></div>
                    <div className="skeleton h-6 w-48 rounded-md"></div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {skeletons.map((_, i) => (
                        <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 h-[360px] flex flex-col">
                            <div className="skeleton h-52 w-full flex-shrink-0 rounded-b-none"></div>
                            <div className="p-5 flex-1 flex flex-col gap-3">
                                <div className="skeleton h-5 w-full rounded text-lg mt-1"></div>
                                <div className="skeleton h-5 w-4/5 rounded"></div>
                                <div className="skeleton h-3 w-1/4 rounded mt-auto"></div>
                            </div>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
}
