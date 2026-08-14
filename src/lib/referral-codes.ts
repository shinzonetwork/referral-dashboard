import { customAlphabet } from "nanoid";
import { isValidEvmAddress } from "@/lib/validation/wallet";

const ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyz";
const generate = customAlphabet(ALPHABET, 8);

export function generateReferralCode(): string {
  return generate();
}

export function normalizeVanityCode(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// The 0x + 40-hex-char shape is reserved for the wallet-address-as-code
// convention (see src/lib/actions/self-serve.ts) — an admin-chosen vanity
// code can't be allowed to collide with that format, or a code could
// ambiguously resolve to someone else's wallet identity.
export function isReservedCodeFormat(code: string): boolean {
  return isValidEvmAddress(code);
}
