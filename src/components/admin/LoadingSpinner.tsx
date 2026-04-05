"use client";

import React from "react";

interface LoadingSpinnerProps {
    text?: string;
}

export default function LoadingSpinner({ text = "Loading..." }: LoadingSpinnerProps) {
    return (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="relative w-10 h-10">
                <div className="absolute inset-0 rounded-full border-2 border-gray-200" />
                <div className="absolute inset-0 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
            </div>
            <p className="text-sm text-gray-400 font-medium">{text}</p>
        </div>
    );
}
