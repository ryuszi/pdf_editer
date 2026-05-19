import type { PDFDocumentProxy } from "pdfjs-dist";

let workerReady = false;
let pdfjsPromise: Promise<typeof import("pdfjs-dist")> | null = null;

async function loadPdfjs() {
  if (!pdfjsPromise) {
    pdfjsPromise = import("pdfjs-dist");
  }
  const pdfjs = await pdfjsPromise;
  if (!workerReady && typeof window !== "undefined") {
    pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url
  ).toString();
    workerReady = true;
  }
  return pdfjs;
}

export async function getPdfDocument(arrayBuffer: ArrayBuffer): Promise<PDFDocumentProxy> {
  const { getDocument } = await loadPdfjs();
  const data = new Uint8Array(arrayBuffer.slice(0));
  return getDocument({ data }).promise;
}
