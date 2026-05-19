"use client";

import { useState } from "react";
import type { UploadedPdf } from "@/types/pdf";
import { downloadPdf, safePdfName } from "@/lib/pdf/download";
import { createPdfFromPages, splitPdfAtPage } from "@/lib/pdf/editPdf";
import { pagesToRangeText, parsePageRange } from "@/lib/pdf/pageRange";
import { usePdfStore } from "@/store/usePdfStore";

type PanelProps = {
  activePdf: UploadedPdf | null;
};

export function CutPanel({ activePdf }: PanelProps) {
  const setSelectedPages = usePdfStore((state) => state.setSelectedPages);
  const [rangeText, setRangeText] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  if (!activePdf) return <EmptyPanel label="PDFを読み込むと抽出と分割が使えます。" />;

  const selectedText = pagesToRangeText(activePdf.selectedPages);

  const parsePages = () => parsePageRange(rangeText || selectedText, activePdf.pageCount);

  const handleApplyToSelection = () => {
    try {
      const pages = parsePageRange(rangeText, activePdf.pageCount);
      setSelectedPages(activePdf.id, pages);
      setMessage(`${pages.length}ページを選択しました`);
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : "ページ指定が不正です");
    }
  };

  const handleExtract = async () => {
    setBusy(true);
    setMessage("");
    try {
      const pages = parsePages();
      const bytes = await createPdfFromPages(activePdf, pages);
      downloadPdf(bytes, `${safePdfName(activePdf.fileName)}_extract_${pagesToRangeText(pages)}.pdf`);
      setMessage("抽出PDFをダウンロードしました");
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : "抽出に失敗しました");
    } finally {
      setBusy(false);
    }
  };

  const handleSplit = async () => {
    setBusy(true);
    setMessage("");
    try {
      const pages = parsePages();
      if (pages.length !== 1) throw new Error("一点分割には単一ページを指定してください");
      const { first, second } = await splitPdfAtPage(activePdf, pages[0]);
      const base = safePdfName(activePdf.fileName);
      downloadPdf(first, `${base}_split_1-${pages[0]}.pdf`);
      downloadPdf(second, `${base}_split_${pages[0] + 1}-${activePdf.pageCount}.pdf`);
      setMessage("2つのPDFをダウンロードしました");
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : "分割に失敗しました");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="space-y-4">
      <PanelTitle title="抽出 / 一点分割" />
      <RangeEditor
        value={rangeText}
        onChange={setRangeText}
        placeholder="例: 1,3-5,10"
        selectedText={selectedText}
      />
      <button className="secondary-btn w-full" type="button" onClick={handleApplyToSelection}>
        入力範囲をチェック状態へ反映
      </button>
      <div className="grid grid-cols-2 gap-2">
        <button className="primary-btn" type="button" onClick={handleExtract} disabled={busy}>
          抽出
        </button>
        <button className="primary-btn" type="button" onClick={handleSplit} disabled={busy}>
          一点分割
        </button>
      </div>
      <StatusMessage message={message} />
    </section>
  );
}

function EmptyPanel({ label }: { label: string }) {
  return <p className="text-sm text-slate-500">{label}</p>;
}

function PanelTitle({ title }: { title: string }) {
  return <h2 className="text-base font-semibold">{title}</h2>;
}

function RangeEditor({
  value,
  onChange,
  placeholder,
  selectedText
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  selectedText: string;
}) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium">ページ範囲</label>
      <input
        className="field"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
      />
      <p className="text-xs text-slate-500">
        未入力ならチェック済みページを使用: {selectedText || "なし"}
      </p>
    </div>
  );
}

function StatusMessage({ message }: { message: string }) {
  if (!message) return null;
  return <p className="rounded border border-line bg-slate-50 p-2 text-sm text-slate-700">{message}</p>;
}
