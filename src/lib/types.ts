// ── Repository Types ──────────────────────────────────────────────
export interface RepoInfo {
  owner: string;
  name: string;
  defaultBranch: string;
  description: string;
  language: string;
  stars: number;
  url: string;
}

export interface RepoFile {
  path: string;
  name: string;
  type: "file" | "dir";
  size: number;
  content?: string;
  language?: string;
}

export interface FileTreeNode {
  name: string;
  path: string;
  type: "file" | "dir";
  children?: FileTreeNode[];
  language?: string;
}

// ── Dependency Graph Types ───────────────────────────────────────
export interface DependencyNode {
  id: string;
  label: string;
  filePath: string;
  type: "entry" | "module" | "component" | "utility" | "config" | "style" | "test" | "external";
  language?: string;
}

export interface DependencyEdge {
  source: string;
  target: string;
  type: "import" | "dynamic-import" | "re-export";
  label?: string;
}

export interface DependencyGraph {
  nodes: DependencyNode[];
  edges: DependencyEdge[];
  mermaidCode: string;
}

// ── Flow Diagram Types ───────────────────────────────────────────
export interface FlowStep {
  id: string;
  label: string;
  description: string;
  type: "start" | "process" | "decision" | "io" | "end";
}

export interface FlowConnection {
  from: string;
  to: string;
  label?: string;
}

export interface FlowDiagram {
  title: string;
  steps: FlowStep[];
  connections: FlowConnection[];
  mermaidCode: string;
}

// ── Explanation Types ────────────────────────────────────────────
export interface Explanation {
  summary: string;
  architecture: string;
  techStack: TechStackItem[];
  keyFiles: KeyFileExplanation[];
  howItWorks: string;
  beginnerAnalogy: string;
}

export interface TechStackItem {
  name: string;
  category: "framework" | "language" | "database" | "tool" | "library" | "service";
  purpose: string;
  icon?: string;
}

export interface KeyFileExplanation {
  path: string;
  purpose: string;
  simpleExplanation: string;
}

// ── Onboarding Guide Types ──────────────────────────────────────
export interface OnboardingStep {
  title: string;
  description: string;
  commands?: string[];
  files?: string[];
  tip?: string;
}

export interface OnboardingGuide {
  welcomeMessage: string;
  prerequisites: string[];
  setupSteps: OnboardingStep[];
  firstContribution: OnboardingStep[];
  codeConventions: string[];
  architectureNotes: string;
  goodFirstIssues: string[];
}

// ── Analysis Result ──────────────────────────────────────────────
export interface AnalysisResult {
  repo: RepoInfo;
  fileTree: FileTreeNode;
  files: RepoFile[];
  dependencyGraph: DependencyGraph;
  flowDiagrams: FlowDiagram[];
  explanation: Explanation | null;
  onboardingGuide: OnboardingGuide | null;
}

// ── UI State Types ───────────────────────────────────────────────
export type AnalysisStatus =
  | "idle"
  | "fetching"
  | "parsing"
  | "analyzing"
  | "explaining"
  | "complete"
  | "error";

export type ActiveTab = "overview" | "dependencies" | "flow" | "files" | "onboarding";

export interface AnalysisProgress {
  status: AnalysisStatus;
  message: string;
  percent: number;
}

// ── API Types ────────────────────────────────────────────────────
export interface AnalyzeRequest {
  repoUrl: string;
}

export interface AnalyzeResponse {
  success: boolean;
  data?: AnalysisResult;
  error?: string;
}

export interface ExplainRequest {
  repo: RepoInfo;
  files: RepoFile[];
  dependencyGraph: DependencyGraph;
}

export interface ExplainResponse {
  success: boolean;
  data?: Explanation;
  error?: string;
}

export interface OnboardRequest {
  repo: RepoInfo;
  files: RepoFile[];
  dependencyGraph: DependencyGraph;
  explanation: Explanation | null;
}

export interface OnboardResponse {
  success: boolean;
  data?: OnboardingGuide;
  error?: string;
}
