// ============================================================
// components/posts/TagSelect.tsx
// Multi-select tag input with dropdown suggestions
// Used in post creation/editing forms
// ============================================================

"use client";

import { useState, useEffect, useRef } from "react";
import { fetchTags } from "@/lib/firestore/tags";
import type { Tag } from "@/types";

interface TagSelectProps {
    value: string[];
    onChange: (tags: string[]) => void;
    label?: string;
}

export default function TagSelect({
    value,
    onChange,
    label = "Tags",
}: TagSelectProps) {
    const [tags, setTags] = useState<Tag[]>([]);
    const [loading, setLoading] = useState(true);
    const [input, setInput] = useState("");
    const [showDropdown, setShowDropdown] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        (async () => {
            try {
                const data = await fetchTags();
                setTags(data);
            } catch (error) {
                console.error("Failed to load tags:", error);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (
                containerRef.current &&
                !containerRef.current.contains(e.target as Node)
            ) {
                setShowDropdown(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const filteredTags = tags.filter(
        (t) =>
            !value.includes(t.name) &&
            t.name.toLowerCase().includes(input.toLowerCase())
    );

    const addTag = (tagName: string) => {
        if (!value.includes(tagName)) {
            onChange([...value, tagName]);
        }
        setInput("");
        setShowDropdown(false);
    };

    const removeTag = (tagName: string) => {
        onChange(value.filter((t) => t !== tagName));
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Backspace" && !input && value.length > 0) {
            // Remove last tag on Backspace
            removeTag(value[value.length - 1]);
        }
        if (e.key === "Enter" && input.trim()) {
            e.preventDefault();
            addTag(input.trim());
        }
    };

    return (
        <div ref={containerRef} className="relative">
            {label && (
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    {label}
                </label>
            )}

            <div
                className="flex flex-wrap gap-2 p-2.5 border border-gray-300 rounded-xl min-h-[44px] cursor-text focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 bg-white transition-shadow"
                onClick={() => {
                    const input = containerRef.current?.querySelector("input");
                    input?.focus();
                }}
            >
                {value.map((tag) => (
                    <span
                        key={tag}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-100 text-blue-800 rounded-lg text-sm font-medium"
                    >
                        #{tag}
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                removeTag(tag);
                            }}
                            className="text-blue-500 hover:text-blue-700 font-bold text-xs leading-none"
                        >
                            ×
                        </button>
                    </span>
                ))}
                <input
                    type="text"
                    value={input}
                    onChange={(e) => {
                        setInput(e.target.value);
                        setShowDropdown(true);
                    }}
                    onFocus={() => setShowDropdown(true)}
                    onKeyDown={handleKeyDown}
                    placeholder={
                        loading
                            ? "Loading..."
                            : value.length === 0
                                ? "Search or type to add tags..."
                                : ""
                    }
                    disabled={loading}
                    className="flex-1 min-w-[120px] outline-none text-sm py-1 bg-transparent disabled:opacity-50 placeholder:text-gray-400"
                />
            </div>

            {/* Dropdown */}
            {showDropdown && input && filteredTags.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-gray-200 rounded-xl shadow-xl z-20 max-h-48 overflow-y-auto">
                    {filteredTags.slice(0, 10).map((tag) => (
                        <button
                            key={tag.id}
                            type="button"
                            onClick={() => addTag(tag.name)}
                            className="w-full text-left px-4 py-2.5 text-sm hover:bg-blue-50 transition-colors flex items-center gap-2"
                        >
                            <span className="text-gray-400 text-xs">#</span>
                            <span className="font-medium text-gray-700">{tag.name}</span>
                        </button>
                    ))}
                </div>
            )}

            {value.length > 0 && (
                <p className="text-xs text-gray-400 mt-1.5">
                    {value.length} tag{value.length !== 1 ? "s" : ""} selected
                </p>
            )}
        </div>
    );
}
