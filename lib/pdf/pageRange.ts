export class PageRangeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PageRangeError";
  }
}

export function parsePageRange(input: string, maxPage: number): number[] {
  const trimmed = input.trim();
  if (!trimmed) throw new PageRangeError("ページ範囲を入力してください");
  if (!Number.isInteger(maxPage) || maxPage < 1) {
    throw new PageRangeError("PDFのページ数が不正です");
  }

  const pages: number[] = [];
  const parts = trimmed.split(",").map((part) => part.trim());

  for (const part of parts) {
    if (!part) throw new PageRangeError("ページ範囲の表記が不正です");

    if (part.includes("-")) {
      const rangeParts = part.split("-").map((value) => value.trim());
      if (rangeParts.length !== 2) {
        throw new PageRangeError("範囲指定は 3-8 の形式で入力してください");
      }
      const start = parsePositiveInteger(rangeParts[0]);
      const end = parsePositiveInteger(rangeParts[1]);
      validatePage(start, maxPage);
      validatePage(end, maxPage);
      if (start > end) throw new PageRangeError("範囲の開始ページが終了ページを超えています");
      for (let page = start; page <= end; page += 1) pages.push(page);
    } else {
      const page = parsePositiveInteger(part);
      validatePage(page, maxPage);
      pages.push(page);
    }
  }

  return Array.from(new Set(pages)).sort((a, b) => a - b);
}

export function pagesToRangeText(pages: number[]): string {
  return Array.from(new Set(pages))
    .sort((a, b) => a - b)
    .join(",");
}

function parsePositiveInteger(value: string): number {
  if (!/^\d+$/.test(value)) throw new PageRangeError("ページ番号は数字で入力してください");
  return Number(value);
}

function validatePage(page: number, maxPage: number) {
  if (page < 1) throw new PageRangeError("ページ番号は1以上で入力してください");
  if (page > maxPage) {
    throw new PageRangeError(`ページ番号は最大${maxPage}ページまでです`);
  }
}
