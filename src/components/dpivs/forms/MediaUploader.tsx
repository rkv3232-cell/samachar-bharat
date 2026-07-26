// src/components/dpivs/forms/MediaUploader.tsx
"use client";

import { useState, useRef, ChangeEvent } from "react";
import { Upload, Trash2, RefreshCw, CheckCircle2, AlertCircle, Image as ImageIcon } from "lucide-react";

interface MediaUploaderProps {
  label: string;
  subfolder: "photos" | "signatures" | "stamps";
  currentUrl?: string;
  onUrlChange: (url: string) => void;
  aspectRatio?: "square" | "landscape" | "portrait";
  required?: boolean;
  helpText?: string;
}

export default function MediaUploader({
  label,
  subfolder,
  currentUrl,
  onUrlChange,
  aspectRatio = "square",
  required = false,
  helpText,
}: MediaUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setSuccess(false);

    // 1. Validate file type
    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
    if (!validTypes.includes(file.type)) {
      setError("Only JPEG, PNG, or WEBP images are allowed.");
      return;
    }

    // 2. Validate file size (max 5MB)
    const MAX_SIZE_BYTES = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE_BYTES) {
      setError("File size exceeds 5MB limit.");
      return;
    }

    // 3. Initiate Upload
    setUploading(true);
    setProgress(20);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", subfolder);

      // Simulate smooth progress ramp
      const progressTimer = setInterval(() => {
        setProgress((prev) => (prev < 90 ? prev + 15 : prev));
      }, 150);

      const res = await fetch("/api/dpivs/upload", {
        method: "POST",
        body: formData,
      });

      clearInterval(progressTimer);

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Upload failed");
      }

      const data = await res.json();
      if (!data.url) throw new Error("No URL returned from server");

      setProgress(100);
      setSuccess(true);
      onUrlChange(data.url);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to upload image. Please try again.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemove = () => {
    onUrlChange("");
    setError(null);
    setSuccess(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const aspectClasses = {
    square: "w-32 h-32 rounded-xl",
    landscape: "w-48 h-24 rounded-lg",
    portrait: "w-28 h-36 rounded-xl",
  }[aspectRatio];

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold uppercase tracking-wider text-gray-700">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        {currentUrl && (
          <span className="text-[10px] font-semibold text-emerald-600 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Uploaded to Cloudinary
          </span>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFileSelect}
      />

      {/* Upload Box / Image Preview */}
      <div className="relative group">
        {currentUrl ? (
          <div className="relative flex flex-col items-center justify-center p-2 bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-500 transition-colors">
            <div className={`relative overflow-hidden bg-white border border-gray-200 shadow-sm ${aspectClasses}`}>
              <img
                src={currentUrl}
                alt={label}
                className="w-full h-full object-contain"
              />
            </div>

            {/* Hover Actions */}
            <div className="mt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors"
              >
                <RefreshCw className={`w-3 h-3 ${uploading ? "animate-spin" : ""}`} />
                Replace
              </button>
              <button
                type="button"
                onClick={handleRemove}
                disabled={uploading}
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-red-50 text-red-600 rounded-md hover:bg-red-100 transition-colors"
              >
                <Trash2 className="w-3 h-3" />
                Remove
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className={`w-full flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50/50 hover:bg-blue-50/30 hover:border-blue-400 transition-all ${
              uploading ? "opacity-60 cursor-not-allowed" : "cursor-pointer"
            }`}
          >
            <div className="p-3 bg-white rounded-full shadow-sm border border-gray-100 mb-2">
              {uploading ? (
                <RefreshCw className="w-6 h-6 text-blue-600 animate-spin" />
              ) : (
                <Upload className="w-6 h-6 text-gray-500 group-hover:text-blue-600 transition-colors" />
              )}
            </div>
            <p className="text-xs font-semibold text-gray-700">
              {uploading ? "Uploading to Cloudinary..." : `Upload ${label}`}
            </p>
            <p className="text-[11px] text-gray-400 mt-1">JPEG, PNG, WEBP (Max 5MB)</p>
          </button>
        )}
      </div>

      {/* Progress Bar */}
      {uploading && (
        <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden mt-1">
          <div
            className="bg-blue-600 h-full transition-all duration-300 rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Error Message */}
      {error && (
        <p className="text-xs text-red-600 font-medium flex items-center gap-1 mt-1">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          {error}
        </p>
      )}

      {helpText && !error && (
        <p className="text-[11px] text-gray-500">{helpText}</p>
      )}
    </div>
  );
}
