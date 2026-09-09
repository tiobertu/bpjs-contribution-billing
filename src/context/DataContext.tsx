import { createContext, useCallback, useContext, useMemo } from "react";
import { useLocalStorage } from "../hooks/useLocalStorage";
import {
  seedDatabaseTK,
  seedDatabaseKes,
  seedPeserta1,
  STORAGE_KEYS,
  type CabangData,
  type DatabasePeserta,
  type PegawaiGabungan,
  type PesertaTambahan,
} from "../data/seed";
import { toInt } from "../utils/format";

interface DataContextValue {
  dbTK: DatabasePeserta[];
  dbKES: DatabasePeserta[];
  setDbTK: React.Dispatch<React.SetStateAction<DatabasePeserta[]>>;
  setDbKES: React.Dispatch<React.SetStateAction<DatabasePeserta[]>>;
  peserta1: PesertaTambahan[];
  setPeserta1: React.Dispatch<React.SetStateAction<PesertaTambahan[]>>;
  extraCabang: string[];
  setExtraCabang: React.Dispatch<React.SetStateAction<string[]>>;
  /** daftar nama kantor cabang (dari database + tambahan manual) */
  daftarCabang: string[];
  /** data pegawai gabungan TK + Kesehatan */
  pegawai: PegawaiGabungan[];
  /** rekap otomatis per kantor cabang */
  rekap: CabangData[];
  totalTK: number;
  totalKES: number;
  /** ubah satu pegawai — otomatis menulis ke database TK & Kesehatan */
  updatePegawai: (key: string, patch: Partial<PegawaiGabungan>) => void;
  hapusPegawai: (key: string) => void;
  tambahPegawai: (cabang: string) => void;
  /** ganti seluruh data pegawai (dipakai saat import) */
  gantiSemuaPegawai: (rows: PegawaiGabungan[]) => void;
  /** import aman: gabungkan/perbarui atau ganti seluruhnya */
  upsertPegawai: (
    rows: Partial<PegawaiGabungan>[],
    mode: "merge" | "replace"
  ) => { diperbarui: number; ditambah: number; dihapus: number };
  /** iuran BPJS Kesehatan pegawai berdasarkan nama */
  iuranKesByNama: (nama: string) => number;
}

const Ctx = createContext<DataContextValue | null>(null);

export function useData() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useData harus dipakai di dalam DataProvider");
  return v;
}

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [dbTK, setDbTK] = useLocalStorage<DatabasePeserta[]>(
    STORAGE_KEYS.dbTK,
    seedDatabaseTK
  );
  const [dbKES, setDbKES] = useLocalStorage<DatabasePeserta[]>(
    STORAGE_KEYS.dbKES,
    seedDatabaseKes
  );
  const [peserta1, setPeserta1] = useLocalStorage<PesertaTambahan[]>(
    STORAGE_KEYS.peserta1,
    seedPeserta1
  );
  const [extraCabang, setExtraCabang] = useLocalStorage<string[]>(
    STORAGE_KEYS.extraCabang,
    []
  );

  /* ---------- Gabungkan data TK & Kesehatan berdasarkan key ---------- */
  const pegawai = useMemo<PegawaiGabungan[]>(() => {
    const kesMap = new Map(dbKES.map((d) => [d.key, d]));
    const hasil: PegawaiGabungan[] = dbTK.map((t) => {
      const k = kesMap.get(t.key);
      return {
        key: t.key,
        nama: t.nama,
        nipb: t.nipb,
        cabang: t.namaPegawai || k?.namaPegawai || "",
        tanggalLahir: t.tanggalLahir || k?.tanggalLahir || "",
        tk: toInt(t.iuranBulanIni),
        kes: toInt(k?.iuranBulanIni ?? 0),
      };
    });
    // peserta yang hanya ada di database Kesehatan
    const tkKeys = new Set(dbTK.map((t) => t.key));
    dbKES
      .filter((k) => !tkKeys.has(k.key))
      .forEach((k) =>
        hasil.push({
          key: k.key,
          nama: k.nama,
          nipb: k.nipb,
          cabang: k.namaPegawai,
          tanggalLahir: k.tanggalLahir,
          tk: 0,
          kes: toInt(k.iuranBulanIni),
        })
      );
    return hasil;
  }, [dbTK, dbKES]);

  /* ---------- Daftar kantor cabang ---------- */
  const daftarCabang = useMemo(() => {
    const set = new Set<string>();
    pegawai.forEach((p) => p.cabang && set.add(p.cabang));
    extraCabang.forEach((c) => c && set.add(c));
    const all = Array.from(set);
    const pusat = all.filter((n) => n.toLowerCase().includes("kantor pusat"));
    const lain = all
      .filter((n) => !n.toLowerCase().includes("kantor pusat"))
      .sort((a, b) => a.localeCompare(b, "id"));
    return [...pusat, ...lain];
  }, [pegawai, extraCabang]);

  /* ---------- Rekap otomatis per cabang ---------- */
  const rekap = useMemo<CabangData[]>(
    () =>
      daftarCabang.map((nama, i) => {
        const list = pegawai.filter((p) => p.cabang === nama);
        return {
          id: "c" + (i + 1),
          nama,
          bpjsKetenagakerjaan: list.reduce((a, p) => a + p.tk, 0),
          bpjsKesehatan: list.reduce((a, p) => a + p.kes, 0),
        };
      }),
    [daftarCabang, pegawai]
  );

  const totalTK = useMemo(() => pegawai.reduce((a, p) => a + p.tk, 0), [pegawai]);
  const totalKES = useMemo(() => pegawai.reduce((a, p) => a + p.kes, 0), [pegawai]);

  /* ---------- Aksi ---------- */
  const updatePegawai = useCallback(
    (key: string, patch: Partial<PegawaiGabungan>) => {
      const umum: Partial<DatabasePeserta> = {};
      if (patch.nama !== undefined) umum.nama = patch.nama;
      if (patch.nipb !== undefined) umum.nipb = patch.nipb;
      if (patch.cabang !== undefined) umum.namaPegawai = patch.cabang;
      if (patch.tanggalLahir !== undefined) umum.tanggalLahir = patch.tanggalLahir;
      if ((patch as any).tanggalInput !== undefined)
        (umum as any).tanggalInput = (patch as any).tanggalInput;

      setDbTK(
        dbTK.map((d) =>
          d.key === key
            ? {
                ...d,
                ...umum,
                ...(patch.tk !== undefined ? { iuranBulanIni: toInt(patch.tk) } : {}),
              }
            : d
        )
      );
      setDbKES(
        dbKES.map((d) =>
          d.key === key
            ? {
                ...d,
                ...umum,
                ...(patch.kes !== undefined ? { iuranBulanIni: toInt(patch.kes) } : {}),
              }
            : d
        )
      );
    },
    [dbTK, dbKES, setDbTK, setDbKES]
  );

  const hapusPegawai = useCallback(
    (key: string) => {
      setDbTK(dbTK.filter((d) => d.key !== key));
      setDbKES(dbKES.filter((d) => d.key !== key));
    },
    [dbTK, dbKES, setDbTK, setDbKES]
  );

  const tambahPegawai = useCallback(
    (cabang: string) => {
      const key = "pg" + Date.now();
      const baru = {
        key,
        nama: "",
        nipb: "",
        jumlahBulanLalu: 0,
        namaPegawai: cabang,
        tanggalLahir: "",
        tanggalInput: "",
        iuranBulanIni: 0,
      };
      setDbTK([...dbTK, { ...baru, id: "dtk" + key }]);
      setDbKES([...dbKES, { ...baru, id: "dkes" + key }]);
    },
    [dbTK, dbKES, setDbTK, setDbKES]
  );

  const gantiSemuaPegawai = useCallback(
    (rows: PegawaiGabungan[]) => {
      setDbTK(
        rows.map((r, i) => ({
          key: r.key || "pg" + (i + 1),
          id: "dtk" + (i + 1),
          nama: r.nama,
          nipb: r.nipb,
          jumlahBulanLalu: toInt(r.tk),
          namaPegawai: r.cabang,
          tanggalLahir: r.tanggalLahir,
          tanggalInput: "",
          iuranBulanIni: toInt(r.tk),
        }))
      );
      setDbKES(
        rows.map((r, i) => ({
          key: r.key || "pg" + (i + 1),
          id: "dkes" + (i + 1),
          nama: r.nama,
          nipb: r.nipb,
          jumlahBulanLalu: toInt(r.kes),
          namaPegawai: r.cabang,
          tanggalLahir: r.tanggalLahir,
          tanggalInput: "",
          iuranBulanIni: toInt(r.kes),
        }))
      );
    },
    [setDbTK, setDbKES]
  );

  /**
   * Import aman.
   * mode "merge"  : baris yang cocok (NIPB, lalu Nama) diperbarui, sisanya ditambahkan.
   *                 Kolom yang tidak ada di file TIDAK diubah -> data lama tidak hilang.
   * mode "replace": data akhir hanya berisi baris dari file.
   */
  const upsertPegawai = useCallback(
    (rows: Partial<PegawaiGabungan>[], mode: "merge" | "replace") => {
      const norm = (s?: string) => (s ?? "").trim().toLowerCase();
      const ada = (v: unknown) => v !== undefined && v !== null && v !== "";

      const tkMap = new Map(dbTK.map((d) => [d.key, { ...d }]));
      const kesMap = new Map(dbKES.map((d) => [d.key, { ...d }]));

      const byNipb = new Map<string, string>();
      const byNama = new Map<string, string>();
      pegawai.forEach((p) => {
        if (p.nipb.trim()) byNipb.set(norm(p.nipb), p.key);
        if (p.nama.trim() && !byNama.has(norm(p.nama))) byNama.set(norm(p.nama), p.key);
      });

      const urutanLama = pegawai.map((p) => p.key);
      const keyBaru: string[] = [];
      const urutanFile: string[] = [];
      const tersentuh = new Set<string>();
      let diperbarui = 0;
      let ditambah = 0;
      let seq = 0;

      rows.forEach((r) => {
        const nipbKey = norm(r.nipb);
        const namaKey = norm(r.nama);
        let key =
          (nipbKey && byNipb.get(nipbKey)) || (namaKey && byNama.get(namaKey)) || "";
        if (key && tersentuh.has(key)) key = ""; // jangan timpa baris yang sama dua kali

        if (!key) {
          key = "pg" + Date.now() + "_" + seq++;
          const kosong = {
            key,
            nama: "",
            nipb: "",
            jumlahBulanLalu: 0,
            namaPegawai: "",
            tanggalLahir: "",
            iuranBulanIni: 0,
          };
          tkMap.set(key, { ...kosong, id: "dtk_" + key });
          kesMap.set(key, { ...kosong, id: "dkes_" + key });
          keyBaru.push(key);
          if (nipbKey) byNipb.set(nipbKey, key);
          if (namaKey && !byNama.has(namaKey)) byNama.set(namaKey, key);
          ditambah++;
        } else {
          diperbarui++;
        }
        tersentuh.add(key);
        urutanFile.push(key);

        const t = tkMap.get(key)!;
        const k = kesMap.get(key)!;
        // Hanya isi kolom yang benar-benar ada pada file
        if (ada(r.nama)) {
          t.nama = String(r.nama);
          k.nama = String(r.nama);
        }
        if (ada(r.nipb)) {
          t.nipb = String(r.nipb);
          k.nipb = String(r.nipb);
        }
        if (ada(r.cabang)) {
          t.namaPegawai = String(r.cabang);
          k.namaPegawai = String(r.cabang);
        }
        if (ada(r.tanggalLahir)) {
          t.tanggalLahir = String(r.tanggalLahir);
          k.tanggalLahir = String(r.tanggalLahir);
        }
        if (r.tk !== undefined) t.iuranBulanIni = toInt(r.tk);
        if (r.kes !== undefined) k.iuranBulanIni = toInt(r.kes);
      });

      const urutanAkhir =
        mode === "replace" ? urutanFile : [...urutanLama, ...keyBaru];

      const dihapus =
        mode === "replace" ? urutanLama.filter((k) => !tersentuh.has(k)).length : 0;

      setDbTK(
        urutanAkhir
          .map((k, i) => {
            const row = tkMap.get(k);
            return row ? { ...row, id: "dtk" + (i + 1) } : null;
          })
          .filter(Boolean) as DatabasePeserta[]
      );
      setDbKES(
        urutanAkhir
          .map((k, i) => {
            const row = kesMap.get(k);
            return row ? { ...row, id: "dkes" + (i + 1) } : null;
          })
          .filter(Boolean) as DatabasePeserta[]
      );

      return { diperbarui, ditambah, dihapus };
    },
    [dbTK, dbKES, pegawai, setDbTK, setDbKES]
  );

  const iuranKesByNama = useCallback(
    (nama: string) => {
      const target = nama.trim().toLowerCase();
      const found = pegawai.find((p) => p.nama.trim().toLowerCase() === target);
      return found ? found.kes : 0;
    },
    [pegawai]
  );

  const value: DataContextValue = {
    dbTK,
    dbKES,
    setDbTK,
    setDbKES,
    peserta1,
    setPeserta1,
    extraCabang,
    setExtraCabang,
    daftarCabang,
    pegawai,
    rekap,
    totalTK,
    totalKES,
    updatePegawai,
    hapusPegawai,
    tambahPegawai,
    gantiSemuaPegawai,
    upsertPegawai,
    iuranKesByNama,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
