// src/app/api/dpivs/upload/route.ts
/**
 * DPIVS Dedicated Cloudinary Direct Media Upload API
 *
 * Handles direct file uploads for Reporter Photo, Signature, and Official Stamp.
 * Uploads directly to Cloudinary and returns secure URL.
 */

import { type NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "samacharbharat",
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const subfolder = (formData.get("folder") as string) || "reporters";

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file provided for upload" },
        { status: 400 }
      );
    }

    // Validate file type
    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid file type. Only JPEG, PNG, and WEBP images are supported.",
        },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    const MAX_SIZE_BYTES = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json(
        { success: false, error: "File size exceeds maximum limit of 5MB." },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // If Cloudinary credentials are missing in env, fallback to Base64 Data URL
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY) {
      console.warn(
        "[DPIVS Upload] Cloudinary env vars missing. Using Data URL fallback."
      );
      const base64Data = `data:${file.type};base64,${buffer.toString("base64")}`;
      return NextResponse.json({
        success: true,
        url: base64Data,
        public_id: `fallback_${Date.now()}`,
      });
    }

    // Upload to Cloudinary
    const result: any = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: `dpivs/${subfolder}`,
          resource_type: "image",
          transformation: [
            { width: 1200, height: 1200, crop: "limit" },
            { quality: "auto", fetch_format: "auto" },
          ],
        },
        (error, res) => {
          if (error) reject(error);
          else resolve(res);
        }
      );
      stream.end(buffer);
    });

    return NextResponse.json({
      success: true,
      url: result.secure_url,
      public_id: result.public_id,
    });
  } catch (error: any) {
    console.error("[DPIVS Media Upload Error]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Upload failed." },
      { status: 500 }
    );
  }
}
