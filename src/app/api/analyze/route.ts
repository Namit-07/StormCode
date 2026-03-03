import { NextRequest, NextResponse } from "next/server";
import type { AnalyzeResponse, AnalysisResult } from "@/lib/types";
import {
  parseGitHubUrl,
  fetchRepoInfo,
  fetchFileTree,
  fetchFileContents,
} from "@/lib/github";
import {
  generateDependencyGraph,
  generateFlowDiagrams,
} from "@/lib/analyzer";

export async function POST(req: NextRequest): Promise<NextResponse<AnalyzeResponse>> {
  try {
    const body = await req.json();
    const { repoUrl } = body;

    if (!repoUrl || typeof repoUrl !== "string") {
      return NextResponse.json(
        { success: false, error: "Missing or invalid repoUrl" },
        { status: 400 }
      );
    }

    // 1. Parse the GitHub URL
    const parsed = parseGitHubUrl(repoUrl);
    if (!parsed) {
      return NextResponse.json(
        { success: false, error: "Invalid GitHub URL. Use format: https://github.com/owner/repo" },
        { status: 400 }
      );
    }

    // 2. Fetch repo metadata
    const repo = await fetchRepoInfo(parsed.owner, parsed.name);

    // 3. Fetch file tree
    const { tree, files } = await fetchFileTree(parsed.owner, parsed.name, repo.defaultBranch);

    // 4. Fetch code file contents
    const filesWithContent = await fetchFileContents(parsed.owner, parsed.name, files);

    // 5. Build dependency graph
    const dependencyGraph = generateDependencyGraph(filesWithContent);

    // 6. Generate flow diagrams
    const flowDiagrams = generateFlowDiagrams(filesWithContent, repo);

    const result: AnalysisResult = {
      repo,
      fileTree: tree,
      files: filesWithContent,
      dependencyGraph,
      flowDiagrams,
      explanation: null,
      onboardingGuide: null,
    };

    return NextResponse.json({ success: true, data: result });
  } catch (err: unknown) {
    console.error("Analyze API error:", err);
    const message = err instanceof Error ? err.message : "Analysis failed";

    // GitHub API specific errors
    if (message.includes("Not Found")) {
      return NextResponse.json(
        { success: false, error: "Repository not found. Check the URL and make sure it's a public repo." },
        { status: 404 }
      );
    }
    if (message.includes("rate limit")) {
      return NextResponse.json(
        { success: false, error: "GitHub API rate limit exceeded. Add a GITHUB_TOKEN to .env.local for higher limits." },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
