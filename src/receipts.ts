// Receipt files as the admin attaches them: shrunk in the browser, stored under their payment.

/** File types the receipts bucket accepts (the file picker offers only these). */
export const RECEIPT_TYPES = "image/jpeg,image/png,image/heic,application/pdf,.heic";

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
