// src/components/dpivs/card-generation/CanvasCardRenderer.tsx
"use client";

import React, { useEffect, useRef } from "react";
import { ReporterProfile } from "@/types/dpivs";

interface CanvasCardRendererProps {
  reporter: ReporterProfile;
  side: "front" | "back";
  scale?: number;
  onRendered?: (dataUrl: string) => void;
}

// Master Card Dimensions: 700px (W) x 1115px (H) matching standard CR80 (54mm x 86mm ratio: 54 / 86 = 0.6279)
const CARD_WIDTH = 700;
const CARD_HEIGHT = 1115;

// Fixed Permanent Project Assets
const FIXED_ASSETS = {
  logo: "/header.logo.jpg",
  officialStamp: "/official-stamp.png",
  directorSignature: "/director-signature.png",
};

// Global in-memory image cache to avoid re-fetching assets on canvas re-renders
const assetImageCache = new Map<string, HTMLImageElement>();

function loadImage(src: string): Promise<HTMLImageElement | null> {
  if (assetImageCache.has(src)) {
    return Promise.resolve(assetImageCache.get(src)!);
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      assetImageCache.set(src, img);
      resolve(img);
    };
    img.onerror = () => {
      console.warn(`[CanvasCardRenderer] Could not load asset: ${src}`);
      resolve(null);
    };
    img.src = src;
  });
}

// Render Scale multiplier (4x Ultra High-Res: 2800px x 4460px per card = ~1317 DPI)
const RENDER_SCALE = 4;

function CanvasCardRendererComponent({
  reporter,
  side,
  scale = 1,
  onRendered,
}: CanvasCardRendererProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    let isMounted = true;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas internal resolution to 4x (Ultra High Quality)
    canvas.width = CARD_WIDTH * RENDER_SCALE;
    canvas.height = CARD_HEIGHT * RENDER_SCALE;

    // Enable Maximum Anti-Aliasing & High Quality Image Smoothing
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    // Natively scale all vector drawing, paths, lines & fonts by 4x
    ctx.scale(RENDER_SCALE, RENDER_SCALE);

    const renderCard = async () => {
      if (side === "front") {
        await drawMasterFrontCard(ctx, reporter);
      } else {
        await drawMasterBackCard(ctx, reporter);
      }

      if (isMounted && onRendered) {
        onRendered(canvas.toDataURL("image/png"));
      }
    };

    renderCard();

    return () => {
      isMounted = false;
    };
  }, [reporter, side]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-auto rounded-2xl shadow-2xl border border-gray-300 bg-white"
      style={{
        maxWidth: `${(CARD_WIDTH / 2) * scale}px`,
        aspectRatio: "54 / 86",
      }}
    />
  );
}

const CanvasCardRenderer = React.memo(CanvasCardRendererComponent);
export default CanvasCardRenderer;

// ─── MASTER FRONT CARD RECREATION ──────────────────────────────────────────────

async function drawMasterFrontCard(
  ctx: CanvasRenderingContext2D,
  reporter: ReporterProfile
) {
  // 1. Pure White Base Background
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);

  // 2. Left Vertical PRESS Strip (Flush to Left Outer Edge - Shortened height)
  const stripW = 54;
  const stripH = 260;
  drawCustomCornerRect(ctx, 0, 0, stripW, stripH, 0, 0, 16, 0, "#0B192C");
  drawVerticalText(ctx, "P  R  E  S  S", 27, 135, "bold 28px sans-serif", "#FFFFFF");

  // 3. Right Vertical PRESS Strip (Flush to Right Outer Edge - Shortened height)
  drawCustomCornerRect(ctx, CARD_WIDTH - stripW, 0, stripW, stripH, 0, 0, 0, 16, "#DC2626");
  drawVerticalText(ctx, "P  R  E  S  S", CARD_WIDTH - 27, 135, "bold 28px sans-serif", "#FFFFFF");

  // 4. Header Logo (Fuller & Prominent between edge strips)
  const logoImg = await loadImage(FIXED_ASSETS.logo);
  if (logoImg) {
    ctx.drawImage(logoImg, stripW, 0, CARD_WIDTH - stripW * 2, 175);
  }

  // Subtitle Line 1: — E PORTAL NEWS CHANNEL —
  ctx.strokeStyle = "#DC2626";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(100, 196);
  ctx.lineTo(200, 196);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(500, 196);
  ctx.lineTo(600, 196);
  ctx.stroke();

  ctx.fillStyle = "#DC2626";
  ctx.font = "bold 24px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("E PORTAL NEWS CHANNEL", CARD_WIDTH / 2, 203);

  // Subtitle Line 2: = जनपद - Ghazipur (Uttar Pradesh) =
  ctx.fillStyle = "#047857"; // Deep Green
  ctx.font = "bold 25px sans-serif";
  ctx.textAlign = "center";

  const districtName = reporter.address?.district || "Ghazipur";
  const stateName = reporter.address?.state || "Uttar Pradesh";
  ctx.fillText(`= जनपद - ${districtName} (${stateName}) =`, CARD_WIDTH / 2, 236);

  // Subtitle Line 3: RN No. Pill Box
  const pillW = 300;
  const pillH = 42;
  const pillX = (CARD_WIDTH - pillW) / 2;
  const pillY = 260;
  drawPillBox(ctx, pillX, pillY, pillW, pillH, "#E6F4F1", "#0D9488");

  ctx.fillStyle = "#0F172A";
  ctx.font = "bold 18px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("RN No.: UP_30_0062085", CARD_WIDTH / 2, pillY + 27);

  // 5. Middle Section: Photo & Reporter Info (y: 325 to 615)
  // Left: Reporter Photo Frame Box
  const photoX = 55;
  const photoY = 325;
  const photoW = 195;
  const photoH = 235;

  // Photo Outer Frame
  ctx.save();
  drawRoundedRectPath(ctx, photoX, photoY, photoW, photoH, 20);
  ctx.fillStyle = "#E2E8F0";
  ctx.fill();
  ctx.strokeStyle = "#000000";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Draw Photo
  if (reporter.photoURL) {
    const photoImg = await loadImage(reporter.photoURL);
    if (photoImg) {
      ctx.clip();
      ctx.drawImage(photoImg, photoX, photoY, photoW, photoH);
    } else {
      drawPhotoFallback(ctx, photoX, photoY, photoW, photoH, reporter.fullName);
    }
  } else {
    drawPhotoFallback(ctx, photoX, photoY, photoW, photoH, reporter.fullName);
  }
  ctx.restore();

  // Reporter Signature (Under Photo)
  const sigY = photoY + photoH + 12;
  if (reporter.signatureImageURL) {
    const repSigImg = await loadImage(reporter.signatureImageURL);
    if (repSigImg) {
      ctx.drawImage(repSigImg, photoX + 15, sigY, photoW - 30, 38);
    }
  }

  ctx.fillStyle = "#475569";
  ctx.font = "bold 13px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("संवाददाता हस्ताक्षर", photoX + photoW / 2, sigY + 52);

  // Right: Reporter Info List with 20-25% Larger Bolder Fonts & 52px Spacing
  const textX = 270;
  let curY = 345;
  const lineGap = 56;

  // 1. Aadhaar
  const aadhaarVal = reporter.aadhaarNumber
    ? `XXXX-XXXX-${reporter.aadhaarNumber.slice(-4)}`
    : "N/A";
  drawInfoLine(ctx, textX, curY, "💳", "आधार कार्ड नंबर", aadhaarVal, 22);

  // 2. Reporter Name
  curY += lineGap;
  drawInfoLine(ctx, textX, curY, "👤", "संवाददाता", reporter.fullName.toUpperCase(), 22);

  // 3. Mobile
  curY += lineGap;
  drawInfoLine(ctx, textX, curY, "📞", "मो", `+91${reporter.mobile.replace(/^\+?91/, "")}`, 22);

  // 4. Email
  curY += lineGap;
  drawInfoLine(ctx, textX, curY, "✉️", "ईमेल", reporter.email || "ckv3232@gmail.com", 22);

  // 5. Blood Group
  curY += lineGap;
  drawInfoLine(ctx, textX, curY, "🩸", "ब्लड ग्रुप", reporter.bloodGroup || "O+", 22);

  // 6. Address
  curY += lineGap;
  const addressVal = (
    reporter.address?.villageCity ||
    reporter.address?.district ||
    "HEADQUARTERS"
  ).toUpperCase();
  drawInfoLine(ctx, textX, curY, "📍", "पता", addressVal, 22);

  // 6. Red Horizontal Divider
  const divY = 650;
  ctx.strokeStyle = "#DC2626";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(25, divY);
  ctx.lineTo(675, divY);
  ctx.stroke();

  // 7. Bottom Section (y: 680 to 967)
  // Left Side Credentials (Slightly reduced font & shifted down)
  let botY = 695;
  drawInfoLine(ctx, 35, botY, "💳", "कार्ड नंबर", reporter.pressIdNumber, 23);

  botY += 56;
  drawInfoLine(ctx, 35, botY, "👤", "डायरेक्टर", "RAMESH PRASAD SONI", 23);

  botY += 56;
  drawInfoLine(ctx, 35, botY, "🆔", "RN No.", "UP_30_0062085", 23);

  // Fixed Director Signature Block
  const dirSigImg = await loadImage(FIXED_ASSETS.directorSignature);
  if (dirSigImg) {
    ctx.drawImage(dirSigImg, 35, 855, 210, 70);
  }

  ctx.fillStyle = "#DC2626";
  ctx.font = "bold 28px sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("रमेश प्रसाद सोनी", 35, 945);

  ctx.fillStyle = "#0F172A";
  ctx.font = "bold 24px sans-serif";
  ctx.fillText("डायरेक्टर / समाचार भारत", 35, 967);

  // Center Right: Official Stamp
  const stampImg = await loadImage(FIXED_ASSETS.officialStamp);
  if (stampImg) {
    ctx.globalAlpha = 0.85;
    ctx.drawImage(stampImg, 350, 825, 190, 190);
    ctx.globalAlpha = 1.0;
  }

  // Right Side: Unified Symmetrical QR Code & VALID UPTO Group
  const qrX = 530;
  const qrY = 800;
  const qrW = 150;
  const qrH = 150;

  const qrDataEncoded = encodeURIComponent(
    reporter.qrCodeData || `https://samacharbharat.in/verify-press-id/${reporter.pressIdNumber}`
  );
  const qrImg = await loadImage(
    `https://api.qrserver.com/v1/create-qr-code/?size=800x800&data=${qrDataEncoded}`
  );

  if (qrImg) {
    ctx.drawImage(qrImg, qrX, qrY, qrW, qrH);
  } else {
    ctx.fillStyle = "#000000";
    ctx.fillRect(qrX, qrY, qrW, qrH);
  }

  ctx.strokeStyle = "#000000";
  ctx.lineWidth = 2;
  ctx.strokeRect(qrX, qrY, qrW, qrH);

  // VALID UPTO Red Banner Box
  const valY = qrY + qrH + 6;
  drawRoundedTopRect(ctx, qrX, valY, qrW, 26, 4, "#DC2626");

  ctx.fillStyle = "#FFFFFF";
  ctx.font = "bold 12px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("VALID UPTO", qrX + qrW / 2, valY + 17);

  // Valid Date White Box
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(qrX, valY + 26, qrW, 26);
  ctx.strokeStyle = "#DC2626";
  ctx.lineWidth = 1.5;
  ctx.strokeRect(qrX, valY + 26, qrW, 26);

  const validDateFormatted = formatDateDDMMYYYY(reporter.validUntil);
  ctx.fillStyle = "#0F172A";
  ctx.font = "bold 14px sans-serif";
  ctx.fillText(validDateFormatted, qrX + qrW / 2, valY + 44);

  // 8. Bottom Contact Bar (Clean evenly distributed layout with no overlap)
  const contactLineY = 1012;
  const contactTextY = 1037;

  ctx.strokeStyle = "#CBD5E1";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(25, contactLineY);
  ctx.lineTo(CARD_WIDTH - 25, contactLineY);
  ctx.stroke();

  ctx.fillStyle = "#0F172A";
  ctx.font = "bold 15.5px sans-serif";

  // Left: Mobile
  ctx.textAlign = "left";
  ctx.fillText("📞 Mobile: +91 8601343232", 25, contactTextY);

  // Center: Email
  ctx.textAlign = "center";
  ctx.fillText("✉️ samacharbharatgzp@gmail.com", CARD_WIDTH / 2, contactTextY);

  // Right: Website
  ctx.textAlign = "right";
  ctx.fillText("🌐 samacharbharat.in", CARD_WIDTH - 25, contactTextY);

  // 9. Bottom Location Bar (Navy #0B192C with 10px gap above)
  const locH = 48;
  const locY = CARD_HEIGHT - locH; // 1067px (10px gap below contact section at 1057px)
  ctx.fillStyle = "#0B192C";
  ctx.fillRect(0, locY, CARD_WIDTH, locH);

  ctx.fillStyle = "#F59E0B"; // Gold Accent
  ctx.font = "bold 19px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(`📍 ${districtName} लखनऊ उत्तर प्रदेश`, CARD_WIDTH / 2, locY + 31);
}

// ─── MASTER BACK CARD RECREATION ───────────────────────────────────────────────

// ─── MASTER BACK CARD RECREATION (NEWS GUIDELINES & POLICIES) ───────────────────

async function drawMasterBackCard(
  ctx: CanvasRenderingContext2D,
  reporter: ReporterProfile
) {
  // Pure White Background
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);

  // 1. Top Centered Logo (560px width)
  const logoImg = await loadImage(FIXED_ASSETS.logo);
  if (logoImg) {
    ctx.drawImage(logoImg, (CARD_WIDTH - 560) / 2, 8, 560, 146);
  }

  // 2. Red Banner Strip below logo
  const bannerY = 162;
  const bannerH = 52;
  ctx.fillStyle = "#991B1B";
  ctx.fillRect(0, bannerY, CARD_WIDTH, bannerH);

  ctx.fillStyle = "#F59E0B";
  ctx.fillRect(0, bannerY + bannerH, CARD_WIDTH, 4);

  ctx.fillStyle = "#FFFFFF";
  ctx.font = "bold 20px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("आधिकारिक प्रेस गाइडलाइन्स एवं नीतियां / OFFICIAL PRESS POLICIES", CARD_WIDTH / 2, bannerY + 33);

  // 3. Two-Column Guidelines Section (Balanced columns with 12px center gap)
  const colY = 232;

  // ── LEFT COLUMN: HINDI GUIDELINES ──
  const leftX = 30;
  ctx.fillStyle = "#991B1B";
  ctx.font = "bold 17px sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("समाचार भारत - न्यूज़ गाइडलाइन्स एवं नीतियां", leftX, colY);

  ctx.strokeStyle = "#991B1B";
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(leftX, colY + 7);
  ctx.lineTo(335, colY + 7);
  ctx.stroke();

  const hindiRules = [
    "1. यह पहचान पत्र केवल नामांकित पत्रकार हेतु वैध है।",
    "2. कर्तव्य के दौरान कार्ड स्पष्ट धारण करना अनिवार्य है।",
    "3. निष्पक्ष, सत्य एवं तथ्य-जांच समाचार ही कवर करें।",
    "4. कार्ड का दुरुपयोग व फर्जीवाड़ा सख्त कानूनी अपराध है।",
    "5. कार्ड खोने पर पुलिस व संस्थान को तुरंत सूचित करें।",
    "6. पत्रकारिता आचार संहिता का सदैव पालन करें।",
    "7. सेवा समाप्ति पर कार्ड अविलंब जमा कराना अनिवार्य है।",
    "8. यह कार्ड समाचार भारत डिजिटल मीडिया की संपत्ति है।",
  ];

  let lineY = colY + 36;
  ctx.fillStyle = "#0F172A";
  ctx.font = "13.5px sans-serif";
  hindiRules.forEach((rule) => {
    ctx.fillText(rule, leftX, lineY);
    lineY += 28.5;
  });

  // Vertical Center Divider Line with 12px gap on both sides
  ctx.strokeStyle = "#CBD5E1";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(346, colY - 5);
  ctx.lineTo(346, colY + 248);
  ctx.stroke();

  // ── RIGHT COLUMN: ENGLISH GUIDELINES ──
  const rightX = 358;
  ctx.fillStyle = "#991B1B";
  ctx.font = "bold 17px sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("News Guidelines & Ethics Policies", rightX, colY);

  ctx.strokeStyle = "#991B1B";
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(rightX, colY + 7);
  ctx.lineTo(670, colY + 7);
  ctx.stroke();

  const englishRules = [
    "1. Card valid strictly for authorized designated reporter.",
    "2. Must display card visibly while on official press duty.",
    "3. Report unbiased, verified & fact-checked news only.",
    "4. Forgery, duplication or misuse is strictly punishable.",
    "5. Report lost/stolen card immediately to Management.",
    "6. Adhere strictly to the Journalist Code of Ethics.",
    "7. Surrender card immediately upon duty termination.",
    "8. Property of Samachar Bharat Digital Media House.",
  ];

  lineY = colY + 36;
  ctx.fillStyle = "#0F172A";
  ctx.font = "13.5px sans-serif";
  englishRules.forEach((rule) => {
    ctx.fillText(rule, rightX, lineY);
    lineY += 28.5;
  });

  // 4. "If Found Please Return To" Return & Address Section
  const retY = 495;
  const retH = 205;
  const retW = CARD_WIDTH - 50; // 650px

  ctx.fillStyle = "#F8FAFC";
  ctx.strokeStyle = "#DC2626";
  ctx.lineWidth = 1.8;
  ctx.fillRect(25, retY, retW, retH);
  ctx.strokeRect(25, retY, retW, retH);

  ctx.fillStyle = "#DC2626";
  ctx.font = "bold 17.5px sans-serif";
  ctx.fillText("यदि यह कार्ड मिले तो कृपया वापस लौटाएं / IF FOUND PLEASE RETURN TO:", 40, retY + 30);

  ctx.strokeStyle = "#FECACA";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(40, retY + 40);
  ctx.lineTo(660, retY + 40);
  ctx.stroke();

  let addY = retY + 67;
  ctx.fillStyle = "#0F172A";
  ctx.font = "bold 15.5px sans-serif";
  ctx.fillText("🏢 समाचार भारत मीडिया हाउस / SAMACHAR BHARAT MEDIA HOUSE", 40, addY);

  addY += 27;
  ctx.fillStyle = "#334155";
  ctx.font = "15px sans-serif";
  ctx.fillText("📍 पता / Address: सिविल लाइन्स, गाज़ीपुर (उत्तर प्रदेश) - 233001", 40, addY);

  addY += 26;
  ctx.fillText("📞 हेल्प लाइन / Helpline: +91 734 771 8098  |  +91 860 134 3232", 40, addY);

  addY += 26;
  ctx.fillText("✉️ ईमेल / Email: samacharbharatgzp@gmail.com", 40, addY);

  addY += 26;
  ctx.fillText("🌐 वेबसाइट / Website: https://samacharbharat.in", 40, addY);

  // Official Stamp (Right side of Return box with clear margin)
  const stampImg = await loadImage(FIXED_ASSETS.officialStamp);
  if (stampImg) {
    ctx.globalAlpha = 0.88;
    const stampSize = 135;
    const stampY = retY + (retH - stampSize) / 2 + 5;
    ctx.drawImage(stampImg, 515, stampY, stampSize, stampSize);
    ctx.globalAlpha = 1.0;
  }

  // 5. Verification Notice Section (Properly centered & spaced)
  const verY = 720;
  ctx.fillStyle = "#1E3A5F";
  ctx.font = "bold 14.5px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("ऑनलाइन प्रेस कार्ड सत्यापन हेतु वेबसाइट पर जाएँ या QR कोड स्कैन करें:", CARD_WIDTH / 2, verY);

  ctx.fillStyle = "#DC2626";
  ctx.font = "bold 15px monospace";
  ctx.fillText(
    `https://samacharbharat.in/verify-press-id/${reporter.pressIdNumber}`,
    CARD_WIDTH / 2,
    verY + 24
  );

  // 6. Emergency Medical Information Section Box (Proper inner padding & spacing)
  const emgY = 780;
  const emgH = 130;
  ctx.fillStyle = "#FEF2F2";
  ctx.strokeStyle = "#FECACA";
  ctx.lineWidth = 1.8;
  ctx.fillRect(25, emgY, CARD_WIDTH - 50, emgH);
  ctx.strokeRect(25, emgY, CARD_WIDTH - 50, emgH);

  ctx.fillStyle = "#DC2626";
  ctx.font = "bold 17.5px sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("आपातकालीन जानकारी / EMERGENCY MEDICAL INFORMATION", 40, emgY + 30);

  const aadhaarVal = reporter.aadhaarNumber
    ? `XXXX-XXXX-${reporter.aadhaarNumber.slice(-4)}`
    : "N/A";
  ctx.fillStyle = "#1E293B";
  ctx.font = "bold 16px sans-serif";
  ctx.fillText(`रक्त समूह / Blood: ${reporter.bloodGroup || "O+"}   |   आधार / Aadhaar: ${aadhaarVal}`, 40, emgY + 66);

  const contactName = reporter.emergencyContact?.name || reporter.fatherName;
  const contactPhone = reporter.emergencyContact?.phone || reporter.mobile;
  ctx.font = "15.5px sans-serif";
  ctx.fillText(`आपातकालीन संपर्क / Emergency Contact: ${contactName} (${contactPhone})`, 40, emgY + 98);

  // 7. Bottom Location Bar (Slightly offset from bottom corner rounded clip)
  const locH = 54;
  const locY = CARD_HEIGHT - locH - 12; // 1049px
  drawCustomCornerRect(ctx, 0, locY, CARD_WIDTH, locH, 0, 0, 16, 16, "#0B192C");

  ctx.fillStyle = "#F59E0B"; // Gold Accent
  ctx.font = "bold 21px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(
    `📍 ${reporter.address?.district || "Ghazipur"} लखनऊ उत्तर प्रदेश`,
    CARD_WIDTH / 2,
    locY + 35
  );
}

// ─── HELPER FUNCTIONS ──────────────────────────────────────────────────────────

function drawInfoLine(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  icon: string,
  label: string,
  val: string,
  fontSize: number = 19
) {
  ctx.textAlign = "left";

  // Draw Icon
  ctx.font = `${fontSize + 2}px sans-serif`;
  ctx.fillText(icon, x, y);

  // Draw Red Label (scales with fontSize)
  ctx.fillStyle = "#DC2626"; // Bright Red
  ctx.font = `bold ${fontSize}px sans-serif`;
  ctx.fillText(` ${label} :`, x + 28, y);

  // Draw Black Value (scales with fontSize)
  const labelWidth = ctx.measureText(` ${label} :`).width;
  ctx.fillStyle = "#0F172A"; // Dark Black
  ctx.font = `bold ${fontSize}px sans-serif`;
  ctx.fillText(` ${val}`, x + 28 + labelWidth, y);
}

function drawVerticalText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  font: string,
  color: string
) {
  ctx.save();
  ctx.font = font;
  ctx.fillStyle = color;
  ctx.textAlign = "center";

  const letters = text.split("  ");
  let curY = y - (letters.length * 34) / 2 + 10;
  letters.forEach((letter) => {
    ctx.fillText(letter, x, curY);
    curY += 38;
  });
  ctx.restore();
}

function drawCustomCornerRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  tl: number,
  tr: number,
  br: number,
  bl: number,
  fillColor: string
) {
  ctx.fillStyle = fillColor;
  ctx.beginPath();
  ctx.moveTo(x + tl, y);
  ctx.lineTo(x + w - tr, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + tr);
  ctx.lineTo(x + w, y + h - br);
  ctx.quadraticCurveTo(x + w, y + h, x + w - br, y + h);
  ctx.lineTo(x + bl, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - bl);
  ctx.lineTo(x, y + tl);
  ctx.quadraticCurveTo(x, y, x + tl, y);
  ctx.closePath();
  ctx.fill();
}

function drawRoundedRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawRoundedTopRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  fillColor: string
) {
  ctx.fillStyle = fillColor;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h);
  ctx.lineTo(x, y + h);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  ctx.fill();
}

function drawPillBox(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  bgColor: string,
  borderColor: string
) {
  const r = h / 2;
  ctx.fillStyle = bgColor;
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 1.8;
  drawRoundedRectPath(ctx, x, y, w, h, r);
  ctx.fill();
  ctx.stroke();
}

function drawPhotoFallback(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  name: string
) {
  ctx.fillStyle = "#CBD5E1";
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = "#475569";
  ctx.font = "bold 64px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(name.charAt(0).toUpperCase(), x + w / 2, y + h / 2 + 20);
}

function formatDateDDMMYYYY(dateString: string): string {
  if (!dateString) return "23/07/2027";
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return dateString;
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}
