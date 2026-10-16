import { readFile } from "node:fs/promises";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

/** A PDF's text, one entry per line on the page: the pieces at the same height, left to right. */
export async function pdfLines(path: string): Promise<string[]> {
  const pdf = await getDocument({ data: new Uint8Array(await readFile(path)) }).promise;
  const lines: string[] = [];
  for (let n = 1; n <= pdf.numPages; n++) {
    const page = await pdf.getPage(n);
    const byHeight = new Map<number, { x: number; text: string }[]>();
    for (const item of (await page.getTextContent()).items) {
      if (!("str" in item) || item.str.trim() === "") continue;
      const [, , , , x = 0, y = 0] = item.transform as number[];
      const height = Math.round(y);
      byHeight.set(height, [...(byHeight.get(height) ?? []), { x, text: item.str.trim() }]);
    }
    const topDown = [...byHeight.entries()].sort(([a], [b]) => b - a);
    for (const [, pieces] of topDown) {
      lines.push(
        pieces
          .sort((a, b) => a.x - b.x)
          .map((piece) => piece.text)
          .join(" "),
      );
    }
  }
  return lines;
}
