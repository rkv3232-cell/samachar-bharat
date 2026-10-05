// components/admin/ui/Pagination.tsx
// Compact pagination with page numbers, ellipsis, and prev/next

"use client";

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    totalItems?: number;
    itemsPerPage?: number;
}

export default function Pagination({
    currentPage,
    totalPages,
    onPageChange,
    totalItems,
    itemsPerPage,
}: PaginationProps) {
    if (totalPages <= 1) return null;

    const maxVisible = 5;
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    const end = Math.min(totalPages, start + maxVisible - 1);

    if (end - start + 1 < maxVisible) {
        start = Math.max(1, end - maxVisible + 1);
    }

    const pages: number[] = [];
    for (let i = start; i <= end; i++) {
        pages.push(i);
    }

    const from = totalItems
        ? (currentPage - 1) * (itemsPerPage || 10) + 1
        : null;
    const to = totalItems
        ? Math.min(currentPage * (itemsPerPage || 10), totalItems)
        : null;

    return (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 px-3 py-2 border-t border-gray-100">
            {totalItems && (
                <p className="text-xs text-gray-500">
                    Showing <span className="font-semibold text-gray-700">{from}</span> to{" "}
                    <span className="font-semibold text-gray-700">{to}</span> of{" "}
                    <span className="font-semibold text-gray-700">{totalItems}</span> results
                </p>
            )}

            <div className="flex items-center gap-1">
                {/* Previous */}
                <button
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="h-7 px-2.5 text-xs font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                    ← Prev
                </button>

                {/* First page + ellipsis */}
                {start > 1 && (
                    <>
                        <button
                            onClick={() => onPageChange(1)}
                            className="w-7 h-7 text-xs font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            1
                        </button>
                        {start > 2 && (
                            <span className="w-5 h-7 flex items-center justify-center text-gray-400 text-xs">
                                ···
                            </span>
                        )}
                    </>
                )}

                {/* Page numbers */}
                {pages.map((page) => (
                    <button
                        key={page}
                        onClick={() => onPageChange(page)}
                        className={`w-7 h-7 text-xs font-semibold rounded-lg border transition-colors ${currentPage === page
                            ? "bg-red-600 text-white border-red-600 shadow-2xs"
                            : "text-gray-700 bg-white border-gray-200 hover:bg-gray-50"
                            }`}
                    >
                        {page}
                    </button>
                ))}

                {/* Last page + ellipsis */}
                {end < totalPages && (
                    <>
                        {end < totalPages - 1 && (
                            <span className="w-5 h-7 flex items-center justify-center text-gray-400 text-xs">
                                ···
                            </span>
                        )}
                        <button
                            onClick={() => onPageChange(totalPages)}
                            className="w-7 h-7 text-xs font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            {totalPages}
                        </button>
                    </>
                )}

                {/* Next */}
                <button
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="h-7 px-2.5 text-xs font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                    Next →
                </button>
            </div>
        </div>
    );
}
