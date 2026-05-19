export type LatexRecognitionResponse = {
  latex: string;
  score: number | null;
};

export async function recognizeLatexImage(blob: Blob): Promise<LatexRecognitionResponse> {
  const formData = new FormData();
  formData.append("image", blob, "formula.png");

  const endpoint = getLatexOcrEndpoint();
  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: "POST",
      body: formData
    });
  } catch {
    throw new Error(
      `LaTeX OCRサービスに接続できません。ローカルで start-latex-ocr.cmd を起動してから再試行してください。接続先: ${endpoint}`
    );
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(
      data.error ??
        data.detail ??
        `LaTeX OCRに失敗しました。start-latex-ocr.cmd が起動中か確認してください。接続先: ${endpoint}`
    );
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
