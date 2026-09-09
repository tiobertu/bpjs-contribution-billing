import { useMemo, useState } from "react";
import { useData } from "../context/DataContext";
import { Button } from "./ui";
import { cn } from "../utils/cn";
import { formatRupiah, formatDate, bulanIni, toInt } from "../utils/format";
import { printRawHtml } from "../utils/print";

const SEMUA = "__SEMUA__";

type LaporanId = "rekap" | "kes1" | "cabang" | "dbtk" | "dbkes";

const DAFTAR_LAPORAN: { id: LaporanId; judul: string; ikon: string; ket: string }[] = [
  { id: "rekap", judul: "Rekap Peserta BPJS", ikon: "📊", ket: "Rekapitulasi iuran per kantor cabang" },
  { id: "kes1", judul: "Iuran BPJS Kesehatan 1%", ikon: "💚", ket: "Premi anggota keluarga tambahan" },
  { id: "cabang", judul: "Data Pegawai per Kantor Cabang", ikon: "🏢", ket: "Rincian iuran tiap pegawai" },
  { id: "dbtk", judul: "Database BPJS Ketenagakerjaan", ikon: "🗄️", ket: "Perbandingan bulan lalu & bulan ini" },
  { id: "dbkes", judul: "Database BPJS Kesehatan", ikon: "🗄️", ket: "Perbandingan bulan lalu & bulan ini" },
];

const esc = (s: unknown) =>
  String(s ?? "").replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]!));
const rp = (n: number) => esc(formatRupiah(n));

export function MenuPrint() {
  const { rekap, pegawai, daftarCabang, totalTK, totalKES, dbTK, dbKES, peserta1, iuranKesByNama } =
    useData();

  const [pilihan, setPilihan] = useState<Record<LaporanId, boolean>>({
    rekap: true,
    kes1: false,
    cabang: false,
    dbtk: false,
    dbkes: false,
  });
  const [cabangFilter, setCabangFilter] = useState<string>(SEMUA);
  const [periode, setPeriode] = useState(bulanIni());
  const [pakaiKop, setPakaiKop] = useState(true);
  const [pakaiTtd, setPakaiTtd] = useState(true);
  const [dibuatOleh, setDibuatOleh] = useState("Administrasi KSP CU Bima");
  const [diketahuiOleh, setDiketahuiOleh] = useState("Pimpinan KSP CU Bima");

  const terpilih = DAFTAR_LAPORAN.filter((l) => pilihan[l.id]);

  const premi1 = (namaOrtu: string) => Math.round(iuranKesByNama(namaOrtu) * 0.2);

  const totalPremi1 = useMemo(
    () => peserta1.reduce((a, p) => a + premi1(p.namaOrangTua), 0),
    [peserta1, pegawai]
  );

  /* ---------------- Pembuat HTML tiap laporan ---------------- */

  function kop() {
    if (!pakaiKop) return "";
    return `<div class="kop">
      <div class="lembaga">Koperasi Simpan Pinjam Credit Union Bima</div>
      <div class="alamat">Tagihan Iuran BPJS Ketenagakerjaan &amp; BPJS Kesehatan · Periode ${esc(periode)}</div>
    </div>`;
  }

  function ttd() {
    if (!pakaiTtd) return "";
    return `<div class="ttd">
      <div class="kolom">
        <div>Dibuat oleh,</div><div class="ruang"></div>
        <div class="garis">(........................................)</div>
        <div class="jabatan">${esc(dibuatOleh)}</div>
      </div>
      <div class="kolom">
        <div>Diketahui oleh,</div><div class="ruang"></div>
        <div class="garis">(........................................)</div>
        <div class="jabatan">${esc(diketahuiOleh)}</div>
      </div>
    </div>`;
  }

  function htmlRekap() {
    const baris = rekap
      .map((c, i) => {
        const jml = pegawai.filter((p) => p.cabang === c.nama).length;
        return `<tr>
          <td class="ctr">${i + 1}</td>
          <td>${esc(c.nama)}</td>
          <td class="ctr">${jml}</td>
          <td class="num">${rp(c.bpjsKetenagakerjaan)}</td>
          <td class="num">${rp(c.bpjsKesehatan)}</td>
          <td class="num">${rp(c.bpjsKetenagakerjaan + c.bpjsKesehatan)}</td>
        </tr>`;
      })
      .join("");
    return `<div class="seksi">
      <p class="judul">Rekap Peserta BPJS Ketenagakerjaan &amp; BPJS Kesehatan</p>
      <p class="subjudul">Rekapitulasi Iuran per Kantor Cabang — Periode ${esc(periode)}</p>
      <table>
        <thead><tr>
          <th style="width:34px">No</th><th>Kantor Cabang</th><th style="width:60px">Pegawai</th>
          <th style="width:120px">BPJS Ketenagakerjaan</th><th style="width:110px">BPJS Kesehatan</th>
          <th style="width:120px">Jumlah</th>
        </tr></thead>
        <tbody>${baris}
          <tr class="total">
            <td colspan="2">JUMLAH KESELURUHAN</td>
            <td class="ctr">${pegawai.length}</td>
            <td class="num">${rp(totalTK)}</td>
            <td class="num">${rp(totalKES)}</td>
            <td class="num">${rp(totalTK + totalKES)}</td>
          </tr>
        </tbody>
      </table>
      ${ttd()}
    </div>`;
  }

  function htmlKes1() {
    const baris = peserta1
      .map(
        (p) => `<tr>
        <td>${esc(p.namaPeserta)}</td>
        <td class="ctr">${esc(p.hubKeluarga)}</td>
        <td>${esc(p.namaOrangTua)}</td>
        <td class="num">${rp(premi1(p.namaOrangTua))}</td>
      </tr>`
      )
      .join("");
    return `<div class="seksi">
      <p class="judul">Iuran BPJS Kesehatan 1%</p>
      <p class="subjudul">Premi Anggota Keluarga Tambahan — Periode ${esc(periode)}</p>
      <table>
        <thead><tr>
          <th>Nama Peserta</th><th style="width:110px">Hub Keluarga</th>
          <th>Nama Orang Tua</th><th style="width:110px">Premi</th>
        </tr></thead>
        <tbody>${baris}
          <tr class="total"><td colspan="3" class="ctr">Jumlah</td><td class="num">${rp(totalPremi1)}</td></tr>
        </tbody>
      </table>
      ${ttd()}
    </div>`;
  }

  function htmlCabang() {
    const daftar = cabangFilter === SEMUA ? daftarCabang : [cabangFilter];
    let gTK = 0;
    let gKES = 0;
    const blok = daftar
      .map((nama) => {
        const list = pegawai.filter((p) => p.cabang === nama);
        if (list.length === 0) return "";
        const sTK = list.reduce((a, p) => a + p.tk, 0);
        const sKES = list.reduce((a, p) => a + p.kes, 0);
        gTK += sTK;
        gKES += sKES;
        const baris = list
          .map(
            (p, i) => `<tr>
            <td class="ctr">${i + 1}</td>
            <td>${esc(p.nama)}</td>
            <td>${esc(p.nipb)}</td>
            <td class="num">${rp(p.tk)}</td>
            <td class="num">${rp(p.kes)}</td>
            <td class="num">${rp(p.tk + p.kes)}</td>
          </tr>`
          )
          .join("");
        return `<div class="grup">📍 ${esc(nama)} — ${list.length} pegawai</div>
        <table>
          <thead><tr>
            <th style="width:34px">No</th><th>Nama Pegawai</th><th style="width:100px">NIPB</th>
            <th style="width:115px">BPJS Ketenagakerjaan</th><th style="width:105px">BPJS Kesehatan</th>
            <th style="width:115px">Jumlah</th>
          </tr></thead>
          <tbody>${baris}
            <tr class="sub"><td colspan="3">Subtotal ${esc(nama)}</td>
              <td class="num">${rp(sTK)}</td><td class="num">${rp(sKES)}</td>
              <td class="num">${rp(sTK + sKES)}</td></tr>
          </tbody>
        </table>`;
      })
      .join("");
    return `<div class="seksi">
      <p class="judul">Data Pegawai &amp; Iuran BPJS per Kantor Cabang</p>
      <p class="subjudul">${
        cabangFilter === SEMUA ? "Seluruh Kantor Cabang" : "Kantor Cabang: " + esc(cabangFilter)
      } — Periode ${esc(periode)}</p>
      ${blok || '<p style="text-align:center;color:#94a3b8">Tidak ada data.</p>'}
      <table>
        <thead><tr><th>Jumlah Keseluruhan</th><th style="width:115px">BPJS Ketenagakerjaan</th>
        <th style="width:105px">BPJS Kesehatan</th><th style="width:115px">Total</th></tr></thead>
        <tbody><tr class="total">
          <td>${daftar.length} cabang</td>
          <td class="num">${rp(gTK)}</td><td class="num">${rp(gKES)}</td>
          <td class="num">${rp(gTK + gKES)}</td>
        </tr></tbody>
      </table>
      ${ttd()}
    </div>`;
  }

  function htmlDatabase(jenis: "tk" | "kes") {
    const semua = jenis === "tk" ? dbTK : dbKES;
    const data =
      cabangFilter === SEMUA ? semua : semua.filter((d) => d.namaPegawai === cabangFilter);
    const tLalu = data.reduce((a, d) => a + toInt(d.jumlahBulanLalu), 0);
    const tIni = data.reduce((a, d) => a + toInt(d.iuranBulanIni), 0);
    const baris = data
      .map((d, i) => {
        const sel = toInt(d.jumlahBulanLalu) - toInt(d.iuranBulanIni);
        return `<tr>
        <td class="ctr">${i + 1}</td>
        <td>${esc(d.nama)}</td>
        <td>${esc(d.nipb)}</td>
        <td class="num">${rp(toInt(d.jumlahBulanLalu))}</td>
        <td>${esc(d.namaPegawai)}</td>
        <td class="ctr">${esc(formatDate(d.tanggalLahir))}</td>
        <td class="num">${rp(toInt(d.iuranBulanIni))}</td>
        <td class="num">${sel > 0 ? "+" : sel < 0 ? "-" : ""}${rp(Math.abs(sel))}</td>
      </tr>`;
      })
      .join("");
    const nama = jenis === "tk" ? "BPJS Ketenagakerjaan" : "BPJS Kesehatan";
    return `<div class="seksi">
      <p class="judul">Database ${nama}</p>
      <p class="subjudul">${
        cabangFilter === SEMUA ? "Seluruh Kantor Cabang" : "Kantor Cabang: " + esc(cabangFilter)
      } — Perbandingan Bulan Lalu &amp; Bulan Ini (${esc(periode)})</p>
      <table>
        <thead><tr>
          <th style="width:32px">No</th><th>Nama</th><th style="width:92px">NIPB</th>
          <th style="width:100px">Iuran Bulan Lalu</th><th>Kantor Cabang</th>
          <th style="width:92px">Tgl Lahir</th><th style="width:100px">Iuran Bulan Ini</th>
          <th style="width:95px">Selisih</th>
        </tr></thead>
        <tbody>${baris}
          <tr class="total">
            <td colspan="3">Jumlah Iuran</td>
            <td class="num">${rp(tLalu)}</td><td colspan="2"></td>
            <td class="num">${rp(tIni)}</td><td class="num">${rp(tLalu - tIni)}</td>
          </tr>
        </tbody>
      </table>
      ${ttd()}
    </div>`;
  }

  function bangunHtml() {
    const bagian: string[] = [];
    if (pilihan.rekap) bagian.push(htmlRekap());
    if (pilihan.kes1) bagian.push(htmlKes1());
    if (pilihan.cabang) bagian.push(htmlCabang());
    if (pilihan.dbtk) bagian.push(htmlDatabase("tk"));
    if (pilihan.dbkes) bagian.push(htmlDatabase("kes"));
    return kop() + bagian.join("");
  }

  function cetak() {
    if (terpilih.length === 0) {
      alert("Pilih minimal satu laporan untuk dicetak.");
      return;
    }
    printRawHtml(bangunHtml());
  }

  const inputCls =
    "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500";

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Print Out / Pusat Cetak</h2>
          <p className="text-sm text-slate-500">
            Pilih laporan yang ingin dicetak — bisa beberapa sekaligus dalam satu dokumen
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            onClick={() =>
              setPilihan({ rekap: true, kes1: true, cabang: true, dbtk: true, dbkes: true })
            }
          >
            ✅ Pilih Semua
          </Button>
          <Button
            variant="secondary"
            onClick={() =>
              setPilihan({ rekap: false, kes1: false, cabang: false, dbtk: false, dbkes: false })
            }
          >
            ✖ Kosongkan
          </Button>
          <Button onClick={cetak}>🖨️ Cetak Sekarang ({terpilih.length})</Button>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        {/* Pilihan laporan */}
        <div className="space-y-3">
          {DAFTAR_LAPORAN.map((l) => {
            const aktif = pilihan[l.id];
            return (
              <label
                key={l.id}
                className={cn(
                  "flex cursor-pointer items-center gap-4 rounded-xl border-2 bg-white p-4 shadow-sm transition",
                  aktif ? "border-blue-500 bg-blue-50/50" : "border-slate-200 hover:border-slate-300"
                )}
              >
                <input
                  type="checkbox"
                  checked={aktif}
                  onChange={(e) => setPilihan({ ...pilihan, [l.id]: e.target.checked })}
                  className="h-5 w-5 accent-blue-600"
                />
                <span className="text-2xl">{l.ikon}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-slate-800">{l.judul}</p>
                  <p className="text-xs text-slate-500">{l.ket}</p>
                </div>
                <Button
                  variant="secondary"
                  className="!px-2.5 !py-1.5 text-xs"
                  onClick={() => {
                    const html =
                      kop() +
                      (l.id === "rekap"
                        ? htmlRekap()
                        : l.id === "kes1"
                        ? htmlKes1()
                        : l.id === "cabang"
                        ? htmlCabang()
                        : l.id === "dbtk"
                        ? htmlDatabase("tk")
                        : htmlDatabase("kes"));
                    printRawHtml(html, l.judul);
                  }}
                >
                  🖨️ Cetak Ini
                </Button>
              </label>
            );
          })}

          {/* Ringkasan data */}
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-gradient-to-br from-orange-500 to-red-500 p-4 text-white shadow">
              <p className="text-xs uppercase tracking-wide text-orange-100">BPJS Ketenagakerjaan</p>
              <p className="mt-1 text-lg font-bold tabular-nums">{formatRupiah(totalTK)}</p>
            </div>
            <div className="rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 p-4 text-white shadow">
              <p className="text-xs uppercase tracking-wide text-emerald-100">BPJS Kesehatan</p>
              <p className="mt-1 text-lg font-bold tabular-nums">{formatRupiah(totalKES)}</p>
            </div>
            <div className="rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 p-4 text-white shadow">
              <p className="text-xs uppercase tracking-wide text-blue-100">Total Tagihan</p>
              <p className="mt-1 text-lg font-bold tabular-nums">{formatRupiah(totalTK + totalKES)}</p>
            </div>
          </div>
        </div>

        {/* Pengaturan cetak */}
        <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="text-sm font-bold uppercase tracking-wide text-slate-700">
            Pengaturan Cetak
          </h3>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-500">Periode</label>
            <input
              value={periode}
              onChange={(e) => setPeriode(e.target.value)}
              className={inputCls}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-500">
              Kantor Cabang (untuk laporan Cabang &amp; Database)
            </label>
            <select
              value={cabangFilter}
              onChange={(e) => setCabangFilter(e.target.value)}
              className={inputCls}
            >
              <option value={SEMUA}>🌐 Semua Cabang</option>
              {daftarCabang.map((c) => (
                <option key={c} value={c}>
                  📍 {c}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
            <h4 className="text-xs font-bold uppercase tracking-wide text-slate-600">
              Menu Tanda Tangan
            </h4>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-500">
                Dibuat oleh
              </label>
              <input
                value={dibuatOleh}
                onChange={(e) => setDibuatOleh(e.target.value)}
                className={inputCls}
                placeholder="Administrasi KSP CU Bima"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-500">
                Diketahui oleh
              </label>
              <input
                value={diketahuiOleh}
                onChange={(e) => setDiketahuiOleh(e.target.value)}
                className={inputCls}
                placeholder="Pimpinan KSP CU Bima"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={pakaiKop}
              onChange={(e) => setPakaiKop(e.target.checked)}
              className="h-4 w-4 accent-blue-600"
            />
            Sertakan kop surat
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={pakaiTtd}
              onChange={(e) => setPakaiTtd(e.target.checked)}
              className="h-4 w-4 accent-blue-600"
            />
            Sertakan kolom tanda tangan
          </label>

          <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-500">
            💡 Setiap laporan dicetak mulai halaman baru. Pada dialog cetak browser, pilih
            <strong> Tujuan: Simpan sebagai PDF</strong> bila ingin menyimpan file.
          </div>

          <Button onClick={cetak} className="w-full">
            🖨️ Cetak {terpilih.length} Laporan
          </Button>
        </div>
      </div>

      {/* Pratinjau */}
      {terpilih.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-700">
            Pratinjau Dokumen
          </h3>
          <div
            className="max-h-[600px] overflow-auto rounded-lg border border-slate-200 bg-white p-6"
            dangerouslySetInnerHTML={{ __html: bangunHtml() }}
          />
          <style>{`
            .kop{text-align:center;border-bottom:3px double #1d4ed8;padding-bottom:10px;margin-bottom:18px}
            .kop .lembaga{font-size:15px;font-weight:700;text-transform:uppercase}
            .kop .alamat{font-size:10px;color:#6b7280}
            .judul{text-align:center;font-size:15px;font-weight:700;margin:0 0 2px;text-transform:uppercase}
            .subjudul{text-align:center;font-size:11px;color:#6b7280;margin:0 0 14px}
            .seksi{margin-bottom:32px;border-bottom:1px dashed #cbd5e1;padding-bottom:24px}
            .grup{font-size:12px;font-weight:700;color:#1d4ed8;margin:14px 0 5px}
            .seksi table{width:100%;border-collapse:collapse;font-size:10.5px;margin-bottom:10px}
            .seksi th,.seksi td{border:1px solid #cbd5e1;padding:5px 7px}
            .seksi th{background:#1d4ed8;color:#fff;font-weight:600;text-align:center}
            .seksi td.num{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}
            .seksi td.ctr{text-align:center}
            .seksi tr.total td,.seksi tr.sub td{background:#eff6ff;font-weight:700}
            .seksi tr.total td{background:#dbeafe}
            .ttd{margin-top:26px;display:flex;justify-content:space-between;font-size:11px}
            .ttd .kolom{text-align:center;width:220px}
            .ttd .ruang{height:58px}
            .ttd .garis{border-top:1px solid #475569;padding-top:3px;font-weight:600}
            .ttd .jabatan{font-size:10px;color:#6b7280}
          `}</style>
        </div>
      )}
    </div>
  );
}
