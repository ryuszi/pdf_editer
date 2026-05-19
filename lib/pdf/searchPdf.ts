import type { SearchResult, UploadedPdf } from "@/types/pdf";
import { getPdfDocument } from "./pdfjs";

export async function searchTextPdf(
  pdf: UploadedPdf,
  query: string
): Promise<{ results: SearchResult[]; pagesWithText: number }> {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return { results: [], pagesWithText: 0 };

  const doc = await getPdfDocument(pdf.arrayBuffer);
  const results: SearchResult[] = [];
  let pagesWithText = 0;

  try {
    for (let pageNumber = 1; pageNumber <= doc.numPages; pageNumber += 1) {
      const page = await doc.getPage(pageNumber);
      const content = await page.getTextContent();
      const text = content.items
        .map((item) => ("str" in item ? item.str : ""))
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();
      if (text) pagesWithText += 1;

      const lower = text.toLowerCase();
      let index = lower.indexOf(normalizedQuery);
      while (index !== -1) {
        results.push({
          pdfId: pdf.id,
          pageNumber,
          text: createSnippet(text, index, query.length),
          matchIndex: index,
          source: "text"
        });
        index = lower.indexOf(normalizedQuery, index + normalizedQuery.length);
      }
    }
  } finally {
    await doc.destroy();
  }

  return { results, pagesWithText };
}

export function searchCachedOcr(
  pdf: UploadedPdf,
  query: string,
  pageText: Record<number, string>
): SearchResult[] {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return [];

  const results: SearchResult[] = [];
  for (let pageNumber = 1; pageNumber <= pdf.pageCount; pageNumber += 1) {
    const text = pageText[pageNumber] ?? "";
    const lower = text.toLowerCase();
    let index = lower.indexOf(normalizedQuery);
    while (index !== -1) {
      results.push({
        pdfId: pdf.id,
        pageNumber,
        text: createSnippet(text, index, query.length),
        matchIndex: index,
        source: "ocr"
      });
      index = lower.indexOf(normalizedQuery, index + normalizedQuery.length);
    }
  }
  return results;
}

function createSnippet(text: string, index: number, length: number) {
  const start = Math.max(0, index - 40);
  const end = Math.min(text.length, index + length + 40);
  return `${start > 0 ? "..." : ""}${text.slice(start, end)}${end < text.length ? "..." : ""}`;
}
