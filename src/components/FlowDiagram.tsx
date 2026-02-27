"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { GitMerge, Copy, Check, Workflow } from "lucide-react";
import { useStormStore } from "@/store/useStore";
import MermaidRenderer from "./MermaidRenderer";
import type { FlowDiagram as FlowDiagramType } from "@/lib/types";

export default function FlowDiagram() {
  const analysis = useStormStore((s) => s.analysis);
  const [activeIndex, setActiveIndex] = useState(0);
  const [copied, setCopied] = useState(false);

  const diagrams = analysis?.flowDiagrams;

  const handleCopy = async () => {
    if (!diagrams) return;
    await navigator.clipboard.writeText(diagrams[activeIndex].mermaidCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!diagrams || diagrams.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center glass-card p-16 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.03] border border-white/[0.06]">
          <Workflow className="h-7 w-7 text-zinc-600" />
        </div>
        <h3 className="font-display text-lg font-medium text-zinc-400">No Flow Diagrams</h3>
        <p className="mt-2 max-w-md text-sm text-zinc-600">
          Flow diagrams couldn&apos;t be generated for this repository.
        </p>
      </div>
    );
  }

  const activeDiagram = diagrams[activeIndex];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Diagram selector + header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {diagrams.length > 1 && (
          <div className="flex gap-1.5 rounded-xl border border-white/[0.04] bg-surface-1/50 p-1 backdrop-blur-sm">
            {diagrams.map((diagram, idx) => (
              <button
                key={idx}
                onClick={() => setActiveIndex(idx)}
                className={`relative rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                  idx === activeIndex
                    ? "bg-white/[0.06] text-white border border-white/[0.08] shadow-sm"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                {diagram.title}
              </button>
            ))}
          </div>
        )}

        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 rounded-lg border border-white/[0.06] bg-white/[0.02] px-2.5 py-1.5 text-[11px] font-mono text-zinc-500 transition-all hover:bg-white/[0.06] hover:text-white"
        >
          {copied ? <Check className="h-3 w-3 text-neon-emerald" /> : <Copy className="h-3 w-3" />}
          {copied ? "Copied" : "Copy Code"}
        </button>
      </div>

      {/* Title */}
      <div>
        <h3 className="font-display text-lg font-semibold text-white">
          {activeDiagram.title}
        </h3>
      </div>

      {/* Diagram */}
      <MermaidRenderer code={activeDiagram.mermaidCode} id={`flow-${activeIndex}`} />

      {/* Description */}
      <div className="rounded-2xl border border-white/[0.04] bg-surface-1/50 backdrop-blur-sm p-4">
        <h4 className="mb-2 font-display text-xs font-semibold uppercase tracking-wider text-zinc-500">
          What This Shows
        </h4>
        <p className="text-sm leading-relaxed text-zinc-400">
          {getFlowDescription(activeDiagram)}
        </p>
      </div>
    </motion.div>
  );
}

function getFlowDescription(diagram: FlowDiagramType): string {
  switch (diagram.title) {
    case "Application Architecture":
      return "This diagram shows the high-level layers of the application and how they connect. Think of it like floors in a building \u2014 the user interacts with the top floor (UI), which talks to the middle floors (logic & API), which access the basement (data).";
    case "Data Flow":
      return "This shows how data moves through the application. Like plumbing in a house \u2014 user input flows in, gets processed through pipes (handlers & state), and comes out as visible changes on screen.";
    case "Request Lifecycle":
      return "This shows what happens when someone makes a request to the application \u2014 like following a package through a delivery center. It enters, gets sorted, processed, and a response is sent back.";
    default:
      return "This diagram visualizes how different parts of the codebase interact with each other.";
  }
}
