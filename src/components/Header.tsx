"use client";

import { Zap, Github, RotateCcw, Terminal } from "lucide-react";
import { useStormStore } from "@/store/useStore";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

export default function Header() {
  const router = useRouter();
  const { analysis, reset, progress } = useStormStore();
  const isAnalyzing = ["fetching", "parsing", "analyzing", "explaining"].includes(progress.status);

  const handleReset = () => {
    reset();
    router.push("/");
  };

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="sticky top-0 z-50"
    >
      {/* Glass effect bar */}
      <div className="border-b border-white/[0.04] bg-surface-0/60 backdrop-blur-2xl">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
          {/* Logo */}
          <button onClick={handleReset} className="group flex items-center gap-2.5">
            <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-storm-600 via-storm-500 to-storm-400 shadow-lg shadow-storm-500/25 transition-all group-hover:shadow-storm-500/40 group-hover:scale-105">
              <Zap className="h-4 w-4 text-white" strokeWidth={2.5} />
              {/* Orbital ring */}
              <div className="absolute -inset-1 rounded-xl border border-storm-400/20 animate-pulse-slow" />
            </div>
            <span className="font-display text-lg font-bold tracking-tight text-white">
              Storm<span className="gradient-text-static">Code</span>
            </span>
            <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-white/[0.04] px-2 py-0.5 text-[10px] font-mono text-zinc-500 border border-white/[0.06]">
              <Terminal className="h-2.5 w-2.5" />
              v1.0
            </span>
          </button>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {analysis && !isAnalyzing && (
              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={handleReset}
                className="flex items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-zinc-400 transition-all hover:bg-white/[0.06] hover:text-white hover:border-white/10"
              >
                <RotateCcw className="h-3 w-3" />
                New Analysis
              </motion.button>
            )}
            <a
              href="https://github.com/Namit-07/StormCode"
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 transition-all hover:bg-white/[0.04] hover:text-white"
            >
              <Github className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>
    </motion.header>
  );
}
