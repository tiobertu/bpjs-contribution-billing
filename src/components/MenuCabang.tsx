import { useEffect, useMemo, useState } from "react";
import { useData } from "../context/DataContext";
import type { PegawaiGabungan } from "../data/seed";
import { Button, IconButton, Table, thClass, tdClass, tdNumClass } from "./ui";
import { formatRupiah, toInt } from "../utils/format";
import { printElement } from "../utils/print";
import { PrintHeader } from "./PrintHeader";
import { PrintFooter } from "./PrintFooter";
import { ImportExport } from "./ImportExport";
import { exportMultiSheetExcel, excelToISODate } from "../utils/excel";
import { RupiahInput } from "./RupiahInput";

const SEMUA = "__SEMUA__";

export function MenuCabang({ readOnly = false }: { readOnly?: boolean }) {
  const {
    daftarCabang,
    pegawai,
    updatePegawai,
    hapusPegawai,
    tambahPegawai,
    upsertPegawai,
  } = useData();

  const [pilih, setPilih] = useState<string>(daftarCabang[0] ?? SEMUA);
  const [cari, setCari] = useState("");

  // pastikan pilihan tetap valid bila daftar cabang berubah
  useEffect(() => {
    if (pilih !== SEMUA && !daftarCabang.includes(pilih)) {
      setPilih(daftarCabang[0] ?? SEMUA);
    }
  }, [daftarCabang, pilih]);

  const cabangTampil = pilih === SEMUA ? daftarCabang : [pilih];

  const terfilter = useMemo(() => {
    const q = cari.trim().toLowerCase();
    if (!q) return pegawai;
    return pegawai.filter(
      (p) => p.nama.toLowerCase().includes(q) || p.nipb.toLowerCase().includes(q)
    );
  }, [pegawai, cari]);

  const listTampil = useMemo(
    () => terfilter.filter((p) => cabangTampil.includes(p.cabang)),
    [terfilter, cabangTampil]
  );

  const totalTK = listTampil.reduce((a, p) => a + p.tk, 0);
  const totalKES = listTampil.reduce((a, p) => a + p.kes, 0);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Data Kantor Cabang</h2>
          <p className="text-sm text-slate-500">
            Rincian iuran BPJS per pegawai — tersinkron dengan menu Database
          </p>
        </div>
        {!readOnly && (
          <div className="flex flex-wrap gap-2">
            <ImportExport
              data={listTampil.map((p, i) => ({
                No: i + 1,
                "Nama Pegawai": p.nama,
                NIPB: p.nipb,
                "Kantor Cabang": p.cabang,
                "Tanggal Lahir": p.tanggalLahir,
                "BPJS Ketenagakerjaan": p.tk,
                "BPJS Kesehatan": p.kes,
                Jumlah: p.tk + p.kes,
              }))}
              filename="data-pegawai-cabang.xlsx"
              sheetName="Pegawai"
              headers={{
                "Nama Pegawai": "nama",
                Nama: "nama",
                NIPB: "nipb",
                "Kantor Cabang": "cabang",
                Cabang: "cabang",
                "Tanggal Lahir": "tanggalLahir",
                "BPJS Ketenagakerjaan": "tk",
                "BPJS Kesehatan": "kes",
              }}
              templateHeaders={[
                "Nama Pegawai",
                "NIPB",
                "Kantor Cabang",
                "Tanggal Lahir",
                "BPJS Ketenagakerjaan",
                "BPJS Kesehatan",
              ]}
              templateContoh={[
                {
                  "Nama Pegawai": "CONTOH NAMA",
                  NIPB: "001 01 01 01",
                  "Kantor Cabang": daftarCabang[0] ?? "Kantor Pusat",
                  "Tanggal Lahir": "1990-01-31",
                  "BPJS Ketenagakerjaan": 400000,
                  "BPJS Kesehatan": 200000,
                },
              ]}
              keterangan="Kolom yang tidak diisi pada file Excel tidak akan mengubah data lama."
              onImport={(rows, mode) => {
                const mapped: Partial<PegawaiGabungan>[] = rows
                  .filter((r) => String(r.nama ?? "").trim())
                  .map((o) => {
                    const item: Partial<PegawaiGabungan> = {
                      nama: String(o.nama ?? "").trim(),
                      nipb: String(o.nipb ?? "").trim(),
                    };
                    if (o.cabang !== undefined && o.cabang !== "")
                      item.cabang = String(o.cabang).trim();
                    if (o.tanggalLahir !== undefined && o.tanggalLahir !== "")
                      item.tanggalLahir = excelToISODate(o.tanggalLahir);
                    if (o.tk !== undefined && o.tk !== "") item.tk = toInt(o.tk as number);
                    if (o.kes !== undefined && o.kes !== "")
                      item.kes = toInt(o.kes as number);
                    return item;
                  });
                if (mapped.length === 0) {
                  alert("Tidak ada baris valid. Pastikan kolom 'Nama Pegawai' terisi.");
                  return;
                }
                const h = upsertPegawai(mapped, mode);
                alert(
                  `Import selesai.\n• Diperbarui: ${h.diperbarui}\n• Ditambahkan: ${h.ditambah}` +
                    (h.dihapus ? `\n• Dihapus: ${h.dihapus}` : "")
                );
              }}
            />
            <Button
              variant="secondary"
              onClick={() =>
                exportMultiSheetExcel(
                  daftarCabang.map((nama) => ({
                    name: nama.replace(/[\\/*?:[\]]/g, "").slice(0, 30),
                    data: pegawai
                      .filter((p) => p.cabang === nama)
                      .map((p, i) => ({
                        No: i + 1,
                        "Nama Pegawai": p.nama,
                        NIPB: p.nipb,
                        "BPJS Ketenagakerjaan": p.tk,
                        "BPJS Kesehatan": p.kes,
                        Jumlah: p.tk + p.kes,
                      })),
                  })),
                  "data-pegawai-per-cabang.xlsx"
                )
              }
              title="Export semua cabang (multi-sheet)"
            >
              📚 Export per Cabang
            </Button>
            <Button onClick={() => printElement("print-cabang")}>
              <span className="inline-block">🖨️</span> Cetak
            </Button>
          </div>
        )}
      </div>

      {/* Pemilih cabang + pencarian */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,320px)_1fr_auto] lg:items-end">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Pilih Kantor Cabang
            </label>
            <select
              value={pilih}
              onChange={(e) => setPilih(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-semibold text-blue-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value={SEMUA}>🌐 Semua Cabang ({daftarCabang.length})</option>
              {daftarCabang.map((c) => (
                <option key={c} value={c}>
                  📍 {c} ({pegawai.filter((p) => p.cabang === c).length} pegawai)
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Cari Pegawai
            </label>
            <input
              value={cari}
              onChange={(e) => setCari(e.target.value)}
              placeholder="🔍 Nama pegawai atau NIPB..."
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          {!readOnly && pilih !== SEMUA && (
            <Button variant="success" onClick={() => tambahPegawai(pilih)}>
              + Tambah Pegawai
            </Button>
          )}
        </div>
      </div>

      <div id="print-cabang" className="print-cabang-layout">
        <PrintHeader
          title="Data Pegawai & Iuran BPJS per Kantor Cabang"
          subtitle={
            pilih === SEMUA
              ? "Seluruh Kantor Cabang"
              : `Kantor Cabang: ${pilih}`
          }
        />

        <div className="space-y-8 print-cabang-sections">
          {cabangTampil.map((namaCabang) => {
            const list = listTampil.filter((p) => p.cabang === namaCabang);
            if (pilih === SEMUA && cari.trim() && list.length === 0) return null;
            const subTK = list.reduce((a, p) => a + p.tk, 0);
            const subKES = list.reduce((a, p) => a + p.kes, 0);
            return (
              <div key={namaCabang} className="print-cabang-section">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-base font-bold text-blue-800">
                    📍 {namaCabang}
                    <span className="ml-2 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                      {list.length} pegawai
                    </span>
                  </h3>
                  {!readOnly && pilih === SEMUA && (
                    <Button
                      variant="secondary"
                      className="!px-2.5 !py-1.5 text-xs no-print"
                      onClick={() => tambahPegawai(namaCabang)}
                    >
                      + Tambah Pegawai
                    </Button>
                  )}
                </div>

                <Table
                  head={
                    <tr>
                      <th className={thClass}>No</th>
                      <th className={thClass}>Nama Pegawai</th>
                      <th className={thClass}>NIPB</th>
                      <th className={thClass + " text-right"}>BPJS Ketenagakerjaan</th>
                      <th className={thClass + " text-right"}>BPJS Kesehatan</th>
                      <th className={thClass + " text-right"}>Jumlah (TK + KES)</th>
                      {!readOnly && <th className={thClass + " text-center no-print"}>Aksi</th>}
                    </tr>
                  }
                >
                  {list.map((p, i) => (
                    <tr key={p.key} className="hover:bg-slate-50">
                      <td className={tdClass}>{i + 1}</td>
                      <td className={tdClass}>
                        {readOnly ? (
                          <span className="font-medium text-slate-800">{p.nama}</span>
                        ) : (
                          <input
                            value={p.nama}
                            onChange={(e) => updatePegawai(p.key, { nama: e.target.value })}
                            placeholder="Nama pegawai"
                            className="w-44 rounded-md border border-transparent bg-transparent px-2 py-1 font-medium text-slate-800 placeholder:text-slate-300 hover:border-slate-200 focus:border-blue-400 focus:bg-white focus:outline-none"
                          />
                        )}
                      </td>
                      <td className={tdClass}>
                        {readOnly ? (
                          <span className="text-slate-700">{p.nipb}</span>
                        ) : (
                          <input
                            value={p.nipb}
                            onChange={(e) => updatePegawai(p.key, { nipb: e.target.value })}
                            placeholder="NIPB"
                            className="w-28 rounded-md border border-slate-200 px-2 py-1 focus:border-blue-400 focus:outline-none"
                          />
                        )}
                      </td>
                      <td className={tdClass}>
                        {readOnly ? (
                          <span className="font-medium text-slate-700">{formatRupiah(p.tk)}</span>
                        ) : (
                          <RupiahInput
                            value={p.tk}
                            onChange={(v) => updatePegawai(p.key, { tk: v })}
                          />
                        )}
                      </td>
                      <td className={tdClass}>
                        {readOnly ? (
                          <span className="font-medium text-slate-700">{formatRupiah(p.kes)}</span>
                        ) : (
                          <RupiahInput
                            value={p.kes}
                            onChange={(v) => updatePegawai(p.key, { kes: v })}
                          />
                        )}
                      </td>
                      <td className={tdNumClass + " font-semibold text-blue-700"}>
                        {formatRupiah(p.tk + p.kes)}
                      </td>
                      {!readOnly && (
                        <td className={tdClass + " text-center no-print"}>
                          <IconButton
                            variant="danger"
                            title="Hapus pegawai"
                            onClick={() => hapusPegawai(p.key)}
                          >
                            ✕
                          </IconButton>
                        </td>
                      )}
                    </tr>
                  ))}
                  {list.length === 0 && (
                    <tr>
                      <td colSpan={7} className={tdClass + " py-6 text-center text-slate-400"}>
                        Belum ada pegawai pada cabang ini
                      </td>
                    </tr>
                  )}
                  {list.length > 0 && (
                    <tr className="bg-blue-50 font-semibold">
                      <td colSpan={3} className={tdClass + " font-bold text-slate-900"}>
                        Subtotal {namaCabang}
                      </td>
                      <td className={tdNumClass + " font-bold text-orange-700"}>
                        {formatRupiah(subTK)}
                      </td>
                      <td className={tdNumClass + " font-bold text-emerald-700"}>
                        {formatRupiah(subKES)}
                      </td>
                      <td className={tdNumClass + " font-bold text-blue-800"}>
                        {formatRupiah(subTK + subKES)}
                      </td>
                      {!readOnly && <td className={tdClass + " no-print"}></td>}
                    </tr>
                  )}
                </Table>
              </div>
            );
          })}
        </div>

        {/* Jumlah keseluruhan */}
        <div className="mt-6 overflow-hidden rounded-xl border-2 border-blue-600 bg-white shadow">
          <table className="w-full text-left">
            <thead className="bg-blue-700">
              <tr>
                <th className={thClass}>
                  Jumlah Keseluruhan{pilih === SEMUA ? "" : ` — ${pilih}`}
                </th>
                <th className={thClass + " text-right"}>BPJS Ketenagakerjaan</th>
                <th className={thClass + " text-right"}>BPJS Kesehatan</th>
                <th className={thClass + " text-right"}>Total (TK + KES)</th>
              </tr>
            </thead>
            <tbody>
              <tr className="bg-blue-50 font-bold">
                <td className={tdClass + " font-bold text-slate-700"}>
                  {listTampil.length} pegawai
                </td>
                <td className={tdNumClass + " font-bold text-orange-700"}>
                  {formatRupiah(totalTK)}
                </td>
                <td className={tdNumClass + " font-bold text-emerald-700"}>
                  {formatRupiah(totalKES)}
                </td>
                <td className={tdNumClass + " font-bold text-blue-800"}>
                  {formatRupiah(totalTK + totalKES)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <PrintFooter blok={pilih === SEMUA ? undefined : pilih} />
      </div>

      <style>{`
        .print-cabang-layout {
          color: #0f172a;
        }

        @media print {
          @page {
            size: A4 portrait;
            margin: 12mm 10mm 12mm 10mm;
          }

          body {
            background: white !important;
          }

          .print-cabang-layout {
            font-size: 9px;
          }

          .print-cabang-layout .print-cabang-sections {
            display: block;
            break-inside: avoid;
            page-break-inside: avoid;
          }

          .print-cabang-layout .print-cabang-section {
            break-inside: avoid;
            page-break-inside: avoid;
            margin-bottom: 12px;
          }

          .print-cabang-layout .overflow-x-auto,
          .print-cabang-layout .overflow-hidden {
            overflow: visible !important;
          }

          .print-cabang-layout table {
            width: 100% !important;
            table-layout: fixed;
            border-collapse: collapse;
          }

          .print-cabang-layout th,
          .print-cabang-layout td {
            white-space: normal !important;
            overflow-wrap: anywhere;
            word-break: break-word;
            font-size: 8.8px !important;
            padding: 4px 5px !important;
            vertical-align: top !important;
          }

          .print-cabang-layout th {
            letter-spacing: 0.08em !important;
          }

          .print-cabang-layout input,
          .print-cabang-layout select {
            width: 100% !important;
            min-width: 0 !important;
            font-size: 8.8px !important;
            padding: 3px 4px !important;
          }

          .print-cabang-layout .no-print {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
