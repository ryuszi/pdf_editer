"use client";

import { useState } from "react";
import type { UploadedPdf } from "@/types/pdf";
import { downloadPdf, safePdfName } from "@/lib/pdf/download";
import { removePagesFromPdf } from "@/lib/pdf/editPdf";
import { pagesToRangeText, parsePageRange } from "@/lib/pdf/pageRange";

type PanelProps = {
  activePdf: UploadedPdf | null;
};

export function RemovePagesPanel({ activePdf }: PanelProps) {
  const [rangeText, setRangeText] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  if (!activePdf) return <p className="text-sm text-slate-500">PDFを読み込むとページ削除が使えます。</p>;

  const selectedText = pagesToRangeText(activePdf.selectedPages);

  const handleRemove = async () => {
    setBusy(true);
    setMessage("");
    try {
      const pages = parsePageRange(rangeText || selectedText, activePdf.pageCount);
      const bytes = await removePagesFromPdf(activePdf, pages);
      downloadPdf(bytes, `${safePdfName(activePdf.fileName)}_removed_pages.pdf`);
      setMessage("指定ページを除外したPDFをダウンロードしました");
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : "ページ削除に失敗しました");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="space-y-4">
      <h2 className="text-base font-semibold">指定ページを除外</h2>
      <div className="space-y-2">
        <label className="block text-sm font-medium">削除するページ</label>
        <input
          className="field"
          value={rangeText}
          onChange={(event) => setRangeText(event.target.value)}
          placeholder="例: 2,5-7"
        />
        <p className="text-xs text-slate-500">
          未入力ならチェック済みページを使用: {selectedText || "なし"}
        </p>
      </div>
      <button className="danger-btn w-full" type="button" onClick={handleRemove} disabled={busy}>
        ページ削除PDFを作成
      </button>
      {message ? <p className="rounded border border-line bg-slate-50 p-2 text-sm">{message}</p> : null}
    </section>
  );
}
