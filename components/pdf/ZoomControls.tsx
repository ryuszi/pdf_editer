"use client";

import { Minus, Plus } from "lucide-react";
import { usePdfStore } from "@/store/usePdfStore";

export function ZoomControls() {
  const zoom = usePdfStore((state) => state.zoom);
  const setZoom = usePdfStore((state) => state.setZoom);

  return (
    <div className="flex items-center gap-1 rounded-md border border-line bg-white p-1">
      <button
        className="flex h-7 w-7 items-center justify-center rounded hover:bg-slate-100"
        type="button"
        aria-label="縮小"
        onClick={() => setZoom(zoom - 0.1)}
      >
        <Minus size={15} aria-hidden />
      </button>
      <span className="w-14 text-center text-xs font-medium">{Math.round(zoom * 100)}%</span>
      <button
        className="flex h-7 w-7 items-center justify-center rounded hover:bg-slate-100"
        type="button"
        aria-label="拡大"
        onClick={() => setZoom(zoom + 0.1)}
      >
        <Plus size={15} aria-hidden />
      </button>
    </div>
  );
}
