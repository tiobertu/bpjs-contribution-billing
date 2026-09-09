// Format angka ke format Rupiah Indonesia (tanpa desimal)
export function formatRupiah(value: number): string {
  const num = Math.round(Number(value) || 0);
  return "Rp " + num.toLocaleString("id-ID");
}

// Membulatkan ke integer (tanpa desimal)
export function toInt(value: number | string): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.round(n);
}

// Format nilai untuk ditampilkan di input (angka integer dengan pemisah ribuan)
export function formatInputNumber(value: number | string): string {
  const n = toInt(value);
  return n.toLocaleString("id-ID");
}

// Parse input dengan pemisah ribuan menjadi integer
export function parseInputNumber(value: string): number {
  if (value === "" || value === "-") return 0;
  const clean = value.replace(/[^\d-]/g, "");
  const n = parseInt(clean, 10);
  return Number.isFinite(n) ? n : 0;
}

// Format angka tanpa simbol
export function formatNumber(value: number): string {
  const num = Number(value) || 0;
  return num.toLocaleString("id-ID");
}

// Parse string rupiah ke angka
export function parseNumber(value: string): number {
  const clean = value.replace(/[^\d.-]/g, "");
  const num = parseFloat(clean);
  return Number.isFinite(num) ? num : 0;
}

// Format tanggal Indonesia
export function formatDate(dateStr: string): string {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const bulan = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
  ];
  return `${d.getDate()} ${bulan[d.getMonth()]} ${d.getFullYear()}`;
}

// Mendapatkan tanggal hari ini dalam format yyyy-mm-dd
export function todayString(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// Mendapatkan nama bulan
export function bulanIni(): string {
  const bulan = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
  ];
  const d = new Date();
  return `${bulan[d.getMonth()]} ${d.getFullYear()}`;
}
