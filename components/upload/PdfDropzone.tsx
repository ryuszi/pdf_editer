"use client";

import { useCallback, useRef, useState } from "react";
import { Upload } from "lucide-react";
import { loadPdfFile } from "@/lib/pdf/loadPdf";
import { usePdfStore } from "@/store/usePdfStore";

type PdfDropzoneProps = {
  compact?: boolean;
};

export function PdfDropzone({ compact = false }: PdfDropzoneProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const addPdfs = usePdfStore((state) => state.addPdfs);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files);
      if (!fileArray.length) return;
      setError("");
      setLoading(true);
      try {
        const invalid = fileArray.find(
          (file) => file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")
        );
        if (invalid) throw new Error("PDFファイルのみ対応しています");
        const loaded = await Promise.all(fileArray.map(loadPdfFile));
        addPdfs(loaded);
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "PDFの読み込みに失敗しました");
      } finally {
        setLoading(false);
        if (inputRef.current) inputRef.current.value = "";
      }
    },
    [addPdfs]
  );

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          className="hidden"
          type="file"
          accept="application/pdf,.pdf"
          multiple
          onChange={(event) => event.target.files && handleFiles(event.target.files)}
        />
        <button
          className="inline-flex h-9 items-center gap-2 rounded-md bg-accent px-3 text-sm font-medium text-white hover:bg-blue-700"
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={loading}
        >
          <Upload size={16} aria-hidden />
          {loading ? "読込中" : "PDF追加"}
        </button>
        {error ? <span className="max-w-64 truncate text-xs text-berry">{error}</span> : null}
      </div>
    );
  }

  return (
    <div
      className="rounded-lg border-2 border-dashed border-line bg-panel p-8 text-center"
      onDragOver={(event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = "copy";
      }}
      onDrop={(event) => {
        event.preventDefault();
        handleFiles(event.dataTransfer.files);
      }}
    >
      <input
        ref={inputRef}
        className="hidden"
        type="file"
        accept="application/pdf,.pdf"
        multiple
        onChange={(event) => event.target.files && handleFiles(event.target.files)}
      />
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-accent">
        <Upload size={24} aria-hidden />
      </div>
      <h1 className="mb-2 text-xl font-semibold">PDFをアップロード</h1>
      <p className="mb-5 text-sm text-slate-600">
        複数PDFをドラッグするか、ボタンから選択してください。ファイルはブラウザ内で処理します。
      </p>
      <button
        className="inline-flex h-10 items-center gap-2 rounded-md bg-accent px-4 text-sm font-medium text-white hover:bg-blue-700"
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={loading}
      >
        <Upload size={17} aria-hidden />
        {loading ? "読み込み中" : "PDFを選択"}
      </button>
      {error ? <p className="mt-4 text-sm text-berry">{error}</p> : null}
    </div>
  );
}
