"use client";

import { useMemo, useState } from "react";
import type { UploadedPdf } from "@/types/pdf";
import { ocrPdfPages } from "@/lib/pdf/ocr";
import { searchCachedOcr, searchTextPdf } from "@/lib/pdf/searchPdf";
import { usePdfStore } from "@/store/usePdfStore";

type PanelProps = {
  activePdf: UploadedPdf | null;
};

export function SearchPanel({ activePdf }: PanelProps) {
  const query = usePdfStore((state) => state.searchQuery);
  const setQuery = usePdfStore((state) => state.setSearchQuery);
  const results = usePdfStore((state) => state.searchResults);
  const activeIndex = usePdfStore((state) => state.activeSearchIndex);
  const setResults = usePdfStore((state) => state.setSearchResults);
  const setActiveIndex = usePdfStore((state) => state.setActiveSearchIndex);
  const setCurrentPage = usePdfStore((state) => state.setCurrentPage);
  const ocrCache = usePdfStore((state) => state.ocrCache);
  const setOcrText = usePdfStore((state) => state.setOcrText);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState("");

  const activeResults = useMemo(
    () => results.filter((result) => result.pdfId === activePdf?.id),
    [activePdf?.id, results]
  );

  if (!activePdf) return <p className="text-sm text-slate-500">PDFを読み込むと検索が使えます。</p>;

  const runTextSearch = async () => {
    setBusy(true);
    setMessage("");
    try {
      const { results: found, pagesWithText } = await searchTextPdf(activePdf, query);
      setResults(found);
      if (!found.length) {
        setMessage(
          pagesWithText
            ? "該当なし"
            : "このPDFはテキスト検索できない可能性があります。OCR検索を試してください。"
        );
      }
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : "検索に失敗しました");
    } finally {
      setBusy(false);
    }
  };

  const runOcrSearch = async () => {
    setBusy(true);
    setMessage("");
    setProgress("");
    try {
      await ocrPdfPages(
        activePdf,
        (pageNumber, text) => setOcrText(activePdf.id, pageNumber, text),
        (info) => setProgress(`OCR ${info.pageNumber}/${info.totalPages}: ${info.status}`)
      );
      const latestCache = usePdfStore.getState().ocrCache[activePdf.id] ?? {};
      const found = searchCachedOcr(activePdf, query, latestCache);
      setResults(found);
      setMessage(found.length ? "OCR検索が完了しました" : "OCR結果に該当なし");
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : "OCR検索に失敗しました");
    } finally {
      setBusy(false);
      setProgress("");
    }
  };

  const runCachedOcrSearch = () => {
    const found = searchCachedOcr(activePdf, query, ocrCache[activePdf.id] ?? {});
    setResults(found);
    setMessage(found.length ? "キャッシュ済みOCRから検索しました" : "OCRキャッシュに該当なし");
  };

  const goResult = (index: number) => {
    const wrapped = (index + activeResults.length) % activeResults.length;
    setActiveIndex(wrapped);
    setCurrentPage(activeResults[wrapped].pageNumber);
  };

  return (
    <section className="space-y-4">
      <h2 className="text-base font-semibold">文書検索 / OCR検索</h2>
      <input
        className="field"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="検索語"
      />
      <div className="grid grid-cols-2 gap-2">
        <button className="primary-btn" type="button" onClick={runTextSearch} disabled={busy || !query.trim()}>
          テキスト検索
        </button>
        <button className="secondary-btn" type="button" onClick={runOcrSearch} disabled={busy || !query.trim()}>
          OCRして検索
        </button>
      </div>
      <button
        className="secondary-btn w-full"
        type="button"
        onClick={runCachedOcrSearch}
        disabled={busy || !query.trim() || !ocrCache[activePdf.id]}
      >
        OCRキャッシュから検索
      </button>
      <div className="flex items-center justify-between text-sm">
        <span>結果: {activeResults.length}</span>
        <div className="flex gap-2">
          <button className="secondary-btn px-3" type="button" onClick={() => goResult(activeIndex - 1)} disabled={!activeResults.length}>
            前へ
          </button>
          <button className="secondary-btn px-3" type="button" onClick={() => goResult(activeIndex + 1)} disabled={!activeResults.length}>
            次へ
          </button>
        </div>
      </div>
      {progress ? <p className="rounded bg-blue-50 p-2 text-sm text-accent">{progress}</p> : null}
      {message ? <p className="rounded border border-line bg-slate-50 p-2 text-sm">{message}</p> : null}
      <div className="space-y-2">
        {activeResults.slice(0, 30).map((result, index) => (
          <button
            key={`${result.pageNumber}-${result.matchIndex}-${index}`}
            className={`block w-full rounded border p-2 text-left text-xs ${
              index === activeIndex ? "border-accent bg-blue-50" : "border-line bg-white hover:bg-slate-50"
            }`}
            type="button"
            onClick={() => goResult(index)}
          >
            <span className="font-semibold">p{result.pageNumber}</span>
            <span className="ml-2 text-slate-500">{result.source}</span>
            <p className="mt-1 leading-relaxed">{result.text}</p>
          </button>
        ))}
      </div>
    </section>
  );
}
