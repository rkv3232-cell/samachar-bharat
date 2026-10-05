import { NextResponse } from "next/server";
import { getPostById } from "@/lib/posts";
import { executeAITask, extractStructuredJSON } from "@/lib/ai";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { postId, article, post: directPost } = body;

    let post = article || directPost;
    if (!post && postId) {
      post = await getPostById(postId);
    }

    if (!post || !post.title) {
      return NextResponse.json(
        { error: "Missing valid post data or postId parameter." },
        { status: 400 }
      );
    }

    const prompt = `You are a visual journalism editor for 'Samachar Bharat'. Analyze this news article and create an AMP Web Story JSON.

Article Title: ${post.title}
Article Content: ${post.content.substring(0, 2000)}
Image URL: ${post.image || ""}

Output JSON structure:
{
  "storyTitle": "${post.title.substring(0, 60)}",
  "publisher": "Samachar Bharat",
  "pages": [
    {
      "text": "Punchy slide 1 summary in Hindi (max 80 chars)",
      "image": "${post.image || ""}"
    },
    {
      "text": "Key highlight slide 2 in Hindi",
      "image": "${post.image || ""}"
    },
    {
      "text": "Details slide 3 in Hindi",
      "image": "${post.image || ""}"
    },
    {
      "text": "Conclusion slide 4 in Hindi",
      "image": "${post.image || ""}"
    }
  ]
}

Return ONLY the JSON.`;

    const aiResponse = await executeAITask({
      task: "web-story",
      prompt,
      systemPrompt: "You are a professional web story visual editor. Output valid JSON only.",
      jsonOutput: true,
      temperature: 0.3,
      timeoutMs: 10000,
    });

    const parsedJson = aiResponse.json || extractStructuredJSON(aiResponse.text);

    if (parsedJson && parsedJson.pages && Array.isArray(parsedJson.pages)) {
      return NextResponse.json({
        ...parsedJson,
        provider: aiResponse.provider,
        model: aiResponse.model,
      });
    }

    // Graceful fallback story structure from post data
    return NextResponse.json({
      storyTitle: post.title.substring(0, 60),
      publisher: "Samachar Bharat",
      pages: [
        { text: post.title, image: post.image || "" },
        { text: "ताज़ा अपडेट के लिए समाचार भारत पर पूरी खबर पढ़ें।", image: post.image || "" },
      ],
      provider: aiResponse.provider,
      fallback: true,
    });
  } catch (error: any) {
    console.error("Web Story API Route Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate Web Story." },
      { status: 500 }
    );
  }
}
