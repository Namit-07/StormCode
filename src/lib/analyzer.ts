import type {
  RepoFile,
  RepoInfo,
  DependencyGraph,
  DependencyNode,
  DependencyEdge,
  FlowDiagram,
} from "./types";
import { buildDependencyGraph, extractSymbols } from "./parser";

// ── Mermaid Code Generation ─────────────────────────────────────

/** Truncate a label to avoid long mermaid lines */
function truncate(str: string, max: number = 28): string {
  return str.length > max ? str.slice(0, max - 1) + ".." : str;
}

/** Sanitize label for Mermaid — strip anything that breaks parsing */
function sanitize(str: string): string {
  return str
    .replace(/[^\x20-\x7E]/g, "")              // keep only printable ASCII
    .replace(/[[\](){}|<>#&"';`\\]/g, "")      // strip chars that break Mermaid labels
    .replace(/\s+/g, " ")
    .trim();
}

/** Mermaid reserved keywords that cannot be used as node IDs */
const MERMAID_RESERVED = new Set([
  "end", "graph", "subgraph", "flowchart", "style", "classDef",
  "direction", "click", "call", "callback", "note", "participant",
  "actor", "as", "loop", "alt", "else", "opt", "par", "and",
  "rect", "critical", "break", "title", "accTitle", "accDescr",
]);

/** Generate a safe Mermaid node ID from a file path */
function nodeId(path: string): string {
  const id = path.replace(/[^a-zA-Z0-9]/g, "_");
  // Ensure ID starts with a letter and is not a reserved keyword
  const safe = /^[a-zA-Z]/.test(id) ? id : "n_" + id;
  return MERMAID_RESERVED.has(safe.toLowerCase()) ? "n_" + safe : safe;
}

/** Generate a safe subgraph ID from a directory path */
function subgraphId(dir: string): string {
  return "sg_" + dir.replace(/[^a-zA-Z0-9]/g, "_");
}

/** Color/style mapping for node types */
function nodeStyle(type: DependencyNode["type"]): string {
  const styles: Record<DependencyNode["type"], string> = {
    entry: ":::entry",
    component: ":::component",
    utility: ":::utility",
    module: ":::module",
    config: ":::config",
    style: ":::cssfile",
    test: ":::test",
    external: ":::external",
  };
  return styles[type] ?? "";
}

// ── Dependency Graph Builder ────────────────────────────────────

export function generateDependencyGraph(files: RepoFile[]): DependencyGraph {
  const { nodes, edges } = buildDependencyGraph(files);

  // Filter to only nodes that have edges (to keep graph readable)
  const connectedNodeIds = new Set<string>();
  for (const edge of edges) {
    connectedNodeIds.add(edge.source);
    connectedNodeIds.add(edge.target);
  }

  const filteredNodes = nodes.filter(
    (n) => connectedNodeIds.has(n.id) || n.type === "entry"
  );

  // Limit to top 60 connected nodes for readability
  const limitedNodes = filteredNodes.slice(0, 60);
  const limitedNodeIds = new Set(limitedNodes.map((n) => n.id));
  const limitedEdges = edges.filter(
    (e) => limitedNodeIds.has(e.source) && limitedNodeIds.has(e.target)
  );

  const mermaidCode = generateDependencyMermaid(limitedNodes, limitedEdges);

  return {
    nodes: limitedNodes,
    edges: limitedEdges,
    mermaidCode,
  };
}

function generateDependencyMermaid(
  nodes: DependencyNode[],
  edges: DependencyEdge[]
): string {
  const lines: string[] = [
    "graph LR",
    "",
    "  %% Style definitions",
    "  classDef entry fill:#6366f1,stroke:#818cf8,color:#fff,stroke-width:2px",
    "  classDef component fill:#8b5cf6,stroke:#a78bfa,color:#fff",
    "  classDef utility fill:#06b6d4,stroke:#22d3ee,color:#fff",
    "  classDef module fill:#3b82f6,stroke:#60a5fa,color:#fff",
    "  classDef config fill:#f59e0b,stroke:#fbbf24,color:#000",
    "  classDef cssfile fill:#ec4899,stroke:#f472b6,color:#fff",
    "  classDef test fill:#10b981,stroke:#34d399,color:#fff",
    "  classDef external fill:#6b7280,stroke:#9ca3af,color:#fff",
    "",
  ];

  // Group nodes by directory for subgraphs
  const dirGroups = new Map<string, DependencyNode[]>();
  for (const node of nodes) {
    const dir = node.filePath.split("/").slice(0, -1).join("/") || "root";
    const group = dirGroups.get(dir) ?? [];
    group.push(node);
    dirGroups.set(dir, group);
  }

  // Generate subgraphs
  for (const [dir, groupNodes] of Array.from(dirGroups.entries())) {
    if (groupNodes.length > 1 && dir !== "root") {
      const sgId = subgraphId(dir);
      const sgLabel = sanitize(dir) || dir.split("/").pop() || "group";
      lines.push(`  subgraph ${sgId}["${sgLabel}"]`);
      for (const node of groupNodes) {
        const id = nodeId(node.id);
        const label = truncate(sanitize(node.label)) || node.label.slice(0, 20) || "file";
        lines.push(`    ${id}["${label}"]${nodeStyle(node.type)}`);
      }
      lines.push("  end");
      lines.push("");
    } else {
      for (const node of groupNodes) {
        const id = nodeId(node.id);
        const label = truncate(sanitize(node.label)) || node.label.slice(0, 20) || "file";
        lines.push(`  ${id}["${label}"]${nodeStyle(node.type)}`);
      }
    }
  }

  lines.push("");

  // Generate edges
  for (const edge of edges) {
    const srcId = nodeId(edge.source);
    const tgtId = nodeId(edge.target);
    const arrow = edge.type === "dynamic-import" ? "-.->" : "-->";
    lines.push(`  ${srcId} ${arrow} ${tgtId}`);
  }

  return lines.join("\n");
}

// ── Flow Diagram Builder ────────────────────────────────────────

export function generateFlowDiagrams(
  files: RepoFile[],
  repo: RepoInfo
): FlowDiagram[] {
  const diagrams: FlowDiagram[] = [];

  // 1. Application Architecture Flow
  diagrams.push(generateArchitectureFlow(files, repo));

  // 2. Data Flow Diagram
  diagrams.push(generateDataFlow(files, repo));

  // 3. Request Lifecycle (if web app detected)
  if (isWebApp(files)) {
    diagrams.push(generateRequestLifecycle(files, repo));
  }

  return diagrams;
}

function isWebApp(files: RepoFile[]): boolean {
  return files.some(
    (f) =>
      /route\.(ts|js)$/i.test(f.path) ||
      /server\.(ts|js)$/i.test(f.path) ||
      /api\//i.test(f.path) ||
      /pages\//i.test(f.path) ||
      /app\//i.test(f.path)
  );
}

function generateArchitectureFlow(files: RepoFile[], repo: RepoInfo): FlowDiagram {
  // Identify major layers
  const layers = identifyLayers(files);

  const lines: string[] = [
    "graph TD",
    "",
    "  classDef layer fill:#6366f1,stroke:#818cf8,color:#fff,stroke-width:2px",
    "  classDef sublayer fill:#1e1b4b,stroke:#4338ca,color:#c7d2fe",
    "",
    `  USER["User"] --> UI["${layers.ui ? "UI Layer" : "Interface"}"]`,
  ];

  if (layers.routing) {
    lines.push(`  UI --> ROUTER["Routing Layer"]:::layer`);
    lines.push(`  ROUTER --> LOGIC["Business Logic"]:::layer`);
  } else {
    lines.push(`  UI --> LOGIC["Business Logic"]:::layer`);
  }

  if (layers.api) {
    lines.push(`  LOGIC --> API["API Layer"]:::layer`);
    lines.push(`  API --> DATA["Data Layer"]:::layer`);
  } else if (layers.data) {
    lines.push(`  LOGIC --> DATA["Data Layer"]:::layer`);
  }

  if (layers.utils) {
    lines.push(`  LOGIC --> UTILS["Utilities"]:::sublayer`);
  }

  if (layers.config) {
    lines.push(`  LOGIC -.-> CONFIG["Configuration"]:::sublayer`);
  }

  // Add detail for each layer
  if (layers.ui && layers.uiFiles.length > 0) {
    lines.push("");
    lines.push(`  subgraph UI_DETAIL["UI Components"]`);
    for (const f of layers.uiFiles.slice(0, 5)) {
      const id = nodeId(f);
      lines.push(`    ${id}["${truncate(sanitize(f.split("/").pop()!), 20)}"]`);
    }
    lines.push("  end");
    lines.push(`  UI --> UI_DETAIL`);
  }

  const mermaidCode = lines.join("\n");

  return {
    title: "Application Architecture",
    steps: [],
    connections: [],
    mermaidCode,
  };
}

function generateDataFlow(files: RepoFile[], _repo: RepoInfo): FlowDiagram {
  const hasApi = files.some((f) => /api\//i.test(f.path) || /route\.(ts|js)/i.test(f.path));
  const hasStore = files.some((f) => /store|redux|zustand|context/i.test(f.path));
  const hasDB = files.some((f) => /prisma|drizzle|database|model|schema\.prisma/i.test(f.path));

  const lines: string[] = [
    "graph LR",
    "",
    "  classDef action fill:#f59e0b,stroke:#fbbf24,color:#000",
    "  classDef state fill:#6366f1,stroke:#818cf8,color:#fff",
    "  classDef effect fill:#10b981,stroke:#34d399,color:#fff",
    "",
    `  INPUT["User Input"]:::action`,
  ];

  if (hasStore) {
    lines.push(`  INPUT --> STORE["State Store"]:::state`);
    lines.push(`  STORE --> VIEW["View Update"]:::effect`);

    if (hasApi) {
      lines.push(`  STORE --> API["API Call"]:::action`);
      lines.push(`  API --> RESPONSE["Response"]:::effect`);
      lines.push(`  RESPONSE --> STORE`);
    }
  } else if (hasApi) {
    lines.push(`  INPUT --> HANDLER["Event Handler"]:::action`);
    lines.push(`  HANDLER --> API["API Call"]:::action`);
    lines.push(`  API --> RESPONSE["Response"]:::effect`);
    lines.push(`  RESPONSE --> VIEW["View Update"]:::effect`);
  } else {
    lines.push(`  INPUT --> HANDLER["Handler"]:::action`);
    lines.push(`  HANDLER --> LOGIC["Process"]:::state`);
    lines.push(`  LOGIC --> OUTPUT["Output"]:::effect`);
  }

  if (hasDB) {
    lines.push(`  API --> DB["Database"]:::state`);
    lines.push(`  DB --> API`);
  }

  return {
    title: "Data Flow",
    steps: [],
    connections: [],
    mermaidCode: lines.join("\n"),
  };
}

function generateRequestLifecycle(_files: RepoFile[], _repo: RepoInfo): FlowDiagram {
  const lines = [
    "graph TD",
    "",
    "  classDef req fill:#3b82f6,stroke:#60a5fa,color:#fff",
    "  classDef mid fill:#f59e0b,stroke:#fbbf24,color:#000",
    "  classDef res fill:#10b981,stroke:#34d399,color:#fff",
    "",
    `  REQ["Incoming Request"]:::req`,
    `  REQ --> MW["Middleware"]:::mid`,
    `  MW --> ROUTE["Route Matching"]:::mid`,
    `  ROUTE --> HANDLER["Request Handler"]:::mid`,
    `  HANDLER --> VALIDATE["Validation"]:::mid`,
    `  VALIDATE --> LOGIC["Business Logic"]:::mid`,
    `  LOGIC --> DB["Data Access"]:::mid`,
    `  DB --> TRANSFORM["Transform"]:::mid`,
    `  TRANSFORM --> RES["Response"]:::res`,
    "",
    `  HANDLER -->|Error| ERR["Error Handler"]:::req`,
    `  ERR --> RES`,
  ];

  return {
    title: "Request Lifecycle",
    steps: [],
    connections: [],
    mermaidCode: lines.join("\n"),
  };
}

// ── Layer Detection ─────────────────────────────────────────────

interface Layers {
  ui: boolean;
  uiFiles: string[];
  routing: boolean;
  api: boolean;
  data: boolean;
  utils: boolean;
  config: boolean;
}

function identifyLayers(files: RepoFile[]): Layers {
  const paths = files.map((f) => f.path);

  const uiFiles = paths.filter(
    (p) =>
      /component|page|view|screen|widget|ui\//i.test(p) &&
      /\.(tsx|jsx|vue|svelte)$/i.test(p)
  );

  return {
    ui: uiFiles.length > 0 || paths.some((p) => /\.(tsx|jsx|vue|svelte)$/.test(p)),
    uiFiles,
    routing: paths.some((p) => /route|router|navigation|page\.(tsx|jsx|ts|js)/i.test(p)),
    api: paths.some((p) => /api\/|route\.(ts|js)|server\.(ts|js)|controller/i.test(p)),
    data: paths.some((p) => /model|schema|prisma|database|migration|entity/i.test(p)),
    utils: paths.some((p) => /util|helper|lib\/|hook|service/i.test(p)),
    config: paths.some((p) => /config|\.env|settings/i.test(p)),
  };
}
