"use client";

import { useState } from "react";
import { Search, ArrowRight, Loader2, Sparkles, ChevronRight } from "lucide-react";
import { useStormStore } from "@/store/useStore";
import { motion } from "framer-motion";

const EXAMPLE_REPOS = [
  { label: "Next.js", url: "https://github.com/vercel/next.js" },
  { label: "Zustand", url: "https://github.com/pmndrs/zustand" },
  { label: "Express", url: "https://github.com/expressjs/express" },
  { label: "FastAPI", url: "https://github.com/tiangolo/fastapi" },
];

export default function RepoInput() {
  const { startAnalysis, progress } = useStormStore();
  const [url, setUrl] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const isLoading = ["fetching", "parsing", "analyzing", "explaining"].includes(progress.status);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim() && !isLoading) {
      startAnalysis(url.trim());
    }
  };

  const handleExample = (exampleUrl: string) => {
    setUrl(exampleUrl);
    startAnalysis(exampleUrl);
  };

  return (
    <div className="mx-auto w-full max-w-2xl">
      {/* Input form */}
      <motion.form
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        onSubmit={handleSubmit}
        className="group relative"
      >
        {/* Animated glow border */}
        <div className={`absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-storm-500/40 via-purple-500/40 to-neon-cyan/40 blur-sm transition-opacity duration-500 ${isFocused ? "opacity-100" : "opacity-0"}`} />
        <div className={`absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-storm-500 via-purple-500 to-neon-cyan opacity-0 transition-opacity duration-500 ${isFocused ? "opacity-20" : ""}`}
          style={{ padding: "1px", mask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)", maskComposite: "exclude", WebkitMaskComposite: "xor" }}
        />

        <div className={`relative flex items-center rounded-2xl border bg-surface-1/80 backdrop-blur-xl shadow-2xl shadow-black/30 transition-all duration-300 ${isFocused ? "border-white/10" : "border-white/[0.06]"}`}>
          {/* Terminal prompt */}
          <div className="ml-4 flex items-center gap-1.5 text-zinc-600">
            <ChevronRight className="h-4 w-4 text-storm-500" />
          </div>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="github.com/owner/repo"
            disabled={isLoading}
            className="flex-1 bg-transparent px-3 py-4 font-mono text-sm text-white placeholder-zinc-600 outline-none disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!url.trim() || isLoading}
            className="neon-btn mr-2 flex items-center gap-2 text-sm disabled:opacity-30 disabled:shadow-none disabled:hover:transform-none"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="hidden sm:inline">Analyzing</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                <span className="hidden sm:inline">Analyze</span>
                <ArrowRight className="h-4 w-4 sm:hidden" />
              </>
            )}
          </button>
        </div>
      </motion.form>

      {/* Example repos */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-4 flex flex-wrap items-center justify-center gap-2"
      >
        <span className="text-[11px] text-zinc-600 font-mono">try:</span>
        {EXAMPLE_REPOS.map((repo) => (
          <button
            key={repo.url}
            onClick={() => handleExample(repo.url)}
            disabled={isLoading}
            className="tag-pill text-zinc-500 transition-all hover:border-storm-500/30 hover:bg-storm-500/5 hover:text-storm-300 disabled:opacity-40"
          >
            {repo.label}
          </button>
        ))}
      </motion.div>

      {/* Progress bar */}
      {isLoading && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6"
        >
          <div className="mb-2 flex items-center justify-between text-[11px]">
            <span className="text-zinc-500 font-mono">{progress.message}</span>
            <span className="font-mono text-storm-400">{progress.percent}%</span>
          </div>
          <div className="h-1 overflow-hidden rounded-full bg-surface-3">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress.percent}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="h-full rounded-full bg-gradient-to-r from-storm-600 via-purple-500 to-neon-cyan"
            />
          </div>
        </motion.div>
      )}

      {/* Error display */}
      {progress.status === "error" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-300/80 backdrop-blur-sm"
        >
          {progress.message}
        </motion.div>
      )}
    </div>
  );
}
