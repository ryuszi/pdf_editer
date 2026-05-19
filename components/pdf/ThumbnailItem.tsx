"use client";

import { useEffect, useRef } from "react";
import type { PDFDocumentProxy } from "pdfjs-dist";
import type { UploadedPdf } from "@/types/pdf";
import { usePdfStore } from "@/store/usePdfStore";

type ThumbnailItemProps = {
  pdf: UploadedPdf;
  doc: PDFDocumentProxy;
  pageNumber: number;
};

export function ThumbnailItem({ pdf, doc, pageNumber }: ThumbnailItemProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const renderTaskRef = useRef<{ cancel: () => void } | null>(null);
  const selected = pdf.selectedPages.includes(pageNumber);
  const currentPage = usePdfStore((state) => state.currentPage);
  const setCurrentPage = usePdfStore((state) => state.setCurrentPage);
  const togglePageSelection = usePdfStore((state) => state.togglePageSelection);

  useEffect(() => {
    let cancelled = false;
    renderTaskRef.current?.cancel();
    renderTaskRef.current = null;
    const render = async () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      try {
        const page = await doc.getPage(pageNumber);
        if (cancelled) return;
        const baseViewport = page.getViewport({ scale: 1 });
        const scale = 132 / baseViewport.width;
        const viewport = page.getViewport({ scale });
        const context = canvas.getContext("2d");
        if (!context) return;
        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);
        const renderTask = page.render({ canvas, canvasContext: context, viewport });
        renderTaskRef.current = renderTask;
        await renderTask.promise;
      } catch (caught) {
        if (!isPdfRenderCancellation(caught)) {
          throw caught;
        }
      } finally {
        if (renderTaskRef.current) renderTaskRef.current = null;
      }
    };
    render();
    return () => {
      cancelled = true;
      renderTaskRef.current?.cancel();
    };
  }, [doc, pageNumber]);

  return (
    <div
      className={`mb-3 rounded-md border p-2 ${
        selected
          ? "border-accent bg-blue-50"
          : currentPage === pageNumber
            ? "border-mint bg-teal-50"
            : "border-line bg-white"
      }`}
    >
      <div className="mb-2 flex items-center justify-between">
        <label className="flex items-center gap-2 text-xs font-medium">
          <input
            type="checkbox"
            checked={selected}
            onChange={() => togglePageSelection(pdf.id, pageNumber)}
          />
          p{pageNumber}
        </label>
        <button
          className="rounded px-2 py-1 text-xs text-accent hover:bg-blue-100"
          type="button"
          onClick={() => setCurrentPage(pageNumber)}
        >
          移動
        </button>
      </div>
      <button
        className="block w-full overflow-hidden rounded border border-line bg-slate-100"
        type="button"
        onClick={() => setCurrentPage(pageNumber)}
      >
        <canvas ref={canvasRef} className="mx-auto block" />
      </button>
    </div>
  );
}

function isPdfRenderCancellation(caught: unknown) {
  return (
    caught instanceof Error &&
    (caught.name === "RenderingCancelledException" ||
      caught.message.toLowerCase().includes("cancelled"))
  );
}
