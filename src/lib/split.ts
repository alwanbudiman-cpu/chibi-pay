import type { Bill, Share } from "./types";

export function billSubtotal(bill: Bill): number {
  if (bill.mode === "items") {
    return bill.items.reduce((sum, item) => sum + (item.amountUsd || 0), 0);
  }
  return bill.totalUsd || 0;
}

/** Raw shares before the lucky wheel is applied. */
function baseShares(bill: Bill): Share[] {
  const people = bill.participants;
  if (people.length === 0) return [];

  if (bill.mode === "even") {
    const each = (bill.totalUsd || 0) / people.length;
    return people.map((p) => ({ participantId: p.id, amountUsd: each }));
  }

  const totals = new Map<string, number>(people.map((p) => [p.id, 0]));
  for (const item of bill.items) {
    const eaters = item.sharedBy.filter((id) => totals.has(id));
    if (eaters.length === 0) continue;
    const each = (item.amountUsd || 0) / eaters.length;
    for (const id of eaters) totals.set(id, (totals.get(id) ?? 0) + each);
  }
  return people.map((p) => ({ participantId: p.id, amountUsd: totals.get(p.id) ?? 0 }));
}

/** Final per-person amounts, including the lucky wheel effect. */
export function computeShares(bill: Bill): Share[] {
  const shares = baseShares(bill);
  const winner = bill.luckyWinnerId;
  if (!winner || !shares.some((s) => s.participantId === winner)) return shares;

  const total = shares.reduce((sum, s) => sum + s.amountUsd, 0);

  if (bill.luckyMode === "treat") {
    return shares.map((s) =>
      s.participantId === winner
        ? { ...s, amountUsd: total, note: "Traktir semua 🎉" }
        : { ...s, amountUsd: 0, note: "Ditraktir 😻" },
    );
  }

  // "free": winner pays nothing, the rest split their part again
  const others = shares.filter((s) => s.participantId !== winner);
  if (others.length === 0) return shares;
  const winnerShare = shares.find((s) => s.participantId === winner)!.amountUsd;
  const extra = winnerShare / others.length;
  return shares.map((s) =>
    s.participantId === winner
      ? { ...s, amountUsd: 0, note: "Gratis! 🍀" }
      : { ...s, amountUsd: s.amountUsd + extra, note: "Nambah dikit 😅" },
  );
}

export function shareFor(bill: Bill, participantId: string): number {
  return computeShares(bill).find((s) => s.participantId === participantId)?.amountUsd ?? 0;
}

export function billTotal(bill: Bill): number {
  return computeShares(bill).reduce((sum, s) => sum + s.amountUsd, 0);
}

export function isSettled(bill: Bill): boolean {
  const shares = computeShares(bill);
  if (bill.participants.length === 0) return false;
  return bill.participants.every((p) => {
    const amount = shares.find((s) => s.participantId === p.id)?.amountUsd ?? 0;
    return amount <= 0.0001 || Boolean(p.paidAt);
  });
}

export function usdToNim(usd: number, usdPerNim: number): number {
  if (!usdPerNim || usdPerNim <= 0) return 0;
  return usd / usdPerNim;
}

export function formatUsd(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(Number.isFinite(value) ? value : 0);
}

export function formatNim(value: number): string {
  const safe = Number.isFinite(value) ? value : 0;
  return `${new Intl.NumberFormat("en-US", { maximumFractionDigits: safe < 10 ? 4 : 2 }).format(safe)} NIM`;
}
