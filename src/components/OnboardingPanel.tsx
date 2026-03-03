"use client";

import { motion } from "framer-motion";
import {
  Loader2,
  CheckCircle2,
  Terminal,
  Lightbulb,
  GitPullRequest,
  BookOpen,
  Sparkles,
  ChevronRight,
  FileCode,
  Wrench,
  AlertCircle,
} from "lucide-react";
import { useStormStore } from "@/store/useStore";
import type { OnboardingStep } from "@/lib/types";

export default function OnboardingPanel() {
  const analysis = useStormStore((s) => s.analysis);
  const onboardingLoading = useStormStore((s) => s.onboardingLoading);
  const error = useStormStore((s) => s.error);
  const guide = analysis?.onboardingGuide;

  if (onboardingLoading) {
    return (
      <div className="flex flex-col items-center justify-center glass-card p-16 text-center">
        <div className="relative">
          <Loader2 className="h-10 w-10 animate-spin text-storm-400" />
          <div className="absolute -inset-4 animate-pulse-slow rounded-full bg-storm-500/10" />
        </div>
        <h3 className="mt-6 font-display text-lg font-medium text-zinc-200">
          Generating onboarding guide...
        </h3>
        <p className="mt-2 text-sm text-zinc-500">
          AI is reading the codebase to craft a contributor guide
        </p>
      </div>
    );
  }

  if (!guide) {
    const isQuota = error && (error.includes("quota") || error.includes("429") || error.includes("rate_limit"));
    return (
      <div className="flex flex-col items-center justify-center glass-card p-16 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.03] border border-white/[0.06]">
          <AlertCircle className="h-7 w-7 text-zinc-600" />
        </div>
        <h3 className="font-display text-lg font-medium text-zinc-400">Guide Unavailable</h3>
        <p className="mt-2 max-w-md text-sm text-zinc-600">
          {isQuota
            ? "Groq API rate limit reached. Wait a minute and try again."
            : "Failed to generate the onboarding guide. Check your Groq API key or try again."}
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
      {/* Welcome banner */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl border border-storm-500/20 bg-gradient-to-br from-storm-500/10 to-storm-600/5 p-6"
      >
        <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-storm-500/10 blur-2xl" />
        <div className="relative flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-storm-500/20 border border-storm-500/20">
            <GitPullRequest className="h-5 w-5 text-storm-400" />
          </div>
          <div>
            <h2 className="font-display text-base font-semibold text-white">Welcome, Contributor!</h2>
            <p className="mt-1 text-sm leading-relaxed text-zinc-300">{guide.welcomeMessage}</p>
          </div>
        </div>
      </motion.div>

      {/* Two column: Prerequisites + Conventions */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Prerequisites */}
        <Section icon={<Wrench className="h-4 w-4 text-storm-400" />} title="Prerequisites" delay={0.05}>
          <ul className="space-y-2">
            {guide.prerequisites.map((prereq, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-zinc-300">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-storm-500" />
                {prereq}
              </li>
            ))}
          </ul>
        </Section>

        {/* Code Conventions */}
        <Section icon={<BookOpen className="h-4 w-4 text-neon-amber" />} title="Code Conventions" delay={0.1}>
          <ul className="space-y-2">
            {guide.codeConventions.map((convention, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-zinc-300">
                <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                {convention}
              </li>
            ))}
          </ul>
        </Section>
      </div>

      {/* Architecture Notes */}
      <Section icon={<BookOpen className="h-4 w-4 text-storm-400" />} title="Architecture for Contributors" delay={0.15}>
        <p className="text-sm leading-relaxed text-zinc-300">{guide.architectureNotes}</p>
      </Section>

      {/* Setup Steps */}
      <Section icon={<Terminal className="h-4 w-4 text-storm-400" />} title="Setup Steps" delay={0.2}>
        <div className="space-y-4">
          {guide.setupSteps.map((step, i) => (
            <StepCard key={i} step={step} index={i} accentColor="storm" />
          ))}
        </div>
      </Section>

      {/* First Contribution */}
      <Section icon={<GitPullRequest className="h-4 w-4 text-neon-emerald" />} title="Your First Contribution" delay={0.25}>
        <div className="space-y-4">
          {guide.firstContribution.map((step, i) => (
            <StepCard key={i} step={step} index={i} accentColor="emerald" />
          ))}
        </div>
      </Section>

      {/* Good First Issues */}
      <Section icon={<Sparkles className="h-4 w-4 text-neon-amber" />} title="Good First Issues" delay={0.3}>
        <div className="space-y-2">
          {guide.goodFirstIssues.map((issue, i) => (
            <div
              key={i}
              className="flex items-start gap-3 rounded-xl border border-white/[0.04] bg-white/[0.02] px-4 py-3"
            >
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-500/10 text-[10px] font-bold text-amber-400 border border-amber-500/20">
                {i + 1}
              </span>
              <p className="text-sm text-zinc-300">{issue}</p>
            </div>
          ))}
        </div>
      </Section>
    </motion.div>
  );
}

// ── Sub-components ──────────────────────────────────────────────

function Section({
  icon,
  title,
  delay,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  delay: number;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="glass-card p-5"
    >
      <div className="mb-4 flex items-center gap-2.5">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/[0.04] border border-white/[0.06]">
          {icon}
        </div>
        <h3 className="font-display text-sm font-semibold text-white">{title}</h3>
      </div>
      {children}
    </motion.div>
  );
}

function StepCard({
  step,
  index,
  accentColor,
}: {
  step: OnboardingStep;
  index: number;
  accentColor: "storm" | "emerald";
}) {
  const accent = accentColor === "storm"
    ? { dot: "bg-storm-500", border: "border-storm-500/20", bg: "bg-storm-500/5", text: "text-storm-400", cmdBg: "bg-storm-500/10 border-storm-500/20 text-storm-300" }
    : { dot: "bg-emerald-500", border: "border-emerald-500/20", bg: "bg-emerald-500/5", text: "text-emerald-400", cmdBg: "bg-emerald-500/10 border-emerald-500/20 text-emerald-300" };

  return (
    <div className={`rounded-xl border ${accent.border} ${accent.bg} p-4`}>
      <div className="flex items-start gap-3">
        <span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${accent.dot} text-[11px] font-bold text-white`}>
          {index + 1}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white">{step.title}</p>
          <p className="mt-1 text-xs leading-relaxed text-zinc-400">{step.description}</p>

          {/* Commands */}
          {step.commands && step.commands.length > 0 && (
            <div className="mt-3 space-y-1.5">
              {step.commands.map((cmd, i) => (
                <div key={i} className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 font-mono text-xs ${accent.cmdBg}`}>
                  <Terminal className="h-3 w-3 shrink-0 opacity-60" />
                  <code>{cmd}</code>
                </div>
              ))}
            </div>
          )}

          {/* Files */}
          {step.files && step.files.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {step.files.map((file, i) => (
                <span key={i} className="inline-flex items-center gap-1 rounded-md border border-white/[0.06] bg-white/[0.03] px-2 py-0.5 font-mono text-[10px] text-zinc-400">
                  <FileCode className="h-2.5 w-2.5" />
                  {file}
                </span>
              ))}
            </div>
          )}

          {/* Tip */}
          {step.tip && (
            <div className="mt-3 flex items-start gap-2 rounded-lg border border-amber-500/15 bg-amber-500/5 px-3 py-2">
              <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" />
              <p className="text-xs text-amber-200/70">{step.tip}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
