export type LatexRecognitionResponse = {
  latex: string;
  score: number | null;
};

export async function recognizeLatexImage(blob: Blob): Promise<LatexRecognitionResponse> {
  const formData = new FormData();
  formData.append("image", blob, "formula.png");

  const response = await fetch("/api/latex-ocr", {
    method: "POST",
    body: formData
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error ?? "LaTeX OCRに失敗しました");
  }

  return {
    latex: data.latex ?? "",
    score: typeof data.score === "number" ? data.score : null
  };
}
