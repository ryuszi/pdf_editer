"use client";

import { useState } from "react";
import type { UploadedPdf } from "@/types/pdf";
import { downloadPdf, safePdfName } from "@/lib/pdf/download";
import { createPdfFromPages } from "@/lib/pdf/editPdf";

type PanelProps = {
  activePdf: UploadedPdf | null;
};

export function SplitPanel({ activePdf }: PanelProps) {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  if (!activePdf) return <p className="text-sm text-slate-500">PDFを読み込むと分離が使えます。</p>;

  const splitPages = async (pages: number[], suffix: string) => {
    setBusy(true);
    setMessage("");
    try {
      const base = safePdfName(activePdf.fileName);
      for (const page of pages) {
        const bytes = await createPdfFromPages(activePdf, [page]);
        downloadPdf(bytes, `${base}_${suffix}_p${page}.pdf`);
      }
      setMessage(`${pages.length}個のPDFをダウンロードしました`);
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : "分離に失敗しました");
    } finally {
      setBusy(false);
    }
  };

  const allPages = Array.from({ length: activePdf.pageCount }, (_, index) => index + 1);

  return (
    <section className="space-y-4">
      <h2 className="text-base font-semibold">ページごとに分離</h2>
      <button
        className="primary-btn w-full"
        type="button"
        onClick={() => splitPages(allPages, "page")}
        disabled={busy}
      >
        全ページを1ページずつ分離
      </button>
      <button
        className="secondary-btn w-full"
        type="button"
        onClick={() => splitPages(activePdf.selectedPages, "selected")}
        disabled={busy || activePdf.selectedPages.length === 0}
      >
        選択ページのみ個別分離
      </button>
      <p className="text-xs text-slate-500">
        初期版ではzip化せず、複数PDFを個別ダウンロードします。
      </p>
      {message ? <p className="rounded border border-line bg-slate-50 p-2 text-sm">{message}</p> : null}
    </section>
  );
}
