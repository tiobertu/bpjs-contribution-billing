import { useMemo, useState } from "react";
import { useData } from "../context/DataContext";
import type { DatabasePeserta } from "../data/seed";
import { Button, IconButton, Table, thClass, tdClass, tdNumClass } from "./ui";
import { cn } from "../utils/cn";
import { bulanLabel, daftarPeriodeTersedia, formatRupiah, toInt } from "../utils/format";
import { printElement } from "../utils/print";
import { PrintHeader } from "./PrintHeader";
import { PrintFooter } from "./PrintFooter";
import { ImportExport } from "./ImportExport";
import { RupiahInput } from "./RupiahInput";
import { excelToISODate } from "../utils/excel";

const SEMUA = "__SEMUA__";

export function MenuDatabase() {
  const {
    dbTK,
    dbKES,
    setDbTK,
    setDbKES,
    daftarCabang,
    updatePegawai,
    hapusPegawai,
    tambahPegawai,
    upsertPegawai,
  } = useData();

  const [tab, setTab] = useState<"tk" | "kes">("tk");
  const [cari, setCari] = useState("");
  const [filterCabang, setFilterCabang] = useState<string>(SEMUA);
  const [isDirty, setIsDirty] = useState(false);
  const [periode, setPeriode] = useState({
    month: new Date().getMonth(),
    year: new Date().getFullYear(),
  });

  const active = tab === "tk" ? dbTK : dbKES;
  const setActive = tab === "tk" ? setDbTK : setDbKES;

  const tampil = useMemo(() => {
    const q = cari.trim().toLowerCase();
    return active.filter((d) => {
      const cocokCabang =
        filterCabang === SEMUA || d.namaPegawai === filterCabang;
      if (!cocokCabang) return false;
      if (!q) return true;
      return (
        d.nama.toLowerCase().includes(q) ||
        d.nipb.toLowerCase().includes(q) ||
        d.namaPegawai.toLowerCase().includes(q)
      );
    });
  }, [active, cari, filterCabang]);

  const totalBulanLalu = useMemo(
    () => tampil.reduce((a, d) => a + toInt(d.jumlahBulanLalu), 0),
    [tampil]
  );
  const totalBulanIni = useMemo(
    () => tampil.reduce((a, d) => a + toInt(d.iuranBulanIni), 0),
    [tampil]
  );

  const handlePeriodeChange = (month: number, year: number) => {
    const next = { month, year };
    setPeriode(next);
    setActive((prev) =>
      prev.map((d) => {
        if (!d.tanggalInput) {
          return { ...d, iuranBulanIni: d.jumlahBulanLalu };
        }
        const inputDate = new Date(d.tanggalInput);
        const sameMonth =
          inputDate.getMonth() === next.month && inputDate.getFullYear() === next.year;
        return sameMonth ? d : { ...d, iuranBulanIni: d.jumlahBulanLalu };
      })
    );
  };

  /** Ubah satu baris. Field umum ikut tersinkron ke database lainnya. */
  function ubah(
    row: DatabasePeserta,
    field: keyof DatabasePeserta,
    value: string | number
  ) {
    setIsDirty(true);

    if (field === "jumlahBulanLalu") {
      setActive(
        active.map((d) =>
          d.key === row.key ? { ...d, jumlahBulanLalu: toInt(value as number) } : d
        )
      );
      return;
    }
    if (field === "iuranBulanIni") {
      updatePegawai(
        row.key,
        tab === "tk" ? { tk: toInt(value as number) } : { kes: toInt(value as number) }
      );
      return;
    }
    if (field === "tanggalInput") {
      const selected = String(value);
      const nextValue = selected ? selected : "";
      setActive((prev) =>
        prev.map((d) =>
          d.key === row.key
            ? {
                ...d,
                tanggalInput: nextValue,
                iuranBulanIni: nextValue ? d.iuranBulanIni : d.jumlahBulanLalu,
              }
            : d
        )
      );
      return;
    }
    if (field === "nama") updatePegawai(row.key, { nama: String(value) });
    if (field === "nipb") updatePegawai(row.key, { nipb: String(value) });
    if (field === "namaPegawai") updatePegawai(row.key, { cabang: String(value) });
    if (field === "tanggalLahir")
      updatePegawai(row.key, { tanggalLahir: String(value) });
  }

  /**
   * Import aman:
   * - Iuran pada tab lain TIDAK ikut terhapus.
   * - Kolom yang tidak ada di file Excel tidak diubah.
   */
  function importData(rows: Record<string, unknown>[], mode: "merge" | "replace") {
    const bersih = rows.filter((r) => String(r.nama ?? "").trim());
    if (bersih.length === 0) {
      alert("Tidak ada baris valid. Pastikan kolom 'Nama' terisi.");
      return;
    }

    // 1) Sinkronkan identitas + iuran bulan ini lewat context
    const patch = bersih.map((r) => {
      const item: Record<string, unknown> = {
        nama: String(r.nama ?? "").trim(),
        nipb: String(r.nipb ?? "").trim(),
      };
      if (r.namaPegawai !== undefined && r.namaPegawai !== "")
        item.cabang = String(r.namaPegawai).trim();
      if (r.tanggalLahir !== undefined && r.tanggalLahir !== "")
        item.tanggalLahir = excelToISODate(r.tanggalLahir);
      if (r.iuranBulanIni !== undefined && r.iuranBulanIni !== "") {
        const nilai = toInt(r.iuranBulanIni as number);
        if (tab === "tk") item.tk = nilai;
        else item.kes = nilai;
      }
      return item;
    });
    const hasil = upsertPegawai(patch, mode);

    // 2) Terapkan kolom "Iuran Bulan Lalu" hanya untuk tab aktif
    const norm = (s: unknown) => String(s ?? "").trim().toLowerCase();
    const peta = new Map<string, number>();
    bersih.forEach((r) => {
      if (r.jumlahBulanLalu === undefined || r.jumlahBulanLalu === "") return;
      const nilai = toInt(r.jumlahBulanLalu as number);
      if (norm(r.nipb)) peta.set("n:" + norm(r.nipb), nilai);
      if (norm(r.nama)) peta.set("m:" + norm(r.nama), nilai);
    });
    if (peta.size > 0) {
      const terapkan = (list: DatabasePeserta[]) =>
        list.map((d) => {
          const v = peta.get("n:" + norm(d.nipb)) ?? peta.get("m:" + norm(d.nama));
          return v === undefined ? d : { ...d, jumlahBulanLalu: v };
        });
      setTimeout(() => {
        if (tab === "tk") setDbTK((prev) => terapkan(prev));
        else setDbKES((prev) => terapkan(prev));
      }, 0);
    }

    alert(
      `Import selesai.\n• Diperbarui: ${hasil.diperbarui}\n• Ditambahkan: ${hasil.ditambah}` +
        (hasil.dihapus ? `\n• Dihapus: ${hasil.dihapus}` : "") +
        `\n\nData ${tab === "tk" ? "BPJS Kesehatan" : "BPJS Ketenagakerjaan"} tetap aman.`
    );
  }

  const label = tab === "tk" ? "BPJS Ketenagakerjaan" : "BPJS Kesehatan";
  const printId = tab === "tk" ? "print-db-tk" : "print-db-kes";

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Database Peserta BPJS</h2>
          <p className="text-sm text-slate-500">
            Sumber data utama — perubahan di sini otomatis mengikuti ke semua menu
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() =>
              tambahPegawai(filterCabang === SEMUA ? daftarCabang[0] ?? "" : filterCabang)
            }
            variant="success"
          >
            + Tambah Peserta
          </Button>
          <ImportExport
            data={tampil.map((d, i) => ({
              No: i + 1,
              Nama: d.nama,
              NIPB: d.nipb,
              "Jumlah Iuran BPJS Bulan Lalu": toInt(d.jumlahBulanLalu),
              "Kantor Cabang": d.namaPegawai,
              "Tanggal Lahir": d.tanggalLahir,
              "Iuran Bulan Ini": toInt(d.iuranBulanIni),
              Selisih: toInt(d.iuranBulanIni) - toInt(d.jumlahBulanLalu),
            }))}
            filename={`database-${tab === "tk" ? "ketenagakerjaan" : "kesehatan"}.xlsx`}
            sheetName={label}
            headers={{
              Nama: "nama",
              "Nama Peserta": "nama",
              NIPB: "nipb",
              "Jumlah Iuran BPJS Bulan Lalu": "jumlahBulanLalu",
              "Iuran Bulan Lalu": "jumlahBulanLalu",
              "Kantor Cabang": "namaPegawai",
              "Nama Pegawai": "namaPegawai",
              Cabang: "namaPegawai",
              "Tanggal Lahir": "tanggalLahir",
              "Iuran Bulan Ini": "iuranBulanIni",
            }}
            templateHeaders={[
              "Nama",
              "NIPB",
              "Jumlah Iuran BPJS Bulan Lalu",
              "Kantor Cabang",
              "Tanggal Lahir",
              "Iuran Bulan Ini",
            ]}
            templateContoh={[
              {
                Nama: "CONTOH NAMA",
                NIPB: "001 01 01 01",
                "Jumlah Iuran BPJS Bulan Lalu": 400000,
                "Kantor Cabang": daftarCabang[0] ?? "Kantor Pusat",
                "Tanggal Lahir": "1990-01-31",
                "Iuran Bulan Ini": 410000,
              },
            ]}
            keterangan={`Import pada tab ini tidak akan menghapus data ${
              tab === "tk" ? "BPJS Kesehatan" : "BPJS Ketenagakerjaan"
            }.`}
            onImport={importData}
          />
          <Button onClick={() => printElement(printId)}>
            <span className="inline-block">🖨️</span> Cetak
          </Button>
        </div>
      </div>

      <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        <span>⚙️</span>
        <p>
          Menu ini adalah <strong>pusat data</strong>. Mengubah atau meng-import data di
          sini otomatis memperbarui menu <strong>Rekap Peserta</strong>,{" "}
          <strong>Kantor Cabang</strong>, dan <strong>BPJS Kesehatan 1%</strong>.
        </p>
      </div>

      <div className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-2 xl:grid-cols-4">
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Bulan
          </label>
          <select
            value={periode.month}
            onChange={(e) => handlePeriodeChange(Number(e.target.value), periode.year)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {Array.from({ length: 12 }, (_, index) => (
              <option key={index} value={index}>
                {new Date(2024, index, 1).toLocaleString("id-ID", { month: "long" })}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Tahun
          </label>
          <select
            value={periode.year}
            onChange={(e) => handlePeriodeChange(periode.month, Number(e.target.value))}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {daftarPeriodeTersedia()
              .map((p) => p.tahun)
              .filter((year, index, arr) => arr.indexOf(year) === index)
              .sort((a, b) => a - b)
              .map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
          </select>
        </div>
        <div className="flex items-end md:col-span-2 xl:col-span-2">
          <div className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700">
            Periode aktif: {bulanLabel(periode.month, periode.year)}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
        <button
          onClick={() => setTab("tk")}
          className={cn(
            "rounded-lg px-5 py-2 text-sm font-semibold transition-colors",
            tab === "tk"
              ? "bg-orange-500 text-white shadow"
              : "text-slate-600 hover:bg-slate-100"
          )}
        >
          BPJS Ketenagakerjaan
        </button>
        <button
          onClick={() => setTab("kes")}
          className={cn(
            "rounded-lg px-5 py-2 text-sm font-semibold transition-colors",
            tab === "kes"
              ? "bg-emerald-500 text-white shadow"
              : "text-slate-600 hover:bg-slate-100"
          )}
        >
          BPJS Kesehatan
        </button>
      </div>

      {/* Filter */}
      <div className="grid gap-3 sm:grid-cols-[minmax(0,300px)_minmax(0,300px)_auto] sm:items-center">
        <select
          value={filterCabang}
          onChange={(e) => setFilterCabang(e.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-blue-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value={SEMUA}>🌐 Semua Kantor Cabang</option>
          {daftarCabang.map((c) => (
            <option key={c} value={c}>
              📍 {c}
            </option>
          ))}
        </select>
        <input
          value={cari}
          onChange={(e) => setCari(e.target.value)}
          placeholder="🔍 Cari nama, NIPB, atau kantor cabang..."
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <span className="justify-self-start rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-600">
          {tampil.length} dari {active.length} peserta
        </span>
      </div>

      <div id={printId}>
        <PrintHeader
          title={`Database ${label}`}
          subtitle={
            filterCabang === SEMUA
              ? "Perbandingan Iuran Bulan Lalu & Iuran Bulan Ini"
              : `Kantor Cabang: ${filterCabang}`
          }
        />

        <Table
          head={
            <tr>
              <th className={thClass}>No</th>
              <th className={thClass}>Nama</th>
              <th className={thClass}>NIPB</th>
              <th className={thClass + " text-right"}>Iuran Bulan Lalu</th>
              <th className={thClass}>Kantor Cabang</th>
              <th className={thClass}>Tanggal Lahir</th>
              <th className={thClass}>Tanggal Input</th>
              <th className={thClass + " text-right"}>Iuran Bulan Ini</th>
              <th className={thClass + " text-right"}>Selisih</th>
              <th className={thClass + " text-center no-print"}>Aksi</th>
            </tr>
          }
        >
          {tampil.map((d, i) => {
            const selisih = toInt(d.iuranBulanIni) - toInt(d.jumlahBulanLalu);
            const status = selisih > 0 ? "naik" : selisih < 0 ? "turun" : "sama";
            return (
              <tr key={d.key} className="hover:bg-slate-50">
                <td className={tdClass}>{i + 1}</td>
                <td className={tdClass}>
                  <input
                    value={d.nama}
                    onChange={(e) => ubah(d, "nama", e.target.value)}
                    placeholder="Nama"
                    className="w-40 rounded-md border border-transparent bg-transparent px-2 py-1 font-medium text-slate-800 placeholder:text-slate-300 hover:border-slate-200 focus:border-blue-400 focus:bg-white focus:outline-none"
                  />
                </td>
                <td className={tdClass}>
                  <input
                    value={d.nipb}
                    onChange={(e) => ubah(d, "nipb", e.target.value)}
                    placeholder="NIPB"
                    className="w-28 rounded-md border border-slate-200 px-2 py-1 focus:border-blue-400 focus:outline-none"
                  />
                </td>
                <td className={tdClass}>
                  <RupiahInput
                    value={toInt(d.jumlahBulanLalu)}
                    onChange={(v) => ubah(d, "jumlahBulanLalu", v)}
                  />
                </td>
                <td className={tdClass}>
                  <select
                    value={d.namaPegawai}
                    onChange={(e) => ubah(d, "namaPegawai", e.target.value)}
                    className="w-40 rounded-md border border-slate-200 px-2 py-1 text-sm focus:border-blue-400 focus:outline-none"
                  >
                    <option value="">— Pilih Cabang —</option>
                    {daftarCabang.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </td>
                <td className={tdClass}>
                  <input
                    type="date"
                    value={d.tanggalLahir}
                    onChange={(e) => ubah(d, "tanggalLahir", e.target.value)}
                    className="w-36 rounded-md border border-slate-200 px-2 py-1 focus:border-blue-400 focus:outline-none"
                  />
                </td>
                <td className={tdClass}>
                  <input
                    type="date"
                    value={d.tanggalInput}
                    onChange={(e) => ubah(d, "tanggalInput", e.target.value)}
                    className="w-36 rounded-md border border-slate-200 px-2 py-1 focus:border-blue-400 focus:outline-none"
                  />
                </td>
                <td className={tdClass}>
                  <RupiahInput
                    value={toInt(d.tanggalInput ? d.iuranBulanIni : 0)}
                    onChange={(v) => ubah(d, "iuranBulanIni", v)}
                    allowEmpty={!d.tanggalInput}
                    placeholder={d.tanggalInput ? "" : "Kosong"}
                  />
                </td>
                <td className={tdNumClass}>
                  <span
                    className={cn(
                      "rounded-md px-2 py-0.5 font-semibold tabular-nums",
                      status === "naik" && "bg-orange-50 text-orange-600",
                      status === "turun" && "bg-red-50 text-red-600",
                      status === "sama" && "bg-slate-100 text-slate-500"
                    )}
                  >
                    {status === "naik" ? "+" : status === "turun" ? "-" : ""}
                    {formatRupiah(Math.abs(selisih))}
                  </span>
                </td>
                <td className={tdClass + " text-center no-print"}>
                  <IconButton
                    variant="danger"
                    title="Hapus peserta"
                    onClick={() => hapusPegawai(d.key)}
                  >
                    ✕
                  </IconButton>
                </td>
              </tr>
            );
          })}
          {tampil.length === 0 && (
            <tr>
              <td colSpan={9} className={tdClass + " py-10 text-center text-slate-400"}>
                {active.length === 0
                  ? "Belum ada data peserta"
                  : "Tidak ada data yang cocok dengan filter"}
              </td>
            </tr>
          )}
          {tampil.length > 0 && (
            <tr className="bg-blue-50 font-bold">
              <td colSpan={4} className={tdClass + " font-bold text-slate-900"}>
                Jumlah Iuran
              </td>
              <td className={tdNumClass + " font-bold text-orange-700"}>
                {formatRupiah(totalBulanLalu)}
              </td>
              <td colSpan={2} className={tdClass}></td>
              <td className={tdNumClass + " font-bold text-emerald-700"}>
                {formatRupiah(totalBulanIni)}
              </td>
              <td className={tdNumClass + " font-bold text-blue-800"}>
                {formatRupiah(totalBulanIni - totalBulanLalu)}
              </td>
              <td className={tdClass + " no-print"}></td>
            </tr>
          )}
        </Table>

        {isDirty && (
          <div className="mt-4 flex justify-end">
            <Button
              variant="success"
              onClick={() => {
                setIsDirty(false);
                alert("Database berhasil disimpan.");
              }}
            >
              💾 Simpan Perubahan
            </Button>
          </div>
        )}

        {/* Ringkasan perbandingan */}
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div
            className={cn(
              "rounded-xl p-4 text-white shadow",
              tab === "tk"
                ? "bg-gradient-to-br from-orange-500 to-red-500"
                : "bg-gradient-to-br from-emerald-500 to-teal-600"
            )}
          >
            <p className="text-xs font-medium uppercase tracking-wide opacity-90">
              Total Iuran Bulan Lalu
            </p>
            <p className="mt-1 text-xl font-bold tabular-nums">
              {formatRupiah(totalBulanLalu)}
            </p>
          </div>
          <div className="rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 p-4 text-white shadow">
            <p className="text-xs font-medium uppercase tracking-wide opacity-90">
              Total Iuran Bulan Ini
            </p>
            <p className="mt-1 text-xl font-bold tabular-nums">
              {formatRupiah(totalBulanIni)}
            </p>
          </div>
          <div className="rounded-xl bg-slate-800 p-4 text-white shadow">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-300">
              Selisih (Bulan Ini − Bulan Lalu)
            </p>
            <p className="mt-1 text-xl font-bold tabular-nums">
              {formatRupiah(totalBulanIni - totalBulanLalu)}
            </p>
          </div>
        </div>

        <PrintFooter />
      </div>
    </div>
  );
}
