export type AnimalKey =
  | "cat"
  | "panda"
  | "bunny"
  | "fox"
  | "penguin"
  | "bear"
  | "frog"
  | "shiba";

export type SplitMode = "even" | "items";

export type LuckyMode = "treat" | "free";

export interface Participant {
  id: string;
  name: string;
  animal: AnimalKey;
  address?: string;
  paidAt?: string;
  txHash?: string;
}

export interface BillItem {
  id: string;
  label: string;
  amountUsd: number;
  /** participant ids sharing this item */
  sharedBy: string[];
}

export interface Bill {
  id: string;
  title: string;
  createdAt: string;
  mode: SplitMode;
  totalUsd: number;
  participants: Participant[];
  items: BillItem[];
  payeeAddress?: string;
  luckyWinnerId?: string;
  luckyMode?: LuckyMode;
}

export interface Share {
  participantId: string;
  amountUsd: number;
  note?: string;
}
