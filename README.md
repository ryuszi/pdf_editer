# PDF Canvas Editor

ブラウザ上でPDFをページ単位に編集できるWebアプリです。PDF本文の文字編集ではなく、ページの抽出、分割、削除、分離、結合、検索を直感的に行うことを目的にしています。

## 主な機能

- 複数PDFアップロード
- PDF表示、タブ切り替え、サムネイル選択
- ページ番号ジャンプ、ズーム
- ページ抽出、一点分割、ページ削除
- 1ページごと分離、選択ページ分離
- 複数PDF結合、PDFごとの範囲指定結合
- テキストPDF検索
- スキャンPDF向けのブラウザ内OCR検索
- クリック/範囲調整による数式LaTeX化

## 起動方法

```bash
pnpm install
pnpm dev
```

この環境で `pnpm` がない場合は、Node.jsとpnpmをインストールしてください。

## 数式LaTeX化サービス

Mathpixは使いません。無料OSSのPix2Textをローカルで動かします。

```bash
cd services/latex_ocr
python -m venv .venv
.venv\Scripts\activate
python -m pip install -r requirements.txt
python app.py
```

別ターミナルでNext.jsアプリを起動します。

```bash
pnpm dev
```

アプリ側は既定で `http://127.0.0.1:8765/recognize` に画像を送ります。変更する場合は `.env.local` に次を設定してください。

```bash
LATEX_OCR_API_URL=http://127.0.0.1:8765/recognize
```

初回はPix2Textのモデルダウンロードと読み込みで時間がかかります。

## OCR検索について

テキスト情報を持つPDFはPDF.jsで直接検索します。スキャンPDFはPDF.jsでページをcanvas画像化し、Tesseract.jsでOCRします。Tesseract.jsはPDFを直接処理しないため、ページ画像を順番にOCRします。初回は遅く、スキャン品質によって精度差があります。

## 技術スタック

Next.js, React, TypeScript, Tailwind CSS, PDF.js, pdf-lib, dnd-kit, Zustand, Tesseract.js, FastAPI, Pix2Text

## 未対応

- 翻訳機能
- Mathpix連携
- PDF本文の文字編集
- 本当の余白crop
- クラウド保存、ユーザーアカウント
