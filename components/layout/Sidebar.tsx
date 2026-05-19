"use client";

import type { UploadedPdf } from "@/types/pdf";
import { ThumbnailList } from "@/components/pdf/ThumbnailList";
import { usePdfStore } from "@/store/usePdfStore";

type SidebarProps = {
  activePdf: UploadedPdf | null;
};

export function Sidebar({ activePdf }: SidebarProps) {
  const selectAllPages = usePdfStore((state) => state.selectAllPages);
  const clearSelectedPages = usePdfStore((state) => state.clearSelectedPages);

  if (!activePdf) {
    return (
      <div className="p-4 text-sm text-slate-500">
        PDFを読み込むとページサムネイルが表示されます。
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="border-b border-line p-3">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold">ページ</h2>
          <span className="text-xs text-slate-500">{activePdf.pageCount}p</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            className="h-8 rounded border border-line text-xs hover:bg-slate-50"
            type="button"
            onClick={() => selectAllPages(activePdf.id)}
          >
            全選択
          </button>
          <button
            className="h-8 rounded border border-line text-xs hover:bg-slate-50"
            type="button"
            onClick={() => clearSelectedPages(activePdf.id)}
          >
            解除
          </button>
        </div>
        <p className="mt-2 text-xs text-slate-500">
          選択中: {activePdf.selectedPages.length}ページ
        </p>
      </div>
      <ThumbnailList pdf={activePdf} />
    </div>
  );
}
