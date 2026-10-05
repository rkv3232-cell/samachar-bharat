import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { executeAITask, streamAITask, AIMessage } from "@/lib/ai";

export const dynamic = "force-dynamic";

// In-memory cache for news context to eliminate 800ms Firestore delay on every message
let cachedNewsContext = "";
let lastNewsContextFetch = 0;
const NEWS_CONTEXT_TTL_MS = 2 * 60 * 1000; // 2 minutes

async function getCachedNewsContext(): Promise<string> {
  const now = Date.now();
  if (cachedNewsContext && now - lastNewsContextFetch < NEWS_CONTEXT_TTL_MS) {
    return cachedNewsContext;
  }

  try {
    if (adminDb) {
      const postsPromise = adminDb
        .collection("posts")
        .where("status", "==", "published")
        .orderBy("createdAt", "desc")
        .limit(8)
        .get();

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Firestore context timeout")), 500)
      );

      const postsSnapshot = await Promise.race([postsPromise, timeoutPromise]);
      let formattedNews = "";
      postsSnapshot.docs.forEach((doc: any) => {
        const title = doc.data().title;
        if (title) formattedNews += `- ${title}\n`;
      });

      if (formattedNews) {
        cachedNewsContext = `ताज़ा ख़बरें:\n${formattedNews}\n\n`;
        lastNewsContextFetch = now;
      }
    }
  } catch {
    // Non-blocking, keep previous cache if available
  }

  return cachedNewsContext;
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { message, history, stream: shouldStream = true } = body;

    if (!message || typeof message !== "string" || !message.trim()) {
      return NextResponse.json({ error: "संदेश खाली नहीं हो सकता।" }, { status: 400 });
    }

    // 1. Fetch News Context (instant from memory cache)
    const newsContext = await getCachedNewsContext();

    const SYSTEM_PROMPT = `आप 'Samachar Bharat' के आधिकारिक AI असिस्टेंट हैं।
नियम:
1. केवल हिंदी में जवाब दें।
2. अपनी पहचान केवल 'Samachar Bharat AI' बताएं।
3. सीधा और सटीक जवाब दें (Direct Answer)। कोई 'Plan', 'Thinking' या 'Correction' न लिखें।
4. न्यूज़ और ताज़ा घटनाओं पर केंद्रित रहें।
${newsContext ? `\nउपलब्ध ताज़ा समाचार संदर्भ:\n${newsContext}` : ""}`;

    const formattedHistory: AIMessage[] = (history || []).map((h: any) => ({
      role: h.role === "model" || h.role === "assistant" ? "assistant" : "user",
      content: typeof h.parts === "string" ? h.parts : h.parts?.[0]?.text || h.content || "",
    }));

    const messages: AIMessage[] = [
      ...formattedHistory,
      { role: "user", content: message },
    ];

    // Check if client accepts SSE or requested streaming
    const acceptHeader = req.headers.get("accept") || "";
    const isSSE = shouldStream || acceptHeader.includes("text/event-stream");

    if (isSSE) {
      // 2. TRUE SSE STREAMING: First token delivered immediately to eliminate 20s delay
      const stream = streamAITask({
        task: "chat",
        systemPrompt: SYSTEM_PROMPT,
        messages,
        prompt: message,
        temperature: 0.7,
        maxTokens: 1000,
        timeoutMs: 12000,
      });

      return new Response(stream, {
        headers: {
          "Content-Type": "text/event-stream; charset=utf-8",
          "Cache-Control": "no-cache, no-transform",
          "Connection": "keep-alive",
          "X-Accel-Buffering": "no",
        },
      });
    }

    // 3. NON-STREAMING JSON FALLBACK
    try {
      const aiResponse = await executeAITask({
        task: "chat",
        systemPrompt: SYSTEM_PROMPT,
        messages,
        prompt: message,
        temperature: 0.7,
        maxTokens: 1000,
        timeoutMs: 12000,
      });

      const reply = aiResponse.text || "माफ़ कीजिए, उत्तर प्राप्त नहीं हो सका।";

      return NextResponse.json({
        text: reply,
        reply,
        provider: aiResponse.provider,
        model: aiResponse.model,
        latencyMs: aiResponse.latencyMs,
        fallbackUsed: aiResponse.fallbackUsed,
      });
    } catch (aiErr: any) {
      console.warn("[Chat API] All providers failed:", aiErr.message);

      return NextResponse.json({
        text: "नमस्ते! मैं समाचार भारत AI हूँ। सेवा वर्तमान में व्यस्त है, कृपया कुछ ही क्षणों में पुनः प्रयास करें।",
        reply: "नमस्ते! मैं समाचार भारत AI हूँ। सेवा वर्तमान में व्यस्त है, कृपया कुछ ही क्षणों में पुनः प्रयास करें।",
        fallback: true,
      });
    }
  } catch (error: any) {
    console.error("Chat API Route Error:", error);
    return NextResponse.json({ error: "Server connection failed" }, { status: 500 });
  }
}
