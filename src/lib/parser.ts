import type { RepoFile, DependencyNode, DependencyEdge } from "./types";
import { getLanguageFromPath } from "./github";

// ── Import Extraction ────────────────────────────────────────────

interface ImportInfo {
  source: string;
  specifiers: string[];
  isDynamic: boolean;
}

/** Extract imports from a JavaScript/TypeScript file */
function extractJSImports(content: string): ImportInfo[] {
  const imports: ImportInfo[] = [];

  // Static imports:  import X from 'y'  /  import { X } from 'y'  /  import 'y'
  const staticRe = /import\s+(?:(?:[\w*{}\s,]+)\s+from\s+)?['"]([^'"]+)['"]/g;
  let m: RegExpExecArray | null;
  while ((m = staticRe.exec(content))) {
    imports.push({ source: m[1], specifiers: [], isDynamic: false });
  }

  // require() calls
  const requireRe = /(?:const|let|var)\s+(?:[\w{}=,\s]+)\s*=\s*require\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
  while ((m = requireRe.exec(content))) {
    imports.push({ source: m[1], specifiers: [], isDynamic: false });
  }

  // Dynamic imports: import('x')
  const dynamicRe = /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
  while ((m = dynamicRe.exec(content))) {
    imports.push({ source: m[1], specifiers: [], isDynamic: true });
  }

  return imports;
}

/** Extract imports from a Python file */
function extractPythonImports(content: string): ImportInfo[] {
  const imports: ImportInfo[] = [];

  // from X import Y
  const fromRe = /^\s*from\s+([\w.]+)\s+import\s+(.+)/gm;
  let m: RegExpExecArray | null;
  while ((m = fromRe.exec(content))) {
    imports.push({
      source: m[1],
      specifiers: m[2].split(",").map((s) => s.trim()),
      isDynamic: false,
    });
  }

  // import X, Y
  const importRe = /^\s*import\s+([\w.,\s]+)/gm;
  while ((m = importRe.exec(content))) {
    const modules = m[1].split(",").map((s) => s.trim().split(/\s+as\s+/)[0]);
    for (const mod of modules) {
      imports.push({ source: mod, specifiers: [], isDynamic: false });
    }
  }

  return imports;
}

/** Extract imports from a Go file */
function extractGoImports(content: string): ImportInfo[] {
  const imports: ImportInfo[] = [];

  // Single import
  const singleRe = /^\s*import\s+"([^"]+)"/gm;
  let m: RegExpExecArray | null;
  while ((m = singleRe.exec(content))) {
    imports.push({ source: m[1], specifiers: [], isDynamic: false });
  }

  // Grouped imports
  const groupRe = /import\s*\(([\s\S]*?)\)/g;
  while ((m = groupRe.exec(content))) {
    const lineRe = /"([^"]+)"/g;
    let lm: RegExpExecArray | null;
    while ((lm = lineRe.exec(m[1]))) {
      imports.push({ source: lm[1], specifiers: [], isDynamic: false });
    }
  }

  return imports;
}

// ── Import Extraction Dispatcher ─────────────────────────────────

export function extractImports(filePath: string, content: string): ImportInfo[] {
  const lang = getLanguageFromPath(filePath);
  switch (lang) {
    case "typescript":
    case "javascript":
    case "vue":
    case "svelte":
      return extractJSImports(content);
    case "python":
      return extractPythonImports(content);
    case "go":
      return extractGoImports(content);
    default:
      return extractJSImports(content); // fallback
  }
}

// ── Resolve relative imports to file paths ──────────────────────

function resolveImportPath(
  importSource: string,
  importerPath: string,
  allPaths: Set<string>
): string | null {
  // Skip external/node_modules imports
  if (!importSource.startsWith(".") && !importSource.startsWith("/")) {
    return null; // external dependency
  }

  const importerDir = importerPath.split("/").slice(0, -1).join("/");
  const rawTarget = importSource.startsWith("/")
    ? importSource.slice(1)
    : normalizePath(`${importerDir}/${importSource}`);

  // Try exact match, then common extensions
  const extensions = ["", ".ts", ".tsx", ".js", ".jsx", ".mjs", ".py", "/index.ts", "/index.tsx", "/index.js", "/index.jsx"];
  for (const ext of extensions) {
    const candidate = rawTarget + ext;
    if (allPaths.has(candidate)) return candidate;
  }

  return null;
}

function normalizePath(path: string): string {
  const parts = path.split("/");
  const resolved: string[] = [];
  for (const part of parts) {
    if (part === "..") resolved.pop();
    else if (part !== "." && part !== "") resolved.push(part);
  }
  return resolved.join("/");
}

// ── Classify file type ──────────────────────────────────────────

function classifyFile(path: string): DependencyNode["type"] {
  const lowerPath = path.toLowerCase();

  if (/\.(test|spec|__test__|_test)\./i.test(path)) return "test";
  if (/\.config\.|\.rc\b|tsconfig|next\.config|tailwind|postcss|vite\.config|webpack/i.test(path)) return "config";
  if (/\.(css|scss|sass|less|styl)$/.test(path)) return "style";
  if (/(^|\/)index\.(ts|js|tsx|jsx|mjs)$/.test(path)) return "entry";
  if (/page\.(tsx|jsx|ts|js)$|layout\.(tsx|jsx|ts|js)$|route\.(ts|js)$/i.test(path)) return "entry";
  if (/^src\/app\/|^app\//i.test(path)) return "entry";
  if (/component|widget|ui\//i.test(path)) return "component";
  if (/util|helper|lib|hook|service|api/i.test(path)) return "utility";

  return "module";
}

// ── Build Dependency Graph ──────────────────────────────────────

export function buildDependencyGraph(files: RepoFile[]): {
  nodes: DependencyNode[];
  edges: DependencyEdge[];
} {
  const codeFiles = files.filter((f) => f.content);
  const allPaths = new Set(files.map((f) => f.path));
  const nodeMap = new Map<string, DependencyNode>();
  const edges: DependencyEdge[] = [];

  // Create nodes for all code files
  for (const file of codeFiles) {
    const id = file.path;
    nodeMap.set(id, {
      id,
      label: file.name,
      filePath: file.path,
      type: classifyFile(file.path),
      language: file.language,
    });
  }

  // Extract edges from imports
  for (const file of codeFiles) {
    if (!file.content) continue;
    const imports = extractImports(file.path, file.content);

    for (const imp of imports) {
      const resolvedPath = resolveImportPath(imp.source, file.path, allPaths);
      if (resolvedPath && nodeMap.has(resolvedPath)) {
        edges.push({
          source: file.path,
          target: resolvedPath,
          type: imp.isDynamic ? "dynamic-import" : "import",
        });
      }
    }
  }

  return { nodes: Array.from(nodeMap.values()), edges };
}

// ── Extract Function/Class Definitions ──────────────────────────

export interface CodeSymbol {
  name: string;
  type: "function" | "class" | "variable" | "interface" | "type" | "enum";
  filePath: string;
  line: number;
  exported: boolean;
}

export function extractSymbols(filePath: string, content: string): CodeSymbol[] {
  const symbols: CodeSymbol[] = [];
  const lines = content.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;

    // Exported functions/classes
    const exportFunc = /^export\s+(?:default\s+)?(?:async\s+)?function\s+(\w+)/;
    const exportClass = /^export\s+(?:default\s+)?class\s+(\w+)/;
    const exportConst = /^export\s+(?:const|let|var)\s+(\w+)/;
    const exportInterface = /^export\s+(?:default\s+)?interface\s+(\w+)/;
    const exportType = /^export\s+(?:default\s+)?type\s+(\w+)/;
    const exportEnum = /^export\s+(?:default\s+)?enum\s+(\w+)/;

    // Non-exported
    const func = /^(?:async\s+)?function\s+(\w+)/;
    const cls = /^class\s+(\w+)/;

    let m: RegExpMatchArray | null;
    if ((m = line.match(exportFunc))) symbols.push({ name: m[1], type: "function", filePath, line: lineNum, exported: true });
    else if ((m = line.match(exportClass))) symbols.push({ name: m[1], type: "class", filePath, line: lineNum, exported: true });
    else if ((m = line.match(exportConst))) symbols.push({ name: m[1], type: "variable", filePath, line: lineNum, exported: true });
    else if ((m = line.match(exportInterface))) symbols.push({ name: m[1], type: "interface", filePath, line: lineNum, exported: true });
    else if ((m = line.match(exportType))) symbols.push({ name: m[1], type: "type", filePath, line: lineNum, exported: true });
    else if ((m = line.match(exportEnum))) symbols.push({ name: m[1], type: "enum", filePath, line: lineNum, exported: true });
    else if ((m = line.match(func))) symbols.push({ name: m[1], type: "function", filePath, line: lineNum, exported: false });
    else if ((m = line.match(cls))) symbols.push({ name: m[1], type: "class", filePath, line: lineNum, exported: false });
  }

  return symbols;
}
