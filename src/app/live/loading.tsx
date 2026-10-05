export default function LiveLoading() {
    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <div className="h-14 bg-white border-b border-gray-200 flex items-center px-4">
                <div className="skeleton h-7 w-32 rounded-md" />
            </div>

            <main className="max-w-7xl mx-auto px-4 py-6 w-full flex-1 animate-pulse">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-4">
                        <div className="skeleton w-full aspect-video rounded-2xl" />
                        <div className="skeleton h-7 w-2/3 rounded-lg" />
                    </div>
                    <div className="space-y-3">
                        <div className="skeleton h-6 w-1/3 rounded" />
                        {Array(4).fill(0).map((_, i) => (
                            <div key={i} className="skeleton h-16 w-full rounded-xl" />
                        ))}
                    </div>
                </div>
            </main>
        </div>
    );
}
