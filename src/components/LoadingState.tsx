"use client";

import { motion } from "framer-motion";
import { Loader2, GitBranch, Brain, Sparkles, Check } from "lucide-react";
import type { AnalysisStatus } from "@/lib/types";

const STEPS: {
  status: AnalysisStatus;
  icon: React.ReactNode;
  label: string;
  description: string;
}[] = [
  {
    status: "fetching",
    icon: <GitBranch className="h-4 w-4" />,
    label: "Fetching Repository",
    description: "Downloading file structure and source code from GitHub...",
  },
  {
    status: "analyzing",
    icon: <Brain className="h-4 w-4" />,
    label: "Analyzing Structure",
    description: "Parsing imports, building graphs, generating diagrams...",
  },
  {
    status: "explaining",
    icon: <Sparkles className="h-4 w-4" />,
    label: "AI Explanation",
    description: "Generating beginner-friendly explanations with Gemini...",
  },
];

export default function LoadingState({ currentStatus }: { currentStatus: AnalysisStatus }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto mt-20 max-w-md"
    >
      <div className="glass-card p-8">
        {/* Central loader */}
        <div className="mb-10 flex justify-center">
          <div className="relative">
            {/* Outer ring */}
            <div className="absolute -inset-6 rounded-full border border-white/[0.04]" />
            <div className="absolute -inset-6 rounded-full border-t border-storm-500/40 animate-[spin_3s_linear_infinite]" />

            {/* Middle ring */}
            <div className="absolute -inset-3 rounded-full border border-white/[0.06]" />
            <div className="absolute -inset-3 rounded-full border-t border-purple-500/40 animate-[spin_2s_linear_infinite_reverse]" />

            {/* Core */}
            <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-storm-500/20 to-purple-500/20 border border-white/[0.08]">
              <Loader2 className="h-6 w-6 animate-spin text-storm-400" />
            </div>

            {/* Glow */}
            <div className="absolute inset-0 rounded-2xl bg-storm-500/10 blur-xl" />
          </div>
        </div>

        {/* Steps */}
        <div className="space-y-2">
          {STEPS.map((step, idx) => {
            const isActive = step.status === currentStatus;
            const isPast = getStepIndex(currentStatus) > idx;

            return (
              <motion.div
                key={step.status}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className={`flex items-start gap-3 rounded-xl p-3 transition-all ${
                  isActive
                    ? "bg-white/[0.04] border border-white/[0.08]"
                    : isPast
                      ? "opacity-40"
                      : "opacity-20"
                }`}
              >
                {/* Step indicator */}
                <div className="mt-0.5 flex-shrink-0">
                  {isActive ? (
                    <div className="relative flex h-6 w-6 items-center justify-center">
                      <Loader2 className="h-4 w-4 animate-spin text-storm-400" />
                      <div className="absolute inset-0 rounded-full bg-storm-500/10 animate-pulse-slow" />
                    </div>
                  ) : isPast ? (
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-neon-emerald/10 border border-neon-emerald/20">
                      <Check className="h-3 w-3 text-neon-emerald" />
                    </div>
                  ) : (
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/[0.03] border border-white/[0.06] text-zinc-600">
                      {step.icon}
                    </div>
                  )}
                </div>

                <div>
                  <p className={`text-sm font-medium ${
                    isActive ? "text-white" : isPast ? "text-zinc-400" : "text-zinc-600"
                  }`}>
                    {step.label}
                  </p>
                  <p className="mt-0.5 text-[11px] text-zinc-600 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Status text */}
        <div className="mt-6 text-center">
          <p className="font-mono text-[11px] text-zinc-600">
            This usually takes 10-30 seconds
          </p>
        </div>
      </div>
    </motion.div>
  );
}

function getStepIndex(status: AnalysisStatus): number {
  const order: AnalysisStatus[] = ["fetching", "parsing", "analyzing", "explaining", "complete"];
  return order.indexOf(status);
}
