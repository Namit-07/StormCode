import { GoogleGenerativeAI } from "@google/generative-ai";
import type { RepoInfo, RepoFile, DependencyGraph, Explanation } from "./types";

// ── Gemini Client ───────────────────────────────────────────────

function getClient(): GoogleGenerativeAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set. Add it to your .env.local file.");
  }
  return new GoogleGenerativeAI(apiKey);
}

// ── Build Context from Repo ────────────────────────────────────

function buildRepoContext(
  repo: RepoInfo,
  files: RepoFile[],
  depGraph: DependencyGraph
): string {
  const fileList = files
    .map((f) => `  ${f.path} (${f.language ?? "unknown"}, ${f.size}B)`)
    .join("\n");

  const codeFiles = files
    .filter((f) => f.content)
    .slice(0, 30); // Limit to keep within context window

  const codeSnippets = codeFiles
    .map((f) => {
      const preview = f.content!.slice(0, 1500);
      return `--- ${f.path} ---\n${preview}${f.content!.length > 1500 ? "\n... (truncated)" : ""}`;
    })
    .join("\n\n");

  const depSummary = depGraph.nodes.length > 0
    ? `Dependency Graph: ${depGraph.nodes.length} modules, ${depGraph.edges.length} connections.
Top connected files: ${Array.from(
        depGraph.edges
          .reduce((acc, e) => {
            acc.set(e.source, (acc.get(e.source) ?? 0) + 1);
            return acc;
          }, new Map<string, number>())
          .entries()
      )
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([path, count]) => `${path} (${count} deps)`)
        .join(", ")}`
    : "No internal dependency connections found.";

  return `
REPOSITORY: ${repo.owner}/${repo.name}
DESCRIPTION: ${repo.description || "No description"}
PRIMARY LANGUAGE: ${repo.language}
STARS: ${repo.stars}

FILE STRUCTURE (${files.length} files):
${fileList}

${depSummary}

CODE SAMPLES:
${codeSnippets}
`.trim();
}

// ── Generate Explanation ────────────────────────────────────────

export async function generateExplanation(
  repo: RepoInfo,
  files: RepoFile[],
  depGraph: DependencyGraph
): Promise<Explanation> {
  const client = getClient();
  const context = buildRepoContext(repo, files, depGraph);

  const model = client.getGenerativeModel({
    model: "gemini-2.0-flash",
    generationConfig: {
      temperature: 0.4,
      maxOutputTokens: 4096,
      responseMimeType: "application/json",
    },
  });

  const systemPrompt = `You are StormCode, an expert code educator who explains repositories to beginners.
You analyze codebases and produce structured explanations in JSON format.

ALWAYS respond with valid JSON matching this exact schema:
{
  "summary": "2-3 sentence overview of what this project does",
  "architecture": "Detailed paragraph explaining the architecture, how different parts connect, and the design patterns used. Use simple language.",
  "techStack": [
    {
      "name": "Technology Name",
      "category": "framework|language|database|tool|library|service",
      "purpose": "What it's used for in this project"
    }
  ],
  "keyFiles": [
    {
      "path": "path/to/file.ts",
      "purpose": "What this file does (1 sentence)",
      "simpleExplanation": "ELI5 explanation of what this file does, using simple analogies"
    }
  ],
  "howItWorks": "Step-by-step explanation of how the application works, from start to finish. Number each step. Use simple language a 10-year-old could understand.",
  "beginnerAnalogy": "A creative real-world analogy that explains the entire project. Compare the codebase to something in everyday life (like a restaurant, factory, library, etc.) and map each major part to something in that analogy."
}

Guidelines:
- Explain like the reader has never coded before
- Use everyday analogies and metaphors
- Identify ALL technologies in the tech stack
- Pick the 5-8 most important files for keyFiles
- The beginnerAnalogy should be vivid, fun, and accurate
- The howItWorks should be a numbered walkthrough
- Be specific to THIS codebase, not generic`;

  const result = await model.generateContent({
    contents: [
      { role: "user", parts: [{ text: `${systemPrompt}\n\nAnalyze this repository and generate a beginner-friendly explanation:\n\n${context}` }] },
    ],
  });

  const content = result.response.text();
  if (!content) {
    throw new Error("Empty response from Gemini");
  }

  try {
    const parsed = JSON.parse(content) as Explanation;
    return parsed;
  } catch {
    throw new Error("Failed to parse AI response as JSON");
  }
}

// ── Generate Explanation for a Single File ──────────────────────

export async function explainFile(
  filePath: string,
  content: string,
  repo: RepoInfo
): Promise<string> {
  const client = getClient();

  const model = client.getGenerativeModel({
    model: "gemini-2.0-flash",
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 2048,
    },
  });

  const prompt = `You are StormCode, a friendly code explainer. Explain code files in simple terms.
Use the "Explain Like I'm 5" approach:
- Start with what the file DOES in one simple sentence
- Break down the code section by section
- Use analogies for complex concepts
- Highlight important parts
- Use markdown formatting with headers and bullet points
- Keep paragraphs short (2-3 sentences max)

Explain this file from the ${repo.owner}/${repo.name} repository:

File: ${filePath}

\`\`\`
${content.slice(0, 4000)}
\`\`\`
${content.length > 4000 ? "\n(File truncated for brevity)" : ""}`;

  const result = await model.generateContent(prompt);
  return result.response.text() || "Could not generate explanation.";
}
