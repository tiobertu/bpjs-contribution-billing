import { useState } from "react";

const VALID_USERS = [
  { username: "admin", password: "bima123", role: "Administrator" },
  { username: "bendahara", password: "bima456", role: "Bendahara" },
];

export function Login({ onLogin }: { onLogin: (username: string, role: string) => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [show, setShow] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const user = VALID_USERS.find(
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
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 p-4">
      <div className="w-full max-w-md">
        <div className="rounded-2xl bg-white p-8 shadow-2xl">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-3xl shadow-lg shadow-blue-300">
              🏦
            </div>
            <p className="text-xs font-semibold uppercase tracking-widest text-blue-600">
              Koperasi Simpan Pinjam Credit Union Bima
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
              TAGIHAN IURAN BPJS
            </h1>
            <p className="text-sm text-slate-500">KSP CU BIMA</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Username
              </label>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Masukkan username"
                required
                autoFocus
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Password
              </label>
              <div className="relative">
                <input
                  type={show ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password"
                  required
                  className="w-full rounded-lg border border-slate-300 px-4 py-2.5 pr-11 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
                <button
                  type="button"
                  onClick={() => setShow(!show)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  title={show ? "Sembunyikan" : "Tampilkan"}
                >
                  {show ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 px-4 py-2.5 text-sm font-medium text-red-600">
                ⚠️ {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 py-3 text-sm font-bold text-white shadow-lg shadow-blue-200 transition hover:from-blue-700 hover:to-indigo-700 active:scale-[0.99]"
            >
              Masuk
            </button>
          </form>

          <div className="mt-6 rounded-lg bg-slate-50 p-3 text-xs text-slate-500">
            <p className="mb-1 font-semibold text-slate-600">Akun demo:</p>
            <p>Admin: <code className="font-mono text-blue-600">admin</code> / <code className="font-mono text-blue-600">bima123</code></p>
            <p>Bendahara: <code className="font-mono text-blue-600">bendahara</code> / <code className="font-mono text-blue-600">bima456</code></p>
          </div>
        </div>
      </div>
    </div>
  );
}
