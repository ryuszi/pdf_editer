"use client";

import { useEffect, useMemo, useState } from "react";
import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import type { MergeItem, UploadedPdf } from "@/types/pdf";
import { downloadPdf } from "@/lib/pdf/download";
import { mergePdfs } from "@/lib/pdf/editPdf";
import { parsePageRange } from "@/lib/pdf/pageRange";
import { usePdfStore } from "@/store/usePdfStore";

export function MergePanel() {
  const pdfs = usePdfStore((state) => state.pdfs);
  const [items, setItems] = useState<MergeItem[]>([]);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const sensors = useSensors(useSensor(PointerSensor));

  useEffect(() => {
    setItems((current) => {
      const existing = new Map(current.map((item) => [item.pdfId, item]));
      return pdfs.map((pdf) => existing.get(pdf.id) ?? { pdfId: pdf.id, mode: "all", rangeText: "", pages: [] });
    });
  }, [pdfs]);

  const canMerge = pdfs.length >= 2;

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setItems((current) => {
      const oldIndex = current.findIndex((item) => item.pdfId === active.id);
      const newIndex = current.findIndex((item) => item.pdfId === over.id);
      return arrayMove(current, oldIndex, newIndex);
    });
  };

  const updateItem = (pdfId: string, patch: Partial<MergeItem>) => {
    setItems((current) =>
      current.map((item) => (item.pdfId === pdfId ? { ...item, ...patch } : item))
    );
  };

  const normalizedItems = useMemo(() => {
    return items.map((item) => {
      const pdf = pdfs.find((candidate) => candidate.id === item.pdfId);
      if (!pdf || item.mode === "all") return { ...item, pages: [] };
      return { ...item, pages: parsePageRange(item.rangeText, pdf.pageCount) };
    });
  }, [items, pdfs]);

  const handleMerge = async () => {
    setBusy(true);
    setMessage("");
    try {
      const bytes = await mergePdfs(normalizedItems, pdfs);
      downloadPdf(bytes, "merged.pdf");
      setMessage("結合PDFをダウンロードしました");
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : "結合に失敗しました");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="space-y-4">
      <h2 className="text-base font-semibold">PDF結合</h2>
      {!canMerge ? <p className="text-sm text-slate-500">結合には2つ以上のPDFが必要です。</p> : null}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={items.map((item) => item.pdfId)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {items.map((item) => {
              const pdf = pdfs.find((candidate) => candidate.id === item.pdfId);
              if (!pdf) return null;
              return <MergeRow key={item.pdfId} item={item} pdf={pdf} onChange={updateItem} />;
            })}
          </div>
        </SortableContext>
      </DndContext>
      <button className="primary-btn w-full" type="button" onClick={handleMerge} disabled={!canMerge || busy}>
        指定順で結合
      </button>
      {message ? <p className="rounded border border-line bg-slate-50 p-2 text-sm">{message}</p> : null}
    </section>
  );
}

function MergeRow({
  item,
  pdf,
  onChange
}: {
  item: MergeItem;
  pdf: UploadedPdf;
  onChange: (pdfId: string, patch: Partial<MergeItem>) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: item.pdfId
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  };

  return (
    <div ref={setNodeRef} style={style} className="rounded border border-line bg-white p-2">
      <div className="mb-2 flex items-center gap-2">
        <button
          className="flex h-7 w-7 items-center justify-center rounded bg-slate-100"
          type="button"
          aria-label="並び替え"
          {...attributes}
          {...listeners}
        >
          <GripVertical size={15} aria-hidden />
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{pdf.fileName}</p>
          <p className="text-xs text-slate-500">{pdf.pageCount}ページ</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <label className="flex items-center gap-2 text-xs">
          <input
            type="radio"
            checked={item.mode === "all"}
            onChange={() => onChange(pdf.id, { mode: "all" })}
          />
          全ページ
        </label>
        <label className="flex items-center gap-2 text-xs">
          <input
            type="radio"
            checked={item.mode === "ranges"}
            onChange={() => onChange(pdf.id, { mode: "ranges" })}
          />
          範囲指定
        </label>
      </div>
      {item.mode === "ranges" ? (
        <input
          className="field mt-2"
          value={item.rangeText}
          onChange={(event) => onChange(pdf.id, { rangeText: event.target.value })}
          placeholder="例: 1-3,8"
        />
      ) : null}
    </div>
  );
}
