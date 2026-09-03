import { cn } from "@/lib/utils";

const PALETTE = [
  { bg: "bg-[#efecfd] dark:bg-[#241f42]", text: "text-[#6c5ce7] dark:text-[#a99cf7]" },
  { bg: "bg-[#e3f7ef] dark:bg-[#0f2e22]", text: "text-[#0ea472] dark:text-[#34d399]" },
  { bg: "bg-[#fdf1dd] dark:bg-[#3a2a0e]", text: "text-[#b4680a] dark:text-[#f5a524]" },
  { bg: "bg-[#e2f2fb] dark:bg-[#0f2c3a]", text: "text-[#0284c7] dark:text-[#38bdf8]" },
  { bg: "bg-[#fbe6e6] dark:bg-[#3a1618]", text: "text-[#c22a2f] dark:text-[#f16468]" },
  { bg: "bg-[#f0e6fb] dark:bg-[#2a1d3a]", text: "text-[#9333ea] dark:text-[#c4a3f0]" },
];

function hashString(value: string) {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function initialsFor(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function ClientAvatar({ name, className }: { name: string; className?: string }) {
  const palette = PALETTE[hashString(name) % PALETTE.length];
  return (
    <span
      className={cn(
        "flex size-9 shrink-0 items-center justify-center rounded-full text-[13px] font-semibold",
        palette.bg,
        palette.text,
        className
      )}
      aria-hidden
    >
      {initialsFor(name)}
    </span>
  );
}
