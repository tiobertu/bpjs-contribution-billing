import { useMemo, useState } from "react";
import { useData } from "../context/DataContext";
import { HUB_KELUARGA, type PesertaTambahan } from "../data/seed";
import { Button, IconButton, Table, thClass, tdClass, tdNumClass } from "./ui";
import { formatRupiah } from "../utils/format";
import { printElement } from "../utils/print";
import { PrintHeader } from "./PrintHeader";
import { PrintFooter } from "./PrintFooter";
import { ImportExport } from "./ImportExport";

export function MenuKesehatan1() {
  const { peserta1, setPeserta1, pegawai, iuranKesByNama } = useData();
  const [cari, setCari] = useState("");
  const [nama, setNama] = useState("");
  const [hub, setHub] = useState("ANAK");
  const [ortu, setOrtu] = useState("");

  /** Premi 1% = 1% dari gaji. Iuran BPJS Kesehatan = 5% gaji, jadi premi = iuran x 20% */
  const hitungPremi = (namaOrtu: string) =>
    Math.round(iuranKesByNama(namaOrtu) * 0.2);

  const tampil = useMemo(() => {
    const q = cari.trim().toLowerCase();
    if (!q) return peserta1;
    return peserta1.filter(
      (p) =>
        p.namaPeserta.toLowerCase().includes(q) ||
        p.namaOrangTua.toLowerCase().includes(q) ||
        p.hubKeluarga.toLowerCase().includes(q)
    );
  }, [peserta1, cari]);

  const totalPremi = useMemo(
    () => tampil.reduce((a, p) => a + hitungPremi(p.namaOrangTua), 0),
    [tampil, pegawai]
  );

  /** Ringkasan jumlah iuran per nama pegawai penanggung */
  const perNama = useMemo(() => {
    const map = new Map<string, { total: number; jumlah: number }>();
    tampil.forEach((p) => {
      const cur = map.get(p.namaOrangTua) ?? { total: 0, jumlah: 0 };
      cur.total += hitungPremi(p.namaOrangTua);
      cur.jumlah += 1;
      map.set(p.namaOrangTua, cur);
    });
    return Array.from(map.entries()).sort((a, b) => b[1].total - a[1].total);
  }, [tampil, pegawai]);

  function tambahPeserta() {
    if (!nama.trim()) return;
    setPeserta1([
      ...peserta1,
      {
        id: "t" + Date.now(),
        namaPeserta: nama.trim().toUpperCase(),
        hubKeluarga: hub,
        namaOrangTua: ortu,
      },
    ]);
    setNama("");
    setOrtu("");
    setHub("ANAK");
  }

  function update(id: string, field: keyof PesertaTambahan, value: string) {
    setPeserta1(peserta1.map((p) => (p.id === id ? { ...p, [field]: value } : p)));
  }

  function remove(id: string) {
    setPeserta1(peserta1.filter((p) => p.id !== id));
  }

  const inputCls =
    "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500";

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Iuran BPJS Kesehatan 1%</h2>
          <p className="text-sm text-slate-500">
            Premi anggota keluarga tambahan — dihitung 1% dari gaji pegawai penanggung
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ImportExport
            data={peserta1.map((p) => ({
              "Nama Peserta": p.namaPeserta,
              "Hub Keluarga": p.hubKeluarga,
              "Nama Orang Tua": p.namaOrangTua,
              Premi: hitungPremi(p.namaOrangTua),
            }))}
            filename="iuran-bpjs-kesehatan-1-persen.xlsx"
            sheetName="Kesehatan 1%"
            headers={{
              "Nama Peserta": "namaPeserta",
              "Hub Keluarga": "hubKeluarga",
              "Hubungan Keluarga": "hubKeluarga",
              "Nama Orang Tua": "namaOrangTua",
              "Nama Pegawai": "namaOrangTua",
            }}
            templateHeaders={["Nama Peserta", "Hub Keluarga", "Nama Orang Tua"]}
            templateContoh={[
              {
                "Nama Peserta": "CONTOH ANAK",
                "Hub Keluarga": "ANAK",
                "Nama Orang Tua": pegawai[0]?.nama ?? "NAMA PEGAWAI",
              },
            ]}
            keterangan="Nama Orang Tua harus sama dengan Nama Pegawai pada menu Database agar premi terhitung."
            onImport={(rows, mode) => {
              const bersih = rows.filter((r) => String(r.namaPeserta ?? "").trim());
              if (bersih.length === 0) {
                alert("Tidak ada baris valid. Pastikan kolom 'Nama Peserta' terisi.");
                return;
              }
              const kunci = (n: string) => n.trim().toLowerCase();
              const hasil = mode === "replace" ? [] : [...peserta1];
              const indeks = new Map(hasil.map((p, i) => [kunci(p.namaPeserta), i]));
              let diperbarui = 0;
              let ditambah = 0;

              bersih.forEach((r, i) => {
                const namaPeserta = String(r.namaPeserta ?? "").trim().toUpperCase();
                const posisi = indeks.get(kunci(namaPeserta));
                const patch: Partial<PesertaTambahan> = { namaPeserta };
                if (r.hubKeluarga !== undefined && r.hubKeluarga !== "")
                  patch.hubKeluarga = String(r.hubKeluarga).trim().toUpperCase();
                if (r.namaOrangTua !== undefined && r.namaOrangTua !== "")
                  patch.namaOrangTua = String(r.namaOrangTua).trim();

                if (posisi !== undefined) {
                  hasil[posisi] = { ...hasil[posisi], ...patch };
                  diperbarui++;
                } else {
                  hasil.push({
                    id: "t" + Date.now() + "_" + i,
                    namaPeserta,
                    hubKeluarga: patch.hubKeluarga ?? "ANAK",
                    namaOrangTua: patch.namaOrangTua ?? "",
                  });
                  indeks.set(kunci(namaPeserta), hasil.length - 1);
                  ditambah++;
                }
              });
              setPeserta1(hasil);
              alert(
                `Import selesai.\n• Diperbarui: ${diperbarui}\n• Ditambahkan: ${ditambah}`
              );
            }}
          />
          <Button onClick={() => printElement("print-kes1")}>
            <span className="inline-block">🖨️</span> Cetak
          </Button>
        </div>
      </div>

      <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
        <span>💡</span>
        <p>
          Kolom <strong>Premi</strong> dihitung otomatis dari iuran BPJS Kesehatan pegawai
          penanggung pada menu <strong>Database</strong> (1% dari gaji). Perubahan pada
          Database langsung memperbarui nilai premi di sini.
        </p>
      </div>

      {/* Form tambah */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <p className="mb-3 text-sm font-semibold text-slate-700">Tambah Peserta</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <input
            value={nama}
            onChange={(e) => setNama(e.target.value)}
            placeholder="Nama Peserta"
            className={inputCls}
          />
          <select value={hub} onChange={(e) => setHub(e.target.value)} className={inputCls}>
            {HUB_KELUARGA.map((h) => (
              <option key={h} value={h}>
                {h}
              </option>
            ))}
          </select>
          <select
            value={ortu}
            onChange={(e) => setOrtu(e.target.value)}
            className={inputCls}
          >
            <option value="">— Pilih Nama Pegawai —</option>
            {pegawai.map((p) => (
              <option key={p.key} value={p.nama}>
                {p.nama}
              </option>
            ))}
          </select>
          <Button onClick={tambahPeserta} variant="success" className="w-full">
            + Tambah Peserta
          </Button>
        </div>
      </div>

      {/* Pencarian */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          value={cari}
          onChange={(e) => setCari(e.target.value)}
          placeholder="🔍 Cari nama peserta atau nama pegawai..."
          className="w-full max-w-sm rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-600">
          {tampil.length} dari {peserta1.length} peserta
        </span>
      </div>

      <div id="print-kes1">
        <PrintHeader
          title="Iuran BPJS Kesehatan 1%"
          subtitle="Premi Anggota Keluarga Tambahan Karyawan KSP CU Bima"
        />

        <div className="grid gap-5 lg:grid-cols-[280px_1fr]">
          {/* Panel kiri: jumlah iuran per nama */}
          <div className="print-panel order-2 rounded-xl border border-slate-200 bg-slate-50/60 p-4 shadow-sm lg:order-1">
            <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-700">
              Jumlah Iuran per Nama
            </h3>
            <div className="max-h-[500px] space-y-2 overflow-y-auto pr-1">
              {perNama.map(([namaOrtu, info]) => (
                <div
                  key={namaOrtu}
                  className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-800">
                      {namaOrtu || "(belum dipilih)"}
                    </p>
                    <p className="text-xs text-slate-400">{info.jumlah} peserta</p>
                  </div>
                  <p className="ml-2 shrink-0 text-sm font-bold text-emerald-700 tabular-nums">
                    {formatRupiah(info.total)}
                  </p>
                </div>
              ))}
              {perNama.length === 0 && (
                <p className="py-6 text-center text-sm text-slate-400">Belum ada data</p>
              )}
            </div>
            <div className="mt-3 flex items-center justify-between rounded-lg bg-emerald-600 px-3 py-2 text-white shadow">
              <p className="text-sm font-bold">Jumlah</p>
              <p className="text-sm font-bold tabular-nums">{formatRupiah(totalPremi)}</p>
            </div>
          </div>

          {/* Tabel utama sesuai format */}
          <div className="order-1 lg:order-2">
            <Table
              head={
                <tr>
                  <th className={thClass}>Nama Peserta</th>
                  <th className={thClass + " text-center"}>Hub Keluarga</th>
                  <th className={thClass}>Nama Orang Tua</th>
                  <th className={thClass + " text-right"}>Premi</th>
                  <th className={thClass + " text-center no-print"}>Aksi</th>
                </tr>
              }
            >
              {tampil.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className={tdClass}>
                    <input
                      value={p.namaPeserta}
                      onChange={(e) =>
                        update(p.id, "namaPeserta", e.target.value.toUpperCase())
                      }
                      className="w-52 rounded-md border border-transparent bg-transparent px-2 py-1 font-semibold text-blue-800 hover:border-slate-200 focus:border-blue-400 focus:bg-white focus:outline-none"
                    />
                  </td>
                  <td className={tdClass + " text-center"}>
                    <select
                      value={p.hubKeluarga}
                      onChange={(e) => update(p.id, "hubKeluarga", e.target.value)}
                      className="rounded-md border border-slate-200 px-2 py-1 text-sm text-slate-700 focus:border-blue-400 focus:outline-none"
                    >
                      {HUB_KELUARGA.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className={tdClass}>
                    <select
                      value={p.namaOrangTua}
                      onChange={(e) => update(p.id, "namaOrangTua", e.target.value)}
                      className="w-52 rounded-md border border-slate-200 px-2 py-1 text-sm font-medium text-emerald-800 focus:border-blue-400 focus:outline-none"
                    >
                      <option value="">— Pilih Pegawai —</option>
                      {pegawai.map((g) => (
                        <option key={g.key} value={g.nama}>
                          {g.nama}
                        </option>
                      ))}
                      {p.namaOrangTua &&
                        !pegawai.some((g) => g.nama === p.namaOrangTua) && (
                          <option value={p.namaOrangTua}>{p.namaOrangTua} (?)</option>
                        )}
                    </select>
                  </td>
                  <td className={tdNumClass + " font-bold text-slate-800"}>
                    {formatRupiah(hitungPremi(p.namaOrangTua))}
                  </td>
                  <td className={tdClass + " text-center no-print"}>
                    <IconButton variant="danger" title="Hapus" onClick={() => remove(p.id)}>
                      ✕
                    </IconButton>
                  </td>
                </tr>
              ))}
              {tampil.length === 0 && (
                <tr>
                  <td colSpan={5} className={tdClass + " py-10 text-center text-slate-400"}>
                    Belum ada peserta tambahan
                  </td>
                </tr>
              )}
              <tr className="bg-emerald-50 font-bold">
                <td colSpan={3} className={tdClass + " text-center font-bold text-slate-900"}>
                  Jumlah
                </td>
                <td className={tdNumClass + " font-bold text-emerald-700"}>
                  {formatRupiah(totalPremi)}
                </td>
                <td className={tdClass + " no-print"}></td>
              </tr>
            </Table>
          </div>
        </div>
        <PrintFooter />
      </div>
    </div>
  );
}
