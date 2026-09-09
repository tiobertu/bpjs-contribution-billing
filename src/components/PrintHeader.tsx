import { bulanIni } from "../utils/format";

export function PrintHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="print-only mb-4">
      <div className="border-b-2 border-blue-800 pb-3 text-center">
        <p className="text-sm font-bold uppercase tracking-wide text-slate-500">
          Koperasi Simpan Pinjam Credit Union Bima
        </p>
        <h1 className="text-xl font-bold text-blue-900">{title}</h1>
        <p className="text-xs text-slate-500">
          {subtitle ?? `Periode: ${bulanIni()}`}
        </p>
      </div>
    </div>
  );
}
