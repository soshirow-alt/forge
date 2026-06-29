const MAX_THUMBNAIL_EDGE_PX = 1280;
const MAX_DATA_URL_CHARS = 520_000;
const INITIAL_JPEG_QUALITY = 0.85;
const MIN_JPEG_QUALITY = 0.55;

function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("画像の読み込みに失敗しました。"));
    };
    image.src = objectUrl;
  });
}

function canvasToJpegDataUrl(canvas: HTMLCanvasElement, quality: number): string {
  return canvas.toDataURL("image/jpeg", quality);
}

async function compressImageFile(file: File): Promise<string> {
  const image = await loadImageFromFile(file);
  const longestEdge = Math.max(image.naturalWidth, image.naturalHeight);
  const scale =
    longestEdge > MAX_THUMBNAIL_EDGE_PX ? MAX_THUMBNAIL_EDGE_PX / longestEdge : 1;
  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("画像の処理に失敗しました。");
  }

  context.drawImage(image, 0, 0, width, height);

  let quality = INITIAL_JPEG_QUALITY;
  let dataUrl = canvasToJpegDataUrl(canvas, quality);

  while (dataUrl.length > MAX_DATA_URL_CHARS && quality > MIN_JPEG_QUALITY) {
    quality -= 0.08;
    dataUrl = canvasToJpegDataUrl(canvas, quality);
  }

  if (dataUrl.length > MAX_DATA_URL_CHARS) {
    throw new Error(
      "画像が大きすぎます。別の画像を選ぶか、解像度を下げてから再度お試しください。",
    );
  }

  return dataUrl;
}

export function readImageAsDataUrl(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) {
    return Promise.reject(new Error("画像ファイルを選んでください。"));
  }

  return compressImageFile(file);
}
