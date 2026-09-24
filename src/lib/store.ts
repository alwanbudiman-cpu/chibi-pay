import { useCallback, useEffect, useState } from "react";
import type { Bill } from "./types";

/**
 * Single storage layer for bills. Today it is backed by the browser's
 * localStorage. Swapping this for Lovable Cloud (or any backend) later only
 * requires re-implementing the functions below — the UI stays untouched.
 */

const KEY = "chibisplit.bills.v1";
const WALLET_KEY = "chibisplit.wallet.v1";
const RATE_KEY = "chibisplit.usdPerNim.v1";

type Listener = () => void;
const listeners = new Set<Listener>();

function emit() {
  for (const l of listeners) l();
}

function read(): Bill[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Bill[]) : [];
  } catch {
    return [];
  }
}

function write(bills: Bill[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(bills));
  emit();
}

export const billsStore = {
  list(): Bill[] {
    return read().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },
  get(id: string): Bill | undefined {
    return read().find((b) => b.id === id);
  },
  save(bill: Bill) {
    const bills = read();
    const index = bills.findIndex((b) => b.id === bill.id);
    if (index >= 0) bills[index] = bill;
    else bills.push(bill);
    write(bills);
  },
  remove(id: string) {
    write(read().filter((b) => b.id !== id));
  },
  subscribe(listener: Listener) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};

export function newId(): string {
  return Math.random().toString(36).slice(2, 10);
}

/** Live list of all bills (empty during SSR, filled after hydration). */
export function useBills(): Bill[] {
  const [bills, setBills] = useState<Bill[]>([]);
  useEffect(() => {
    const sync = () => setBills(billsStore.list());
    sync();
    return billsStore.subscribe(sync);
  }, []);
  return bills;
}

/** Live single bill. `undefined` while loading, `null` when not found. */
export function useBill(id: string): Bill | null | undefined {
  const [bill, setBill] = useState<Bill | null | undefined>(undefined);
  useEffect(() => {
    const sync = () => setBill(billsStore.get(id) ?? null);
    sync();
    return billsStore.subscribe(sync);
  }, [id]);
  return bill;
}

/** Connected wallet address (public address only — never a private key). */
export function useWalletAddress() {
  const [address, setAddress] = useState<string | null>(null);
  useEffect(() => {
    setAddress(window.localStorage.getItem(WALLET_KEY));
  }, []);
  const save = useCallback((value: string | null) => {
    if (value) window.localStorage.setItem(WALLET_KEY, value);
    else window.localStorage.removeItem(WALLET_KEY);
    setAddress(value);
  }, []);
  return [address, save] as const;
}

export const DEFAULT_USD_PER_NIM = 0.0012;

/** Exchange rate: how many USD one NIM is worth. */
export function useNimRate() {
  const [rate, setRate] = useState(DEFAULT_USD_PER_NIM);
  useEffect(() => {
    const stored = Number(window.localStorage.getItem(RATE_KEY));
    if (stored > 0) setRate(stored);
  }, []);
  const save = useCallback((value: number) => {
    if (!(value > 0)) return;
    window.localStorage.setItem(RATE_KEY, String(value));
    setRate(value);
  }, []);
  return [rate, save] as const;
}
