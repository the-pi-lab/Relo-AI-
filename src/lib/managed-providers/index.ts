import { PROVIDERS } from "./providers";
import type { ManagedProvider } from "./types";

export type { ManagedProvider };
export { REQUIRED_ENV } from "./types";

export function listProviders(): ManagedProvider[] {
  return PROVIDERS;
}

export function getProvider(id: string | null | undefined): ManagedProvider | null {
  if (!id || id === "custom") return null;
  return PROVIDERS.find((p) => p.id === id) ?? null;
}

export function providerDisplayName(id: string | null | undefined): string | null {
  if (!id) return null;
  if (id === "custom") return "Custom";
  return getProvider(id)?.name ?? id;
}
