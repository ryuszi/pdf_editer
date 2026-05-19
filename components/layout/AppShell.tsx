"use client";

import { useMemo } from "react";
import { FileText } from "lucide-react";
import { PdfDropzone } from "@/components/upload/PdfDropzone";
import { TopTabs } from "@/components/layout/TopTabs";
import { Sidebar } from "@/components/layout/Sidebar";
import { RightPanel } from "@/components/layout/RightPanel";
import { PdfViewer } from "@/components/pdf/PdfViewer";
import { ZoomControls } from "@/components/pdf/ZoomControls";
import { usePdfStore } from "@/store/usePdfStore";

export function AppShell() {
  const pdfs = usePdfStore((state) => state.pdfs);
  const activePdfId = usePdfStore((state) => state.activePdfId);
  const activePdf = useMemo(
    () => pdfs.find((pdf) => pdf.id === activePdfId) ?? null,
    [pdfs, activePdfId]
  );

  return (
    <main className="flex h-screen min-h-0 flex-col bg-paper text-ink">
      <header className="flex h-16 shrink-0 items-center gap-3 border-b border-line bg-panel px-4">
        <div className="flex min-w-fit items-center gap-2 font-semibold">
          <FileText size={22} className="text-accent" aria-hidden />
          <span>PDF Canvas Editor</span>
        </div>
        <PdfDropzone compact />
        <TopTabs />
        <div className="ml-auto">
          <ZoomControls />
        </div>
      </header>

      <section className="grid min-h-0 flex-1 grid-cols-[260px_minmax(520px,1fr)_360px]">
        <aside className="min-h-0 border-r border-line bg-panel">
          <Sidebar activePdf={activePdf} />
        </aside>

        <section className="min-h-0 bg-[#e9edf4]">
          {activePdf ? (
            <PdfViewer pdf={activePdf} />
          ) : (
            <div className="flex h-full items-center justify-center p-8">
              <div className="w-full max-w-2xl">
                <PdfDropzone />
              </div>
            </div>
          )}
        </section>

        <aside className="min-h-0 border-l border-line bg-panel">
          <RightPanel activePdf={activePdf} />
        </aside>
      </section>
    </main>
  );
}
