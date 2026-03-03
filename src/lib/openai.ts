import Groq from "groq-sdk";
import type { RepoInfo, RepoFile, DependencyGraph, Explanation, OnboardingGuide } from "./types";

// ── Groq Client ─────────────────────────────────────────────────

function getClient(): Groq {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY is not set. Add it to your .env.local file.");
  }
  return new Groq({ apiKey });
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
    .slice(0, 15); // Limit to keep within context window

  const codeSnippets = codeFiles
    .map((f) => {
      const preview = f.content!.slice(0, 800);
      return `--- ${f.path} ---\n${preview}${f.content!.length > 800 ? "\n... (truncated)" : ""}`;
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

  const models = (process.env.GROQ_MODEL || "llama-3.3-70b-versatile,llama-3.1-8b-instant").split(",").map(m => m.trim());

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
- Be specific to THIS codebase, not generic
- Respond ONLY with the JSON object, no markdown fences or extra text`;

  let lastError: Error | null = null;
  for (const modelName of models) {
    try {
      const completion = await client.chat.completions.create({
        model: modelName,
        messages: [
          {
            role: "user",
            content: `${systemPrompt}\n\nAnalyze this repository and generate a beginner-friendly explanation:\n\n${context}`,
          },
        ],
        response_format: { type: "json_object" },
        temperature: 0.4,
        max_tokens: 4096,
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        throw new Error("Empty response from Groq");
      }

      try {
        const parsed = JSON.parse(content) as Explanation;
        return parsed;
      } catch {
        throw new Error("Failed to parse AI response as JSON");
      }
    } catch (err: unknown) {
      lastError = err instanceof Error ? err : new Error(String(err));
      const msg = lastError.message;
      if (msg.includes("429") || msg.includes("quota") || msg.includes("Too Many Requests") || msg.includes("rate_limit")) {
        console.warn(`Groq model ${modelName} rate limited, trying next model...`);
        continue;
      }
      if (msg.includes("404") || msg.includes("not found") || msg.includes("model_not_found")) {
        console.warn(`Groq model ${modelName} not available, trying next...`);
        continue;
      }
      throw lastError;
    }
  }
  throw new Error(`Groq API quota exceeded on all models. Please wait a minute or get a new API key at https://console.groq.com/keys`);
}

// ── Generate Explanation for a Single File ──────────────────────

export async function explainFile(
  filePath: string,
  content: string,
  repo: RepoInfo
): Promise<string> {
  const client = getClient();

  const modelName = process.env.GROQ_MODEL?.split(",")[0] || "llama-3.3-70b-versatile";

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

  const completion = await client.chat.completions.create({
    model: modelName,
    messages: [{ role: "user", content: prompt }],
    temperature: 0.3,
    max_tokens: 2048,
  });

  return completion.choices[0]?.message?.content || "Could not generate explanation.";
}

// ── Generate Onboarding Guide ───────────────────────────────────

export async function generateOnboardingGuide(
  repo: RepoInfo,
  files: RepoFile[],
  depGraph: DependencyGraph,
  explanation: Explanation | null
): Promise<OnboardingGuide> {
  const client = getClient();
  const context = buildRepoContext(repo, files, depGraph);
  const summaryContext = explanation
    ? `\nProject Summary: ${explanation.summary}\nArchitecture: ${explanation.architecture}`
    : "";

  const models = (process.env.GROQ_MODEL || "llama-3.3-70b-versatile,llama-3.1-8b-instant").split(",").map(m => m.trim());

  const systemPrompt = `You are StormCode, an expert developer advocate who writes onboarding guides for open-source contributors.
Analyze the repository and generate a practical "How to Contribute" guide for new developers.

ALWAYS respond with valid JSON matching this exact schema:
{
  "welcomeMessage": "A warm 2-3 sentence welcome message for new contributors specifically mentioning the project name and its purpose",
  "prerequisites": ["list of tools/knowledge required before starting, e.g. 'Node.js 18+', 'Basic TypeScript knowledge'"],
  "setupSteps": [
    {
      "title": "Step title",
      "description": "What this step does and why",
      "commands": ["command1", "command2"],
      "files": ["relevant/config/file.json"],
      "tip": "Optional pro tip for this step"
    }
  ],
  "firstContribution": [
    {
      "title": "Task title",
      "description": "Description of a good first task a new contributor could tackle",
      "files": ["files/they/would/touch.ts"],
      "tip": "Helpful tip for completing this task"
    }
  ],
  "codeConventions": ["list of code style and convention rules inferred from the codebase"],
  "architectureNotes": "A paragraph explaining what a new contributor must understand about the architecture before touching the code",
  "goodFirstIssues": ["list of 3-5 concrete small improvements or features that a new contributor could implement"]
}

Guidelines:
- Be specific to THIS codebase, not generic
- Infer setup commands from package.json, Makefile, README, etc.
- Identify real config files that need to be edited (like .env)
- Make goodFirstIssues concrete and actionable
- codeConventions should reflect actual patterns seen in the code
- Respond ONLY with the JSON object, no markdown fences or extra text`;

  let lastError: Error | null = null;
  for (const modelName of models) {
    try {
      const completion = await client.chat.completions.create({
        model: modelName,
        messages: [
          {
            role: "user",
            content: `${systemPrompt}\n\nGenerate an onboarding guide for new contributors to this repository:\n\n${context}${summaryContext}`,
          },
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
        max_tokens: 4096,
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) throw new Error("Empty response from Groq");

      try {
        return JSON.parse(content) as OnboardingGuide;
      } catch {
        throw new Error("Failed to parse onboarding guide as JSON");
      }
    } catch (err: unknown) {
      lastError = err instanceof Error ? err : new Error(String(err));
      const msg = lastError.message;
      if (msg.includes("429") || msg.includes("quota") || msg.includes("Too Many Requests") || msg.includes("rate_limit")) {
        console.warn(`Groq model ${modelName} rate limited, trying next...`);
        continue;
      }
      if (msg.includes("404") || msg.includes("not found") || msg.includes("model_not_found")) {
        console.warn(`Groq model ${modelName} not available, trying next...`);
        continue;
      }
      throw lastError;
    }
  }
  throw new Error("Groq API quota exceeded on all models.");
}


