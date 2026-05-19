"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PDFDocumentProxy } from "pdfjs-dist";
import type { FormulaSelection, UploadedPdf } from "@/types/pdf";
import { cropCanvasToBlob } from "@/lib/latex/crop";
import { recognizeLatexImage } from "@/lib/latex/recognize";
import { usePdfStore } from "@/store/usePdfStore";

type PdfPageViewProps = {
  pdf: UploadedPdf;
  doc: PDFDocumentProxy;
  pageNumber: number;
  zoom: number;
};

type DragState =
  | { mode: "move"; startX: number; startY: number; initial: FormulaSelection }
  | { mode: "resize"; startX: number; startY: number; initial: FormulaSelection };

export function PdfPageView({ pdf, doc, pageNumber, zoom }: PdfPageViewProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const renderTaskRef = useRef<{ cancel: () => void } | null>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [rendering, setRendering] = useState(false);
  const dragRef = useRef<DragState | null>(null);
  const formulaMode = usePdfStore((state) => state.formulaMode);
  const formulaSelection = usePdfStore((state) => state.formulaSelection);
  const setFormulaSelection = usePdfStore((state) => state.setFormulaSelection);
  const setFormulaResult = usePdfStore((state) => state.setFormulaResult);

  useEffect(() => {
    let cancelled = false;
    renderTaskRef.current?.cancel();
    renderTaskRef.current = null;
    const render = async () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      setRendering(true);
      try {
        const page = await doc.getPage(pageNumber);
        if (cancelled) return;
        const viewport = page.getViewport({ scale: zoom * 1.3 });
        const context = canvas.getContext("2d");
        if (!context) return;
        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);
        setCanvasSize({ width: canvas.width, height: canvas.height });
        const renderTask = page.render({ canvas, canvasContext: context, viewport });
        renderTaskRef.current = renderTask;
        await renderTask.promise;
      } catch (caught) {
        if (!isPdfRenderCancellation(caught)) {
          throw caught;
        }
      } finally {
        if (renderTaskRef.current) renderTaskRef.current = null;
        if (!cancelled) setRendering(false);
      }
    };
    render();
    return () => {
      cancelled = true;
      renderTaskRef.current?.cancel();
    };
  }, [doc, pageNumber, zoom]);

  const recognizeSelection = useCallback(
    async (selection: FormulaSelection) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      try {
        setFormulaResult({ status: "loading", error: null, previewDataUrl: null });
        const { blob, dataUrl } = await cropCanvasToBlob(canvas, selection);
        setFormulaResult({ previewDataUrl: dataUrl });
        const result = await recognizeLatexImage(blob);
        setFormulaResult({
          status: "success",
          latex: result.latex,
          score: result.score,
          error: null
        });
      } catch (caught) {
        setFormulaResult({
          status: "error",
          error: caught instanceof Error ? caught.message : "数式認識に失敗しました"
        });
      }
    },
    [setFormulaResult]
  );

  useEffect(() => {
    const handler = () => {
      if (formulaSelection?.pdfId === pdf.id && formulaSelection.pageNumber === pageNumber) {
        recognizeSelection(formulaSelection);
      }
    };
    window.addEventListener("pdf-editor:recognize-formula", handler);
    return () => window.removeEventListener("pdf-editor:recognize-formula", handler);
  }, [formulaSelection, pageNumber, pdf.id, recognizeSelection]);

  const startSelection = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!formulaMode || event.defaultPrevented) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;
    const width = Math.min(canvas.width * 0.58, 520);
    const height = Math.min(canvas.height * 0.18, 190);
    const selection: FormulaSelection = {
      pdfId: pdf.id,
      pageNumber,
      x: Math.max(0, x - width / 2),
      y: Math.max(0, y - height / 2),
      width,
      height
    };
    setFormulaSelection(clampSelection(selection, canvas.width, canvas.height));
    recognizeSelection(clampSelection(selection, canvas.width, canvas.height));
  };

  const activeSelection =
    formulaSelection?.pdfId === pdf.id && formulaSelection.pageNumber === pageNumber
      ? formulaSelection
      : null;

  const overlay = activeSelection
    ? selectionToCss(activeSelection, canvasSize.width, canvasSize.height)
    : null;

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const canvas = canvasRef.current;
    const drag = dragRef.current;
    if (!canvas || !drag) return;
    const rect = canvas.getBoundingClientRect();
    const dx = (event.clientX - drag.startX) * (canvas.width / rect.width);
    const dy = (event.clientY - drag.startY) * (canvas.height / rect.height);
    const next =
      drag.mode === "move"
        ? { ...drag.initial, x: drag.initial.x + dx, y: drag.initial.y + dy }
        : {
            ...drag.initial,
            width: Math.max(40, drag.initial.width + dx),
            height: Math.max(30, drag.initial.height + dy)
          };
    setFormulaSelection(clampSelection(next, canvas.width, canvas.height));
  };

  return (
    <div
      className="mb-8 flex justify-center"
      data-page-number={pageNumber}
      onClick={startSelection}
      onPointerMove={handlePointerMove}
      onPointerUp={() => {
        dragRef.current = null;
      }}
      onPointerCancel={() => {
        dragRef.current = null;
      }}
    >
      <div className="relative">
        <canvas ref={canvasRef} className="pdf-page-canvas shadow-page" />
        {rendering ? (
          <div className="absolute left-3 top-3 rounded bg-white/90 px-2 py-1 text-xs text-slate-600">
            rendering
          </div>
        ) : null}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded bg-ink/85 px-2 py-1 text-xs text-white">
          {pageNumber}
        </div>
        {overlay ? (
          <div
            className="absolute cursor-move border-2 border-accent bg-blue-500/10"
            style={overlay}
            onClick={(event) => event.preventDefault()}
            onPointerDown={(event) => {
              event.currentTarget.setPointerCapture(event.pointerId);
              dragRef.current = {
                mode: "move",
                startX: event.clientX,
                startY: event.clientY,
                initial: activeSelection!
              };
            }}
          >
            <button
              className="absolute -bottom-2 -right-2 h-5 w-5 cursor-se-resize rounded-full border border-white bg-accent"
              type="button"
              aria-label="範囲サイズ変更"
              onClick={(event) => event.preventDefault()}
              onPointerDown={(event) => {
                event.stopPropagation();
                event.currentTarget.setPointerCapture(event.pointerId);
                dragRef.current = {
                  mode: "resize",
                  startX: event.clientX,
                  startY: event.clientY,
                  initial: activeSelection!
                };
              }}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}

function selectionToCss(selection: FormulaSelection, canvasWidth: number, canvasHeight: number) {
  if (!canvasWidth || !canvasHeight) return undefined;
  return {
    left: `${(selection.x / canvasWidth) * 100}%`,
    top: `${(selection.y / canvasHeight) * 100}%`,
    width: `${(selection.width / canvasWidth) * 100}%`,
    height: `${(selection.height / canvasHeight) * 100}%`
  };
}

function clampSelection(
  selection: FormulaSelection,
  canvasWidth: number,
  canvasHeight: number
): FormulaSelection {
  const width = Math.min(selection.width, canvasWidth);
  const height = Math.min(selection.height, canvasHeight);
  return {
    ...selection,
    width,
    height,
    x: Math.min(Math.max(0, selection.x), Math.max(0, canvasWidth - width)),
    y: Math.min(Math.max(0, selection.y), Math.max(0, canvasHeight - height))
  };
}

function isPdfRenderCancellation(caught: unknown) {
  return (
    caught instanceof Error &&
    (caught.name === "RenderingCancelledException" ||
      caught.message.toLowerCase().includes("cancelled"))
  );
}
