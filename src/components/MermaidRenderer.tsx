"use client";

import { useEffect, useRef, useCallback } from "react";
import mermaid from "mermaid";

interface MermaidRendererProps {
  code: string;
  id?: string;
}

export default function MermaidRenderer({ code, id = "mermaid" }: MermaidRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const renderIdRef = useRef(0);

  const renderDiagram = useCallback(async () => {
    if (!containerRef.current || !code) return;

    const currentRenderId = ++renderIdRef.current;

    mermaid.initialize({
      startOnLoad: false,
      theme: "dark",
      darkMode: true,
      fontFamily: "JetBrains Mono, monospace",
      fontSize: 12,
      flowchart: {
        htmlLabels: true,
        curve: "basis",
        padding: 12,
        nodeSpacing: 30,
        rankSpacing: 50,
      },
      themeVariables: {
        primaryColor: "#6366f1",
        primaryTextColor: "#e0e7ff",
        primaryBorderColor: "#818cf8",
        lineColor: "#4338ca",
        secondaryColor: "#1e1b4b",
        tertiaryColor: "#0f0f13",
        background: "#09090b",
        mainBkg: "#18181b",
        nodeBorder: "#4338ca",
        clusterBkg: "#1e1b4b22",
        clusterBorder: "#312e81",
        titleColor: "#c7d2fe",
        edgeLabelBackground: "#18181b",
        textColor: "#c7d2fe",
      },
    });

    try {
      const uniqueId = `${id}-${Date.now()}`;
      const { svg } = await mermaid.render(uniqueId, code);

      // Only update if this is still the latest render
      if (currentRenderId === renderIdRef.current && containerRef.current) {
        containerRef.current.innerHTML = svg;

        // Make SVG responsive
        const svgEl = containerRef.current.querySelector("svg");
        if (svgEl) {
          svgEl.style.maxWidth = "100%";
          svgEl.style.height = "auto";
          svgEl.style.minHeight = "300px";
        }
      }
    } catch (err) {
      console.error("Mermaid render error:", err);
      if (currentRenderId === renderIdRef.current && containerRef.current) {
        containerRef.current.innerHTML = `
          <div class="flex items-center justify-center p-8 text-zinc-500 text-sm">
            <p>Diagram rendering failed. The code structure may be too complex to visualize.</p>
          </div>
        `;
      }
    }
  }, [code, id]);

  useEffect(() => {
    renderDiagram();
  }, [renderDiagram]);

  return (
    <div
      ref={containerRef}
      className="flex min-h-[300px] items-center justify-center overflow-auto rounded-2xl border border-white/[0.04] bg-surface-1/50 backdrop-blur-sm p-4"
    />
  );
}
