"use client";

import { useMemo, useState } from "react";
import katex from "katex";
import type { UploadedPdf } from "@/types/pdf";
import { usePdfStore } from "@/store/usePdfStore";

type PanelProps = {
  activePdf: UploadedPdf | null;
};

export function FormulaPanel({ activePdf }: PanelProps) {
  const formulaMode = usePdfStore((state) => state.formulaMode);
  const setFormulaMode = usePdfStore((state) => state.setFormulaMode);
  const selection = usePdfStore((state) => state.formulaSelection);
  const result = usePdfStore((state) => state.formulaResult);
  const [copyMessage, setCopyMessage] = useState("");

  const preview = useMemo(() => {
    if (!result.latex) return "";
    try {
      return katex.renderToString(result.latex, {
        displayMode: true,
        throwOnError: false,
        strict: false
      });
    } catch {
      return "";
    }
  }, [result.latex]);

  if (!activePdf) return <p className="text-sm text-slate-500">PDFを読み込むと数式LaTeX化が使えます。</p>;

  const recognizeAgain = () => {
    window.dispatchEvent(new CustomEvent("pdf-editor:recognize-formula"));
  };

  const copyLatex = async () => {
    await navigator.clipboard.writeText(result.latex);
    setCopyMessage("コピーしました");
    window.setTimeout(() => setCopyMessage(""), 1400);
  };

  return (
    <section className="space-y-4">
      <h2 className="text-base font-semibold">クリック数式LaTeX化</h2>
      <label className="flex items-center justify-between rounded border border-line bg-white p-3 text-sm">
        <span>数式モード</span>
        <input
          type="checkbox"
          checked={formulaMode}
          onChange={(event) => setFormulaMode(event.target.checked)}
        />
      </label>
      <p className="text-xs leading-relaxed text-slate-500">
        数式モードをONにしてPDF上の数式をクリックしてください。青い範囲をドラッグ/右下ハンドルで調整し、再認識できます。
      </p>
      {selection ? (
        <div className="rounded border border-line bg-slate-50 p-2 text-xs text-slate-600">
          p{selection.pageNumber} / x:{Math.round(selection.x)} y:{Math.round(selection.y)} w:
          {Math.round(selection.width)} h:{Math.round(selection.height)}
        </div>
      ) : null}
      <button
        className="primary-btn w-full"
        type="button"
        onClick={recognizeAgain}
        disabled={!selection || result.status === "loading"}
      >
        現在の範囲で再認識
      </button>
      {result.status === "loading" ? (
        <p className="rounded bg-blue-50 p-2 text-sm text-accent">
          ローカルLaTeX OCRに送信しています。初回はモデル読み込みで時間がかかります。
        </p>
      ) : null}
      {result.previewDataUrl ? (
        <div>
          <p className="mb-2 text-sm font-medium">切り出し画像</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={result.previewDataUrl}
            alt="切り出した数式"
            className="max-h-40 rounded border border-line bg-white object-contain"
          />
        </div>
      ) : null}
      {result.error ? <p className="rounded border border-rose-200 bg-rose-50 p-2 text-sm text-berry">{result.error}</p> : null}
      {result.latex ? (
        <div className="space-y-3">
          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-medium">LaTeX</p>
              <button className="secondary-btn px-3" type="button" onClick={copyLatex}>
                コピー
              </button>
            </div>
            <textarea className="field min-h-28 font-mono text-xs" value={result.latex} readOnly />
            {copyMessage ? <p className="mt-1 text-xs text-mint">{copyMessage}</p> : null}
          </div>
          {preview ? (
            <div>
              <p className="mb-2 text-sm font-medium">プレビュー</p>
              <div
                className="overflow-x-auto rounded border border-line bg-white p-3"
                dangerouslySetInnerHTML={{ __html: preview }}
              />
            </div>
          ) : null}
          {result.score !== null ? (
            <p className="text-xs text-slate-500">score: {result.score.toFixed(4)}</p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
