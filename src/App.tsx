import { useState } from "react";
import { MenuRekap } from "./components/MenuRekap";
import { MenuKesehatan1 } from "./components/MenuKesehatan1";
import { MenuCabang } from "./components/MenuCabang";
import { MenuDatabase } from "./components/MenuDatabase";
import { MenuPrint } from "./components/MenuPrint";
import { Login } from "./components/Login";
import { cn } from "./utils/cn";
import { bulanIni } from "./utils/format";
import { STORAGE_KEYS } from "./data/seed";
import { DataProvider } from "./context/DataContext";

type Tab = "rekap" | "kesehatan" | "cabang" | "database" | "print";

const menu: { id: Tab; label: string; icon: string }[] = [
  { id: "rekap", label: "Rekap Peserta BPJS", icon: "📊" },
  { id: "kesehatan", label: "BPJS Kesehatan 1%", icon: "💚" },
  { id: "cabang", label: "Kantor Cabang", icon: "🏢" },
  { id: "database", label: "Database", icon: "🗄️" },
  { id: "print", label: "Print Out", icon: "🖨️" },
];

export default function App() {
  const [tab, setTab] = useState<Tab>("rekap");
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
    <div className="min-h-screen bg-slate-100 print:bg-white">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-800 via-blue-700 to-blue-600 text-white shadow-lg no-print">
        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/15 text-2xl backdrop-blur">
                🏦
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-widest text-blue-200">
                  Koperasi Simpan Pinjam Credit Union Bima
                </p>
                <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
                  TAGIHAN IURAN BPJS KSP CU BIMA
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-white/15 px-4 py-2 text-sm font-medium backdrop-blur">
                Periode: <span className="font-bold">{bulanIni()}</span>
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-white/15 px-4 py-2 text-sm font-medium backdrop-blur">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/25 text-xs font-bold">
                  {username.charAt(0).toUpperCase()}
                </span>
                <div className="leading-tight">
                  <p className="font-semibold capitalize">{username}</p>
                  <p className="text-xs text-blue-200">{role}</p>
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
                className="rounded-lg bg-white/15 px-3 py-2 text-sm font-medium backdrop-blur transition hover:bg-amber-500/80"
                title="Kembalikan ke data awal"
              >
                🔄 Reset
              </button>
              <button
                onClick={() => setIsLoggedIn(false)}
                className="rounded-lg bg-white/15 px-3 py-2 text-sm font-medium backdrop-blur transition hover:bg-red-500/80"
                title="Keluar"
              >
                Keluar ↩
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigasi tab */}
      <nav className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur no-print">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex gap-1 overflow-x-auto">
            {menu.map((m) => (
              <button
                key={m.id}
                onClick={() => setTab(m.id)}
                className={cn(
                  "flex shrink-0 items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition-colors",
                  tab === m.id
                    ? "border-blue-600 text-blue-700"
                    : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700"
                )}
              >
                <span>{m.icon}</span>
                {m.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Konten */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        {tab === "rekap" && <MenuRekap />}
        {tab === "kesehatan" && <MenuKesehatan1 />}
        {tab === "cabang" && <MenuCabang />}
        {tab === "database" && <MenuDatabase />}
        {tab === "print" && <MenuPrint />}
      </main>

      <footer className="no-print border-t border-slate-200 bg-white py-5">
        <p className="text-center text-xs text-slate-400">
          © {new Date().getFullYear()} KSP CU Bima — Aplikasi Tagihan Iuran BPJS.
          Data tersimpan otomatis di perangkat Anda.
        </p>
      </footer>
    </div>
    </DataProvider>
  );
}
