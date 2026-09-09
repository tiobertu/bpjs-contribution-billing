import { useMemo, useRef, useState } from "react";
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
import {
  AUTH_STORAGE_KEY,
  defaultUsers,
  getUsers,
  isAdminRole,
  isKeuanganRole,
  saveUsers,
  type AppUser,
} from "./utils/auth";

type Tab = "rekap" | "kesehatan" | "cabang" | "database" | "print";

const SESSION_KEY = "bpjs_login_session_v1";

const menu: { id: Tab; label: string; icon: string }[] = [
  { id: "rekap", label: "Rekap Peserta BPJS", icon: "📊" },
  { id: "kesehatan", label: "BPJS Kesehatan 1%", icon: "💚" },
  { id: "cabang", label: "Kantor Cabang", icon: "🏢" },
  { id: "database", label: "Database", icon: "🗄️" },
  { id: "print", label: "Print Out", icon: "🖨️" },
];

function AppShell({ username, role, onLogout }: { username: string; role: string; onLogout: () => void }) {
  const [tab, setTab] = useState<Tab>("rekap");
  const [adminUsers, setAdminUsers] = useState<AppUser[]>(() => getUsers());
  const [newUser, setNewUser] = useState({ username: "", password: "", role: "Administrator" as "Administrator" | "Bagian Keuangan" });
  const [editingUser, setEditingUser] = useState<string>("");
  const [editingPassword, setEditingPassword] = useState("");
  const [editingRole, setEditingRole] = useState<"Administrator" | "Bagian Keuangan">("Administrator");
  const restoreInputRef = useRef<HTMLInputElement | null>(null);
  const { pegawai, totalTK, totalKES } = useData();

  const handleBackupData = () => {
    const keys = Array.from(
      new Set([...Object.values(STORAGE_KEYS), AUTH_STORAGE_KEY])
    );
    const snapshot = Object.fromEntries(
      keys.map((key) => [key, localStorage.getItem(key)])
    );
    const payload = {
      exportedAt: new Date().toISOString(),
      app: "KSP CU BIMA BPJS",
      data: snapshot,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bpjs-backup-${new Date().toISOString().slice(0, 16).replace(/[:T]/g, "-")}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    alert("Backup data berhasil dibuat. Anda dapat memulihkan file backup kapan saja.");
  };

  const handleRestoreData = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as { data?: Record<string, string | null> };
      if (!parsed?.data || typeof parsed.data !== "object") {
        throw new Error("Format backup tidak valid.");
      }

      const confirmed = window.confirm(
        "Restore data akan mengganti data aplikasi yang tersimpan saat ini. Lanjutkan?"
      );
      if (!confirmed) {
        event.target.value = "";
        return;
      }

      Object.entries(parsed.data).forEach(([key, value]) => {
        if (value === null || value === undefined) {
          localStorage.removeItem(key);
          return;
        }
        localStorage.setItem(key, value);
      });

      const authValue = parsed.data[AUTH_STORAGE_KEY];
      if (authValue) {
        try {
          const authUsers = JSON.parse(authValue) as AppUser[];
          if (Array.isArray(authUsers)) {
            saveAdminUsers(authUsers);
          }
        } catch {
          // ignore invalid auth payload
        }
      }

      event.target.value = "";
      alert("Restore data berhasil. Halaman akan dimuat ulang untuk menerapkan data baru.");
      window.location.reload();
    } catch (error) {
      event.target.value = "";
      alert(
        error instanceof Error
          ? `Restore gagal: ${error.message}`
          : "Restore gagal. Pastikan file backup yang dipilih valid."
      );
    }
  };

  const isAdmin = isAdminRole(role);
  const isKeuangan = isKeuanganRole(role);

  const visibleMenu = useMemo(() => {
    if (isKeuangan) {
      return menu.filter((m) => m.id !== "database" && m.id !== "kesehatan");
    }
    return menu;
  }, [isKeuangan]);

  const saveAdminUsers = (next: AppUser[]) => {
    setAdminUsers(next);
    saveUsers(next);
  };

  const handleUserSave = () => {
    if (!newUser.username.trim() || !newUser.password.trim()) {
      alert("Username dan password tidak boleh kosong.");
      return;
    }
    const next = [...adminUsers];
    const current = next.find((u) => u.username.toLowerCase() === newUser.username.trim().toLowerCase());
    if (current) {
      current.password = newUser.password;
      current.role = newUser.role;
    } else {
      next.push({
        username: newUser.username.trim(),
        password: newUser.password,
        role: newUser.role,
      });
    }
    saveAdminUsers(next);
    setNewUser({ username: "", password: "", role: "Administrator" });
  };

  const handleUserEdit = () => {
    if (!editingUser.trim() || !editingPassword.trim()) {
      alert("Username dan password tidak boleh kosong.");
      return;
    }
    const next = adminUsers.map((u) =>
      u.username.toLowerCase() === editingUser.trim().toLowerCase()
        ? { ...u, username: editingUser.trim(), password: editingPassword, role: editingRole }
        : u
    );
    saveAdminUsers(next);
    setEditingUser("");
    setEditingPassword("");
    setEditingRole("Administrator");
  };

  const deleteUser = (target: string) => {
    if (target.toLowerCase() === "admin") {
      alert("Akun admin utama tidak dapat dihapus.");
      return;
    }
    const next = adminUsers.filter((u) => u.username.toLowerCase() !== target.toLowerCase());
    saveAdminUsers(next);
  };

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
              {isAdmin && (
                <>
                  <button
                    onClick={handleBackupData}
                    className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-500/20"
                    title="Backup data aplikasi"
                  >
                    💾 Backup
                  </button>
                  <button
                    onClick={() => restoreInputRef.current?.click()}
                    className="rounded-xl border border-blue-400/30 bg-blue-500/10 px-3 py-2 text-sm font-semibold text-blue-100 transition hover:bg-blue-500/20"
                    title="Restore data dari file backup"
                  >
                    ♻ Restore
                  </button>
                  <input
                    ref={restoreInputRef}
                    type="file"
                    accept=".json,application/json"
                    className="hidden"
                    onChange={handleRestoreData}
                  />
                </>
              )}
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
                  onLogout();
                  window.location.reload();
                }}
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
            {visibleMenu.map((m) => (
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
        {isKeuangan && tab === "print" && <MenuPrint />}
        {isKeuangan && tab === "rekap" && <MenuRekap />}
        {isKeuangan && tab === "cabang" && <MenuCabang />}
        {isKeuangan && tab === "kesehatan" && <MenuKesehatan1 />}
        {!isKeuangan && tab === "rekap" && <MenuRekap />}
        {!isKeuangan && tab === "kesehatan" && <MenuKesehatan1 />}
        {!isKeuangan && tab === "cabang" && <MenuCabang />}
        {!isKeuangan && tab === "database" && <MenuDatabase />}
        {!isKeuangan && tab === "print" && <MenuPrint />}

        {isAdmin && (
          <div className="mt-6 space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="mb-3 text-lg font-bold text-slate-900">Backup & Restore Data</h3>
              <p className="mb-4 text-sm text-slate-500">
                Simpan salinan data aplikasi untuk cadangan, lalu restore saat dibutuhkan tanpa kehilangan database.
              </p>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handleBackupData}
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                >
                  💾 Backup Data
                </button>
                <button
                  onClick={() => restoreInputRef.current?.click()}
                  className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100"
                >
                  ♻ Restore Data
                </button>
                <input
                  ref={restoreInputRef}
                  type="file"
                  accept=".json,application/json"
                  className="hidden"
                  onChange={handleRestoreData}
                />
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="mb-4 text-lg font-bold text-slate-900">Pengaturan Pengguna</h3>

              <div className="grid gap-4 lg:grid-cols-4">
              <input
                value={newUser.username}
                onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                placeholder="Username baru"
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <input
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                placeholder="Password"
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <select
                value={newUser.role}
                onChange={(e) => setNewUser({ ...newUser, role: e.target.value as "Administrator" | "Bagian Keuangan" })}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="Administrator">Administrator</option>
                <option value="Bagian Keuangan">Bagian Keuangan</option>
              </select>
              <button
                onClick={handleUserSave}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                + Simpan User
              </button>
            </div>

              <div className="mt-6 space-y-3">
                {adminUsers.map((user) => (
                  <div key={user.username} className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 md:flex-row md:items-center">
                    <div className="min-w-[120px] font-semibold text-slate-700">{user.username}</div>
                    <input
                      value={editingUser.toLowerCase() === user.username.toLowerCase() ? editingPassword : user.password}
                      onChange={(e) => {
                        setEditingUser(user.username);
                        setEditingPassword(e.target.value);
                        setEditingRole(user.role);
                      }}
                      className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <select
                      value={editingUser.toLowerCase() === user.username.toLowerCase() ? editingRole : user.role}
                      onChange={(e) => {
                        setEditingUser(user.username);
                        setEditingRole(e.target.value as "Administrator" | "Bagian Keuangan");
                      }}
                      className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="Administrator">Administrator</option>
                      <option value="Bagian Keuangan">Bagian Keuangan</option>
                    </select>
                    <button
                      onClick={handleUserEdit}
                      className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100"
                    >
                      Simpan
                    </button>
                    {user.username.toLowerCase() !== "admin" && (
                      <button
                        onClick={() => deleteUser(user.username)}
                        className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-100"
                      >
                        Hapus
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
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
  const getStoredSession = () => {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as { username?: string; role?: string };
      if (!parsed.username || !parsed.role) return null;
      return { username: parsed.username, role: parsed.role };
    } catch {
      return null;
    }
  };

  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => !!getStoredSession());
  const [username, setUsername] = useState<string>(() => getStoredSession()?.username ?? "");
  const [role, setRole] = useState<string>(() => getStoredSession()?.role ?? "");

  const handleLogout = () => {
    setUsername("");
    setRole("");
    setIsLoggedIn(false);
    localStorage.removeItem(SESSION_KEY);
  };

  const handleLogin = (u: string, r: string) => {
    setUsername(u);
    setRole(r);
    setIsLoggedIn(true);
    localStorage.setItem(SESSION_KEY, JSON.stringify({ username: u, role: r }));
  };

  if (!isLoggedIn) {
    return (
      <Login
        onLogin={(u, r) => {
          handleLogin(u, r);
        }}
      />
    );
  }

  return (
    <DataProvider>
      <AppShell username={username} role={role} onLogout={handleLogout} />
    </DataProvider>
  );
}
