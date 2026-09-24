import { createFileRoute, Link } from "@tanstack/react-router";
import { Crown, Zap, Snail, HandCoins } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Mascot } from "@/components/Mascot";
import { useBills } from "@/lib/store";
import { computeShares, formatUsd } from "@/lib/split";
import type { AnimalKey, Bill } from "@/lib/types";

export const Route = createFileRoute("/leaderboard")({
  head: () => ({
    meta: [
      { title: "Papan Skor & Lencana — ChibiSplit" },
      {
        name: "description",
        content:
          "Lihat siapa pembayar tercepat, siapa Raja Traktir, dan streak lunas tiap maskot chibi di geng patunganmu.",
      },
      { property: "og:title", content: "Papan Skor & Lencana — ChibiSplit" },
      {
        property: "og:description",
        content: "Peringkat pembayar tercepat dan lencana lucu untuk geng patunganmu.",
      },
    ],
  }),
  component: LeaderboardPage,
});

interface Stat {
  key: string;
  name: string;
  animal: AnimalKey;
  bills: number;
  paid: number;
  totalPaidUsd: number;
  treats: number;
  avgMinutes: number | null;
}

function buildStats(bills: Bill[]): Stat[] {
  const map = new Map<string, Stat & { speedSum: number; speedCount: number }>();

  for (const bill of bills) {
    const shares = computeShares(bill);
    for (const p of bill.participants) {
      const key = p.name.trim().toLowerCase();
      if (!key) continue;
      const entry = map.get(key) ?? {
        key,
        name: p.name,
        animal: p.animal,
        bills: 0,
        paid: 0,
        totalPaidUsd: 0,
        treats: 0,
        avgMinutes: null,
        speedSum: 0,
        speedCount: 0,
      };
      entry.bills += 1;
      entry.animal = p.animal;
      const amount = shares.find((s) => s.participantId === p.id)?.amountUsd ?? 0;
      if (p.paidAt) {
        entry.paid += 1;
        entry.totalPaidUsd += amount;
        const minutes =
          (new Date(p.paidAt).getTime() - new Date(bill.createdAt).getTime()) / 60000;
        if (Number.isFinite(minutes) && minutes >= 0) {
          entry.speedSum += minutes;
          entry.speedCount += 1;
        }
      }
      if (bill.luckyWinnerId === p.id && bill.luckyMode === "treat") entry.treats += 1;
      map.set(key, entry);
    }
  }

  return [...map.values()]
    .map((e) => ({
      key: e.key,
      name: e.name,
      animal: e.animal,
      bills: e.bills,
      paid: e.paid,
      totalPaidUsd: e.totalPaidUsd,
      treats: e.treats,
      avgMinutes: e.speedCount > 0 ? e.speedSum / e.speedCount : null,
    }))
    .sort((a, b) => b.paid - a.paid || b.totalPaidUsd - a.totalPaidUsd);
}

function badgesFor(stat: Stat, all: Stat[]) {
  const badges: { label: string; icon: typeof Crown; tone: string }[] = [];
  const topTreat = Math.max(...all.map((s) => s.treats), 0);
  const fastest = all
    .filter((s) => s.avgMinutes !== null)
    .sort((a, b) => (a.avgMinutes ?? 0) - (b.avgMinutes ?? 0))[0];

  if (stat.treats > 0 && stat.treats === topTreat)
    badges.push({ label: "Raja Traktir", icon: Crown, tone: "bg-lucky text-lucky-foreground" });
  if (fastest && fastest.key === stat.key)
    badges.push({ label: "Kilat Bayar", icon: Zap, tone: "bg-secondary text-secondary-foreground" });
  if (stat.bills > 0 && stat.paid === stat.bills)
    badges.push({ label: "Selalu Lunas", icon: HandCoins, tone: "bg-success text-success-foreground" });
  if (stat.bills - stat.paid >= 2)
    badges.push({ label: "Si Lupa", icon: Snail, tone: "bg-accent text-accent-foreground" });
  return badges;
}

function LeaderboardPage() {
  const bills = useBills();
  const stats = buildStats(bills);

  return (
    <AppShell>
      <h1 className="mb-1 text-2xl">Papan Skor</h1>
      <p className="mb-4 text-sm text-muted-foreground">
        Semakin rajin bayar, semakin banyak lencana. Data dihitung dari semua tagihanmu.
      </p>

      {stats.length === 0 ? (
        <div className="chibi-card flex flex-col items-center gap-2 p-8 text-center">
          <Mascot animal="bear" mood="happy" className="h-20 w-20" />
          <p className="font-bold">Belum ada skor</p>
          <Link to="/" className="chibi-chip bg-primary text-primary-foreground">
            Mulai patungan
          </Link>
        </div>
      ) : (
        <ol className="space-y-3">
          {stats.map((stat, index) => (
            <li key={stat.key} className="chibi-card flex items-center gap-3 p-4">
              <span className="font-display text-xl font-extrabold text-muted-foreground">
                #{index + 1}
              </span>
              <Mascot
                animal={stat.animal}
                mood={stat.paid === stat.bills ? "sparkle" : "happy"}
                className="h-14 w-14"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate font-display text-base font-extrabold">{stat.name}</p>
                <p className="text-xs text-muted-foreground">
                  {stat.paid}/{stat.bills} lunas · {formatUsd(stat.totalPaidUsd)}
                  {stat.avgMinutes !== null && ` · rata-rata ${Math.round(stat.avgMinutes)} mnt`}
                </p>
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {badgesFor(stat, stats).map((badge) => (
                    <span key={badge.label} className={`chibi-chip inline-flex items-center gap-1 ${badge.tone}`}>
                      <badge.icon className="h-3 w-3" />
                      {badge.label}
                    </span>
                  ))}
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}
    </AppShell>
  );
}
