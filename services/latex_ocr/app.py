from __future__ import annotations

import io
import os
from typing import Any

import uvicorn
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image

app = FastAPI(title="PDF Canvas Editor LaTeX OCR", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

_latex_ocr: Any | None = None


def get_latex_ocr() -> Any:
    global _latex_ocr
    if _latex_ocr is not None:
        return _latex_ocr
    try:
        from pix2text.latex_ocr import LatexOCR
    except Exception as exc:  # pragma: no cover - environment guidance
        raise RuntimeError(
            "pix2text is not installed. Run: python -m pip install -r services/latex_ocr/requirements.txt"
        ) from exc

    model_root = os.environ.get("PIX2TEXT_MODEL_ROOT")
    _latex_ocr = LatexOCR(root=model_root) if model_root else LatexOCR()
    return _latex_ocr


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/recognize")
async def recognize(image: UploadFile = File(...)) -> dict[str, Any]:
    if image.content_type and image.content_type not in {"image/png", "image/jpeg", "image/webp"}:
        raise HTTPException(status_code=400, detail="PNG/JPEG/WebP images are supported")

    payload = await image.read()
    try:
        pil_image = Image.open(io.BytesIO(payload)).convert("RGB")
    except Exception as exc:
        raise HTTPException(status_code=400, detail="Could not read the image") from exc

    try:
        result = get_latex_ocr().recognize(pil_image)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    if isinstance(result, dict):
        return {
            "latex": result.get("text", ""),
            "score": result.get("score"),
        }
    return {"latex": str(result), "score": None}


if __name__ == "__main__":
    uvicorn.run(
        "app:app",
        host=os.environ.get("LATEX_OCR_HOST", "127.0.0.1"),
        port=int(os.environ.get("LATEX_OCR_PORT", "8765")),
        reload=False,
    )
