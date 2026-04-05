import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getPostById } from "@/lib/posts";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: Request) {
    try {
        const { postId } = await req.json();

        const post = await getPostById(postId);
        if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 });

        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

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

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Clean markdown if any
        const cleaned = text.replace(/```json|```/g, "").trim();
        const json = JSON.parse(cleaned);

        return NextResponse.json(json);
    } catch (error: any) {
        console.error("Web Story Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
