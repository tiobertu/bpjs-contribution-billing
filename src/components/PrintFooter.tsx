export function PrintFooter({ blok }: { blok?: string }) {
  return (
    <div className="print-only mt-8 hidden flex-col justify-end gap-8 sm:flex-row sm:justify-between">
      <div className="signature">
        <p>Dibuat oleh,</p>
        <div className="space h-16" />
        <p className="border-t border-slate-400 pt-1 font-medium underline">
          ____________________
        </p>
        <p className="text-xs text-slate-500">Administrasi KSP CU Bima</p>
      </div>
      <div className="signature">
        <p>Mengetahui,</p>
        <div className="space h-16" />
        <p className="border-t border-slate-400 pt-1 font-medium underline">
          ____________________
        </p>
        <p className="text-xs text-slate-500">Pimpinan {blok ?? "KSP CU Bima"}</p>
      </div>
    </div>
  );
}
