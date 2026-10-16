// Receipt files as the admin attaches them: shrunk in the browser, stored under their payment.

/**
 * File types the receipts bucket accepts (the file picker offers only these). Keep in step with
 * allowed_mime_types in supabase/migrations/0006_receipts_storage.sql.
 */
export const RECEIPT_TYPES = "image/jpeg,image/png,image/heic,application/pdf,.heic";

const TYPES_BY_EXTENSION: Partial<Record<string, string>> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  heic: "image/heic",
  pdf: "application/pdf",
};

/** A file's type; from its name when the browser gives none (HEIC on Chrome for Android). */
export function receiptType(file: File): string {
  const extension = file.name.slice(file.name.lastIndexOf(".") + 1).toLowerCase();
  return file.type !== "" ? file.type : (TYPES_BY_EXTENSION[extension] ?? "");
}

/**
 * Where a receipt is stored: {period_end}/{payment_id}/{random}-{file name}. The random part
 * keeps two files with the same name apart; the name is cut to characters Storage accepts.
 */
export function receiptPath(periodEnd: string, paymentId: string, fileName: string): string {
  const safeName = fileName.replace(/[^A-Za-z0-9._-]/g, "_");
  return `${periodEnd}/${paymentId}/${crypto.randomUUID().slice(0, 8)}-${safeName}`;
}

/** The file name a receipt was attached with: "slip.jpg" for ".../1a2b3c4d-slip.jpg". */
export function receiptName(path: string): string {
  const file = path.slice(path.lastIndexOf("/") + 1);
  return file.slice(file.indexOf("-") + 1);
}

export const isPdf = (name: string) => name.toLowerCase().endsWith(".pdf");

const MAX_SIDE = 1600;
const JPEG_QUALITY = 0.8;

/** "slip.jpg" for "slip.png". */
const asJpegName = (name: string) => `${name.replace(/\.[^.]*$/, "")}.jpg`;

/**
 * An image as a JPEG at most 1600 px on its longest side; a PDF, or an image the browser can't
 * decode (HEIC outside Safari), as it is.
 */
export async function shrunk(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) return file;
  const bitmap = await createImageBitmap(file).catch(() => null);
  if (bitmap === null) return file;
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const context = canvas.getContext("2d");
  if (context === null) return file;
  context.fillStyle = "#ffffff"; // JPEG has no transparency: see-through parts turn white
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const jpeg = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY);
  });
  return jpeg === null ? file : new File([jpeg], asJpegName(file.name), { type: "image/jpeg" });
}
