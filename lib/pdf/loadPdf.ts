import type { UploadedPdf } from "@/types/pdf";
import { getPdfDocument } from "./pdfjs";

export async function loadPdfFile(file: File): Promise<UploadedPdf> {
  if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
    throw new Error("PDFファイルのみ対応しています");
  }

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await getPdfDocument(arrayBuffer);
  const pageCount = pdf.numPages;
  await pdf.destroy();

  return {
    id: crypto.randomUUID(),
    fileName: file.name,
    fileSize: file.size,
    file,
    arrayBuffer,
    objectUrl: URL.createObjectURL(file),
    pageCount,
    selectedPages: [],
    createdAt: Date.now()
  };
}
