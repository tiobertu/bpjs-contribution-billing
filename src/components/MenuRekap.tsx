import { useState } from "react";
import { useData } from "../context/DataContext";
import { Button, IconButton, Table, thClass, tdClass, tdNumClass } from "./ui";
import { formatRupiah, formatNumber } from "../utils/format";
import { printElement } from "../utils/print";
import { exportToExcel } from "../utils/excel";
import { PrintHeader } from "./PrintHeader";
import { PrintFooter } from "./PrintFooter";

export function MenuRekap() {
  const {
    rekap,
    pegawai,
    totalTK,
    totalKES,
    extraCabang,
    setExtraCabang,
  } = useData();
  const [newNama, setNewNama] = useState("");

  function addCabang() {
    const nama = newNama.trim();
    if (!nama) return;
    if (rekap.some((c) => c.nama.toLowerCase() === nama.toLowerCase())) {
      alert("Kantor cabang tersebut sudah ada.");
      return;
    }
    setExtraCabang([...extraCabang, nama]);
    setNewNama("");
  }

  function removeCabang(nama: string) {
    const jml = pegawai.filter((p) => p.cabang === nama).length;
    if (jml > 0) {
      alert(
        `Cabang "${nama}" masih memiliki ${jml} pegawai di Database.\nPindahkan atau hapus pegawainya terlebih dahulu.`
      );
      return;
    }
    setExtraCabang(extraCabang.filter((c) => c !== nama));
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            Rekap Peserta BPJS Ketenagakerjaan &amp; BPJS Kesehatan
          </h2>
          <p className="text-sm text-slate-500">
            Nilai iuran dihitung otomatis dari menu Database
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            onClick={() =>
              exportToExcel(
                rekap.map((c, i) => ({
                  No: i + 1,
                  "Kantor Cabang": c.nama,
                  "Jumlah Pegawai": pegawai.filter((p) => p.cabang === c.nama).length,
                  "BPJS Ketenagakerjaan": c.bpjsKetenagakerjaan,
                  "BPJS Kesehatan": c.bpjsKesehatan,
                  "Total Iuran": c.bpjsKetenagakerjaan + c.bpjsKesehatan,
                })),
                "rekap-bpjs-per-cabang.xlsx",
                "Rekap BPJS"
              )
            }
          >
            📤 Export
          </Button>
          <Button onClick={() => printElement("print-rekap")}>
            <span className="inline-block">🖨️</span> Cetak
          </Button>
        </div>
      </div>

      {/* Info sinkronisasi */}
      <div className="flex items-start gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
        <span>🔄</span>
        <p>
          Data pada tabel ini <strong>otomatis mengikuti menu Database</strong>. Setiap
          perubahan atau import pada Database akan langsung tercermin di sini.
        </p>
      </div>

      {/* Form tambah cabang */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <p className="mb-3 text-sm font-semibold text-slate-700">
          Tambah Kantor Cabang Baru
        </p>
        <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
          <input
            value={newNama}
            onChange={(e) => setNewNama(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addCabang()}
            placeholder="Nama Kantor Cabang (mis. KC Sintang)"
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <Button onClick={addCabang} variant="success">
            + Tambah Cabang
          </Button>
        </div>
      </div>

      {/* Area print */}
      <div id="print-rekap">
        <PrintHeader
          title="Rekap Peserta BPJS Ketenagakerjaan & BPJS Kesehatan"
          subtitle="Rekapitulasi Iuran BPJS per Kantor Cabang"
        />

        <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
          <div>
            <Table
              head={
                <tr>
                  <th className={thClass}>No</th>
                  <th className={thClass}>Kantor Cabang</th>
                  <th className={thClass + " text-center"}>Pegawai</th>
                  <th className={thClass + " text-right"}>BPJS Ketenagakerjaan</th>
                  <th className={thClass + " text-right"}>BPJS Kesehatan</th>
                  <th className={thClass + " text-center no-print"}>Aksi</th>
                </tr>
              }
            >
              {rekap.map((c, i) => {
                const jml = pegawai.filter((p) => p.cabang === c.nama).length;
                return (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className={tdClass}>{i + 1}</td>
                    <td className={tdClass + " font-medium text-slate-800"}>{c.nama}</td>
                    <td className={tdClass + " text-center"}>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                        {jml}
                      </span>
                    </td>
                    <td className={tdNumClass + " font-semibold text-orange-700"}>
                      {formatRupiah(c.bpjsKetenagakerjaan)}
                    </td>
                    <td className={tdNumClass + " font-semibold text-emerald-700"}>
                      {formatRupiah(c.bpjsKesehatan)}
                    </td>
                    <td className={tdClass + " text-center no-print"}>
                      <IconButton
                        variant="danger"
                        title="Hapus cabang"
                        onClick={() => removeCabang(c.nama)}
                      >
                        ✕
                      </IconButton>
                    </td>
                  </tr>
                );
              })}
              {rekap.length === 0 && (
                <tr>
                  <td colSpan={6} className={tdClass + " py-10 text-center text-slate-400"}>
                    Belum ada data kantor cabang
                  </td>
                </tr>
              )}
              <tr className="bg-blue-50 font-bold">
                <td colSpan={2} className={tdClass + " font-bold text-slate-900"}>
                  JUMLAH KESELURUHAN
                </td>
                <td className={tdClass + " text-center font-bold"}>{pegawai.length}</td>
                <td className={tdNumClass + " font-bold text-orange-700"}>
                  {formatRupiah(totalTK)}
                </td>
                <td className={tdNumClass + " font-bold text-emerald-700"}>
                  {formatRupiah(totalKES)}
                </td>
                <td className={tdClass + " no-print"}></td>
              </tr>
            </Table>

            {/* Jumlah keseluruhan di bawah tabel */}
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl bg-gradient-to-br from-orange-500 to-red-500 p-4 text-white shadow">
                <p className="text-xs font-medium uppercase tracking-wide text-orange-100">
                  Total BPJS Ketenagakerjaan
                </p>
                <p className="mt-1 text-xl font-bold tabular-nums">
                  {formatRupiah(totalTK)}
                </p>
              </div>
              <div className="rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 p-4 text-white shadow">
                <p className="text-xs font-medium uppercase tracking-wide text-emerald-100">
                  Total BPJS Kesehatan
                </p>
                <p className="mt-1 text-xl font-bold tabular-nums">
                  {formatRupiah(totalKES)}
                </p>
              </div>
              <div className="rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 p-4 text-white shadow">
                <p className="text-xs font-medium uppercase tracking-wide text-blue-100">
                  Total Tagihan BPJS
                </p>
                <p className="mt-1 text-xl font-bold tabular-nums">
                  {formatRupiah(totalTK + totalKES)}
                </p>
              </div>
            </div>
          </div>

          {/* Panel kanan: jumlah iuran per cabang */}
          <div className="print-panel rounded-xl border border-slate-200 bg-slate-50/60 p-4 shadow-sm">
            <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-700">
              Jumlah Iuran per Cabang
            </h3>
            <div className="max-h-[640px] space-y-2 overflow-y-auto pr-1">
              {rekap.map((c) => {
                const total = c.bpjsKetenagakerjaan + c.bpjsKesehatan;
                return (
                  <div
                    key={c.id}
                    className="rounded-lg border border-slate-200 bg-white p-2.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-semibold text-slate-800">
                        {c.nama}
                      </p>
                      <p className="shrink-0 text-sm font-bold text-blue-700 tabular-nums">
                        {formatRupiah(total)}
                      </p>
                    </div>
                    <p className="text-xs text-slate-400">
                      TK: {formatNumber(c.bpjsKetenagakerjaan)} · KES:{" "}
                      {formatNumber(c.bpjsKesehatan)}
                    </p>
                  </div>
                );
              })}
            </div>
            <div className="mt-3 flex items-center justify-between rounded-lg bg-blue-600 p-3 text-white shadow">
              <p className="text-sm font-bold">Total Keseluruhan</p>
              <p className="text-sm font-bold tabular-nums">
                {formatRupiah(totalTK + totalKES)}
              </p>
            </div>
          </div>
        </div>
        <PrintFooter />
      </div>
    </div>
  );
}
