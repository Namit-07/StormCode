import { NextRequest, NextResponse } from "next/server";
import type { ExplainResponse } from "@/lib/types";
import { generateExplanation } from "@/lib/openai";

export const maxDuration = 60; // seconds – needed for Groq round-trips

export async function POST(req: NextRequest): Promise<NextResponse<ExplainResponse>> {
  try {
    const body = await req.json();
    const { repo, files, dependencyGraph } = body;

    if (!repo || !files || !dependencyGraph) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: repo, files, dependencyGraph" },
        { status: 400 }
      );
    }

    const explanation = await generateExplanation(repo, files, dependencyGraph);

    return NextResponse.json({ success: true, data: explanation });
  } catch (err: unknown) {
    console.error("Explain API error:", err);
    const message = err instanceof Error ? err.message : "Explanation generation failed";

    if (message.includes("GROQ_API_KEY")) {
      return NextResponse.json(
        { success: false, error: "Groq API key not configured. Add GROQ_API_KEY to .env.local" },
        { status: 500 }
      );
    }

    if (message.includes("429") || message.includes("quota") || message.includes("Too Many Requests") || message.includes("rate_limit")) {
      return NextResponse.json(
        { success: false, error: "Groq API rate limit hit. Please wait a minute and try again." },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
