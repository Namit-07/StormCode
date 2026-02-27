"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  ChevronRight,
  ChevronDown,
  FileText,
  Folder,
  FolderOpen,
  Search,
} from "lucide-react";
import { useStormStore } from "@/store/useStore";
import type { FileTreeNode } from "@/lib/types";

const LANG_COLORS: Record<string, string> = {
  typescript: "text-blue-400",
  javascript: "text-yellow-400",
  python: "text-green-400",
  ruby: "text-red-400",
  go: "text-cyan-400",
  rust: "text-orange-400",
  java: "text-red-500",
  css: "text-purple-400",
  html: "text-orange-500",
  json: "text-yellow-300",
  markdown: "text-zinc-400",
  shell: "text-emerald-400",
};

export default function FileTree() {
  const analysis = useStormStore((s) => s.analysis);
  const [filter, setFilter] = useState("");

  if (!analysis?.fileTree) {
    return (
      <div className="flex items-center justify-center glass-card p-16 text-center">
        <p className="text-sm text-zinc-500">No files to display</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-white/[0.04] bg-surface-1/50 backdrop-blur-sm overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/[0.04] px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/[0.04] border border-white/[0.06]">
            <Folder className="h-3.5 w-3.5 text-storm-400" />
          </div>
          <span className="font-display text-sm font-semibold text-white">
            {analysis.fileTree.name}
          </span>
          <span className="rounded-full bg-white/[0.04] px-2 py-0.5 text-[10px] font-mono text-zinc-500 border border-white/[0.06]">
            {analysis.files.length} files
          </span>
        </div>
        {/* Search */}
        <div className="flex items-center gap-1.5 rounded-lg border border-white/[0.06] bg-white/[0.02] px-2 py-1">
          <Search className="h-3 w-3 text-zinc-600" />
          <input
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter..."
            className="w-24 bg-transparent font-mono text-[11px] text-zinc-300 placeholder-zinc-600 outline-none sm:w-32"
          />
        </div>
      </div>

      {/* Tree */}
      <div className="max-h-[600px] overflow-auto p-2 font-mono text-xs">
        {analysis.fileTree.children?.map((node, idx) => (
          <TreeNode key={node.path || idx} node={node} depth={0} filter={filter} />
        ))}
      </div>
    </motion.div>
  );
}

function TreeNode({ node, depth, filter }: { node: FileTreeNode; depth: number; filter: string }) {
  const [isOpen, setIsOpen] = useState(depth < 2);
  const isDir = node.type === "dir";

  // Filter logic
  if (filter) {
    const matchesFilter = node.name.toLowerCase().includes(filter.toLowerCase());
    const childrenMatch = isDir && node.children?.some(child => matchesName(child, filter));
    if (!matchesFilter && !childrenMatch) return null;
  }

  return (
    <div>
      <button
        onClick={() => isDir && setIsOpen(!isOpen)}
        className={`flex w-full items-center gap-1.5 rounded-lg px-2 py-1 text-left transition-all hover:bg-white/[0.03] ${
          isDir ? "cursor-pointer" : "cursor-default"
        }`}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
      >
        {isDir ? (
          <>
            {isOpen ? (
              <ChevronDown className="h-3 w-3 flex-shrink-0 text-zinc-600" />
            ) : (
              <ChevronRight className="h-3 w-3 flex-shrink-0 text-zinc-600" />
            )}
            {isOpen ? (
              <FolderOpen className="h-3.5 w-3.5 flex-shrink-0 text-storm-400" />
            ) : (
              <Folder className="h-3.5 w-3.5 flex-shrink-0 text-storm-400/60" />
            )}
          </>
        ) : (
          <>
            <span className="w-3" />
            <FileText
              className={`h-3.5 w-3.5 flex-shrink-0 ${
                LANG_COLORS[node.language ?? ""] ?? "text-zinc-600"
              }`}
            />
          </>
        )}
        <span
          className={`truncate ${
            isDir ? "text-zinc-300 font-medium" : "text-zinc-500"
          }`}
        >
          {node.name}
        </span>
        {!isDir && node.language && (
          <span className="ml-auto text-[9px] text-zinc-700">{node.language}</span>
        )}
      </button>

      {isDir && isOpen && node.children && (
        <div>
          {node.children.map((child, idx) => (
            <TreeNode key={child.path || idx} node={child} depth={depth + 1} filter={filter} />
          ))}
        </div>
      )}
    </div>
  );
}

function matchesName(node: FileTreeNode, filter: string): boolean {
  if (node.name.toLowerCase().includes(filter.toLowerCase())) return true;
  if (node.children) return node.children.some(child => matchesName(child, filter));
  return false;
}
