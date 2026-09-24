import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Plus, Sparkles, Trash2, Receipt } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Mascot, ANIMAL_KEYS } from "@/components/Mascot";
import { billsStore, newId, useBills } from "@/lib/store";
import { billTotal, formatUsd, isSettled } from "@/lib/split";
import type { SplitMode } from "@/lib/types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ChibiSplit — Patungan Lucu Bayar Pakai NIM" },
      {
        name: "description",
        content:
          "Bagi tagihan bareng teman dengan maskot hewan chibi, roda keberuntungan, dan pembayaran NIM lewat dompet Nimiq.",
      },
      { property: "og:title", content: "ChibiSplit — Patungan Lucu Bayar Pakai NIM" },
      {
        property: "og:description",
        content: "Split bill rata atau per item, putar roda keberuntungan, bayar dengan NIM.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  const bills = useBills();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [mode, setMode] = useState<SplitMode>("even");

  function createBill() {
    const id = newId();
    billsStore.save({
      id,
      title: title.trim() || "Patungan Baru",
      createdAt: new Date().toISOString(),
      mode,
      totalUsd: 0,
      participants: [],
      items: [],
    });
    setTitle("");
    navigate({ to: "/bill/$billId", params: { billId: id } });
  }

  return (
    <AppShell>
      <section className="chibi-card mb-5 overflow-hidden p-5">
        <div className="flex items-start gap-3">
          <Mascot animal="shiba" mood="wave" className="h-20 w-20" />
          <div>
            <h1 className="text-2xl">Patungan tanpa drama!</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Bagi tagihan bareng geng hewan chibi, lalu bayar bagianmu pakai NIM. Kunci dompet
              tetap di dompetmu — kami cuma simpan alamat publik.
            </p>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Nama patungan, mis. Ramen Jumat"
            className="w-full rounded-2xl border-[3px] border-border bg-background px-4 py-2.5 font-semibold outline-none focus:ring-4 focus:ring-ring/40"
          />
          <div className="flex gap-2">
            {(
              [
                { value: "even", label: "Bagi rata" },
                { value: "items", label: "Per item" },
              ] as const
            ).map((option) => (
              <button
                key={option.value}
                onClick={() => setMode(option.value)}
                className={`flex-1 rounded-2xl border-[3px] border-border px-3 py-2 text-sm font-bold transition-transform hover:-translate-y-0.5 ${
                  mode === option.value ? "bg-primary text-primary-foreground" : "bg-muted"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
          <button
            onClick={createBill}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border-[3px] border-border bg-secondary px-4 py-3 font-display text-lg font-extrabold text-secondary-foreground shadow-[var(--shadow-pop)] transition-transform hover:-translate-y-0.5 active:translate-y-1"
          >
            <Plus className="h-5 w-5" /> Buat patungan
          </button>
        </div>
      </section>

      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg">Tagihan kamu</h2>
        <Link to="/wheel" className="chibi-chip flex items-center gap-1 bg-lucky text-lucky-foreground">
          <Sparkles className="h-3.5 w-3.5" /> Roda keberuntungan
        </Link>
      </div>

      {bills.length === 0 ? (
        <div className="chibi-card flex flex-col items-center gap-2 p-8 text-center">
          <Mascot animal="penguin" mood="happy" className="h-20 w-20" />
          <p className="font-bold">Belum ada tagihan</p>
          <p className="text-sm text-muted-foreground">
            Bikin patungan pertamamu di atas, lalu undang teman-teman chibi-mu.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {bills.map((bill) => {
            const settled = isSettled(bill);
            return (
              <li key={bill.id} className="chibi-card flex items-center gap-3 p-4">
                <Link
                  to="/bill/$billId"
                  params={{ billId: bill.id }}
                  className="flex min-w-0 flex-1 items-center gap-3"
                >
                  <div className="flex -space-x-3">
                    {bill.participants.slice(0, 3).map((p) => (
                      <Mascot
                        key={p.id}
                        animal={p.animal}
                        mood={p.paidAt ? "sparkle" : "happy"}
                        className="h-11 w-11"
                      />
                    ))}
                    {bill.participants.length === 0 && (
                      <Mascot animal={ANIMAL_KEYS[0]} className="h-11 w-11 opacity-50" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-display text-base font-extrabold">{bill.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {bill.participants.length} orang · {bill.mode === "even" ? "bagi rata" : "per item"} ·{" "}
                      {formatUsd(billTotal(bill))}
                    </p>
                  </div>
                </Link>
                <span
                  className={`chibi-chip ${settled ? "bg-success text-success-foreground" : "bg-muted text-muted-foreground"}`}
                >
                  {settled ? "Lunas" : "Jalan"}
                </span>
                <button
                  aria-label="Hapus tagihan"
                  onClick={() => billsStore.remove(bill.id)}
                  className="rounded-full p-2 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <p className="mt-6 flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
        <Receipt className="h-3.5 w-3.5" /> Data tersimpan di perangkat ini saja untuk sekarang.
      </p>
    </AppShell>
  );
}
