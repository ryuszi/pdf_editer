import { describe, expect, it } from "vitest";
import { PDFDocument } from "pdf-lib";
import type { UploadedPdf } from "@/types/pdf";
import {
  createPdfFromPages,
  mergePdfs,
  removePagesFromPdf,
  splitPdfAtPage
} from "@/lib/pdf/editPdf";

describe("PDF editing utilities", () => {
  it("extracts selected pages", async () => {
    const source = await makePdf("sample.pdf", 4);
    const bytes = await createPdfFromPages(source, [2, 4]);
    const out = await PDFDocument.load(bytes);
    expect(out.getPageCount()).toBe(2);
  });

  it("splits at a page", async () => {
    const source = await makePdf("sample.pdf", 5);
    const { first, second } = await splitPdfAtPage(source, 2);
    expect((await PDFDocument.load(first)).getPageCount()).toBe(2);
    expect((await PDFDocument.load(second)).getPageCount()).toBe(3);
  });

  it("removes pages and rejects removing everything", async () => {
    const source = await makePdf("sample.pdf", 3);
    const bytes = await removePagesFromPdf(source, [2]);
    expect((await PDFDocument.load(bytes)).getPageCount()).toBe(2);
    await expect(removePagesFromPdf(source, [1, 2, 3])).rejects.toThrow();
  });

  it("merges full PDFs and range selections", async () => {
    const a = await makePdf("a.pdf", 3);
    const b = await makePdf("b.pdf", 4);
    const bytes = await mergePdfs(
      [
        { pdfId: a.id, mode: "ranges", rangeText: "1,3", pages: [1, 3] },
        { pdfId: b.id, mode: "all", rangeText: "", pages: [] }
      ],
      [a, b]
    );
    expect((await PDFDocument.load(bytes)).getPageCount()).toBe(6);
  });
});

async function makePdf(fileName: string, pageCount: number): Promise<UploadedPdf> {
  const doc = await PDFDocument.create();
  for (let index = 0; index < pageCount; index += 1) {
    doc.addPage([200, 200]);
  }
  const bytes = await doc.save();
  const buffer = bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength
  ) as ArrayBuffer;
  return {
    id: crypto.randomUUID(),
    fileName,
    fileSize: bytes.byteLength,
    file: new File([buffer], fileName, { type: "application/pdf" }),
    arrayBuffer: buffer,
    objectUrl: "",
    pageCount,
    selectedPages: [],
    createdAt: Date.now()
  };
}
