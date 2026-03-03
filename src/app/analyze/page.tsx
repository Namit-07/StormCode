"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useStormStore } from "@/store/useStore";
import Header from "@/components/Header";
import RepoHeader from "@/components/RepoHeader";
import TabView from "@/components/TabView";
import DependencyGraph from "@/components/DependencyGraph";
import FlowDiagram from "@/components/FlowDiagram";
import ExplanationPanel from "@/components/ExplanationPanel";
import FileTree from "@/components/FileTree";
import LoadingState from "@/components/LoadingState";
import OnboardingPanel from "@/components/OnboardingPanel";
import { motion, AnimatePresence } from "framer-motion";

export default function AnalyzePage() {
  const router = useRouter();
  const { analysis, progress, activeTab } = useStormStore();

  const isAnalyzing = ["fetching", "parsing", "analyzing", "explaining"].includes(
    progress.status
  );
  const showResults =
    analysis &&
    (progress.status === "complete" || progress.status === "explaining");

  // Guard: if no state at all or error, send back home
  useEffect(() => {
    if (!isAnalyzing && !analysis && (progress.status === "idle" || progress.status === "error")) {
      router.replace("/");
    }
  }, [isAnalyzing, analysis, progress.status, router]);

  return (
    <div className="relative min-h-screen noise-bg">
      {/* Aurora background blobs */}
      <div className="aurora-blob left-[10%] top-[5%] h-[500px] w-[500px] bg-storm-600" style={{ animationDelay: "0s" }} />
      <div className="aurora-blob right-[10%] top-[15%] h-[400px] w-[400px] bg-storm-700" style={{ animationDelay: "4s" }} />
      <div className="aurora-blob left-[30%] top-[40%] h-[350px] w-[350px] bg-storm-500" style={{ animationDelay: "8s" }} />

      {/* Dot grid overlay */}
      <div className="dot-grid pointer-events-none fixed inset-0 z-0" />

      {/* Header */}
      <Header />

      <main className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6">
        <AnimatePresence mode="wait">
          {isAnalyzing && !analysis ? (
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
              transition={{ duration: 0.2 }}
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
                  {activeTab === "onboarding" && (
                    <motion.div
                      key="onboarding"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.2 }}
                    >
                      <OnboardingPanel />
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
