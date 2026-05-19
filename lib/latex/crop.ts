import type { FormulaSelection } from "@/types/pdf";

export function cropCanvasToBlob(
  canvas: HTMLCanvasElement,
  selection: FormulaSelection
): Promise<{ blob: Blob; dataUrl: string }> {
  const cropCanvas = document.createElement("canvas");
  const x = Math.max(0, Math.floor(selection.x));
  const y = Math.max(0, Math.floor(selection.y));
  const width = Math.min(canvas.width - x, Math.max(1, Math.floor(selection.width)));
  const height = Math.min(canvas.height - y, Math.max(1, Math.floor(selection.height)));
  cropCanvas.width = width;
  cropCanvas.height = height;
  const context = cropCanvas.getContext("2d");
  if (!context) throw new Error("クロップ用Canvasを初期化できませんでした");
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, width, height);
  context.drawImage(canvas, x, y, width, height, 0, 0, width, height);
  const dataUrl = cropCanvas.toDataURL("image/png");

  return new Promise((resolve, reject) => {
    cropCanvas.toBlob((blob) => {
      if (!blob) reject(new Error("画像の切り出しに失敗しました"));
      else resolve({ blob, dataUrl });
    }, "image/png");
  });
}
