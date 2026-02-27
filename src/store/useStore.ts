"use client";

import { create } from "zustand";
import type {
  AnalysisResult,
  AnalysisProgress,
  ActiveTab,
  Explanation,
} from "@/lib/types";

// ── Store Interface ─────────────────────────────────────────────

interface StormState {
  // Input
  repoUrl: string;
  setRepoUrl: (url: string) => void;

  // Analysis state
  analysis: AnalysisResult | null;
  progress: AnalysisProgress;
  activeTab: ActiveTab;
  error: string | null;

  // Actions
  setActiveTab: (tab: ActiveTab) => void;
  startAnalysis: (repoUrl: string) => Promise<void>;
  setExplanation: (explanation: Explanation) => void;
  reset: () => void;
}

// ── Initial State ───────────────────────────────────────────────

const initialProgress: AnalysisProgress = {
  status: "idle",
  message: "",
  percent: 0,
};

// ── Store ───────────────────────────────────────────────────────

export const useStormStore = create<StormState>((set, get) => ({
  // Input
  repoUrl: "",
  setRepoUrl: (url) => set({ repoUrl: url }),

  // Analysis state
  analysis: null,
  progress: initialProgress,
  activeTab: "overview",
  error: null,

  // Actions
  setActiveTab: (tab) => set({ activeTab: tab }),

  startAnalysis: async (repoUrl: string) => {
    set({
      repoUrl,
      error: null,
      analysis: null,
      progress: { status: "fetching", message: "Fetching repository...", percent: 10 },
    });

    try {
      // Step 1: Analyze the repo (fetch + parse + dependency graph)
      set({ progress: { status: "analyzing", message: "Analyzing code structure...", percent: 30 } });

      const analyzeRes = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repoUrl }),
      });

      if (!analyzeRes.ok) {
        const errData = await analyzeRes.json().catch(() => ({}));
        throw new Error(errData.error ?? `Analysis failed (${analyzeRes.status})`);
      }

      const analyzeData = await analyzeRes.json();
      if (!analyzeData.success) throw new Error(analyzeData.error ?? "Analysis failed");

      const analysisResult = analyzeData.data as AnalysisResult;

      set({
        analysis: analysisResult,
        progress: { status: "explaining", message: "AI is explaining the codebase...", percent: 70 },
      });

      // Step 2: Get AI explanation (non-blocking — we already show the graph)
      try {
        const explainRes = await fetch("/api/explain", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            repo: analysisResult.repo,
            files: analysisResult.files
              .filter((f) => f.content)
              .map((f) => ({ ...f, content: f.content?.slice(0, 2000) })),
            dependencyGraph: analysisResult.dependencyGraph,
          }),
        });

        if (explainRes.ok) {
          const explainData = await explainRes.json();
          if (explainData.success && explainData.data) {
            const currentAnalysis = get().analysis;
            if (currentAnalysis) {
              set({
                analysis: { ...currentAnalysis, explanation: explainData.data },
              });
            }
          }
        }
      } catch {
        // AI explanation is optional — don't fail the whole analysis
        console.warn("AI explanation failed, continuing without it");
      }

      set({
        progress: { status: "complete", message: "Analysis complete!", percent: 100 },
        activeTab: "overview",
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An unknown error occurred";
      set({
        error: message,
        progress: { status: "error", message, percent: 0 },
      });
    }
  },

  setExplanation: (explanation) => {
    const current = get().analysis;
    if (current) {
      set({ analysis: { ...current, explanation } });
    }
  },

  reset: () =>
    set({
      repoUrl: "",
      analysis: null,
      progress: initialProgress,
      activeTab: "overview",
      error: null,
    }),
}));
