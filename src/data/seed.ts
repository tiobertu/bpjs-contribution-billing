import { dataPegawai } from "./pegawai";

/** Satu baris peserta pada menu Database (dipakai untuk TK maupun Kesehatan) */
export interface DatabasePeserta {
  /** kunci stabil yang menghubungkan baris TK dengan baris Kesehatan */
  key: string;
  id: string;
  nama: string;
  nipb: string;
  jumlahBulanLalu: number;
  /** kolom "Nama Pegawai" dipakai untuk menyimpan Kantor Cabang */
  namaPegawai: string;
  tanggalLahir: string;
  /** tanggal saat data bulan ini diinput; bila kosong maka iuran bulan ini dianggap belum ada */
  tanggalInput: string;
  iuranBulanIni: number;
}

/** Peserta tambahan (anggota keluarga) pada menu BPJS Kesehatan 1% */
export interface PesertaTambahan {
  id: string;
  namaPeserta: string;
  hubKeluarga: string;
  /** nama pegawai penanggung — diambil dari Database */
  namaOrangTua: string;
}

/** Rekap per kantor cabang (hasil kalkulasi otomatis) */
export interface CabangData {
  id: string;
  nama: string;
  bpjsKetenagakerjaan: number;
  bpjsKesehatan: number;
}

/** Gabungan data TK + Kesehatan untuk satu pegawai */
export interface PegawaiGabungan {
  key: string;
  nama: string;
  nipb: string;
  cabang: string;
  tanggalLahir: string;
  tk: number;
  kes: number;
}

/* ------------------------------------------------------------------
 * DATA AWAL — 172 pegawai KSP CU BIMA
 * ------------------------------------------------------------------ */
export const seedDatabaseTK: DatabasePeserta[] = dataPegawai.map((p, i) => ({
  key: "pg" + (i + 1),
  id: "dtk" + (i + 1),
  nama: p.nama,
  nipb: p.nipb,
  jumlahBulanLalu: p.tk,
  namaPegawai: p.cabang,
  tanggalLahir: p.tanggalLahir,
  tanggalInput: "",
  iuranBulanIni: p.tk,
}));

export const seedDatabaseKes: DatabasePeserta[] = dataPegawai.map((p, i) => ({
  key: "pg" + (i + 1),
  id: "dkes" + (i + 1),
  nama: p.nama,
  nipb: p.nipb,
  jumlahBulanLalu: p.kes,
  namaPegawai: p.cabang,
  tanggalLahir: p.tanggalLahir,
  tanggalInput: "",
  iuranBulanIni: p.kes,
}));

/** Peserta tambahan / anggota keluarga untuk perhitungan premi 1% */
export const seedPeserta1: PesertaTambahan[] = [
  { id: "t1", namaPeserta: "GABRIEL TRISTAN SINOM", hubKeluarga: "ANAK", namaOrangTua: "THOMAS PAWI SINOM" },
  { id: "t2", namaPeserta: "GABRIEL TIMOTHY SINOM", hubKeluarga: "ANAK", namaOrangTua: "THOMAS PAWI SINOM" },
  { id: "t3", namaPeserta: "LUCIA REINA ROSARI", hubKeluarga: "ANAK", namaOrangTua: "AGUSTINA ERNA" },
  { id: "t4", namaPeserta: "MARTINA KUBA", hubKeluarga: "ORANG TUA", namaOrangTua: "MARSELINUS" },
  { id: "t5", namaPeserta: "ANIH", hubKeluarga: "ORANG TUA", namaOrangTua: "ROMONDUS" },
];

/** Pilihan hubungan keluarga */
export const HUB_KELUARGA = ["ANAK", "ORANG TUA", "SUAMI", "ISTRI", "MERTUA", "LAINNYA"];

/** Kunci localStorage */
export const STORAGE_KEYS = {
  dbTK: "bpjs_db_tk_v3",
  dbKES: "bpjs_db_kes_v3",
  peserta1: "bpjs_peserta_1_v3",
  extraCabang: "bpjs_extra_cabang_v3",
};
