import { NextResponse } from "next/server";

export const runtime = "nodejs";

const DEFAULT_LATEX_OCR_URL = "http://127.0.0.1:8765/recognize";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const image = formData.get("image");
    if (!(image instanceof File)) {
      return NextResponse.json({ error: "画像ファイルがありません" }, { status: 400 });
    }

    const upstream = process.env.LATEX_OCR_API_URL ?? DEFAULT_LATEX_OCR_URL;
    const upstreamForm = new FormData();
    upstreamForm.append("image", image, image.name || "formula.png");

    const response = await fetch(upstream, {
      method: "POST",
      body: upstreamForm
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return NextResponse.json(
        {
          error:
            data.error ??
            data.detail ??
            "ローカルLaTeX OCRサービスに接続できません。npm run latex-ocr を起動してください。"
        },
        { status: response.status }
      );
    }

    return NextResponse.json({
      latex: data.latex ?? data.text ?? "",
      score: typeof data.score === "number" ? data.score : null
    });
  } catch (caught) {
    return NextResponse.json(
      {
        error:
          caught instanceof Error
            ? caught.message
            : "ローカルLaTeX OCRサービスへの接続に失敗しました"
      },
      { status: 503 }
    );
  }
}
