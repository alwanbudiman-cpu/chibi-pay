import { useState } from "react";
import { toast } from "sonner";
import { Wallet, LogOut } from "lucide-react";
import { useWalletAddress } from "@/lib/store";
import { connectWallet, shortAddress } from "@/lib/nimiq";

export function WalletButton() {
  const [address, setAddress] = useWalletAddress();
  const [busy, setBusy] = useState(false);

  async function handleConnect() {
    setBusy(true);
    try {
      const { address: addr, label } = await connectWallet();
      setAddress(addr);
      toast.success(`Dompet tersambung${label ? `: ${label}` : ""}`, {
        description: "Hanya alamat publik yang disimpan.",
      });
    } catch {
      toast.error("Gagal menyambungkan dompet Nimiq");
    } finally {
      setBusy(false);
    }
  }

  if (address) {
    return (
      <button
        onClick={() => {
          setAddress(null);
          toast("Dompet diputus");
        }}
        className="chibi-chip flex items-center gap-1.5 bg-secondary text-secondary-foreground transition-transform hover:-translate-y-0.5"
        title={address}
      >
        <Wallet className="h-3.5 w-3.5" />
        {shortAddress(address)}
        <LogOut className="h-3.5 w-3.5 opacity-70" />
      </button>
    );
  }

  return (
    <button
      onClick={handleConnect}
      disabled={busy}
      className="chibi-chip flex items-center gap-1.5 bg-primary text-primary-foreground transition-transform hover:-translate-y-0.5 disabled:opacity-60"
    >
      <Wallet className="h-3.5 w-3.5" />
      {busy ? "Membuka…" : "Masuk Nimiq"}
    </button>
  );
}
