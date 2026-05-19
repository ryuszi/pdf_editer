"use client";

import { useEffect, useRef, useState } from "react";
import type { PDFDocumentProxy } from "pdfjs-dist";
import type { UploadedPdf } from "@/types/pdf";
import { getPdfDocument } from "@/lib/pdf/pdfjs";
import { usePdfStore } from "@/store/usePdfStore";
import { PdfPageView } from "./PdfPageView";

type PdfViewerProps = {
  pdf: UploadedPdf;
};

export function PdfViewer({ pdf }: PdfViewerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [doc, setDoc] = useState<PDFDocumentProxy | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const zoom = usePdfStore((state) => state.zoom);
  const setZoom = usePdfStore((state) => state.setZoom);
  const currentPage = usePdfStore((state) => state.currentPage);
  const setCurrentPage = usePdfStore((state) => state.setCurrentPage);

  useEffect(() => {
    let disposed = false;
    let loadedDoc: PDFDocumentProxy | null = null;
    setLoading(true);
    setError("");
    setDoc(null);

    getPdfDocument(pdf.arrayBuffer)
      .then((pdfDoc) => {
        loadedDoc = pdfDoc;
        if (!disposed) setDoc(pdfDoc);
      })
      .catch((caught) => {
        if (!disposed) setError(caught instanceof Error ? caught.message : "PDF表示に失敗しました");
      })
      .finally(() => {
        if (!disposed) setLoading(false);
      });

    return () => {
      disposed = true;
      loadedDoc?.destroy();
    };
  }, [pdf.id, pdf.arrayBuffer]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (event: WheelEvent) => {
      if (!event.ctrlKey) return;
      event.preventDefault();
      const delta = event.deltaY > 0 ? -0.08 : 0.08;
      setZoom(zoom + delta);
    };

    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => container.removeEventListener("wheel", handleWheel);
  }, [setZoom, zoom]);

  useEffect(() => {
    const pageElement = containerRef.current?.querySelector<HTMLElement>(
      `[data-page-number="${currentPage}"]`
    );
    pageElement?.scrollIntoView({ block: "start", behavior: "smooth" });
  }, [currentPage, pdf.id]);

  const handleScroll = () => {
    const container = containerRef.current;
    if (!container) return;
    const pages = Array.from(
      container.querySelectorAll<HTMLElement>("[data-page-number]")
    );
    const containerTop = container.getBoundingClientRect().top;
    let bestPage = currentPage;
    let bestDistance = Number.POSITIVE_INFINITY;
    for (const page of pages) {
      const distance = Math.abs(page.getBoundingClientRect().top - containerTop - 24);
      if (distance < bestDistance) {
        bestDistance = distance;
        bestPage = Number(page.dataset.pageNumber);
      }
    }
    if (bestPage && bestPage !== currentPage) setCurrentPage(bestPage);
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex h-10 shrink-0 items-center justify-between border-b border-line bg-panel px-4 text-sm">
        <span className="truncate font-medium">{pdf.fileName}</span>
        <span className="text-slate-600">
          {currentPage} / {pdf.pageCount}
        </span>
      </div>
      <div
        ref={containerRef}
        className="min-h-0 flex-1 overflow-auto p-8 scrollbar-thin"
        onScroll={handleScroll}
      >
        {loading ? <p className="text-sm text-slate-600">PDFを描画しています...</p> : null}
        {error ? <p className="text-sm text-berry">{error}</p> : null}
        {doc
          ? Array.from({ length: doc.numPages }, (_, index) => (
              <PdfPageView
                key={`${pdf.id}-${index + 1}`}
                pdf={pdf}
                doc={doc}
                pageNumber={index + 1}
                zoom={zoom}
              />
            ))
          : null}
      </div>
    </div>
  );
}
