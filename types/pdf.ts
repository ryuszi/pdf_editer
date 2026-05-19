export type UploadedPdf = {
  id: string;
  fileName: string;
  fileSize: number;
  file: File;
  arrayBuffer: ArrayBuffer;
  objectUrl: string;
  pageCount: number;
  selectedPages: number[];
  createdAt: number;
};

export type SearchResult = {
  pdfId: string;
  pageNumber: number;
  text: string;
  matchIndex: number;
  source: "text" | "ocr";
};

export type MergeItem = {
  pdfId: string;
  mode: "all" | "ranges";
  rangeText: string;
  pages: number[];
};

export type FormulaSelection = {
  pdfId: string;
  pageNumber: number;
  x: number;
  y: number;
  width: number;
  height: number;
};

export type FormulaResult = {
  status: "idle" | "loading" | "success" | "error";
  latex: string;
  score: number | null;
  error: string | null;
  previewDataUrl: string | null;
  updatedAt: number | null;
};

export type OcrCache = Record<string, Record<number, string>>;
