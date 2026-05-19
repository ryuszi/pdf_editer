"use client";

import { X } from "lucide-react";
import { usePdfStore } from "@/store/usePdfStore";

export function TopTabs() {
  const pdfs = usePdfStore((state) => state.pdfs);
  const activePdfId = usePdfStore((state) => state.activePdfId);
  const setActivePdf = usePdfStore((state) => state.setActivePdf);
  const removePdf = usePdfStore((state) => state.removePdf);

  return (
    <nav className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto">
      {pdfs.map((pdf) => {
        const active = pdf.id === activePdfId;
        return (
          <div
            key={pdf.id}
            className={`group flex h-9 max-w-56 items-center rounded-md border text-sm ${
              active
                ? "border-accent bg-blue-50 text-accent"
                : "border-line bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            <button
              className="min-w-0 flex-1 truncate px-3 text-left"
              type="button"
              title={`${pdf.fileName} (${pdf.pageCount}p)`}
              onClick={() => setActivePdf(pdf.id)}
            >
              {pdf.fileName}
            </button>
            <button
              className="mr-1 flex h-6 w-6 items-center justify-center rounded hover:bg-slate-200"
              type="button"
              aria-label={`${pdf.fileName}を閉じる`}
              onClick={() => removePdf(pdf.id)}
            >
              <X size={14} aria-hidden />
            </button>
          </div>
        );
      })}
    </nav>
  );
}
