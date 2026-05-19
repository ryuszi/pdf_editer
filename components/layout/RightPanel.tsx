"use client";

import { useState } from "react";
import type { UploadedPdf } from "@/types/pdf";
import { CutPanel } from "@/components/operations/CutPanel";
import { RemovePagesPanel } from "@/components/operations/RemovePagesPanel";
import { SplitPanel } from "@/components/operations/SplitPanel";
import { MergePanel } from "@/components/operations/MergePanel";
import { SearchPanel } from "@/components/operations/SearchPanel";
import { FormulaPanel } from "@/components/operations/FormulaPanel";
import { usePdfStore } from "@/store/usePdfStore";

type RightPanelProps = {
  activePdf: UploadedPdf | null;
};

const tabs = [
  { id: "cut", label: "抽出/分割" },
  { id: "remove", label: "削除" },
  { id: "split", label: "分離" },
  { id: "merge", label: "結合" },
  { id: "search", label: "OCR検索" },
  { id: "formula", label: "数式LaTeX" }
] as const;

type TabId = (typeof tabs)[number]["id"];

export function RightPanel({ activePdf }: RightPanelProps) {
  const [activeTab, setActiveTab] = useState<TabId>("cut");
  const setFormulaMode = usePdfStore((state) => state.setFormulaMode);

  const selectTab = (tabId: TabId) => {
    setActiveTab(tabId);
    if (tabId === "formula") {
      setFormulaMode(true);
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="grid grid-cols-3 gap-1 border-b border-line p-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`h-8 rounded text-xs font-medium ${
              activeTab === tab.id ? "bg-ink text-white" : "bg-slate-100 hover:bg-slate-200"
            }`}
            type="button"
            onClick={() => selectTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-4 scrollbar-thin">
        {activeTab === "cut" && <CutPanel activePdf={activePdf} />}
        {activeTab === "remove" && <RemovePagesPanel activePdf={activePdf} />}
        {activeTab === "split" && <SplitPanel activePdf={activePdf} />}
        {activeTab === "merge" && <MergePanel />}
        {activeTab === "search" && <SearchPanel activePdf={activePdf} />}
        {activeTab === "formula" && <FormulaPanel activePdf={activePdf} />}
      </div>
    </div>
  );
}
