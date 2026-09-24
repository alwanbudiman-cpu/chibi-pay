import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Plus, Sparkles, Trash2, Wallet, Check } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Mascot, ANIMALS, ANIMAL_KEYS } from "@/components/Mascot";
import { billsStore, newId, useBill, useNimRate, useWalletAddress } from "@/lib/store";
import { computeShares, formatNim, formatUsd, usdToNim } from "@/lib/split";
import { payNim, shortAddress } from "@/lib/nimiq";
import type { AnimalKey, Bill } from "@/lib/types";

export const Route = createFileRoute("/bill/$billId")({
  head: () => ({
    meta: [
      { title: "Detail Patungan — ChibiSplit" },
      {
        name: "description",
        content:
          "Atur peserta, item, dan porsi tiap orang. Lihat jumlah dalam USD dan NIM, lalu bayar lewat Nimiq.",
      },
      { property: "og:title", content: "Detail Patungan — ChibiSplit" },
      {
        property: "og:description",
        content: "Siapa bayar berapa, dalam USD dan NIM, lengkap dengan maskot chibi.",
      },
    ],
  }),
  component: BillPage,
});

function BillPage() {
  const { billId } = Route.useParams();
  const bill = useBill(billId);
  const [rate, setRate] = useNimRate();
  const [walletAddress] = useWalletAddress();
  const [name, setName] = useState("");
  const [animal, setAnimal] = useState<AnimalKey>("cat");
  const [itemLabel, setItemLabel] = useState("");
  const [itemAmount, setItemAmount] = useState("");
  const [paying, setPaying] = useState<string | null>(null);

  if (bill === undefined) {
    return (
      <AppShell>
        <div className="chibi-card p-8 text-center font-bold">Memuat…</div>
      </AppShell>
    );
  }

  if (bill === null) {
    return (
      <AppShell>
        <div className="chibi-card flex flex-col items-center gap-3 p-8 text-center">
          <Mascot animal="frog" mood="dizzy" className="h-20 w-20" />
          <p className="font-bold">Tagihan tidak ditemukan</p>
          <Link to="/" className="chibi-chip bg-primary text-primary-foreground">
            Kembali ke beranda
          </Link>
        </div>
      </AppShell>
    );
  }

  const update = (patch: Partial<Bill>) => billsStore.save({ ...bill, ...patch });
  const shares = computeShares(bill);
  const total = shares.reduce((sum, s) => sum + s.amountUsd, 0);
  const payee = bill.payeeAddress || walletAddress || "";

  function addParticipant() {
    if (!bill) return;
    const trimmed = name.trim();
    if (!trimmed) return;
    update({
      participants: [...bill.participants, { id: newId(), name: trimmed, animal }],
    });
    setName("");
    const next = ANIMAL_KEYS[(ANIMAL_KEYS.indexOf(animal) + 1) % ANIMAL_KEYS.length];
    setAnimal(next ?? "cat");
  }

  function addItem() {
    if (!bill) return;
    const amount = Number(itemAmount);
    if (!itemLabel.trim() || !(amount > 0)) return;
    update({
      items: [
        ...bill.items,
        {
          id: newId(),
          label: itemLabel.trim(),
          amountUsd: amount,
          sharedBy: bill.participants.map((p) => p.id),
        },
      ],
    });
    setItemLabel("");
    setItemAmount("");
  }

  function toggleEater(itemId: string, participantId: string) {
    if (!bill) return;
    update({
      items: bill.items.map((item) =>
        item.id !== itemId
          ? item
          : {
              ...item,
              sharedBy: item.sharedBy.includes(participantId)
                ? item.sharedBy.filter((id) => id !== participantId)
                : [...item.sharedBy, participantId],
            },
      ),
    });
  }

  function markPaid(participantId: string, txHash?: string) {
    if (!bill) return;
    update({
      participants: bill.participants.map((p) =>
        p.id === participantId
          ? p.paidAt && !txHash
            ? { ...p, paidAt: undefined, txHash: undefined }
            : { ...p, paidAt: new Date().toISOString(), ...(txHash ? { txHash } : {}) }
          : p,
      ),
    });
  }

  async function handlePay(participantId: string, amountUsd: number) {
    if (!payee) {
      toast.error("Isi dulu alamat penerima NIM di bawah");
      return;
    }
    setPaying(participantId);
    try {
      const result = await payNim({
        recipient: payee,
        nim: usdToNim(amountUsd, rate),
        message: bill?.title,
      });
      markPaid(participantId, result.hash);
      toast.success("Pembayaran NIM terkirim!", { description: `Lewat ${result.via}` });
    } catch {
      toast.error("Pembayaran dibatalkan atau gagal");
    } finally {
      setPaying(null);
    }
  }

  return (
    <AppShell>
      <section className="chibi-card mb-4 p-4">
        <input
          value={bill.title}
          onChange={(e) => update({ title: e.target.value })}
          className="w-full bg-transparent font-display text-2xl font-extrabold outline-none"
        />
        <div className="mt-3 flex gap-2">
          {(
            [
              { value: "even", label: "Bagi rata" },
              { value: "items", label: "Per item" },
            ] as const
          ).map((option) => (
            <button
              key={option.value}
              onClick={() => update({ mode: option.value })}
              className={`flex-1 rounded-2xl border-[3px] border-border px-3 py-2 text-sm font-bold ${
                bill.mode === option.value ? "bg-primary text-primary-foreground" : "bg-muted"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        {bill.mode === "even" && (
          <label className="mt-3 block text-sm font-bold">
            Total tagihan (USD)
            <input
              type="number"
              min="0"
              step="0.01"
              value={bill.totalUsd || ""}
              onChange={(e) => update({ totalUsd: Number(e.target.value) })}
              placeholder="0.00"
              className="mt-1 w-full rounded-2xl border-[3px] border-border bg-background px-4 py-2 font-semibold outline-none focus:ring-4 focus:ring-ring/40"
            />
          </label>
        )}

        {bill.luckyWinnerId && (
          <p className="chibi-chip mt-3 inline-flex items-center gap-1 bg-lucky text-lucky-foreground">
            <Sparkles className="h-3.5 w-3.5" />
            Roda aktif:{" "}
            {bill.participants.find((p) => p.id === bill.luckyWinnerId)?.name ?? "?"}{" "}
            {bill.luckyMode === "treat" ? "traktir semua" : "bebas bayar"}
            <button
              className="ml-1 underline"
              onClick={() => update({ luckyWinnerId: undefined, luckyMode: undefined })}
            >
              batal
            </button>
          </p>
        )}
      </section>

      {/* Peserta */}
      <section className="chibi-card mb-4 p-4">
        <h2 className="text-lg">Geng chibi</h2>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {ANIMAL_KEYS.map((key) => (
            <button
              key={key}
              onClick={() => setAnimal(key)}
              className={`rounded-2xl border-[3px] p-0.5 ${
                animal === key ? "border-primary bg-primary/20" : "border-transparent"
              }`}
              title={ANIMALS[key].label}
            >
              <Mascot animal={key} className="h-10 w-10" />
            </button>
          ))}
        </div>
        <div className="mt-2 flex gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addParticipant()}
            placeholder="Nama teman"
            className="flex-1 rounded-2xl border-[3px] border-border bg-background px-4 py-2 font-semibold outline-none focus:ring-4 focus:ring-ring/40"
          />
          <button
            onClick={addParticipant}
            className="rounded-2xl border-[3px] border-border bg-secondary px-4 font-bold text-secondary-foreground"
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>

        <ul className="mt-3 space-y-2">
          {bill.participants.map((p) => (
            <li key={p.id} className="flex items-center gap-2 rounded-2xl bg-muted/70 px-2 py-1.5">
              <Mascot animal={p.animal} mood={p.paidAt ? "sparkle" : "happy"} className="h-9 w-9" />
              <span className="flex-1 truncate font-bold">{p.name}</span>
              <button
                aria-label="Hapus peserta"
                onClick={() =>
                  update({
                    participants: bill.participants.filter((x) => x.id !== p.id),
                    items: bill.items.map((item) => ({
                      ...item,
                      sharedBy: item.sharedBy.filter((id) => id !== p.id),
                    })),
                  })
                }
                className="p-1.5 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
          {bill.participants.length === 0 && (
            <li className="text-sm text-muted-foreground">Tambahkan minimal satu teman dulu.</li>
          )}
        </ul>
      </section>

      {/* Item */}
      {bill.mode === "items" && (
        <section className="chibi-card mb-4 p-4">
          <h2 className="text-lg">Daftar item</h2>
          <div className="mt-2 flex gap-2">
            <input
              value={itemLabel}
              onChange={(e) => setItemLabel(e.target.value)}
              placeholder="Nama item"
              className="flex-1 rounded-2xl border-[3px] border-border bg-background px-4 py-2 font-semibold outline-none focus:ring-4 focus:ring-ring/40"
            />
            <input
              value={itemAmount}
              onChange={(e) => setItemAmount(e.target.value)}
              type="number"
              min="0"
              step="0.01"
              placeholder="USD"
              className="w-24 rounded-2xl border-[3px] border-border bg-background px-3 py-2 font-semibold outline-none focus:ring-4 focus:ring-ring/40"
            />
            <button
              onClick={addItem}
              className="rounded-2xl border-[3px] border-border bg-secondary px-4 font-bold text-secondary-foreground"
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>

          <ul className="mt-3 space-y-3">
            {bill.items.map((item) => (
              <li key={item.id} className="rounded-2xl bg-muted/70 p-3">
                <div className="flex items-center gap-2">
                  <span className="flex-1 truncate font-bold">{item.label}</span>
                  <span className="font-bold">{formatUsd(item.amountUsd)}</span>
                  <button
                    aria-label="Hapus item"
                    onClick={() => update({ items: bill.items.filter((x) => x.id !== item.id) })}
                    className="p-1 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {bill.participants.map((p) => {
                    const active = item.sharedBy.includes(p.id);
                    return (
                      <button
                        key={p.id}
                        onClick={() => toggleEater(item.id, p.id)}
                        className={`chibi-chip flex items-center gap-1 ${
                          active ? "bg-accent text-accent-foreground" : "bg-card text-muted-foreground"
                        }`}
                      >
                        <Mascot animal={p.animal} className="h-5 w-5" />
                        {p.name}
                      </button>
                    );
                  })}
                </div>
              </li>
            ))}
            {bill.items.length === 0 && (
              <li className="text-sm text-muted-foreground">Belum ada item.</li>
            )}
          </ul>
        </section>
      )}

      {/* Porsi & bayar */}
      <section className="chibi-card mb-4 p-4">
        <div className="flex items-baseline justify-between">
          <h2 className="text-lg">Siapa bayar berapa</h2>
          <span className="font-display font-extrabold">{formatUsd(total)}</span>
        </div>
        <p className="text-xs text-muted-foreground">
          ≈ {formatNim(usdToNim(total, rate))} total
        </p>

        <ul className="mt-3 space-y-2">
          {bill.participants.map((p) => {
            const share = shares.find((s) => s.participantId === p.id);
            const amount = share?.amountUsd ?? 0;
            const paid = Boolean(p.paidAt);
            return (
              <li key={p.id} className="flex items-center gap-2 rounded-2xl bg-muted/70 p-2">
                <Mascot
                  animal={p.animal}
                  mood={paid ? "sparkle" : amount > 0 ? "dizzy" : "lucky"}
                  className="h-11 w-11"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold">{p.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatUsd(amount)} · {formatNim(usdToNim(amount, rate))}
                    {share?.note ? ` · ${share.note}` : ""}
                  </p>
                </div>
                {paid ? (
                  <button
                    onClick={() => markPaid(p.id)}
                    className="chibi-chip bg-success text-success-foreground"
                  >
                    <Check className="mr-1 inline h-3.5 w-3.5" />
                    Lunas
                  </button>
                ) : amount <= 0 ? (
                  <span className="chibi-chip bg-lucky text-lucky-foreground">Bebas</span>
                ) : (
                  <div className="flex gap-1">
                    <button
                      onClick={() => handlePay(p.id, amount)}
                      disabled={paying === p.id}
                      className="chibi-chip flex items-center gap-1 bg-primary text-primary-foreground disabled:opacity-60"
                    >
                      <Wallet className="h-3.5 w-3.5" />
                      {paying === p.id ? "…" : "Bayar NIM"}
                    </button>
                    <button
                      onClick={() => markPaid(p.id)}
                      className="chibi-chip bg-card text-muted-foreground"
                    >
                      Tandai
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>

        <Link
          to="/wheel"
          search={{ bill: bill.id }}
          className="chibi-chip mt-3 inline-flex items-center gap-1 bg-lucky text-lucky-foreground"
        >
          <Sparkles className="h-3.5 w-3.5" /> Putar roda keberuntungan
        </Link>
      </section>

      {/* Pengaturan pembayaran */}
      <section className="chibi-card p-4">
        <h2 className="text-lg">Pengaturan NIM</h2>
        <label className="mt-2 block text-sm font-bold">
          Alamat penerima (NQ…)
          <input
            value={bill.payeeAddress ?? ""}
            onChange={(e) => update({ payeeAddress: e.target.value })}
            placeholder={walletAddress ? shortAddress(walletAddress) : "NQ.. alamat penerima"}
            className="mt-1 w-full rounded-2xl border-[3px] border-border bg-background px-4 py-2 font-mono text-xs outline-none focus:ring-4 focus:ring-ring/40"
          />
        </label>
        {walletAddress && !bill.payeeAddress && (
          <button
            onClick={() => update({ payeeAddress: walletAddress })}
            className="chibi-chip mt-2 bg-secondary text-secondary-foreground"
          >
            Pakai dompetku
          </button>
        )}
        <label className="mt-3 block text-sm font-bold">
          Kurs 1 NIM (USD)
          <input
            type="number"
            min="0"
            step="0.0001"
            value={rate}
            onChange={(e) => setRate(Number(e.target.value))}
            className="mt-1 w-full rounded-2xl border-[3px] border-border bg-background px-4 py-2 font-semibold outline-none focus:ring-4 focus:ring-ring/40"
          />
        </label>
        <p className="mt-2 text-xs text-muted-foreground">
          Pembayaran memakai jaringan uji Nimiq. Kami tidak pernah menyimpan kunci privat — hanya
          alamat publik.
        </p>
      </section>
    </AppShell>
  );
}
