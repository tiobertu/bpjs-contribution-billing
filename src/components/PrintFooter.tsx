export function PrintFooter({
  blok,
  dibuatOleh = "Administrasi KSP CU Bima",
  diketahuiOleh,
}: {
  blok?: string;
  dibuatOleh?: string;
  diketahuiOleh?: string;
}) {
  const namaDiketahui = diketahuiOleh ?? `Pimpinan ${blok ?? "KSP CU Bima"}`;

  return (
    <div className="print-only mt-8 hidden flex-col justify-end gap-8 sm:flex-row sm:justify-between">
      <div className="signature">
        <p>Dibuat oleh,</p>
        <div className="space h-16" />
        <p className="border-t border-slate-400 pt-1 font-medium underline">
          ____________________
        </p>
        <p className="text-xs text-slate-500">{dibuatOleh}</p>
      </div>
      <div className="signature">
        <p>Diketahui oleh,</p>
        <div className="space h-16" />
        <p className="border-t border-slate-400 pt-1 font-medium underline">
          ____________________
        </p>
        <p className="text-xs text-slate-500">{namaDiketahui}</p>
      </div>
    </div>
  );
}
