import { cn } from "../utils/cn";

export const thClass =
  "px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-blue-50 whitespace-nowrap";
export const tdClass = "px-3 py-2 text-sm text-slate-700 whitespace-nowrap";
export const tdNumClass =
  "px-3 py-2 text-sm text-slate-700 text-right tabular-nums whitespace-nowrap";

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
      "bg-blue-600 text-white hover:bg-blue-700 shadow-sm shadow-blue-200",
    secondary:
      "bg-white text-slate-700 border border-slate-300 hover:bg-slate-50",
    danger: "bg-red-500 text-white hover:bg-red-600 shadow-sm shadow-red-200",
    success:
      "bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm shadow-emerald-200",
    ghost: "text-slate-600 hover:bg-slate-100",
  };
  return (
    <button
      type={type}
      title={title}
      onClick={onClick}
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1 active:scale-[0.98]",
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
        "overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm",
        className
      )}
    >
      <table className="w-full border-collapse text-left">
        <thead className="bg-gradient-to-r from-blue-700 to-blue-600">
          {head}
        </thead>
        <tbody className="divide-y divide-slate-100">{children}</tbody>
      </table>
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
