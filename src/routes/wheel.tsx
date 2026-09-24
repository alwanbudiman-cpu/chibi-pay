import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";
import { z } from "zod";
import { AppShell } from "@/components/AppShell";
import { Mascot } from "@/components/Mascot";
import { billsStore, useBills } from "@/lib/store";
import type { LuckyMode } from "@/lib/types";

const searchSchema = z.object({ bill: z.string().optional() });

export const Route = createFileRoute("/wheel")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Roda Keberuntungan — ChibiSplit" },
      {
        name: "description",
        content:
          "Putar roda chibi untuk menentukan siapa yang traktir semua atau siapa yang bebas bayar di patungan ini.",
      },
      { property: "og:title", content: "Roda Keberuntungan — ChibiSplit" },
      {
        property: "og:description",
        content: "Satu putaran menentukan siapa yang traktir atau siapa yang gratis.",
      },
    ],
  }),
  component: WheelPage,
});

const SEGMENT_COLORS = ["--chart-1", "--chart-2", "--chart-3", "--chart-4", "--chart-5"];

function WheelPage() {
  const { bill: billFromSearch } = Route.useSearch();
  const bills = useBills();
  const [selectedId, setSelectedId] = useState<string | undefined>(billFromSearch);
  const [mode, setMode] = useState<LuckyMode>("treat");
  const [angle, setAngle] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [winnerId, setWinnerId] = useState<string | null>(null);

  const bill = bills.find((b) => b.id === (selectedId ?? billFromSearch)) ?? bills[0];
  const people = bill?.participants ?? [];

  function spin() {
    if (!bill || people.length < 2 || spinning) return;
    setSpinning(true);
    setWinnerId(null);
    const index = Math.floor(Math.random() * people.length);
    const slice = 360 / people.length;
    const target = 360 * 6 + (360 - (index * slice + slice / 2));
    setAngle((prev) => prev + target);
    window.setTimeout(() => {
      setSpinning(false);
      const winner = people[index];
      if (!winner) return;
      setWinnerId(winner.id);
      billsStore.save({ ...bill, luckyWinnerId: winner.id, luckyMode: mode });
      toast.success(
        mode === "treat" ? `${winner.name} traktir semua! 🎉` : `${winner.name} bebas bayar! 🍀`,
      );
    }, 3200);
  }

  const slice = people.length > 0 ? 360 / people.length : 360;
  const gradient =
    people.length > 0
      ? `conic-gradient(${people
          .map((_, i) => {
            const color = `var(${SEGMENT_COLORS[i % SEGMENT_COLORS.length]})`;
            return `${color} ${i * slice}deg ${(i + 1) * slice}deg`;
          })
          .join(", ")})`
      : "var(--muted)";

  return (
    <AppShell>
      <h1 className="mb-1 text-2xl">Roda Keberuntungan</h1>
      <p className="mb-4 text-sm text-muted-foreground">
        Putar sekali, nasib menentukan. Hasilnya langsung dipakai di perhitungan tagihan.
      </p>

      {bills.length === 0 ? (
        <div className="chibi-card flex flex-col items-center gap-2 p-8 text-center">
          <Mascot animal="bunny" mood="dizzy" className="h-20 w-20" />
          <p className="font-bold">Belum ada tagihan untuk diputar</p>
          <Link to="/" className="chibi-chip bg-primary text-primary-foreground">
            Buat patungan dulu
          </Link>
        </div>
      ) : (
        <>
          <section className="chibi-card mb-4 p-4">
            <label className="block text-sm font-bold">
              Pilih tagihan
              <select
                value={bill?.id ?? ""}
                onChange={(e) => {
                  setSelectedId(e.target.value);
                  setWinnerId(null);
                }}
                className="mt-1 w-full rounded-2xl border-[3px] border-border bg-background px-4 py-2 font-semibold outline-none"
              >
                {bills.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.title}
                  </option>
                ))}
              </select>
            </label>

            <div className="mt-3 flex gap-2">
              {(
                [
                  { value: "treat", label: "Yang kena traktir semua" },
                  { value: "free", label: "Yang kena gratis" },
                ] as const
              ).map((option) => (
                <button
                  key={option.value}
                  onClick={() => setMode(option.value)}
                  className={`flex-1 rounded-2xl border-[3px] border-border px-3 py-2 text-xs font-bold ${
                    mode === option.value ? "bg-accent text-accent-foreground" : "bg-muted"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </section>

          <section className="chibi-card flex flex-col items-center p-5">
            <div className="relative">
              <div
                className="absolute -top-2 left-1/2 z-10 h-0 w-0 -translate-x-1/2 border-x-[12px] border-t-[20px] border-x-transparent"
                style={{ borderTopColor: "var(--border)" }}
              />
              <div
                className="h-64 w-64 rounded-full border-[6px] border-border shadow-[var(--shadow-soft)]"
                style={{
                  background: gradient,
                  transform: `rotate(${angle}deg)`,
                  transition: spinning ? "transform 3.1s cubic-bezier(0.17, 0.67, 0.12, 0.99)" : "none",
                }}
              >
                {people.map((p, i) => (
                  <div
                    key={p.id}
                    className="absolute top-1/2 left-1/2 origin-left"
                    style={{ transform: `rotate(${i * slice + slice / 2}deg) translateX(58px)` }}
                  >
                    <Mascot animal={p.animal} className="h-10 w-10 -translate-y-1/2" />
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={spin}
              disabled={people.length < 2 || spinning}
              className="mt-5 flex items-center gap-2 rounded-2xl border-[3px] border-border bg-lucky px-6 py-3 font-display text-lg font-extrabold text-lucky-foreground shadow-[var(--shadow-pop)] transition-transform hover:-translate-y-0.5 active:translate-y-1 disabled:opacity-60"
            >
              <Sparkles className="h-5 w-5" />
              {spinning ? "Berputar…" : "Putar!"}
            </button>
            {people.length < 2 && (
              <p className="mt-2 text-xs text-muted-foreground">Butuh minimal 2 peserta.</p>
            )}

            {winnerId && bill && (
              <div className="mt-4 flex flex-col items-center gap-1">
                <Mascot
                  animal={people.find((p) => p.id === winnerId)?.animal ?? "cat"}
                  mood="lucky"
                  className="h-20 w-20"
                />
                <p className="font-display text-xl font-extrabold">
                  {people.find((p) => p.id === winnerId)?.name}
                </p>
                <p className="text-sm text-muted-foreground">
                  {mode === "treat" ? "Traktir semua orang 🎉" : "Bebas bayar kali ini 🍀"}
                </p>
                <Link
                  to="/bill/$billId"
                  params={{ billId: bill.id }}
                  className="chibi-chip mt-2 bg-primary text-primary-foreground"
                >
                  Lihat tagihan
                </Link>
              </div>
            )}
          </section>
        </>
      )}
    </AppShell>
  );
}
