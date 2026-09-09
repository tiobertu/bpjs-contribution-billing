import { useEffect, useState } from "react";
import { cn } from "../utils/cn";
import { formatInputNumber, parseInputNumber } from "../utils/format";

interface RupiahInputProps {
  value: number;
  onChange: (value: number) => void;
  className?: string;
  placeholder?: string;
}

// Input rupiah dengan pemisah ribuan, tanpa desimal
export function RupiahInput({
  value,
  onChange,
  className,
  placeholder,
}: RupiahInputProps) {
  const [text, setText] = useState(formatInputNumber(value));

  useEffect(() => {
    setText(formatInputNumber(value));
  }, [value]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value;
    // Hanya izinkan digit dan tanda minus saat mengetik
    const clean = raw.replace(/[^\d-]/g, "");
    setText(clean);
    const num = parseInputNumber(clean);
    onChange(num);
  }

  function handleBlur() {
    setText(formatInputNumber(value));
  }

  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-xs text-slate-400">
        Rp
      </span>
      <input
        type="text"
        inputMode="numeric"
        value={text}
        onChange={handleChange}
        onBlur={handleBlur}
        onFocus={(e) => e.target.select()}
        placeholder={placeholder}
        className={cn(
          "w-36 rounded-md border border-slate-200 py-1 pl-7 pr-2 text-right tabular-nums focus:border-blue-400 focus:outline-none",
          className
        )}
      />
    </div>
  );
}
