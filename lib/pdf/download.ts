export function downloadPdf(bytes: Uint8Array, fileName: string) {
  const buffer = bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength
  ) as ArrayBuffer;
  downloadBlob(new Blob([buffer], { type: "application/pdf" }), fileName);
}

export function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function safePdfName(fileName: string) {
  return fileName.replace(/\.pdf$/i, "").replace(/[\\/:*?"<>|]/g, "_");
}
