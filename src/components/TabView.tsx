"use client";

import { motion } from "framer-motion";
import { LayoutDashboard, GitBranch, GitMerge, FolderTree } from "lucide-react";
import { useStormStore } from "@/store/useStore";
import type { ActiveTab } from "@/lib/types";

const TABS: { id: ActiveTab; label: string; icon: React.ReactNode }[] = [
  {
    id: "overview",
    label: "Overview",
    icon: <LayoutDashboard className="h-4 w-4" />,
  },
  {
    id: "dependencies",
    label: "Dependencies",
    icon: <GitBranch className="h-4 w-4" />,
  },
  {
    id: "flow",
    label: "Flow Diagrams",
    icon: <GitMerge className="h-4 w-4" />,
  },
  {
    id: "files",
    label: "File Tree",
    icon: <FolderTree className="h-4 w-4" />,
  },
];

export default function TabView() {
  const { activeTab, setActiveTab } = useStormStore();

  return (
    <div className="flex items-center gap-1 rounded-xl border border-white/[0.04] bg-surface-1/50 p-1 backdrop-blur-sm">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`relative flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-all duration-200 ${
            activeTab === tab.id
              ? "text-white"
              : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          {activeTab === tab.id && (
            <motion.div
              layoutId="activeTab"
              className="absolute inset-0 rounded-lg bg-white/[0.06] border border-white/[0.08] shadow-lg shadow-storm-500/5"
              transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
            />
          )}
          <span className="relative z-10">{tab.icon}</span>
          <span className="relative z-10 hidden sm:inline">{tab.label}</span>
        </button>
      ))}
    </div>
  );
}
