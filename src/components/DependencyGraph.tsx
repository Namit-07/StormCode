"use client";

import { motion } from "framer-motion";
import { GitBranch, Copy, Check, Network } from "lucide-react";
import { useStormStore } from "@/store/useStore";
import MermaidRenderer from "./MermaidRenderer";
import { useState } from "react";

export default function DependencyGraph() {
  const analysis = useStormStore((s) => s.analysis);
  const graph = analysis?.dependencyGraph;
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!graph) return;
    await navigator.clipboard.writeText(graph.mermaidCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!graph || graph.nodes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center glass-card p-16 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.03] border border-white/[0.06]">
          <Network className="h-7 w-7 text-zinc-600" />
        </div>
        <h3 className="font-display text-lg font-medium text-zinc-400">No Dependencies Found</h3>
        <p className="mt-2 max-w-md text-sm text-zinc-600">
          This repository either has no internal import connections, or the file types aren&apos;t supported yet.
        </p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Stats + Legend bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/[0.04] bg-surface-1/50 backdrop-blur-sm px-4 py-3">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-storm-500 shadow-sm shadow-storm-500/50" />
            <span className="text-xs font-mono text-zinc-400">
              {graph.nodes.length} modules
            </span>
          </div>
          <div className="h-3 w-px bg-white/[0.06]" />
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-purple-500 shadow-sm shadow-purple-500/50" />
            <span className="text-xs font-mono text-zinc-400">
              {graph.edges.length} connections
            </span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3">
          {[
            { label: "Entry", color: "bg-storm-500" },
            { label: "Component", color: "bg-purple-500" },
            { label: "Utility", color: "bg-cyan-500" },
            { label: "Config", color: "bg-amber-500" },
          ].map(({ label, color }) => (
            <div key={label} className="flex items-center gap-1.5">
              <div className={`h-1.5 w-1.5 rounded-sm ${color}`} />
              <span className="text-[10px] font-mono text-zinc-600">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Mermaid diagram */}
      <div className="relative">
        <MermaidRenderer code={graph.mermaidCode} id="dep-graph" />

        {/* Copy button */}
        <button
          onClick={handleCopy}
          title="Copy Mermaid code"
          className="absolute right-3 top-3 flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-surface-1/80 px-2.5 py-1.5 text-[11px] font-mono text-zinc-500 backdrop-blur-sm transition-all hover:bg-surface-2 hover:text-white"
        >
          {copied ? <Check className="h-3 w-3 text-neon-emerald" /> : <Copy className="h-3 w-3" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>

      {/* Top connected modules */}
      <div className="rounded-2xl border border-white/[0.04] bg-surface-1/50 backdrop-blur-sm p-4">
        <h4 className="mb-3 font-display text-xs font-semibold uppercase tracking-wider text-zinc-500">
          Most Connected Modules
        </h4>
        <div className="space-y-1.5">
          {getTopConnected(graph.nodes, graph.edges)
            .slice(0, 5)
            .map(({ node, connections }, idx) => (
              <div
                key={node.id}
                className="flex items-center justify-between rounded-xl border border-white/[0.03] bg-white/[0.02] px-3 py-2.5 transition-all hover:border-white/[0.08]"
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <span className="flex h-5 w-5 items-center justify-center rounded-md bg-white/[0.04] font-mono text-[10px] text-zinc-600">
                    {idx + 1}
                  </span>
                  <span className="truncate font-mono text-xs text-storm-400">
                    {node.filePath}
                  </span>
                  <span className="tag-pill text-[10px]">
                    {node.type}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <div className="h-1 rounded-full bg-gradient-to-r from-storm-500 to-purple-500" style={{ width: `${Math.min(connections * 8, 48)}px` }} />
                  <span className="font-mono text-[11px] text-zinc-500">
                    {connections}
                  </span>
                </div>
              </div>
            ))}
        </div>
      </div>
    </motion.div>
  );
}

function getTopConnected(
  nodes: { id: string; filePath: string; type: string }[],
  edges: { source: string; target: string }[]
) {
  const connectionCount = new Map<string, number>();
  for (const edge of edges) {
    connectionCount.set(edge.source, (connectionCount.get(edge.source) ?? 0) + 1);
    connectionCount.set(edge.target, (connectionCount.get(edge.target) ?? 0) + 1);
  }

  return nodes
    .map((node) => ({ node, connections: connectionCount.get(node.id) ?? 0 }))
    .sort((a, b) => b.connections - a.connections);
}
