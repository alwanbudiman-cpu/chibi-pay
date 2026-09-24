/**
 * Nimiq integration. Everything here is browser-only and loaded lazily so it
 * never runs during server rendering.
 *
 * Security: the app only ever receives and stores a PUBLIC address.
 * Private keys stay inside the Nimiq Hub / Nimiq Pay wallet.
 */

export const NIMIQ_APP_NAME = "ChibiSplit";

/** Testnet hub — safe to play with. Swap for https://hub.nimiq.com on mainnet. */
export const HUB_URL = "https://hub.nimiq-testnet.com";

const LUNA_PER_NIM = 1e5;

export function nimToLuna(nim: number): number {
  return Math.max(1, Math.round(nim * LUNA_PER_NIM));
}

export function shortAddress(address: string): string {
  const clean = address.replace(/\s+/g, "");
  if (clean.length <= 12) return address;
  return `${clean.slice(0, 6)}…${clean.slice(-4)}`;
}

/** Opens the Nimiq Hub so the user can pick an account. Returns its address. */
export async function connectWallet(): Promise<{ address: string; label?: string }> {
  const { default: HubApi } = await import("@nimiq/hub-api");
  const hub = new HubApi(HUB_URL);
  const result = await hub.chooseAddress({ appName: NIMIQ_APP_NAME });
  return { address: result.address, label: result.label };
}

/** True when the app is running inside the Nimiq Pay mini-app host. */
export async function getMiniAppProvider() {
  try {
    const { init } = await import("@nimiq/mini-app-sdk");
    return await init({ timeout: 1200 });
  } catch {
    return null;
  }
}

export interface PayResult {
  hash: string;
  via: "nimiq-pay" | "hub-checkout";
}

/**
 * Pays `nim` to `recipient`. Uses the Nimiq Pay mini-app checkout when
 * available, otherwise falls back to the Nimiq Hub checkout popup.
 */
export async function payNim(options: {
  recipient: string;
  nim: number;
  message?: string;
}): Promise<PayResult> {
  const value = nimToLuna(options.nim);
  const recipient = options.recipient.replace(/\s+/g, "");

  const provider = await getMiniAppProvider();
  if (provider) {
    const res = await provider.sendBasicTransaction({ recipient, value });
    return { hash: String(res), via: "nimiq-pay" };
  }

  const { default: HubApi } = await import("@nimiq/hub-api");
  const hub = new HubApi(HUB_URL);
  const tx = await hub.checkout({
    appName: NIMIQ_APP_NAME,
    recipient,
    value,
    ...(options.message ? { extraData: options.message } : {}),
  });
  return { hash: (tx as { hash?: string }).hash ?? "ok", via: "hub-checkout" };
}
