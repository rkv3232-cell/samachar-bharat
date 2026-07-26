// src/components/dpivs/card-generation/CardPreviewModal.tsx
"use client";

import React, { useState } from "react";
import { Download, Grid, Layers, Printer, QrCode, X } from "lucide-react";
import { ReporterProfile } from "@/types/dpivs";
import CanvasCardRenderer from "./CanvasCardRenderer";

interface CardPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  reporter: ReporterProfile | null;
}

export default function CardPreviewModal({
  isOpen,
  onClose,
  reporter,
}: CardPreviewModalProps) {
  const [viewMode, setViewMode] = useState<"sidebyside" | "single">("sidebyside");
  const [activeTab, setActiveTab] = useState<"front" | "back">("front");
  const [frontDataUrl, setFrontDataUrl] = useState<string>("");
  const [backDataUrl, setBackDataUrl] = useState<string>("");

  if (!isOpen || !reporter) return null;

  const currentDataUrl = activeTab === "front" ? frontDataUrl : backDataUrl;

  // Single Card PNG Download Function
  const handleDownloadSinglePNG = () => {
    if (!currentDataUrl) return;

    const link = document.createElement("a");
    link.download = `PressCard_${reporter.pressIdNumber}_${activeTab.toUpperCase()}.png`;
    link.href = currentDataUrl;
    link.click();
  };

  /**
   * Generates High-Resolution Side-by-Side CR80 PDF (112mm x 86mm canvas)
   * - Front card (54mm x 86mm) on Left
   * - 4mm Gap
   * - Back card (54mm x 86mm) on Right
   * - Zero extra white page or margins
   * - Center aligned & crop-mark free
   */
  const handleDownloadSideBySidePDF = async () => {
    if (!frontDataUrl || !backDataUrl) return;

    try {
      const { jsPDF } = await import("jspdf");

      const CARD_W = 54; // mm (CR80 standard)
      const CARD_H = 86; // mm (CR80 standard)
      const GAP_X = 4;   // mm (3-5mm gap)

      const TOTAL_W = CARD_W * 2 + GAP_X; // 54 + 4 + 54 = 112mm

      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: [TOTAL_W, CARD_H], // Custom exact 112mm x 86mm format
        compress: true,
      });

      // Front Card on Left (x = 0, y = 0)
      pdf.addImage(frontDataUrl, "PNG", 0, 0, CARD_W, CARD_H, undefined, "FAST");

      // Back Card on Right (x = 58mm, y = 0)
      pdf.addImage(backDataUrl, "PNG", CARD_W + GAP_X, 0, CARD_W, CARD_H, undefined, "FAST");

      pdf.save(`PressCard_${reporter.pressIdNumber}_SideBySide.pdf`);
    } catch (err: any) {
      console.error("[CardPreviewModal] PDF generation error:", err);
    }
  };

  /**
   * Generates Ultra High-Resolution Side-by-Side PNG Image (~1317 DPI / 5808px x 4460px)
   * - Preserves full 4x native master card resolution without downscaling
   * - Enables high-quality anti-aliasing & image smoothing
   * - Zero lossy compression
   */
  const handleDownloadSideBySidePNG = () => {
    if (!frontDataUrl || !backDataUrl) return;

    const imgFront = new Image();
    const imgBack = new Image();

    let loadedCount = 0;
    const renderAndDownload = () => {
      loadedCount++;
      if (loadedCount === 2) {
        const frontW = imgFront.naturalWidth || 2800;
        const frontH = imgFront.naturalHeight || 4460;
        const backW = imgBack.naturalWidth || 2800;

        // Exact proportional gap: 4mm in ratio to card 54mm (4 / 54 * frontW)
        const gapPx = Math.round((4 / 54) * frontW);
        const totalW = frontW + backW + gapPx;

        const canvas = document.createElement("canvas");
        canvas.width = totalW;
        canvas.height = frontH;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";

        // Draw Front Card on Left (0, 0) at full 4x resolution
        ctx.drawImage(imgFront, 0, 0, frontW, frontH);
        // Draw Back Card on Right at full 4x resolution
        ctx.drawImage(imgBack, frontW + gapPx, 0, backW, frontH);

        const link = document.createElement("a");
        link.download = `PressCard_${reporter.pressIdNumber}_SideBySide.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();
      }
    };

    imgFront.onload = renderAndDownload;
    imgBack.onload = renderAndDownload;
    imgFront.src = frontDataUrl;
    imgBack.src = backDataUrl;
  };

  /**
   * Browser Direct Print for Side-by-Side CR80 (112mm x 86mm) layout
   */
  const handlePrintSideBySide = async () => {
    if (!frontDataUrl || !backDataUrl) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Print Side-by-Side Press Cards - ${reporter.fullName}</title>
          <style>
            @page {
              size: 112mm 86mm;
              margin: 0;
            }
            * { box-sizing: border-box; }
            html, body {
              margin: 0;
              padding: 0;
              width: 112mm;
              height: 86mm;
              background: #ffffff;
            }
            .print-container {
              width: 112mm;
              height: 86mm;
              display: flex;
              flex-direction: row;
              align-items: center;
              justify-content: flex-start;
              gap: 4mm;
            }
            .card-img {
              width: 54mm;
              height: 86mm;
              display: block;
              object-fit: contain;
            }
          </style>
        </head>
        <body>
          <div class="print-container">
            <img src="${frontDataUrl}" class="card-img" alt="Front Card" />
            <img src="${backDataUrl}" class="card-img" alt="Back Card" />
          </div>
          <script>
            window.onload = () => { window.print(); window.close(); };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 md:p-6 overflow-hidden">
      {/* Modal Dialog Box */}
      <div className="relative w-full max-w-[960px] h-[92vh] max-h-[92vh] rounded-3xl bg-gray-900 border border-gray-800 shadow-2xl flex flex-col overflow-hidden">
        {/* 1. Header */}
        <div className="flex-none flex items-center justify-between border-b border-gray-800 px-6 py-4 bg-gray-900/90">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-xl border border-blue-500/20 text-blue-400">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide">
                Official Press Identity Card & Export Engine
              </h2>
              <p className="text-xs text-gray-400 font-mono">
                Press ID: {reporter.pressIdNumber} • Standard CR80 Side-by-Side (112mm × 86mm)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2. Top Layout & Switcher */}
        <div className="flex-none flex flex-wrap items-center justify-between border-b border-gray-800 bg-gray-900/50 px-6 py-3 gap-3">
          {/* Main View Switcher */}
          <div className="flex items-center gap-1.5 p-1 bg-gray-800/80 rounded-xl border border-gray-700/60">
            <button
              onClick={() => setViewMode("sidebyside")}
              className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                viewMode === "sidebyside"
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30"
                  : "text-gray-400 hover:text-gray-200"
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              Side-by-Side Layout
            </button>
            <button
              onClick={() => setViewMode("single")}
              className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                viewMode === "single"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                  : "text-gray-400 hover:text-gray-200"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Single Card View
            </button>
          </div>

          {/* Sub-tab for Single Card View */}
          {viewMode === "single" && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab("front")}
                className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  activeTab === "front"
                    ? "bg-gray-700 text-white border border-gray-600"
                    : "text-gray-400 hover:bg-gray-800 hover:text-gray-200"
                }`}
              >
                Front Side
              </button>
              <button
                onClick={() => setActiveTab("back")}
                className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  activeTab === "back"
                    ? "bg-gray-700 text-white border border-gray-600"
                    : "text-gray-400 hover:bg-gray-800 hover:text-gray-200"
                }`}
              >
                Back Side
              </button>
            </div>
          )}
        </div>

        {/* 3. Center Preview Box */}
        <div className="flex-1 min-h-0 w-full p-4 md:p-6 bg-[#090D16] flex items-center justify-center overflow-hidden relative">
          {viewMode === "single" ? (
            currentDataUrl ? (
              <img
                src={currentDataUrl}
                alt={`Press Card ${activeTab}`}
                className="h-full w-auto max-h-full max-w-full object-contain rounded-2xl shadow-2xl border border-gray-800/80 animate-in fade-in duration-200"
              />
            ) : (
              <div className="flex flex-col items-center justify-center gap-3 text-gray-400 text-sm">
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <span>Rendering High-Res Master Credential...</span>
              </div>
            )
          ) : (
            /* Auto-fit Unclipped Side-by-Side CR80 Preview */
            <div className="h-full w-full max-h-full max-w-full flex items-center justify-center p-2">
              {frontDataUrl && backDataUrl ? (
                <div className="h-full max-h-full w-full max-w-full flex items-center justify-center gap-3 sm:gap-5 md:gap-6">
                  {/* Left: Front Card */}
                  <img
                    src={frontDataUrl}
                    alt="Front Card"
                    className="h-full max-h-full w-auto max-w-[48%] object-contain rounded-2xl shadow-2xl border border-gray-800 animate-in fade-in duration-200"
                  />

                  {/* Right: Back Card */}
                  <img
                    src={backDataUrl}
                    alt="Back Card"
                    className="h-full max-h-full w-auto max-w-[48%] object-contain rounded-2xl shadow-2xl border border-gray-800 animate-in fade-in duration-200"
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center gap-3 text-gray-400 text-sm">
                  <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                  <span>Preparing Side-by-Side Master Canvas...</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Hidden Master Generators */}
        <div className="hidden" aria-hidden="true">
          <CanvasCardRenderer
            reporter={reporter}
            side="front"
            onRendered={(url) => setFrontDataUrl(url)}
          />
          <CanvasCardRenderer
            reporter={reporter}
            side="back"
            onRendered={(url) => setBackDataUrl(url)}
          />
        </div>

        {/* 4. Footer Actions */}
        <div className="flex-none flex items-center justify-between border-t border-gray-800 px-6 py-4 bg-gray-900/90">
          <div className="text-xs text-gray-400 font-mono hidden xl:block">
            Side-by-Side Canvas • CR80 (54×86mm) • 4mm Gap • 0 Margin
          </div>
          <div className="flex flex-wrap items-center gap-2.5 w-full xl:w-auto justify-end">
            <button
              onClick={handlePrintSideBySide}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold text-gray-200 bg-gray-800 border border-gray-700 hover:bg-gray-700 rounded-xl transition-colors shadow-sm"
            >
              <Printer className="w-4 h-4 text-gray-300" />
              Print Side-by-Side
            </button>

            {viewMode === "single" ? (
              <button
                onClick={handleDownloadSinglePNG}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-xl transition-colors shadow-lg shadow-blue-600/25"
              >
                <Download className="w-4 h-4" />
                Download Single ({activeTab.toUpperCase()}) PNG
              </button>
            ) : (
              <>
                <button
                  onClick={handleDownloadSideBySidePNG}
                  className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-xl transition-colors shadow-lg shadow-blue-600/25"
                >
                  <Download className="w-4 h-4" />
                  Download Side-by-Side PNG
                </button>
                <button
                  onClick={handleDownloadSideBySidePDF}
                  className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-colors shadow-lg shadow-emerald-600/25"
                >
                  <Download className="w-4 h-4" />
                  Download Side-by-Side PDF
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


