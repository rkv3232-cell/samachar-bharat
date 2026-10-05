import { NextResponse } from "next/server";
import { addPost } from "@/lib/posts";
import { executeAITask, extractStructuredJSON } from "@/lib/ai";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { message, mediaUrl, secret } = await req.json();

    // 1. Basic Security Check
    const ingestSecret = process.env.WHATSAPP_INGEST_SECRET || "sb_default_secret_99";
    if (secret !== ingestSecret) {
      return NextResponse.json({ error: "Unauthorized access." }, { status: 401 });
    }

    if (!message || typeof message !== "string" || !message.trim()) {
      return NextResponse.json({ error: "Missing message content." }, { status: 400 });
    }

    const prompt = `तुम एक डिजिटल न्यूज़ ऑटोमेशन सिस्टम हो। नीचे दिए गए कच्चे संदेश (Raw Message) को एक प्रामाणिक न्यूज़ आर्टिकल में बदलो।

कच्चा संदेश: "${message}"

अनिवार्य JSON प्रारूप:
{
  "title": "एक आकर्षक और सटीक हिंदी सुर्खी",
  "content": "<h2>मुख्य घटनाक्रम</h2><p>पूरी खबर विस्तार से...</p><h3>अहम बिंदु</h3><ul><li>पहला बिंदु</li><li>दूसरा बिंदु</li></ul>",
  "category": "uttar-pradesh",
  "tags": ["टैग 1", "टैग 2", "टैग 3", "टैग 4"],
  "slug": "delhi-accident-news-update"
}

श्रेणी विकल्प: uttar-pradesh | desh | videsh | karobar | crime | dharm | rajniti | lifestyle | sports | entertainment | technology
केवल वैध JSON लौटाएं।`;

    const aiResponse = await executeAITask({
      task: "whatsapp-ingest",
      prompt,
      systemPrompt: "You are a professional News Data Extractor. Output valid JSON only.",
      jsonOutput: true,
      temperature: 0.2,
      timeoutMs: 12000,
    });

    const aiJson = aiResponse.json || extractStructuredJSON(aiResponse.text);

    if (!aiJson || !aiJson.title) {
      throw new Error("Failed to parse AI output into structured news format.");
    }

    // Save to Firestore (prefer adminDb on server, fallback to addPost)
    const postData = {
      title: aiJson.title,
      content: aiJson.content || `<p>${message}</p>`,
      image: mediaUrl || "",
      category: aiJson.category || "uttar-pradesh",
      tags: Array.isArray(aiJson.tags) ? aiJson.tags : [],
      slug: aiJson.slug || `news-${Date.now()}`,
      status: "published",
      isFeatured: false,
      views: 0,
      likes: 0,
    };

    let postId = `post-${Date.now()}`;
    try {
      const { adminDb } = await import("@/lib/firebase-admin");
      if (adminDb && typeof adminDb.collection === "function") {
        const docRef = await adminDb.collection("posts").add({
          ...postData,
          createdAt: new Date(),
        });
        postId = docRef.id;
      } else {
        postId = await addPost(postData as any);
      }
    } catch (dbErr: any) {
      console.warn("Server adminDb save failed, falling back to client addPost:", dbErr?.message);
      try {
        postId = await addPost(postData as any);
      } catch (clientDbErr: any) {
        console.warn("Client addPost also unavailable without auth session:", clientDbErr?.message);
      }
    }

    return NextResponse.json({
      success: true,
      postId,
      title: aiJson.title,
      article: postData,
      provider: aiResponse.provider,
      model: aiResponse.model,
      fallbackUsed: aiResponse.fallbackUsed,
    });
  } catch (error: any) {
    console.error("WhatsApp Ingest Route Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process incoming news." },
      { status: 500 }
    );
  }
}
