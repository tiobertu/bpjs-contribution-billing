import { useEffect, useMemo, useRef, useState } from "react";
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

type Tab = "rekap" | "kesehatan" | "cabang" | "database" | "print" | "backup" | "settings";

const SESSION_KEY = "bpjs_login_session_v1";
const OFFLINE_USERS_KEY = "bpjs_offline_users_v1";

const menu: { id: Tab; label: string; icon: string }[] = [
  { id: "rekap", label: "Rekap Peserta BPJS", icon: "📊" },
  { id: "kesehatan", label: "BPJS Kesehatan 1%", icon: "💚" },
  { id: "cabang", label: "Kantor Cabang", icon: "🏢" },
  { id: "database", label: "Database", icon: "🗄️" },
  { id: "print", label: "Print Out", icon: "🖨️" },
  { id: "backup", label: "Backup & Restore", icon: "💾" },
  { id: "settings", label: "Pengaturan User", icon: "👤" },
];

function AppShell({
  username,
  role,
  onLogout,
  onSetSession,
}: {
  username: string;
  role: string;
  onLogout: () => void;
  onSetSession: (nextUsername: string, nextRole: string) => void;
}) {
  const [tab, setTab] = useState<Tab>("rekap");
  const [adminUsers, setAdminUsers] = useState<AppUser[]>(() => getUsers());
  const [newUser, setNewUser] = useState({ username: "", password: "", role: "Administrator" as "Administrator" | "Bagian Keuangan" });
  const [editingUser, setEditingUser] = useState<string>("");
  const [editingPassword, setEditingPassword] = useState("");
  const [editingRole, setEditingRole] = useState<"Administrator" | "Bagian Keuangan">("Administrator");
  const [showAllUsers, setShowAllUsers] = useState(false);
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<"all" | "Administrator" | "Bagian Keuangan">("all");
  const [userSearch, setUserSearch] = useState("");
  const [showNewUserPassword, setShowNewUserPassword] = useState(false);
  const [showResetPasswords, setShowResetPasswords] = useState<Record<string, boolean>>({});
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem("bpjs_theme_mode");
      return saved ? saved === "dark" : false;
    } catch {
      return false;
    }
  });
  const [offlineUsers, setOfflineUsers] = useState<Record<string, boolean>>(() => {
    try {
      const raw = localStorage.getItem(OFFLINE_USERS_KEY);
      return raw ? (JSON.parse(raw) as Record<string, boolean>) : {};
    } catch {
      return {};
    }
  });
  const [resetDrafts, setResetDrafts] = useState<Record<string, string>>({});
  const restoreInputRef = useRef<HTMLInputElement | null>(null);
  const { pegawai, totalTK, totalKES } = useData();

  useEffect(() => {
    localStorage.setItem(OFFLINE_USERS_KEY, JSON.stringify(offlineUsers));
  }, [offlineUsers]);

  useEffect(() => {
    document.documentElement.dataset.theme = isDarkMode ? "dark" : "light";
    localStorage.setItem("bpjs_theme_mode", isDarkMode ? "dark" : "light");
  }, [isDarkMode]);

  const handleBackupData = () => {
    const keys = Array.from(
      new Set([...Object.values(STORAGE_KEYS), AUTH_STORAGE_KEY, OFFLINE_USERS_KEY])
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

      const offlineValue = parsed.data[OFFLINE_USERS_KEY];
      if (offlineValue !== undefined && offlineValue !== null) {
        try {
          const parsedOffline = JSON.parse(offlineValue) as Record<string, boolean>;
          if (parsedOffline && typeof parsedOffline === "object") {
            setOfflineUsers(parsedOffline);
            localStorage.setItem(OFFLINE_USERS_KEY, offlineValue);
          }
        } catch {
          // ignore invalid offline payload
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
      return menu.filter(
        (m) => m.id !== "database" && m.id !== "kesehatan" && m.id !== "backup" && m.id !== "settings"
      );
    }
    return menu;
  }, [isKeuangan]);

  const saveAdminUsers = (next: AppUser[]) => {
    setAdminUsers(next);
    saveUsers(next);
  };

  const handleUserSave = () => {
    const username = newUser.username.trim();
    const password = newUser.password.trim();

    if (!username || !password) {
      alert("Username dan password tidak boleh kosong.");
      return;
    }

    const normalized = username.toLowerCase();
    const next = [...adminUsers];
    const existingIndex = next.findIndex((u) => u.username.toLowerCase() === normalized);

    if (existingIndex >= 0) {
      next[existingIndex] = {
        ...next[existingIndex],
        username,
        password,
        role: newUser.role,
      };
    } else {
      next.push({
        username,
        password,
        role: newUser.role,
      });
    }

    saveAdminUsers(next);
    setNewUser({ username: "", password: "", role: "Administrator" });
    onSetSession(username, newUser.role);
    alert(`User "${username}" berhasil disimpan dan masuk ke akun baru.`);
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

    const confirmed = window.confirm(`Yakin ingin menghapus user "${target}"?`);
    if (!confirmed) return;

    const next = adminUsers.filter((u) => u.username.toLowerCase() !== target.toLowerCase());
    saveAdminUsers(next);
  };

  const resetPassword = (target: string, nextPassword?: string) => {
    const finalPassword = (nextPassword ?? "123456").trim();

    if (!finalPassword) {
      alert("Password baru tidak boleh kosong.");
      return;
    }

    const confirmed = window.confirm(
      `Yakin ingin mengubah password user "${target}" menjadi "${finalPassword}"?`
    );
    if (!confirmed) return;

    const next = adminUsers.map((u) =>
      u.username.toLowerCase() === target.toLowerCase() ? { ...u, password: finalPassword } : u
    );
    saveAdminUsers(next);
    setResetDrafts((prev) => ({ ...prev, [target]: "" }));
    alert(`Password user "${target}" berhasil diubah.`);
  };

  const visibleUsers = useMemo(() => {
    const search = userSearch.trim().toLowerCase();
    const roleFiltered =
      selectedRoleFilter === "all"
        ? adminUsers
        : adminUsers.filter((user) => user.role === selectedRoleFilter);

    const keywordFiltered = !search
      ? roleFiltered
      : roleFiltered.filter((user) => user.username.toLowerCase().includes(search));

    return showAllUsers ? keywordFiltered : keywordFiltered.slice(0, 3);
  }, [adminUsers, selectedRoleFilter, showAllUsers, userSearch]);

  const toggleOfflineStatus = (target: string) => {
    setOfflineUsers((prev) => ({ ...prev, [target]: !prev[target] }));
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
    <div
      className={cn(
        "min-h-screen print:bg-white",
        isDarkMode
          ? "bg-slate-950 text-slate-100"
          : "bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.16),_transparent_25%),linear-gradient(180deg,_#f8fbff_0%,_#edf3ff_42%,_#f8fafc_100%)]"
      )}
    >
      {/* Header */}
      <header className="no-print border-b border-slate-200/80 bg-slate-950 text-white shadow-[0_16px_40px_rgba(15,23,42,0.18)]">
        <div className="mx-auto w-full max-w-7xl px-3 py-4 sm:px-6 lg:py-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 via-indigo-500 to-cyan-400 text-lg font-black shadow-[0_12px_24px_rgba(59,130,246,0.35)] sm:h-14 sm:w-14 sm:text-xl">
                CU
              </div>
              <div className="min-w-0">
                <p className="text-[9px] font-semibold uppercase tracking-[0.24em] text-slate-300 sm:text-[10px]">
                  Koperasi Simpan Pinjam
                </p>
                <h1 className="text-sm font-black tracking-tight sm:text-xl">
                  CU BINA MASYARAKAT
                </h1>
                <p className="text-[9px] uppercase tracking-[0.2em] text-slate-400 sm:text-[11px]">
                  Tagihan Iuran BPJS
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 lg:justify-end">
              <button
                type="button"
                onClick={() => setIsDarkMode((prev) => !prev)}
                className="rounded-xl border border-white/15 bg-white/5 px-2.5 py-2 text-xs font-semibold text-slate-100 transition hover:bg-white/10"
                title={isDarkMode ? "Aktifkan mode terang" : "Aktifkan mode gelap"}
              >
                {isDarkMode ? "☀️ Light" : "🌙 Dark"}
              </button>
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
              <div className="rounded-xl border border-white/10 bg-white/5 px-2.5 py-2 text-xs font-medium text-slate-100 backdrop-blur-sm sm:px-3 sm:text-sm">
                Periode: <span className="font-bold text-white">{bulanIni()}</span>
              </div>
              <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-2.5 py-2 text-xs font-medium text-slate-100 backdrop-blur-sm sm:px-3 sm:text-sm">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 text-xs font-black text-white">
                  {username.charAt(0).toUpperCase()}
                </span>
                <div className="min-w-0 leading-tight">
                  <p className="truncate font-semibold capitalize text-white">{username}</p>
                  <p className="text-[10px] text-slate-300 sm:text-[11px]">{role}</p>
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
      <nav className={cn(
        "no-print sticky top-0 z-20 border-b backdrop-blur-xl",
        isDarkMode ? "border-slate-800 bg-slate-900/80" : "border-slate-200 bg-white/85 shadow-[0_8px_24px_rgba(15,23,42,0.03)]"
      )}>
        <div className="mx-auto w-full max-w-7xl px-3 sm:px-6">
          <div className="flex gap-1 overflow-x-auto py-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {visibleMenu.map((m) => (
              <button
                key={m.id}
                onClick={() => setTab(m.id)}
                className={cn(
                  "flex shrink-0 items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition-all duration-200 sm:px-4 sm:py-2.5 sm:text-sm",
                  tab === m.id
                    ? isDarkMode
                      ? "border-blue-500/60 bg-blue-500/15 text-blue-200 shadow-sm"
                      : "border-blue-200 bg-blue-50 text-blue-700 shadow-sm"
                    : isDarkMode
                      ? "border-transparent text-slate-300 hover:border-slate-700 hover:bg-slate-800 hover:text-white"
                      : "border-transparent text-slate-500 hover:border-slate-200 hover:bg-slate-50 hover:text-slate-700"
                )}
              >
                <span>{m.icon}</span>
                <span className="whitespace-nowrap">{m.label}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      {tab === "rekap" && (
        <div className="mx-auto w-full max-w-7xl px-3 py-6 sm:px-6">
          <div className={cn(
            "mb-6 overflow-hidden rounded-3xl border p-4 shadow-[0_24px_60px_rgba(15,23,42,0.08)] sm:p-6",
            isDarkMode ? "border-slate-800 bg-slate-900/90" : "border-slate-200 bg-white/80"
          )}>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.25em] text-blue-500">
                  Dashboard BPJS
                </p>
                <h2 className={cn("text-xl font-black tracking-tight sm:text-2xl", isDarkMode ? "text-white" : "text-slate-900")}>
                  Ringkasan tagihan aktif bulan ini
                </h2>
              </div>
              <div className={cn("inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold shadow-sm", isDarkMode ? "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30" : "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100")}>
                ● Live sync
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {kpiCards.map((card) => (
              <div
                key={card.label}
                className={cn(
                  "rounded-2xl border p-4 shadow-[0_8px_24px_rgba(15,23,42,0.04)] transition-transform duration-200 hover:-translate-y-0.5",
                  isDarkMode ? "border-slate-800 bg-slate-900/80" : "border-slate-200 bg-white"
                )}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className={cn("text-[10px] font-semibold uppercase tracking-[0.22em]", isDarkMode ? "text-slate-400" : "text-slate-400")}>
                    {card.label}
                  </span>
                  <span className={cn("rounded-full px-2 py-1 text-[9px] font-bold uppercase tracking-[0.18em]", card.tone)}>
                    Live
                  </span>
                </div>
                <div className={cn("mt-4 h-1.5 rounded-full bg-gradient-to-r", card.accent)} />
                <p className={cn("mt-4 text-2xl font-black tracking-tight", isDarkMode ? "text-white" : "text-slate-900")}>
                  {card.value}
                </p>
                <p className={cn("mt-1 text-xs", isDarkMode ? "text-slate-400" : "text-slate-500")}>{card.detail}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Konten */}
      <main className="mx-auto w-full max-w-7xl px-3 pb-8 sm:px-6">
        {isKeuangan && tab === "print" && <MenuPrint />}
        {isKeuangan && tab === "rekap" && <MenuRekap />}
        {isKeuangan && tab === "kesehatan" && <MenuKesehatan1 />}
        {!isKeuangan && tab === "rekap" && <MenuRekap />}
        {!isKeuangan && tab === "kesehatan" && <MenuKesehatan1 />}
        {!isKeuangan && tab === "cabang" && <MenuCabang readOnly={false} />}
        {isKeuangan && tab === "cabang" && <MenuCabang readOnly={true} />}
        {!isKeuangan && tab === "database" && <MenuDatabase />}
        {!isKeuangan && tab === "print" && <MenuPrint />}
        {!isKeuangan && tab === "backup" && isAdmin && (
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
        )}
        {!isKeuangan && tab === "settings" && isAdmin && (
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="mb-4 text-lg font-bold text-slate-900">Pengaturan Pengguna</h3>

            <div className="mb-4">
              <h4 className="mb-2 text-sm font-bold uppercase tracking-[0.18em] text-slate-500">
                Tambah pengguna baru
              </h4>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Username
                </label>
                <input
                  value={newUser.username}
                  onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                  placeholder="contoh: userbaru"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showNewUserPassword ? "text" : "password"}
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    placeholder="Masukkan password"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 pr-10 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewUserPassword((prev) => !prev)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                    aria-label={showNewUserPassword ? "Sembunyikan password" : "Tampilkan password"}
                  >
                    {showNewUserPassword ? "🙈" : "👁️"}
                  </button>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Role
                </label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value as "Administrator" | "Bagian Keuangan" })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="Administrator">Administrator</option>
                  <option value="Bagian Keuangan">Bagian Keuangan</option>
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={handleUserSave}
                  className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  + Simpan User Baru
                </button>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <h4 className={cn("text-sm font-bold uppercase tracking-[0.18em]", isDarkMode ? "text-slate-400" : "text-slate-500")}>
                  Daftar user
                </h4>

                <div className="flex flex-wrap items-center gap-2">
                  <input
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="Cari username..."
                    className={cn(
                      "w-full max-w-[180px] rounded-full border px-3 py-1.5 text-xs font-medium placeholder:text-slate-400 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100 sm:w-40",
                      isDarkMode
                        ? "border-slate-700 bg-slate-800 text-slate-100"
                        : "border-slate-200 bg-slate-50 text-slate-700"
                    )}
                  />

                  <select
                    value={selectedRoleFilter}
                    onChange={(e) => setSelectedRoleFilter(e.target.value as "all" | "Administrator" | "Bagian Keuangan")}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-xs font-semibold focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100",
                      isDarkMode
                        ? "border-slate-700 bg-slate-800 text-slate-100"
                        : "border-slate-200 bg-slate-50 text-slate-700"
                    )}
                  >
                    <option value="all">Semua role</option>
                    <option value="Administrator">Administrator</option>
                    <option value="Bagian Keuangan">Bagian Keuangan</option>
                  </select>

                  {adminUsers.length > 3 && (
                    <button
                      onClick={() => setShowAllUsers((prev) => !prev)}
                      className="rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm shadow-blue-200 transition hover:from-blue-700 hover:to-indigo-700"
                    >
                      {showAllUsers ? "Sembunyikan" : "Lihat semua user"}
                    </button>
                  )}
                </div>
              </div>

              <div className={cn("overflow-x-auto rounded-2xl border shadow-sm", isDarkMode ? "border-slate-800 bg-slate-900" : "border-slate-200 bg-white")}>
                <table className={cn("min-w-[680px] divide-y text-left text-xs md:text-sm", isDarkMode ? "divide-slate-800" : "divide-slate-200")}>
                  <thead className={cn(isDarkMode ? "bg-slate-800/80" : "bg-slate-50")}>
                    <tr>
                      <th className={cn("px-3 py-2.5 font-semibold", isDarkMode ? "text-slate-200" : "text-slate-700")}>Username</th>
                      <th className={cn("px-3 py-2.5 font-semibold", isDarkMode ? "text-slate-200" : "text-slate-700")}>Password</th>
                      <th className={cn("px-3 py-2.5 font-semibold", isDarkMode ? "text-slate-200" : "text-slate-700")}>Role</th>
                      <th className={cn("px-3 py-2.5 font-semibold", isDarkMode ? "text-slate-200" : "text-slate-700")}>Status</th>
                      <th className={cn("px-3 py-2.5 text-right font-semibold", isDarkMode ? "text-slate-200" : "text-slate-700")}>Aksi</th>
                    </tr>
                  </thead>
                  <tbody className={cn("divide-y", isDarkMode ? "divide-slate-800 bg-slate-900" : "divide-slate-200 bg-white")}>
                    {visibleUsers.map((user) => {
                      const isOffline = !!offlineUsers[user.username];

                      return (
                        <tr key={user.username} className="align-middle">
                          <td className={cn("px-3 py-2.5 font-semibold", isDarkMode ? "text-slate-100" : "text-slate-800")}>{user.username}</td>
                          <td className="px-3 py-2.5">
                            <span className={cn("rounded-md px-2.5 py-1.5 font-mono text-[11px] tracking-[0.18em]", isDarkMode ? "bg-slate-800 text-slate-200" : "bg-slate-100 text-slate-600")}>
                              {"•".repeat(Math.max(6, user.password.length))}
                            </span>
                          </td>
                          <td className="px-3 py-2.5">
                            <span
                              className={cn(
                                "inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold",
                                user.role === "Administrator"
                                  ? isDarkMode ? "bg-blue-500/15 text-blue-200" : "bg-blue-100 text-blue-700"
                                  : isDarkMode ? "bg-amber-500/15 text-amber-200" : "bg-amber-100 text-amber-700"
                              )}
                            >
                              {user.role}
                            </span>
                          </td>
                          <td className="px-3 py-2.5">
                            <button
                              onClick={() => toggleOfflineStatus(user.username)}
                              className={cn(
                                "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold transition",
                                isOffline
                                  ? isDarkMode ? "bg-slate-700 text-slate-200" : "bg-slate-200 text-slate-700"
                                  : isDarkMode ? "bg-emerald-500/15 text-emerald-200" : "bg-emerald-100 text-emerald-700"
                              )}
                              title={isOffline ? "Klik untuk set online" : "Klik untuk set offline"}
                            >
                              <span className={cn("h-2 w-2 rounded-full", isOffline ? "bg-slate-400" : "bg-emerald-400")} />
                              {isOffline ? "Offline" : "Online"}
                            </button>
                          </td>
                          <td className="px-3 py-3">
                            <div className="flex flex-wrap justify-end gap-2">
                              <button
                                onClick={handleUserEdit}
                                className={cn(
                                  "rounded-lg border px-3 py-2 text-xs font-semibold",
                                  isDarkMode
                                    ? "border-blue-500/30 bg-blue-500/10 text-blue-200 hover:bg-blue-500/20"
                                    : "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
                                )}
                              >
                                Simpan
                              </button>
                              {resetDrafts[user.username] !== undefined ? (
                                <div className="flex items-center gap-2">
                                  <div className="relative">
                                    <input
                                      type={showResetPasswords[user.username] ? "text" : "password"}
                                      value={resetDrafts[user.username]}
                                      onChange={(e) =>
                                        setResetDrafts((prev) => ({
                                          ...prev,
                                          [user.username]: e.target.value,
                                        }))
                                      }
                                      placeholder="Password baru"
                                      className={cn(
                                        "w-32 rounded-lg border px-2.5 py-2 pr-8 text-xs focus:border-violet-400 focus:outline-none focus:ring-1 focus:ring-violet-200",
                                        isDarkMode
                                          ? "border-violet-500/30 bg-slate-800 text-slate-100"
                                          : "border-violet-200 bg-violet-50 text-slate-700"
                                      )}
                                    />
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setShowResetPasswords((prev) => ({
                                          ...prev,
                                          [user.username]: !prev[user.username],
                                        }))
                                      }
                                      className={cn(
                                        "absolute right-1.5 top-1/2 -translate-y-1/2 rounded-md p-1",
                                        isDarkMode ? "text-violet-200 hover:bg-slate-700" : "text-violet-500 hover:bg-violet-100"
                                      )}
                                      aria-label={showResetPasswords[user.username] ? "Sembunyikan password" : "Tampilkan password"}
                                    >
                                      {showResetPasswords[user.username] ? "🙈" : "👁️"}
                                    </button>
                                  </div>
                                  <button
                                    onClick={() => resetPassword(user.username, resetDrafts[user.username])}
                                    className={cn(
                                      "rounded-lg border px-3 py-2 text-xs font-semibold",
                                      isDarkMode
                                        ? "border-violet-500/30 bg-violet-500/10 text-violet-200 hover:bg-violet-500/20"
                                        : "border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100"
                                    )}
                                  >
                                    OK
                                  </button>
                                  <button
                                    onClick={() =>
                                      setResetDrafts((prev) => {
                                        const next = { ...prev };
                                        delete next[user.username];
                                        return next;
                                      })
                                    }
                                    className={cn(
                                      "rounded-lg border px-2.5 py-2 text-xs font-semibold",
                                      isDarkMode
                                        ? "border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700"
                                        : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                                    )}
                                  >
                                    Batal
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() =>
                                    setResetDrafts((prev) => ({
                                      ...prev,
                                      [user.username]: "",
                                    }))
                                  }
                                  className={cn(
                                    "rounded-lg border px-3 py-2 text-xs font-semibold",
                                    isDarkMode
                                      ? "border-violet-500/30 bg-violet-500/10 text-violet-200 hover:bg-violet-500/20"
                                      : "border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100"
                                  )}
                                >
                                  Reset
                                </button>
                              )}
                              {user.username.toLowerCase() !== "admin" && (
                                <button
                                  onClick={() => deleteUser(user.username)}
                                  className={cn(
                                    "rounded-lg border px-3 py-2 text-xs font-semibold",
                                    isDarkMode
                                      ? "border-red-500/30 bg-red-500/10 text-red-200 hover:bg-red-500/20"
                                      : "border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                                  )}
                                >
                                  Hapus
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
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
      <AppShell
        username={username}
        role={role}
        onLogout={handleLogout}
        onSetSession={handleLogin}
      />
    </DataProvider>
  );
}
