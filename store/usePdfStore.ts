"use client";

import { create } from "zustand";
import type {
  FormulaResult,
  FormulaSelection,
  OcrCache,
  SearchResult,
  UploadedPdf
} from "@/types/pdf";

type PdfStore = {
  pdfs: UploadedPdf[];
  activePdfId: string | null;
  zoom: number;
  currentPage: number;
  searchQuery: string;
  searchResults: SearchResult[];
  activeSearchIndex: number;
  ocrCache: OcrCache;
  formulaMode: boolean;
  formulaSelection: FormulaSelection | null;
  formulaResult: FormulaResult;
  addPdfs: (pdfs: UploadedPdf[]) => void;
  removePdf: (pdfId: string) => void;
  setActivePdf: (pdfId: string) => void;
  setZoom: (zoom: number) => void;
  setCurrentPage: (pageNumber: number) => void;
  setSearchQuery: (query: string) => void;
  setSearchResults: (results: SearchResult[]) => void;
  setActiveSearchIndex: (index: number) => void;
  togglePageSelection: (pdfId: string, pageNumber: number) => void;
  setSelectedPages: (pdfId: string, pages: number[]) => void;
  clearSelectedPages: (pdfId: string) => void;
  selectAllPages: (pdfId: string) => void;
  setOcrText: (pdfId: string, pageNumber: number, text: string) => void;
  setFormulaMode: (enabled: boolean) => void;
  setFormulaSelection: (selection: FormulaSelection | null) => void;
  setFormulaResult: (result: Partial<FormulaResult>) => void;
};

const emptyFormulaResult: FormulaResult = {
  status: "idle",
  latex: "",
  score: null,
  error: null,
  previewDataUrl: null,
  updatedAt: null
};

const clampZoom = (zoom: number) => Math.min(3, Math.max(0.25, zoom));
const uniqueSorted = (pages: number[]) => Array.from(new Set(pages)).sort((a, b) => a - b);

export const usePdfStore = create<PdfStore>((set) => ({
  pdfs: [],
  activePdfId: null,
  zoom: 1,
  currentPage: 1,
  searchQuery: "",
  searchResults: [],
  activeSearchIndex: -1,
  ocrCache: {},
  formulaMode: false,
  formulaSelection: null,
  formulaResult: emptyFormulaResult,

  addPdfs: (newPdfs) =>
    set((state) => ({
      pdfs: [...state.pdfs, ...newPdfs],
      activePdfId: state.activePdfId ?? newPdfs[0]?.id ?? null,
      currentPage: state.activePdfId ? state.currentPage : 1
    })),

  removePdf: (pdfId) =>
    set((state) => {
      const target = state.pdfs.find((pdf) => pdf.id === pdfId);
      if (target) URL.revokeObjectURL(target.objectUrl);
      const pdfs = state.pdfs.filter((pdf) => pdf.id !== pdfId);
      const activePdfId =
        state.activePdfId === pdfId ? pdfs[0]?.id ?? null : state.activePdfId;
      return {
        pdfs,
        activePdfId,
        currentPage: 1,
        searchResults: state.searchResults.filter((result) => result.pdfId !== pdfId),
        activeSearchIndex: -1,
        formulaSelection:
          state.formulaSelection?.pdfId === pdfId ? null : state.formulaSelection
      };
    }),

  setActivePdf: (pdfId) =>
    set({
      activePdfId: pdfId,
      currentPage: 1,
      activeSearchIndex: -1,
      formulaSelection: null,
      formulaResult: emptyFormulaResult
    }),

  setZoom: (zoom) => set({ zoom: clampZoom(zoom) }),
  setCurrentPage: (pageNumber) => set({ currentPage: pageNumber }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setSearchResults: (results) =>
    set({ searchResults: results, activeSearchIndex: results.length ? 0 : -1 }),
  setActiveSearchIndex: (index) => set({ activeSearchIndex: index }),

  togglePageSelection: (pdfId, pageNumber) =>
    set((state) => ({
      pdfs: state.pdfs.map((pdf) => {
        if (pdf.id !== pdfId) return pdf;
        const selected = pdf.selectedPages.includes(pageNumber)
          ? pdf.selectedPages.filter((page) => page !== pageNumber)
          : [...pdf.selectedPages, pageNumber];
        return { ...pdf, selectedPages: uniqueSorted(selected) };
      })
    })),

  setSelectedPages: (pdfId, pages) =>
    set((state) => ({
      pdfs: state.pdfs.map((pdf) =>
        pdf.id === pdfId ? { ...pdf, selectedPages: uniqueSorted(pages) } : pdf
      )
    })),

  clearSelectedPages: (pdfId) =>
    set((state) => ({
      pdfs: state.pdfs.map((pdf) =>
        pdf.id === pdfId ? { ...pdf, selectedPages: [] } : pdf
      )
    })),

  selectAllPages: (pdfId) =>
    set((state) => ({
      pdfs: state.pdfs.map((pdf) =>
        pdf.id === pdfId
          ? {
              ...pdf,
              selectedPages: Array.from({ length: pdf.pageCount }, (_, index) => index + 1)
            }
          : pdf
      )
    })),

  setOcrText: (pdfId, pageNumber, text) =>
    set((state) => ({
      ocrCache: {
        ...state.ocrCache,
        [pdfId]: {
          ...(state.ocrCache[pdfId] ?? {}),
          [pageNumber]: text
        }
      }
    })),

  setFormulaMode: (enabled) => set({ formulaMode: enabled }),
  setFormulaSelection: (selection) => set({ formulaSelection: selection }),
  setFormulaResult: (result) =>
    set((state) => ({
      formulaResult: {
        ...state.formulaResult,
        ...result,
        updatedAt: Date.now()
      }
    }))
}));
