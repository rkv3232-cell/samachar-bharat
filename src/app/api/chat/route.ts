import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export async function POST(req: Request) {
    try {
        const { message, history } = await req.json();

        // ─────────────────────────────────────────────────────────
        // 1. Fetch News Context for AI
        // ─────────────────────────────────────────────────────────
        let newsContext = "";
        try {
            const postsSnapshot = await adminDb.collection('posts')
                .where('status', '==', 'published')
                .orderBy('createdAt', 'desc')
                .limit(20) // Reduced limit for speed
                .get();

            let formattedNews = "";
            postsSnapshot.docs.slice(0, 10).forEach(doc => {
                formattedNews += `- ${doc.data().title}\n`;
            });
            newsContext = `ताज़ा ख़बरें:\n${formattedNews}\n\n`;
        } catch (dbError) {
            console.error("Firestore context error:", dbError);
        }

        const SYSTEM_PROMPT = `आप 'Samachar Bharat' के आधिकारिक AI असिस्टेंट हैं। 
        नियम:
        1. केवल हिंदी में जवाब दें।
        2. अपनी पहचान केवल 'Samachar Bharat AI' बताएं।
        3. सीधा जवाब दें (Direct Answer)। कोई 'Plan', 'Thinking' या 'Correction' न लिखें।
        4. न्यूज़ और ताज़ा घटनाओं पर केंद्रित रहें।`;

        // ─────────────────────────────────────────────────────────
        // 2. Determine AI Provider (Groq or Local LM Studio)
        // ─────────────────────────────────────────────────────────
        const groqKey = process.env.GROQ_API_KEY;
        const useLocal = process.env.USE_LOCAL_AI === "true";
        const isGroq = !!groqKey && !useLocal;

        const apiTarget = isGroq
            ? "https://api.groq.com/openai/v1/chat/completions"
            : (process.env.LOCAL_AI_BASE_URL || "http://localhost:1234/v1") + "/chat/completions";

        const modelName = isGroq ? "llama-3.3-70b-versatile" : "local-model";

        const headers: Record<string, string> = {
            "Content-Type": "application/json",
        };
        if (isGroq) headers["Authorization"] = `Bearer ${groqKey}`;

        const formattedHistory = (history || []).map((h: any) => ({
            role: h.role === "model" ? "assistant" : "user",
            content: typeof h.parts === 'string' ? h.parts : h.parts[0]?.text || ""
        }));

        console.log(`Using AI Provider: ${isGroq ? 'Groq Cloud' : 'Local LM Studio'}`);

        const response = await fetch(apiTarget, {
            method: "POST",
            headers,
            body: JSON.stringify({
                model: modelName,
                messages: [
                    { role: "system", content: `${SYSTEM_PROMPT}\n\n${newsContext}` },
                    ...formattedHistory,
                    { role: "user", content: message }
                ],
                temperature: 0.7,
                stream: true,
            }),
        });

        if (!response.ok) {
            return NextResponse.json({ error: "Local AI Server Offline" }, { status: 500 });
        }

        // Forward the stream to the client
        return new Response(response.body, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
            },
        });

    } catch (error: any) {
        console.error("Chat API Error:", error);
        return NextResponse.json({ error: "Server connection failed" }, { status: 500 });
    }
}
