import { Octokit } from "@octokit/rest";
import type { RepoInfo, RepoFile, FileTreeNode } from "./types";

// ── Helpers ──────────────────────────────────────────────────────

/** Parse "owner/repo" from a GitHub URL */
export function parseGitHubUrl(url: string): { owner: string; name: string } | null {
  // Match https://github.com/owner/repo, git@github.com:owner/repo, or owner/repo
  const patterns = [
    /github\.com\/([^/\s]+)\/([^/\s#?.]+)/,
    /^([^/\s]+)\/([^/\s]+)$/,
  ];

  for (const pattern of patterns) {
    const match = url.trim().replace(/\.git$/, "").match(pattern);
    if (match) {
      return { owner: match[1], name: match[2] };
    }
  }
  return null;
}

/** Determine language from file extension */
export function getLanguageFromPath(path: string): string | undefined {
  const ext = path.split(".").pop()?.toLowerCase();
  const langMap: Record<string, string> = {
    ts: "typescript", tsx: "typescript", js: "javascript", jsx: "javascript",
    py: "python", rb: "ruby", go: "go", rs: "rust", java: "java",
    cpp: "cpp", c: "c", cs: "csharp", php: "php", swift: "swift",
    kt: "kotlin", scala: "scala", vue: "vue", svelte: "svelte",
    json: "json", yaml: "yaml", yml: "yaml", toml: "toml",
    md: "markdown", css: "css", scss: "scss", html: "html",
    sql: "sql", sh: "shell", bash: "shell", dockerfile: "dockerfile",
  };
  return ext ? langMap[ext] : undefined;
}

/** Files to skip during analysis */
const SKIP_PATTERNS = [
  /node_modules/,
  /\.git\//,
  /dist\//,
  /build\//,
  /\.next\//,
  /coverage\//,
  /\.min\.(js|css)$/,
  /package-lock\.json$/,
  /yarn\.lock$/,
  /pnpm-lock\.yaml$/,
  /\.map$/,
  /\.png$|\.jpg$|\.jpeg$|\.gif$|\.svg$|\.ico$|\.webp$/,
  /\.woff$|\.woff2$|\.ttf$|\.eot$/,
  /\.mp3$|\.mp4$|\.wav$|\.avi$/,
  /\.zip$|\.tar$|\.gz$/,
];

function shouldSkipFile(path: string): boolean {
  return SKIP_PATTERNS.some((p) => p.test(path));
}

/** Code file extensions worth analyzing */
const CODE_EXTENSIONS = new Set([
  "ts", "tsx", "js", "jsx", "mjs", "cjs",
  "py", "rb", "go", "rs", "java",
  "cpp", "c", "h", "cs", "php",
  "swift", "kt", "scala",
  "vue", "svelte",
]);

function isCodeFile(path: string): boolean {
  const ext = path.split(".").pop()?.toLowerCase() ?? "";
  return CODE_EXTENSIONS.has(ext);
}

// ── GitHub Client ───────────────────────────────────────────────

function createOctokit(): Octokit {
  const token = process.env.GITHUB_TOKEN;
  return new Octokit(token ? { auth: token } : {});
}

/** Fetch repository metadata */
export async function fetchRepoInfo(owner: string, name: string): Promise<RepoInfo> {
  const octokit = createOctokit();
  const { data } = await octokit.repos.get({ owner, repo: name });

  return {
    owner,
    name,
    defaultBranch: data.default_branch,
    description: data.description ?? "",
    language: data.language ?? "Unknown",
    stars: data.stargazers_count,
    url: data.html_url,
  };
}

/** Fetch the full file tree via the Git Trees API (recursive) */
export async function fetchFileTree(
  owner: string,
  name: string,
  branch: string
): Promise<{ tree: FileTreeNode; files: RepoFile[] }> {
  const octokit = createOctokit();

  const { data } = await octokit.git.getTree({
    owner,
    repo: name,
    tree_sha: branch,
    recursive: "true",
  });

  const files: RepoFile[] = [];
  const root: FileTreeNode = { name, path: "", type: "dir", children: [] };

  for (const item of data.tree) {
    if (!item.path || shouldSkipFile(item.path)) continue;

    const parts = item.path.split("/");
    let current = root;

    // Build nested tree structure
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isLast = i === parts.length - 1;
      const currentPath = parts.slice(0, i + 1).join("/");

      if (isLast && item.type === "blob") {
        const fileNode: FileTreeNode = {
          name: part,
          path: currentPath,
          type: "file",
          language: getLanguageFromPath(currentPath),
        };
        current.children = current.children ?? [];
        current.children.push(fileNode);

        files.push({
          path: currentPath,
          name: part,
          type: "file",
          size: item.size ?? 0,
          language: getLanguageFromPath(currentPath),
        });
      } else {
        current.children = current.children ?? [];
        let dir = current.children.find((c) => c.name === part && c.type === "dir");
        if (!dir) {
          dir = { name: part, path: currentPath, type: "dir", children: [] };
          current.children.push(dir);
        }
        current = dir;
      }
    }
  }

  // Sort: directories first, then alphabetically
  sortTree(root);
  return { tree: root, files };
}

function sortTree(node: FileTreeNode) {
  if (!node.children) return;
  node.children.sort((a, b) => {
    if (a.type !== b.type) return a.type === "dir" ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
  node.children.forEach(sortTree);
}

/** Fetch contents of code files (batched, respects size limit) */
export async function fetchFileContents(
  owner: string,
  name: string,
  files: RepoFile[],
  maxFiles: number = 40,
  maxSizeKB: number = 50
): Promise<RepoFile[]> {
  const octokit = createOctokit();
  const codeFiles = files
    .filter((f) => isCodeFile(f.path) && f.size < maxSizeKB * 1024)
    .slice(0, maxFiles);

  // Fetch in parallel batches of 20
  const BATCH_SIZE = 20;
  const results: RepoFile[] = [...files];

  for (let i = 0; i < codeFiles.length; i += BATCH_SIZE) {
    const batch = codeFiles.slice(i, i + BATCH_SIZE);
    const contents = await Promise.allSettled(
      batch.map(async (file) => {
        const { data } = await octokit.repos.getContent({
          owner,
          repo: name,
          path: file.path,
        });

        if ("content" in data && data.encoding === "base64") {
          return {
            path: file.path,
            content: Buffer.from(data.content, "base64").toString("utf-8"),
          };
        }
        return null;
      })
    );

    for (const result of contents) {
      if (result.status === "fulfilled" && result.value) {
        const idx = results.findIndex((f) => f.path === result.value!.path);
        if (idx !== -1) {
          results[idx] = { ...results[idx], content: result.value.content };
        }
      }
    }
  }

  return results;
}
