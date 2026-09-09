import * as XLSX from "xlsx";

// Export array of objects ke file Excel (.xlsx)
export function exportToExcel<T extends object>(
  data: T[],
  filename: string,
  sheetName = "Sheet1"
) {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName.slice(0, 30));
  XLSX.writeFile(workbook, filename);
}

// Export multiple sheets ke satu file Excel
export function exportMultiSheetExcel(
  sheets: { name: string; data: object[] }[],
  filename: string
) {
  const workbook = XLSX.utils.book_new();
  const dipakai = new Set<string>();
  sheets.forEach((s, i) => {
    let nama = (s.name || `Sheet${i + 1}`).replace(/[\\/*?:[\]]/g, "").slice(0, 28);
    while (dipakai.has(nama)) nama = nama.slice(0, 25) + "_" + i;
    dipakai.add(nama);
    const worksheet = XLSX.utils.json_to_sheet(s.data);
    XLSX.utils.book_append_sheet(workbook, worksheet, nama);
  });
  XLSX.writeFile(workbook, filename);
}

// Import file Excel dan return array of objects
export async function importFromExcel(
  file: File
): Promise<Record<string, unknown>[]> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array", cellDates: true });
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json<Record<string, unknown>>(firstSheet, {
    defval: "",
    raw: false,
  });
  return data;
}

/** Ubah berbagai bentuk nilai tanggal dari Excel menjadi yyyy-mm-dd */
export function excelToISODate(value: unknown): string {
  if (value === null || value === undefined || value === "") return "";
  if (value instanceof Date && !isNaN(value.getTime())) {
    const y = value.getFullYear();
    const m = String(value.getMonth() + 1).padStart(2, "0");
    const d = String(value.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  const s = String(value).trim();
  if (!s) return "";
  // Sudah yyyy-mm-dd
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  // dd-mm-yyyy atau dd/mm/yyyy
  const m1 = s.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (m1) {
    return `${m1[3]}-${m1[2].padStart(2, "0")}-${m1[1].padStart(2, "0")}`;
  }
  // yyyy/mm/dd
  const m2 = s.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
  if (m2) {
    return `${m2[1]}-${m2[2].padStart(2, "0")}-${m2[3].padStart(2, "0")}`;
  }
  // Angka serial Excel
  const serial = Number(s);
  if (Number.isFinite(serial) && serial > 20000 && serial < 60000) {
    const epoch = new Date(Date.UTC(1899, 11, 30));
    const d = new Date(epoch.getTime() + serial * 86400000);
    return d.toISOString().slice(0, 10);
  }
  return s;
}

/** Unduh file template Excel berisi header yang benar */
export function downloadTemplate(
  headers: string[],
  contoh: Record<string, unknown>[],
  filename: string,
  sheetName = "Template"
) {
  const baris = contoh.length > 0 ? contoh : [Object.fromEntries(headers.map((h) => [h, ""]))];
  const worksheet = XLSX.utils.json_to_sheet(baris, { header: headers });
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName.slice(0, 30));
  XLSX.writeFile(workbook, filename);
}
