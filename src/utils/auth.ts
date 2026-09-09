export type AppRole = "Administrator" | "Bagian Keuangan";

export interface AppUser {
  username: string;
  password: string;
  role: AppRole;
}

export const AUTH_STORAGE_KEY = "bpjs_auth_users_v1";

export const defaultUsers: AppUser[] = [
  { username: "admin", password: "bima123", role: "Administrator" },
  { username: "keuangan", password: "bima456", role: "Bagian Keuangan" },
];

export function getUsers(): AppUser[] {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return [...defaultUsers];
    const parsed = JSON.parse(raw) as AppUser[];
    if (!Array.isArray(parsed) || parsed.length === 0) return [...defaultUsers];
    const merged = [...defaultUsers];
    const map = new Map(merged.map((u) => [u.username.toLowerCase(), u]));
    parsed.forEach((u) => {
      if (!u?.username || !u?.password || !u?.role) return;
      const key = u.username.trim().toLowerCase();
      if (!key) return;
      map.set(key, {
        username: u.username.trim(),
        password: String(u.password),
        role: u.role === "Bagian Keuangan" ? "Bagian Keuangan" : "Administrator",
      });
    });
    return Array.from(map.values());
  } catch {
    return [...defaultUsers];
  }
}

export function saveUsers(users: AppUser[]) {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(users));
}

export function isAdminRole(role: string) {
  return role === "Administrator";
}

export function isKeuanganRole(role: string) {
  return role === "Bagian Keuangan";
}
