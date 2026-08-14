import { z } from "zod";

const EVM_ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/;

export function isValidEvmAddress(address: string): boolean {
  return EVM_ADDRESS_REGEX.test(address);
}

// EVM addresses are case-insensitive (mixed-case is just checksum encoding),
// so we normalize to lowercase before storing/comparing. This is what makes
// self-serve lookups and self-referral checks reliable regardless of how a
// caller cased the address.
export function normalizeEvmAddress(address: string): string {
  return address.trim().toLowerCase();
}

export const evmAddressSchema = z
  .string()
  .regex(EVM_ADDRESS_REGEX, "must be an EVM-style wallet address")
  .transform(normalizeEvmAddress);
