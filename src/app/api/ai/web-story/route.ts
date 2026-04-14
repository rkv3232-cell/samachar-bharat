import { NextResponse } from "next/server";
import { getPostById } from "@/lib/posts";

export async function POST(req: Request) {
    try {
        const { postId } = await req.json();

        const post = await getPostById(postId);
        if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 });

        const prompt = `
            You are a professional news strategist. Analyze this news article and create an AMP Web Story (JSON format).
            
            Title: ${post.title}
            Content: ${post.content}
            
            Return a JSON object with:
            1. storyTitle: A catchy short title (max 50 chars)
            2. publisher: "NewsPortal"
            3. pages: Array of 5-7 pages. Each page has:
               - text: Short, punchy text (max 100 chars)
               - image: Use "${post.image}" for all pages.
            
            Return ONLY the JSON.
        `;

        const apiTarget = process.env.LOCAL_AI_BASE_URL || "http://localhost:1234/v1";

        const response = await fetch(`${apiTarget}/chat/completions`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                model: "gemma",
                messages: [
                    { role: "system", content: "You are a web story strategist." },
                    { role: "user", content: prompt }
                ],
                temperature: 0.5,
            }),
        });

        if (!response.ok) {
            throw new Error(`Gemma Error: ${await response.text()}`);
        }

        const data = await response.json();
        const text = data.choices[0].message.content;

        // Clean markdown if any
        const cleaned = text.replace(/```json|```/g, "").trim();
        const json = JSON.parse(cleaned);

        return NextResponse.json(json);
    } catch (error: any) {
        console.error("Web Story Error:", error);
        return NextResponse.json({ error: "AI Story Generator (Gemma) offline. Please start LM Studio Server." }, { status: 500 });
    }
}
