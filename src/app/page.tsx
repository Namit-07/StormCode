"use client";

import { useStormStore } from "@/store/useStore";
import Header from "@/components/Header";
import RepoInput from "@/components/RepoInput";
import RepoHeader from "@/components/RepoHeader";
import TabView from "@/components/TabView";
import DependencyGraph from "@/components/DependencyGraph";
import FlowDiagram from "@/components/FlowDiagram";
import ExplanationPanel from "@/components/ExplanationPanel";
import FileTree from "@/components/FileTree";
import LoadingState from "@/components/LoadingState";
import { motion, AnimatePresence } from "framer-motion";
import { GitBranch, Brain, Sparkles, ArrowDown, Command } from "lucide-react";

export default function Home() {
  const { analysis, progress, activeTab, error } = useStormStore();
  const isAnalyzing = ["fetching", "parsing", "analyzing", "explaining"].includes(
    progress.status
  );
  const showResults = analysis && (progress.status === "complete" || progress.status === "explaining");

  return (
    <div className="relative min-h-screen noise-bg">
      {/* Aurora background blobs */}
      <div className="aurora-blob left-[10%] top-[5%] h-[500px] w-[500px] bg-storm-600" style={{ animationDelay: "0s" }} />
      <div className="aurora-blob right-[10%] top-[15%] h-[400px] w-[400px] bg-purple-600" style={{ animationDelay: "4s" }} />
      <div className="aurora-blob left-[30%] top-[40%] h-[350px] w-[350px] bg-cyan-600" style={{ animationDelay: "8s" }} />

      {/* Dot grid overlay */}
      <div className="dot-grid pointer-events-none fixed inset-0 z-0" />

      {/* Header */}
      <Header />

      <main className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6">
        <AnimatePresence mode="wait">
          {!analysis && !isAnalyzing ? (
            /* ── Landing View ──────────────────────────────── */
            <motion.div
              key="landing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center pt-20 sm:pt-28"
            >
              {/* Error banner */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 w-full max-w-2xl rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-center text-sm text-red-400 backdrop-blur-sm"
                >
                  {error}
                </motion.div>
              )}
              {/* Badge */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/[0.06] bg-white/[0.02] px-4 py-1.5 backdrop-blur-sm"
              >
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-neon-emerald opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-neon-emerald" />
                </span>
                <span className="text-xs font-medium text-zinc-400">
                  Powered by Google Gemini AI
                </span>
              </motion.div>

              {/* Hero */}
              <motion.h1
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1, duration: 0.6 }}
                className="mb-4 text-center font-display text-4xl font-bold leading-[1.1] tracking-tight text-white sm:text-6xl lg:text-7xl"
              >
                Understand any
                <br />
                codebase{" "}
                <span className="gradient-text">instantly</span>
              </motion.h1>

              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.6 }}
                className="mb-10 max-w-xl text-center text-sm leading-relaxed text-zinc-500 sm:text-base"
              >
                Paste any GitHub repository and get AI-generated architecture
                diagrams, dependency maps, and explanations so simple, a
                five-year-old could follow along.
              </motion.p>

              {/* Keyboard shortcut hint */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="mb-8 flex items-center gap-1.5 text-[11px] text-zinc-600"
              >
                <kbd className="flex h-5 items-center rounded border border-white/[0.08] bg-white/[0.03] px-1.5 font-mono text-[10px] text-zinc-500">
                  <Command className="mr-0.5 h-2.5 w-2.5" />V
                </kbd>
                <span>to paste &middot; Enter to analyze</span>
              </motion.div>

              <RepoInput />

              {/* Feature cards */}
              <motion.div
                initial={{ y: 40, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.6 }}
                className="mt-24 grid w-full max-w-4xl gap-4 sm:grid-cols-3"
              >
                {[
                  {
                    icon: <GitBranch className="h-5 w-5" />,
                    iconColor: "text-neon-cyan",
                    glowColor: "shadow-cyan-500/20",
                    bgColor: "from-cyan-500/10 to-transparent",
                    title: "Dependency Graph",
                    description:
                      "Interactive visual map of how every module connects. See the architecture at a glance.",
                  },
                  {
                    icon: <Brain className="h-5 w-5" />,
                    iconColor: "text-neon-violet",
                    glowColor: "shadow-purple-500/20",
                    bgColor: "from-purple-500/10 to-transparent",
                    title: "Flow Diagrams",
                    description:
                      "Auto-generated architecture, data flow, and request lifecycle visualizations.",
                  },
                  {
                    icon: <Sparkles className="h-5 w-5" />,
                    iconColor: "text-neon-amber",
                    glowColor: "shadow-amber-500/20",
                    bgColor: "from-amber-500/10 to-transparent",
                    title: "ELI5 Mode",
                    description:
                      "AI breaks down the entire codebase using everyday analogies anyone can understand.",
                  },
                ].map((feature, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.7 + idx * 0.1 }}
                    className="spotlight-card group rounded-xl p-5"
                  >
                    {/* Icon with glow */}
                    <div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${feature.bgColor} ${feature.iconColor} shadow-lg ${feature.glowColor} transition-all group-hover:scale-110`}>
                      {feature.icon}
                    </div>
                    <h3 className="mb-2 font-display text-sm font-semibold text-white">
                      {feature.title}
                    </h3>
                    <p className="text-xs leading-relaxed text-zinc-500">
                      {feature.description}
                    </p>
                  </motion.div>
                ))}
              </motion.div>

              {/* Scroll indicator */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2 }}
                className="mt-16 flex flex-col items-center gap-2 text-zinc-700"
              >
                <ArrowDown className="h-4 w-4 animate-bounce" />
              </motion.div>

              {/* Footer */}
              <div className="mt-8 pb-8 text-center text-[11px] text-zinc-700">
                Built with Next.js, Mermaid.js & Gemini &middot;{" "}
                <a
                  href="https://github.com/Namit-07/StormCode"
                  className="text-zinc-600 underline decoration-zinc-800 underline-offset-2 hover:text-zinc-400 transition-colors"
                >
                  Star on GitHub
                </a>
              </div>
            </motion.div>
          ) : isAnalyzing && !analysis ? (
            /* ── Loading View ──────────────────────────────── */
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <LoadingState currentStatus={progress.status} />
            </motion.div>
          ) : showResults ? (
            /* ── Results View ──────────────────────────────── */
            <motion.div
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-6 space-y-5"
            >
              <RepoHeader />
              <TabView />

              {/* Tab content */}
              <div className="min-h-[400px]">
                <AnimatePresence mode="wait">
                  {activeTab === "overview" && (
                    <motion.div
                      key="overview"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ExplanationPanel />
                    </motion.div>
                  )}
                  {activeTab === "dependencies" && (
                    <motion.div
                      key="dependencies"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.2 }}
                    >
                      <DependencyGraph />
                    </motion.div>
                  )}
                  {activeTab === "flow" && (
                    <motion.div
                      key="flow"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.2 }}
                    >
                      <FlowDiagram />
                    </motion.div>
                  )}
                  {activeTab === "files" && (
                    <motion.div
                      key="files"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.2 }}
                    >
                      <FileTree />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </main>
    </div>
  );
}
