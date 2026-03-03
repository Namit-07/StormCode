"use client";

import { motion } from "framer-motion";
import { Star, ExternalLink, Code2, GitFork, FileCode } from "lucide-react";
import { useStormStore } from "@/store/useStore";

export default function RepoHeader() {
  const analysis = useStormStore((s) => s.analysis);
  const repo = analysis?.repo;

  if (!repo) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {/* Repo icon */}
          <div className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-storm-500/20 to-storm-600/20 border border-white/[0.06]">
            <Code2 className="h-5 w-5 text-storm-400" />
            <div className="absolute -inset-px rounded-xl bg-gradient-to-br from-storm-500/10 to-transparent" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display text-lg font-bold text-white">
                {repo.owner}
                <span className="text-zinc-600">/</span>
                {repo.name}
              </h2>
              <a
                href={repo.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-6 w-6 items-center justify-center rounded-md text-zinc-600 transition-all hover:bg-white/[0.04] hover:text-zinc-300"
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
            {repo.description && (
              <p className="mt-0.5 max-w-xl truncate text-sm text-zinc-500">
                {repo.description}
              </p>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 rounded-lg bg-white/[0.03] border border-white/[0.05] px-2.5 py-1.5">
            <Star className="h-3.5 w-3.5 text-neon-amber" />
            <span className="text-xs font-medium text-zinc-300">{formatStars(repo.stars)}</span>
          </div>
          <div className="tag-pill">
            <div className="h-2 w-2 rounded-full bg-storm-500" />
            <span className="text-zinc-400">{repo.language}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-zinc-500">
            <FileCode className="h-3.5 w-3.5" />
            {analysis?.files.length ?? 0} files
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function formatStars(count: number): string {
  if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
  return count.toString();
}
