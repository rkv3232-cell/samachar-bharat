// ============================================================
// app/admin/categories/page.tsx
// COMPLETE COMPACT CATEGORIES & TAGS MANAGEMENT SYSTEM
// ============================================================

"use client";

import { useState, useEffect, useCallback } from "react";
import {
    fetchCategories,
    addCategory,
    deleteCategory,
} from "@/lib/firestore/categories";
import { fetchTags, addTag, deleteTag } from "@/lib/firestore/tags";
import { useToast } from "@/contexts/ToastContext";
import type { Category, Tag } from "@/types";
import LoadingSpinner from "@/components/admin/ui/LoadingSpinner";
import ConfirmDialog from "@/components/admin/ui/ConfirmDialog";

export default function CategoriesPage() {
    // ─── Categories State ───────────────────────────
    const [categories, setCategories] = useState<Category[]>([]);
    const [catLoading, setCatLoading] = useState(true);
    const [newCatName, setNewCatName] = useState("");
    const [newCatSlug, setNewCatSlug] = useState("");
    const [addingCat, setAddingCat] = useState(false);
    const [deleteCatTarget, setDeleteCatTarget] = useState<Category | null>(null);

    // ─── Tags State ─────────────────────────────────
    const [tags, setTags] = useState<Tag[]>([]);
    const [tagLoading, setTagLoading] = useState(true);
    const [newTagName, setNewTagName] = useState("");
    const [addingTag, setAddingTag] = useState(false);
    const [deleteTagTarget, setDeleteTagTarget] = useState<Tag | null>(null);

    const [actionLoading, setActionLoading] = useState(false);
    const { addToast } = useToast();

    // ─── Load Data ──────────────────────────────────
    const loadCategories = useCallback(async (isInitial = false) => {
        try {
            if (!isInitial) setCatLoading(true);
            const data = await fetchCategories();
            setCategories(data);
        } catch (_error) {
            addToast("Failed to load categories", "error");
        } finally {
            setCatLoading(false);
        }
    }, [addToast]);

    const loadTags = useCallback(async (isInitial = false) => {
        try {
            if (!isInitial) setTagLoading(true);
            const data = await fetchTags();
            setTags(data);
        } catch (_error) {
            addToast("Failed to load tags", "error");
        } finally {
            setTagLoading(false);
        }
    }, [addToast]);

    useEffect(() => {
        loadCategories(true);
        loadTags(true);
    }, [loadCategories, loadTags]);

    // ─── Slug Generator ────────────────────────────
    const generateSlug = (name: string) =>
        name
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9\s-]/g, "")
            .replace(/[\s_]+/g, "-")
            .replace(/-+/g, "-")
            .replace(/(^-|-$)/g, "");

    const handleCatNameChange = (value: string) => {
        setNewCatName(value);
        setNewCatSlug(generateSlug(value));
    };

    // ─── Add Category ──────────────────────────────
    const handleAddCategory = async (e: React.FormEvent) => {
        e.preventDefault();

        const name = newCatName.trim();
        if (!name) {
            addToast("Category name is required", "error");
            return;
        }

        // Check duplicate
        if (categories.some((c) => c.name.toLowerCase() === name.toLowerCase())) {
            addToast("This category already exists", "error");
            return;
        }

        try {
            setAddingCat(true);
            const slug = newCatSlug.trim() || generateSlug(name);
            const newId = await addCategory(name, slug);
            setCategories((prev) => [...prev, { id: newId, name, slug }]);
            setNewCatName("");
            setNewCatSlug("");
            addToast(`Category "${name}" created!`, "success");
        } catch (error: any) {
            addToast(error.message || "Failed to add category", "error");
        } finally {
            setAddingCat(false);
        }
    };

    // ─── Delete Category ───────────────────────────
    const handleDeleteCategory = async () => {
        if (!deleteCatTarget) return;

        try {
            setActionLoading(true);
            await deleteCategory(deleteCatTarget.id);
            setCategories((prev) => prev.filter((c) => c.id !== deleteCatTarget.id));
            addToast(`Category "${deleteCatTarget.name}" deleted`, "success");
            setDeleteCatTarget(null);
        } catch (error) {
            addToast("Failed to delete category", "error");
        } finally {
            setActionLoading(false);
        }
    };

    // ─── Add Tag ───────────────────────────────────
    const handleAddTag = async (e: React.FormEvent) => {
        e.preventDefault();

        const name = newTagName.trim();
        if (!name) {
            addToast("Tag name is required", "error");
            return;
        }

        // Check duplicate
        if (tags.some((t) => t.name.toLowerCase() === name.toLowerCase())) {
            addToast("This tag already exists", "error");
            return;
        }

        try {
            setAddingTag(true);
            const newId = await addTag(name);
            setTags((prev) => [...prev, { id: newId, name }]);
            setNewTagName("");
            addToast(`Tag "${name}" created!`, "success");
        } catch (error: any) {
            addToast(error.message || "Failed to add tag", "error");
        } finally {
            setAddingTag(false);
        }
    };

    // ─── Delete Tag ────────────────────────────────
    const handleDeleteTag = async () => {
        if (!deleteTagTarget) return;

        try {
            setActionLoading(true);
            await deleteTag(deleteTagTarget.id);
            setTags((prev) => prev.filter((t) => t.id !== deleteTagTarget.id));
            addToast(`Tag "${deleteTagTarget.name}" deleted`, "success");
            setDeleteTagTarget(null);
        } catch (error) {
            addToast("Failed to delete tag", "error");
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <div className="space-y-4">
            {/* Page Header */}
            <div>
                <h1 className="text-lg font-extrabold text-gray-900 tracking-tight">
                    Categories & Tags
                </h1>
                <p className="text-xs text-gray-500">
                    Organize your posts with categories and tags
                </p>
            </div>

            {/* ─── Stats ─────────────────────────────── */}
            <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl p-3.5 bg-white border border-gray-200/80 shadow-2xs flex items-center justify-between">
                    <div>
                        <p className="text-xs font-medium text-gray-500">Categories</p>
                        <p className="text-xl font-black text-gray-900 leading-tight mt-0.5">{categories.length}</p>
                    </div>
                    <span className="text-lg">📂</span>
                </div>
                <div className="rounded-xl p-3.5 bg-white border border-gray-200/80 shadow-2xs flex items-center justify-between">
                    <div>
                        <p className="text-xs font-medium text-gray-500">Tags</p>
                        <p className="text-xl font-black text-gray-900 leading-tight mt-0.5">{tags.length}</p>
                    </div>
                    <span className="text-lg">🏷️</span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* ═══════════════════════════════════════ */}
                {/* CATEGORIES SECTION                      */}
                {/* ═══════════════════════════════════════ */}
                <div className="bg-white rounded-xl shadow-2xs border border-gray-200/80 overflow-hidden">
                    {/* Header */}
                    <div className="px-4 py-2.5 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                        <h2 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                            <span>📂</span> Categories
                        </h2>
                        <span className="text-xs text-gray-500">
                            {categories.length} total
                        </span>
                    </div>

                    {/* Add Form */}
                    <div className="p-3.5 border-b border-gray-100 bg-white">
                        <form onSubmit={handleAddCategory} className="space-y-2.5">
                            <div>
                                <label className="block text-[11px] font-semibold text-gray-600 uppercase tracking-wider mb-1">
                                    Category Name
                                </label>
                                <input
                                    type="text"
                                    value={newCatName}
                                    onChange={(e) => handleCatNameChange(e.target.value)}
                                    placeholder="e.g., Technology"
                                    className="w-full h-8 px-3 text-xs bg-white border border-gray-200 rounded-lg focus:ring-1 focus:ring-red-500 focus:border-red-500 outline-none transition-shadow text-gray-900"
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-semibold text-gray-600 uppercase tracking-wider mb-1">
                                    Slug <span className="text-gray-400 normal-case font-normal">(auto-generated)</span>
                                </label>
                                <input
                                    type="text"
                                    value={newCatSlug}
                                    onChange={(e) => setNewCatSlug(e.target.value)}
                                    placeholder="technology"
                                    className="w-full h-8 px-3 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:ring-1 focus:ring-red-500 focus:border-red-500 outline-none text-gray-600 font-mono transition-shadow"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={addingCat || !newCatName.trim()}
                                className="w-full h-8 px-3 text-xs font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-all shadow-2xs active:scale-[0.99]"
                            >
                                {addingCat ? "Adding..." : "+ Add Category"}
                            </button>
                        </form>
                    </div>

                    {/* Categories List */}
                    <div className="max-h-[360px] overflow-y-auto">
                        {catLoading ? (
                            <div className="p-4"><LoadingSpinner message="Loading categories..." /></div>
                        ) : categories.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                <p className="text-2xl mb-1">📂</p>
                                <p className="text-xs font-medium">No categories yet</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100">
                                {categories.map((cat) => (
                                    <div
                                        key={cat.id}
                                        className="flex items-center justify-between px-3.5 py-2 hover:bg-gray-50/80 transition-colors group"
                                    >
                                        <div className="min-w-0 flex-1">
                                            <p className="text-xs font-semibold text-gray-900 truncate">
                                                {cat.name}
                                            </p>
                                            <p className="text-[11px] text-gray-400 font-mono">
                                                /{cat.slug}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => setDeleteCatTarget(cat)}
                                            className="px-2 py-0.5 text-[11px] font-semibold text-red-600 bg-red-50 rounded hover:bg-red-100 opacity-0 group-hover:opacity-100 transition-all"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* ═══════════════════════════════════════ */}
                {/* TAGS SECTION                            */}
                {/* ═══════════════════════════════════════ */}
                <div className="bg-white rounded-xl shadow-2xs border border-gray-200/80 overflow-hidden">
                    {/* Header */}
                    <div className="px-4 py-2.5 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                        <h2 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                            <span>🏷️</span> Tags
                        </h2>
                        <span className="text-xs text-gray-500">
                            {tags.length} total
                        </span>
                    </div>

                    {/* Add Form */}
                    <div className="p-3.5 border-b border-gray-100 bg-white">
                        <form onSubmit={handleAddTag} className="flex gap-2">
                            <input
                                type="text"
                                value={newTagName}
                                onChange={(e) => setNewTagName(e.target.value)}
                                placeholder="e.g., React, Election"
                                className="flex-1 h-8 px-3 text-xs bg-white border border-gray-200 rounded-lg focus:ring-1 focus:ring-red-500 focus:border-red-500 outline-none transition-shadow text-gray-900"
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        e.preventDefault();
                                        handleAddTag(e);
                                    }
                                }}
                            />
                            <button
                                type="submit"
                                disabled={addingTag || !newTagName.trim()}
                                className="h-8 px-3 text-xs font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-all whitespace-nowrap shadow-2xs active:scale-[0.99]"
                            >
                                {addingTag ? "Adding..." : "+ Add"}
                            </button>
                        </form>
                    </div>

                    {/* Tags Cloud */}
                    <div className="p-3.5 max-h-[360px] overflow-y-auto">
                        {tagLoading ? (
                            <div className="p-4"><LoadingSpinner message="Loading tags..." /></div>
                        ) : tags.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                <p className="text-2xl mb-1">🏷️</p>
                                <p className="text-xs font-medium">No tags yet</p>
                            </div>
                        ) : (
                            <div className="flex flex-wrap gap-1.5">
                                {tags.map((tag) => (
                                    <span
                                        key={tag.id}
                                        className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 hover:bg-gray-200/80 rounded-lg text-xs font-medium text-gray-700 transition-colors group cursor-default"
                                    >
                                        <span className="text-gray-400 text-[10px]">#</span>
                                        {tag.name}
                                        <button
                                            onClick={() => setDeleteTagTarget(tag)}
                                            className="w-3.5 h-3.5 flex items-center justify-center rounded-full text-gray-400 hover:text-red-600 hover:bg-red-100 opacity-60 group-hover:opacity-100 transition-all text-xs font-bold leading-none"
                                            title={`Delete "${tag.name}"`}
                                        >
                                            ×
                                        </button>
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ─── Delete Confirmations ──────────────── */}
            <ConfirmDialog
                isOpen={!!deleteCatTarget}
                onClose={() => setDeleteCatTarget(null)}
                onConfirm={handleDeleteCategory}
                title="Delete Category"
                message={`Delete "${deleteCatTarget?.name}"? Posts using this category will show no category.`}
                confirmText="Delete Category"
                loading={actionLoading}
            />

            <ConfirmDialog
                isOpen={!!deleteTagTarget}
                onClose={() => setDeleteTagTarget(null)}
                onConfirm={handleDeleteTag}
                title="Delete Tag"
                message={`Delete the tag "${deleteTagTarget?.name}"?`}
                confirmText="Delete Tag"
                loading={actionLoading}
            />
        </div>
    );
}
