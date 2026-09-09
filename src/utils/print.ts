const PRINT_CSS = `
  * { box-sizing: border-box; }
  body {
    font-family: 'Inter','Segoe UI',Arial,sans-serif;
    padding: 24px; color: #1f2937; margin: 0;
  }
  .kop {
    text-align: center; border-bottom: 3px double #1d4ed8;
    padding-bottom: 10px; margin-bottom: 18px;
  }
  .kop .lembaga { font-size: 15px; font-weight: 700; letter-spacing: .04em; text-transform: uppercase; }
  .kop .alamat { font-size: 10px; color: #6b7280; margin-top: 2px; }
  .judul { text-align:center; font-size: 15px; font-weight: 700; margin: 0 0 2px; text-transform: uppercase; }
  .subjudul { text-align:center; font-size: 11px; color:#6b7280; margin: 0 0 14px; }
  .seksi { page-break-inside: auto; margin-bottom: 26px; }
  .seksi + .seksi { page-break-before: always; }
  .grup { font-size: 12px; font-weight: 700; color:#1d4ed8; margin: 14px 0 5px; }
  table { width:100%; border-collapse: collapse; font-size: 10.5px; margin-bottom: 10px; }
  th, td { border: 1px solid #cbd5e1; padding: 5px 7px; }
  thead { display: table-header-group; }
  tr { page-break-inside: avoid; }
  th {
    background:#1d4ed8 !important; color:#fff !important; font-weight:600; text-align:center;
    -webkit-print-color-adjust: exact; print-color-adjust: exact;
  }
  td.num { text-align:right; font-variant-numeric: tabular-nums; white-space: nowrap; }
  td.ctr { text-align:center; }
  tr.total td, tr.sub td {
    background:#eff6ff !important; font-weight:700;
    -webkit-print-color-adjust: exact; print-color-adjust: exact;
  }
  tr.total td { background:#dbeafe !important; }
  .ttd { margin-top: 26px; display:flex; justify-content: space-between; font-size: 11px; }
  .ttd .kolom { text-align:center; width: 220px; }
  .ttd .ruang { height: 58px; }
  .ttd .garis { border-top: 1px solid #475569; padding-top: 3px; font-weight:600; }
  .ttd .jabatan { font-size: 10px; color:#6b7280; }
  @page { size: A4; margin: 12mm; }
`;

/** Cetak HTML mentah (dipakai menu Print Out) */
export function printRawHtml(bodyHtml: string, title = "TAGIHAN IURAN BPJS KSP CU BIMA") {
  const w = window.open("", "_blank", "width=1200,height=800");
  if (!w) {
    alert("Jendela cetak diblokir browser. Izinkan pop-up untuk situs ini.");
    return;
  }
  w.document.write(
    `<html><head><title>${title}</title><style>${PRINT_CSS}</style></head><body>${bodyHtml}</body></html>`
  );
  w.document.close();
  w.focus();
  setTimeout(() => {
    w.print();
    w.close();
  }, 400);
}

// Fungsi untuk mencetak area tertentu
export function printElement(id: string): void {
  const el = document.getElementById(id);
  if (!el) {
    window.print();
    return;
  }

  // Simpan konten asli body
  const originalContents = document.body.innerHTML;

  // Ambil judul dan area print
  const printContents = el.innerHTML;

  // Buat jendela print baru
  const printWindow = window.open("", "_blank", "width=1200,height=800");
  if (!printWindow) {
    window.print();
    return;
  }

  printWindow.document.write(`
    <html>
      <head>
        <title>TAGIHAN IURAN BPJS KSP CU BIMA</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
          * { box-sizing: border-box; }
          body {
            font-family: 'Inter', 'Segoe UI', sans-serif;
            padding: 32px;
            color: #1f2937;
          }
          .print-title {
            text-align: center;
            margin-bottom: 4px;
            font-size: 20px;
            font-weight: 700;
            letter-spacing: -0.01em;
          }
          .print-subtitle {
            text-align: center;
            margin-bottom: 20px;
            font-size: 12px;
            color: #6b7280;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 12px;
            margin-bottom: 16px;
          }
          th, td {
            border: 1px solid #d1d5db;
            padding: 8px 10px;
            text-align: left;
          }
          th {
            background: #1d4ed8 !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            color: #ffffff !important;
            font-weight: 600;
            text-align: center;
          }
          td.num {
            text-align: right;
            font-variant-numeric: tabular-nums;
          }
          .total-row td {
            background: #eff6ff !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            font-weight: 700;
          }
          .print-footer {
            margin-top: 24px;
            display: flex;
            justify-content: flex-end;
          }
          .signature {
            text-align: center;
            font-size: 12px;
          }
          .signature .space {
            height: 60px;
          }
          .no-print { display: none !important; }
          select, input {
            border: none !important;
            background: transparent !important;
            padding: 0 !important;
            font-size: 12px !important;
            font-family: inherit !important;
            color: inherit !important;
            appearance: none;
            -webkit-appearance: none;
            width: auto !important;
          }
          input[type="text"], input[type="number"] { text-align: inherit; }
          @media print {
            body { padding: 8px; }
          }
        </style>
      </head>
      <body>${printContents}</body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 300);

  document.body.innerHTML = originalContents;
}
