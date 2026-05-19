import { PDFDocument } from "pdf-lib";
import type { MergeItem, UploadedPdf } from "@/types/pdf";

const toZeroBased = (pageNumber: number) => pageNumber - 1;

export async function createPdfFromPages(
  source: UploadedPdf,
  pages: number[]
): Promise<Uint8Array> {
  if (!pages.length) throw new Error("ページが選択されていません");
  const sourceDoc = await PDFDocument.load(source.arrayBuffer.slice(0));
  const outDoc = await PDFDocument.create();
  const copied = await outDoc.copyPages(sourceDoc, pages.map(toZeroBased));
  copied.forEach((page) => outDoc.addPage(page));
  return outDoc.save();
}

export async function splitPdfAtPage(
  source: UploadedPdf,
  splitPage: number
): Promise<{ first: Uint8Array; second: Uint8Array }> {
  if (splitPage < 1 || splitPage >= source.pageCount) {
    throw new Error("分割後の後半が空になります");
  }

  const firstPages = Array.from({ length: splitPage }, (_, index) => index + 1);
  const secondPages = Array.from(
    { length: source.pageCount - splitPage },
    (_, index) => splitPage + index + 1
  );

  return {
    first: await createPdfFromPages(source, firstPages),
    second: await createPdfFromPages(source, secondPages)
  };
}

export async function removePagesFromPdf(
  source: UploadedPdf,
  pagesToRemove: number[]
): Promise<Uint8Array> {
  const removeSet = new Set(pagesToRemove);
  const remaining = Array.from({ length: source.pageCount }, (_, index) => index + 1).filter(
    (page) => !removeSet.has(page)
  );
  if (!remaining.length) throw new Error("全ページを削除することはできません");
  return createPdfFromPages(source, remaining);
}

export async function mergePdfs(items: MergeItem[], pdfs: UploadedPdf[]): Promise<Uint8Array> {
  if (items.length < 2) throw new Error("結合には2つ以上のPDFが必要です");
  const outDoc = await PDFDocument.create();

  for (const item of items) {
    const source = pdfs.find((pdf) => pdf.id === item.pdfId);
    if (!source) throw new Error("結合対象のPDFが見つかりません");
    const sourceDoc = await PDFDocument.load(source.arrayBuffer.slice(0));
    const pages =
      item.mode === "all"
        ? Array.from({ length: source.pageCount }, (_, index) => index)
        : item.pages.map(toZeroBased);
    if (!pages.length) throw new Error(`${source.fileName} のページ範囲が空です`);
    const copied = await outDoc.copyPages(sourceDoc, pages);
    copied.forEach((page) => outDoc.addPage(page));
  }

  return outDoc.save();
}
