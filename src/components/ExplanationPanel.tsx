"use client";

import { motion } from "framer-motion";
import {
  Lightbulb,
  BookOpen,
  Cpu,
  FileText,
  Sparkles,
  Loader2,
  Layers,
  Footprints,
  Boxes,
} from "lucide-react";
import { useStormStore } from "@/store/useStore";
import type { TechStackItem } from "@/lib/types";

export default function ExplanationPanel() {
  const analysis = useStormStore((s) => s.analysis);
  const progress = useStormStore((s) => s.progress);
  const error = useStormStore((s) => s.error);
  const explanation = analysis?.explanation;

  if (progress.status === "explaining" && !explanation) {
    return (
      <div className="flex flex-col items-center justify-center glass-card p-16 text-center">
        <div className="relative">
          <Loader2 className="h-10 w-10 animate-spin text-storm-400" />
          <div className="absolute -inset-4 animate-pulse-slow rounded-full bg-storm-500/10" />
        </div>
        <h3 className="mt-6 font-display text-lg font-medium text-zinc-200">AI is thinking...</h3>
        <p className="mt-2 text-sm text-zinc-500">
          Generating a beginner-friendly explanation of this codebase
        </p>
      </div>
    );
  }

  if (!explanation) {
    return (
      <div className="flex flex-col items-center justify-center glass-card p-16 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.03] border border-white/[0.06]">
          <Lightbulb className="h-7 w-7 text-zinc-600" />
        </div>
        <h3 className="font-display text-lg font-medium text-zinc-400">Explanation Unavailable</h3>
        <p className="mt-2 max-w-md text-sm text-zinc-600">
          {error && (error.includes("quota") || error.includes("429"))
            ? "Gemini API rate limit reached. Wait a minute and try again."
            : "AI explanation failed. Check your Gemini API key in .env.local or try again later."}
        </p>
        <p className="mt-3 text-xs text-zinc-700">
          Tip: Other tabs (Dependencies, Flow Diagrams, File Tree) still work without AI.
        </p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-4"
    >
      {/* Summary Card - Hero */}
      <Section
        icon={<Sparkles className="h-4 w-4 text-storm-400" />}
        title="What Is This Project?"
        accent="storm"
        delay={0}
      >
        <p className="text-sm leading-relaxed text-zinc-300">
          {explanation.summary}
        </p>
      </Section>

      {/* Two column layout */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Beginner Analogy */}
        <Section
          icon={<Lightbulb className="h-4 w-4 text-neon-amber" />}
          title="Explain Like I'm 5"
          accent="amber"
          delay={0.05}
        >
          <div className="relative rounded-xl bg-amber-500/[0.03] border border-amber-500/10 p-4">
            <p className="text-sm leading-relaxed text-zinc-300 italic">
              &quot;{explanation.beginnerAnalogy}&quot;
            </p>
          </div>
        </Section>

        {/* Tech Stack */}
        <Section
          icon={<Boxes className="h-4 w-4 text-neon-cyan" />}
          title="Tech Stack"
          accent="cyan"
          delay={0.1}
        >
          <div className="grid gap-2 sm:grid-cols-2">
            {explanation.techStack.map((tech, idx) => (
              <TechCard key={idx} tech={tech} />
            ))}
          </div>
        </Section>
      </div>

      {/* Architecture */}
      <Section
        icon={<Layers className="h-4 w-4 text-neon-violet" />}
        title="Architecture Breakdown"
        accent="violet"
        delay={0.15}
      >
        <p className="text-sm leading-relaxed text-zinc-400 whitespace-pre-line">
          {explanation.architecture}
        </p>
      </Section>

      {/* How It Works */}
      <Section
        icon={<Footprints className="h-4 w-4 text-neon-emerald" />}
        title="How It Works"
        accent="emerald"
        delay={0.2}
      >
        <div className="text-sm leading-relaxed text-zinc-400 whitespace-pre-line">
          {explanation.howItWorks}
        </div>
      </Section>

      {/* Key Files */}
      <Section
        icon={<FileText className="h-4 w-4 text-neon-rose" />}
        title="Key Files Explained"
        accent="rose"
        delay={0.25}
      >
        <div className="space-y-2">
          {explanation.keyFiles.map((file, idx) => (
            <div
              key={idx}
              className="group rounded-xl border border-white/[0.04] bg-white/[0.02] p-3.5 transition-all hover:border-white/[0.08] hover:bg-white/[0.03]"
            >
              <div className="mb-1.5 flex items-center gap-2">
                <code className="rounded-md bg-white/[0.04] px-2 py-0.5 font-mono text-[11px] text-storm-400">
                  {file.path}
                </code>
              </div>
              <p className="mb-1 text-xs font-medium text-zinc-300">
                {file.purpose}
              </p>
              <p className="text-xs text-zinc-500 italic leading-relaxed">
                {file.simpleExplanation}
              </p>
            </div>
          ))}
        </div>
      </Section>
    </motion.div>
  );
}

// ── Sub-components ──────────────────────────────────────────────

const accentMap: Record<string, { border: string; glow: string }> = {
  storm: { border: "border-storm-500/15", glow: "shadow-storm-500/5" },
  amber: { border: "border-amber-500/15", glow: "shadow-amber-500/5" },
  violet: { border: "border-purple-500/15", glow: "shadow-purple-500/5" },
  cyan: { border: "border-cyan-500/15", glow: "shadow-cyan-500/5" },
  emerald: { border: "border-emerald-500/15", glow: "shadow-emerald-500/5" },
  rose: { border: "border-rose-500/15", glow: "shadow-rose-500/5" },
};

function Section({
  icon,
  title,
  children,
  delay = 0,
  accent = "storm",
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  delay?: number;
  accent?: string;
}) {
  const colors = accentMap[accent] ?? accentMap.storm;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className={`rounded-2xl border bg-surface-1/50 backdrop-blur-sm p-5 shadow-lg ${colors.border} ${colors.glow}`}
    >
      <div className="mb-3 flex items-center gap-2.5">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/[0.04] border border-white/[0.06]">
          {icon}
        </div>
        <h3 className="font-display text-sm font-semibold text-white">{title}</h3>
      </div>
      {children}
    </motion.div>
  );
}

function TechCard({ tech }: { tech: TechStackItem }) {
  const categoryColors: Record<string, { bg: string; text: string; dot: string }> = {
    framework: { bg: "bg-storm-500/8", text: "text-storm-400", dot: "bg-storm-500" },
    language: { bg: "bg-purple-500/8", text: "text-purple-400", dot: "bg-purple-500" },
    database: { bg: "bg-emerald-500/8", text: "text-emerald-400", dot: "bg-emerald-500" },
    tool: { bg: "bg-amber-500/8", text: "text-amber-400", dot: "bg-amber-500" },
    library: { bg: "bg-cyan-500/8", text: "text-cyan-400", dot: "bg-cyan-500" },
    service: { bg: "bg-rose-500/8", text: "text-rose-400", dot: "bg-rose-500" },
  };

  const colors = categoryColors[tech.category] ?? { bg: "bg-zinc-500/8", text: "text-zinc-400", dot: "bg-zinc-500" };

  return (
    <div className="rounded-xl border border-white/[0.04] bg-white/[0.02] p-3 transition-all hover:border-white/[0.08]">
      <div className="mb-1 flex items-center gap-2">
        <span className="text-sm font-medium text-white">{tech.name}</span>
        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${colors.bg} ${colors.text}`}>
          <div className={`h-1.5 w-1.5 rounded-full ${colors.dot}`} />
          {tech.category}
        </span>
      </div>
      <p className="text-[11px] text-zinc-500 leading-relaxed">{tech.purpose}</p>
    </div>
  );
}
