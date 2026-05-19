"use client";

import { useEffect, useState } from "react";
import type { PDFDocumentProxy } from "pdfjs-dist";
import type { UploadedPdf } from "@/types/pdf";
import { getPdfDocument } from "@/lib/pdf/pdfjs";
import { ThumbnailItem } from "./ThumbnailItem";

type ThumbnailListProps = {
  pdf: UploadedPdf;
};

export function ThumbnailList({ pdf }: ThumbnailListProps) {
  const [doc, setDoc] = useState<PDFDocumentProxy | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let disposed = false;
    let loadedDoc: PDFDocumentProxy | null = null;
    setDoc(null);
    setError("");
    getPdfDocument(pdf.arrayBuffer)
      .then((pdfDoc) => {
        loadedDoc = pdfDoc;
        if (!disposed) setDoc(pdfDoc);
      })
      .catch((caught) => {
        if (!disposed) setError(caught instanceof Error ? caught.message : "サムネイル表示に失敗しました");
      });
    return () => {
      disposed = true;
      loadedDoc?.destroy();
    };
  }, [pdf.id, pdf.arrayBuffer]);

  return (
    <div className="min-h-0 flex-1 overflow-y-auto p-3 scrollbar-thin">
      {error ? <p className="text-xs text-berry">{error}</p> : null}
      {!doc ? <p className="text-xs text-slate-500">サムネイルを描画しています...</p> : null}
      {doc
        ? Array.from({ length: doc.numPages }, (_, index) => (
            <ThumbnailItem key={index + 1} pdf={pdf} doc={doc} pageNumber={index + 1} />
          ))
        : null}
    </div>
  );
}
