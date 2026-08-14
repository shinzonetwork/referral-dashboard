import { z } from "zod";
import { evmAddressSchema } from "@/lib/validation/wallet";

export const ingestPayloadSchema = z.object({
  refCode: z.string().min(1),
  referredWalletAddress: evmAddressSchema,
  referredType: z.enum(["GENERATOR", "HOST", "BUILDER"]).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type IngestPayload = z.infer<typeof ingestPayloadSchema>;
