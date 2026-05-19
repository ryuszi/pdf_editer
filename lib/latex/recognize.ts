export type LatexRecognitionResponse = {
  latex: string;
  score: number | null;
};

export async function recognizeLatexImage(blob: Blob): Promise<LatexRecognitionResponse> {
  const formData = new FormData();
  formData.append("image", blob, "formula.png");

  const response = await fetch(getLatexOcrEndpoint(), {
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

function getLatexOcrEndpoint() {
  if (process.env.NEXT_PUBLIC_LATEX_OCR_API_URL) {
    return process.env.NEXT_PUBLIC_LATEX_OCR_API_URL;
  }

  if (typeof window !== "undefined" && window.location.hostname.endsWith("github.io")) {
    return "http://127.0.0.1:8765/recognize";
  }

  return "/api/latex-ocr";
}
