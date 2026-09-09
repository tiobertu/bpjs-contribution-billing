import { cn } from "../utils/cn";

export const thClass =
  "px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-200 whitespace-nowrap";
export const tdClass = "px-3 py-2.5 text-sm text-slate-700 whitespace-nowrap align-middle";
export const tdNumClass =
  "px-3 py-2.5 text-sm text-slate-700 text-right tabular-nums whitespace-nowrap align-middle";

export function Button({
  children,
  onClick,
  variant = "primary",
  type = "button",
  className,
  title,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "danger" | "success" | "ghost";
  type?: "button" | "submit";
  className?: string;
  title?: string;
}) {
  const variants: Record<string, string> = {
    primary:
      "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-[0_10px_25px_rgba(37,99,235,0.25)] hover:from-blue-700 hover:to-indigo-700",
    secondary:
      "border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50",
    danger:
      "bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-[0_10px_25px_rgba(239,68,68,0.25)] hover:from-red-600 hover:to-rose-700",
    success:
      "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-[0_10px_25px_rgba(16,185,129,0.25)] hover:from-emerald-600 hover:to-teal-700",
    ghost: "text-slate-600 hover:bg-slate-100",
  };
  return (
    <button
      type={type}
      title={title}
      onClick={onClick}
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1 active:scale-[0.98]",
        variants[variant],
        className
      )}
    >
      {children}
    </button>
  );
}

export function IconButton({
  children,
  onClick,
  variant = "ghost",
  title,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "danger" | "ghost" | "success";
  title?: string;
}) {
  const variants: Record<string, string> = {
    primary: "text-blue-600 hover:bg-blue-50",
    danger: "text-red-500 hover:bg-red-50",
    success: "text-emerald-600 hover:bg-emerald-50",
    ghost: "text-slate-500 hover:bg-slate-100",
  };
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={cn(
        "inline-flex h-7 w-7 items-center justify-center rounded-md transition-colors",
        variants[variant]
      )}
    >
      {children}
    </button>
  );
}

export function Table({
  head,
  children,
  className,
}: {
  head: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.06)]",
        className
      )}
    >
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead className="bg-slate-900">
            {head}
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">{children}</tbody>
        </table>
      </div>
    </div>
  );
}

export function TotalRow({
  colSpan,
  label,
  value,
  action,
}: {
  colSpan: number;
  label: string;
  value: string;
  action?: React.ReactNode;
}) {
  return (
    <tr className="bg-blue-50/70 font-semibold">
      <td colSpan={colSpan} className={cn(tdClass, "font-bold text-slate-900")}>
        {label}
      </td>
      {action}
      <td className={cn(tdNumClass, "font-bold text-blue-800")}>{value}</td>
    </tr>
  );
}
