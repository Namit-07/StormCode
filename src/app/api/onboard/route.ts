import { NextRequest, NextResponse } from "next/server";
import type { OnboardResponse } from "@/lib/types";
import { generateOnboardingGuide } from "@/lib/openai";

export const maxDuration = 60;

export async function POST(req: NextRequest): Promise<NextResponse<OnboardResponse>> {
  try {
    const body = await req.json();
    const { repo, files, dependencyGraph, explanation } = body;

    if (!repo || !files || !dependencyGraph) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: repo, files, dependencyGraph" },
        { status: 400 }
      );
    }

    const guide = await generateOnboardingGuide(repo, files, dependencyGraph, explanation ?? null);

    return NextResponse.json({ success: true, data: guide });
  } catch (err: unknown) {
    console.error("Onboard API error:", err);
    const message = err instanceof Error ? err.message : "Onboarding guide generation failed";

    if (message.includes("GROQ_API_KEY")) {
      return NextResponse.json(
        { success: false, error: "Groq API key not configured. Add GROQ_API_KEY to .env.local" },
        { status: 500 }
      );
    }

    if (message.includes("429") || message.includes("quota") || message.includes("rate_limit")) {
      return NextResponse.json(
        { success: false, error: "Groq API rate limit hit. Please wait a minute and try again." },
        { status: 429 }
      );
    }

    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
