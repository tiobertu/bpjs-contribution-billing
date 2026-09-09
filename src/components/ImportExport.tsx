import { useRef, useState } from "react";
import { Button } from "./ui";
import { exportToExcel, importFromExcel, downloadTemplate } from "../utils/excel";
import { cn } from "../utils/cn";

export type ImportMode = "merge" | "replace";

interface ImportExportProps {
  /** data siap export (sudah berupa header ramah pengguna) */
  data: object[];
  filename: string;
  sheetName?: string;
  /** mapping judul kolom Excel -> nama field internal */
  headers?: Record<string, string>;
  onImport: (rows: Record<string, unknown>[], mode: ImportMode) => void;
  /** header untuk file template */
  templateHeaders?: string[];
  templateContoh?: Record<string, unknown>[];
  /** teks bantuan tambahan pada dialog */
  keterangan?: string;
}

export function ImportExport({
  data,
  filename,
  sheetName,
  headers,
  onImport,
  templateHeaders,
  templateContoh,
  keterangan,
}: ImportExportProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dialog, setDialog] = useState<{
    rows: Record<string, unknown>[];
    namaFile: string;
  } | null>(null);
  const [mode, setMode] = useState<ImportMode>("merge");

  function handleExport() {
    if (data.length === 0) {
      alert("Tidak ada data untuk di-export.");
      return;
    }
    exportToExcel(data, filename, sheetName);
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const rows = await importFromExcel(file);
      if (rows.length === 0) {
        alert("File Excel kosong atau tidak memiliki baris data.");
        e.target.value = "";
        return;
      }
      // Petakan judul kolom Excel -> field internal
      const mapped = rows.map((row) => {
        if (!headers) return row;
        const obj: Record<string, unknown> = {};
        Object.entries(headers).forEach(([excelKey, field]) => {
          if (row[excelKey] !== undefined && row[excelKey] !== "") {
            obj[field] = row[excelKey];
          } else if (
            obj[field] === undefined &&
            row[field] !== undefined &&
            row[field] !== ""
          ) {
            obj[field] = row[field];
          }
        });
        return obj;
      });
      setMode("merge");
      setDialog({ rows: mapped, namaFile: file.name });
    } catch (err) {
      console.error("Gagal import:", err);
      alert("Gagal membaca file Excel. Pastikan format file benar (.xlsx / .xls / .csv).");
    }
    e.target.value = "";
  }

  function konfirmasi() {
    if (!dialog) return;
    onImport(dialog.rows, mode);
    setDialog(null);
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        className="hidden"
        onChange={handleFile}
      />
      {templateHeaders && templateHeaders.length > 0 && (
        <Button
          variant="secondary"
          title="Unduh contoh format Excel"
          onClick={() =>
            downloadTemplate(
              templateHeaders,
              templateContoh ?? [],
              "template-" + filename,
              sheetName
            )
          }
        >
          📄 Template
        </Button>
      )}
      <Button
        variant="secondary"
        onClick={() => inputRef.current?.click()}
        title="Import data dari Excel"
      >
        📥 Import
      </Button>
      <Button variant="secondary" onClick={handleExport} title="Export data ke Excel">
        📤 Export
      </Button>

      {/* Dialog pilihan mode import */}
      {dialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900">Konfirmasi Import Data</h3>
            <p className="mt-1 text-sm text-slate-500">
              File <span className="font-semibold text-slate-700">{dialog.namaFile}</span>{" "}
              berisi{" "}
              <span className="font-semibold text-blue-700">{dialog.rows.length} baris</span>{" "}
              data. Pilih cara memasukkan data:
            </p>

            <div className="mt-4 space-y-3">
              <label
                className={cn(
                  "flex cursor-pointer gap-3 rounded-xl border-2 p-3 transition",
                  mode === "merge"
                    ? "border-emerald-500 bg-emerald-50"
                    : "border-slate-200 hover:border-slate-300"
                )}
              >
                <input
                  type="radio"
                  checked={mode === "merge"}
                  onChange={() => setMode("merge")}
                  className="mt-1"
                />
                <div>
                  <p className="text-sm font-bold text-slate-800">
                    ✅ Gabungkan &amp; Perbarui{" "}
                    <span className="rounded bg-emerald-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                      DISARANKAN
                    </span>
                  </p>
                  <p className="mt-0.5 text-xs text-slate-600">
                    Data lama <strong>tetap aman</strong>. Baris yang cocok (berdasarkan
                    NIPB atau Nama) akan diperbarui, baris baru ditambahkan. Kolom yang
                    tidak ada di file Excel tidak akan diubah.
                  </p>
                </div>
              </label>

              <label
                className={cn(
                  "flex cursor-pointer gap-3 rounded-xl border-2 p-3 transition",
                  mode === "replace"
                    ? "border-red-500 bg-red-50"
                    : "border-slate-200 hover:border-slate-300"
                )}
              >
                <input
                  type="radio"
                  checked={mode === "replace"}
                  onChange={() => setMode("replace")}
                  className="mt-1"
                />
                <div>
                  <p className="text-sm font-bold text-slate-800">
                    ⚠️ Ganti Seluruh Data
                  </p>
                  <p className="mt-0.5 text-xs text-slate-600">
                    Semua data lama <strong>dihapus</strong> dan diganti dengan isi file
                    Excel. Gunakan hanya bila Anda yakin file berisi data lengkap.
                  </p>
                </div>
              </label>
            </div>

            {keterangan && (
              <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
                💡 {keterangan}
              </p>
            )}

            <div className="mt-5 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setDialog(null)}>
                Batal
              </Button>
              <Button
                variant={mode === "replace" ? "danger" : "success"}
                onClick={konfirmasi}
              >
                {mode === "replace" ? "Ganti Semua Data" : "Gabungkan Data"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
