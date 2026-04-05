'use client';

import { useState, useEffect } from 'react';
import { Download, Lock } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { UserRole } from '@/types/auth.types';
import { toast } from 'sonner';

interface DownloadButtonProps {
    postId: string;
    title: string;
    content: string;
    image?: string;
    category?: string;
    date?: string;
}

const USER_DOWNLOAD_LIMIT = 3;
const STORAGE_KEY_PREFIX = 'sb_dl_count_';

// Detect mobile/tablet
const isMobile = () =>
    typeof navigator !== 'undefined' &&
    /android|iphone|ipad|ipod|opera mini|iemobile|mobile/i.test(navigator.userAgent);

export default function DownloadButton({
    postId,
    title,
    content,
    image,
    category,
    date,
}: DownloadButtonProps) {
    const { user, role } = useAuth();
    const [loading, setLoading] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const isPrivileged =
        role === UserRole.OWNER ||
        role === UserRole.ADMIN ||
        role === UserRole.EDITOR ||
        role === UserRole.REPORTER;

    const getDownloadCount = (): number => {
        if (typeof window === 'undefined' || !mounted) return 0;
        const uid = user?.uid || 'guest';
        return parseInt(localStorage.getItem(`${STORAGE_KEY_PREFIX}${uid}`) || '0', 10);
    };

    const incrementDownloadCount = () => {
        const uid = user?.uid || 'guest';
        const current = getDownloadCount();
        localStorage.setItem(`${STORAGE_KEY_PREFIX}${uid}`, String(current + 1));
    };

    const getRemainingDownloads = (): number => {
        return Math.max(0, USER_DOWNLOAD_LIMIT - getDownloadCount());
    };

    const buildHTML = () => {
        const plainText = content.replace(/<[^>]+>/g, '').trim();
        return `<!DOCTYPE html>
<html lang="hi">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>${title} - Samachar Bharat</title>
  <style>
    @page { margin: 12mm; size: A4; }
    * { box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 0; background: #fff; color: #111; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .header { background: #cc0000; color: #fff; padding: 12px 20px; display: flex; align-items: center; gap: 10px; margin-bottom: 18px; }
    .header-logo { font-size: 18px; font-weight: 900; letter-spacing: 1px; }
    .header-logo span { font-size: 10px; display: block; font-weight: 400; opacity: 0.85; }
    .body { padding: 0 8px; }
    .category-badge { display: inline-block; background: #cc0000; color: #fff; font-size: 10px; font-weight: 700; padding: 3px 10px; border-radius: 4px; text-transform: uppercase; margin-bottom: 10px; }
    .post-title { font-size: 20px; font-weight: 900; line-height: 1.35; margin-bottom: 8px; color: #111; }
    .meta { font-size: 12px; color: #666; margin-bottom: 16px; padding-bottom: 10px; border-bottom: 2px solid #f0f0f0; }
    .cover-img { width: 100%; max-height: 280px; object-fit: cover; border-radius: 6px; margin-bottom: 18px; display: block; }
    .content { font-size: 14px; line-height: 1.85; color: #333; white-space: pre-line; }
    .footer { margin-top: 28px; padding-top: 10px; border-top: 1px solid #eee; font-size: 10px; color: #999; text-align: center; }
    .hint { background: #fff3cd; border: 1px solid #ffc107; border-radius: 6px; padding: 9px 12px; font-size: 12px; color: #856404; margin-bottom: 16px; text-align: center; }
    @media print { .hint { display: none !important; } }
  </style>
</head>
<body>
  <div class="header">
    <div class="header-logo">SAMACHAR BHARAT<span>हिंदी समाचार</span></div>
  </div>
  <div class="body">
    <div class="hint">📄 PDF Save करें: Share / Print → "Save as PDF" चुनें</div>
    ${category ? `<div class="category-badge">${category}</div><br/>` : ''}
    <div class="post-title">${title}</div>
    <div class="meta">📅 ${date || new Date().toLocaleDateString('hi-IN')} &nbsp;|&nbsp; 🗞️ Samachar Bharat</div>
    ${image && !image.match(/\.(mp4|webm|ogg|mov)$/) ? `<img class="cover-img" src="${image}" alt="${title}" />` : ''}
    <div class="content">${plainText}</div>
    <div class="footer">© ${new Date().getFullYear()} Samachar Bharat — सभी अधिकार सुरक्षित | samacharbharatgzp@gmail.com</div>
  </div>
  <script>window.onload = function() { setTimeout(function() { window.print(); }, 700); };</script>
</body>
</html>`;
    };

    // ── Desktop: print popup ────────────────────────────────────────────────────
    const printOnDesktop = (html: string) => {
        const win = window.open('', '_blank', 'width=870,height=1100');
        if (!win) throw new Error('popup_blocked');
        win.document.write(html);
        win.document.close();
    };

    // ── Mobile: hidden iframe print (no popup) ──────────────────────────────────
    const printOnMobile = (html: string) => {
        // Remove old iframe if exists
        const old = document.getElementById('sb-print-frame');
        if (old) old.remove();

        const frame = document.createElement('iframe');
        frame.id = 'sb-print-frame';
        frame.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;border:none;';
        document.body.appendChild(frame);

        const doc = frame.contentDocument || frame.contentWindow?.document;
        if (!doc) {
            // Fallback: download HTML file
            downloadHTMLFile(html);
            return;
        }
        doc.open();
        doc.write(html);
        doc.close();

        frame.onload = () => {
            setTimeout(() => {
                try {
                    frame.contentWindow?.print();
                } catch {
                    // If iframe print fails, fallback to file download
                    downloadHTMLFile(html);
                }
            }, 500);
        };
    };

    // ── Fallback: download as .html file (open in browser → print → PDF) ───────
    const downloadHTMLFile = (html: string) => {
        const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `samachar-bharat-${postId}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.info('File download हो गई!', {
            description: 'file खोलें → Share/Print → "Save as PDF" करें।',
            duration: 6000,
        });
    };

    const handleDownload = async () => {
        if (!isPrivileged) {
            const used = getDownloadCount();
            if (used >= USER_DOWNLOAD_LIMIT) {
                toast.error(`आपकी download limit (${USER_DOWNLOAD_LIMIT}) समाप्त हो गई है।`, {
                    description: 'अधिक downloads के लिए Premium plan लें।',
                });
                return;
            }
        }

        setLoading(true);
        try {
            const html = buildHTML();
            const mobile = isMobile();

            if (mobile) {
                printOnMobile(html);
            } else {
                try {
                    printOnDesktop(html);
                } catch {
                    // popup blocked fallback
                    printOnMobile(html);
                }
            }

            // Track count
            if (!isPrivileged) {
                incrementDownloadCount();
                const remaining = getRemainingDownloads();
                toast.success(mobile ? 'Print dialog खुल रही है!' : 'PDF window खुल गई!', {
                    description: remaining > 0
                        ? `"Save as PDF" चुनें। ${remaining} downloads बची हैं।`
                        : '"Save as PDF" चुनें। यह आपकी आखिरी free download थी।',
                    duration: 5000,
                });
            } else {
                toast.success(
                    mobile ? 'Print dialog खुल रही है!' : 'PDF window खुल गई!',
                    { description: '"Save as PDF" चुनकर PDF save करें।', duration: 4000 }
                );
            }
        } catch (err) {
            console.error('[Download] Error:', err);
            toast.error('Download failed. कृपया फिर से कोशिश करें।');
        } finally {
            setLoading(false);
        }
    };

    const remaining = !isPrivileged ? getRemainingDownloads() : null;
    const isBlocked = !isPrivileged && remaining === 0;

    return (
        <div className="flex items-center gap-2">
            <button
                onClick={handleDownload}
                disabled={loading || isBlocked}
                title={isBlocked ? 'Download limit समाप्त' : 'PDF Download करें'}
                className={`flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-lg border transition-all
                    ${isBlocked
                        ? 'border-gray-300 text-gray-400 bg-gray-100 cursor-not-allowed'
                        : 'border-red-200 text-red-600 hover:bg-red-50 active:scale-95'
                    }`}
            >
                {isBlocked ? (
                    <>
                        <Lock className="w-4 h-4" />
                        Limit Over
                    </>
                ) : (
                    <>
                        <Download className={`w-4 h-4 ${loading ? 'animate-bounce' : ''}`} />
                        {loading ? 'Opening...' : 'PDF'}
                    </>
                )}
            </button>

            {!isPrivileged && (
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${remaining === 0
                    ? 'bg-red-100 text-red-600'
                    : remaining === 1
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-green-100 text-green-700'
                    }`}>
                    {remaining}/{USER_DOWNLOAD_LIMIT} बचे
                </span>
            )}
        </div>
    );
}
