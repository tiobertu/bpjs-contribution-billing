import { useState } from "react";
import { MenuRekap } from "./components/MenuRekap";
import { MenuKesehatan1 } from "./components/MenuKesehatan1";
import { MenuCabang } from "./components/MenuCabang";
import { MenuDatabase } from "./components/MenuDatabase";
import { MenuPrint } from "./components/MenuPrint";
import { Login } from "./components/Login";
import { cn } from "./utils/cn";
import { bulanIni, formatRupiah } from "./utils/format";
import { STORAGE_KEYS } from "./data/seed";
import { DataProvider, useData } from "./context/DataContext";

type Tab = "rekap" | "kesehatan" | "cabang" | "database" | "print";

const menu: { id: Tab; label: string; icon: string }[] = [
  { id: "rekap", label: "Rekap Peserta BPJS", icon: "📊" },
  { id: "kesehatan", label: "BPJS Kesehatan 1%", icon: "💚" },
  { id: "cabang", label: "Kantor Cabang", icon: "🏢" },
  { id: "database", label: "Database", icon: "🗄️" },
  { id: "print", label: "Print Out", icon: "🖨️" },
];

function AppShell() {
  const [tab, setTab] = useState<Tab>("rekap");
  const [username, setUsername] = useState("");
  const [role, setRole] = useState("");
  const { pegawai, totalTK, totalKES } = useData();

  const kpiCards = [
    {
      label: "Total Pegawai",
      value: pegawai.length.toLocaleString("id-ID"),
      detail: "Data aktif terdaftar",
      accent: "from-blue-500 to-indigo-600",
      tone: "bg-blue-50 text-blue-700",
    },
    {
      label: "BPJS Ketenagakerjaan",
      value: formatRupiah(totalTK),
      detail: "Total iuran TK",
      accent: "from-orange-500 to-red-500",
      tone: "bg-orange-50 text-orange-700",
    },
    {
      label: "BPJS Kesehatan",
      value: formatRupiah(totalKES),
      detail: "Total iuran Kesehatan",
      accent: "from-emerald-500 to-teal-600",
      tone: "bg-emerald-50 text-emerald-700",
    },
    {
      label: "Total Tagihan",
      value: formatRupiah(totalTK + totalKES),
      detail: "Jumlah seluruh iuran",
      accent: "from-violet-500 to-indigo-600",
      tone: "bg-violet-50 text-violet-700",
    },
  ];

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.16),_transparent_25%),linear-gradient(180deg,_#f8fbff_0%,_#edf3ff_42%,_#f8fafc_100%)] print:bg-white">
      {/* Header */}
      <header className="no-print border-b border-slate-200/80 bg-slate-950 text-white shadow-[0_16px_40px_rgba(15,23,42,0.18)]">
        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6">
          <div className="flex flex-col items-start justify-between gap-4 lg:flex-row lg:items-center">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 via-indigo-500 to-cyan-400 text-xl font-black shadow-[0_12px_24px_rgba(59,130,246,0.35)]">
                CU
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-300">
                  Koperasi Simpan Pinjam
                </p>
                <h1 className="text-base font-black tracking-tight sm:text-xl">
                  CU BINA MASYARAKAT
                </h1>
                <p className="text-[11px] uppercase tracking-[0.24em] text-slate-400">
                  Tagihan Iuran BPJS
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 lg:justify-end">
              <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-slate-100 backdrop-blur-sm">
                Periode: <span className="font-bold text-white">{bulanIni()}</span>
              </div>
              <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-slate-100 backdrop-blur-sm">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 text-xs font-black text-white">
                  {username.charAt(0).toUpperCase()}
                </span>
                <div className="leading-tight">
                  <p className="font-semibold capitalize text-white">{username}</p>
                  <p className="text-[11px] text-slate-300">{role}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  if (
                    window.confirm(
                      "Kembalikan seluruh data ke data awal (172 pegawai)?\nSemua perubahan pada Database, Rekap, Cabang, dan Kesehatan 1% akan hilang."
                    )
                  ) {
                    Object.values(STORAGE_KEYS).forEach((k) =>
                      localStorage.removeItem(k)
                    );
                    window.location.reload();
                  }
                }}
                className="rounded-xl border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-sm font-semibold text-amber-100 transition hover:bg-amber-500/20"
                title="Kembalikan ke data awal"
              >
                🔄 Reset
              </button>
              <button
                onClick={() => setUsername("") || setRole("") || window.location.reload()}
                className="rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm font-semibold text-red-100 transition hover:bg-red-500/20"
                title="Keluar"
              >
                Keluar ↩
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigasi tab */}
      <nav className="no-print sticky top-0 z-20 border-b border-slate-200 bg-white/85 shadow-[0_8px_24px_rgba(15,23,42,0.03)] backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex gap-1 overflow-x-auto py-2">
            {menu.map((m) => (
              <button
                key={m.id}
                onClick={() => setTab(m.id)}
                className={cn(
                  "flex shrink-0 items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all duration-200",
                  tab === m.id
                    ? "border-blue-200 bg-blue-50 text-blue-700 shadow-sm"
                    : "border-transparent text-slate-500 hover:border-slate-200 hover:bg-slate-50 hover:text-slate-700"
                )}
              >
                <span>{m.icon}</span>
                {m.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {kpiCards.map((card) => (
            <div
              key={card.label}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.04)]"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                  {card.label}
                </span>
                <span className={cn("rounded-full px-2 py-1 text-[9px] font-bold uppercase tracking-[0.18em]", card.tone)}>
                  Live
                </span>
              </div>
              <div className={cn("mt-4 h-1.5 rounded-full bg-gradient-to-r", card.accent)} />
              <p className="mt-4 text-2xl font-black tracking-tight text-slate-900">
                {card.value}
              </p>
              <p className="mt-1 text-xs text-slate-500">{card.detail}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Konten */}
      <main className="mx-auto max-w-7xl px-4 pb-8 sm:px-6">
        {tab === "rekap" && <MenuRekap />}
        {tab === "kesehatan" && <MenuKesehatan1 />}
        {tab === "cabang" && <MenuCabang />}
        {tab === "database" && <MenuDatabase />}
        {tab === "print" && <MenuPrint />}
      </main>

      <footer className="no-print border-t border-slate-200 bg-white/70 py-5 backdrop-blur-sm">
        <p className="text-center text-xs text-slate-500">
          © {new Date().getFullYear()} KSP CU Bima — Aplikasi Tagihan Iuran BPJS.
          Data tersimpan otomatis di perangkat Anda.
        </p>
      </footer>
    </div>
  );
}

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [role, setRole] = useState("");

  if (!isLoggedIn) {
    return (
      <Login
        onLogin={(u, r) => {
          setUsername(u);
          setRole(r);
          setIsLoggedIn(true);
        }}
      />
    );
  }

  return (
    <DataProvider>
      <AppShell />
    </DataProvider>
  );
}
