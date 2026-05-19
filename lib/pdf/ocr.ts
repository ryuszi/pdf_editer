import type { UploadedPdf } from "@/types/pdf";
import { getPdfDocument } from "./pdfjs";

type OcrProgress = {
  pageNumber: number;
  totalPages: number;
  status: string;
  progress: number;
};

type TesseractWorker = {
  recognize: (image: string) => Promise<{ data: { text: string } }>;
  terminate: () => Promise<unknown>;
};

let workerPromise: Promise<TesseractWorker> | null = null;

async function getWorker(): Promise<TesseractWorker> {
  if (!workerPromise) {
    workerPromise = import("tesseract.js").then(async ({ createWorker }) => {
      return createWorker("eng") as Promise<TesseractWorker>;
    });
  }
  return workerPromise as Promise<TesseractWorker>;
}

export async function ocrPdfPages(
  pdf: UploadedPdf,
  onPageText: (pageNumber: number, text: string) => void,
  onProgress?: (progress: OcrProgress) => void
) {
  const doc = await getPdfDocument(pdf.arrayBuffer);
  const worker = await getWorker();

  try {
    for (let pageNumber = 1; pageNumber <= doc.numPages; pageNumber += 1) {
      onProgress?.({ pageNumber, totalPages: doc.numPages, status: "render", progress: 0 });
      const page = await doc.getPage(pageNumber);
      const viewport = page.getViewport({ scale: 2 });
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Canvasを初期化できませんでした");
      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);
      await page.render({ canvas, canvasContext: context, viewport }).promise;

      onProgress?.({ pageNumber, totalPages: doc.numPages, status: "ocr", progress: 0.35 });
      const result = await worker.recognize(canvas.toDataURL("image/png"));
      onPageText(pageNumber, result.data.text);
      onProgress?.({ pageNumber, totalPages: doc.numPages, status: "done", progress: 1 });
    }
  } finally {
    await doc.destroy();
  }
}

export async function terminateOcrWorker() {
  if (!workerPromise) return;
  const worker = await workerPromise;
  await worker.terminate();
  workerPromise = null;
}
