import { useEffect, useState } from "react";
import { defaultUsers, getUsers } from "../utils/auth";

export function Login({ onLogin }: { onLogin: (username: string, role: string) => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [show, setShow] = useState(false);
  const [users, setUsers] = useState(defaultUsers);

  useEffect(() => {
    setUsers(getUsers());
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const user = users.find(
      (u) => u.username === username.trim() && u.password === password
    );
    if (!user) {
      setError("Username atau password salah. Silakan coba lagi.");
      return;
    }
    setError("");
    onLogin(user.username, user.role);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(96,165,250,0.35),_transparent_35%),linear-gradient(135deg,_#0f172a_0%,_#172554_30%,_#1d4ed8_100%)] p-4 sm:p-6">
      <div className="w-full max-w-md">
        <div className="overflow-hidden rounded-[24px] border border-white/10 bg-white/95 p-4 shadow-[0_30px_80px_rgba(15,23,42,0.45)] backdrop-blur-sm sm:p-8 sm:rounded-[28px]">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-3xl shadow-lg shadow-blue-300/70 ring-4 ring-blue-100">
              🏦
            </div>
            <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-blue-600">
              Koperasi Simpan Pinjam Credit Union Bima
            </p>
            <h1 className="mt-3 text-2xl font-black tracking-tight text-slate-900 sm:text-[2rem]">
              TAGIHAN IURAN BPJS
            </h1>
            <p className="mt-1 text-sm text-slate-500">KSP CU BIMA</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                Username
              </label>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Masukkan username"
                required
                autoFocus
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 transition focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-100"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                Password
              </label>
              <div className="relative">
                <input
                  type={show ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password"
                  required
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pr-11 text-sm text-slate-800 transition focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-100"
                />
                <button
                  type="button"
                  onClick={() => setShow(!show)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                  title={show ? "Sembunyikan" : "Tampilkan"}
                  aria-label={show ? "Sembunyikan password" : "Tampilkan password"}
                >
                  {show ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
                ⚠️ {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-200 transition hover:from-blue-700 hover:to-indigo-700 active:scale-[0.99]"
            >
              Masuk
            </button>
          </form>

          
        </div>
      </div>
    </div>
  );
}
