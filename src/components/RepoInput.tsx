"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, ArrowRight, Sparkles, ChevronRight } from "lucide-react";
import { useStormStore } from "@/store/useStore";
import { motion } from "framer-motion";

const EXAMPLE_REPOS = [
  { label: "Next.js", url: "https://github.com/vercel/next.js" },
  { label: "Zustand", url: "https://github.com/pmndrs/zustand" },
  { label: "Express", url: "https://github.com/expressjs/express" },
  { label: "FastAPI", url: "https://github.com/tiangolo/fastapi" },
];

export default function RepoInput() {
  const router = useRouter();
  const { startAnalysis } = useStormStore();
  const [url, setUrl] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      startAnalysis(url.trim());
      router.push("/analyze");
    }
  };

  const handleExample = (exampleUrl: string) => {
    setUrl(exampleUrl);
    startAnalysis(exampleUrl);
    router.push("/analyze");
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
        <div className={`absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-storm-500/40 via-storm-600/40 to-storm-400/40 blur-sm transition-opacity duration-500 ${isFocused ? "opacity-100" : "opacity-0"}`} />
        <div className={`absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-storm-500 via-storm-600 to-storm-400 opacity-0 transition-opacity duration-500 ${isFocused ? "opacity-20" : ""}`}
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
            className="flex-1 bg-transparent px-3 py-4 font-mono text-sm text-white placeholder-zinc-600 outline-none"
          />
          <button
            type="submit"
            disabled={!url.trim()}
            className="neon-btn mr-2 flex items-center gap-2 text-sm disabled:opacity-30 disabled:shadow-none disabled:hover:transform-none"
          >
            <Sparkles className="h-4 w-4" />
            <span className="hidden sm:inline">Analyze</span>
            <ArrowRight className="h-4 w-4 sm:hidden" />
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
            className="tag-pill text-zinc-500 transition-all hover:border-storm-500/30 hover:bg-storm-500/5 hover:text-storm-300 disabled:opacity-40"
          >
            {repo.label}
          </button>
        ))}
      </motion.div>


    </div>
  );
}
