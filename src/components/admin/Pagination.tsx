"use client";

import React from "react";

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    totalItems: number;
    itemsPerPage: number;
}

export default function Pagination({
    currentPage,
    totalPages,
    onPageChange,
    totalItems,
    itemsPerPage,
}: PaginationProps) {
    if (totalPages <= 1) return null;

    const start = (currentPage - 1) * itemsPerPage + 1;
    const end = Math.min(currentPage * itemsPerPage, totalItems);

    function getPages(): (number | "dots")[] {
        const pages: (number | "dots")[] = [];

        if (totalPages <= 7) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
            return pages;
        }

        pages.push(1);
        if (currentPage > 3) pages.push("dots");

        const lo = Math.max(2, currentPage - 1);
        const hi = Math.min(totalPages - 1, currentPage + 1);
        for (let i = lo; i <= hi; i++) pages.push(i);

        if (currentPage < totalPages - 2) pages.push("dots");
        pages.push(totalPages);

        return pages;
    }

    return (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 px-3 py-2 border-t border-gray-100">
            <p className="text-xs text-gray-500">
                Showing{" "}
                <span className="font-semibold text-gray-700">{start}</span>–
                <span className="font-semibold text-gray-700">{end}</span> of{" "}
                <span className="font-semibold text-gray-700">{totalItems}</span>
            </p>

            <div className="flex items-center gap-1">
                <button
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="h-7 px-2.5 text-xs font-semibold rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-gray-700"
                >
                    ← Prev
                </button>

                {getPages().map((page, i) =>
                    page === "dots" ? (
                        <span key={`d${i}`} className="px-1 text-gray-400 select-none text-xs">
                            ···
                        </span>
                    ) : (
                        <button
                            key={page}
                            onClick={() => onPageChange(page as number)}
                            className={`min-w-[28px] h-7 px-1.5 text-xs font-semibold rounded-lg transition-colors ${currentPage === page
                                ? "bg-red-600 text-white shadow-2xs"
                                : "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                                }`}
                        >
                            {page}
                        </button>
                    )
                )}

                <button
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="h-7 px-2.5 text-xs font-semibold rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-gray-700"
                >
                    Next →
                </button>
            </div>
        </div>
    );
}
